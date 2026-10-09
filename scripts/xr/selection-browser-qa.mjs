// Real Chromium input/raycast checks against a local production build.
// Camera video is synthetic; this script never requests a physical webcam.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const output = '.cache/xr-selection';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
const pause = page => page.waitForTimeout(450);
const title = page => page.locator('#xr-education-title').textContent();
const shot = (page, name) => page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
const clear = async page => { await page.keyboard.press('Escape'); assert.equal(await page.locator('.xr-education-card').count(), 0); };
const reset = async page => { await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click(); await pause(page); };
async function open(viewport) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: true });
  await context.addInitScript(() => {
    window.xrSelectionQa = { calls: 0, stops: 0, frames: 0 };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { configurable: true, value: async () => {
      window.xrSelectionQa.calls++;
      const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
      const ctx = canvas.getContext('2d'); let frame = 0;
      const timer = setInterval(() => {
        ctx.fillStyle = ++frame % 2 ? '#15272d' : '#172a30'; ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#aecdd4'; ctx.font = '24px sans-serif'; ctx.fillText('VIDEO SINTÉTICO', 190, 240);
      }, 50);
      const stream = canvas.captureStream(20);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => { window.xrSelectionQa.stops++; clearInterval(timer); stop(); };
      }
      return stream;
    } });
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args);
        this.addEventListener('message', event => { if (event.data.type === 'result') window.xrSelectionQa.frames++; });
      }
    };
  });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = [], glbs = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.url().endsWith('.glb')) glbs.push(request.url()); });
  await page.goto(origin + '/med3d/experiencia-xr/');
  await page.locator('[data-model-status="ready"]').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; window.xrOriginalCanvas = document.querySelector('.xr-scene canvas'); });
  await pause(page);
  return { page, context, errors, glbs };
}
async function input(page, x, y, touch = false) {
  if (touch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y);
  await page.waitForTimeout(70);
}
async function findStructure(page, { except, touch = false } = {}) {
  const canvas = page.locator('.xr-scene canvas');
  await canvas.scrollIntoViewIfNeeded(); const box = await canvas.boundingBox();
  // Input coordinates are test probes, not application picking logic.
  for (const y of [.53, .43, .63, .34, .7]) for (const x of [.5, .6, .4, .66, .34]) {
    await input(page, box.x + box.width * x, box.y + box.height * y, touch);
    if (await page.locator('.xr-education-card').count()) {
      const name = await title(page);
      if (name !== except) return name;
    }
  }
  throw new Error('No visible structure found' + (except ? ` other than ${except}` : ''));
}
async function drag(page, dx, dy) {
  const box = await page.locator('.xr-scene canvas').boundingBox();
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .5 + dx, box.y + box.height * .5 + dy, { steps: 12 });
  await page.mouse.up(); await pause(page);
}
async function continuous({ page, glbs, errors }) {
  assert.equal(await page.evaluate(() => document.querySelector('.xr-scene canvas') === window.xrOriginalCanvas), true);
  assert.equal(glbs.length, 1); assert.ok(glbs[0].endsWith('/models/heart.glb')); assert.deepEqual(errors, []);
}
try {
  const desktop = await open({ width: 1366, height: 1000 }); const { page } = desktop;
  assert.equal(await page.locator('.xr-education-card').count(), 0);
  assert.equal(await page.locator('.xr-selection-prompt').isVisible(), true);
  assert.equal(await page.evaluate(() => window.xrSelectionQa.calls), 0);
  await shot(page, '01-xr-sin-seleccion'); console.log('Desktop loaded.');
  const canvas = page.locator('.xr-scene canvas'); const original = await canvas.screenshot();
  const a = await findStructure(page); await pause(page); await shot(page, '02-estructura-seleccionada');
  assert.ok((await page.locator('.xr-selection-announcement').textContent()).includes(a));
  const b = await findStructure(page, { except: a }); assert.notEqual(a, b);
  await pause(page); await shot(page, '03-otra-estructura');
  await page.getByRole('button', { name: 'Cerrar ficha educativa y limpiar selección' }).click();
  assert.equal(await page.locator('.xr-education-card').count(), 0);
  assert.equal(await page.locator('.xr-viewport').evaluate(element => element === document.activeElement), true);
  await pause(page); await shot(page, '04-ficha-cerrada');
  assert.ok((await canvas.screenshot()).equals(original), 'closing must restore the unselected appearance exactly');
  const selected = await findStructure(page);
  await drag(page, 105, 35); assert.equal(await title(page), selected, 'drag must preserve selection');
  await clear(page); await drag(page, -45, 10);
  assert.equal(await page.locator('.xr-education-card').count(), 0, 'drag must not select');
  const rotated = await canvas.screenshot(); assert.ok(!rotated.equals(original));
  await page.mouse.wheel(0, -110); await pause(page);
  assert.ok(!(await canvas.screenshot()).equals(rotated), 'wheel must scale');
  const transformed = await findStructure(page); await pause(page); await shot(page, '05-rotado-escalado-seleccionado');
  const empty = await canvas.boundingBox(); await input(page, empty.x + 12, empty.y + 150);
  assert.equal(await page.locator('.xr-education-card').count(), 0, 'empty click must deselect');
  await findStructure(page); await clear(page); await continuous(desktop);
  results.push({ test: 'click A → B, real rotated/scaled picking, empty click, Escape, close/focus, exact visual restore, drag preserves/never selects, wheel, same canvas and single GLB', a, b, transformed, passed: true });

  // A real MediaPipe Worker processes synthetic video while manual selection remains available.
  await reset(page);
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.waitForFunction(() => window.xrSelectionQa.frames > 2, null, { timeout: 60000 });
  await page.getByText('Activa', { exact: true }).waitFor();
  const withCamera = await findStructure(page); assert.ok(withCamera);
  await clear(page);
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  await page.getByText('Desactivada', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => window.xrSelectionQa.stops), 1);
  await continuous(desktop);
  results.push({ test: 'manual selection with real MediaPipe active on synthetic video, camera shutdown', structure: withCamera, passed: true });
  console.log('Desktop and active-camera selection passed.');
  await desktop.context.close();

  const mobile = await open({ width: 390, height: 844 }); const mp = mobile.page;
  await mp.locator('.xr-scene canvas').scrollIntoViewIfNeeded();
  const mobileName = await findStructure(mp, { touch: true }); await pause(mp); console.log('Mobile selected.');
  const sheet = await mp.locator('.xr-education-card').boundingBox();
  assert.ok(sheet.height <= 844 * .44 + 1); assert.ok(Math.abs(sheet.y + sheet.height - 844) <= 1);
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.ok((await mp.locator('.xr-scene canvas').boundingBox()).y < 100);
  await mp.screenshot({ path: `${output}/06-mobile-bottom-sheet.png` });
  const mc = mp.locator('.xr-scene canvas'); const mb = await mc.boundingBox();
  await input(mp, mb.x + 10, mb.y + 120, true);
  assert.equal(await mp.locator('.xr-education-card').count(), 0, 'empty tap must deselect');
  const beforeTouch = await mc.screenshot();
  const cdp = await mobile.context.newCDPSession(mp);
  const cx = mb.x + mb.width / 2, cy = mb.y + mb.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 50, y: cy + 20, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(mp);
  assert.equal(await mp.locator('.xr-education-card').count(), 0, 'touch drag must not select');
  assert.ok(!(await mc.screenshot()).equals(beforeTouch), 'touch drag must rotate');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 60, y: cy, id: 1 }, { x: cx + 60, y: cy, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 40, y: cy, id: 1 }, { x: cx + 40, y: cy, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(mp);
  assert.equal(await mp.locator('.xr-education-card').count(), 0, 'multitouch must not select');
  await findStructure(mp, { touch: true });
  await mp.getByRole('button', { name: 'Cerrar ficha educativa y limpiar selección' }).tap();
  assert.equal(await mp.locator('.xr-education-card').count(), 0);
  await continuous(mobile); await cdp.detach(); await mobile.context.close();
  results.push({ test: 'mobile genuine pointer touch: tap, empty tap, drag, pinch, transformed tap, close, bottom sheet, same canvas/single GLB, no horizontal overflow', structure: mobileName, passed: true });
  await writeFile(`${output}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
} finally { await browser.close(); }
