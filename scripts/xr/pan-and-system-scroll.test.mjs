import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureController, TWO_HAND_VERTICAL_PAN_SENSITIVITY, MIN_VERTICAL_OFFSET, MAX_VERTICAL_OFFSET } from '../../src/features/xr/gestures.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandUiRouter, contains } from '../../src/features/xr/ui/handUiRouter.ts';
import { HandStability } from '../../src/features/xr/handStability.ts';

const pair = (y = .5, distance = .3, ratio = .2) => [
  { id: 'Left', x: .4 - distance / 2, y, indexX: .4 - distance / 2, indexY: y, pinchRatio: ratio },
  { id: 'Right', x: .4 + distance / 2, y, indexX: .4 + distance / 2, indexY: y, pinchRatio: ratio },
];
const near = (a, b, tolerance = .001) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const fixture = () => {
  const gestures = new GestureController({ verticalPan: true }); let time = 100;
  const tick = (hands) => gestures.update(hands, time += 50);
  const hold = (hands, count = 20) => { for (let i = 0; i < count; i++) tick(hands); };
  return { gestures, tick, hold };
};
for (const [name, center, sign] of [['up', .35, 1], ['down', .65, -1]]) test(`two pinches with unchanged distance pan ${name}, preserve scale/rotation and use the starting baseline`, () => {
  const f = fixture(); f.tick(pair()); f.hold(pair(center));
  near(f.gestures.verticalOffset, (.5 - center) * TWO_HAND_VERTICAL_PAN_SENSITIVITY);
  assert.equal(Math.sign(f.gestures.verticalOffset), sign); near(f.gestures.target.scale, 1);
  assert.equal(f.gestures.target.rotationX, 0); assert.equal(f.gestures.target.rotationY, 0);
  const before = f.gestures.verticalOffset; f.hold(pair(center), 100); near(f.gestures.verticalOffset, before);
});
test('distance-only scaling exactly matches the existing scale gesture without vertical drift', () => {
  const f = fixture(), legacy = new GestureController(); legacy.update(pair(), 150); f.tick(pair());
  for (let i = 1; i <= 20; i++) { const hands = pair(.5, .3 + .006 * i); f.tick(hands); legacy.update(hands, 150 + i * 50); }
  assert.equal(f.gestures.target.scale, legacy.target.scale); assert.ok(f.gestures.target.scale > 1);
  assert.equal(f.gestures.verticalOffset, 0);
});
test('scale and vertical pan coexist from one baseline without moving individual source parts', () => {
  const f = fixture(); f.tick(pair()); f.hold(pair(.4, .4));
  assert.ok(f.gestures.target.scale > 1.25); near(f.gestures.verticalOffset, .4);
  assert.equal(f.gestures.target.rotationX, 0); assert.equal(f.gestures.target.rotationY, 0);
});
for (const [name, direction, expected] of [['upper', -1, MAX_VERTICAL_OFFSET], ['lower', 1, MIN_VERTICAL_OFFSET]]) test(`two-hand pan clamps the ${name} bound`, () => {
  const f = fixture(); f.tick(pair());
  for (let i = 1; i <= 12; i++) f.tick(pair(.5 + i * .03 * direction));
  f.hold(pair(.5 + .36 * direction)); assert.equal(f.gestures.verticalOffset, expected);
});
test('one-hand loss freezes pan; second-hand return uses a new distance and center baseline without a jump', () => {
  const f = fixture(); f.tick(pair()); f.hold(pair(.4)); const offset = f.gestures.verticalOffset;
  f.tick(pair(.4).slice(0, 1)); f.hold(pair(.45).slice(0, 1)); assert.equal(f.gestures.verticalOffset, offset);
  const scale = f.gestures.target.scale; f.tick(pair(.45, .4));
  assert.equal(f.gestures.verticalOffset, offset); assert.equal(f.gestures.target.scale, scale);
  f.hold(pair(.4, .4)); near(f.gestures.verticalOffset, offset + .2);
});
test('tracking gaps and invalid results reanchor vertical pan instead of applying stale deltas', () => {
  const f = fixture(); f.tick(pair()); f.hold(pair(.4)); const offset = f.gestures.verticalOffset;
  f.gestures.update([], 1400); assert.equal(f.gestures.verticalOffset, offset);
  f.gestures.update(pair(.7), 2000); assert.equal(f.gestures.verticalOffset, offset);
  f.gestures.update(pair(.1), NaN); assert.equal(f.gestures.verticalOffset, offset);
});
test('reset restores Y, scale and rotation; manual pan clamps and interrupts hand input; legacy Heart does not pan', () => {
  const f = fixture(); f.tick(pair()); f.hold(pair(.35, .4)); f.gestures.panVertical(5, 1600);
  assert.equal(f.gestures.verticalOffset, MAX_VERTICAL_OFFSET);
  f.gestures.update(pair(.8), 1650); assert.equal(f.gestures.verticalOffset, MAX_VERTICAL_OFFSET);
  f.gestures.panVertical(-5, 1800); assert.equal(f.gestures.verticalOffset, MIN_VERTICAL_OFFSET);
  f.gestures.reset(); assert.equal(f.gestures.verticalOffset, 0); assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
  const legacy = new GestureController(); legacy.update(pair(), 100); legacy.update(pair(.4), 150); legacy.panVertical(.5, 200);
  assert.equal(legacy.verticalOffset, 0);
});

const surface = { left: 0, top: 0, width: 1000, height: 750 };
function uiFixture(kind = 'scroll-region', pipeline = false) {
  const gestures = new GestureController({ verticalPan: true }); let time = 100, point = { x: 800, y: 375 }, live = true, stability;
  const target = { id: kind === 'scroll-region' ? 'systems-scroll' : 'skeletal-opacity', kind, enabled: true,
    rect: { left: 700, top: 100, width: 250, height: 500 }, scroll: { top: 100, max: 600, token: {} }, range: { min: 10, max: 100, step: 1, value: 100 } };
  const actions = [], picks = [], writes = [];
  const anatomy = new HandInteraction(gestures, { viewport: () => surface, point: () => point, targetKey: t => t.id,
    hitTest: p => { picks.push(p); return { id: 'bone' }; }, select: t => actions.push(t.id), draw() {} });
  const port = { surface: () => surface, resolve: () => live ? target : null,
    hitTest: p => ({ route: 'ui', target: live && contains(target.rect, p) ? target : null }),
    activate: id => actions.push(id), change: () => actions.push('opacity'),
    scroll: (id, value) => { writes.push(value); target.scroll.top = value; }, feedback() {} };
  const router = new HandUiRouter(gestures, anatomy, port, () => false, { point: () => pipeline ? stability.point : point, surface: () => surface });
  stability = new HandStability(router, gestures, { surface: () => surface, blocked: () => false, report() {} });
  const sample = (ratio = .5) => ({ id: 'Left', x: point.x / 1000, y: point.y / 750, indexX: point.x / 1000, indexY: point.y / 750, pinchRatio: ratio });
  const tick = (dt = 50, hands = [sample()]) => (pipeline ? stability : router).update(hands, time += dt, 4 / 3);
  const hold = (count = 36) => { for (let i = 0; i < count; i++) tick(); };
  return { gestures, router, stability, target, actions, picks, writes, tick, hold, sample,
    point: p => { point = p; }, close: () => { live = false; } };
}
test('systems region uses the unchanged 1000ms dwell and relative scroll, with no anatomy/pose/toggle changes', () => {
  const f = uiFixture(); while (f.router.dwell.state !== 'dwelling') f.tick();
  for (let i = 0; i < 19; i++) f.tick(); f.tick(49); assert.equal(f.router.scroll.capture, null);
  f.tick(1); assert.ok(f.router.scroll.capture); assert.equal(f.writes.length, 0);
  f.point({ x: 800, y: 325 }); f.tick(); assert.equal(f.target.scroll.top, 162.5);
  f.point({ x: 800, y: 425 }); f.tick(); assert.equal(f.target.scroll.top, 37.5);
  f.hold(20); assert.equal(f.gestures.verticalOffset, 0); assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
  assert.deepEqual(f.actions, []); assert.deepEqual(f.picks, []);
});
for (const kind of ['scroll-region', 'slider', 'toggle']) test(`${kind} owns UI before two pinches; neither pan nor scale can leak through`, () => {
  const f = uiFixture(kind); f.hold(kind === 'toggle' ? 5 : 30);
  f.tick(50, [{ ...f.sample(.2) }, { ...f.sample(.2), id: 'Right', x: .9 }]);
  for (let i = 0; i < 20; i++) f.tick(50, [{ ...f.sample(.2), y: .4 }, { ...f.sample(.2), id: 'Right', x: .95, y: .4 }]);
  assert.equal(f.gestures.verticalOffset, 0); assert.equal(f.gestures.target.scale, 1); assert.deepEqual(f.picks, []);
});
test('system scroll grace pauses and reacquire rebases; closing the region releases it', () => {
  const f = uiFixture('scroll-region', true); f.hold(40); assert.ok(f.router.scroll.capture);
  f.point({ x: 800, y: 340 }); f.hold(8); const top = f.target.scroll.top;
  f.tick(50, []); f.tick(50, []); assert.equal(f.router.scroll.capture.paused, true); assert.equal(f.target.scroll.top, top);
  f.point({ x: 800, y: 350 });
  while (f.stability.trackingState !== 'tracking') { f.tick(); assert.equal(f.target.scroll.top, top); }
  assert.equal(f.router.scroll.capture.startScrollTop, top);
  f.close(); f.tick(); assert.equal(f.router.scroll.capture, null); assert.equal(f.gestures.verticalOffset, 0);
});
