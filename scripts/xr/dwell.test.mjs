import test from 'node:test';
import assert from 'node:assert/strict';
import { DwellController } from '../../src/features/xr/dwell.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandUiRouter } from '../../src/features/xr/ui/handUiRouter.ts';
import { HandStability } from '../../src/features/xr/handStability.ts';
import { GestureController } from '../../src/features/xr/gestures.ts';
import * as config from '../../src/features/xr/handConfig.ts';

const a = { domain: 'anatomy', id: 'A', kind: 'anatomy' }, b = { ...a, id: 'B' };
test('activation is exactly 1000 ms after stable target: 999 cannot fire', () => {
  const d = new DwellController();
  assert.equal(d.update(null, 0), false); assert.equal(d.update(a, 100), false);
  assert.equal(d.update(a, 1099), false); assert.equal(d.snapshot.progress, .999);
  assert.equal(d.update(a, 1100), true); assert.equal(d.state, 'fired');
});
test('fired target stays latched for five seconds; transient null is not a rearm', () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 1100);
  for (let t = 1150; t < 6000; t += 50) assert.equal(d.update(a, t), false);
  d.update(null, 6000); assert.equal(d.update(a, 6100), false);
  d.update(null, 6200, true); d.update(a, 6300); assert.equal(d.update(a, 7300), true);
});
test('A to B resets elapsed and can activate B without clearing selection', () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 900); d.update(b, 950);
  assert.equal(d.elapsedMs, 0); assert.equal(d.update(b, 1949), false); assert.equal(d.update(b, 1950), true);
});
test('empty dwell never fires; changing domains cannot inherit anatomy progress', () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 900);
  const ui = { domain: 'ui', id: 'A', kind: 'button' }; d.update(ui, 950);
  assert.equal(d.elapsedMs, 0); assert.equal(d.update(null, 3000, true), false);
});
test('stale/NaN results cannot advance or repeat dwell', () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 600);
  for (const t of [NaN, 599, 600]) assert.equal(d.update(b, t), false);
  assert.equal(d.target.id, 'A'); assert.equal(d.elapsedMs, 500);
  assert.equal(d.update(a, 1100), true); assert.equal(d.update(a, 1100), false);
});
test('short loss pauses exactly, excludes settle time, and never fires on resume', () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 1000);
  d.pause(1050, 1000); assert.equal(d.elapsedMs, 900); assert.equal(d.state, 'paused');
  d.recover(1200, true, 200); d.update(null, 1300); d.update(null, 1400);
  assert.equal(d.update(a, 1500), false); assert.equal(d.elapsedMs, 900);
  assert.equal(d.update(a, 1599), false); assert.equal(d.update(a, 1600), true);
});
for (const [near, loss] of [[true, 226], [false, 100]]) test(`loss ${loss}ms / nearby ${near} resets pending dwell`, () => {
  const d = new DwellController(); d.update(a, 100); d.update(a, 1000); d.pause(1050, 1000);
  d.recover(1000 + loss, near, loss); d.update(a, 1500);
  assert.equal(d.elapsedMs, 0); assert.equal(d.update(a, 2499), false);
});
test('cancel/reset callback cannot rearm a fired toggle until actual departure', () => {
  const d = new DwellController(), t = { domain: 'ui', id: 'toggle', kind: 'toggle' };
  d.update(t, 100); assert.equal(d.update(t, 1100), true); d.cancel();
  for (let n = 1200; n < 5000; n += 100) assert.equal(d.update(t, n), false);
});
test('configured calibration and hit slop remain explicit', () => {
  assert.equal(config.DWELL_ACTIVATION_MS, 1000); assert.equal(config.DWELL_GRACE_RESUME_MS, 225);
  assert.equal(config.SLIDER_RELEASE_VERTICAL_PX, 60); assert.equal(config.SLIDER_RELEASE_MS, 300);
  assert.equal(config.UI_HIT_SLOP_PX, 10); assert.equal(config.UI_SLIDER_SLOP_Y_PX, 8);
});

const rect = { left: 0, top: 0, width: 800, height: 600 };
const hand = (extra = {}) => ({ id: 'Left', x: .4, y: .5, indexX: .4, indexY: .5, pinchRatio: .8, ...extra });
function pipeline(ui = false) {
  const gestures = new GestureController(), selected = [], actions = [], values = [], queries = [];
  let time = 100, stability, hit = a, control = { id: 'opacity', kind: 'slider', enabled: true,
    rect: { left: 200, top: 280, width: 400, height: 40 }, range: { min: 10, max: 100, step: 1, value: 100 } };
  const anatomy = new HandInteraction(gestures, { viewport: () => rect, point: () => stability.point, targetKey: t => t.id,
    hitTest: p => { queries.push(p); return hit; }, select: t => selected.push(t), draw() {} });
  const router = new HandUiRouter(gestures, anatomy, { surface: () => rect,
    hitTest: () => ui ? { route: 'ui', target: control } : { route: 'anatomy' }, resolve: () => control,
    activate: id => actions.push(id), change: (id, value) => { values.push(value); control.range.value = value; }, feedback() {} },
  () => false, { point: () => stability.point, surface: () => stability.surface });
  stability = new HandStability(router, gestures, { surface: () => rect, blocked: () => false, report() {} });
  const tick = (hands = [hand()], dt = 50) => stability.update(hands, time += dt, 4 / 3);
  const frames = (n, hands = [hand()]) => { for (let i = 0; i < n; i++) tick(hands); };
  return { tick, frames, selected, actions, values, queries, gestures, stability, anatomy, router,
    dwell: anatomy.dwell, raw: value => { hit = value; }, control: () => control, hide: () => { control = null; } };
}
test('tracking pipeline pauses short loss; settle and target acquisition add no elapsed time', () => {
  const f = pipeline(); f.frames(18); const elapsed = f.dwell.elapsedMs; assert.ok(elapsed > 0 && elapsed < 1000);
  f.frames(2, []); assert.equal(f.dwell.state, 'paused'); assert.equal(f.dwell.elapsedMs, elapsed);
  f.frames(4); assert.equal(f.selected.length, 0); assert.equal(f.dwell.elapsedMs, elapsed);
  f.frames(4); assert.equal(f.dwell.elapsedMs, elapsed);
  f.frames(20); assert.equal(f.selected.length, 1);
});
test('long loss and closed reacquire cannot act; fresh open stable dwell is required', () => {
  const f = pipeline(); f.frames(20); f.frames(8, []); assert.equal(f.dwell.elapsedMs, 0);
  f.frames(30, [hand({ pinchRatio: .2 })]); assert.equal(f.selected.length, 0);
  f.frames(12); assert.equal(f.selected.length, 0); f.frames(25); assert.equal(f.selected.length, 1);
});
test('pinch cancels near-complete dwell and finger-closing movement cannot select', () => {
  const f = pipeline(); f.frames(25); assert.equal(f.selected.length, 0);
  f.tick([hand({ indexX: .41, pinchRatio: .2 })]); f.frames(4, [hand({ indexX: .41, pinchRatio: .2 })]);
  f.frames(10); assert.equal(f.selected.length, 0); f.frames(25); assert.equal(f.selected.length, 1);
});
test('stable A tolerates alternating boundary hits; sustained B starts a new full dwell', () => {
  const f = pipeline(); f.frames(14);
  for (let i = 0; i < 30; i++) { f.raw(i % 3 ? a : b); f.tick([hand({ indexX: .4 + Math.sin(i) * .002 })]); }
  assert.deepEqual(f.selected, [a]); f.raw(b); f.frames(6); assert.equal(f.dwell.target.id, 'B');
  assert.equal(f.selected.length, 1); f.frames(20); assert.deepEqual(f.selected, [a, b]);
});
for (const kind of ['button', 'toggle']) test(`${kind} fires once, ignores held pointer and re-arms only after stable exit`, () => {
  const f = pipeline(true); f.control().kind = kind; f.frames(26); assert.equal(f.actions.length, 0);
  f.frames(100); assert.deepEqual(f.actions, ['opacity']); assert.equal(f.queries.length, 0);
  f.control().enabled = false; f.frames(5); f.control().enabled = true; f.frames(30);
  assert.equal(f.actions.length, 2);
});
for (const kind of ['button', 'slider']) test(`hidden/disabled ${kind} cancels pending action`, () => {
  for (const hidden of [false, true]) {
    const f = pipeline(true); f.control().kind = kind; f.frames(22);
    if (hidden) f.hide(); else f.control().enabled = false;
    f.frames(30); assert.equal(f.actions.length, 0); assert.equal(f.values.length, 0);
    assert.equal(f.queries.length, 0);
  }
});
test('slider full dwell captures; filtered X changes real 10–100 range without pinch', () => {
  const f = pipeline(true); f.frames(26); assert.notEqual(f.dwell.state, 'sliderCaptured');
  f.frames(4); assert.equal(f.dwell.state, 'sliderCaptured'); assert.ok(f.values.at(-1) >= 10);
  f.frames(6, [hand({ indexX: .5 })]); assert.ok(f.values.at(-1) >= 50 && f.values.at(-1) <= 55);
  f.frames(6, [hand({ indexX: .65 })]); f.frames(10, [hand({ indexX: .8 })]); assert.equal(f.values.at(-1), 100);
  assert.equal(f.queries.length, 0);
});
test('vertical release requires full 300ms beyond actual rectangle plus 60px; jitter resets exit timer', () => {
  const f = pipeline(true); f.frames(32);
  f.frames(8, [hand({ indexY: .6 })]); assert.equal(f.dwell.state, 'sliderCaptured');
  f.frames(4, [hand({ indexY: .7 })]); assert.equal(f.dwell.state, 'sliderCaptured');
  f.frames(6, [hand({ indexY: .58 })]); assert.equal(f.dwell.state, 'sliderCaptured');
  f.frames(14, [hand({ indexY: .72 })]); assert.notEqual(f.dwell.state, 'sliderCaptured');
});
for (const reason of ['loss', 'pinch', 'secondary', 'hidden', 'disabled', 'manual', 'stop']) test(`slider ${reason} releases without forwarding manipulation`, () => {
  const f = pipeline(true); f.frames(32); const values = f.values.length;
  if (reason === 'loss') f.tick([]);
  if (reason === 'pinch') f.tick([hand({ pinchRatio: .2 })]);
  if (reason === 'secondary') f.tick([hand(), hand({ id: 'Right', x: .7, indexX: .7, pinchRatio: .2 })]);
  if (reason === 'hidden') { f.hide(); f.tick(); }
  if (reason === 'disabled') { f.control().enabled = false; f.tick(); }
  if (reason === 'manual') { f.gestures.beginManual(); f.tick(); }
  if (reason === 'stop') f.stability.endGesture();
  assert.notEqual(f.dwell.state, 'sliderCaptured'); assert.equal(f.values.length, values);
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
