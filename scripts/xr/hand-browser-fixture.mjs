// Synthetic landmarks/video only. Shared browser QA fixture; never imported by the app.
export function installHandFixture() {
  const qa = window.handQa = { hands: [], frames: 0, calls: 0, stops: 0, frozen: false };
  Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
    qa.calls++;
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext('2d'); let n = 0;
    const timer = setInterval(() => {
      ctx.fillStyle = ++n % 2 ? '#15272d' : '#172a30'; ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = '#aecdd4'; ctx.font = '24px sans-serif'; ctx.fillText('VIDEO SINTÉTICO', 190, 240);
    }, 50);
    const stream = canvas.captureStream(20);
    for (const track of stream.getTracks()) { const stop = track.stop.bind(track); track.stop = () => { qa.stops++; clearInterval(timer); stop(); }; }
    return stream;
  } });
  window.Worker = class {
    onmessage = null;
    postMessage(message) {
      if (message.type === 'init') queueMicrotask(() => this.onmessage?.({ data: { type: 'ready' } }));
      else if (message.type === 'close') this.onmessage?.({ data: { type: 'closed' } });
      else {
        message.bitmap.close();
        if (qa.frozen) return;
        const samples = qa.sample?.(message.timestamp) ?? qa.hands;
        const landmarks = samples.map(hand => {
          const x = 1 - hand.u, y = hand.v;
          const points = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
          points[0] = { x, y: y + .12, z: 0 }; points[9] = { x, y: y - .12, z: 0 };
          points[4] = { x: x + (hand.ratio === undefined ? (hand.pinch ? .009 : .09) : hand.ratio * .24 / (4 / 3)), y, z: 0 };
          points[8] = { x, y, z: 0 }; return points;
        });
        const handedness = samples.map(hand => [{ categoryName: hand.id, score: .99 }]);
        queueMicrotask(() => { this.onmessage?.({ data: { type: 'result', timestamp: qa.timestamp ?? message.timestamp, frame: { landmarks, handedness } } }); qa.frames++; });
      }
    }
    terminate() {}
  };
  document.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div'); banner.textContent = 'QA SIMULADA · landmarks y vídeo sintéticos · sin webcam física';
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:1000;background:#302918;color:#ffe1a5;text-align:center;padding:7px;font:11px system-ui;pointer-events:none';
    document.body.append(banner);
  });
}
