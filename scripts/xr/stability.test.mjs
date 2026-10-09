import test from 'node:test';
import assert from 'node:assert/strict';
import { HandPointer } from '../../src/features/xr/handPointer.ts';
import { HandStability } from '../../src/features/xr/handStability.ts';
import { TargetStability } from '../../src/features/xr/targetStability.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandUiRouter } from '../../src/features/xr/ui/handUiRouter.ts';
import { GestureController } from '../../src/features/xr/gestures.ts';
import * as config from '../../src/features/xr/handConfig.ts';

const rect = { left: 0, top: 0, width: 800, height: 600 }, aspect = 4 / 3;
const hand = (x = .4, y = .5, pinchRatio = .8, id = 'Left') => ({ id, x, y, indexX: x, indexY: y, pinchRatio });
const a = { kind: 'selected', id: 'A' }, b = { kind: 'selected', id: 'B' };
const idlePose = { rotationX: 0, rotationY: 0, scale: 1 };
function fixture({ ui = false, hit = () => a } = {}) {
  const gestures = new GestureController(), selected = [], queries = [], reports = [], actions = [], values = [], frames = [];
  const control = { id: 'muscle', name: 'Muscular', kind: 'toggle', enabled: true, rect: { left: 500, top: 150, width: 150, height: 200 } };
  let time = 100, stability, rawUi = control;
  const anatomy = new HandInteraction(gestures, { targetKey: t => t?.id ?? null, viewport: () => rect,
    point: () => stability.point, hitTest: p => { queries.push(p); return hit(p); },
    select: value => selected.push(value), draw() {} });
  const port = { surface: () => rect, hitTest: p => p.x >= 480 ? { route: 'ui', target: rawUi } : { route: 'anatomy' },
    resolve: () => control.enabled ? control : null, activate: id => actions.push(id),
    change: (id, value) => { values.push(value); control.range.value = value; }, feedback: value => frames.push(value) };
  const router = ui ? new HandUiRouter(gestures, anatomy, port, () => false, { point: () => stability.point }) : null;
  stability = new HandStability(router ?? anatomy, gestures, { surface: () => rect, blocked: () => false, report: r => reports.push(r) });
  const tick = (hands = [hand()], dt = 50) => stability.update(hands, time += dt, aspect);
  const warm = (h = hand(), count = 12) => { for (let i = 0; i < count; i++) tick([h]); };
  return { gestures, selected, queries, reports, anatomy, router, stability, actions, values, frames, control, tick, warm,
    time: () => time, rawUi: value => { rawUi = value; } };
}
test('adaptive EMA uses real dt: quick motion responds faster than slow motion', () => {
  const fast = new HandPointer(), slow = new HandPointer();
  fast.update(hand(), 100, aspect, rect); slow.update(hand(), 100, aspect, rect);
  const f = fast.update(hand(.47), 150, aspect, rect), s = slow.update(hand(.402), 150, aspect, rect);
  assert.equal(fast.smoothingMs, 45); assert.equal(slow.smoothingMs, 110);
  assert.ok((f.x / 800 - .4) / .07 > (s.x / 800 - .4) / .002);
  assert.ok(Math.abs(fast.velocity - 1.4) < 1e-8);
});
test('small realistic jitter has lower spread after filtering without a dead zone', () => {
  const pointer = new HandPointer(), raw = [], filtered = [];
  for (let i = 0; i < 100; i++) {
    const x = .4 + Math.sin(i * 2.1) * .004;
    raw.push(x); filtered.push(pointer.update(hand(x), 100 + i * 50, aspect, rect).x / 800);
  }
  const spread = v => Math.max(...v) - Math.min(...v);
  assert.ok(spread(filtered) < spread(raw) * .5); assert.ok(spread(filtered) > 0);
});
test('an outlier cannot teleport the filter; it does not poison the next valid sample', () => {
  const pointer = new HandPointer(); pointer.update(hand(), 100, aspect, rect);
  assert.equal(pointer.update(hand(.95), 150, aspect, rect), null); assert.deepEqual(pointer.point, { x: .4, y: .5 });
  assert.ok(pointer.update(hand(.402), 200, aspect, rect).x < 322);
});
test('invalid dt, large gap, NaN and off-video points never contaminate pointer state', () => {
  const pointer = new HandPointer(); pointer.update(hand(), 100, aspect, rect);
  for (const [h, t] of [[hand(.5), 100], [hand(.5), 99], [hand(.5), NaN], [hand(.5), 500], [hand(NaN), 150], [hand(1.01), 150]]) {
    assert.equal(pointer.update(h, t, aspect, rect), null); assert.deepEqual(pointer.point, { x: .4, y: .5 });
  }
  assert.ok(pointer.update(hand(.401), 150, aspect, rect).x < 321);
});
test('initial acquisition waits for open hand and settle, then independently acquires a target', () => {
  const f = fixture(); f.warm(hand(.4, .5, .2)); assert.equal(f.queries.length, 0);
  f.tick(); f.tick(); f.tick(); assert.equal(f.queries.length, 0);
  f.tick(); assert.equal(f.stability.trackingState, 'tracking'); assert.equal(f.anatomy.targets.stable, null);
  f.warm(); assert.equal(f.anatomy.targets.stable, a);
});
test('200ms loss holds visual position, cancels candidate, and does no raycasts/actions/manipulation', () => {
  const f = fixture(); f.warm(); f.tick([hand(.4, .5, .2)]);
  const point = { ...f.stability.point }, count = f.queries.length;
  for (let i = 0; i < 4; i++) f.tick([]);
  assert.equal(f.stability.trackingState, 'grace'); assert.deepEqual(f.reports.at(-1).point, point);
  assert.equal(f.queries.length, count); assert.deepEqual(f.selected, []); assert.deepEqual(f.gestures.target, idlePose);
  f.tick(); assert.equal(f.stability.trackingState, 'reacquiring'); assert.equal(f.selected.length, 0);
});
test('one to three missing inference results recover nearby without crossing the screen', () => {
  for (const missing of [1, 2, 3]) {
    const f = fixture(); f.warm(); const x = f.stability.point.x;
    for (let i = 0; i < missing; i++) f.tick([]);
    f.tick([hand(.408)]); assert.equal(f.stability.point.x, x);
    f.tick([hand(.408)]); assert.ok(f.stability.point.x > x && f.stability.point.x < .408 * 800);
    assert.equal(f.queries.length, 9); // Only the original settled samples reached picking.
    f.warm(hand(.408)); assert.equal(f.stability.trackingState, 'tracking');
  }
});
test('loss beyond grace hides cursor and ends manipulation without clearing the existing selection', () => {
  const f = fixture(); f.warm(); f.tick([hand(.4, .5, .2)]); f.tick(); assert.deepEqual(f.selected, [a]);
  for (let i = 0; i < 8; i++) f.tick([]);
  assert.equal(f.stability.trackingState, 'lost'); assert.equal(f.reports.at(-1).point, null); assert.deepEqual(f.selected, [a]);
});
test('far return hides during reanchor, waits for open/settle, never interpolates across viewport', () => {
  const f = fixture(); f.warm(); for (let i = 0; i < 8; i++) f.tick([]);
  const count = f.queries.length; f.warm(hand(.85, .5, .2), 4);
  assert.equal(f.reports.at(-1).point, null); assert.equal(f.queries.length, count);
  f.warm(hand(.85), 3); assert.equal(f.queries.length, count);
  f.tick([hand(.85)]); assert.equal(f.stability.point.x, 680); assert.equal(f.selected.length, 0);
});
test('single-frame outlier enters grace and near recovery requires settle again', () => {
  const f = fixture(); f.warm(); const point = f.stability.point, queries = f.queries.length;
  f.tick([hand(.95)]); assert.equal(f.stability.trackingState, 'grace'); assert.deepEqual(f.stability.point, point);
  f.tick(); assert.equal(f.stability.trackingState, 'reacquiring'); f.tick([hand(.4, .5, .2)]); f.tick();
  assert.equal(f.queries.length, queries); assert.deepEqual(f.selected, []);
});
test('invalid point enters safe grace and cannot select on release', () => {
  const f = fixture(); f.warm(); f.tick([hand(.4, .5, .2)]); f.tick([hand(NaN)]); f.warm(); assert.deepEqual(f.selected, []);
});
test('primary continuity survives label flips, array reordering and secondary arrival/departure', () => {
  const f = fixture(); f.warm(); const x = f.stability.point.x;
  f.tick([hand(.8, .5, .8, 'Right'), hand(.401, .5, .8, 'Left')]);
  f.tick([hand(.402, .5, .8, 'Right'), hand(.8, .5, .8, 'Left')]);
  f.tick([hand(.403, .5, .8, 'Right')]);
  assert.equal(f.stability.trackingState, 'tracking'); assert.ok(Math.abs(f.stability.point.x - x) < 3);
});
test('secondary cannot become primary during grace; original may return with a flipped label', () => {
  const f = fixture(); f.warm(); f.tick([hand(), hand(.8, .5, .8, 'Right')]);
  for (let i = 0; i < 4; i++) f.tick([hand(.8, .5, .8, 'Right')]);
  assert.equal(f.stability.trackingState, 'grace'); assert.equal(f.stability.point.x, 320);
  f.tick([hand(.405, .5, .8, 'Right')]); assert.equal(f.stability.trackingState, 'reacquiring');
  assert.equal(f.stability.point.x, 320);
});
test('after real primary loss the remaining hand can acquire only through open/settle', () => {
  const f = fixture(); f.warm(); for (let i = 0; i < 9; i++) f.tick([hand(.8, .5, .8, 'Right')]);
  assert.equal(f.stability.trackingState, 'reacquiring'); f.warm(hand(.8, .5, .8, 'Right'));
  assert.equal(f.stability.point.x, 640); assert.equal(f.selected.length, 0);
});
function targets() { return new TargetStability(t => t?.id ?? null, 150); }
const p = { x: 100, y: 100 };
function stableA(t) { t.update(a, p, 100); t.update(a, p, 150); t.update(a, p, 200); t.update(a, p, 250); }
test('stable acquisition needs full dwell and uses stable IDs across fresh hit objects', () => {
  const t = targets(); t.update(a, p, 100); assert.equal(t.update({ ...a }, p, 249), null);
  assert.deepEqual(t.update({ ...a }, p, 250), a); assert.equal(t.age(300), 50);
});
test('A/B/A and a brief empty hit retain A within stick radius', () => {
  const t = targets(); stableA(t); t.update(b, { x: 105, y: 104 }, 300); assert.equal(t.stable, a);
  t.update(a, p, 350); t.update(null, p, 400); assert.equal(t.stable, a); t.update(a, p, 450); assert.equal(t.stable, a);
});
test('sustained B promotes after dwell and sustained empty clears', () => {
  const t = targets(); stableA(t); t.update(b, p, 300); assert.equal(t.update(b, p, 449), a);
  assert.equal(t.update(b, p, 450), b); t.update(null, p, 500); assert.equal(t.update(null, p, 650), null);
});
test('deliberate departure clears stale A immediately, without selecting unseen B', () => {
  const t = targets(); stableA(t); assert.equal(t.update(b, { x: 119, y: 100 }, 300), null);
  assert.equal(t.update(b, { x: 119, y: 100 }, 450), b);
});
test('pinch uses stable A when the raw raycast becomes B exactly at onset; later jitter cannot retarget', () => {
  let raw = a; const f = fixture({ hit: () => raw }); f.warm(); raw = b;
  f.tick([hand(.402, .5, .2)]); assert.equal(f.anatomy.hoveredHandStructure, b); assert.equal(f.anatomy.targets.stable, a);
  f.tick([hand(.398, .504, .2)]); f.tick([hand(.401, .498, .2)]); f.tick();
  assert.deepEqual(f.selected, [a]); assert.deepEqual(f.gestures.target, idlePose);
});
test('pinch before anatomy dwell refuses raw fallback', () => {
  const f = fixture(); f.warm(hand(), 4); f.tick([hand(.4, .5, .2)]); f.tick(); assert.deepEqual(f.selected, []);
});
test('UI requires stable dwell before capturing a button', () => {
  const f = fixture({ ui: true }); f.warm(hand(.7), 4); f.tick([hand(.7, .5, .2)]); f.tick([hand(.7)]);
  assert.deepEqual(f.actions, []); assert.deepEqual(f.selected, []); assert.equal(f.queries.length, 0);
  f.warm(hand(.7)); f.tick([hand(.7, .5, .2)]); f.tick([hand(.7)]); assert.deepEqual(f.actions, ['muscle']);
});
test('moderate button jitter and pinch produce one UI action and no anatomy/rotation', () => {
  const f = fixture({ ui: true }); f.warm(hand(.7));
  for (let i = 0; i < 20; i++) f.tick([hand(.7 + Math.sin(i * 1.7) * .007, .5 + Math.cos(i) * .006)]);
  f.tick([hand(.705, .503, .2)]); f.tick([hand(.696, .5, .2)]); f.tick([hand(.7)]); f.warm(hand(.7));
  assert.deepEqual(f.actions, ['muscle']); assert.equal(f.queries.length, 0); assert.deepEqual(f.gestures.target, idlePose);
});
test('another actual control or blocked UI cannot inherit the stable control capture', () => {
  const f = fixture({ ui: true }); f.warm(hand(.7)); f.rawUi({ ...f.control, id: 'other' });
  f.tick([hand(.7, .5, .2)]); f.tick([hand(.7)]); assert.deepEqual(f.actions, []);
  f.warm(hand(.7)); f.rawUi(null); f.tick([hand(.7, .5, .2)]); f.tick([hand(.7)]); assert.deepEqual(f.actions, []);
});
test('slider starts after dwell, follows smoothed cursor outside rect, and loss cancels without changes in grace', () => {
  const f = fixture({ ui: true }); f.control.kind = 'slider'; f.control.range = { min: 0, max: 100, step: 1, value: 0 };
  f.warm(hand(.7)); f.tick([hand(.7, .5, .2)]); assert.ok(f.values.length);
  for (let i = 1; i <= 6; i++) f.tick([hand(.7 - .035 * i, .5, .2)]);
  assert.equal(f.values.at(-1), 0); assert.equal(f.queries.length, 0);
  const count = f.values.length; for (let i = 0; i < 4; i++) f.tick([]);
  assert.equal(f.stability.trackingState, 'grace'); assert.equal(f.values.length, count);
  f.warm(hand(.7, .5, .2)); assert.equal(f.values.length, count); f.warm(hand(.7)); assert.equal(f.values.length, count);
});
test('manual interruption ends grace immediately and preserves manual pose', () => {
  const f = fixture(); f.warm(); f.tick([]); f.gestures.rotate(.2, .3, f.time()); f.tick();
  assert.equal(f.stability.trackingState, 'lost'); assert.equal(f.reports.at(-1).point, null);
  assert.deepEqual(f.gestures.target, { rotationX: .2, rotationY: .3, scale: 1 });
});
test('calibrated pinch, hold, rotation and scale constants are unchanged', () => {
  assert.equal(config.PINCH_ENTER_RATIO, .34); assert.equal(config.PINCH_EXIT_RATIO, .43);
  assert.equal(config.PINCH_HOLD_THRESHOLD, 550); assert.equal(config.ROTATE_MOVE_THRESHOLD, .040);
  assert.equal(config.ROTATION_SENSITIVITY, Math.PI * 2); assert.equal(config.HAND_SMOOTHING_MS, 65);
});
test('stability gate preserves deliberate one-hand rotation and two-hand scaling after acquisition', () => {
  const f = fixture(); f.warm(); f.tick([hand(.4, .5, .2)]);
  f.tick([hand(.45, .5, .2)]); assert.ok(f.gestures.target.rotationY > 0);
  f.tick([hand(.45, .5, .2), hand(.7, .5, .2, 'Right')]);
  f.tick([hand(.42, .5, .2), hand(.75, .5, .2, 'Right')]);
  assert.ok(f.gestures.target.scale > 1); assert.deepEqual(f.selected, []);
});
