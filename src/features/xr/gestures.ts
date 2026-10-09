import type { HandFrame, HandSample, GestureMode, ModelTransform } from './types';

export const MIN_SCALE = 0.55;
export const MAX_SCALE = 1.8;
export const INITIAL_TRANSFORM: ModelTransform = { rotationX: 0, rotationY: 0, scale: 1 };
export const clampScale = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number.isFinite(value) ? value : 1));
export const isPinching = (ratio: number, previous = false) => Number.isFinite(ratio) && ratio >= 0 && ratio < (previous ? 0.43 : 0.3);

/** Coordinates match the mirrored preview. Correct aspect ratio before measuring distance. */
export function normalizeHands(frame: HandFrame, aspect: number): HandSample[] {
  const seen = new Set<string>();
  return frame.landmarks.slice(0, 2).flatMap((points, index) => {
    const category = frame.handedness[index]?.[0];
    if (points.length !== 21 || !category || category.score < 0.6 || seen.has(category.categoryName)
      || !Number.isFinite(aspect) || aspect <= 0 || points.some(p => ![p.x, p.y, p.z].every(Number.isFinite))) return [];
    seen.add(category.categoryName);
    const distance = (a: number, b: number) => Math.hypot((points[a].x - points[b].x) * aspect, points[a].y - points[b].y);
    const palm = Math.max(distance(0, 9), distance(5, 17));
    if (palm < 0.02) return [];
    return [{ id: category.categoryName, x: 1 - (points[4].x + points[8].x) / 2,
      y: (points[4].y + points[8].y) / 2, pinchRatio: distance(4, 8) / palm }];
  });
}

const deadZone = (value: number, threshold: number) => Math.sign(value) * Math.max(0, Math.abs(value) - threshold);
type TrackedHand = HandSample & { pinching: boolean };
type Anchor = { key: string; x: number; y: number; distance: number; transform: ModelTransform };

/** Transient gesture state only; no camera or React dependencies and no landmark history. */
export class GestureController {
  readonly target: ModelTransform = { ...INITIAL_TRANSFORM };
  mode: GestureMode = 'idle';
  private hands = new Map<string, TrackedHand>();
  private anchor: Anchor | null = null;
  private lastTime = 0;
  private manual = false;
  private ignoreUntil = 0;

  endGesture() { this.hands.clear(); this.anchor = null; this.mode = 'idle'; this.lastTime = 0; }
  reset() { Object.assign(this.target, INITIAL_TRANSFORM); this.endGesture(); }
  beginManual() { this.manual = true; this.endGesture(); }
  endManual() { this.manual = false; this.endGesture(); }
  rotate(x: number, y: number, now: number) {
    this.endGesture(); this.ignoreUntil = now + 250;
    this.target.rotationX += x; this.target.rotationY += y;
  }
  scale(value: number, now: number) {
    this.endGesture(); this.ignoreUntil = now + 250; this.target.scale = clampScale(value);
  }

  update(samples: HandSample[], now: number, aspect = 4 / 3): GestureMode {
    if (this.manual || now < this.ignoreUntil) return 'idle';
    if (!Number.isFinite(now) || !Number.isFinite(aspect) || aspect <= 0) { this.endGesture(); return this.mode; }
    if (this.lastTime && (now - this.lastTime > 250 || now <= this.lastTime)) this.endGesture();
    const dt = this.lastTime ? now - this.lastTime : 50;
    this.lastTime = now;
    const alpha = 1 - Math.exp(-dt / 65);
    const next = new Map<string, TrackedHand>();
    for (const hand of samples.slice(0, 2)) {
      if (![hand.x, hand.y, hand.pinchRatio].every(Number.isFinite)) continue;
      const previous = this.hands.get(hand.id);
      if (previous && Math.hypot(hand.x - previous.x, hand.y - previous.y) > 0.25) this.anchor = null;
      next.set(hand.id, { ...hand,
        x: previous ? previous.x + (hand.x - previous.x) * alpha : hand.x,
        y: previous ? previous.y + (hand.y - previous.y) * alpha : hand.y,
        pinching: isPinching(hand.pinchRatio, previous?.pinching),
      });
    }
    const changed = [...this.hands.keys()].sort().join(',') !== [...next.keys()].sort().join(',');
    this.hands = next;
    const active = [...next.values()].filter(hand => hand.pinching).sort((a, b) => a.id.localeCompare(b.id));
    this.mode = active.length === 2 ? 'scale' : active.length === 1 ? 'rotate' : 'idle';
    if (!active.length) { this.anchor = null; return this.mode; }
    const first = active[0];
    const distance = active.length === 2 ? Math.hypot((first.x - active[1].x) * aspect, first.y - active[1].y) : 0;
    const key = this.mode + active.map(hand => hand.id).join(',');
    // Every hand-count / identity / mode transition starts a new baseline, including tracking loss.
    if (changed || !this.anchor || this.anchor.key !== key) {
      this.anchor = { key, x: first.x, y: first.y, distance, transform: { ...this.target } };
      return this.mode;
    }
    const anchor = this.anchor;
    if (this.mode === 'rotate') {
      this.target.rotationY = anchor.transform.rotationY + deadZone(first.x - anchor.x, 0.006) * Math.PI * 2;
      this.target.rotationX = anchor.transform.rotationX + deadZone(first.y - anchor.y, 0.006) * Math.PI * 2;
    } else if (anchor.distance > 0.06) {
      const ratio = 1 + deadZone(distance / anchor.distance - 1, 0.025);
      this.target.scale = clampScale(anchor.transform.scale * ratio);
    } else {
      this.anchor = null;
    }
    return this.mode;
  }
}
