// Production build, real GLBs. Synthetic video; run both real MediaPipe (no hands) and synthetic landmark callbacks.
// These are local interval/CPU samples, not FPS or physical tracking validation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { installHandFixture } from './hand-browser-fixture.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const output = '.cache/xr-full-atlas'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const ids = ['skeletal', 'muscular', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary'];
const levels = [
  ['A', ['skeletal'], 205], ['B', ['skeletal', 'muscular', 'cardiovascular'], 549],
  ['C', ids.slice(0, 6), 904], ['D-before-skin', ids.slice(0, 10), 936], ['D', ids, 937],
];
const results = [];
try {
  for (const syntheticHands of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await context.addInitScript(() => { window.RealWorker = window.Worker; });
    await context.addInitScript(installHandFixture);
    await context.addInitScript(({ syntheticHands }) => {
      window.inferenceQa = { results: 0, cpu: [] };
      const Base = syntheticHands ? window.Worker : window.RealWorker;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.RealWorker.prototype, 'onmessage').set;
      window.Worker = class extends Base {
        constructor(...args) {
          super(...args);
          let listener = null;
          Object.defineProperty(this, 'onmessage', { get: () => listener, set: callback => {
            listener = event => {
              const start = performance.now(); callback?.(event);
              if (event.data.type === 'result') { window.inferenceQa.results++; window.inferenceQa.cpu.push(performance.now() - start); }
            };
            if (!syntheticHands) nativeSetter.call(this, listener);
          } });
        }
      };
    }, { syntheticHands });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(origin + '/med3d/experiencia-xr/?xrQa=1'); await page.getByRole('button', { name: 'Atlas XR', exact: true }).click();
    await page.waitForFunction(() => window.__med3dXrAtlas?.().meshes === 205);
    await page.getByRole('button', { name: 'Activar control con manos', exact: true }).click(); await page.getByText('Activa', { exact: true }).waitFor();
    for (const [level, active, meshes] of levels) {
      for (const id of active) await page.locator('[data-xr-hand-control="' + id + '-toggle"]').check();
      await page.waitForFunction(n => window.__med3dXrAtlas().meshes === n, meshes);
      await page.locator('[data-xr-hand-control="reset-view"]').scrollIntoViewIfNeeded();
      if (syntheticHands) await page.evaluate(() => {
        const w = document.querySelector('.xr-atlas-workspace').getBoundingClientRect(), c = document.querySelector('[data-xr-hand-control="reset-view"]').getBoundingClientRect();
        const left = Math.max(0, w.left), top = Math.max(0, w.top), right = Math.min(innerWidth, w.right), bottom = Math.min(innerHeight, w.bottom);
        const width = Math.max(right - left, (bottom - top) * 4 / 3), height = width / (4 / 3);
        window.handQa.hands = [{ id: 'Left', u: (c.x + c.width / 2 - left + (width - right + left) / 2) / width,
          v: (c.y + c.height / 2 - top + (height - bottom + top) / 2) / height, pinch: false }];
      });
      await page.waitForTimeout(2000);
      const start = await page.evaluate(() => { window.inferenceQa.cpu = []; return { time: performance.now(), count: window.inferenceQa.results }; });
      await page.waitForTimeout(4000);
      const measured = await page.evaluate(start => {
        const a = window.__med3dXrAtlas(), samples = window.inferenceQa.cpu;
        return { modules: a.modules.length, meshes: a.meshes, visibleMeshes: a.visibleMeshes, triangles: a.triangles, bytes: a.bytes, geometryBytes: a.geometryBytes,
          frameIntervalMs: a.frameIntervalMs, renderCpuMs: a.renderCpuMs, drawCalls: a.drawCalls,
          inferencesPerSecond: (window.inferenceQa.results - start.count) / ((performance.now() - start.time) / 1000),
          inputCallbackCpuMs: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : null,
          uiHover: document.querySelector('.xr-atlas-page>.xr-hand-cursor')?.getAttribute('data-ui-control') ?? null };
      }, start);
      assert.ok(measured.inferencesPerSecond > 0); assert.ok(measured.drawCalls >= meshes);
      if (syntheticHands) assert.equal(measured.uiHover, 'reset-view');
      results.push({ level, active, syntheticHands, ...measured }); console.log(JSON.stringify(results.at(-1)));
    }
    assert.deepEqual(errors, []); await context.close();
  }
  await writeFile(output + '/performance.json', JSON.stringify({ video: 'synthetic', physicalValidation: false, results }, null, 2));
} finally { await browser.close(); }
