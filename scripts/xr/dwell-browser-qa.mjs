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
const output = '.cache/xr-dwell'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(30000);
const results = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.url().endsWith('.glb')) requests.push(request.url()); });
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const observe = () => page.evaluate(() => ({ ...window.dwellQa, probe: undefined, point: window.dwellQa.point }));
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
    window.dwellQa.surface = { left: left - (width - right + left) / 2, top: top - (height - bottom + top) / 2, width, height };
    return { id: 'Left', u: (point.x - window.dwellQa.surface.left) / width, v: (point.y - window.dwellQa.surface.top) / height, ratio };
  }, { point, ratio });
}
async function aimPoint(point) { await hands([], 8); const h = await at(point); await hands([h], 9); return h; }
async function aimControl(id) {
  const box = await control(id).boundingBox(); assert.ok(box);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const h = await aimPoint(point); assert.equal(await cursor.getAttribute('data-ui-control'), id);
  assert.equal(await cursor.getAttribute('data-stable'), 'true'); return { h, point, box };
}
async function dwellControl(id, screenshot) {
  const result = await aimControl(id);
  await page.waitForFunction(id => window.dwellQa.fired?.at(-1)?.target.id === id, id);
  if (screenshot) await shot(screenshot);
  return result;
}
async function glide(from, to, frames = 8) {
  for (let i = 1; i <= frames; i++) await hands([{ ...to, u: from.u + (to.u - from.u) * i / frames, v: from.v + (to.v - from.v) * i / frames }], 1);
  await hands([to], 6);
}
async function slider(id, value, screenshot) {
  const aimed = await dwellControl(id);
  assert.equal(await cursor.getAttribute('data-dwell'), 'sliderCaptured');
  const min = Number(await control(id).getAttribute('min')), max = Number(await control(id).getAttribute('max'));
  const end = await at({ x: aimed.box.x + aimed.box.width * (value - min) / (max - min), y: aimed.point.y });
  const before = (await inspect()).target;
  await glide(aimed.h, end);
  await page.waitForFunction(({ id, value }) => Number(document.querySelector('[data-xr-hand-control="' + id + '"]').value) === value, { id, value });
  assert.deepEqual((await inspect()).target, before);
  if (screenshot) await shot(screenshot);
  const exit = await at({ x: aimed.box.x + aimed.box.width * (value - min) / (max - min), y: aimed.box.y - 85 });
  await glide(end, exit); await hands([exit], 8);
  assert.notEqual(await cursor.getAttribute('data-dwell'), 'sliderCaptured');
  return aimed;
}
try {
  await page.goto(production + '/med3d/experiencia-xr/?xrDebug=1');
  await page.locator('[data-model-status="ready"]').waitFor();
  assert.equal(await page.locator('.xr-calibration-debug').count(), 0);
  assert.ok(requests.length === 1 && requests[0].endsWith('/heart.glb'));
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.getByText('Activa', { exact: true }).waitFor();
  await hands([{ id: 'Left', u: .5, v: .53, ratio: .5 }], 32);
  await page.locator('.xr-education-card').waitFor();
  pass('production build: Heart dwell/card, no debug even with query, only heart.glb');
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1&xrDebug=1');
  await page.getByRole('button', { name: 'Atlas XR', exact: true }).click();
  await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
  await page.evaluate(async () => {
    const qa = window.dwellQa = { raycasts: 0, calls: 0, raw: null, stable: null, point: null, state: 'lost', lastTime: 0 };
    // Use the exact loaded URL, including Vite's HMR timestamp; a second module instance is not an observer.
    const loaded = path => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => new URL(url).pathname === path).at(-1) ?? path;
    const { HandInteraction } = await import(loaded('/med3d/src/features/xr/handInteraction.ts'));
    const { DwellController } = await import(loaded('/med3d/src/features/xr/dwell.ts'));
    const dwellUpdate = DwellController.prototype.update;
    DwellController.prototype.update = function (...args) { const fired = dwellUpdate.apply(this, args); qa.dwell = this.snapshot; if (fired) (qa.fired ??= []).push({ ...this.snapshot, time: args[1] }); return fired; };
    const { HandStability } = await import(loaded('/med3d/src/features/xr/handStability.ts'));
    const { XrAtlasPresentation } = await import(loaded('/med3d/src/features/xr/atlas/presentation.ts'));
    const pick = XrAtlasPresentation.prototype.pick;
    XrAtlasPresentation.prototype.pick = function (...args) {
      qa.probe = point => pick.call(this, point, ...args.slice(1)); qa.raycasts++; return pick.apply(this, args);
    };
    const interaction = HandInteraction.prototype.update;
    HandInteraction.prototype.update = function (...args) {
      const mode = interaction.apply(this, args); qa.calls++;
      qa.dwell = this.dwell.snapshot; qa.raw = this.targets.raw?.selection?.id ?? null; qa.stable = this.targets.stable?.selection?.id ?? null;
      if (qa.jitter) (qa.boundaryHits ??= []).push({ raw: qa.raw, stable: qa.stable });
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
  await page.waitForFunction(() => !!window.dwellQa.probe);
  const points = await page.evaluate(() => {
    const qa = window.dwellQa, canvas = document.querySelector('.xr-atlas-page canvas'), rect = canvas.getBoundingClientRect();
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
  await page.evaluate(() => { window.dwellQa.fired = []; window.originalDwellCanvas = document.querySelector('.xr-atlas-page canvas'); });
  let h = await aimPoint(points.interior.point);
  await page.waitForFunction(() => window.dwellQa.dwell?.state === 'dwelling' && window.dwellQa.dwell.progress >= .25);
  assert.equal((await inspect()).state.selectedStructure, null); await shot('01-progreso-25');
  await page.waitForFunction(() => window.dwellQa.dwell?.progress >= .5); await shot('02-progreso-50');
  await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, points.interior.id);
  await shot('03-seleccion-confirmada');
  await hands([h], 60); assert.equal(await page.evaluate(() => window.dwellQa.fired.filter(f => f.target.domain === 'anatomy').length), 1);
  assert.deepEqual((await inspect()).target, before); await shot('04-ficha');
  pass('01–02 real bone dwell opens existing card once; 3s hold does not repeat', points.interior);
  const other = points.boundary.aId === points.interior.id ? { point: points.boundary.b, id: points.boundary.bId } : { point: points.boundary.a, id: points.boundary.aId };
  await aimPoint(other.point); await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, other.id);
  assert.equal(await page.evaluate(() => window.originalDwellCanvas === document.querySelector('.xr-atlas-page canvas')), true);
  pass('03 A → B dwell changes card without remounting canvas');
  await aimControl('skeletal-opacity'); // Another stable domain rearms the anatomical target without activating this slider.
  h = await aimPoint(points.boundary.a);
  await page.evaluate(({ boundary, h }) => {
    const qa = window.dwellQa; let frame = 0; qa.jitter = true; qa.boundaryHits = [];
    window.handQa.done = false;
    window.handQa.sample = time => {
      const desired = frame++ % 3 === 0 ? boundary.b : boundary.a, s = qa.surface;
      const goal = { x: (desired.x - s.left) / s.width, y: (desired.y - s.top) / s.height };
      const previous = { x: (qa.point.x - s.left) / s.width, y: (qa.point.y - s.top) / s.height }, dt = time - qa.lastTime;
      let lo = 1, hi = 8;
      for (let i = 0; i < 30; i++) {
        const factor = (lo + hi) / 2, raw = { x: previous.x + (goal.x - previous.x) * factor, y: previous.y + (goal.y - previous.y) * factor };
        const velocity = Math.hypot(raw.x - qa.rawPointer.x, raw.y - qa.rawPointer.y) / (dt / 1000);
        const tau = 110 - 65 * Math.max(0, Math.min(1, (velocity - .15) / 1.05));
        if (factor * (1 - Math.exp(-dt / tau)) < 1) lo = factor; else hi = factor;
      }
      if (frame > 40) { qa.jitter = false; window.handQa.sample = null; window.handQa.done = true; return window.handQa.hands = [h]; }
      return [{ ...h, u: previous.x + (goal.x - previous.x) * (lo + hi) / 2, v: previous.y + (goal.y - previous.y) * (lo + hi) / 2, ratio: .5 }];
    };
  }, { boundary: points.boundary, h });
  await page.waitForFunction(() => window.handQa.done);
  assert.equal((await inspect()).state.selectedStructure, points.boundary.aId);
  assert.ok(await page.evaluate(b => window.dwellQa.boundaryHits.some(h => h.raw === b.bId && h.stable === b.aId), points.boundary));
  pass('real adjacent-mesh jitter changes raw hits while stable A completes dwell');
  await dwellControl('close-card'); await page.waitForFunction(() => !window.__med3dXrAtlas().state.selectedStructure);
  const raycasts = (await observe()).raycasts;
  const muscle = await dwellControl('muscular-toggle', '05-toggle-dwell');
  await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 387); await hands([muscle.h], 60);
  assert.equal((await inspect()).state.systemVisibility.muscular, true); assert.equal(glbs().length, 25);
  assert.equal((await observe()).raycasts, raycasts, 'UI dwell performs zero anatomy queries');
  await dwellControl('cardiovascular-toggle'); await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 549);
  assert.equal(glbs().length, 32); assert.equal((await inspect()).state.systemVisibility.cardiovascular, true);
  pass('04–05 toggles fire once; UI blocks anatomy; network 7 → 25 → 32');
  // Re-enter toggles after a different stable target, using the same registered native input.
  await dwellControl('muscular-toggle'); assert.equal((await inspect()).state.systemVisibility.muscular, false);
  await dwellControl('cardiovascular-toggle'); assert.equal((await inspect()).state.systemVisibility.cardiovascular, false);
  await aimPoint(points.interior.point); await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, points.interior.id);
  await dwellControl('isolate'); assert.equal((await inspect()).state.isolatedStructure, points.interior.id);
  pass('06 Isolate uses existing Atlas state');
  await dwellControl('hide'); assert.ok((await inspect()).state.hiddenStructures.includes(points.interior.id));
  pass('07 Hide uses existing visibility and clears card');
  if ((await inspect()).state.isolatedStructure) await dwellControl('exit-isolation');
  await dwellControl('restore-hidden'); assert.equal((await inspect()).state.hiddenStructures.length, 0);
  pass('08 Restore structures by dwell');
  await dwellControl('muscular-toggle'); await slider('muscular-opacity', 35, '06-slider-captured');
  assert.ok((await inspect()).parts.filter(p => p.system === 'muscular').every(p => p.opacity === .35));
  pass('09 Opacity capture uses real input min=10/max=100 and existing materials');
  await slider('explosion', 60, '07-despiece'); assert.equal((await inspect()).state.explodedAmount, .6);
  assert.ok((await inspect()).parts.some(p => p.offset.some(n => n !== 0)));
  pass('10–11 Despiece updates existing offsets; vertical departure releases slider');
  await dwellControl('reset-view'); assert.equal((await inspect()).state.explodedAmount, 0);
  await dwellControl('restore-atlas'); assert.equal((await inspect()).state.systemVisibility.muscular, false);
  // Pause near completion: missing samples never advance or execute the dwell.
  h = await aimPoint(points.interior.point);
  await page.waitForFunction(() => window.dwellQa.dwell?.state === 'dwelling' && window.dwellQa.dwell.progress >= .4);
  const preLoss = await observe();
  await hands([], 2); assert.equal(await cursor.getAttribute('data-tracking'), 'grace');
  assert.equal(await cursor.getAttribute('data-dwell'), 'paused'); assert.equal((await inspect()).state.selectedStructure, null);
  await shot('08-tracking-grace');
  await hands([h], 4); assert.equal((await inspect()).state.selectedStructure, null);
  await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, points.interior.id);
  pass('12–13 short loss pauses without actions; same target waits through reacquisition', { elapsedBeforeLoss: preLoss.dwell.elapsedMs });
  await dwellControl('close-card');
  h = await aimPoint(points.interior.point);
  await hands([{ ...h, ratio: .2 }], 2);
  await glide({ ...h, ratio: .2 }, { ...h, u: h.u + .065, v: h.v + .025, ratio: .2 });
  assert.equal((await inspect()).state.selectedStructure, null); assert.ok((await inspect()).target.rotationY !== before.rotationY);
  await hands([{ ...h, u: h.u + .065, v: h.v + .025, ratio: .5 }], 2);
  pass('14 pinch moves model without selecting or opening card');
  const left = { ...h, u: h.u + .065, v: h.v + .025, ratio: .2 }, right = { ...left, id: 'Right', u: left.u + .2 };
  await hands([left, right], 3); const scale = (await inspect()).target.scale;
  for (let i = 1; i <= 5; i++) await hands([{ ...left, u: left.u - i * .012 }, { ...right, u: right.u + i * .012 }], 1);
  assert.ok((await inspect()).target.scale > scale); assert.ok((await inspect()).target.scale <= 1.8);
  assert.equal((await inspect()).state.selectedStructure, null); await hands([], 8);
  pass('15 two pinches still scale within existing limits');
  // Existing manual selection and pointer controls remain immediate.
  await control('reset-view').click(); await page.waitForTimeout(400);
  await page.mouse.click(points.interior.point.x, points.interior.point.y);
  await page.waitForFunction(() => !!window.__med3dXrAtlas().state.selectedStructure);
  await page.keyboard.press('Escape'); await page.touchscreen.tap(points.interior.point.x, points.interior.point.y);
  await page.waitForFunction(() => !!window.__med3dXrAtlas().state.selectedStructure);
  await page.keyboard.press('Escape');
  const manualBefore = (await inspect()).target;
  await page.mouse.move(points.interior.point.x, points.interior.point.y); await page.mouse.down();
  await page.mouse.move(points.interior.point.x + 40, points.interior.point.y + 15, { steps: 5 }); await page.mouse.up();
  assert.notDeepEqual((await inspect()).target, manualBefore); assert.equal((await inspect()).state.selectedStructure, null);
  await page.mouse.wheel(0, -100); await page.waitForTimeout(100);
  await page.locator('.xr-atlas-page .xr-viewport').focus(); await page.keyboard.press('ArrowRight');
  pass('manual click/tap selects; drag, wheel, keyboard and Escape retain priority');
  assert.equal(await page.locator('.xr-calibration-debug dd').count(), 11);
  assert.ok(glbs().every(url => /models\/anatomy\/(skeletal|muscular|cardiovascular)\//.test(url)));
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
  // Switch mode: stream/cursor cleaned; fresh Heart scene uses its own real GLB and card.
  const stops = await page.evaluate(() => window.handQa.stops), requestStart = requests.length;
  await page.getByRole('button', { name: 'Corazón', exact: true }).click();
  await page.locator('[data-model-status="ready"]').waitFor();
  assert.ok(await page.evaluate(() => window.handQa.stops) > stops);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  const heart = page.locator('.xr-scene canvas'), heartCursor = page.locator('.xr-hand-cursor');
  const heartHand = { id: 'Left', u: .5, v: .53, ratio: .5 };
  await hands([heartHand], 32); await page.locator('.xr-education-card').waitFor();
  const heartTitle = await page.locator('#xr-education-title').textContent(); assert.ok(heartTitle);
  await shot('09-heart-dwell');
  await hands([{ ...heartHand, ratio: .2 }], 2); await hands([{ ...heartHand, u: .57, ratio: .2 }], 4);
  await hands([{ ...heartHand, u: .57 }], 2); assert.equal(await page.locator('#xr-education-title').textContent(), heartTitle);
  assert.ok(requests.slice(requestStart).filter(url => url.endsWith('.glb')).every(url => url.endsWith('/heart.glb')));
  pass('16 Heart dwell uses real structure and existing card; pinch only manipulates', { structure: heartTitle });
  await hands([], 8); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click();
  await page.setViewportSize({ width: 390, height: 844 }); await heart.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  await hands([{ ...heartHand, u: .08, v: .2 }], 16); await hands([heartHand], 36);
  await page.locator('.xr-education-card').waitFor(); await shot('10-mobile');
  assert.ok((await page.locator('.xr-education-card').boundingBox()).height <= 844 * .44 + 1);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => { window.handQa.frozen = true; }); await page.waitForTimeout(500);
  assert.equal(await heartCursor.isVisible(), false);
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  assert.equal(await heartCursor.isVisible(), false);
  pass('mobile bottom sheet, stalled inference and camera cleanup');
  assert.deepEqual(errors, []);
  await writeFile(output + '/browser-results.json', JSON.stringify({ synthetic: true, results, glbs: glbs(), errors }, null, 2));
} catch (error) {
  await writeFile(output + '/failure-state.json', JSON.stringify({ error: String(error), errors, observed: await observe().catch(() => null), atlas: await inspect().then(v => ({ state: v.state, target: v.target })).catch(() => null) }, null, 2));
  await shot('failure').catch(() => {}); throw error;
} finally { await browser.close(); }
