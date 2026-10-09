import { requestCamera, stopCamera, cameraError } from './camera';
import { normalizeHands } from './gestures';
import type { HandTrackingInput, TrackingStatus, WorkerRequest, WorkerResponse } from './types';

const INITIAL_STATUS: TrackingStatus = { camera: 'off', hands: 0, gesture: 'idle', message: '' };
export { INITIAL_STATUS };

/** Owns the camera/worker lifetime, independently from React and the 3D scene. */
export class HandTrackingSession {
  private generation = 0;
  private stream: MediaStream | null = null;
  private worker: Worker | null = null;
  private raf = 0;
  private busy = false;
  private ready = false;
  private lastVideoTime = -1;
  private lastFrameTime = 0;
  private resumeAfter = 0;
  private lastUiTime = 0;
  private lastUi = '';
  private pendingReject: (() => void) | null = null;
  private watchdog: ReturnType<typeof setTimeout> | undefined;

  constructor(private video: HTMLVideoElement, private gestures: HandTrackingInput,
    private onStatus: (status: TrackingStatus) => void) {}

  private report(status: TrackingStatus, force = false) {
    const key = JSON.stringify(status), now = performance.now();
    if (key === this.lastUi || (!force && now - this.lastUiTime < 200)) return;
    this.lastUi = key; this.lastUiTime = now; this.onStatus(status);
  }

  async start() {
    this.release();
    const generation = this.generation;
    if (!window.isSecureContext || typeof navigator.mediaDevices?.getUserMedia !== 'function') {
      this.fail('La cámara no está disponible en este contexto. Utiliza HTTPS o localhost, o sigue con los controles manuales.'); return;
    }
    if (typeof Worker === 'undefined' || typeof createImageBitmap !== 'function' || typeof OffscreenCanvas === 'undefined') {
      this.fail('Este navegador no ofrece los recursos necesarios para el control con manos. Puedes usar los controles manuales.'); return;
    }
    this.report({ ...INITIAL_STATUS, camera: 'requesting', message: 'Esperando tu permiso de cámara. Puedes cancelar cuando quieras.' }, true);
    let stage: 'camera' | 'detector' = 'camera';
    try {
      const stream = await requestCamera();
      if (generation !== this.generation) { stopCamera(stream); return; }
      this.stream = stream;
      stream.getVideoTracks().forEach(track => track.addEventListener('ended', this.onEnded));
      this.video.srcObject = stream;
      await this.video.play();
      if (generation !== this.generation) return;
      stage = 'detector';
      this.report({ ...INITIAL_STATUS, camera: 'loading', message: 'Preparando el control con manos. La primera carga puede tardar unos segundos.' }, true);
      const worker = new Worker(new URL('./hand-tracking.worker.ts', import.meta.url), { type: 'module' });
      this.worker = worker;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Detector timeout')), 45000);
        const settle = (error?: Error) => {
          clearTimeout(timer); this.pendingReject = null;
          if (error) reject(error); else resolve();
        };
        this.pendingReject = () => settle(new Error('Cancelled'));
        worker.onerror = () => {
          if (generation !== this.generation) return;
          if (!this.ready) settle(new Error('Worker error'));
          else this.fail('El control con manos se detuvo. Puedes volver a activarlo o usar los controles manuales.');
        };
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          if (generation !== this.generation) return;
          const message = event.data;
          if (message.type === 'ready') settle();
          else if (message.type === 'error') {
            if (!this.ready) settle(new Error('Detector error'));
            else this.fail('El seguimiento de manos no pudo continuar. Puedes usar los controles manuales.');
          } else if (message.type === 'result') {
            this.busy = false; clearTimeout(this.watchdog);
            if (document.visibilityState === 'hidden' || message.timestamp < this.resumeAfter) return;
            const aspect = this.video.videoWidth / Math.max(1, this.video.videoHeight);
            const hands = normalizeHands(message.frame, aspect);
            const gesture = this.gestures.update(hands, message.timestamp, aspect);
            this.report({ camera: 'active', hands: hands.length, gesture, message: '' });
          }
        };
        worker.postMessage({ type: 'init', modelUrl: new URL(import.meta.env.BASE_URL + 'xr/hand_landmarker.task', location.origin).href } satisfies WorkerRequest);
      });
      if (generation !== this.generation) return;
      this.ready = true;
      document.addEventListener('visibilitychange', this.onVisibility);
      this.onVisibility();
    } catch (error) {
      if (generation !== this.generation) return;
      this.fail(stage === 'camera' ? cameraError(error) : 'MediaPipe no pudo cargar. Comprueba la conexión y vuelve a intentarlo. Los controles manuales siguen disponibles.');
    }
  }

  private onEnded = () => this.fail('La cámara se desconectó o su permiso cambió. Puedes volver a activarla o usar los controles manuales.');

  private onVisibility = () => {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.gestures.endGesture();
    if (document.visibilityState === 'hidden') {
      this.report({ ...INITIAL_STATUS, camera: 'paused', message: 'Seguimiento en pausa mientras la pestaña está oculta.' }, true);
    } else if (this.ready) {
      this.resumeAfter = performance.now();
      this.report({ ...INITIAL_STATUS, camera: 'active' }, true);
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private tick = (time: number) => {
    if (!this.ready || document.visibilityState === 'hidden') return;
    this.raf = requestAnimationFrame(this.tick);
    if (this.busy || this.video.readyState < 2 || time - this.lastFrameTime < 50 || this.video.currentTime === this.lastVideoTime) return;
    this.busy = true; this.lastFrameTime = time; this.lastVideoTime = this.video.currentTime;
    const generation = this.generation;
    // At most one transferable frame is in flight. It is closed by the worker immediately after inference.
    void createImageBitmap(this.video, { resizeWidth: 640, resizeHeight: Math.max(1, Math.round(640 * this.video.videoHeight / this.video.videoWidth)) }).then(bitmap => {
      if (generation !== this.generation || !this.worker || document.visibilityState === 'hidden') {
        bitmap.close(); if (generation === this.generation) this.busy = false; return;
      }
      try {
        this.worker.postMessage({ type: 'frame', bitmap, timestamp: time } satisfies WorkerRequest, [bitmap]);
        this.watchdog = setTimeout(() => this.fail('El seguimiento dejó de responder. Puedes volver a activarlo o usar los controles manuales.'), 10000);
      } catch { bitmap.close(); this.fail('No se pudo procesar la cámara. Puedes usar los controles manuales.'); }
    }).catch(() => { if (generation === this.generation) this.fail('No se pudo leer la imagen de la cámara. Puedes usar los controles manuales.'); });
  };

  private fail(message: string) {
    this.release(); this.report({ ...INITIAL_STATUS, camera: 'error', message }, true);
  }

  private release() {
    this.generation++; this.ready = false; this.busy = false;
    cancelAnimationFrame(this.raf); this.raf = 0;
    clearTimeout(this.watchdog);
    this.pendingReject?.(); this.pendingReject = null;
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.stream?.getVideoTracks().forEach(track => track.removeEventListener('ended', this.onEnded));
    stopCamera(this.stream); this.stream = null;
    this.video.pause(); this.video.srcObject = null;
    const worker = this.worker; this.worker = null;
    if (worker) {
      // Allow close() to release graph resources; terminate even if the worker is unresponsive.
      const deadline = setTimeout(() => worker.terminate(), 200);
      worker.onerror = null;
      worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'closed') { clearTimeout(deadline); worker.terminate(); }
      };
      worker.postMessage({ type: 'close' } satisfies WorkerRequest);
    }
    this.lastVideoTime = -1; this.lastFrameTime = 0;
    this.gestures.endGesture();
  }

  stop() { this.release(); this.report(INITIAL_STATUS, true); }
  dispose() { this.release(); }
}
