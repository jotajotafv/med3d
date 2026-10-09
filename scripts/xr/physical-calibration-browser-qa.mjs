// Real browser/raycast, synthetic video and landmarks. This is not physical validation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const production = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const development = process.env.XR_QA_DEV_ORIGIN || 'http://127.0.0.1:5173';
const output = '.cache/xr-physical-calibration'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
await context.addInitScript(installHandFixture);
const page = await context.newPage(); page.setDefaultTimeout(20000);
const errors = [], results = [];
page.on('pageerror', error => errors.push(error.message));
const cursor = page.locator('.xr-hand-cursor'), debug = page.locator('.xr-calibration-debug');
const canvas = page.locator('.xr-scene canvas');
const pose = () => canvas.screenshot({ style: '.xr-hand-cursor,.xr-camera-preview{visibility:hidden!important}' });
const shot = name => page.screenshot({ path: `${output}/${name}.png` });
const values = () => debug.locator('dd').allTextContents();
async function load(origin, query = '') {
  await page.goto(origin + '/med3d/experiencia-xr/' + query);
  await page.locator('[data-model-status="ready"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
}
async function activate() {
  await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
  await page.getByText('Activa', { exact: true }).waitFor();
  await page.evaluate(() => { window.handQa.hands = [{ id: 'Left', u: .5, v: .53, ratio: .5 }]; });
  await cursor.waitFor({ state: 'visible' }); await page.waitForTimeout(800);
}
async function motion(duration, { open = false, deliberate = false, u = .5, v = .53 } = {}) {
  await page.evaluate(({ duration, open, deliberate, u, v }) => {
    const qa = window.handQa; qa.done = false; qa.confirmed = false; qa.rotated = false;
    qa.observer?.disconnect();
    qa.observer = new MutationObserver(() => {
      const cursor = document.querySelector('.xr-hand-cursor');
      if (cursor?.dataset.confirmed === 'true') qa.confirmed = true;
      if (cursor?.dataset.rotating === 'true') qa.rotated = true;
    });
    qa.observer.observe(document.querySelector('.xr-hand-cursor'), { attributes: true });
    let start;
    qa.sample = timestamp => {
      start ??= timestamp; const elapsed = timestamp - start;
      if (elapsed >= duration) {
        qa.hands = [{ id: 'Left', u, v, ratio: .5 }]; qa.sample = null; qa.done = true;
        return qa.hands;
      }
      const i = elapsed / 50;
      return [{ id: 'Left', u: u + (deliberate ? Math.min(.065, elapsed / 2000) : Math.sin(i * 1.7) * .010),
        v: v + Math.sin(i * 2.3) * .009,
        ratio: open ? .48 + Math.sin(i) * .03 : (elapsed === 0 ? .33 : .36 + Math.sin(i) * .035) }];
    };
  }, { duration, open, deliberate, u, v });
  await page.waitForFunction(() => window.handQa.done);
  await page.waitForTimeout(160);
}
try {
  await load(production, '?xrDebug=1'); assert.equal(await debug.count(), 0);
  results.push({ test: 'production ignores xrDebug query', passed: true });
  await load(development); assert.equal(await debug.count(), 0);
  await load(development, '?xrDebug=1'); assert.equal(await debug.count(), 1);
  assert.equal(await debug.locator('dd').count(), 7); assert.equal((await values())[6], 'none'); await activate();
  const initial = await pose();
  await motion(900, { open: true });
  assert.ok((await pose()).equals(initial)); assert.equal(await debug.locator('dd').count(), 7); assert.equal((await values())[6], 'none');
  assert.equal(await page.locator('.xr-education-card').count(), 0);
  results.push({ test: 'moderate open-hand jitter: no rotation or selection', passed: true });
  await shot('01-jitter-apuntando-simulado');
  for (const duration of [350, 430, 490]) {
    await motion(duration);
    assert.equal(await page.locator('.xr-education-card').count(), 1);
    const summary = await values(); assert.equal(summary.length, 7);
    assert.equal(summary[0], 'tracking'); assert.ok(Number.isFinite(Number(summary[1])));
    assert.equal(summary[6], 'select');
    assert.equal(await page.evaluate(() => window.handQa.confirmed), true);
    assert.equal(await page.evaluate(() => window.handQa.rotated), false);
    results.push({ test: 'natural pinch + candidate jitter opens existing card and confirms', requestedDurationMs: duration, summary, passed: true });
    await shot(`02-seleccion-${duration}ms-simulada`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    const after = await pose();
    if (!after.equals(initial)) { await writeFile(`${output}/pose-before.png`, initial); await writeFile(`${output}/pose-after.png`, after); }
    assert.ok(after.equals(initial), 'candidate must produce zero visible rotation');
  }
  await motion(350, { deliberate: true });
  assert.equal((await values())[6], 'rotate'); assert.equal(await page.locator('.xr-education-card').count(), 0);
  assert.equal(await page.evaluate(() => window.handQa.rotated), true); assert.ok(!(await pose()).equals(initial));
  results.push({ test: 'deliberate movement rotates; return and release never select', summary: await values(), passed: true });
  await shot('03-movimiento-intencional-simulado');
  await motion(650); assert.equal((await values())[6], 'rotate'); assert.equal(await page.locator('.xr-education-card').count(), 0);
  results.push({ test: 'hold above 550 ms rotates without selection', summary: await values(), passed: true });
  await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click(); await page.waitForTimeout(800);
  await motion(350); assert.equal(await page.locator('.xr-education-card').count(), 1);
  await page.evaluate(() => { window.handQa.hands = [{ id: 'Left', u: .08, v: .2, ratio: .5 }]; }); await page.waitForTimeout(800);
  await motion(350, { u: .08, v: .2 }); assert.equal(await page.locator('.xr-education-card').count(), 0);
  assert.equal((await values())[6], 'select');
  results.push({ test: 'valid empty pinch still deselects', passed: true });
  await page.evaluate(() => { window.handQa.hands = [{ id: 'Left', u: .5, v: .53, ratio: .5 }]; }); await page.waitForTimeout(800);
  await page.evaluate(() => { window.handQa.hands[0].ratio = .33; });
  await page.waitForFunction(() => document.querySelector('.xr-hand-cursor').dataset.candidate === 'true');
  await page.evaluate(() => { window.handQa.hands = []; });
  await cursor.waitFor({ state: 'hidden' }); assert.equal((await values())[6], 'cancel');
  assert.equal(await page.locator('.xr-education-card').count(), 0);
  results.push({ test: 'tracking loss cancels without false selection; debug replaces previous summary', passed: true });
  await page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
  assert.equal(await page.evaluate(() => window.handQa.stops), 1);
  await page.reload(); await debug.waitFor(); assert.equal(await debug.locator('dd').count(), 7); assert.equal((await values())[6], 'none');
  assert.equal(await page.evaluate(() => window.handQa.calls), 0);
  results.push({ test: 'camera cleanup; reload clears derived debug and does not activate camera', passed: true });
  assert.deepEqual(errors, []);
  await writeFile(`${output}/calibration-browser-results.json`, JSON.stringify({ synthetic: true, results }, null, 2));
  console.log(JSON.stringify(results, null, 2));
} catch (error) { await shot('failure-simulated').catch(() => {}); throw error; }
finally { await browser.close(); }
