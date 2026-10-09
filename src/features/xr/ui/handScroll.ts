import type { PointerPoint } from '../handPointer';
import type { UiTarget } from './handUiRouter';

export const SCROLL_HAND_GAIN = 1.25;
export const SCROLL_RELEASE_HORIZONTAL_PX = 60;
export const SCROLL_RELEASE_MS = 300;
type Capture = { id: string; token: object; startPointerY: number; startScrollTop: number;
  outsideSince: number | null; paused: boolean };

/** Relative touch-like scrolling, driven only by the router's valid filtered samples. */
export class HandScroll {
  capture: Capture | null = null;
  begin(target: UiTarget, point: PointerPoint) {
    if (target.kind !== 'scroll-region' || !target.enabled || !target.scroll || target.scroll.max <= 0) return false;
    this.capture = { id: target.id, token: target.scroll.token, startPointerY: point.y,
      startScrollTop: target.scroll.top, outsideSince: null, paused: false };
    return true;
  }
  end() { this.capture = null; }
  pause() { if (this.capture) { this.capture.paused = true; this.capture.outsideSince = null; } }
  move(target: UiTarget | null, point: PointerPoint, now: number): { release: boolean; value?: number } {
    const capture = this.capture;
    if (!capture || !target?.enabled || target.kind !== 'scroll-region' || !target.scroll
      || target.scroll.max <= 0 || target.scroll.token !== capture.token) return { release: true };
    if (capture.paused) {
      capture.startPointerY = point.y; capture.startScrollTop = target.scroll.top; capture.paused = false;
      return { release: false };
    }
    const outside = point.x < target.rect.left - SCROLL_RELEASE_HORIZONTAL_PX
      || point.x > target.rect.left + target.rect.width + SCROLL_RELEASE_HORIZONTAL_PX;
    capture.outsideSince = outside ? capture.outsideSince ?? now : null;
    if (capture.outsideSince !== null && now - capture.outsideSince >= SCROLL_RELEASE_MS) return { release: true };
    if (outside) return { release: false };
    const value = Math.max(0, Math.min(target.scroll.max, capture.startScrollTop + (capture.startPointerY - point.y) * SCROLL_HAND_GAIN));
    return { release: false, value };
  }
}
