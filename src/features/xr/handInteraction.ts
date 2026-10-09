import { GestureController, isPinching } from './gestures.ts';
import { HandPointer, type PointerPoint, type PointerRect } from './handPointer.ts';
import { pinchDurationBand, PINCH_HOLD_THRESHOLD, ROTATE_MOVE_THRESHOLD, MAX_TRACKING_GAP_MS, MAX_HAND_JUMP } from './handConfig.ts';
import type { HandSample, InteractionMode, ModelTransform } from './types';

export type HandCursor<T> = { point: PointerPoint; hovered: T | null; mode: InteractionMode };
export type PinchCalibration = { durationMs: number; maxCandidateMovement: number; minRatio: number; outcome: 'select' | 'rotate' | 'cancel' };
type Ports<T> = {
  viewport: () => PointerRect | null;
  hitTest: (point: PointerPoint) => T | null;
  select: (target: T) => void;
  draw: (cursor: HandCursor<T> | null) => void;
  blocked?: () => boolean;
  reportCalibration?: (summary: PinchCalibration) => void;
};
type Tracked = HandSample & { pinching: boolean };
type Candidate<T> = { time: number; origin: PointerPoint; point: PointerPoint | null; target: T | null; pose: ModelTransform };

/** Pure interaction arbitration. No camera, DOM, Three.js, or React state. */
export class HandInteraction<T> {
  mode: InteractionMode = 'idle';
  primaryId: string | null = null;
  hoveredHandStructure: T | null = null;
  private hands = new Map<string, Tracked>();
  private candidate: Candidate<T> | null = null;
  private pinchOwner: string | null = null;
  private calibration: { started: number; maxCandidateMovement: number; minRatio: number } | null = null;
  private pointer = new HandPointer();
  private time = 0;
  private revision: number;
  private gestures: GestureController;
  private ports: Ports<T>;
  constructor(gestures: GestureController, ports: Ports<T>) {
    this.gestures = gestures; this.ports = ports; this.revision = gestures.inputRevision;
  }
  private finishPinch(outcome: PinchCalibration['outcome'], now: number) {
    const summary = this.calibration; this.calibration = null;
    if (summary) this.ports.reportCalibration?.({ durationMs: Math.max(0, (Number.isFinite(now) ? now : this.time) - summary.started),
      maxCandidateMovement: summary.maxCandidateMovement, minRatio: summary.minRatio, outcome });
  }
  endGesture(now = this.time) {
    this.finishPinch(this.mode === 'rotate' ? 'rotate' : 'cancel', now);
    this.mode = 'idle'; this.primaryId = null; this.hoveredHandStructure = null;
    this.hands.clear(); this.candidate = null; this.pinchOwner = null; this.pointer.reset(); this.time = 0;
    this.gestures.endGesture(); this.ports.draw(null);
  }
  update(samples: HandSample[], now: number, aspect = 4 / 3): InteractionMode {
    if (this.revision !== this.gestures.inputRevision) {
      this.endGesture(now); this.revision = this.gestures.inputRevision;
    }
    if (this.gestures.manualActive(now) || this.ports.blocked?.()) { this.endGesture(now); return this.mode; }
    if (!Number.isFinite(now) || !Number.isFinite(aspect) || aspect <= 0) { this.endGesture(); return this.mode; }
    if (this.time && now <= this.time) return this.mode; // Duplicate/stale inference does no picking.
    if (this.time && now - this.time > MAX_TRACKING_GAP_MS) this.endGesture(this.time);
    const valid = samples.slice(0, 2).filter(hand => [hand.x, hand.y, hand.pinchRatio].every(Number.isFinite) && hand.pinchRatio >= 0);
    if (!valid.length || (this.primaryId && !valid.some(hand => hand.id === this.primaryId))) {
      this.endGesture(now); return this.mode; // Hide for this result; a new primary can be acquired next time.
    }
    if (!this.primaryId) this.primaryId = [...valid].sort((a, b) => a.id.localeCompare(b.id))[0].id;
    const primary = valid.find(hand => hand.id === this.primaryId)!;
    const previous = this.hands.get(primary.id);
    if (previous && Math.hypot(primary.x - previous.x, primary.y - previous.y) > MAX_HAND_JUMP) {
      this.endGesture(now); return this.mode;
    }
    const next = new Map(valid.map(hand => [hand.id, { ...hand, pinching: isPinching(hand.pinchRatio, this.hands.get(hand.id)?.pinching) }]));
    this.hands = next; this.time = now;
    const active = [...next.values()].filter(hand => hand.pinching);
    if (active.length === 2) {
      this.finishPinch('cancel', now); this.pinchOwner = null;
      this.candidate = null; this.mode = 'scale'; this.hoveredHandStructure = null;
      this.pointer.reset(); this.gestures.update(valid, now, aspect); this.ports.draw(null); return this.mode;
    }
    const point = this.pointer.update(primary, now, aspect, this.ports.viewport());
    const hit = point ? this.ports.hitTest(point) : null;
    this.hoveredHandStructure = hit;
    if (active.length === 1) {
      const pinching = active[0];
      if (this.pinchOwner !== pinching.id) {
        this.finishPinch(this.mode === 'rotate' ? 'rotate' : 'cancel', now);
        this.pinchOwner = pinching.id;
        this.calibration = this.ports.reportCalibration ? { started: now, maxCandidateMovement: 0, minRatio: pinching.pinchRatio } : null;
        if (this.mode === 'scale') { this.candidate = null; this.mode = 'rotate'; }
        else {
          // A hand acquired closed (or the secondary hand) must also show manipulation intent.
          // It can never select without an observed open → closed transition of the primary.
          const maySelect = pinching.id === primary.id && previous && !previous.pinching;
          this.candidate = { time: now, origin: { x: pinching.x, y: pinching.y }, point,
            target: maySelect ? hit : null, pose: { ...this.gestures.target } };
          this.mode = 'candidate';
        }
      }
      if (this.calibration) this.calibration.minRatio = Math.min(this.calibration.minRatio, pinching.pinchRatio);
      if (this.candidate) {
        if (!point || hit === null) this.candidate.target = null; // Invalid tracking is never an empty selection.
        const moved = Math.hypot((pinching.x - this.candidate.origin.x) * aspect, pinching.y - this.candidate.origin.y);
        if (this.calibration) this.calibration.maxCandidateMovement = Math.max(this.calibration.maxCandidateMovement, moved);
        if (moved > ROTATE_MOVE_THRESHOLD || now - this.candidate.time >= PINCH_HOLD_THRESHOLD) {
          this.candidate = null; this.mode = 'rotate';
        }
      }
      // Keep the existing anchor/filter warm, but freeze rotation throughout the click candidate.
      this.gestures.update(valid, now, aspect, this.mode !== 'candidate');
    } else {
      const candidate = this.candidate;
      const held = candidate && pinchDurationBand(now - candidate.time) === 'hold';
      let outcome: PinchCalibration['outcome'] = this.mode === 'rotate' || held ? 'rotate' : 'cancel';
      this.candidate = null; this.pinchOwner = null; this.mode = point ? 'pointing' : 'idle';
      this.gestures.update(valid, now, aspect);
      if (candidate && previous?.pinching && point && candidate.target !== null && !held) {
        this.ports.select(candidate.target); // Snapshot at pinch onset; never retarget on release.
        outcome = 'select'; // Includes the 450–550 ms grace interval: no dropped stable gesture.
      }
      this.finishPinch(outcome, now);
    }
    this.ports.draw(point ? { point, hovered: hit, mode: this.mode } : null);
    return this.mode;
  }
}
