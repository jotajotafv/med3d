import { CURSOR_FAST_SMOOTHING_MS, CURSOR_SLOW_SMOOTHING_MS, CURSOR_SLOW_VELOCITY, CURSOR_FAST_VELOCITY,
  CURSOR_JUMP_BASE, CURSOR_JUMP_SPEED, CURSOR_JUMP_MAX, MAX_TRACKING_GAP_MS } from './handConfig.ts';
import type { HandSample } from './types';

export type PointerPoint = { x: number; y: number };
export type PointerRect = { left: number; top: number; width: number; height: number };
export const validPoint = (p: PointerPoint) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
export const jumpAllowance = (dt: number) => Math.min(CURSOR_JUMP_MAX, CURSOR_JUMP_BASE + CURSOR_JUMP_SPEED * dt / 1000);

/** Mirrored normalized video coordinates, fitted inside the real canvas without distortion. */
export function projectIndex(point: PointerPoint, aspect: number, rect: PointerRect): PointerPoint | null {
  if (!validPoint(point) || !Number.isFinite(aspect) || aspect <= 0
    || ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) || rect.width <= 0 || rect.height <= 0) return null;
  const width = Math.min(rect.width, rect.height * aspect), height = width / aspect;
  const x = rect.left + (rect.width - width) / 2 + point.x * width;
  const y = rect.top + (rect.height - height) / 2 + point.y * height;
  return x < rect.left || x > rect.left + rect.width || y < rect.top || y > rect.top + rect.height ? null : { x, y };
}

export class HandPointer {
  point: PointerPoint | null = null;
  velocity = 0;
  smoothingMs = CURSOR_SLOW_SMOOTHING_MS;
  private raw: PointerPoint | null = null;
  private time: number | null = null;
  reset() { this.point = this.raw = null; this.time = null; this.velocity = 0; }
  /** Nearby recovery retains the last filtered point; distant acquisition starts a new filter. */
  reanchor(raw: PointerPoint, now: number, nearby: boolean) {
    if (!validPoint(raw) || !Number.isFinite(now)) return;
    if (!nearby || !this.point) this.point = { ...raw };
    this.raw = { ...raw }; this.time = now; this.velocity = 0;
  }
  update(hand: HandSample, now: number, aspect: number, rect: PointerRect | null): PointerPoint | null {
    const raw = { x: hand.indexX ?? NaN, y: hand.indexY ?? NaN };
    if (!rect || !Number.isFinite(now) || !projectIndex(raw, aspect, rect)) return null;
    const dt = this.time === null ? 0 : now - this.time;
    if (this.time !== null && (dt <= 0 || dt > MAX_TRACKING_GAP_MS)) return null;
    if (!this.point || !this.raw) this.point = raw;
    else {
      const distance = Math.hypot(raw.x - this.raw.x, raw.y - this.raw.y);
      if (distance > jumpAllowance(dt)) return null;
      this.velocity = distance / (dt / 1000);
      const response = Math.max(0, Math.min(1, (this.velocity - CURSOR_SLOW_VELOCITY) / (CURSOR_FAST_VELOCITY - CURSOR_SLOW_VELOCITY)));
      this.smoothingMs = CURSOR_SLOW_SMOOTHING_MS + (CURSOR_FAST_SMOOTHING_MS - CURSOR_SLOW_SMOOTHING_MS) * response;
      const alpha = 1 - Math.exp(-dt / this.smoothingMs);
      this.point = { x: this.point.x + (raw.x - this.point.x) * alpha, y: this.point.y + (raw.y - this.point.y) * alpha };
    }
    this.time = now; this.raw = raw;
    return projectIndex(this.point, aspect, rect);
  }
}
