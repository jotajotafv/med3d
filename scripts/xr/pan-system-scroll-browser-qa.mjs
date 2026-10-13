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
const output = process.env.XR_QA_OUTPUT || '.cache/xr-pan-system-scroll'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ignoreDefaultArgs: ['--hide-scrollbars'], ...(executablePath ? { executablePath } : {}), args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true, deviceScaleFactor: Number(process.env.XR_QA_DPR || 1) });
await context.addInitScript(installHandFixture, { syntheticBitmap: process.env.XR_QA_SYNTHETIC_BITMAP === '1' });
const page = await context.newPage(); page.setDefaultTimeout(120000); page.setDefaultNavigationTimeout(180000);
const results = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.url().endsWith('.glb') || /models\/anatomy\/.*catalog\.json$/.test(request.url())) requests.push(request.url()); });
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const observe = () => page.evaluate(() => ({ capture: window.dwellQa.readCapture?.(), dwell: window.dwellQa.dwell, raycasts: window.dwellQa.raycasts, point: window.dwellQa.point, state: window.dwellQa.state, calls: window.dwellQa.calls, trace: window.dwellQa.trace }));
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
async function aimPoint(point) { await hands([], 8); const h = await at(point); await hands([h], 9); await page.waitForFunction(() => window.dwellQa.state === 'tracking'); return h; }
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
    for (const name of ['release', 'endGesture', 'suspendGesture']) { const method = HandUiRouter.prototype[name]; HandUiRouter.prototype[name] = function (...args) { if (this.capture || this.scroll.capture) (qa.releases ??= []).push({ name, slider: this.capture?.id, scroll: this.scroll.capture?.id, args, stack: new Error().stack, time: performance.now() }); return method.apply(this, args); }; }
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
      const mode = update.apply(this, args); (qa.trace ??= []).push({ time: args[1], dt: args[1] - qa.lastTime, state: this.trackingState, hands: args[0].length }); if (qa.trace.length > 40) qa.trace.shift(); qa.state = this.trackingState; qa.point = this.point; qa.rawPointer = this.lastReliablePointer; qa.lastTime = args[1]; return mode;
    };
  });



  await page.evaluate(async () => {
    const loaded = path => performance.getEntriesByType('resource').map(e => e.name).filter(url => new URL(url).pathname === path).at(-1) ?? path;
    const { HandUiRegistry } = await import(loaded('/med3d/src/features/xr/ui/HandUiRegistry.ts'));
    const hit = HandUiRegistry.prototype.hitTest;
    HandUiRegistry.prototype.hitTest = function (...args) { window.dwellQa.uiAt = point => hit.call(this, point); return hit.apply(this, args); };
  });
  const list = control('systems-scroll'), viewport = page.locator('.xr-atlas-page .xr-viewport');
  const scrollState = () => list.evaluate(el => ({ top: el.scrollTop, max: el.scrollHeight - el.clientHeight }));
  const capture = () => page.evaluate(() => window.dwellQa.readCapture?.());
  const pose = state => ({ ...state.target, y: state.verticalOffset });
  const near = (a, b, tolerance = .01) => assert.ok(Math.abs(a - b) < tolerance, a + ' != ' + b);
  const initial = await inspect(), seen = new Set();
  assert.equal(await page.locator('.xr-atlas-layer input[type=checkbox][data-xr-hand-control]').count(), 11);
  assert.deepEqual(Object.keys(initial.state.systemVisibility).filter(id => initial.state.systemVisibility[id]), ['skeletal']);
  assert.equal(requests.filter(url => url.endsWith('.glb')).length, 7);
  assert.ok((await scrollState()).max > 0);
  await viewport.scrollIntoViewIfNeeded(); await shot('01-initial');
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  const b = await viewport.boundingBox(), center = { x: b.x + b.width * .45, y: b.y + b.height * .5 };
  async function makePair(y, span, ratio = .2) {
    return [{ ...await at({ x: center.x - span / 2, y }, ratio), id: 'Left' }, { ...await at({ x: center.x + span / 2, y }, ratio), id: 'Right' }];
  }
  async function glidePair(from, to) {
    for (let i = 1; i <= 10; i++) await hands(to.map((h, j) => ({ ...h, u: from[j].u + (h.u - from[j].u) * i / 10, v: from[j].v + (h.v - from[j].v) * i / 10 })), 1);
    await hands(to, 10);
  }
  await hands(await makePair(center.y, 220, .5), 10);
  await page.waitForFunction(() => window.dwellQa.state === 'tracking');
  let two = await makePair(center.y, 220); await hands(two, 3);
  const panelTop = (await scrollState()).top, baseParts = initial.parts.map(p => p.position);
  let next = await makePair(center.y - 110, 220); await glidePair(two, next); two = next;
  let state = await inspect(); assert.ok(state.verticalOffset > .35); near(state.target.scale, 1); near(state.root.position[1], state.verticalOffset);
  assert.deepEqual(state.parts.map(p => p.position), baseParts); assert.equal((await scrollState()).top, panelTop);
  await shot('02-pan-up');
  next = await makePair(center.y + 110, 220); await glidePair(two, next); two = next;
  state = await inspect(); assert.ok(state.verticalOffset < -.35); near(state.target.scale, 1); await shot('03-pan-down');
  const downY = state.verticalOffset;
  next = await makePair(center.y + 110, 270); await glidePair(two, next); two = next;
  state = await inspect(); near(state.verticalOffset, downY); assert.ok(state.target.scale > 1.15);
  next = await makePair(center.y - 85, 320); await glidePair(two, next); two = next;
  state = await inspect(); assert.ok(state.verticalOffset > .3); assert.ok(state.target.scale > 1.3); await shot('04-scale-pan');
  const retained = pose(state);
  await hands([two[0]], 8); near((await inspect()).verticalOffset, retained.y);
  await hands(two, 1); near((await inspect()).verticalOffset, retained.y);
  await hands(two, 8); near((await inspect()).verticalOffset, retained.y);
  assert.equal((await scrollState()).top, panelTop);
  pass('two-hand up/down, scale-only and simultaneous scale/pan; root only, panel unchanged, secondary loss/reanchor');
  await hands([], 10);
  await control('explosion').focus(); await page.keyboard.press('End');
  await control('reset-view').click(); await page.waitForTimeout(350); state = await inspect();
  near(state.root.position[1], 0); assert.equal(state.verticalOffset, 0); assert.equal(state.state.explodedAmount, 0); near(state.target.scale, 1);
  await shot('05-reset');
  await viewport.focus(); await page.keyboard.press('Shift+ArrowUp'); await page.keyboard.press('Shift+ArrowUp'); near((await inspect()).verticalOffset, .3);
  await page.keyboard.press('Shift+ArrowDown'); near((await inspect()).verticalOffset, .15);
  await page.keyboard.press('ArrowDown'); assert.ok((await inspect()).target.rotationX > 0); near((await inspect()).verticalOffset, .15);
  await control('restore-atlas').click(); near((await inspect()).verticalOffset, .15);
  await viewport.focus(); for (let i = 0; i < 12; i++) await page.keyboard.press('Shift+ArrowUp');
  near((await inspect()).verticalOffset, .9);
  for (let i = 0; i < 24; i++) await page.keyboard.press('Shift+ArrowDown');
  near((await inspect()).verticalOffset, -.9);
  await control('skeletal-opacity').focus(); await page.keyboard.press('Shift+ArrowUp'); near((await inspect()).verticalOffset, -.9);
  await control('reset-view').click(); await page.waitForTimeout(350);
  pass('keyboard Shift arrows, both clamps, child controls excluded, reset pose/explosion and unchanged Restore Atlas semantics');

  async function seenControls() {
    for (const id of await list.evaluate(el => { const r = el.getBoundingClientRect(); return [...el.querySelectorAll('input[type=checkbox][data-xr-hand-control]')].filter(e => { const b = e.getBoundingClientRect(); return b.top >= r.top && b.bottom <= r.bottom; }).map(e => e.dataset.xrHandControl); })) seen.add(id);
  }
  async function rearm() {
    await hands([], 10);
    const heading = await page.locator('.xr-atlas-layers legend').boundingBox();
    await aimPoint({ x: heading.x + heading.width / 2, y: heading.y + heading.height / 2 }); await hands(await page.evaluate(() => window.handQa.hands), 5);
  }
  async function captureList(edge = 'bottom') {
    await rearm();
    const point = await list.evaluate((el, edge) => {
      const r = el.getBoundingClientRect();
      // Use actual production hit testing to find existing blank row spacing; never move the list programmatically.
      for (let i = 18; i < r.height - 15; i += 2) {
        const y = edge === 'bottom' ? r.bottom - i : r.top + i;
        for (const fraction of [.5, .35, .65]) {
          const point = { x: r.left + r.width * fraction, y };
          if (window.dwellQa.uiAt(point).target?.id === 'systems-scroll') return point;
        }
      }
    }, edge);
    assert.ok(point, 'existing whitespace must be reachable');
    const h = await aimPoint(point);
    assert.equal(await capture(), null, 'stable acquisition is not enough without dwell');
    await page.waitForFunction(() => window.dwellQa.readCapture?.()?.id === 'systems-scroll');
    return { point, h, box: await list.boundingBox() };
  }
  async function releaseList(from) {
    const box = await list.boundingBox(), end = await at({ x: box.x - 85, y: from.point.y });
    await glide(from.h, end); await hands([end], 9); assert.equal(await capture(), null);
  }
  async function toEnd(direction) {
    for (let i = 0; i < 10; i++) {
      const s = await scrollState(); if (direction === 'down' ? s.top >= s.max - 1 : s.top <= 1) break;
      const a = await captureList(direction === 'down' ? 'bottom' : 'top');
      const p = { x: a.point.x, y: direction === 'down' ? a.box.y + 10 : a.box.y + a.box.height - 10 }, end = await at(p);
      const before = pose(await inspect()); await glide(a.h, end); await hands([end], 14);
      assert.deepEqual(pose(await inspect()), before); await seenControls();
      await releaseList({ h: end, point: p });
    }
    const s = await scrollState(); assert.ok(direction === 'down' ? s.top >= s.max - 1 : s.top <= 1);
  }
  await seenControls();
  let aimed = await captureList(), start = await scrollState(), before = await inspect();
  const upPoint = { x: aimed.point.x, y: aimed.point.y - 105 }, up = await at(upPoint);
  await glide(aimed.h, up); await hands([up], 16);
  assert.ok((await scrollState()).top > start.top + 100); assert.deepEqual(pose(await inspect()), pose(before)); assert.deepEqual((await inspect()).state, before.state);
  await seenControls(); await shot('06-system-scroll');
  const afterUp = (await scrollState()).top, downPoint = { x: aimed.point.x, y: aimed.point.y - 10 }, down = await at(downPoint);
  await glide(up, down); assert.ok((await scrollState()).top < afterUp);
  const loss = await page.evaluate(() => { window.handQa.hands = []; return { top: document.querySelector('[data-xr-hand-control=systems-scroll]').scrollTop, frame: window.handQa.frames }; });
  const held = loss.top; await page.waitForFunction(frame => window.handQa.frames >= frame + 2, loss.frame);  assert.equal((await capture()).paused, true); assert.equal((await scrollState()).top, held);
  const nearHand = await at({ x: downPoint.x, y: downPoint.y + 5 }); await hands([nearHand], 4); near((await scrollState()).top, held, 2);
  await hands([nearHand], 8); assert.ok(await capture());
  await releaseList({ h: nearHand, point: downPoint });
  pass('system scroll relative up/down, >550ms exclusive ownership, no toggles/opacity/pan/rotation/scale; grace/reanchor and horizontal release');
  await toEnd('down'); await shot('07-endocrine-lymphatic');
  for (const id of ['endocrine-toggle', 'lymphatic-toggle', 'reproductive-toggle', 'integumentary-toggle']) {
    const visible = await control(id).evaluate(el => { const r = el.closest('.xr-atlas-system-list').getBoundingClientRect(), b = el.getBoundingClientRect(); return b.top >= r.top && b.bottom <= r.bottom; });
    assert.ok(visible, id + ' reachable after hand scrolling');
  }
  await shot('08-reproductive-integumentary');
  // No scrollIntoView here: only hand scrolling made this control visible.
  const skinBox = await control('integumentary-toggle').boundingBox(), skinPoint = { x: skinBox.x + skinBox.width / 2, y: skinBox.y + skinBox.height / 2 };
  await page.evaluate(() => { window.dwellQa.fired = []; }); await aimPoint(skinPoint);
  assert.equal(await cursor.getAttribute('data-ui-control'), 'integumentary-toggle');
  await page.waitForFunction(() => window.__med3dXrAtlas().state.systemVisibility.integumentary);
  await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 206);
  assert.equal(await capture(), null); assert.equal(requests.filter(url => url.endsWith('.glb')).length, 8);
  await shot('09-skin-dwell');
  await toEnd('down');
  const sliderBox = await control('integumentary-opacity').boundingBox();
  const sliderPoint = { x: sliderBox.x + sliderBox.width / 2, y: sliderBox.y + sliderBox.height / 2 };
  await aimPoint(sliderPoint); await page.waitForFunction(() => document.querySelector('.xr-hand-cursor').dataset.dwell === 'sliderCaptured');
  assert.equal(await capture(), null);
  const slideFrom = await at(sliderPoint), slidePoint = { x: sliderBox.x + sliderBox.width * 30 / 90, y: sliderPoint.y }, slideEnd = await at(slidePoint);
  const interruptionsBefore = await page.evaluate(() => window.dwellQa.releases?.length ?? 0);
  await glide(slideFrom, slideEnd);
  if (Math.abs((await inspect()).state.systemOpacity.integumentary - .4) >= .02) {
    // First transparent rendering can stall the QA browser. Preserve the existing tracking watchdog/rearm.
    const interruptions = await page.evaluate(start => window.dwellQa.releases.slice(start), interruptionsBefore);
    assert.ok(interruptions.some(r => r.name === 'suspendGesture' && r.slider === 'integumentary-opacity'), 'Only a recorded tracking loss permits rearming this check');
    pass('cold transparency triggered the existing tracking watchdog; slider safely released and is reacquired', { interruptions });
    await rearm(); await aimPoint(sliderPoint);
    await page.waitForFunction(() => document.querySelector('.xr-hand-cursor').dataset.dwell === 'sliderCaptured');
    await glide(slideFrom, slideEnd);
  }
  near((await inspect()).state.systemOpacity.integumentary, .4, .02); await shot('10-opacity-after-scroll');
  const sliderExit = await at({ x: slidePoint.x, y: sliderPoint.y - 85 }); await glide(slideEnd, sliderExit); await hands([sliderExit], 9);
  pass('all eleven systems reachable; Tegumentario loads lazily by dwell after scroll; its opacity slider wins and changes normally');
  await toEnd('up'); await shot('11-back-to-top'); assert.equal(seen.size, 11);

  aimed = await captureList();
  const beforeCancel = pose(await inspect());
  await hands([{ ...aimed.h, ratio: .2 }, { ...aimed.h, id: 'Right', u: aimed.h.u - .12, ratio: .2 }], 3);
  assert.equal(await capture(), null); assert.deepEqual(pose(await inspect()), beforeCancel);
  aimed = await captureList(); await hands([], 10); assert.equal(await capture(), null);
  aimed = await captureList(); await page.mouse.move(aimed.point.x, aimed.point.y); await page.mouse.wheel(0, 100); await page.waitForTimeout(150); assert.equal(await capture(), null);
  aimed = await captureList(); await control('layers-panel').click(); assert.equal(await capture(), null);
  await control('layers-panel').click();
  pass('pinch, definitive loss, manual wheel and panel closure release system scroll without moving the body');
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  await list.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(300);
  const bar = await list.evaluate(el => { const r = el.getBoundingClientRect(); return { right: r.right, top: r.top, height: el.clientHeight, width: el.offsetWidth - el.clientWidth, thumb: el.clientHeight * el.clientHeight / el.scrollHeight }; });
  assert.ok(bar.width > 0);
  await page.mouse.move(bar.right - bar.width / 2, bar.top + bar.thumb / 2); await page.mouse.down();
  await page.mouse.move(bar.right - bar.width / 2, bar.top + bar.height - 5, { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(300);
  assert.ok((await scrollState()).top >= (await scrollState()).max - 1);
  await list.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(300); assert.equal((await scrollState()).top, 0);
  let lb = await list.boundingBox(); await page.mouse.move(lb.x + 50, lb.y + 100); await page.mouse.wheel(0, 160); await page.waitForTimeout(300); assert.ok((await scrollState()).top > 100);
  await list.focus(); await page.keyboard.press('End'); await page.waitForTimeout(300); assert.ok((await scrollState()).top >= (await scrollState()).max - 1);
  pass('native wheel, keyboard and scrollbar drag remain usable');
  const responsive = [];
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: 900 }); await viewport.scrollIntoViewIfNeeded(); await viewport.focus();
    await page.keyboard.press('0');
    for (let i = 0; i < 8; i++) await page.keyboard.press('+');
    for (const direction of ['Up', 'Down']) {
      for (let i = 0; i < 14; i++) await page.keyboard.press('Shift+Arrow' + direction);
      await page.waitForTimeout(300);
      const s = await inspect(); assert.ok(s.parts.some(p => p.visible && p.screenSamples.some(([x, y, z]) => Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(z) < 1)), 'body remains visible at pan bound');
    }
    await page.keyboard.press('0'); await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    responsive.push({ width, noOverflow: true, bodyAtBothBounds: true });
  }
  await list.scrollIntoViewIfNeeded(); await list.focus(); await page.keyboard.press('Home'); await page.waitForTimeout(300);
  lb = await list.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: lb.x + lb.width / 2, y: lb.y + lb.height - 20 }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: lb.x + lb.width / 2, y: lb.y + lb.height - 20 - i * 25 }] }); await page.waitForTimeout(30); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(400); assert.ok((await scrollState()).top > 30);
  await cdp.detach(); await shot('12-mobile');
  const explodeOutside = await control('explosion').evaluate(el => !el.closest('.xr-atlas-system-list')); assert.equal(explodeOutside, true);
  pass('responsive 1366/1050/900/768/390, visible body at both pan limits and maximum scale, native touch scroll; Despiece remains outside list', { responsive });
  assert.deepEqual(errors, []);
  await writeFile(output + '/browser-results.json', JSON.stringify({ synthetic: true, results, requests, errors }, null, 2));
} catch (error) {
  await writeFile(output + '/failure-state.json', JSON.stringify({ error: String(error), errors, results, observed: await observe().catch(() => null), releases: await page.evaluate(() => window.dwellQa.releases), atlas: await inspect().then(s => ({ target: s.target, y: s.verticalOffset, state: s.state })).catch(() => null) }, null, 2));
  await shot('failure').catch(() => {}); throw error;
} finally { await browser.close(); }
