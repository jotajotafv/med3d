import { HandPointer, type PointerPoint, type PointerRect } from '../handPointer.ts';
import { isPinching, type GestureController } from '../gestures.ts';
import { MAX_HAND_JUMP, MAX_TRACKING_GAP_MS, PINCH_EXIT_RATIO, UI_TARGET_DWELL_MS, SLIDER_RELEASE_VERTICAL_PX, SLIDER_RELEASE_MS } from '../handConfig.ts';
import { DwellController } from '../dwell.ts';
import { TargetStability } from '../targetStability.ts';
import type { HandSample, HandTrackingInput, InteractionMode } from '../types';
import { TRACKING_GRACE_MS } from '../handConfig.ts';
import { HandScroll } from './handScroll.ts';

export type UiTarget = { id: string; name?: string; kind: 'button' | 'toggle' | 'slider' | 'scroll-region'; rect: PointerRect; enabled: boolean;
  range?: { min: number; max: number; step: number | 'any'; value: number };
  scroll?: { top: number; max: number; token: object } };
export type UiHit = { route: 'anatomy' } | { route: 'ui'; target: UiTarget | null; blocked?: boolean };
export type UiFeedback = { point: PointerPoint; target: UiTarget | null; stable?: boolean; state: 'hover' | 'press' | 'drag' | 'scroll' | 'blocked' } | null;
export interface HandUiPort {
  surface(aspect: number): PointerRect | null;
  hitTest(point: PointerPoint): UiHit;
  resolve(id: string): UiTarget | null;
  activate(id: string): void;
  change(id: string, value: number): void;
  scroll?(id: string, value: number): void;
  feedback(value: UiFeedback): void;
}
export const contains = (rect: PointerRect, point: PointerPoint, tolerance = 0) => point.x >= rect.left - tolerance
  && point.x <= rect.left + rect.width + tolerance && point.y >= rect.top - tolerance && point.y <= rect.top + rect.height + tolerance;

/** Preserve the existing aspect-fit projection while covering the visible XR workspace. */
export function handUiSurface(rect: PointerRect, aspect: number): PointerRect {
  const width = Math.max(rect.width, rect.height * aspect), height = width / aspect;
  return { left: rect.left - (width - rect.width) / 2, top: rect.top - (height - rect.height) / 2, width, height };
}
export function sliderValue(pointX: number, target: UiTarget): number | null {
  const range = target.range;
  if (!range || target.rect.width <= 0 || !Number.isFinite(pointX) || range.max < range.min) return null;
  const mapped = range.min + Math.max(0, Math.min(1, (pointX - target.rect.left) / target.rect.width)) * (range.max - range.min);
  const value = range.step === 'any' ? mapped : range.min + Math.round((mapped - range.min) / range.step) * range.step;
  return Number(Math.max(range.min, Math.min(range.max, value)).toFixed(10));
}
type Tracked = HandSample & { pinching: boolean };
type RouterOptions = { point?: () => PointerPoint | null; surface?: () => PointerRect | null; dwell?: DwellController; confirm?: () => void };

/** UI owns dwell/capture; a pinch starting on UI cannot reach anatomy until open/reanchored. */
export class HandUiRouter implements HandTrackingInput {
  readonly targets = new TargetStability<UiTarget>(target => target.id, UI_TARGET_DWELL_MS);
  readonly dwell: DwellController;
  readonly scroll = new HandScroll();
  route: 'ui' | 'anatomy' = 'anatomy';
  private pointer = new HandPointer();
  private hands = new Map<string, Tracked>();
  private primary: string | null = null;
  private owner: 'anatomy' | null = null;
  private capture: { id: string; outsideSince: number | null } | null = null;
  private waitForOpen = false;
  private time = 0;
  private revision: number;
  private mode: InteractionMode = 'idle';
  private surface: PointerRect | null = null;
  private gestures: GestureController;
  private anatomy: HandTrackingInput;
  private ui: HandUiPort;
  private blocked: () => boolean;
  private options: RouterOptions;
  constructor(gestures: GestureController, anatomy: HandTrackingInput & { dwell?: DwellController }, ui: HandUiPort, blocked: () => boolean,
    options: RouterOptions = {}) {
    this.gestures = gestures; this.anatomy = anatomy; this.ui = ui; this.blocked = blocked; this.revision = gestures.inputRevision;
    this.options = options; this.dwell = options.dwell ?? anatomy.dwell ?? new DwellController();
  }
  private reset() {
    this.owner = null; this.capture = null; this.scroll.end(); this.hands.clear(); this.primary = null; this.time = 0;
    this.targets.reset(); this.surface = null; this.waitForOpen = true; this.pointer.reset(); this.mode = 'idle';
    this.ui.feedback(null);
  }
  endGesture() { this.dwell.cancel(); this.anatomy.endGesture(); this.reset(); }
  suspendGesture(now: number, lastReliable: number) {
    this.dwell.pause(now, lastReliable);
    if (this.anatomy.suspendGesture) this.anatomy.suspendGesture(now, lastReliable);
    else this.anatomy.endGesture();
    if (this.scroll.capture && now - lastReliable <= TRACKING_GRACE_MS) {
      this.scroll.pause(); this.hands.clear(); this.primary = null; this.time = 0; this.pointer.reset();
      this.ui.feedback(null); this.mode = 'idle'; return;
    }
    this.reset();
  }
  resumeGesture(now: number, nearby: boolean, lossMs: number) {
    this.dwell.recover(now, nearby, lossMs);
    if (this.scroll.capture && (!nearby || lossMs > TRACKING_GRACE_MS)) this.release();
  }
  private release() {
    this.capture = null; this.scroll.end(); this.dwell.cancel(); this.targets.reset(); this.waitForOpen = true;
    this.pointer.reset(); this.anatomy.endGesture(); this.ui.feedback(null);
    return this.mode = 'idle' as const;
  }
  update(samples: HandSample[], now: number, aspect: number): InteractionMode {
    if (this.revision !== this.gestures.inputRevision) { this.endGesture(); this.revision = this.gestures.inputRevision; }
    if (this.blocked() || this.gestures.manualActive(now) || !Number.isFinite(now) || !Number.isFinite(aspect) || aspect <= 0) { this.endGesture(); return this.mode; }
    if (this.time && now <= this.time) return this.mode;
    if (this.time && now - this.time > MAX_TRACKING_GAP_MS) this.endGesture();
    const valid = samples.slice(0, 2).filter(hand => [hand.x, hand.y, hand.pinchRatio].every(Number.isFinite) && hand.pinchRatio >= 0);
    if (!valid.length || (this.primary && !valid.some(hand => hand.id === this.primary))) { this.endGesture(); return this.mode; }
    this.primary ??= [...valid].sort((a, b) => a.id.localeCompare(b.id))[0].id;
    const primary = valid.find(hand => hand.id === this.primary)!;
    const previous = this.hands.get(primary.id);
    if (previous && Math.hypot(primary.x - previous.x, primary.y - previous.y) > MAX_HAND_JUMP) { this.endGesture(); return this.mode; }
    const surface = this.options.surface ? this.options.surface() : this.ui.surface(aspect);
    if ((this.owner || this.capture || this.scroll.capture) && this.surface && surface && ['left', 'top', 'width', 'height'].some(key => Math.abs(surface[key as keyof PointerRect] - this.surface![key as keyof PointerRect]) > 1)) {
      this.endGesture(); return this.mode;
    }
    this.surface = surface;
    this.hands = new Map(valid.map(hand => [hand.id, { ...hand, pinching: isPinching(hand.pinchRatio, this.hands.get(hand.id)?.pinching) }]));
    this.time = now;
    const anyClosed = [...this.hands.values()].some(hand => hand.pinching);
    const point = this.options.point ? this.options.point() : this.pointer.update(primary, now, aspect, surface);
    if (!point) { this.endGesture(); return this.mode; }
    if (this.waitForOpen) {
      this.ui.feedback(null);
      if (valid.every(hand => hand.pinchRatio >= PINCH_EXIT_RATIO)) { this.waitForOpen = false; this.pointer.reset(); }
      return this.mode = 'idle';
    }
    if (this.scroll.capture) {
      const target = this.ui.resolve(this.scroll.capture.id);
      if (anyClosed) return this.release();
      const result = this.scroll.move(target, point, now);
      if (result.release) return this.release();
      if (result.value !== undefined && result.value !== target?.scroll?.top) this.ui.scroll?.(target!.id, result.value);
      this.ui.feedback({ point, target, stable: true, state: 'scroll' });
      return this.mode = 'pointing';
    }
    if (this.capture) {
      const target = this.ui.resolve(this.capture.id);
      if (anyClosed || !target?.enabled || target.kind !== 'slider') return this.release();
      const outside = point.y < target.rect.top - SLIDER_RELEASE_VERTICAL_PX
        || point.y > target.rect.top + target.rect.height + SLIDER_RELEASE_VERTICAL_PX;
      this.capture.outsideSince = outside ? this.capture.outsideSince ?? now : null;
      if (this.capture.outsideSince !== null && now - this.capture.outsideSince >= SLIDER_RELEASE_MS) return this.release();
      // Freeze while leaving the band, so release movement cannot change the value.
      if (!outside) {
        const value = sliderValue(point.x, target);
        if (value !== null && value !== target.range?.value) this.ui.change(target.id, value);
      }
      this.ui.feedback({ point, target, stable: true, state: 'drag' });
      return this.mode = 'pointing';
    }
    if (this.owner === 'anatomy') {
      const mode = this.anatomy.update(samples, now, aspect);
      if (!anyClosed) this.owner = null;
      return this.mode = mode;
    }
    const hit = this.ui.hitTest(point); this.route = hit.route;
    if (hit.route === 'ui') {
      this.anatomy.endGesture();
      if (anyClosed) { this.release(); this.ui.feedback({ point, target: hit.target, state: 'blocked' }); return this.mode; }
      // Occluders and inert text never inherit a nearby control or anatomy behind them.
      if ((!hit.target?.enabled || hit.blocked) && (this.targets.stable || this.targets.raw)) this.targets.reset();
      const stable = this.targets.update(hit.target?.enabled && !hit.blocked ? hit.target : null, point, now);
      const target = stable ? (stable.id === hit.target?.id ? hit.target : this.ui.resolve(stable.id)) : null;
      const eligible = target?.enabled && (target.kind !== 'scroll-region' || (hit.target?.id === target.id && contains(target.rect, point))) ? target : null;
      // Scroll uses the unchanged one-shot dwell clock; its capture/loss lifecycle belongs to this router.
      const fired = this.dwell.update(eligible ? { domain: 'ui', id: eligible.id, kind: eligible.kind === 'scroll-region' ? 'button' : eligible.kind } : null,
        now, !stable && now - this.targets.rawSince >= UI_TARGET_DWELL_MS);
      this.ui.feedback({ point, target: eligible ?? hit.target, stable: !!eligible, state: 'hover' });
      if (fired && eligible) {
        if (eligible.kind === 'slider') {
          this.capture = { id: eligible.id, outsideSince: null };
          this.ui.feedback({ point, target: eligible, stable: true, state: 'drag' });
        } else if (eligible.kind === 'scroll-region') {
          if (this.scroll.begin(eligible, point)) this.ui.feedback({ point, target: eligible, stable: true, state: 'scroll' });
        } else this.ui.activate(eligible.id);
        this.options.confirm?.();
      }
      return this.mode = 'pointing';
    }
    this.targets.reset(); this.ui.feedback(null); this.dwell.cancel('ui');
    if (anyClosed) this.owner = 'anatomy';
    return this.mode = this.anatomy.update(samples, now, aspect);
  }
}
