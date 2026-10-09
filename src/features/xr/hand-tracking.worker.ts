import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import wasmLoaderUrl from '@mediapipe/tasks-vision/vision_wasm_module_internal.js?url';
import wasmBinaryUrl from '@mediapipe/tasks-vision/vision_wasm_module_internal.wasm?url';
import { mayFetchAsset } from './networkPolicy';
import type { WorkerRequest, WorkerResponse } from './types';

let detector: HandLandmarker | null = null;
let closed = false;
const send = (message: WorkerResponse) => self.postMessage(message);

async function initialize(modelUrl: string) {
  // MediaPipe's general notice allows usage metrics. This worker permits only local GETs,
  // and never enables logging. Block any telemetry POST rather than rely on SDK defaults.
  const binaryUrl = new URL(wasmBinaryUrl, self.location.origin).href;
  const assets = [modelUrl, binaryUrl];
  if (assets.some(url => new URL(url).origin !== self.location.origin)) throw new Error('Expected local assets');
  const originalFetch = self.fetch.bind(self);
  self.fetch = (input, init) => {
    const request = new Request(input, init);
    if (!mayFetchAsset(request.url, request.method, assets)) return Promise.reject(new Error('XR worker network restricted'));
    return originalFetch(request, { credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer' });
  };
  // The pinned ESM loader uses fetch for its WASM; no XHR or sockets are needed.
  Object.defineProperty(self, 'XMLHttpRequest', { value: undefined, configurable: true });
  Object.defineProperty(self, 'WebSocket', { value: undefined, configurable: true });
  if (!await FilesetResolver.isSimdSupported()) throw new Error('SIMD unavailable');
  const instance = await HandLandmarker.createFromOptions({
    wasmLoaderPath: new URL(wasmLoaderUrl, self.location.origin).href,
    wasmBinaryPath: binaryUrl,
  }, {
    baseOptions: { modelAssetPath: modelUrl, delegate: 'CPU' },
    runningMode: 'VIDEO', numHands: 2,
    minHandDetectionConfidence: 0.6, minHandPresenceConfidence: 0.6, minTrackingConfidence: 0.6,
  });
  if (closed) { instance.close(); return; }
  detector = instance;
  send({ type: 'ready' });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === 'init') await initialize(message.modelUrl);
    else if (message.type === 'close') { closed = true; detector?.close(); detector = null; send({ type: 'closed' }); }
    else {
      try {
        if (!detector || closed) return;
        const result = detector.detectForVideo(message.bitmap, message.timestamp);
        send({ type: 'result', timestamp: message.timestamp, frame: { landmarks: result.landmarks, handedness: result.handedness } });
      } finally { message.bitmap.close(); }
    }
  } catch { send({ type: 'error' }); }
};
