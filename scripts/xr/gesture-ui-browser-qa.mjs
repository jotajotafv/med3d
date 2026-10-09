// Real DOM, production handlers and GLBs; only video/landmarks are synthetic.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184', output = '.cache/xr-gesture-ui';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: Number(process.env.XR_QA_HEIGHT || 1000) }, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(45000);
const errors = [], requests = [], results = [];
const pass = message => { results.push(message); console.log(message); };
page.on('pageerror', e => errors.push(e.message));
page.on('request', r => requests.push({ url: r.url(), method: r.method() }));
const inspect = () => page.evaluate(() => window.__med3dXrAtlas());
const control = id => page.locator(`[data-xr-hand-control="${id}"]`);
const cursor = page.locator('.xr-atlas-page>.xr-hand-cursor');
const pose = async () => { const { target } = await inspect(); return { rotation: [target.rotationX, target.rotationY, 0], scale: target.scale }; };
const shot = name => page.screenshot({ path: `${output}/${name}.png` });
const hands = async (value, frames = 3) => {
  const start = await page.evaluate(value => { window.handQa.hands = value; return window.handQa.frames; }, value);
  await page.waitForFunction(({ start, frames }) => window.handQa.frames >= start + frames, { start, frames });
};
async function atPoint(point, pinch = false) {
  const coordinates = await page.evaluate(point => {
    const workspace = document.querySelector('.xr-atlas-workspace').getBoundingClientRect();
    const card = document.querySelector('.xr-atlas-card')?.getBoundingClientRect() ?? workspace;
    const left = Math.max(0, Math.min(workspace.left, card.left)), top = Math.max(0, Math.min(workspace.top, card.top));
    const right = Math.min(innerWidth, Math.max(workspace.right, card.right)), bottom = Math.min(innerHeight, Math.max(workspace.bottom, card.bottom));
    const width = Math.max(right - left, (bottom - top) * 4 / 3), height = width / (4 / 3);
    return { u: (point.x - left + (width - (right - left)) / 2) / width, v: (point.y - top + (height - (bottom - top)) / 2) / height };
  }, point);
  assert.ok(coordinates.u >= 0 && coordinates.u <= 1 && coordinates.v >= 0 && coordinates.v <= 1);
  return { id: 'Left', ...coordinates, pinch };
}
async function aim(id, fraction = .5) {
  await hands([]);
  if (page.viewportSize().width <= 760) await control(id).evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  const box = await control(id).boundingBox(); assert.ok(box);
  assert.ok(box.y >= 78 && box.y + box.height <= page.viewportSize().height, `visible without desktop scrolling: ${id}, width=${page.viewportSize().width}, y=${box.y}, height=${box.height}`);
  const point = { x: box.x + box.width * fraction, y: box.y + box.height / 2 };
  const hand = await atPoint(point); await hands([hand], 8);
  assert.equal(await cursor.getAttribute('data-ui-control'), id, `hover ${id}`);
  return { hand, point, box };
}
async function pinch(id) {
  const { hand } = await aim(id); await hands([{ ...hand, pinch: true }], 3); await hands([hand], 3);
}
async function slider(id, value, screenshot) {
  const { hand, box } = await aim(id), before = await pose();
  const min = Number(await control(id).getAttribute('min')), max = Number(await control(id).getAttribute('max'));
  const end = await atPoint({ x: box.x + box.width * (value - min) / (max - min), y: box.y + box.height / 2 }, true);
  await hands([{ ...hand, pinch: true }], 3);
  for (let i = 1; i <= 8; i++) await hands([{ ...end, u: hand.u + (end.u - hand.u) * i / 8, v: hand.v + (end.v - hand.v) * i / 8 }], 2);
  await hands([end], 6);
  assert.equal(await control(id).inputValue(), String(value));
  assert.deepEqual(await pose(), before, 'slider hold/drag must not transform body');
  if (screenshot) await shot(screenshot);
  await hands([{ ...end, pinch: false }], 3);
}
async function selectAnatomy(system) {
  await hands([]); const canvas = page.locator('.xr-atlas-page canvas'); await canvas.scrollIntoViewIfNeeded(); await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const state = await inspect(), box = await canvas.boundingBox();
  const candidates = state.parts.filter(p => p.visible && p.system === system);
  candidates.sort((a, b) => Number(/Pectoral|Deltoides|Fémur/i.test(b.name)) - Number(/Pectoral|Deltoides|Fémur/i.test(a.name)));
  for (const part of candidates) for (const [x, y, z] of part.screenSamples) {
    if (Math.abs(x) > .8 || Math.abs(y) > .8 || Math.abs(z) > 1) continue;
    const point = { x: box.x + (x + 1) * box.width / 2, y: box.y + (1 - y) * box.height / 2 };
    if (point.y < 10 || point.y > 960) continue;
    const hand = await atPoint(point); await hands([hand], 8); await hands([{ ...hand, pinch: true }], 3); await hands([hand], 3);
    const selected = (await inspect()).state.selectedStructure;
    if (selected) return selected;
  }
  throw new Error('No anatomical hand selection: ' + system);
}
try {
  await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1');
  await page.getByRole('button', { name: 'Atlas XR', exact: true }).click();
  await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
  const glbs = () => requests.filter(r => /models\/anatomy\/.*\.glb$/.test(r.url));
  assert.equal(glbs().length, 7);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
  await aim('skeletal-toggle'); await shot('01-cursor-oseo');
  // An ordinary DOM button in the panel is deliberately NOT registered.
  await hands([]); await page.evaluate(() => {
    const button = document.createElement('button'); button.id = 'unregistered-qa'; button.textContent = 'QA sin registro';
    button.onclick = () => { window.unregisteredActivations = (window.unregisteredActivations || 0) + 1; };
    document.querySelector('.xr-atlas-layers').prepend(button);
  });
  const unregistered = await page.locator('#unregistered-qa').boundingBox();
  const blockedHand = await atPoint({ x: unregistered.x + unregistered.width / 2, y: unregistered.y + unregistered.height / 2 });
  await hands([blockedHand], 8); await hands([{ ...blockedHand, pinch: true }], 3); await hands([blockedHand], 3);
  assert.equal(await page.evaluate(() => window.unregisteredActivations || 0), 0); assert.equal((await inspect()).state.selectedStructure, null);
  await hands([]); await page.evaluate(() => document.querySelector('#unregistered-qa').remove());
  pass('unregistered DOM controls cannot activate; panel blocks anatomy');
  const original = await pose();
  await pinch('muscular-toggle'); await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 387);
  assert.equal((await inspect()).state.systemVisibility.muscular, true); assert.equal(glbs().length, 25); await shot('02-muscular-mano');
  await pinch('cardiovascular-toggle'); await page.waitForFunction(() => window.__med3dXrAtlas().meshes === 549);
  assert.equal((await inspect()).state.systemVisibility.cardiovascular, true); assert.equal(glbs().length, 32); await shot('03-cardio-mano');
  assert.deepEqual(await pose(), original); assert.equal((await inspect()).state.selectedStructure, null);
  pass('gestural toggles once on release, no pose/selection change, network 7/25/32');
  for (const system of ['skeletal', 'muscular', 'cardiovascular']) {
    await pinch(`${system}-toggle`); assert.equal((await inspect()).state.systemVisibility[system], false);
    await pinch(`${system}-toggle`); assert.equal((await inspect()).state.systemVisibility[system], true);
  }
  assert.equal(glbs().length, 32);
  await slider('muscular-opacity', 35, '04-opacidad-mano');
  assert.ok((await inspect()).parts.filter(p => p.system === 'muscular').every(p => p.opacity === .35));
  await slider('skeletal-opacity', 50); await slider('cardiovascular-opacity', 60);
  await slider('explosion', 60, '05-despiece-mano'); assert.ok((await inspect()).parts.some(p => p.offset.some(n => n !== 0)));
  pass('all opacity sliders and live regional explosion use real materials/offsets, holds exceed 550ms without rotation');
  const drag = await aim('muscular-opacity'), beforeConflict = await pose();
  await hands([{ ...drag.hand, pinch: true }], 3);
  const outside = await atPoint({ x: drag.box.x - 60, y: drag.point.y + 60 }, true);
  for (let i = 1; i <= 6; i++) await hands([{ ...outside, u: drag.hand.u + (outside.u - drag.hand.u) * i / 6, v: drag.hand.v + (outside.v - drag.hand.v) * i / 6 }, { id: 'Right', u: .3, v: .5, pinch: true }], 2);
  await hands([outside, { id: 'Right', u: .2, v: .5, pinch: true }], 5);
  assert.equal(await control('muscular-opacity').inputValue(), '10'); assert.deepEqual(await pose(), beforeConflict);
  await hands([{ ...outside, pinch: false }, { id: 'Right', u: .2, v: .5, pinch: true }], 3);
  await hands([{ ...outside, pinch: true }, { id: 'Right', u: .1, v: .5, pinch: true }], 3);
  assert.deepEqual(await pose(), beforeConflict); await hands([], 3);
  pass('slider retains capture outside rect; second hand and UI release cannot scale or select');
  await pinch('reset-view'); await page.waitForTimeout(400); assert.equal((await inspect()).state.explodedAmount, 0);
  await pinch('restore-atlas'); await pinch('muscular-toggle');
  const selected = await selectAnatomy('muscular'); await shot('06-seleccion-anatomia');
  const selectionPose = await pose(); await pinch('isolate');
  assert.equal((await inspect()).state.isolatedStructure, selected); assert.ok((await inspect()).parts.filter(p => p.visible).every(p => p.id === selected));
  await shot('07-aislar-mano'); await pinch('isolate'); assert.equal((await inspect()).state.isolatedStructure, null);
  assert.equal((await inspect()).state.selectedStructure, selected); assert.deepEqual(await pose(), selectionPose);
  // Card text must block selection/raycast underneath, without clearing the current structure.
  const title = await page.locator('#xr-education-title').boundingBox(); const textHand = await atPoint({ x: title.x + title.width / 2, y: title.y + title.height / 2 });
  await hands([textHand], 8); await hands([{ ...textHand, pinch: true }], 3); await hands([textHand], 3);
  assert.equal((await inspect()).state.selectedStructure, selected); assert.deepEqual(await pose(), selectionPose);
  await pinch('hide'); assert.ok((await inspect()).state.hiddenStructures.includes(selected)); assert.equal((await inspect()).state.selectedStructure, null);
  await shot('08-ocultar-mano'); await pinch('restore-hidden'); assert.deepEqual((await inspect()).state.hiddenStructures, []); await shot('09-restaurar-mano');
  await selectAnatomy('muscular'); await pinch('close-card'); assert.equal((await inspect()).state.selectedStructure, null);
  pass('hand selects real anatomy, card blocks behind, isolate/restore/hide/restore-hidden/close invoke existing actions');
  const hold = await aim('restore-atlas'), beforeHold = (await inspect()).state;
  await hands([{ ...hold.hand, pinch: true }], 16); await hands([hold.hand], 3);
  assert.deepEqual((await inspect()).state, beforeHold); assert.deepEqual(await pose(), selectionPose);
  await aim('muscular-toggle'); await hands([{ ...hold.hand, pinch: true }], 2); await hands([], 3); await hands([hold.hand], 3);
  assert.deepEqual((await inspect()).state, beforeHold);
  pass('button hold and tracking loss cancel without anatomical manipulation');
  // Start on the canvas, move across the tools: UI cannot steal this gesture.
  await hands([]); const canvasBox = await page.locator('canvas').boundingBox();
  const start = await atPoint({ x: canvasBox.x + canvasBox.width * .8, y: canvasBox.y + canvasBox.height * .35 });
  const endBox = await control('muscular-toggle').boundingBox(); const end = await atPoint({ x: endBox.x + 5, y: endBox.y + 5 }, true);
  await hands([start], 8); await hands([{ ...start, pinch: true }], 3);
  for (let i = 1; i <= 8; i++) await hands([{ ...end, u: start.u + (end.u - start.u) * i / 8, v: start.v + (end.v - start.v) * i / 8 }], 2);
  await hands([{ ...end, pinch: false }], 3); assert.ok(Math.abs((await pose()).rotation[1]) > .1); assert.equal((await inspect()).state.systemVisibility.muscular, true);
  await pinch('reset-view'); await page.waitForTimeout(500);
  const center = await atPoint({ x: canvasBox.x + canvasBox.width * .5, y: canvasBox.y + canvasBox.height * .45 });
  // A direct synthetic jump from UI to canvas now needs loss/reacquire + open settle.
  await hands([center], 16); await page.waitForFunction(() => document.querySelector('.xr-hand-cursor').dataset.tracking === 'tracking');
  await hands([{ ...center, pinch: true }, { ...center, id: 'Right', u: center.u + .15, pinch: true }], 3);
  await hands([{ ...center, u: center.u - .04, pinch: true }, { ...center, id: 'Right', u: center.u + .2, pinch: true }], 6);
  assert.ok((await pose()).scale > 1); await hands([]);
  pass('anatomy keeps ownership when crossing UI; normal two-hand scale reanchors after UI');
  // Real native controls remain usable with camera OFF.
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  assert.equal(await page.evaluate(() => window.handQa.stops), 1);
  await control('muscular-toggle').press('Space'); assert.equal((await inspect()).state.systemVisibility.muscular, false);
  await control('muscular-toggle').click(); await control('muscular-opacity').press('Home'); await control('muscular-opacity').press('ArrowRight');
  assert.equal(await control('muscular-opacity').inputValue(), '11');
  await control('reset-view').press('Enter'); await page.keyboard.press('Tab');
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
    await page.getByText('Activa', { exact: true }).waitFor();
    if (width === 390) { await pinch('layers-panel'); assert.equal(await page.locator('.xr-atlas-layers').getAttribute('open'), null); await pinch('layers-panel'); }
    await aim('muscular-toggle'); const was = (await inspect()).state.systemVisibility.muscular; await pinch('muscular-toggle');
    assert.equal((await inspect()).state.systemVisibility.muscular, !was);
    await pinch('muscular-toggle'); await slider('muscular-opacity', 50);
    if (width === 390) { await shot('10-mobile'); await hands([]); await control('skeletal-toggle').tap(); assert.equal((await inspect()).state.systemVisibility.skeletal, false); }
    await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  }
  pass('mouse/touch/native ranges/Space/Enter/Tab with camera off; actual hand hit targets at all five widths');
  assert.equal(glbs().length, 32);
  assert.ok(requests.filter(r => r.url.includes('/models/anatomy/')).every(r => /models\/anatomy\/(skeletal|muscular|cardiovascular)\//.test(r.url)));
  assert.ok(requests.every(r => r.method === 'GET' && r.url.startsWith(origin))); assert.deepEqual(errors, []);
  await page.getByRole('button', { name: 'Corazón', exact: true }).click(); await page.locator('[data-model-status="ready"]').waitFor();
  assert.equal(await page.locator('[data-xr-hand-control]').count(), 0); assert.equal(await page.locator('canvas').count(), 1);
  pass('network unchanged, no uploads/errors, registry and Atlas removed on mode exit');
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ synthetic: true, results, requests }, null, 2));
  console.log(JSON.stringify({ results }, null, 2));
} catch (error) { await page.screenshot({ path: `${output}/failure.png` }).catch(() => {}); throw error; }
finally { await browser.close(); }
