// Production scene and native assets; synthetic video/landmarks, never physical validation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184', output = '.cache/xr-atlas-pilot';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, hasTouch: true, deviceScaleFactor: 1 });
await context.addInitScript(installHandFixture);
await context.addInitScript(() => {
  const add = EventTarget.prototype.addEventListener, remove = EventTarget.prototype.removeEventListener, records = [];
  const relevant = target => target === window || target === document || target instanceof HTMLCanvasElement;
  const capture = options => typeof options === 'boolean' ? options : !!options?.capture;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (relevant(this) && !records.some(r => r.target === this && r.type === type && r.listener === listener && r.capture === capture(options))) records.push({ target: this, type, listener, capture: capture(options) });
    return add.call(this, type, listener, options);
  };
  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const index = records.findIndex(r => r.target === this && r.type === type && r.listener === listener && r.capture === capture(options));
    if (index >= 0) records.splice(index, 1); return remove.call(this, type, listener, options);
  };
  window.xrListenerCount = () => records.filter(r => !(r.target instanceof HTMLCanvasElement) || r.target.isConnected).length;
});
const page = await context.newPage(); page.setDefaultTimeout(45000);
const errors = [], requests = [], results = [], perf = [];
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const canvas = page.locator('.xr-atlas-page canvas');
const shot = async name => { await canvas.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${output}/${name}.png` }); };
const waitMeshes = count => page.waitForFunction(count => window.__med3dXrAtlas?.().meshes === count, count);
const setSystem = async (label, enabled) => { await page.getByRole('checkbox', { name: label, exact: true }).setChecked(enabled); await page.waitForTimeout(150); };
const range = async (label, value) => {
  const slider = page.getByRole('slider', { name: label, exact: true });
  if (value === 100) return slider.press('End');
  await slider.press('Home'); const minimum = Number(await slider.getAttribute('min'));
  for (let i = minimum; i < value; i++) await slider.press('ArrowRight');
};
const clear = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(300); };
async function select(system, touch = false) {
  await canvas.scrollIntoViewIfNeeded(); const state = await inspect(), rect = await canvas.boundingBox();
  const candidates = state.parts.filter(part => part.visible && part.system === system);
  candidates.sort((a, b) => Number(/Fémur|Pectoral|Deltoides|Aorta|ventricular/i.test(b.name)) - Number(/Fémur|Pectoral|Deltoides|Aorta|ventricular/i.test(a.name)));
  for (const part of candidates) for (const [x, y, z] of part.screenSamples) {
    if (Math.abs(x) > .86 || Math.abs(y) > .86 || Math.abs(z) > 1) continue;
    const point = { x: rect.x + (x + 1) * rect.width / 2, y: rect.y + (1 - y) * rect.height / 2 };
    if (touch) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
    const next = await inspect(), selected = next.parts.find(item => item.id === next.state.selectedStructure);
    if (selected?.system === system) return { selected, point };
  }
  throw new Error('No visible selection: ' + system);
}
async function hands(value, frames = 2) {
  const start = await page.evaluate(value => { window.handQa.hands = value; return window.handQa.frames; }, value);
  await page.waitForFunction(({ start, frames }) => window.handQa.frames >= start + frames, { start, frames });
}
const one = (u, v, pinch = false, id = 'Left') => ({ id, u, v, pinch });
try {
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1');
  await page.locator('[data-model-status="ready"]').waitFor();
  assert.deepEqual(requests.filter(r => r.url.endsWith('.glb')).map(r => new URL(r.url).pathname), ['/med3d/models/heart.glb']);
  assert.ok(!requests.some(r => r.url.includes('/models/anatomy/')));
  await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(600);
  await page.screenshot({ path: `${output}/10-corazon.png` });
  await page.getByRole('button', { name: 'Atlas XR', exact: true }).click(); await waitMeshes(205);
  await page.evaluate(() => { window.xrOriginalCanvas = document.querySelector('.xr-atlas-page canvas'); });
  assert.equal(await page.getByRole('checkbox', { name: 'Óseo', exact: true }).isChecked(), true);
  assert.equal(await page.getByRole('checkbox', { name: 'Muscular', exact: true }).isChecked(), false);
  assert.equal(await page.getByRole('checkbox', { name: 'Cardiovascular', exact: true }).isChecked(), false);
  assert.ok(!requests.some(r => /models\/anatomy\/(muscular|cardiovascular)/.test(r.url)));
  await shot('01-oseo'); results.push({ test: 'heart-only network; atlas initially skeletal-only including catalog requests', passed: true });
  const bone = await select('skeletal'); assert.ok(await page.locator('#xr-education-title').textContent()); await shot('04-seleccion');
  const prior = (await inspect()).state;
  await page.getByRole('button', { name: 'Aislar', exact: true }).click();
  assert.ok((await inspect()).parts.filter(p => p.visible).every(p => p.id === bone.selected.id)); await shot('05-aislada');
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click(); assert.deepEqual((await inspect()).state, prior);
  await page.getByRole('button', { name: 'Ocultar', exact: true }).click();
  assert.equal((await inspect()).state.selectedStructure, null); assert.ok((await inspect()).parts.filter(p => p.id === bone.selected.id).every(p => !p.visible));
  await page.getByRole('button', { name: 'Restaurar estructuras', exact: true }).click(); assert.equal((await inspect()).visibleMeshes, 205);
  results.push({ test: 'real bone selection, card, isolate/restore exact state, hide clears selection, restore hidden', passed: true });
  await setSystem('Muscular', true); await waitMeshes(387); await shot('02-oseo-muscular');
  assert.ok(!requests.some(r => /models\/anatomy\/cardiovascular/.test(r.url)));
  const before = await inspect(), listeners = await page.evaluate(() => window.xrListenerCount()), requestCount = requests.length;
  for (let i = 0; i < 5; i++) { await setSystem('Muscular', false); assert.equal((await inspect()).visibleMeshes, 205); await setSystem('Muscular', true); assert.equal((await inspect()).visibleMeshes, 387); }
  const after = await inspect(); assert.equal(after.sceneId, before.sceneId); assert.equal(after.materials, before.materials); assert.equal(after.geometries, before.geometries);
  assert.equal(requests.length, requestCount); assert.equal(await page.evaluate(() => window.xrListenerCount()), listeners);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.xr-atlas-page canvas').length === 1 && window.xrOriginalCanvas === document.querySelector('.xr-atlas-page canvas')), true);
  results.push({ test: 'five layer cycles retain canvas/scene/materials/geometries/listeners/requests', passed: true, materials: after.materials, geometries: after.geometries });
  await range('Opacidad Muscular', 35); await page.waitForTimeout(200); const translucent = await inspect();
  assert.ok(translucent.parts.filter(p => p.system === 'muscular').every(p => p.opacity === .35 && p.transparent && !p.depthWrite));
  assert.ok(translucent.parts.filter(p => p.system === 'skeletal').every(p => p.opacity === 1)); await shot('06-opacidad-muscular');
  await select('muscular'); assert.ok(await page.locator('.xr-education-card').count()); await clear();
  await setSystem('Muscular', false); await select('skeletal'); await clear(); await setSystem('Muscular', true);
  await range('Opacidad Muscular', 100);
  await setSystem('Cardiovascular', true); await waitMeshes(549); await shot('03-tres-sistemas');
  await range('Despiece', 50); await page.waitForTimeout(250); const exploded = await inspect(); assert.ok(exploded.parts.some(p => p.offset.some(v => v !== 0)));
  await range('Despiece', 100); await shot('07-despiece');
  await page.getByRole('button', { name: 'Restablecer vista', exact: true }).click();
  assert.ok((await inspect()).parts.every(p => p.position.every((v, i) => v === p.basePosition[i])));
  await shot('08-panel-capas'); await setSystem('Óseo', false); await setSystem('Muscular', false); await select('cardiovascular'); await clear();
  results.push({ test: 'opacity scoped, muscle/bone/cardio raycast, hidden system excluded, regional explosion 50/100/0, view reset', passed: true });
  const glbs = requests.filter(r => r.url.includes('/models/anatomy/') && r.url.endsWith('.glb'));
  assert.equal(glbs.length, 32); assert.equal(new Set(glbs.map(r => r.url)).size, 32);
  assert.ok(requests.filter(r => r.url.includes('/models/anatomy/')).every(r => /models\/anatomy\/(skeletal|muscular|cardiovascular)\//.test(r.url)));
  results.push({ test: 'exactly 32 GLBs on demand; no non-pilot catalogs or systems', passed: true });
  await page.getByRole('button', { name: 'Restaurar atlas', exact: true }).click(); assert.deepEqual((await inspect()).state.systemVisibility, { skeletal: true, muscular: false, cardiovascular: false });
  await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 20, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(400); assert.ok(Math.abs((await inspect()).root.rotation[1]) > .1); assert.equal((await inspect()).state.selectedStructure, null);
  await page.mouse.wheel(0, -100); await page.waitForTimeout(400); assert.ok((await inspect()).root.scale > 1);
  await page.locator('.xr-atlas-page .xr-viewport').focus(); await page.keyboard.press('ArrowLeft'); await page.keyboard.press('0'); await page.waitForTimeout(500);
  assert.ok(Math.abs((await inspect()).root.rotation[1]) < .001);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  await canvas.scrollIntoViewIfNeeded(); const handTarget = await select('skeletal'); await clear();
  const { u, v } = await page.evaluate(point => {
    const workspace = document.querySelector('.xr-atlas-workspace').getBoundingClientRect();
    const left = Math.max(0, workspace.left), top = Math.max(0, workspace.top);
    const width = Math.min(innerWidth, workspace.right) - left, height = Math.min(innerHeight, workspace.bottom) - top;
    const fitW = Math.max(width, height * 4 / 3), fitH = fitW / (4 / 3);
    return { u: (point.x - left + (fitW - width) / 2) / fitW, v: (point.y - top + (fitH - height) / 2) / fitH };
  }, handTarget.point);
  assert.ok(u >= 0 && u <= 1 && v >= 0 && v <= 1);
  await hands([one(u, v)], 8); await hands([one(u, v, true)], 3); await hands([one(u, v)], 2);
  assert.ok((await inspect()).state.selectedStructure); await clear();
  await hands([one(.5, .5)], 18); await hands([one(.5, .5, true)]); await hands([one(.58, .53, true)], 4);
  await hands([one(.58, .53)], 3); assert.ok(Math.abs((await inspect()).root.rotation[1]) > .1); assert.equal((await inspect()).state.selectedStructure, null);
  await hands([one(.4, .5, true), one(.6, .5, true, 'Right')]); await hands([one(.32, .5, true), one(.68, .5, true, 'Right')], 5);
  assert.ok((await inspect()).root.scale > 1); await hands([], 2);
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click(); assert.equal(await page.evaluate(() => window.handQa.stops), 1);
  results.push({ test: 'manual drag/wheel/keyboard; synthetic index/pinch selection, whole-atlas hand rotation and scale; camera cleanup', passed: true });
  await page.getByRole('button', { name: 'Restablecer vista', exact: true }).click(); await page.waitForTimeout(400);
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 }); await canvas.scrollIntoViewIfNeeded(); await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await select('skeletal', true); await shot('09-mobile');
  assert.ok((await page.locator('.xr-education-card').boundingBox()).height <= 844 * .44 + 1); await clear();
  assert.equal(await page.evaluate(() => window.xrOriginalCanvas === document.querySelector('.xr-atlas-page canvas')), true);
  await page.getByRole('button', { name: 'Corazón', exact: true }).click(); await page.locator('[data-model-status="ready"]').waitFor();
  assert.equal(await page.evaluate(() => typeof window.__med3dXrAtlas), 'undefined'); assert.equal(await page.locator('canvas').count(), 1);
  assert.deepEqual(errors, []); assert.ok(requests.every(r => r.method === 'GET' && r.url.startsWith(origin)));
  results.push({ test: 'all five responsive widths, genuine touch selection/mobile sheet, mode switch disposes atlas, no page errors or uploads', passed: true });
  await context.close();

  // Real MediaPipe worker + WASM over synthetic video. Measure observed cadence; no FPS claim.
  const real = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
  await real.addInitScript(() => { window.RealWorker = window.Worker; });
  await real.addInitScript(installHandFixture);
  await real.addInitScript(() => {
    window.realInference = { results: 0 };
    window.Worker = class extends window.RealWorker { constructor(...args) { super(...args); this.addEventListener('message', event => { if (event.data.type === 'result') window.realInference.results++; }); } };
  });
  const rp = await real.newPage(); rp.setDefaultTimeout(45000); const realErrors = [];
  rp.on('pageerror', e => realErrors.push(e.message));
  await rp.goto(origin + '/med3d/experiencia-xr/?xrQa=1'); await rp.getByRole('button', { name: 'Atlas XR', exact: true }).click();
  await rp.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
  await rp.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await rp.getByText('Activa', { exact: true }).waitFor();
  for (const [label, meshes] of [['Óseo', 205], ['Muscular', 387], ['Cardiovascular', 549]]) {
    if (label !== 'Óseo') await rp.getByRole('checkbox', { name: label, exact: true }).check();
    await rp.waitForFunction(meshes => window.__med3dXrAtlas?.().meshes === meshes, meshes);
    const start = await rp.evaluate(() => ({ count: window.realInference.results, time: performance.now() })); await rp.waitForTimeout(3000);
    const measured = await rp.evaluate(start => {
      const { parts, state, ...metrics } = window.__med3dXrAtlas();
      return { ...metrics, inferencesPerSecond: (window.realInference.results - start.count) / ((performance.now() - start.time) / 1000), camera: document.querySelector('video').srcObject?.active };
    }, start);
    assert.ok(measured.inferencesPerSecond > 0); assert.equal(measured.camera, true); perf.push({ stage: label, ...measured });
  }
  await rp.getByRole('button', { name: 'Corazón', exact: true }).click(); assert.equal(await rp.evaluate(() => window.handQa.stops), 1);
  assert.deepEqual(realErrors, []); await real.close();
  results.push({ test: 'real MediaPipe continues at all three load levels and stops on mode switch', passed: true });
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ synthetic: true, results, performance: perf, requests }, null, 2));
  console.log(JSON.stringify({ results, performance: perf }, null, 2));
} catch (error) { await page.screenshot({ path: `${output}/failure.png` }).catch(() => {}); throw error; }
finally { await browser.close(); }
