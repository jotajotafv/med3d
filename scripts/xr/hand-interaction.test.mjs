import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureController, normalizeHands } from '../../src/features/xr/gestures.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandPointer, projectIndex } from '../../src/features/xr/handPointer.ts';
import { SHORT_PINCH_MAX_MS, PINCH_HOLD_THRESHOLD } from '../../src/features/xr/handConfig.ts';

const a = { kind: 'selected', id: 'A' }, b = { kind: 'selected', id: 'B' }, empty = { kind: 'empty' };
const hand = (extra = {}) => ({ id: 'Left', x: .4, y: .5, indexX: .4, indexY: .5, pinchRatio: .8, ...extra });
const pinched = extra => hand({ pinchRatio: .1, ...extra });
function fixture(hitTest = point => point.x < 200 ? a : b) {
  const gestures = new GestureController(), selected = [], queries = [], drawings = [];
  let blocked = false;
  const interaction = new HandInteraction(gestures, {
    viewport: () => ({ left: 0, top: 0, width: 400, height: 300 }),
    hitTest: point => { queries.push(point); return hitTest(point); },
    select: target => selected.push(target), draw: cursor => drawings.push(cursor), blocked: () => blocked,
  });
  return { gestures, interaction, selected, queries, drawings, block: value => { blocked = value; } };
}
test('one open hand points; hover queries do not select or change pose', () => {
  const f = fixture(); assert.equal(f.interaction.update([hand()], 100), 'pointing');
  assert.equal(f.interaction.hoveredHandStructure, a); assert.deepEqual(f.selected, []);
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('pinch onset creates a candidate; stable short release selects with exactly zero rotation', () => {
  const f = fixture(); f.interaction.update([hand()], 100);
  assert.equal(f.interaction.update([pinched()], 150), 'candidate'); assert.deepEqual(f.selected, []);
  f.interaction.update([pinched({ x: .402 })], 200);
  f.interaction.update([hand()], 250);
  assert.deepEqual(f.selected, [a]); assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('selection uses the pinch-onset target even when release points at a different structure', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  f.interaction.update([hand({ indexX: .95 })], 250);
  assert.equal(f.interaction.hoveredHandStructure, b); assert.deepEqual(f.selected, [a]);
});
test('movement rotates, permanently cancels selection, including return to origin before release', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  assert.equal(f.interaction.update([pinched({ x: .45 })], 200), 'rotate');
  assert.ok(f.gestures.target.rotationY > 0);
  f.interaction.update([pinched()], 250); f.interaction.update([hand()], 300);
  assert.deepEqual(f.selected, []);
});
test('sustained pinch enables slow rotation without a click; intermediate-duration release is also not a click', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  for (let t = 200; t < 150 + PINCH_HOLD_THRESHOLD; t += 50) f.interaction.update([pinched()], t);
  assert.equal(f.interaction.update([pinched()], 150 + PINCH_HOLD_THRESHOLD), 'rotate');
  f.interaction.update([pinched({ x: .415 })], 530); assert.ok(f.gestures.target.rotationY > 0);
  f.interaction.update([hand()], 580); assert.deepEqual(f.selected, []);
  const g = fixture(); g.interaction.update([hand()], 100); g.interaction.update([pinched()], 150);
  g.interaction.update([pinched()], 300); g.interaction.update([hand()], 150 + SHORT_PINCH_MAX_MS + 1);
  assert.deepEqual(g.selected, []);
});
test('a second pinch immediately scales, cancels candidate, and cannot select on two-to-one release', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  assert.equal(f.interaction.update([pinched(), pinched({ id: 'Right', x: .7 })], 200), 'scale');
  f.interaction.update([pinched({ x: .35 }), pinched({ id: 'Right', x: .75 })], 250);
  assert.ok(f.gestures.target.scale > 1 && f.gestures.target.scale <= 1.8);
  assert.equal(f.interaction.update([pinched({ x: .35 })], 300), 'rotate');
  f.interaction.update([hand({ x: .35 })], 350); assert.deepEqual(f.selected, []);
});
test('primary hand is sticky by identity, independent of array order or a second open hand', () => {
  const f = fixture(), left = hand(), right = hand({ id: 'Right', indexX: .8 });
  f.interaction.update([right, left], 100); assert.equal(f.interaction.primaryId, 'Left');
  const initial = f.drawings.at(-1).point;
  f.interaction.update([left, right], 150); f.interaction.update([right, left], 200);
  assert.equal(f.interaction.primaryId, 'Left'); assert.deepEqual(f.drawings.at(-1).point, initial);
});
test('primary loss hides cursor, cancels candidate and reacquires closed hands without click or pose jump', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  const pose = { ...f.gestures.target };
  f.interaction.update([hand({ id: 'Right' })], 200);
  assert.equal(f.drawings.at(-1), null); assert.equal(f.interaction.primaryId, null);
  f.interaction.update([pinched({ id: 'Right', x: .8, indexX: .8 })], 250);
  assert.deepEqual(f.gestures.target, pose); assert.equal(f.interaction.primaryId, 'Right');
  f.interaction.update([hand({ id: 'Right', x: .8 })], 300); assert.deepEqual(f.selected, []);
});
test('invalid/outside pointer performs no raycast and cancels candidate without deselection', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  const count = f.queries.length;
  f.interaction.update([pinched({ indexX: 1.1 })], 200);
  assert.equal(f.queries.length, count); assert.equal(f.drawings.at(-1), null);
  f.interaction.update([hand()], 250); assert.deepEqual(f.selected, []);
});
test('only a valid short pinch on an actual empty hit requests deselection', () => {
  const f = fixture(() => empty); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  f.interaction.update([hand()], 250); assert.deepEqual(f.selected, [empty]);
  const unavailable = fixture(() => null); unavailable.interaction.update([hand()], 100);
  unavailable.interaction.update([pinched()], 150); unavailable.interaction.update([hand()], 250);
  assert.deepEqual(unavailable.selected, []);
});
test('hand selection switches A → B without clearing between selections', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150); f.interaction.update([hand()], 200);
  for (let t = 250; t <= 500; t += 50) f.interaction.update([hand({ indexX: .7 })], t);
  f.interaction.update([pinched({ indexX: .7 })], 550); f.interaction.update([hand({ indexX: .7 })], 650);
  assert.deepEqual(f.selected, [a, b]);
});
test('manual priority cancels a candidate and reanchors the cursor; a held pinch cannot become a click', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  f.gestures.beginManual(); assert.equal(f.interaction.update([pinched()], 200), 'idle');
  assert.equal(f.drawings.at(-1), null); f.gestures.endManual();
  f.interaction.update([pinched({ x: .8, indexX: .8 })], 250);
  assert.equal(f.drawings.at(-1).point.x, 320); // no lerp from the pre-manual cursor
  f.interaction.update([hand({ x: .8 })], 300); assert.deepEqual(f.selected, []);
  f.block(true); f.interaction.update([hand()], 350); assert.equal(f.drawings.at(-1), null);
});
test('manual input entirely between inference results still invalidates candidate', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  f.gestures.beginManual(); f.gestures.endManual(); f.interaction.update([hand()], 200);
  assert.deepEqual(f.selected, []);
});
test('stale results do no extra picking; gaps, discontinuity and explicit stop cancel selection', () => {
  const f = fixture(); f.interaction.update([hand()], 100); f.interaction.update([pinched()], 150);
  const count = f.queries.length; f.interaction.update([pinched()], 150); f.interaction.update([pinched()], 140);
  assert.equal(f.queries.length, count); f.interaction.update([hand()], 500); assert.deepEqual(f.selected, []);
  f.interaction.update([pinched()], 550); f.interaction.update([pinched({ x: .9 })], 600);
  assert.equal(f.drawings.at(-1), null); f.interaction.update([hand()], 650); assert.deepEqual(f.selected, []);
  f.interaction.update([pinched()], 700); f.interaction.endGesture(); f.interaction.update([hand()], 750);
  assert.deepEqual(f.selected, []);
});
test('projection preserves video aspect across all requested widths and rejects out-of-bounds inputs', () => {
  for (const width of [1366, 1050, 900, 768, 390]) {
    const rect = { left: 23, top: 91, width, height: 510 };
    assert.deepEqual(projectIndex({ x: .5, y: .5 }, 4 / 3, rect), { x: 23 + width / 2, y: 346 });
    const p = projectIndex({ x: 1, y: 1 }, 4 / 3, rect);
    assert.ok(p.x <= rect.left + rect.width && p.y <= rect.top + rect.height);
    assert.equal(projectIndex({ x: -0.001, y: .5 }, 4 / 3, rect), null);
  }
});
test('cursor smoothing is responsive with no dead zone; invalid input hides immediately', () => {
  const pointer = new HandPointer(), rect = { left: 0, top: 0, width: 400, height: 300 };
  pointer.update(hand(), 100, 4 / 3, rect);
  const p = pointer.update(hand({ indexX: .401 }), 150, 4 / 3, rect);
  assert.ok(p.x > 160 && p.x < 160.4);
  assert.equal(pointer.update(hand({ indexX: NaN }), 200, 4 / 3, rect), null);
  assert.equal(pointer.update(hand({ indexX: .8 }), 250, 4 / 3, rect).x, 320);
});
test('normalization exposes landmark 8 with the same mirror as the preview, not the pinch midpoint', () => {
  const points = Array.from({ length: 21 }, () => ({ x: .2, y: .5, z: 0 }));
  points[9].y = .3; points[8] = { x: .25, y: .4, z: 0 };
  const [sample] = normalizeHands({ landmarks: [points], handedness: [[{ categoryName: 'Left', score: .99 }]] }, 4 / 3);
  assert.equal(sample.indexX, .75); assert.equal(sample.indexY, .4); assert.notEqual(sample.indexX, sample.x);
});
