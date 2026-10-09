// Repeatable local comparison. Synthetic video is not physical hand validation or an FPS measurement.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184', label = process.argv[4] || 'current';
const output = '.cache/xr-gesture-ui'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
try {
  for (const syntheticHands of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await context.addInitScript(() => { window.RealWorker = window.Worker; });
    await context.addInitScript(installHandFixture);
    await context.addInitScript(({ syntheticHands }) => {
      window.inferenceQa = { results: 0, cpu: [] };
      const Base = syntheticHands ? window.Worker : window.RealWorker;
      window.Worker = class extends Base {
        constructor(...args) {
          super(...args);
          if (syntheticHands) {
            let listener = null;
            Object.defineProperty(this, 'onmessage', { get: () => listener, set: callback => {
              listener = event => { const start = performance.now(); callback?.(event); if (event.data.type === 'result') { window.inferenceQa.results++; window.inferenceQa.cpu.push(performance.now() - start); } };
            } });
          } else this.addEventListener('message', event => { if (event.data.type === 'result') window.inferenceQa.results++; });
        }
      };
    }, { syntheticHands });
    const page = await context.newPage(); page.setDefaultTimeout(45000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1'); await page.getByRole('button', { name: 'Atlas XR', exact: true }).click();
    await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
    await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
    for (const [system, meshes] of [['Óseo', 205], ['Muscular', 387], ['Cardiovascular', 549]]) {
      if (system !== 'Óseo') await page.getByRole('checkbox', { name: system, exact: true }).check();
      await page.waitForFunction(n => window.__med3dXrAtlas().meshes === n, meshes);
      if (syntheticHands) {
        await page.locator('.xr-atlas-workspace').scrollIntoViewIfNeeded();
        await page.evaluate(() => {
          const workspace = document.querySelector('.xr-atlas-workspace').getBoundingClientRect();
          const control = document.querySelector('input[type=checkbox]').getBoundingClientRect();
          const left = Math.max(0, workspace.left), top = Math.max(0, workspace.top);
          const w = Math.min(innerWidth, workspace.right) - left, h = Math.min(innerHeight, workspace.bottom) - top;
          const width = Math.max(w, h * 4 / 3), height = width / (4 / 3);
          window.handQa.hands = [{ id: 'Left', u: (control.x + control.width / 2 - left + (width - w) / 2) / width,
            v: (control.y + control.height / 2 - top + (height - h) / 2) / height, pinch: false }];
        });
      }
      await page.waitForTimeout(500);
      const start = await page.evaluate(() => { window.inferenceQa.cpu = []; return { time: performance.now(), count: window.inferenceQa.results }; });
      await page.waitForTimeout(3000);
      const measured = await page.evaluate(start => {
        const { frameIntervalMs, renderCpuMs, drawCalls } = window.__med3dXrAtlas();
        const samples = window.inferenceQa.cpu;
        return { frameIntervalMs, renderCpuMs, drawCalls, inferencesPerSecond: (window.inferenceQa.results - start.count) / ((performance.now() - start.time) / 1000),
          inputCallbackCpuMs: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
          uiHover: document.querySelector('.xr-atlas-page>.xr-hand-cursor')?.getAttribute('data-ui-control') ?? null };
      }, start);
      assert.ok(measured.inferencesPerSecond > 0); results.push({ system, syntheticHands, ...measured });
    }
    assert.deepEqual(errors, []); await context.close();
  }
  await writeFile(`${output}/performance-${label}.json`, JSON.stringify({ label, results }, null, 2));
  console.log(JSON.stringify({ label, results }, null, 2));
} finally { await browser.close(); }
