import test from 'node:test';
import assert from 'node:assert/strict';
import { detectCapabilities, arExplanation } from '../../src/features/xr/capabilities.ts';
import { cameraError, stopCamera } from '../../src/features/xr/camera.ts';
import { mayFetchAsset } from '../../src/features/xr/networkPolicy.ts';

test('missing APIs and insecure contexts degrade without invoking permissions', async () => {
  assert.deepEqual(await detectCapabilities({}, true), { camera: 'unavailable', vr: 'unavailable', ar: 'unavailable' });
  let calls = 0;
  const nav = { mediaDevices: { getUserMedia() { calls++; } }, xr: { async isSessionSupported() { calls++; return true; } } };
  assert.deepEqual(await detectCapabilities(nav, false), { camera: 'unavailable', vr: 'unavailable', ar: 'unavailable' });
  assert.equal(calls, 0);
});
test('queries both modes independently and never requests a session or camera', async () => {
  const calls = [];
  const result = await detectCapabilities({ mediaDevices: { getUserMedia() { throw Error('Unsolicited permission'); } },
    xr: { async isSessionSupported(mode) { calls.push(mode); return mode === 'immersive-vr'; } } }, true);
  assert.deepEqual(calls.sort(), ['immersive-ar', 'immersive-vr']);
  assert.deepEqual(result, { camera: 'available', vr: 'available', ar: 'unavailable' });
});
test('rejection, exceptions and timeout do not falsely claim support', async () => {
  const rejected = await detectCapabilities({ xr: { async isSessionSupported(mode) { if (mode === 'immersive-ar') throw Error('policy'); return true; } } }, true);
  assert.equal(rejected.vr, 'available'); assert.equal(rejected.ar, 'unknown');
  const timeout = await detectCapabilities({ xr: { isSessionSupported: () => new Promise(() => {}) } }, true, 5);
  assert.equal(timeout.ar, 'unknown'); assert.equal(timeout.vr, 'unknown');
  assert.match(arExplanation('available'), /siguiente fase/); assert.match(arExplanation('unavailable'), /no ofrece/);
  assert.match(arExplanation('unknown'), /No se pudo confirmar/);
});
test('camera errors remain readable and cleanup stops every track', () => {
  assert.match(cameraError({ name: 'NotAllowedError' }), /denegado/);
  assert.match(cameraError({ name: 'NotFoundError' }), /No encontramos/);
  assert.match(cameraError({ name: 'NotReadableError' }), /ocupada/);
  let stopped = 0; stopCamera({ getTracks: () => [{ stop() { stopped++; } }, { stop() { stopped++; } }] });
  stopCamera(null); assert.equal(stopped, 2);
});
test('worker network policy only allows exact local model and WASM GETs', () => {
  const assets = ['https://example.test/med3d/xr/hand_landmarker.task', 'https://example.test/med3d/assets/vision.wasm'];
  assert.equal(mayFetchAsset(assets[0], 'GET', assets), true);
  assert.equal(mayFetchAsset(assets[1], 'GET', assets), true);
  assert.equal(mayFetchAsset(assets[0], 'POST', assets), false);
  assert.equal(mayFetchAsset('https://odml.pa.googleapis.com/v1/log', 'POST', assets), false);
  assert.equal(mayFetchAsset(assets[0] + '?landmarks=x', 'GET', assets), false);
});
