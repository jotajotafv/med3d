// Real DOM, GLBs, raycasts and application controllers. Only camera/landmarks are synthetic.
// Development instrumentation observes production class methods; it never changes their results.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_DEV_ORIGIN || 'http://127.0.0.1:5173';
const production = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const output = '.cache/xr-stability'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(30000);
const results = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.url().endsWith('.glb')) requests.push(request.url()); });
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const observe = () => page.evaluate(() => ({ ...window.stabilityQa, probe: undefined, point: window.stabilityQa.point }));
const cursor = page.locator('.xr-atlas-page>.xr-hand-cursor');
const control = id => page.locator(`[data-xr-hand-control="${id}"]`);
const shot = name => page.screenshot({ path: `${output}/${name}.png` });
const pass = (test, evidence = {}) => { results.push({ test, ...evidence }); console.log(test); };
async function hands(value, frames = 3) {
  const start = await page.evaluate(value => { window.handQa.sample = null; window.handQa.hands = value; return window.handQa.frames; }, value);
  await page.waitForFunction(({ start, frames }) => window.handQa.frames >= start + frames, { start, frames });
}
async function at(point, ratio = .5) {
  return page.evaluate(({ point, ratio }) => {
    const w = document.querySelector('.xr-atlas-workspace').getBoundingClientRect(), c = document.querySelector('.xr-atlas-card')?.getBoundingClientRect() ?? w;
    const left = Math.max(0, Math.min(w.left, c.left)), top = Math.max(0, Math.min(w.top, c.top));
    const right = Math.min(innerWidth, Math.max(w.right, c.right)), bottom = Math.min(innerHeight, Math.max(w.bottom, c.bottom));
    const width = Math.max(right - left, (bottom - top) * 4 / 3), height = width / (4 / 3);
    window.stabilityQa.surface = { left: left - (width - right + left) / 2, top: top - (height - bottom + top) / 2, width, height };
    return { id: 'Left', u: (point.x - window.stabilityQa.surface.left) / width, v: (point.y - window.stabilityQa.surface.top) / height, ratio };
  }, { point, ratio });
}
async function aimPoint(point) { await hands([], 8); const h = await at(point); await hands([h], 12); return h; }
async function aimControl(id) {
  const box = await control(id).boundingBox(); assert.ok(box);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const h = await aimPoint(point); assert.equal(await cursor.getAttribute('data-ui-control'), id);
  assert.equal(await cursor.getAttribute('data-stable'), 'true'); return { h, point, box };
}
async function jitter(h, count = 12, pinch = false) {
  await page.evaluate(({ h, count, pinch }) => {
    let n = 0; window.handQa.done = false;
    window.handQa.sample = () => {
      if (n++ >= count) { window.handQa.done = true; window.handQa.sample = null; return window.handQa.hands = [h]; }
      return [{ ...h, u: h.u + Math.sin(n * 1.7) * .0025, v: h.v + Math.cos(n * 2.3) * .003,
        ratio: pinch ? .33 + (n > 1 ? .025 : 0) : .5 }];
    };
  }, { h, count, pinch });
  await page.waitForFunction(() => window.handQa.done);
}
try {
  await page.goto(production + '/med3d/experiencia-xr/?xrDebug=1');
  await page.locator('[data-model-status="ready"]').waitFor(); assert.equal(await page.locator('.xr-calibration-debug').count(), 0);
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1&xrDebug=1');
  await page.getByRole('button', { name: 'Atlas XR', exact: true }).click();
  await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
  await page.evaluate(async () => {
    const qa = window.stabilityQa = { raycasts: 0, calls: 0, raw: null, stable: null, point: null, state: 'lost', lastTime: 0, onset: null };
    // Use the exact loaded URL, including Vite's HMR timestamp; a second module instance is not an observer.
    const loaded = path => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => new URL(url).pathname === path).at(-1) ?? path;
    const { HandInteraction } = await import(loaded('/med3d/src/features/xr/handInteraction.ts'));
    const { HandStability } = await import(loaded('/med3d/src/features/xr/handStability.ts'));
    const { XrAtlasPresentation } = await import(loaded('/med3d/src/features/xr/atlas/presentation.ts'));
    const pick = XrAtlasPresentation.prototype.pick;
    XrAtlasPresentation.prototype.pick = function (...args) {
      qa.probe = point => pick.call(this, point, ...args.slice(1)); qa.raycasts++; return pick.apply(this, args);
    };
    const interaction = HandInteraction.prototype.update;
    HandInteraction.prototype.update = function (...args) {
      const mode = interaction.apply(this, args); qa.calls++;
      qa.raw = this.targets.raw?.selection?.id ?? null; qa.stable = this.targets.stable?.selection?.id ?? null;
      if (qa.captureOnset && mode === 'candidate') { qa.onset = { raw: qa.raw, stable: qa.stable }; qa.captureOnset = false; }
      return mode;
    };
    const update = HandStability.prototype.update;
    HandStability.prototype.update = function (...args) {
      const mode = update.apply(this, args); qa.state = this.trackingState; qa.point = this.point; qa.rawPointer = this.lastReliablePointer; qa.lastTime = args[1]; return mode;
    };
  });
  const glbs = () => requests.filter(url => url.includes('/models/anatomy/'));
  assert.equal(glbs().length, 7);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.getByText('Activa', { exact: true }).waitFor(); await hands([{ id: 'Left', u: .5, v: .5, ratio: .5 }], 16);
  await page.waitForFunction(() => !!window.stabilityQa.probe);
  const points = await page.evaluate(() => {
    const qa = window.stabilityQa, canvas = document.querySelector('.xr-atlas-page canvas'), rect = canvas.getBoundingClientRect();
    const parts = window.__med3dXrAtlas().parts.filter(p => p.visible).sort((a, b) => Number(/Fémur/i.test(b.name)) - Number(/Fémur/i.test(a.name)));
    let interior = null, boundary = null;
    for (const part of parts) for (const [x, y, z] of part.screenSamples) {
      const p = { x: rect.left + (x + 1) * rect.width / 2, y: rect.top + (1 - y) * rect.height / 2 };
      if (Math.abs(z) > 1 || p.y < 100 || p.y > 900 || document.elementFromPoint(p.x, p.y) !== canvas) continue;
      const hit = qa.probe(p); if (hit.kind !== 'selected') continue;
      const neighbors = [[-5, 0], [5, 0], [0, -5], [0, 5]];
      if (!interior && neighbors.every(([dx, dy]) => qa.probe({ x: p.x + dx, y: p.y + dy }).selection?.id === hit.selection.id)) interior = { point: p, id: hit.selection.id, name: hit.selection.node.name };
      if (!boundary) for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-4, 0], [4, 0]]) {
        const other = { x: p.x + dx, y: p.y + dy }, next = qa.probe(other);
        if (next.kind === 'selected' && next.selection.id !== hit.selection.id) { boundary = { a: p, b: other, aId: hit.selection.id, bId: next.selection.id }; break; }
      }
      if (interior && boundary) return { interior, boundary };
    }
    return { interior, boundary };
  });
  assert.ok(points.interior && points.boundary, 'real adjacent anatomical surfaces and a safe interior');
  const before = (await inspect()).target;
  let h = await aimPoint(points.interior.point);
  assert.equal((await observe()).stable, points.interior.id); await shot('01-cursor-estable-hueso');
  await jitter(h); assert.equal((await observe()).stable, points.interior.id); assert.deepEqual((await inspect()).target, before); await shot('02-jitter-hueso');
  await jitter(h, 6, true); await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, points.interior.id);
  assert.equal((await inspect()).state.selectedStructure, points.interior.id); await shot('03-pinch-hueso');
  pass('01–03 stable bone + realistic jitter + pinch selects once with unchanged pose', points.interior);
  // Generate one filtered endpoint on the neighboring real mesh, exactly at pinch onset.
  // Inverse EMA only prepares synthetic landmarks; application filtering/picking run normally.
  h = await aimPoint(points.boundary.a); assert.equal((await observe()).stable, points.boundary.aId);
  await page.evaluate(({ boundary, h }) => {
    const qa = window.stabilityQa; let frame = 0; qa.captureOnset = true;
    window.handQa.done = false;
    window.handQa.sample = time => {
      const desired = frame++ === 0 ? boundary.b : boundary.a, s = qa.surface;
      const goal = { x: (desired.x - s.left) / s.width, y: (desired.y - s.top) / s.height };
      const previous = { x: (qa.point.x - s.left) / s.width, y: (qa.point.y - s.top) / s.height }, dt = time - qa.lastTime;
      let lo = 1, hi = 8;
      for (let i = 0; i < 30; i++) {
        const factor = (lo + hi) / 2, raw = { x: previous.x + (goal.x - previous.x) * factor, y: previous.y + (goal.y - previous.y) * factor };
        const velocity = Math.hypot(raw.x - qa.rawPointer.x, raw.y - qa.rawPointer.y) / (dt / 1000);
        const tau = 110 - 65 * Math.max(0, Math.min(1, (velocity - .15) / 1.05));
        if (factor * (1 - Math.exp(-dt / tau)) < 1) lo = factor; else hi = factor;
      }
      if (frame > 5) { window.handQa.sample = null; window.handQa.done = true; return window.handQa.hands = [h]; }
      return [{ ...h, u: previous.x + (goal.x - previous.x) * (lo + hi) / 2, v: previous.y + (goal.y - previous.y) * (lo + hi) / 2, ratio: .33 }];
    };
  }, { boundary: points.boundary, h });
  await page.waitForFunction(() => window.handQa.done);
  await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, points.boundary.aId);
  const onset = (await observe()).onset;
  assert.deepEqual(onset, { raw: points.boundary.bId, stable: points.boundary.aId });
  assert.equal((await inspect()).state.selectedStructure, points.boundary.aId); assert.deepEqual((await inspect()).target, before);
  await shot('04-jitter-entre-estructuras'); pass('04 one-frame raw B at pinch selects stable A on real GLBs', onset);
  const { heldPoint, queryCount, selectedBeforeLoss, lossTime } = await page.evaluate(() => {
    window.handQa.sample = null; window.handQa.hands = [];
    return { heldPoint: document.querySelector('.xr-hand-cursor').getAttribute('style'), queryCount: window.stabilityQa.raycasts,
      selectedBeforeLoss: window.__med3dXrAtlas().state.selectedStructure, lossTime: window.stabilityQa.lastTime };
  });
  await page.waitForFunction(time => window.stabilityQa.lastTime - time >= 200, lossTime);
  const observedLossMs = (await observe()).lastTime - lossTime;
  assert.equal(await cursor.getAttribute('data-tracking'), 'grace'); assert.equal(await cursor.isVisible(), true);
  assert.equal(await cursor.getAttribute('style'), heldPoint); assert.equal((await observe()).raycasts, queryCount); await shot('05-perdida-breve');
  await hands([h], 12); assert.equal(await cursor.getAttribute('data-tracking'), 'tracking'); assert.equal((await inspect()).state.selectedStructure, selectedBeforeLoss);
  await shot('06-reacquire');
  await hands([], 8); assert.equal(await cursor.isVisible(), false); await hands([{ ...h, ratio: .33 }], 6);
  assert.equal(await cursor.isVisible(), false); assert.equal((await inspect()).state.selectedStructure, selectedBeforeLoss);
  await hands([h], 12); pass('05–06 short loss is visual only; long loss/closed return cannot act; open hand safely reacquires', { observedLossMs });
  await control('close-card').click(); await page.waitForFunction(() => window.__med3dXrAtlas().state.selectedStructure === null);
  const muscular = await aimControl('muscular-toggle');
  const label = await control('muscular-toggle').evaluate(e => { const r = e.closest('label').getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; });
  // Actual pointer just outside the label: +6px in the permitted gesture-only margin.
  const slopHand = await at({ x: label.x + label.width + 6, y: label.y + label.height / 2 });
  await hands([slopHand], 8); assert.equal(await cursor.getAttribute('data-ui-control'), 'muscular-toggle');
  await page.evaluate(() => { window.muscleActivations = 0; document.querySelector('[data-xr-hand-control="muscular-toggle"]').addEventListener('click', () => window.muscleActivations++); });
  await jitter(slopHand, 5, true);
  await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 387);
  assert.equal(await page.evaluate(() => window.muscleActivations), 1); assert.equal((await inspect()).state.systemVisibility.muscular, true);
  assert.deepEqual((await inspect()).target, before); assert.equal((await inspect()).state.selectedStructure, null); assert.equal(glbs().length, 25);
  await shot('07-muscular-jitter'); pass('07 Muscular hit slop tolerates 4–8px error, exactly one toggle, no anatomy or rotation');
  const slider = await aimControl('muscular-opacity'); await hands([{ ...slider.h, ratio: .33 }], 3);
  await jitter({ ...slider.h, ratio: .33 }, 15, true); // Return remains closed; slider keeps capture.
  assert.ok(Math.abs(Number(await control('muscular-opacity').inputValue()) - 55) <= 2);
  const opacity = (await inspect()).state.systemOpacity.muscular;
  await hands([], 3); assert.equal((await inspect()).state.systemOpacity.muscular, opacity);
  await hands([{ ...slider.h, ratio: .33 }], 3); assert.equal((await inspect()).state.systemOpacity.muscular, opacity);
  await hands([slider.h], 12); await shot('08-slider-jitter'); pass('08 slider follows filtered position; loss cancels capture and grace changes no value');
  h = await aimPoint(points.interior.point); const preOutlier = await cursor.getAttribute('style');
  await hands([{ ...h, u: h.u < .5 ? .95 : .05, v: .1 }], 1);
  assert.equal(await cursor.getAttribute('data-tracking'), 'grace'); assert.equal(await cursor.getAttribute('style'), preOutlier);
  await shot('09-outlier'); await hands([h], 12); pass('09 huge outlier does not teleport and safely reacquires');
  const staleSelection = (await inspect()).state.selectedStructure;
  await page.evaluate(() => { window.handQa.timestamp = 0; });
  await page.waitForTimeout(500); assert.equal(await cursor.isVisible(), false);
  assert.equal((await inspect()).state.selectedStructure, staleSelection);
  await page.evaluate(() => { delete window.handQa.timestamp; }); await hands([h], 12);
  pass('duplicate timestamps cannot keep the watchdog alive or execute actions');
  const primaryPoint = await cursor.getAttribute('style');
  await hands([{ ...h, id: 'Right' }, { id: 'Left', u: .9, v: .5, ratio: .5 }], 6);
  assert.equal(await cursor.getAttribute('style'), primaryPoint);
  await hands([{ id: 'Left', u: .9, v: .5, ratio: .5 }], 3);
  assert.equal(await cursor.getAttribute('data-tracking'), 'grace'); assert.equal(await cursor.getAttribute('style'), primaryPoint);
  await hands([h], 12); await shot('10-segunda-mano'); pass('10 label flip + secondary arrival/disappearance preserve primary; grace cannot switch hands');
  await aimControl('cardiovascular-toggle'); await shot('11-anatomia-a-ui');
  const cardHand = (await aimControl('cardiovascular-toggle')).h; await hands([{ ...cardHand, ratio: .33 }], 3); await hands([cardHand], 3);
  await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 549); assert.equal(glbs().length, 32);
  await aimPoint(points.interior.point); assert.equal(await cursor.getAttribute('data-ui-control'), ''); await shot('12-ui-a-anatomia');
  pass('11–12 UI/anatomy targets remain separate; network progresses 7 → 25 → 32 with no other systems');
  // DOM-level tests of the actual registry, including coverage and overlapping margins.
  await hands([], 8);
  const dom = await page.evaluate(async () => {
    const { HandUiRegistry } = await import('/med3d/src/features/xr/ui/HandUiRegistry.ts');
    const root = document.createElement('section'); root.style.cssText = 'position:fixed;left:350px;top:150px;width:400px;height:240px;z-index:9999;background:black';
    root.innerHTML = '<div data-xr-ui style="position:absolute;inset:0"><button data-xr-hand-control="a" style="position:absolute;left:30px;top:40px;width:100px;height:40px">A</button><button data-xr-hand-control="b" style="position:absolute;left:144px;top:40px;width:100px;height:40px">B</button></div>';
    document.body.append(root); const registry = new HandUiRegistry(() => {}); registry.mount(root);
    const a = root.querySelector('button'), b = root.querySelectorAll('button')[1], r = a.getBoundingClientRect();
    const middle = { x: r.right + 7, y: r.top + 20 };
    const overlap = registry.hitTest(middle).target?.id;
    const nearA = registry.hitTest({ ...middle, x: r.right + 4 }).target?.id;
    a.style.zIndex = '2'; const topmost = registry.hitTest(middle).target?.id;
    const overlay = document.createElement('div'); overlay.style.cssText = 'position:absolute;left:20px;top:30px;width:125px;height:65px;z-index:50'; root.append(overlay);
    const covered = registry.hitTest(middle).target?.id ?? null;
    overlay.remove(); a.hidden = true; const hidden = registry.hitTest({ x: r.left + 20, y: r.top + 20 }).target?.id ?? null;
    const directB = registry.hitTest({ x: b.getBoundingClientRect().left + 1, y: middle.y }).target?.id;
    const outside = registry.hitTest({ x: 10, y: 10 }).target?.id ?? null;
    registry.dispose(); root.remove(); return { overlap, nearA, topmost, covered, hidden, directB, outside };
  });
  assert.deepEqual(dom, { overlap: 'b', nearA: 'a', topmost: 'a', covered: null, hidden: null, directB: 'b', outside: null });
  pass('DOM slop: nearest rectangle + visual priority + deterministic tie; covered/hidden/header rejected; direct control wins', dom);
  assert.equal(await page.locator('.xr-calibration-debug dd').count(), 7);
  assert.ok(glbs().every(url => /models\/anatomy\/(skeletal|muscular|cardiovascular)\//.test(url)));
  assert.deepEqual(errors, []);
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ synthetic: true, results, glbs: glbs(), errors }, null, 2));
} catch (error) {
  await writeFile(`${output}/failure-state.json`, JSON.stringify({ error: String(error), errors,
    observed: await observe().catch(() => null), atlas: await inspect().then(value => ({ state: value.state, target: value.target })).catch(() => null) }, null, 2));
  await shot('failure').catch(() => {}); throw error;
}
finally { await browser.close(); }
