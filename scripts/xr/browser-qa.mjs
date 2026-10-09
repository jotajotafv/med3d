// Run against a local build server. Camera inputs here are entirely synthetic.
// XR_PLAYWRIGHT_MODULE and XR_BROWSER_EXECUTABLE allow using an existing QA install.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.XR_PLAYWRIGHT_MODULE || process.argv[2] || 'playwright');
const origin = process.env.XR_QA_ORIGIN || 'http://127.0.0.1:5184';
const output = '.cache/xr-phase1';
await mkdir(output, { recursive: true });
const executablePath = process.env.XR_BROWSER_EXECUTABLE || process.argv[3];
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
const contexts = [];

function syntheticEnvironment(options) {
  const qa = window.xrQa = { calls: 0, stops: 0, frames: 0, closed: 0, workers: 0, hands: [], resolveCamera: null, stream: null };
  const camera = () => {
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d'); let frame = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = ++frame % 2 ? '#15272d' : '#172a30'; ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#aecdd4'; ctx.font = '24px sans-serif'; ctx.fillText('VIDEO SINTÉTICO', 190, 240);
    }, 50);
    const stream = canvas.captureStream(20); qa.stream = stream;
    for (const track of stream.getTracks()) {
      const stop = track.stop.bind(track);
      track.stop = () => { qa.stops++; clearInterval(timer); stop(); };
    }
    return stream;
  };
  if (options.noCamera) Object.defineProperty(navigator, 'mediaDevices', { value: undefined });
  else Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async constraints => {
    qa.calls++; if (constraints.audio !== false) throw Error('Microphone requested');
    if (options.cameraError) throw new DOMException('Synthetic test', options.cameraError);
    if (options.pending) return new Promise(resolve => { qa.resolveCamera = () => resolve(camera()); });
    return camera();
  } });
  Object.defineProperty(navigator, 'xr', { value: options.xr ? {
    isSessionSupported: async mode => options.xr === 'supported' || mode === 'immersive-vr' && options.xr === 'vr',
    addEventListener() {}, removeEventListener() {}, requestSession() { throw Error('Out-of-scope XR session requested'); },
  } : undefined });
  if (options.mockWorker) {
    window.Worker = class {
      onmessage = null; onerror = null;
      constructor() { qa.workers++; }
      postMessage(message) {
        if (message.type === 'close') { qa.closed++; queueMicrotask(() => this.onmessage?.({ data: { type: 'closed' } })); return; }
        if (message.type === 'init') {
          setTimeout(() => this.onmessage?.({ data: { type: options.workerError ? 'error' : 'ready' } }), 25); return;
        }
        message.bitmap.close(); qa.frames++;
        const landmarks = qa.hands.map(hand => {
          const x = 1 - hand.x, y = hand.y;
          const points = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
          points[0] = { x, y: y + 0.12, z: 0 }; points[9] = { x, y: y - 0.12, z: 0 };
          points[4] = { x: x - (hand.open ? 0.09 : 0.009), y, z: 0 };
          points[8] = { x: x + (hand.open ? 0.09 : 0.009), y, z: 0 }; return points;
        });
        const handedness = qa.hands.map(hand => [{ categoryName: hand.id, score: 0.99 }]);
        queueMicrotask(() => this.onmessage?.({ data: { type: 'result', timestamp: message.timestamp, frame: { landmarks, handedness } } }));
      }
      terminate() {}
    };
  } else {
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      constructor(...args) {
        super(...args); qa.workers++;
        this.addEventListener('message', event => { if (event.data.type === 'result') qa.frames++; if (event.data.type === 'closed') qa.closed++; });
      }
    };
  }
  document.addEventListener('DOMContentLoaded', () => {
    if (!options.label) return;
    const banner = document.createElement('div'); banner.textContent = 'SIMULACIÓN QA · Sin webcam física';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#392c14;color:#ffe1a5;text-align:center;padding:8px;font:12px system-ui;pointer-events:none';
    document.body.append(banner);
  });
}

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1366, height: 1000 }, deviceScaleFactor: 1 });
  contexts.push(context); await context.addInitScript(syntheticEnvironment, options);
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push({ url: request.url(), method: request.method() }));
  if (options.modelError) await page.route('**/models/heart.glb', route => route.fulfill({ status: 503, body: 'Synthetic outage' }));
  await page.goto(origin + '/med3d/experiencia-xr/');
  await page.locator(options.modelError ? '[data-model-status="error"]' : '[data-model-status="ready"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors, requests };
}
const pause = page => page.waitForTimeout(400);
const shot = (page, name) => page.screenshot({ path: output + '/' + name + '.png', fullPage: true });
const activate = page => page.getByRole('button', { name: 'Activar control con manos', exact: true }).click();
const deactivate = page => page.getByRole('button', { name: 'Desactivar control con manos', exact: true }).click();
async function expectStatus(page, text) { await page.getByText(text, { exact: true }).waitFor(); }

try {
  const normal = await open(); const page = normal.page;
  assert.equal(await page.evaluate(() => window.xrQa.calls), 0);
  assert.equal(normal.requests.some(r => /wasm|hand-tracking|hand_landmarker/.test(r.url)), false);
  assert.deepEqual(normal.requests.filter(r => r.url.endsWith('.glb')).map(r => r.url.split('/').at(-1)), ['heart.glb']);
  await pause(page); await shot(page, '01-desktop-inicial');
  const canvas = page.locator('.xr-scene canvas'); const initial = await canvas.screenshot();
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 35, { steps: 12 }); await page.mouse.up();
  await pause(page); assert.notDeepEqual(await canvas.screenshot(), initial);
  await shot(page, '02-corazon-cargado');
  await page.getByRole('button', { name: 'Restablecer rotación y escala del corazón' }).click(); await pause(page);
  await page.locator('.xr-viewport').focus(); await page.keyboard.press('ArrowRight'); await pause(page);
  assert.notDeepEqual(await canvas.screenshot(), initial);
  await page.keyboard.press('0'); await page.mouse.wheel(0, -150); await pause(page);
  assert.notDeepEqual(await canvas.screenshot(), initial);
  await page.getByRole('button', { name: /Disfrutar experiencia RA/ }).click();
  await expectStatus(page, 'Tu dispositivo no ofrece WebXR AR inmersivo. Puedes utilizar el control por cámara y manos.');
  await shot(page, '07-sin-webxr');
  for (const width of [1366, 1050, 900, 768, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 }); await pause(page);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const controls = await page.locator('.xr-primary-button').boundingBox(); assert.ok(controls.width > 180);
    await shot(page, width === 390 ? '08-mobile' : 'responsive-' + width);
    results.push({ test: 'responsive', width, overflow: false });
  }
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Inicio', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click();
  await canvas.scrollIntoViewIfNeeded();
  const cdp = await normal.context.newCDPSession(page);
  const touchBox = await canvas.boundingBox();
  const cx = touchBox.x + touchBox.width / 2, cy = touchBox.y + touchBox.height / 2;
  const beforeTouch = await canvas.screenshot();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx + 45, y: cy + 25, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page);
  assert.notDeepEqual(await canvas.screenshot(), beforeTouch);
  const beforeTouchScale = await canvas.screenshot();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx - 65, y: cy, id: 1 }, { x: cx + 65, y: cy, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx - 35, y: cy, id: 1 }, { x: cx + 35, y: cy, id: 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await pause(page);
  assert.notDeepEqual(await canvas.screenshot(), beforeTouchScale);
  await cdp.detach();
  assert.deepEqual(normal.errors, []);
  results.push({ test: 'manual mouse / keyboard / wheel / touch drag and two-finger zoom, lazy assets, AR fallback, mobile navigation', passed: true });

  const pending = await open({ pending: true, mockWorker: true, label: true });
  await activate(pending.page); await expectStatus(pending.page, 'Permiso pendiente'); await shot(pending.page, '03-permiso-pendiente-simulado');
  await pending.page.getByRole('button', { name: 'Cancelar activación del control con manos' }).click();
  await pending.page.evaluate(() => window.xrQa.resolveCamera());
  await pending.page.waitForFunction(() => window.xrQa.stops === 1);
  assert.equal(await pending.page.evaluate(() => window.xrQa.workers), 0);
  results.push({ test: 'late camera permission after cancellation stops tracks; no worker started', passed: true });
  await pending.context.close();

  for (const [name, message] of [['NotAllowedError', 'denegado'], ['NotFoundError', 'No encontramos'], ['NotReadableError', 'ocupada']]) {
    const item = await open({ cameraError: name }); await activate(item.page);
    await item.page.getByRole('alert').filter({ hasText: message }).waitFor();
    assert.equal(await item.page.locator('.xr-scene canvas').count(), 1); assert.deepEqual(item.errors, []);
    await item.context.close(); results.push({ test: 'camera error ' + name, passed: true });
  }
  const noCamera = await open({ noCamera: true });
  assert.equal(await noCamera.page.getByRole('button', { name: 'Activar control con manos', exact: true }).isDisabled(), true);
  assert.deepEqual(noCamera.errors, []); await noCamera.context.close(); results.push({ test: 'missing mediaDevices', passed: true });
  const modelError = await open({ modelError: true });
  await modelError.page.getByRole('alert').filter({ hasText: 'No se pudo cargar el corazón' }).waitFor();
  await modelError.page.unroute('**/models/heart.glb');
  await modelError.page.getByRole('button', { name: 'Reintentar carga del corazón' }).click();
  await modelError.page.locator('[data-model-status="ready"]').waitFor(); await modelError.context.close();
  results.push({ test: 'heart failure and retry', passed: true });
  const workerError = await open({ mockWorker: true, workerError: true }); await activate(workerError.page);
  await workerError.page.getByRole('alert').filter({ hasText: 'MediaPipe no pudo cargar' }).waitFor();
  assert.equal(await workerError.page.evaluate(() => window.xrQa.stops), 1); await workerError.context.close();
  results.push({ test: 'detector failure releases camera', passed: true });

  const real = await open({ label: true }); await activate(real.page);
  await real.page.waitForFunction(() => window.xrQa.frames >= 8);
  await expectStatus(real.page, 'Activa');
  assert.equal(real.requests.some(r => r.method !== 'GET' || !r.url.startsWith(origin)), false);
  assert.ok(real.requests.some(r => r.url.endsWith('.wasm')));
  assert.deepEqual(real.errors, []); await shot(real.page, '04-mediapipe-real-video-sintetico');
  await deactivate(real.page); await real.page.waitForFunction(() => window.xrQa.stops === 1 && window.xrQa.closed === 1);
  results.push({ test: 'actual MediaPipe / WASM / Worker inference with synthetic video; local GETs only; close and stop', passed: true, requests: real.requests });
  await real.context.close();

  const simulated = await open({ mockWorker: true, label: true }); const sim = simulated.page;
  await activate(sim); await expectStatus(sim, 'Activa');
  await sim.evaluate(() => { window.xrQa.hands = [{ id: 'Left', x: 0.4, y: 0.5 }]; }); await expectStatus(sim, 'Rotar');
  const beforeGesture = await sim.locator('canvas').screenshot();
  await sim.evaluate(() => { window.xrQa.hands[0].x = 0.58; window.xrQa.hands[0].y = 0.58; }); await pause(sim);
  assert.notDeepEqual(await sim.locator('canvas').screenshot(), beforeGesture); await shot(sim, '05-una-mano-rotacion-simulada');
  await sim.evaluate(() => { window.xrQa.hands = [{ id: 'Left', x: 0.4, y: 0.5 }, { id: 'Right', x: 0.6, y: 0.5 }]; });
  await expectStatus(sim, 'Escalar'); const beforeScale = await sim.locator('canvas').screenshot();
  await sim.evaluate(() => { window.xrQa.hands[0].x = 0.3; window.xrQa.hands[1].x = 0.7; }); await pause(sim);
  assert.notDeepEqual(await sim.locator('canvas').screenshot(), beforeScale); await shot(sim, '06-dos-manos-escala-simulada');
  await sim.evaluate(() => { window.xrQa.hands = []; }); await expectStatus(sim, 'En espera');
  await sim.evaluate(() => { window.xrQa.hands = [{ id: 'Right', x: 0.3, y: 0.4 }]; }); await expectStatus(sim, 'Rotar');
  await sim.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expectStatus(sim, 'En pausa'); const frames = await sim.evaluate(() => window.xrQa.frames);
  await pause(sim); assert.equal(await sim.evaluate(() => window.xrQa.frames), frames);
  await sim.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expectStatus(sim, 'Activa'); await expectStatus(sim, 'Rotar');
  await sim.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await sim.waitForFunction(() => window.xrQa.stops === 1 && window.xrQa.closed === 1);
  await activate(sim); await expectStatus(sim, 'Activa');
  await sim.getByRole('link', { name: 'MED3D, inicio', exact: true }).click();
  await sim.waitForFunction(() => window.xrQa.stops === 2 && window.xrQa.closed === 2);
  assert.deepEqual(simulated.errors, []); await simulated.context.close();
  results.push({ test: 'synthetic one/two hand gestures alter rendered model; loss/recovery, visibility pause/resume, pagehide and SPA unmount cleanup', passed: true });
  const xr = await open({ xr: 'supported' }); await xr.page.getByRole('button', { name: /Disfrutar experiencia RA/ }).click();
  await expectStatus(xr.page, 'WebXR AR detectado. La experiencia inmersiva completa se incorporará en la siguiente fase.');
  assert.deepEqual(xr.errors, []); await xr.context.close();
  results.push({ test: 'supported WebXR API (mock) is detection only; no requestSession', passed: true });
} catch (error) {
  results.push({ failed: error.stack }); process.exitCode = 1;
} finally {
  await writeFile(output + '/browser-qa.json', JSON.stringify(results, null, 2) + '\n');
  await browser.close();
  console.log(JSON.stringify(results.map(({ requests, ...result }) => result), null, 2));
}
