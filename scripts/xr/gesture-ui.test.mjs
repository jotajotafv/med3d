import test from 'node:test';
import assert from 'node:assert/strict';
import { HandUiRouter, sliderValue, handUiSurface, contains } from '../../src/features/xr/ui/handUiRouter.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { GestureController } from '../../src/features/xr/gestures.ts';
import { atlasReducer, initialAtlasState } from '../../src/features/xr/atlas/state.ts';

const rect = { left: 0, top: 0, width: 400, height: 300 };
const target = (id = 'button', kind = 'button', range) => ({ id, kind, enabled: true, rect: { left: 240, top: 100, width: 120, height: 60 }, range });
const sample = (px = 300, py = 130, closed = false, id = 'Left') => ({ id, x: px / 400, y: py / 300, indexX: px / 400, indexY: py / 300, pinchRatio: closed ? .1 : .8 });
function fixture(control = target(), action) {
  const gestures = new GestureController(), actions = [], values = [], selected = [], queries = [], feedback = [];
  let time = 100, state = initialAtlasState(), manual = false;
  const ui = {
    surface: () => rect,
    hitTest: p => p.x >= 220 ? { route: 'ui', target: control && contains(control.rect, p) ? control : null } : { route: 'anatomy' },
    resolve: id => control?.id === id ? control : null,
    activate: id => { actions.push(id); if (action) state = atlasReducer(state, action(state)); },
    change: (id, value) => { values.push(value); control.range.value = value; },
    feedback: value => feedback.push(value),
  };
  const anatomy = new HandInteraction(gestures, { targetKey: value => value.id, viewport: () => rect, hitTest: p => { queries.push(p); return { kind: 'selected', id: 'bone' }; }, select: value => selected.push(value), draw() {} });
  const router = new HandUiRouter(gestures, anatomy, ui, () => manual);
  const tick = (hands = [sample()], dt = 50) => router.update(hands, time += dt, 4 / 3);
  const move = (x, y, closed, frames = 10) => { for (let i = 0; i < frames; i++) tick([sample(x, y, closed)]); };
  const warm = () => { for (let i = 0; i < 5; i++) tick(); };
  const click = () => { for (let i = 0; i < 32; i++) tick(); };
  return { gestures, router, tick, move, click, warm, actions, values, selected, queries, feedback, control,
    state: () => state, dispatch: a => { state = atlasReducer(state, a); }, remove: () => { control = null; }, manual: () => { manual = true; } };
}
test('anatomy route preserves native selection, rotation and scale', () => {
  const f = fixture(); f.move(120, 130, false, 28); f.tick([sample(120, 130, true)]); f.tick([sample(120, 130)]);
  assert.equal(f.selected.length, 1);
  f.tick([sample(120, 130, true)]); f.move(145, 140, true); assert.ok(f.gestures.target.rotationY > 0);
  f.tick([sample(145, 140, true), sample(210, 140, true, 'Right')]);
  f.tick([sample(130, 140, true), sample(225, 140, true, 'Right')]); assert.ok(f.gestures.target.scale > 1);
});
test('registered UI route has feedback and zero anatomy queries', () => {
  const f = fixture(); assert.equal(f.tick(), 'pointing'); assert.equal(f.feedback.at(-1).target.id, 'button'); assert.equal(f.queries.length, 0);
});
test('noninteractive panel text blocks anatomy and never activates', () => {
  const f = fixture(null); f.click(); assert.deepEqual(f.actions, []); assert.deepEqual(f.selected, []); assert.deepEqual(f.queries, []);
});
test('button waits full dwell and fires once even after five seconds', () => {
  const f = fixture(); f.warm(); assert.deepEqual(f.actions, []);
  for (let i = 0; i < 100; i++) f.tick(); assert.deepEqual(f.actions, ['button']);
  f.move(300, 230, false); f.click(); assert.deepEqual(f.actions, ['button', 'button']);
});test('button hold remains UI, with no action, rotation, selection or scale', () => {
  const f = fixture(); f.tick(); f.move(300, 130, true, 16); f.tick();
  assert.deepEqual(f.actions, []); assert.deepEqual(f.queries, []); assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
for (const system of ['skeletal', 'muscular', 'cardiovascular']) test(`one ${system} toggle uses existing reducer once`, () => {
  const f = fixture(target(system, 'toggle'), state => ({ type: 'system', system, enabled: !state.systemVisibility[system] }));
  const initial = f.state().systemVisibility[system]; f.click(); assert.equal(f.state().systemVisibility[system], !initial); assert.equal(f.actions.length, 1);
});
for (const [percent, expected] of [[0, 10], [50, 55], [100, 100]]) test(`opacity slider ${percent}% of track respects real min=10`, () => {
  assert.equal(sliderValue(240 + 120 * percent / 100, target('opacity', 'slider', { min: 10, max: 100, step: 1, value: 100 })), expected);
});
test('slider clamps outside both ends', () => {
  const t = target('slider', 'slider', { min: 10, max: 100, step: 1, value: 50 });
  assert.equal(sliderValue(-500, t), 10); assert.equal(sliderValue(900, t), 100);
});
test('slider step is relative to real minimum, supports fractional and any steps', () => {
  const t = target('slider', 'slider', { min: .15, max: .95, step: .2, value: .15 });
  assert.equal(sliderValue(300, t), .55); t.range.step = 'any'; assert.equal(sliderValue(270, t), .35);
});
for (const value of [0, 60, 100]) test(`Despiece ${value}% maps using actual range`, () => {
  assert.equal(sliderValue(240 + 120 * value / 100, target('explosion', 'slider', { min: 0, max: 100, step: 1, value: 0 })), value);
});
test('slider captures by dwell, updates horizontally outside rect, vertical exit releases', () => {
  const f = fixture(target('slider', 'slider', { min: 0, max: 100, step: 1, value: 0 }));
  f.warm(); assert.equal(f.router.dwell.state, 'dwelling'); assert.equal(f.values.length, 0);
  f.click(); assert.equal(f.router.dwell.state, 'sliderCaptured');
  f.move(240, 130, false); f.move(190, 155, false); assert.equal(f.values.at(-1), 0);
  assert.equal(f.router.dwell.state, 'sliderCaptured'); assert.equal(f.queries.length, 0);
  f.move(190, 200, false, 3); f.move(190, 225, false, 3); assert.equal(f.router.dwell.state, 'sliderCaptured');
  f.move(190, 245, false, 16); assert.notEqual(f.router.dwell.state, 'sliderCaptured');
  const count = f.values.length; f.tick([sample(190, 245, true)]); f.tick([sample(180, 245, true)]);
  assert.equal(f.values.length, count); assert.equal(f.actions.length, 0);
});test('tracking loss cancels capture and a closed reacquisition cannot act', () => {
  const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]); f.tick([]); f.tick([sample(300, 130, true)]); f.tick(); f.tick(); assert.deepEqual(f.actions, []);
  f.click(); assert.equal(f.actions.length, 1);
});
test('reanchor after loss requires the existing .43 exit ratio, not an ambiguous .38 hand', () => {
  const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]); f.tick([]);
  f.tick([{ ...sample(), pinchRatio: .38 }]); f.tick([sample(300, 130, true)]); f.tick();
  assert.equal(f.actions.length, 0); f.click(); assert.equal(f.actions.length, 1);
});
test('gap and primary identity loss cancel a UI press without transferring it', () => {
  for (const gap of [true, false]) {
    const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]);
    if (gap) f.tick([sample(300, 130, true)], 251); else f.tick([sample(300, 130, true, 'Right')]);
    f.tick(); f.tick(); assert.deepEqual(f.actions, []); assert.deepEqual(f.queries, []);
  }
});
test('secondary pinch never scales during UI nor on primary release while secondary stays closed', () => {
  const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]);
  for (let i = 0; i < 5; i++) f.tick([sample(300, 130, true), sample(120 - i * 5, 150, true, 'Right')]);
  f.tick([sample(), sample(100, 150, true, 'Right')]); f.tick([sample(100, 130, true), sample(80, 150, true, 'Right')]);
  assert.equal(f.gestures.target.scale, 1); assert.deepEqual(f.queries, []);
});
test('UI action cannot select behind; anatomy requires its own target and activation dwell', () => {
  const f = fixture(); f.click(); assert.equal(f.selected.length, 0);
  f.move(230, 130, false, 4); f.move(150, 130, false, 10); assert.equal(f.selected.length, 0);
  f.move(150, 130, false, 30); assert.equal(f.selected.length, 1);
});test('anatomy pinch crossing a panel retains anatomy ownership', () => {
  const f = fixture(); f.move(180, 130, false); f.tick([sample(180, 130, true)]);
  f.move(230, 130, true, 2); f.move(280, 130, true, 2); f.move(300, 130, true, 2); f.tick();
  assert.equal(f.actions.length, 0); assert.ok(f.gestures.target.rotationY > 0);
});
test('pinch on UI cancels dwell and stays blocked while crossing to anatomy', () => {
  const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]);
  f.move(230, 130, true); f.move(170, 130, true); f.tick([sample(170, 130)]);
  assert.equal(f.actions.length, 0); assert.equal(f.selected.length, 0); assert.equal(f.gestures.target.rotationY, 0);
});test('disabled or removed controls cancel; stale frames cannot repeat an action', () => {
  for (const remove of [false, true]) {
    const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]); if (remove) f.remove(); else f.control.enabled = false;
    f.tick(); f.tick([], -20); assert.deepEqual(f.actions, []);
  }
});
test('manual input interrupts an active UI capture', () => {
  const f = fixture(); f.warm(); f.tick([sample(300, 130, true)]); f.manual(); f.tick(); assert.deepEqual(f.actions, []);
});
for (const [id, action, check] of [
  ['isolate', { type: 'isolate', id: 'bone' }, s => s.isolatedStructure === 'bone'],
  ['hide', { type: 'hide', id: 'bone' }, s => s.hiddenStructures.includes('bone') && !s.selectedStructure],
  ['exit-isolation', { type: 'exitIsolation' }, s => !s.isolatedStructure],
  ['restore-hidden', { type: 'restoreHidden' }, s => !s.hiddenStructures.length],
  ['reset-view', { type: 'resetView' }, s => s.explodedAmount === 0],
  ['restore-atlas', { type: 'restoreAtlas' }, s => s.systemVisibility.skeletal && !s.systemVisibility.muscular && !s.selectedStructure],
  ['close-card', { type: 'select', id: null }, s => !s.selectedStructure],
]) test(`${id} dwell routes to existing Atlas action`, () => {
  const f = fixture(target(id), () => action);
  f.dispatch({ type: 'hide', id: 'other' }); f.dispatch({ type: 'select', id: 'bone' }); f.dispatch({ type: 'isolate', id: 'other' }); f.dispatch({ type: 'explode', value: .6 });
  f.click(); assert.ok(check(f.state())); assert.equal(f.actions.length, 1);
});
test('aspect-preserving destination covers desktop and mobile without changing projection formula', () => {
  for (const width of [1366, 1050, 900, 768, 390]) {
    const r = handUiSurface({ left: 20, top: 80, width: width - 40, height: 700 }, 4 / 3);
    assert.ok(Math.abs(r.width / r.height - 4 / 3) < 1e-10);
    assert.ok(contains(r, { x: 20, y: 80 })); assert.ok(contains(r, { x: width - 20, y: 780 }));
  }
});
