import { CURSOR_SMOOTHING_MS, MAX_TRACKING_GAP_MS } from './handConfig.ts';
import type { HandSample } from './types';

export type PointerPoint = { x: number; y: number };
export type PointerRect = { left: number; top: number; width: number; height: number };
const validPoint = (p: PointerPoint) => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;

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
  private point: PointerPoint | null = null;
  private time = 0;
  reset() { this.point = null; this.time = 0; }
  update(hand: HandSample, now: number, aspect: number, rect: PointerRect | null): PointerPoint | null {
    const raw = { x: hand.indexX ?? NaN, y: hand.indexY ?? NaN };
    // Check raw input before smoothing: no lingering cursor or edge clamping outside the video.
    if (!rect || !projectIndex(raw, aspect, rect)) { this.reset(); return null; }
    const dt = now - this.time;
    if (!this.point || dt <= 0 || dt > MAX_TRACKING_GAP_MS) this.point = raw;
    else {
      const alpha = 1 - Math.exp(-dt / CURSOR_SMOOTHING_MS);
      this.point = { x: this.point.x + (raw.x - this.point.x) * alpha, y: this.point.y + (raw.y - this.point.y) * alpha };
    }
    this.time = now;
    return projectIndex(this.point, aspect, rect);
  }
}
