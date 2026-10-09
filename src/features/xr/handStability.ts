import { HandPointer, jumpAllowance, validPoint, projectIndex, type PointerPoint, type PointerRect } from './handPointer.ts';
import { MAX_TRACKING_GAP_MS, TRACKING_GRACE_MS, REACQUIRE_NEAR_RADIUS, REACQUIRE_SETTLE_MS, PINCH_EXIT_RATIO } from './handConfig.ts';
import type { GestureController } from './gestures';
import type { HandSample, HandTrackingInput, InteractionMode } from './types';

export type HandTrackingState = 'tracking' | 'grace' | 'lost' | 'reacquiring';
export type StabilitySnapshot = { tracking: HandTrackingState; point: PointerPoint | null; velocity: number; lostDurationMs: number };
export type HandStabilityDebug = StabilitySnapshot & { rawTarget: string; stableTarget: string; stableTimeMs: number; lastPinch: 'select' | 'rotate' | 'cancel' | null };
type Ports = { surface: (aspect: number) => PointerRect | null; blocked: () => boolean; report: (value: StabilitySnapshot) => void };
const index = (hand: HandSample) => ({ x: hand.indexX ?? NaN, y: hand.indexY ?? NaN });
const distance = (a: PointerPoint, b: PointerPoint) => Math.hypot(a.x - b.x, a.y - b.y);

/** Safety gate shared by Heart and Atlas. Missing samples never reach gesture/selection code. */
export class HandStability implements HandTrackingInput {
  trackingState: HandTrackingState = 'lost';
  lastReliablePointer: PointerPoint | null = null;
  lastReliableTime: number | null = null;
  point: PointerPoint | null = null;
  surface: PointerRect | null = null;
  readonly pointer = new HandPointer();
  private primary: HandSample | null = null;
  private secondary: HandSample | null = null;
  private time = -Infinity;
  private settleSince: number | null = null;
  private nearby = false;
  private revision: number;
  private inner: HandTrackingInput;
  private gestures: GestureController;
  private ports: Ports;
  constructor(inner: HandTrackingInput, gestures: GestureController, ports: Ports) {
    this.inner = inner; this.gestures = gestures; this.ports = ports; this.revision = gestures.inputRevision;
  }
  private report(now: number) {
    this.ports.report({ tracking: this.trackingState, point: this.trackingState === 'lost' || (this.trackingState === 'reacquiring' && !this.nearby) ? null : this.point,
      velocity: this.pointer.velocity, lostDurationMs: this.trackingState === 'grace' || this.trackingState === 'lost'
        ? this.lastReliableTime === null ? 0 : Math.max(0, now - this.lastReliableTime) : 0 });
  }
  endGesture() {
    this.inner.endGesture(); this.pointer.reset(); this.primary = this.secondary = null;
    this.point = this.lastReliablePointer = null; this.surface = null; this.lastReliableTime = null;
    this.settleSince = null; this.trackingState = 'lost'; this.time = -Infinity; this.report(0);
  }
  private lose(now: number) {
    if (this.trackingState === 'tracking' || this.trackingState === 'reacquiring') this.inner.endGesture();
    this.settleSince = null;
    this.trackingState = this.lastReliableTime !== null && now - this.lastReliableTime <= TRACKING_GRACE_MS ? 'grace' : 'lost';
    if (this.trackingState === 'lost') { this.primary = this.secondary = null; this.pointer.reset(); }
    this.report(now);
    return 'idle' as const;
  }
  update(samples: HandSample[], now: number, aspect: number): InteractionMode {
    if (this.revision !== this.gestures.inputRevision) { this.endGesture(); this.revision = this.gestures.inputRevision; }
    if (this.ports.blocked() || this.gestures.manualActive(now)) { this.endGesture(); return 'idle'; }
    if (!Number.isFinite(now) || now <= this.time) return 'idle';
    const dt = now - this.time; this.time = now;
    const rect = this.surface = this.ports.surface(aspect);
    if (!rect || !Number.isFinite(aspect) || aspect <= 0) return this.lose(now);
    if (dt > MAX_TRACKING_GAP_MS && this.trackingState === 'tracking') this.lose(now);
    const valid = samples.slice(0, 2).filter(hand => validPoint(index(hand)) && validPoint(hand) && Number.isFinite(hand.pinchRatio) && hand.pinchRatio >= 0);
    if (!valid.length) return this.lose(now);
    if (this.trackingState === 'grace' && this.lastReliableTime !== null && now - this.lastReliableTime > TRACKING_GRACE_MS) this.lose(now);
    // Spatial continuity is primary; labels only break a near-exact tie. Two hands use total assignment cost.
    const cost = (hand: HandSample) => this.primary ? distance(index(hand), index(this.primary))
      + (valid.length === 2 && this.secondary ? distance(index(valid.find(other => other !== hand)!), index(this.secondary)) : 0)
      + (hand.id === this.primary.id ? 0 : 0.001) : 0;
    const primary = [...valid].sort((a, b) => this.primary ? cost(a) - cost(b) : a.id.localeCompare(b.id))[0];
    const raw = index(primary);
    const sinceReliable = this.lastReliableTime === null ? 0 : now - this.lastReliableTime;
    if (this.primary && this.lastReliablePointer && distance(raw, this.lastReliablePointer) >
      (this.trackingState === 'tracking' ? jumpAllowance(dt) : REACQUIRE_NEAR_RADIUS)) return this.lose(now);
    if (this.trackingState === 'grace' || this.trackingState === 'lost') {
      this.nearby = !!this.pointer.point && !!this.lastReliablePointer && distance(raw, this.lastReliablePointer) <= REACQUIRE_NEAR_RADIUS && sinceReliable <= TRACKING_GRACE_MS;
      this.inner.endGesture(); this.pointer.reanchor(raw, now, this.nearby);
      this.trackingState = 'reacquiring'; this.settleSince = null;
    } else {
      const next = this.pointer.update(primary, now, aspect, rect);
      if (!next) return this.lose(now);
      this.point = next;
    }
    // Reanchor frame projects the retained/new point without advancing the filter twice.
    if (this.pointer.point) this.point = projectIndex(this.pointer.point, aspect, rect);
    if (!this.point) return this.lose(now);
    this.primary = primary; this.secondary = valid.find(hand => hand !== primary) ?? null;
    this.lastReliablePointer = raw; this.lastReliableTime = now;
    if (this.trackingState === 'reacquiring') {
      if (valid.every(hand => hand.pinchRatio >= PINCH_EXIT_RATIO)) this.settleSince ??= now;
      else this.settleSince = null;
      if (this.settleSince === null || now - this.settleSince < REACQUIRE_SETTLE_MS) { this.report(now); return 'idle'; }
      this.trackingState = 'tracking';
    }
    // Canonical identity survives Left/Right flips; raw midpoint/pinch values remain untouched.
    const ordered = [{ ...primary, id: '0-primary' }, ...(this.secondary ? [{ ...this.secondary, id: '1-secondary' }] : [])];
    const mode = this.inner.update(ordered, now, aspect);
    this.report(now); return mode;
  }
}
