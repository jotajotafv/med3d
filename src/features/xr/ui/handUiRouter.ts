import { HandPointer, type PointerPoint, type PointerRect } from '../handPointer.ts';
import { isPinching, type GestureController } from '../gestures.ts';
import { MAX_HAND_JUMP, MAX_TRACKING_GAP_MS, PINCH_HOLD_THRESHOLD, PINCH_EXIT_RATIO, UI_TARGET_DWELL_MS, UI_CAPTURE_TOLERANCE_PX } from '../handConfig.ts';
import { TargetStability } from '../targetStability.ts';
import type { HandSample, HandTrackingInput, InteractionMode } from '../types';

export type UiTarget = { id: string; name?: string; kind: 'button' | 'toggle' | 'slider'; rect: PointerRect; enabled: boolean;
  range?: { min: number; max: number; step: number | 'any'; value: number } };
export type UiHit = { route: 'anatomy' } | { route: 'ui'; target: UiTarget | null; blocked?: boolean };
export type UiFeedback = { point: PointerPoint; target: UiTarget | null; stable?: boolean; state: 'hover' | 'press' | 'drag' | 'blocked' } | null;
export interface HandUiPort {
  surface(aspect: number): PointerRect | null;
  hitTest(point: PointerPoint): UiHit;
  resolve(id: string): UiTarget | null;
  activate(id: string): void;
  change(id: string, value: number): void;
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
type RouterOptions = { point?: () => PointerPoint | null; surface?: () => PointerRect | null; reportPinch?: (outcome: 'select' | 'cancel') => void };

/** One owner from onset through release. DOM lives in the port; anatomy remains unchanged. */
export class HandUiRouter implements HandTrackingInput {
  readonly targets = new TargetStability<UiTarget>(target => target.id, UI_TARGET_DWELL_MS);
  route: 'ui' | 'anatomy' = 'anatomy';
  private pointer = new HandPointer();
  private hands = new Map<string, Tracked>();
  private primary: string | null = null;
  private owner: 'ui' | 'anatomy' | null = null;
  private capture: { id: string; kind: UiTarget['kind']; started: number; cancelled: boolean } | null = null;
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
  constructor(gestures: GestureController, anatomy: HandTrackingInput, ui: HandUiPort, blocked: () => boolean,
    options: RouterOptions = {}) {
    this.gestures = gestures; this.anatomy = anatomy; this.ui = ui; this.blocked = blocked; this.revision = gestures.inputRevision;
    this.options = options;
  }
  endGesture() {
    if (this.owner === 'ui') this.options.reportPinch?.('cancel');
    this.owner = null; this.capture = null; this.hands.clear(); this.primary = null; this.time = 0;
    this.targets.reset();
    this.surface = null; this.waitForOpen = true; this.pointer.reset(); this.mode = 'idle';
    this.anatomy.endGesture(); this.ui.feedback(null);
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
    if (this.owner && this.surface && surface && ['left', 'top', 'width', 'height'].some(key => Math.abs(surface[key as keyof PointerRect] - this.surface![key as keyof PointerRect]) > 1)) {
      this.endGesture(); return this.mode; // Scroll/resize cannot move a captured control beneath a closed hand.
    }
    this.surface = surface;
    this.hands = new Map(valid.map(hand => [hand.id, { ...hand, pinching: isPinching(hand.pinchRatio, this.hands.get(hand.id)?.pinching) }]));
    this.time = now;
    const pinching = this.hands.get(primary.id)!.pinching, anyClosed = [...this.hands.values()].some(hand => hand.pinching);
    const point = this.options.point ? this.options.point() : this.pointer.update(primary, now, aspect, surface);
    if (!point) { this.endGesture(); return this.mode; }
    if (this.waitForOpen) {
      this.ui.feedback(null);
      if (valid.every(hand => hand.pinchRatio >= PINCH_EXIT_RATIO)) { this.waitForOpen = false; this.pointer.reset(); }
      return this.mode = 'idle'; // This release only re-arms; it never reaches anatomy.
    }
    if (this.owner === 'anatomy') {
      const mode = this.anatomy.update(samples, now, aspect);
      if (!anyClosed) this.owner = null;
      return this.mode = mode;
    }
    if (this.owner === 'ui') {
      const capture = this.capture;
      const target = capture ? this.ui.resolve(capture.id) : null;
      if (capture && (!target?.enabled || target.kind !== capture.kind)) capture.cancelled = true;
      if (capture && target && capture.kind !== 'slider') {
        const hit = this.ui.hitTest(point);
        if (!contains(target.rect, point, UI_CAPTURE_TOLERANCE_PX) || hit.route !== 'ui' || hit.blocked
          || (hit.target && hit.target.id !== capture.id)) capture.cancelled = true;
      }
      if (pinching) {
        if (capture && target?.enabled && !capture.cancelled && capture.kind === 'slider') {
          const value = sliderValue(point.x, target);
          if (value !== null && value !== target.range?.value) this.ui.change(target.id, value);
        }
        this.ui.feedback({ point, target, stable: !!capture && !capture.cancelled, state: capture?.cancelled || !capture ? 'blocked' : capture.kind === 'slider' ? 'drag' : 'press' });
        return this.mode = 'candidate';
      }
      // Clear ownership before callbacks: a view reset may synchronously call endGesture.
      this.owner = null; this.capture = null; this.waitForOpen = true; this.pointer.reset(); this.anatomy.endGesture();
      this.targets.reset();
      this.ui.feedback(null);
      const accepted = !!capture && !!target?.enabled && !capture.cancelled && (capture.kind === 'slider' || now - capture.started < PINCH_HOLD_THRESHOLD);
      this.options.reportPinch?.(accepted ? 'select' : 'cancel');
      if (accepted && capture.kind !== 'slider') this.ui.activate(capture.id);
      return this.mode = 'idle';
    }
    const hit = this.ui.hitTest(point);
    this.route = hit.route;
    if (hit.route === 'ui') {
      this.anatomy.endGesture();
      // An occluder/unauthorized region cannot inherit a nearby stable control.
      if (!hit.target?.enabled) this.targets.reset();
      const stable = this.targets.update(hit.target?.enabled ? hit.target : null, point, now);
      const target = stable && stable.id === hit.target?.id ? hit.target : null;
      if (anyClosed) {
        this.owner = 'ui';
        this.capture = pinching && previous && !previous.pinching && target?.enabled
          ? { id: target.id, kind: target.kind, started: now, cancelled: false } : null;
        if (this.capture?.kind === 'slider' && target) {
          const value = sliderValue(point.x, target);
          if (value !== null && value !== target.range?.value) this.ui.change(target.id, value);
        }
      }
      this.ui.feedback({ point, target: hit.target, stable: !!target, state: anyClosed ? this.capture ? this.capture.kind === 'slider' ? 'drag' : 'press' : 'blocked' : 'hover' });
      return this.mode = anyClosed ? 'candidate' : 'pointing';
    }
    this.targets.reset(); this.ui.feedback(null);
    if (anyClosed) this.owner = 'anatomy';
    return this.mode = this.anatomy.update(samples, now, aspect);
  }
}
