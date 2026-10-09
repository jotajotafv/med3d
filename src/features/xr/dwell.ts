import { DWELL_ACTIVATION_MS, DWELL_GRACE_RESUME_MS } from './handConfig.ts';

export type DwellTarget = { domain: 'anatomy' | 'ui'; id: string; kind: 'anatomy' | 'button' | 'toggle' | 'slider' };
export type DwellState = 'idle' | 'dwelling' | 'paused' | 'fired' | 'sliderCaptured';
export type DwellSnapshot = { state: DwellState; elapsedMs: number; progress: number; target: DwellTarget | null };
const key = (target: DwellTarget) => `${target.domain}:${target.id}`;

/** One clock for both domains. Only fresh, reliable inference may return an action.
 * Cancellation never rearms an already fired target: only a stable departure does. */
export class DwellController {
  state: DwellState = 'idle';
  target: DwellTarget | null = null;
  elapsedMs = 0;
  private time = -Infinity;
  private firedKey: string | null = null;
  private recovered = false;
  private lastReliable = -Infinity;

  get snapshot(): DwellSnapshot {
    return { state: this.state, elapsedMs: this.elapsedMs, progress: this.elapsedMs / DWELL_ACTIVATION_MS, target: this.target };
  }
  cancel(domain?: DwellTarget['domain']) {
    if (domain && this.target?.domain !== domain) return;
    this.state = 'idle'; this.target = null; this.elapsedMs = 0; this.recovered = false;
  }
  pause(now: number, lastReliable: number) {
    if (!Number.isFinite(now) || now < this.time) return;
    if (this.state === 'sliderCaptured') this.cancel();
    if (this.state === 'dwelling') {
      this.state = 'paused'; this.lastReliable = lastReliable; this.recovered = false;
    }
    if (this.state === 'paused' && now - this.lastReliable > DWELL_GRACE_RESUME_MS) this.cancel();
    this.time = now;
  }
  recover(now: number, nearby: boolean, lossMs: number) {
    if (this.state !== 'paused') return;
    if (!nearby || lossMs > DWELL_GRACE_RESUME_MS) this.cancel();
    else { this.recovered = true; this.time = now; }
  }
  /** null with departed=false means target acquisition, not an observed empty target. */
  update(target: DwellTarget | null, now: number, departed = false): boolean {
    if (!Number.isFinite(now) || now <= this.time) return false;
    const dt = now - this.time; this.time = now;
    if (!target) {
      if (departed) { this.firedKey = null; this.cancel(); }
      else if (this.state !== 'paused') this.cancel();
      return false;
    }
    const nextKey = key(target);
    if (this.firedKey !== nextKey) this.firedKey = null;
    if (this.firedKey === nextKey) {
      this.target = target;
      if (this.state !== 'sliderCaptured') this.state = 'fired';
      this.elapsedMs = DWELL_ACTIVATION_MS;
      return false;
    }
    if (this.state === 'paused' && !this.recovered) return false;
    if (!this.target || key(this.target) !== nextKey || this.state === 'idle') {
      this.target = target; this.elapsedMs = 0; this.state = 'dwelling'; return false;
    }
    this.target = target;
    if (this.state === 'paused') { this.state = 'dwelling'; this.recovered = false; return false; }
    this.elapsedMs = Math.min(DWELL_ACTIVATION_MS, this.elapsedMs + dt);
    if (this.elapsedMs < DWELL_ACTIVATION_MS) return false;
    // Latch BEFORE invoking any consumer callback (which may synchronously reset the view).
    this.firedKey = nextKey; this.state = target.kind === 'slider' ? 'sliderCaptured' : 'fired';
    return true;
  }
}
