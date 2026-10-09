export const TAP_MOVEMENT_PX = 6;
export const TAP_MAX_DURATION_MS = 450;
type Point = { x: number; y: number };
type Candidate = { pointerId: number; origin: Point; started: number; dragging: boolean; multiple: boolean };

/** A movement beyond the threshold permanently cancels tap, even if it returns. */
export class PointerIntent {
  private candidate: Candidate | null = null;
  begin(pointerId: number, point: Point, time: number) {
    if (this.candidate) { this.candidate.multiple = true; return; }
    this.candidate = { pointerId, origin: point, started: time, dragging: false, multiple: false };
  }
  move(pointerId: number, point: Point) {
    const candidate = this.candidate;
    if (!candidate || candidate.pointerId !== pointerId) return true;
    if (Math.hypot(point.x - candidate.origin.x, point.y - candidate.origin.y) > TAP_MOVEMENT_PX) candidate.dragging = true;
    return candidate.dragging || candidate.multiple;
  }
  finish(pointerId: number, point: Point, time: number) {
    const candidate = this.candidate;
    if (!candidate || candidate.pointerId !== pointerId) return false;
    const moved = this.move(pointerId, point);
    this.candidate = null;
    return !moved && time >= candidate.started && time - candidate.started <= TAP_MAX_DURATION_MS;
  }
  cancel() { this.candidate = null; }
}
