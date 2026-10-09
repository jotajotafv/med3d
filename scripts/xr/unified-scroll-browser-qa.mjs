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
const output = '.cache/xr-unified-scroll'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'], ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(30000);
const results = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.url().endsWith('.glb') || /models\/anatomy\/.*catalog\.json$/.test(request.url())) requests.push(request.url()); });
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const observe = () => page.evaluate(() => ({ capture: window.dwellQa.readCapture?.(), dwell: window.dwellQa.dwell, raycasts: window.dwellQa.raycasts, point: window.dwellQa.point }));
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
  await control(id).evaluate(el => el.scrollIntoView({ block: 'nearest' }));
  const box = await control(id).boundingBox(); assert.ok(box);
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const h = await aimPoint(point); assert.equal(await cursor.getAttribute('data-ui-control'), id);
  assert.equal(await cursor.getAttribute('data-stable'), 'true'); return { h, point, box };
}
async function dwellControl(id, screenshot) {
  await page.evaluate(() => { window.dwellQa.fired = []; });
  const result = await aimControl(id);
  await page.waitForFunction(id => window.dwellQa.fired?.at(-1)?.target.id === id, id);
  if (screenshot) await shot(screenshot);
  return result;
}
async function glide(from, to, frames = 8) {
  for (let i = 1; i <= frames; i++) await hands([{ ...to, u: from.u + (to.u - from.u) * i / frames, v: from.v + (to.v - from.v) * i / frames }], 1);
  await hands([to], 6);
}

try {
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1');
  await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
  await page.evaluate(async () => {
    const qa = window.dwellQa = { raycasts: 0, calls: 0, raw: null, stable: null, point: null, state: 'lost', lastTime: 0 };
    // Use the exact loaded URL, including Vite's HMR timestamp; a second module instance is not an observer.
    const loaded = path => performance.getEntriesByType('resource').map(entry => entry.name).filter(url => new URL(url).pathname === path).at(-1) ?? path;
    const { HandUiRouter } = await import(loaded('/med3d/src/features/xr/ui/handUiRouter.ts'));
    const routerUpdate = HandUiRouter.prototype.update;
    HandUiRouter.prototype.update = function (...args) {
      const mode = routerUpdate.apply(this, args);
      qa.readCapture = () => { const c = this.scroll.capture; return c ? { id: c.id, startPointerY: c.startPointerY, startScrollTop: c.startScrollTop, paused: c.paused } : null; };
      qa.dwell = this.dwell.snapshot; return mode;
    };
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


  assert.equal(await page.locator('.xr-mode-switch').count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Atlas XR', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Corazón', exact: true }).count(), 0);
  assert.equal(await page.locator('.xr-atlas-layer input[type=checkbox]').count(), 11);
  assert.deepEqual(Object.entries((await inspect()).state.systemVisibility).filter(([, on]) => on).map(([id]) => id), ['skeletal']);
  assert.equal(requests.filter(url => url.endsWith('.glb')).length, 7);
  assert.ok(requests.every(url => !url.endsWith('/models/heart.glb')));
  await shot('01-unified-entry'); pass('direct Atlas route, eleven systems, only skeletal requested, no selector or Heart download');
  async function surface(except) {
    await page.locator('.xr-atlas-page .xr-viewport').scrollIntoViewIfNeeded();
    const box = await page.locator('.xr-atlas-page canvas').boundingBox();
    await page.mouse.click(box.x + 10, box.y + 100);
    return page.evaluate(except => {
      const canvas = document.querySelector('.xr-atlas-page canvas'), rect = canvas.getBoundingClientRect();
      for (const part of window.__med3dXrAtlas().parts.filter(p => p.visible && p.id !== except)) for (const [x, y, z] of part.screenSamples) {
        const p = { x: rect.left + (x + 1) * rect.width / 2, y: rect.top + (1 - y) * rect.height / 2 };
        if (Math.abs(z) > 1 || document.elementFromPoint(p.x, p.y) !== canvas) continue;
        const hit = window.dwellQa.probe(p);
        if (hit.kind === 'selected' && hit.selection.id !== except) return { point: p, id: hit.selection.id, name: hit.selection.node.name };
      }
    }, except);
  }
  let chosen = await surface(); assert.ok(chosen);
  await page.mouse.click(chosen.point.x, chosen.point.y); await page.locator('.xr-atlas-card').waitFor();
  const region = control('education-scroll');
  const scrollState = () => region.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight, height: el.clientHeight, focused: el === document.activeElement }));
  const capture = () => page.evaluate(() => window.dwellQa.readCapture?.());
  const originalCanvas = await page.evaluate(() => { window.scrollCanvas = document.querySelector('canvas'); return window.__med3dXrAtlas().sceneId; });
  assert.ok((await scrollState()).max > 100);
  await region.focus(); await page.keyboard.press('End'); await page.waitForTimeout(400);
  assert.ok((await scrollState()).top >= (await scrollState()).max - 1);
  await page.keyboard.press('Home'); await page.waitForTimeout(400); assert.equal((await scrollState()).top, 0);
  await page.keyboard.press('PageDown'); await page.waitForTimeout(400); assert.ok((await scrollState()).top > 0);
  await page.keyboard.press('PageUp'); await page.waitForTimeout(400); assert.equal((await scrollState()).top, 0);
  await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300); assert.ok((await scrollState()).top > 0);
  await page.keyboard.press('Home'); await page.waitForTimeout(300);
  let box = await region.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.wheel(0, 220); await page.waitForTimeout(300);
  assert.ok((await scrollState()).top > 100); await shot('02-native-scroll');
  await region.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(350);
  const bar = await region.evaluate(el => { const r = el.getBoundingClientRect(); return { right: r.right, top: r.top,
    height: el.clientHeight, width: el.offsetWidth - el.clientWidth, thumb: el.clientHeight * el.clientHeight / el.scrollHeight }; });
  assert.ok(bar.width > 0, 'Chrome must expose the native scrollbar for this check');
  await page.mouse.move(bar.right - bar.width / 2, bar.top + bar.thumb / 2); await page.mouse.down();
  await page.mouse.move(bar.right - bar.width / 2, bar.top + bar.height - 5, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(300);
  assert.ok((await scrollState()).top >= (await scrollState()).max - 1);
  pass('native focus, arrows, Home/End, PageUp/PageDown, wheel and scrollbar drag reach the entire real lesson');
  await region.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(350);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  async function rearmScroll() {
    await hands([], 10);
    const heading = await page.locator('.xr-education-heading h2').boundingBox();
    await aimPoint({ x: heading.x + heading.width / 2, y: heading.y + heading.height / 2 }); await hands(await page.evaluate(() => window.handQa.hands), 5);
  }
  async function captureScroll() {
    await rearmScroll();
    const box = await region.boundingBox(), point = { x: box.x + box.width / 2, y: box.y + box.height - 35 };
    const h = await aimPoint(point);
    await page.waitForFunction(() => !!window.dwellQa.readCapture?.());
    assert.equal(await cursor.getAttribute('data-ui'), 'scroll');
    return { box, point, h };
  }
  async function releaseScroll(from) {
    const b = await region.boundingBox();
    const end = await at({ x: b.x - 85, y: Math.max(b.y + 15, Math.min(b.y + b.height - 15, from.point.y)) });
    await glide(from.h, end); await hands([end], 9);
    assert.equal(await capture(), null); return end;
  }
  let aimed = await captureScroll(), atStart = await scrollState(), pose = (await inspect()).target;
  assert.ok(Math.abs((await capture()).startScrollTop - atStart.top) < 1); await shot('03-scroll-captured');
  const upPoint = { x: aimed.point.x, y: aimed.box.y + 30 }, up = await at(upPoint);
  const rays = (await observe()).raycasts;
  await glide(aimed.h, up); await hands([up], 18); // More than the 550ms manipulation hold threshold.
  assert.ok((await scrollState()).top > atStart.top + 100); assert.deepEqual((await inspect()).target, pose);
  assert.equal((await observe()).raycasts, rays); assert.equal((await inspect()).state.selectedStructure, chosen.id);
  const downPoint = { x: aimed.point.x, y: aimed.point.y - 10 }, down = await at(downPoint), afterUp = (await scrollState()).top;
  await glide(up, down); assert.ok((await scrollState()).top < afterUp); await shot('04-relative-up-down');
  // Missing samples pause the existing capture; first recovered sample rebases it.
  const beforeLoss = (await scrollState()).top;
  await hands([], 2); assert.equal(await cursor.getAttribute('data-tracking'), 'grace'); assert.equal((await capture()).paused, true);
  assert.equal((await scrollState()).top, beforeLoss);
  const near = await at({ x: downPoint.x, y: downPoint.y + 6 }); await hands([near], 4);
  assert.ok(Math.abs((await scrollState()).top - beforeLoss) < 2);
  await hands([near], 8); assert.ok(await capture());
  pass('relative hand scroll up/down, >550ms conflict, no raycast/pose changes; grace pauses and reacquire rebases');
  await releaseScroll({ h: near, point: downPoint });
  assert.deepEqual((await inspect()).target, pose);
  // Repeated natural strokes can reach the end without absolute mapping or synthetic scroll assignments.
  for (let i = 0; i < 12 && (await scrollState()).top < (await scrollState()).max - 3; i++) {
    aimed = await captureScroll();
    const endPoint = { x: aimed.point.x, y: aimed.box.y + 10 }, end = await at(endPoint);
    await glide(aimed.h, end);
    await releaseScroll({ h: end, point: endPoint });
  }
  assert.ok((await scrollState()).top >= (await scrollState()).max - 3); await shot('05-lesson-end');
  pass('horizontal sustained release and rearmed relative strokes reach the real footer');
  const beforeIsolate = (await scrollState()).top;
  await dwellControl('isolate'); assert.equal((await inspect()).state.isolatedStructure, chosen.id);
  assert.equal(await capture(), null); assert.equal((await scrollState()).top, beforeIsolate);
  await shot('06-button-priority'); pass('Aislar button wins its own dwell and never scrolls');
  // A real source link belongs to the region, but never receives a click or navigation from dwell.
  await hands([], 10);
  const link = region.locator('a').last(); await link.scrollIntoViewIfNeeded();
  const linkBox = await link.boundingBox(), url = page.url(), pagesBefore = context.pages().length;
  await rearmScroll(); await aimPoint({ x: linkBox.x + linkBox.width / 2, y: linkBox.y + linkBox.height / 2 });
  await page.waitForFunction(() => !!window.dwellQa.readCapture?.());
  assert.equal(page.url(), url); assert.equal(context.pages().length, pagesBefore);
  pass('source/license link dwell captures region only; no link click or external page');
  await hands([], 10); assert.equal(await capture(), null);
  await control('isolate').click(); // Restore before selecting a different real surface.
  await region.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(350);
  aimed = await captureScroll();
  await page.mouse.move(aimed.point.x, aimed.point.y); await page.mouse.wheel(0, 80); await page.waitForTimeout(120);
  assert.equal(await capture(), null);
  aimed = await captureScroll(); await hands([{ ...aimed.h, ratio: .2 }], 2); assert.equal(await capture(), null); assert.deepEqual((await inspect()).target, pose);
  await hands([], 10); aimed = await captureScroll();
  await control('close-card').click(); assert.equal(await page.locator('.xr-atlas-card').count(), 0); assert.equal(await capture(), null);
  assert.equal(await page.evaluate(() => window.scrollCanvas === document.querySelector('canvas')), true);
  pass('manual wheel, pinch and close cancel capture; scene/canvas retained');
  // DOM contract tests use actual production registry; only the fixture content is synthetic.
  const dom = await page.evaluate(async () => {
    const { HandUiRegistry } = await import('/med3d/src/features/xr/ui/HandUiRegistry.ts');
    const root = document.createElement('section'); root.style.cssText = 'position:fixed;left:350px;top:120px;width:360px;height:350px;z-index:9999;background:#080b0d';
    root.innerHTML = '<div data-xr-ui><div data-xr-hand-control="test-scroll" data-xr-hand-kind="scroll-region" style="height:180px;overflow:auto"><p>Texto breve</p></div></div>';
    document.body.append(root); const registry = new HandUiRegistry(() => {}); registry.mount(root);
    const region = root.querySelector('[data-xr-hand-kind]'), rect = region.getBoundingClientRect(), point = { x: rect.left + 40, y: rect.top + 15 };
    const short = registry.hitTest(point).target?.id ?? null;
    region.innerHTML = '<p>Texto normal</p><button data-xr-hand-control="inside">Aislar</button><a href="https://example.invalid">Fuente</a><p style="height:700px">Contenido largo</p>';
    await new Promise(resolve => setTimeout(resolve, 0));
    let links = 0; region.querySelector('a').addEventListener('click', event => { event.preventDefault(); links++; });
    const text = registry.hitTest(point).target?.kind;
    const button = region.querySelector('button').getBoundingClientRect(), buttonHit = registry.hitTest({ x: button.left + 5, y: button.top + 5 }).target?.id;
    const link = region.querySelector('a').getBoundingClientRect(), linkHit = registry.hitTest({ x: link.left + 5, y: link.top + 5 }).target?.kind;
    registry.activate('test-scroll'); const noLinkClick = links === 0;
    const outside = registry.hitTest({ x: rect.left - 1, y: point.y }).target?.id ?? null;
    const cover = document.createElement('div'); cover.style.cssText = 'position:absolute;inset:0;background:black'; root.append(cover);
    const covered = registry.hitTest(point).target?.id ?? null; cover.remove();
    region.hidden = true; const hidden = registry.resolve('test-scroll'); region.hidden = false;
    const token = registry.resolve('test-scroll').scroll.token, copy = region.cloneNode(true); region.replaceWith(copy); await new Promise(resolve => setTimeout(resolve, 0));
    const changed = registry.resolve('test-scroll').scroll.token !== token;
    registry.dispose(); root.remove(); return { short, text, buttonHit, linkHit, noLinkClick, outside, covered, hidden, changed };
  });
  assert.deepEqual(dom, { short: null, text: 'scroll-region', buttonHit: 'inside', linkHit: 'scroll-region', noLinkClick: true, outside: null, covered: null, hidden: null, changed: true });
  pass('production registry: no overflow/occluded/hidden/outside rejected, text accepted, nested button priority, links inert, replacement token', dom);
  await hands([], 10);
  chosen = await surface(chosen.id); await page.mouse.click(chosen.point.x, chosen.point.y); await region.waitFor();
  aimed = await captureScroll();
  const replacement = await surface(chosen.id); await page.mouse.click(replacement.point.x, replacement.point.y); await region.waitFor();
  assert.equal(await capture(), null); assert.equal((await scrollState()).top, 0);
  assert.equal((await inspect()).state.selectedStructure, replacement.id); assert.equal((await inspect()).sceneId, originalCanvas);
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  pass('changing to another real structure resets content scroll and releases capture');
  const widths = [];
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: 900 }); await region.focus(); await page.keyboard.press('End'); await page.waitForTimeout(350);
    const end = await scrollState(); assert.ok(end.top >= end.max - 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.keyboard.press('Home'); await page.waitForTimeout(350);
    if (width === 390) {
      const b = await region.boundingBox(), cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height - 25 }] });
      for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height - 25 - (b.height - 60) * i / 8 }] }); await page.waitForTimeout(30); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(450);
      assert.ok((await scrollState()).top > 15); await shot('07-mobile-touch-scroll');
      assert.ok((await page.locator('.xr-atlas-card').boundingBox()).height <= 900 * .42 + 1); await cdp.detach();
    }
    widths.push({ width, max: end.max, reachedEnd: true, noHorizontalOverflow: true });
  }
  pass('responsive 1366/1050/900/768/390; native touch scroll in unchanged mobile bottom sheet', { widths });
  assert.deepEqual(errors, []);
  await writeFile(output + '/browser-results.json', JSON.stringify({ synthetic: true, results, requests, errors }, null, 2));
} catch (error) {
  await writeFile(output + '/failure-state.json', JSON.stringify({ error: String(error), errors, results, observed: await observe().catch(() => null) }, null, 2));
  await shot('failure').catch(() => {}); throw error;
} finally { await browser.close(); }
