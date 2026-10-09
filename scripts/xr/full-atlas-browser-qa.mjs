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
const output = process.env.XR_QA_OUTPUT || '.cache/xr-full-atlas'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(30000);
const results = [], errors = [], requests = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.url().endsWith('.glb') || /models\/anatomy\/.*catalog\.json$/.test(request.url())) requests.push(request.url()); });
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
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1');
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

  const { readFile } = await import('node:fs/promises');
  const ids = ['skeletal', 'muscular', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary'];
  const catalogs = Object.fromEntries(await Promise.all([...ids, 'ocular'].map(async id => [id, JSON.parse(await readFile('public/models/anatomy/' + id + '/catalog.json', 'utf8'))])));
  const assetsFor = id => [...catalogs[id].assets, ...(id === 'nervous' ? catalogs.ocular.assets : [])];
  const glbs = () => requests.filter(url => url.includes('/models/anatomy/') && url.endsWith('.glb'));
  const anatomyRequests = () => requests.filter(url => url.includes('/models/anatomy/')).map(url => new URL(url).pathname.replace('/med3d/', ''));
  const progressive = [], representatives = [];
  let expectedPaths = new Set(), activeIds = [];
  const setLayers = async desired => {
    for (const id of ids) {
      const input = control(id + '-toggle');
      if (await input.isChecked() !== desired.includes(id)) await input.setChecked(desired.includes(id));
    }
  };
  const range = async (id, value) => {
    await control(id).focus(); await page.keyboard.press('Home');
    const min = Number(await control(id).getAttribute('min'));
    for (let n = min; n < value; n++) await page.keyboard.press('ArrowRight');
    assert.equal(Number(await control(id).inputValue()), value);
  };
  async function findSurface(system, robust = false) {
    await page.locator('.xr-atlas-page .xr-viewport').scrollIntoViewIfNeeded();
    const canvas = page.locator('.xr-atlas-page canvas'), box = await canvas.boundingBox();
    await page.mouse.click(box.x + 12, box.y + 95); // Initializes the observer with the actual camera/root/rectangle.
    return page.evaluate(({ system, robust }) => {
      const canvas = document.querySelector('.xr-atlas-page canvas'), rect = canvas.getBoundingClientRect(), qa = window.dwellQa;
      for (const part of window.__med3dXrAtlas().parts.filter(p => p.visible && p.system === system)) for (const [x, y, z] of part.screenSamples) {
        const point = { x: rect.left + (x + 1) * rect.width / 2, y: rect.top + (1 - y) * rect.height / 2 };
        if (Math.abs(z) > 1 || document.elementFromPoint(point.x, point.y) !== canvas) continue;
        const hit = qa.probe(point); if (hit.kind !== 'selected' || hit.selection.node.systemId !== system) continue;
        if (robust && ![[-2, 0], [2, 0], [0, -2], [0, 2]].every(([dx, dy]) => qa.probe({ x: point.x + dx, y: point.y + dy }).selection?.id === hit.selection.id)) continue;
        return { point, id: hit.selection.id, name: hit.selection.node.name, system };
      }
      return null;
    }, { system, robust });
  }
  const initial = await inspect(), sceneId = initial.sceneId;
  assert.equal(initial.modules.length, 7);
  assert.deepEqual(Object.keys(initial.state.systemVisibility).filter(id => initial.state.systemVisibility[id]), ['skeletal']);
  await page.evaluate(() => { window.fullAtlasCanvas = document.querySelector('.xr-atlas-page canvas'); });
  for (const [step, id] of ids.entries()) {
    activeIds.push(id);
    const started = Date.now();
    if (id !== 'skeletal') await control(id + '-toggle').check();
    const accumulated = activeIds.flatMap(assetsFor);
    await page.waitForFunction(count => window.__med3dXrAtlas().modules.length === count, accumulated.length);
    for (const path of ['models/anatomy/' + id + '/catalog.json', ...assetsFor(id).map(a => a.path), ...(id === 'nervous' ? ['models/anatomy/ocular/catalog.json'] : [])]) expectedPaths.add(path);
    assert.deepEqual(new Set(anatomyRequests()), expectedPaths, id + ' downloads only its own catalogs/modules');
    const state = await inspect();
    progressive.push({ system: id, modules: state.modules.length, meshes: state.meshes, triangles: state.triangles, bytes: state.bytes, geometryBytes: state.geometryBytes,
      observedLoadMs: Date.now() - started, renderedLoadMs: state.timings[id]?.completeMs ?? null });
    await setLayers([id]);
    assert.equal((await inspect()).visibleMeshes, assetsFor(id).reduce((n, a) => n + a.meshCount, 0));
    await range(id + '-opacity', 35);
    assert.ok((await inspect()).parts.filter(p => p.system === id).every(p => p.opacity <= .35 && p.transparent));
    await control(id + '-opacity').focus(); await page.keyboard.press('End');
    const hit = await findSurface(id); assert.ok(hit, id + ' real accessible surface');
    await page.mouse.click(hit.point.x, hit.point.y);
    await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, hit.id);
    assert.equal(await page.locator('#xr-education-title').textContent(), hit.name);
    assert.ok(await page.locator('.xr-education-content h3').count());
    assert.ok((await page.locator('.xr-education-sources').textContent()).includes('CC BY'));
    representatives.push(hit);
    if (id === 'nervous') await shot('08-ficha-nerviosa');
    const beforeIsolation = (await inspect()).state;
    await control('isolate').click(); assert.equal((await inspect()).state.isolatedStructure, hit.id);
    assert.deepEqual((await inspect()).state.systemVisibility, beforeIsolation.systemVisibility);
    assert.deepEqual((await inspect()).state.systemOpacity, beforeIsolation.systemOpacity);
    await control('isolate').click(); assert.equal((await inspect()).state.isolatedStructure, null);
    await control('hide').click(); assert.ok((await inspect()).state.hiddenStructures.includes(hit.id));
    assert.ok((await inspect()).parts.filter(p => p.id === hit.id).every(p => !p.visible));
    await control('restore-hidden').click(); assert.equal((await inspect()).state.hiddenStructures.length, 0);
    const retained = await inspect(), requestCount = glbs().length;
    for (let i = 0; i < (['nervous', 'respiratory', 'integumentary'].includes(id) ? 3 : 1); i++) {
      await control(id + '-toggle').uncheck(); assert.equal((await inspect()).visibleMeshes, 0);
      await control(id + '-toggle').check();
    }
    const reused = await inspect();
    assert.equal(glbs().length, requestCount); assert.equal(reused.materials, retained.materials); assert.equal(reused.meshes, retained.meshes);
    assert.deepEqual(reused.modules, retained.modules); assert.equal(reused.geometryBytes, retained.geometryBytes); assert.equal(reused.sceneId, sceneId);
    assert.equal(await page.evaluate(() => window.fullAtlasCanvas === document.querySelector('.xr-atlas-page canvas')), true);
    if (id === 'nervous') await shot('03-nervioso');
    if (id === 'integumentary') await shot('06-tegumentario');
    if (id === 'reproductive') { await setLayers(['urinary', 'endocrine', 'lymphatic', 'reproductive']); await shot('05-internos'); }
    if (id === 'digestive') { await setLayers(['respiratory', 'digestive']); await shot('04-respiratorio-digestivo'); }
    await setLayers(activeIds);
    await page.locator('.xr-atlas-page .xr-viewport').scrollIntoViewIfNeeded();
    if (step === 0) await shot('01-oseo');
    if (step === 1) await shot('02-oseo-muscular');
    pass('system ' + id + ': lazy/network, visible, opacity, real selection/card, isolate, hide/restore, retained OFF/ON', { representative: hit.id });
  }
  assert.equal(glbs().length, 52); assert.equal((await inspect()).meshes, 937);
  await shot('10-panel-once-sistemas');
  await setLayers(['skeletal', 'integumentary']);
  let skin = await findSurface('integumentary'); assert.ok(skin);
  await page.mouse.click(skin.point.x, skin.point.y); assert.equal((await inspect()).state.selectedStructure, skin.id);
  await page.keyboard.press('Escape'); await range('integumentary-opacity', 35);
  skin = await findSurface('integumentary'); assert.ok(skin, 'transparent skin remains selectable');
  await page.mouse.click(skin.point.x, skin.point.y); assert.equal((await inspect()).state.selectedStructure, skin.id);
  await page.keyboard.press('Escape'); await control('integumentary-toggle').uncheck();
  const interior = await findSurface('skeletal'); assert.ok(interior);
  await page.mouse.click(interior.point.x, interior.point.y); assert.equal((await inspect()).state.selectedStructure, interior.id); await page.keyboard.press('Escape');
  pass('skin at 100% intercepts real rays; transparent skin still selectable; OFF exposes interior');
  await setLayers(['skeletal', 'muscular', 'nervous', 'cardiovascular']);
  await shot('07-multisistema');
  const explosionCoverage = {};
  for (const amount of [0, 50, 100, 0]) {
    await range('explosion', amount); const state = await inspect();
    assert.equal(state.state.explodedAmount, amount / 100);
    if (!amount) for (const part of state.parts) assert.deepEqual(part.position, part.basePosition);
    if (amount === 100) {
      for (const id of ids) explosionCoverage[id] = state.parts.filter(p => p.system === id && p.offset.some(n => n !== 0)).length;
      await page.locator('.xr-atlas-page .xr-viewport').scrollIntoViewIfNeeded(); await shot('09-despiece');
    }
  }
  pass('multisystem explosion 0/50/100/0 restores exact base', { explosionCoverage });
  // All registrations are discovered by the production DOM registry, including scrolled controls.
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  for (const id of ['nervous', 'respiratory', 'digestive', 'integumentary']) {
    await hands([], 8); if (await control(id + '-toggle').isChecked()) await control(id + '-toggle').uncheck();
    const aimed = await dwellControl(id + '-toggle'); await hands([aimed.h], 30);
    assert.equal((await inspect()).state.systemVisibility[id], true);
    assert.equal(await page.evaluate(id => window.dwellQa.fired.filter(f => f.target.id === id).length, id + '-toggle'), 1);
  }
  pass('new toggles register automatically and fire once after existing 1000ms dwell');
  for (const id of ['skeletal', 'nervous', 'integumentary']) {
    await hands([], 8); await setLayers([id]); await slider(id + '-opacity', 35);
    assert.equal((await inspect()).state.systemOpacity[id], .35);
    await hands([], 8); await control(id + '-opacity').focus(); await page.keyboard.press('End');
  }
  pass('skeletal/nervous/skin gestural opacity capture, horizontal change and existing vertical release');
  for (const id of ['nervous', 'respiratory', 'integumentary']) {
    await hands([], 8); await setLayers([id]); const hit = await findSurface(id, true); assert.ok(hit);
    await aimPoint(hit.point); await page.waitForFunction(id => window.__med3dXrAtlas().state.selectedStructure === id, hit.id);
    assert.equal(await page.locator('#xr-education-title').textContent(), hit.name); await hands([], 8); await page.keyboard.press('Escape');
  }
  pass('anatomical dwell opens nervous, respiratory and skin cards using real raycasts');
  await hands([], 8); await setLayers(ids); await control('reset-view').click();
  let h = await aimPoint((await findSurface('integumentary', true)).point);
  const before = (await inspect()).target;
  await hands([{ ...h, ratio: .2 }], 2); await glide({ ...h, ratio: .2 }, { ...h, u: h.u + .07, ratio: .2 });
  assert.notEqual((await inspect()).target.rotationY, before.rotationY); assert.equal((await inspect()).state.selectedStructure, null);
  const left = { ...h, u: h.u + .07, ratio: .2 }, right = { ...left, id: 'Right', u: left.u + .2 };
  await hands([left, right], 3); const scale = (await inspect()).target.scale;
  for (let i = 1; i <= 5; i++) await hands([{ ...left, u: left.u - i * .012 }, { ...right, u: right.u + i * .012 }], 1);
  assert.ok((await inspect()).target.scale > scale); await hands([], 8);
  pass('all eleven loaded: pinch rotates whole root and two pinches scale without selection');
  await control('reset-view').click(); await setLayers(['skeletal']); await page.waitForTimeout(350);
  const manualHit = await findSurface('skeletal');
  await page.touchscreen.tap(manualHit.point.x, manualHit.point.y); await page.waitForFunction(() => !!window.__med3dXrAtlas().state.selectedStructure);
  await page.keyboard.press('Escape');
  await page.mouse.move(manualHit.point.x, manualHit.point.y); await page.mouse.down(); await page.mouse.move(manualHit.point.x + 50, manualHit.point.y + 20, { steps: 5 }); await page.mouse.up();
  assert.equal((await inspect()).state.selectedStructure, null);
  const manualBefore = (await inspect()).target; await page.mouse.wheel(0, -120); await page.waitForTimeout(100);
  assert.notEqual((await inspect()).target.scale, manualBefore.scale);
  await page.locator('.xr-atlas-page .xr-viewport').focus(); await page.keyboard.press('ArrowRight');
  assert.notEqual((await inspect()).target.rotationY, manualBefore.rotationY);
  const rotatedHit = await findSurface('skeletal'); await page.mouse.click(rotatedHit.point.x, rotatedHit.point.y); assert.ok((await inspect()).state.selectedStructure);
  await control('close-card').click();
  await control('nervous-toggle').focus(); await page.keyboard.press('Space'); assert.equal((await inspect()).state.systemVisibility.nervous, true);
  await page.keyboard.press('Tab'); assert.equal(await control('nervous-opacity').evaluate(el => el === document.activeElement), true);
  await page.keyboard.press('ArrowLeft'); assert.equal(Number(await control('nervous-opacity').inputValue()), 99);
  await control('restore-atlas').focus(); await page.keyboard.press('Enter'); assert.equal((await inspect()).state.systemVisibility.nervous, false);
  pass('touch tap, drag/no selection, wheel, rotated/scaled real selection; Tab/Space/Enter/arrows');
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  const responsive = [];
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: 900 }); await page.keyboard.press('Escape');
    if (width === 390) { await page.locator('.xr-atlas-layers summary').click(); assert.equal(await page.locator('.xr-atlas-layers').getAttribute('open'), null); await page.locator('.xr-atlas-layers summary').click(); }
    await control('integumentary-toggle').scrollIntoViewIfNeeded(); assert.equal(await control('integumentary-toggle').isVisible(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    responsive.push({ width, overflow: false, controls: await page.locator('.xr-atlas-layer input[type=checkbox]').count() });
    if (width === 390) {
      await page.locator('.xr-atlas-layers summary').click();
      const hit = await findSurface('skeletal'); await page.touchscreen.tap(hit.point.x, hit.point.y); await page.locator('.xr-atlas-card').waitFor();
      assert.ok((await page.locator('.xr-atlas-card').boundingBox()).height <= 900 * .42 + 1); await shot('11-mobile'); await control('close-card').click();
    }
  }
  pass('responsive 1366/1050/900/768/390; eleven controls, manual list scroll and mobile bottom sheet', { responsive });
  assert.equal(await page.locator('.xr-mode-switch').count(), 0);
  assert.ok(requests.every(url => !url.endsWith('/models/heart.glb')));
  assert.ok(requests.some(url => url.endsWith('/models/anatomy/cardiovascular/heart.glb')));
  pass('unified public route has no mode selector or separate heart download');
  assert.deepEqual(errors, []);
  await writeFile(output + '/browser-results.json', JSON.stringify({ synthetic: true, results, progressive, representatives, responsive, requests, errors }, null, 2));
} catch (error) {
  await writeFile(output + '/failure-state.json', JSON.stringify({ error: String(error), errors, results, observed: await observe().catch(() => null), atlas: await inspect().then(v => ({ state: v.state, target: v.target })).catch(() => null) }, null, 2));
  await shot('failure').catch(() => {}); throw error;
} finally { await browser.close(); }
