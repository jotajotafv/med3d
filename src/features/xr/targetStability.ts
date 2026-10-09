import { TARGET_STICK_RADIUS_PX } from './handConfig.ts';
import type { PointerPoint } from './handPointer';

/** Temporal hysteresis over existing hits. Never moves the cursor or performs a hit test. */
export class TargetStability<T> {
  raw: T | null = null;
  stable: T | null = null;
  rawSince = -Infinity;
  stableSince = 0;
  private anchor: PointerPoint | null = null;
  private time = -Infinity;
  private key: (target: T) => unknown;
  private dwell: number;
  constructor(key: (target: T) => unknown, dwell: number) { this.key = key; this.dwell = dwell; }
  reset() { this.raw = this.stable = this.anchor = null; this.stableSince = 0; this.rawSince = this.time = -Infinity; }
  update(raw: T | null, point: PointerPoint, now: number) {
    if (!Number.isFinite(now) || now <= this.time || ![point.x, point.y].every(Number.isFinite)) return this.stable;
    this.time = now;
    const rawKey = raw === null ? null : this.key(raw);
    const oldRawKey = this.raw === null ? null : this.key(this.raw);
    if (rawKey !== oldRawKey || !Number.isFinite(this.rawSince)) this.rawSince = now;
    this.raw = raw;
    const stableKey = this.stable === null ? null : this.key(this.stable);
    if (rawKey !== null && rawKey === stableKey) {
      this.stable = raw; this.anchor = { ...point }; // Refresh metadata, keep dwell age.
    } else {
      if (this.anchor && Math.hypot(point.x - this.anchor.x, point.y - this.anchor.y) > TARGET_STICK_RADIUS_PX) {
        this.stable = null; this.anchor = null; this.stableSince = 0;
      }
      if (now - this.rawSince >= this.dwell) {
        this.stable = rawKey === null ? null : raw;
        this.anchor = this.stable ? { ...point } : null;
        this.stableSince = this.stable ? now : 0;
      }
    }
    return this.stable;
  }
  age(now: number) { return this.stable ? Math.max(0, now - this.stableSince) : 0; }
}
