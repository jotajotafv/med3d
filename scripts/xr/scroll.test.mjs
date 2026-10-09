import test from 'node:test';
import assert from 'node:assert/strict';
import { HandScroll, SCROLL_HAND_GAIN, SCROLL_RELEASE_HORIZONTAL_PX, SCROLL_RELEASE_MS } from '../../src/features/xr/ui/handScroll.ts';
import { HandUiRouter, contains } from '../../src/features/xr/ui/handUiRouter.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandStability } from '../../src/features/xr/handStability.ts';
import { TRACKING_GRACE_MS } from '../../src/features/xr/handConfig.ts';
import { GestureController } from '../../src/features/xr/gestures.ts';

const surface = { left: 0, top: 0, width: 1000, height: 750 };
const target = (top = 200, max = 1200) => ({ id: 'education-scroll', kind: 'scroll-region', enabled: true,
  rect: { left: 400, top: 100, width: 300, height: 400 }, scroll: { top, max, token: {} } });
function fixture({ pipeline = false, max = 1200 } = {}) {
  let control = target(200, max), point = { x: 550, y: 375 }, time = 100, manual = false, stability;
  const gestures = new GestureController(), writes = [], actions = [], selected = [], queries = [];
  const anatomy = new HandInteraction(gestures, { viewport: () => surface, point: () => point,
    targetKey: value => value.id, hitTest: p => { queries.push(p); return { id: 'bone' }; }, select: hit => selected.push(hit), draw() {} });
  const port = { surface: () => surface, resolve: () => control,
    hitTest: p => p.x < 350 ? { route: 'anatomy' } : { route: 'ui', target: control && contains(control.rect, p) && control.scroll.max > 0 ? control : null },
    activate: id => actions.push(id), change() {}, scroll: (id, value) => { writes.push(value); control.scroll.top = value; }, feedback() {} };
  const router = new HandUiRouter(gestures, anatomy, port, () => manual, { point: () => pipeline ? stability.point : point, surface: () => surface });
  stability = new HandStability(router, gestures, { surface: () => surface, blocked: () => manual, report() {} });
  const sample = (ratio = .5) => ({ id: 'Left', x: point.x / 1000, y: point.y / 750, indexX: point.x / 1000, indexY: point.y / 750, pinchRatio: ratio });
  const tick = (dt = 50, ratio = .5, missing = false) => (pipeline ? stability : router).update(missing ? [] : [sample(ratio)], time += dt, 4 / 3);
  const hold = (count = 36) => { for (let i = 0; i < count; i++) tick(); };
  return { router, stability, gestures, writes, actions, selected, queries, tick, hold, control: () => control,
    point: value => { point = value; }, now: () => time, manual: () => { manual = true; }, remove: () => { control = null; }, replace: () => { control = target(); } };
}
test('short content never acquires scroll; long content needs exactly the existing 1000ms stable dwell', () => {
  const short = fixture({ max: 0 }); short.hold(60); assert.equal(short.router.scroll.capture, null);
  const f = fixture(); while (f.router.dwell.state !== 'dwelling') f.tick();
  for (let i = 0; i < 19; i++) f.tick(); f.tick(49);
  assert.equal(f.router.dwell.elapsedMs, 999); assert.equal(f.router.scroll.capture, null);
  f.tick(1); assert.ok(f.router.scroll.capture);
  assert.equal(f.router.scroll.capture.startPointerY, 375); assert.equal(f.router.scroll.capture.startScrollTop, 200);
  assert.equal(f.writes.length, 0, 'capture itself has no jump');
});
test('relative upward/downward motion follows touch direction with central gain and no model interaction after 550ms', () => {
  const f = fixture(); f.hold(); const pose = { ...f.gestures.target };
  f.point({ x: 550, y: 335 }); f.tick(); assert.equal(f.control().scroll.top, 200 + 40 * SCROLL_HAND_GAIN);
  f.point({ x: 550, y: 415 }); f.tick(); assert.equal(f.control().scroll.top, 200 - 40 * SCROLL_HAND_GAIN);
  f.hold(20); assert.deepEqual(f.gestures.target, pose); assert.deepEqual(f.queries, []); assert.deepEqual(f.actions, []); assert.deepEqual(f.selected, []);
});
test('scroll clamps both edges; small horizontal jitter cannot release; exit must be sustained', () => {
  const scroll = new HandScroll(), t = target(30, 100); assert.equal(scroll.begin(t, { x: 550, y: 375 }), true);
  assert.equal(scroll.move(t, { x: 550, y: 600 }, 100).value, 0);
  assert.equal(scroll.move(t, { x: 550, y: 0 }, 150).value, 100);
  const outside = { x: 700 + SCROLL_RELEASE_HORIZONTAL_PX + 1, y: 375 };
  assert.equal(scroll.move(t, { x: outside.x - 2, y: 375 }, 500).release, false);
  assert.equal(scroll.move(t, outside, 600).value, undefined);
  assert.equal(scroll.move(t, outside, 600 + SCROLL_RELEASE_MS - 1).release, false);
  scroll.move(t, { x: 550, y: 375 }, 900); // A brief return resets the departure clock.
  scroll.move(t, outside, 950);
  assert.equal(scroll.move(t, outside, 950 + SCROLL_RELEASE_MS).release, true);
});
for (const reason of ['pinch', 'secondary pinch', 'manual', 'close', 'replace', 'no overflow', 'disabled', 'unmount']) {
  test(`${reason} releases scroll without anatomy selection, rotation or an extra scroll write`, () => {
    const f = fixture(); f.hold(); assert.ok(f.router.scroll.capture); const count = f.writes.length;
    if (reason === 'pinch') f.tick(50, .2);
    else if (reason === 'secondary pinch') f.router.update([{ id: 'Left', x: .55, y: .5, pinchRatio: .5 }, { id: 'Right', x: .6, y: .5, pinchRatio: .2 }], f.now() + 50, 4 / 3);
    else if (reason === 'unmount') f.router.endGesture();
    else {
      if (reason === 'manual') f.manual();
      if (reason === 'close') f.remove();
      if (reason === 'replace') f.replace();
      if (reason === 'no overflow') f.control().scroll.max = 0;
      if (reason === 'disabled') f.control().enabled = false;
      f.tick();
    }
    assert.equal(f.router.scroll.capture, null); assert.equal(f.writes.length, count);
    assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 }); assert.equal(f.selected.length, 0);
  });
}
test('horizontal release latches the target; staying/reentering without a stable departure cannot recapture', () => {
  const f = fixture(); f.hold(); f.point({ x: 600, y: 375 }); f.tick(); f.point({ x: 680, y: 375 }); f.tick(); f.point({ x: 765, y: 375 }); f.hold(7);
  assert.equal(f.router.scroll.capture, null);
  f.point({ x: 680, y: 375 }); f.tick(); f.point({ x: 550, y: 375 }); f.hold(40); assert.equal(f.router.scroll.capture, null);
  f.point({ x: 680, y: 375 }); f.tick(); f.point({ x: 740, y: 375 }); f.hold(10);
  f.point({ x: 680, y: 375 }); f.tick(); f.point({ x: 550, y: 375 }); f.hold(40); assert.ok(f.router.scroll.capture);
});
test('real stability pipeline pauses in grace and rebases at reacquire before continuing', () => {
  const f = fixture({ pipeline: true }); f.hold(40); assert.ok(f.router.scroll.capture);
  f.point({ x: 550, y: 340 }); f.hold(8); const top = f.control().scroll.top;
  f.tick(50, .5, true); f.tick(50, .5, true);
  assert.equal(f.stability.trackingState, 'grace'); assert.equal(f.router.scroll.capture.paused, true); assert.equal(f.control().scroll.top, top);
  f.point({ x: 550, y: 350 });
  while (f.stability.trackingState !== 'tracking') { f.tick(); assert.equal(f.control().scroll.top, top); }
  assert.equal(f.router.scroll.capture.startScrollTop, top);
  assert.equal(f.router.scroll.capture.startPointerY, f.stability.point.y);
  f.point({ x: 550, y: 325 }); f.hold(8); assert.ok(f.control().scroll.top > top);
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('definitive tracking loss clears capture; stale results cannot scroll', () => {
  const f = fixture({ pipeline: true }); f.hold(40); const top = f.control().scroll.top;
  f.stability.update([], f.now() - 1, 4 / 3); assert.equal(f.control().scroll.top, top);
  for (let i = 0; i <= Math.ceil(TRACKING_GRACE_MS / 50); i++) f.tick(50, .5, true);
  assert.equal(f.stability.trackingState, 'lost'); assert.equal(f.router.scroll.capture, null);
  assert.equal(f.control().scroll.top, top);
});
