import { installHandFixture } from './hand-browser-fixture.mjs';
// Synthetic video + landmarks, real browser input, production interaction code and heart raycasts.
// QA labels are injected only here. No physical webcam is used.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const output = '.cache/xr-hand-selection'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [], errors = [], requests = [];
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, deviceScaleFactor: 1, hasTouch: true });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(15000);
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
const canvas = page.locator('.xr-scene canvas'), cursor = page.locator('.xr-hand-cursor');
const title = () => page.locator('#xr-education-title').textContent();
const cardCount = () => page.locator('.xr-education-card').count();
const pause = () => page.waitForTimeout(450);
const shot = name => page.screenshot({ path: `${output}/${name}.png`, fullPage: false });
async function hands(value, frames = 1) {
  const before = await page.evaluate(value => { window.handQa.hands = value; return window.handQa.frames; }, value);
  await page.waitForFunction(({ before, frames }) => window.handQa.frames >= before + frames, { before, frames });
}
const one = (u = .5, v = .53, pinch = false, id = 'Left') => ({ id, u, v, pinch });
async function point(u = .5, v = .53) { await hands([one(u, v)], 8); await cursor.waitFor({ state: 'visible' }); }
async function pinch(u = .5, v = .53) {
  await hands([one(u, v, true)]);
  assert.equal(await cursor.getAttribute('data-candidate'), 'true');
  await hands([one(u, v)]);
  await page.waitForTimeout(60);
}
async function clear() { await page.keyboard.press('Escape'); assert.equal(await cardCount(), 0); await pause(); }
async function findSelection(except) {
  for (const [u, v] of [[.5, .53], [.67, .57], [.34, .5], [.58, .4], [.45, .65]]) {
    await point(u, v);
    if (await cursor.getAttribute('data-hover') !== 'true') continue;
    await pinch(u, v);
    if (await cardCount() && await title() !== except) return { u, v, name: await title() };
  }
  throw new Error('No hand-selectable visible structure found' + (except ? ` other than ${except}` : ''));
}
try {
  await page.goto(origin + '/med3d/experiencia-xr/'); await page.locator('[data-model-status="ready"]').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; window.originalHandCanvas = document.querySelector('.xr-scene canvas'); });
  assert.equal(await cursor.isVisible(), false); assert.equal(await page.evaluate(() => window.handQa.calls), 0);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.getByText('Activa', { exact: true }).waitFor();
  await point(.08, .2); assert.equal(await cursor.getAttribute('data-hover'), 'false'); await shot('01-cursor-apuntando-simulado');
  await point(); assert.equal(await cursor.getAttribute('data-hover'), 'true'); assert.equal(await cardCount(), 0);
  await shot('02-hover-estructura-simulado');
  const beforeSelect = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await pinch(); const a = await title(); await shot('03-pinch-seleccion-simulado');
  await clear(); const restoredPose = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  if (!restoredPose.equals(beforeSelect)) { await writeFile(`${output}/pose-before.png`, beforeSelect); await writeFile(`${output}/pose-after.png`, restoredPose); }
  assert.ok(restoredPose.equals(beforeSelect), 'short pinch must not rotate at all');
  const first = await findSelection(), second = await findSelection(first.name); assert.notEqual(first.name, second.name);
  await shot('04-ficha-estructura-b-simulada');
  results.push({ test: 'index pointer, hover without selection, short pinch with zero rotation, A → B, same educational card', a, b: second.name, passed: true });
  console.log('Pointer, short pinch and A → B passed.');

  // Pinch+movement and hold must never become clicks on release.
  await clear(); await point(); const beforeRotate = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await hands([one(.5, .53, true)]); await hands([one(.56, .58, true)], 3);
  await page.getByText('Rotar', { exact: true }).waitFor(); await shot('05-rotacion-manos-simulada');
  await hands([one(.5, .53)], 3); await pause(); assert.equal(await cardCount(), 0);
  assert.ok(!(await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(beforeRotate));
  await point(); await hands([one(.5, .53, true)], 9);
  await page.getByText('Rotar', { exact: true }).waitFor(); const held = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await hands([one(.515, .53, true)], 3); await pause();
  assert.ok(!(await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(held));
  await hands([one()], 3); assert.equal(await cardCount(), 0);
  results.push({ test: 'pinch+move rotates, return/release never selects; hold enables slow rotation', passed: true });

  await point(.4, .53); await hands([one(.4, .53, true)]);
  await hands([one(.4, .53, true), one(.65, .53, true, 'Right')], 3);
  await page.getByText('Escalar', { exact: true }).waitFor(); const beforeScale = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await hands([one(.33, .53, true), one(.72, .53, true, 'Right')], 5); await pause();
  assert.ok(!(await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(beforeScale)); await shot('06-escala-dos-manos-simulada');
  await hands([one(.33, .53, true)], 2); await hands([one(.33, .53)], 2); assert.equal(await cardCount(), 0);
  const transformed = await findSelection(); assert.ok(transformed.name);
  results.push({ test: 'second pinch cancels candidate, two-hand scale, no release click, raycast/card on rotated and scaled real heart', structure: transformed.name, passed: true });

  const openCard = await title(), cardPose = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await point(); await hands([one(.5, .53, true)]); await hands([one(.56, .53, true)], 3); await pause();
  assert.equal(await title(), openCard);
  assert.ok(!(await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(cardPose));
  await hands([one(.56, .53, true), one(.8, .53, true, 'Right')], 3);
  const cardScale = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await hands([one(.5, .53, true), one(.86, .53, true, 'Right')], 4); await pause();
  assert.equal(await title(), openCard);
  assert.ok(!(await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(cardScale));
  await hands([one()], 3); await pause();
  results.push({ test: 'open educational card preserves selection while hands rotate and scale', passed: true });

  // Loss must preserve selection; recovery with an already closed hand is not a click.
  const selectedBeforeLoss = await title(); await hands([], 2); assert.equal(await cursor.isVisible(), false);
  assert.equal(await title(), selectedBeforeLoss); const beforeRecovery = await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
  await hands([one(.7, .4, true)], 2); await hands([one(.7, .4)], 2);
  assert.equal(await title(), selectedBeforeLoss); assert.ok((await canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' })).equals(beforeRecovery));
  await point(.5, .53); const primary = await cursor.boundingBox();
  await hands([one(.8, .4, false, 'Right'), one(.5, .53)], 3);
  await hands([one(.5, .53), one(.8, .4, false, 'Right')], 3);
  const reordered = await cursor.boundingBox(); assert.ok(Math.abs(primary.x - reordered.x) < 1);
  await point(.08, .2); await pinch(.08, .2); assert.equal(await cardCount(), 0, 'valid empty pinch clears');
  await point(); await hands([one(1.1, .5)], 2); assert.equal(await cursor.isVisible(), false); assert.equal(await cardCount(), 0);
  results.push({ test: 'loss/recovery without jumps or false clicks, sticky primary across reordered hands, empty pinch clears, outside pointer hidden', passed: true });

  await point(); const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down();
  await hands([one(.5, .53, true)], 2); assert.equal(await cursor.isVisible(), false);
  await page.mouse.move(box.x + box.width * .5 + 40, box.y + box.height * .5 + 15, { steps: 5 }); await page.mouse.up();
  await hands([one()], 8); assert.equal(await cardCount(), 0);
  await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click(); await pause();
  await canvas.click({ position: { x: box.width * .5, y: box.height * .53 } });
  assert.ok(await cardCount()); await clear();
  await point(); await pinch(); assert.ok(await cardCount()); await clear();
  results.push({ test: 'manual drag overrides hand candidate, manual click, reanchor, gesture selection resumes, Escape', passed: true });

  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await canvas.scrollIntoViewIfNeeded(); await point(.5, .53);
    const r = await canvas.boundingBox(), c = await cursor.boundingBox();
    const fittedHeight = Math.min(r.height, r.width / (4 / 3));
    assert.ok(Math.abs(c.x + c.width / 2 - (r.x + r.width / 2)) < 1);
    assert.ok(Math.abs(c.y + c.height / 2 - (r.y + (r.height - fittedHeight) / 2 + .53 * fittedHeight)) < 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    results.push({ test: 'responsive cursor projection', width, passed: true });
  }
  await findSelection(); await pause(); await shot('07-mobile-pinch-simulado');
  const sheet = await page.locator('.xr-education-card').boundingBox(); assert.ok(sheet.height <= 844 * .44 + 1);
  const beforeStall = await title(); await page.evaluate(() => { window.handQa.frozen = true; });
  await page.waitForTimeout(400); assert.equal(await cursor.isVisible(), false); assert.equal(await title(), beforeStall);
  results.push({ test: 'stalled inference hides stale cursor and cancels gesture without clearing the card', passed: true });
  await clear();
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  await page.getByText('Desactivada', { exact: true }).waitFor(); assert.equal(await cursor.isVisible(), false);
  assert.equal(await page.evaluate(() => window.handQa.stops), 1);
  await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click(); await pause();
  await canvas.scrollIntoViewIfNeeded(); const mobileRect = await canvas.boundingBox();
  await page.touchscreen.tap(mobileRect.x + mobileRect.width / 2, mobileRect.y + mobileRect.height * .53);
  assert.ok(await cardCount()); await clear();
  assert.equal(await page.evaluate(() => window.originalHandCanvas === document.querySelector('.xr-scene canvas')), true);
  assert.equal(requests.filter(request => request.url.endsWith('/models/heart.glb')).length, 1);
  assert.ok(requests.every(request => request.method === 'GET' && request.url.startsWith(origin)));
  assert.deepEqual(errors, []);
  results.push({ test: 'mobile sheet, camera shutdown/manual touch, persistent canvas/single GLB, local GETs only, no page errors', passed: true });
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ synthetic: true, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} catch (error) {
  await shot('failure-simulated').catch(() => {}); throw error;
} finally { await browser.close(); }
