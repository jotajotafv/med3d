import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureController, normalizeHands } from '../../src/features/xr/gestures.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';
import { HandPointer, projectIndex } from '../../src/features/xr/handPointer.ts';
import { SHORT_PINCH_MAX_MS, PINCH_HOLD_THRESHOLD } from '../../src/features/xr/handConfig.ts';

const a = { kind: 'selected', id: 'A' }, b = { kind: 'selected', id: 'B' }, empty = { kind: 'empty' };
const hand = (extra = {}) => ({ id: 'Left', x: .4, y: .5, indexX: .4, indexY: .5, pinchRatio: .8, ...extra });
const pinched = extra => hand({ pinchRatio: .1, ...extra });
const jitter = i => ({ x: .4 + Math.sin(i * 1.7) * .012, y: .5 + Math.cos(i * 2.3) * .009,
  indexX: .4 + Math.sin(i * 2.1) * .014, indexY: .5 + Math.cos(i * 1.3) * .011 });
function fixture(hitTest = point => point.x < 200 ? a : b) {
  const gestures = new GestureController(), selected = [], queries = [], drawings = [], summaries = [];
  let blocked = false;
  const interaction = new HandInteraction(gestures, {
    targetKey: target => target.kind === 'selected' ? target.id : null, isEmpty: target => target.kind === 'empty',
    viewport: () => ({ left: 0, top: 0, width: 400, height: 300 }),
    hitTest: point => { queries.push(point); return hitTest(point); },
    select: target => selected.push(target), draw: cursor => drawings.push(cursor), blocked: () => blocked,
    reportCalibration: summary => summaries.push(summary),
  });
  return { gestures, interaction, selected, queries, drawings, summaries, block: value => { blocked = value; } };
}
// Existing manipulation tests now acquire an anatomy target before pinch. Threshold durations stay unchanged.
function prime(f) { for (const t of [-100, -50, 0, 50]) f.interaction.update([hand()], t); return f.interaction.update([hand()], 100); }
test('one open hand points; hover queries do not select or change pose', () => {
  const f = fixture(); assert.equal(prime(f), 'pointing');
  assert.equal(f.interaction.hoveredHandStructure, a); assert.deepEqual(f.selected, []);
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('moderate open-hand jitter never rotates or selects', () => {
  const f = fixture();
  for (let i = 0; i < 100; i++) assert.equal(f.interaction.update([hand(jitter(i))], 100 + i * 50), 'pointing');
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
  assert.deepEqual(f.selected, []); assert.deepEqual(f.summaries, []);
});
test('350/430 ms natural pinches and every grace boundary select despite moderate candidate jitter', () => {
  for (const duration of [350, 430, 450, 451, 500, 549]) {
    const f = fixture(); prime(f); f.interaction.update([pinched({ pinchRatio: .33 })], 150);
    for (let t = 200, i = 0; t < 150 + duration; t += 50, i++) {
      assert.equal(f.interaction.update([pinched({ ...jitter(i), pinchRatio: i % 2 ? .39 : .32 })], t), 'candidate');
      assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
      assert.deepEqual(f.selected, []); assert.deepEqual(f.summaries, []);
    }
    f.interaction.update([hand({ pinchRatio: .43 })], 150 + duration);
    assert.deepEqual(f.selected, [a], `${duration} ms release`);
    assert.equal(f.summaries.length, 1); assert.equal(f.summaries[0].durationMs, duration);
    assert.equal(f.summaries[0].outcome, 'select'); assert.equal(f.summaries[0].minRatio, .32);
  }
});
test('550/551 ms release is manipulation even without an inference exactly at hold', () => {
  for (const duration of [550, 551]) {
    const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
    for (let t = 200; t < 150 + duration; t += 50) f.interaction.update([pinched()], t);
    f.interaction.update([hand()], 150 + duration);
    assert.deepEqual(f.selected, []); assert.equal(f.summaries.at(-1).outcome, 'rotate');
  }
});
test('movement below .040 stays still; above .040 rotates and cannot select after returning', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  assert.equal(f.interaction.update([pinched({ y: .539 })], 200), 'candidate');
  assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
  assert.equal(f.interaction.update([pinched({ y: .541 })], 250), 'rotate');
  assert.ok(f.gestures.target.rotationX > 0);
  f.interaction.update([pinched()], 300); f.interaction.update([hand()], 350);
  assert.deepEqual(f.selected, []); assert.equal(f.summaries[0].outcome, 'rotate');
  assert.ok(Math.abs(f.summaries[0].maxCandidateMovement - .041) < 1e-10);
});
test('snapshot survives crossing a structure boundary during candidate jitter', () => {
  const f = fixture(point => point.x < 160.1 ? a : b);
  prime(f); f.interaction.update([pinched()], 150);
  f.interaction.update([pinched({ x: .412, indexX: .414 })], 200);
  assert.equal(f.interaction.hoveredHandStructure, b);
  f.interaction.update([hand({ indexX: .414 })], 500);
  assert.deepEqual(f.selected, []); // A tracking gap must still cancel the snapshot.
  const g = fixture(point => point.x < 160.1 ? a : b);
  prime(g); g.interaction.update([pinched()], 150);
  for (let t = 200; t < 500; t += 50) g.interaction.update([pinched({ x: .412, indexX: .414 })], t);
  g.interaction.update([hand({ indexX: .414 })], 500); assert.deepEqual(g.selected, [a]);
});
test('acquiring a closed hand or a secondary pinch also requires manipulation intent', () => {
  for (const secondary of [false, true]) {
    const f = fixture(), samples = h => secondary ? [hand(), { ...h, id: 'Right' }] : [h];
    f.interaction.update(samples(pinched()), 100);
    assert.equal(f.interaction.update(samples(pinched({ y: .53 })), 150), 'candidate');
    assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
    f.interaction.update(samples(hand()), 200); assert.deepEqual(f.selected, []);
    f.interaction.update(samples(pinched()), 250);
    assert.equal(f.interaction.update(samples(pinched({ y: .55 })), 300), 'rotate');
    f.interaction.update(samples(hand()), 350); assert.deepEqual(f.selected, []);
  }
});
test('calibration reports only four derived values once; loss and two pinches cancel the candidate', () => {
  for (const interruption of ['loss', 'scale', 'stop']) {
    const f = fixture(); prime(f); f.interaction.update([pinched({ pinchRatio: .33 })], 150);
    f.interaction.update([pinched({ y: .52, pinchRatio: .31 })], 200);
    if (interruption === 'loss') f.interaction.update([], 250);
    else if (interruption === 'scale') f.interaction.update([pinched(), pinched({ id: 'Right', x: .7 })], 250);
    else f.interaction.endGesture(250);
    f.interaction.endGesture(300);
    assert.equal(f.summaries.length, 1); assert.deepEqual(Object.keys(f.summaries[0]).sort(), ['durationMs', 'maxCandidateMovement', 'minRatio', 'outcome']);
    assert.equal(f.summaries[0].durationMs, 100); assert.equal(f.summaries[0].outcome, 'cancel');
    assert.equal(f.summaries[0].minRatio, .31); assert.ok(Math.abs(f.summaries[0].maxCandidateMovement - .02) < 1e-10);
    assert.deepEqual(f.selected, []);
  }
});
test('pinch onset creates a candidate; stable short release selects with exactly zero rotation', () => {
  const f = fixture(); prime(f);
  assert.equal(f.interaction.update([pinched()], 150), 'candidate'); assert.deepEqual(f.selected, []);
  f.interaction.update([pinched({ x: .402 })], 200);
  f.interaction.update([hand()], 250);
  assert.deepEqual(f.selected, [a]); assert.deepEqual(f.gestures.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('selection uses the pinch-onset target even when release points at a different structure', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  f.interaction.update([hand({ indexX: .53 })], 250);
  assert.equal(f.interaction.hoveredHandStructure, b); assert.deepEqual(f.selected, [a]);
});
test('movement rotates, permanently cancels selection, including return to origin before release', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  assert.equal(f.interaction.update([pinched({ x: .45 })], 200), 'rotate');
  assert.ok(f.gestures.target.rotationY > 0);
  f.interaction.update([pinched()], 250); f.interaction.update([hand()], 300);
  assert.deepEqual(f.selected, []);
});
test('sustained pinch enables slow rotation without a click; grace interval release selects', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  for (let t = 200; t < 150 + PINCH_HOLD_THRESHOLD; t += 50) f.interaction.update([pinched()], t);
  assert.equal(f.interaction.update([pinched()], 150 + PINCH_HOLD_THRESHOLD), 'rotate');
  f.interaction.update([pinched({ x: .415 })], 200 + PINCH_HOLD_THRESHOLD); assert.ok(f.gestures.target.rotationY > 0);
  f.interaction.update([hand()], 250 + PINCH_HOLD_THRESHOLD); assert.deepEqual(f.selected, []);
  const g = fixture(); prime(g); g.interaction.update([pinched()], 150);
  for (let t = 200; t < 150 + SHORT_PINCH_MAX_MS + 1; t += 50) g.interaction.update([pinched()], t);
  g.interaction.update([hand()], 150 + SHORT_PINCH_MAX_MS + 1);
  assert.deepEqual(g.selected, [a]);
});
test('a second pinch immediately scales, cancels candidate, and cannot select on two-to-one release', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
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
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  const pose = { ...f.gestures.target };
  f.interaction.update([hand({ id: 'Right' })], 200);
  assert.equal(f.drawings.at(-1), null); assert.equal(f.interaction.primaryId, null);
  f.interaction.update([pinched({ id: 'Right', x: .8, indexX: .8 })], 250);
  assert.deepEqual(f.gestures.target, pose); assert.equal(f.interaction.primaryId, 'Right');
  f.interaction.update([hand({ id: 'Right', x: .8 })], 300); assert.deepEqual(f.selected, []);
});
test('invalid/outside pointer performs no raycast and cancels candidate without deselection', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  const count = f.queries.length;
  f.interaction.update([pinched({ indexX: 1.1 })], 200);
  assert.equal(f.queries.length, count); assert.equal(f.drawings.at(-1), null);
  f.interaction.update([hand()], 250); assert.deepEqual(f.selected, []);
});
test('only a valid short pinch on an actual empty hit requests deselection', () => {
  const f = fixture(() => empty); prime(f); f.interaction.update([pinched()], 150);
  f.interaction.update([hand()], 250); assert.deepEqual(f.selected, [empty]);
  const unavailable = fixture(() => null); unavailable.interaction.update([hand()], 100);
  unavailable.interaction.update([pinched()], 150); unavailable.interaction.update([hand()], 250);
  assert.deepEqual(unavailable.selected, []);
});
test('hand selection switches A → B without clearing between selections', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150); f.interaction.update([hand()], 200);
  for (let t = 250; t <= 500; t += 50) f.interaction.update([hand({ indexX: Math.min(.7, .4 + (t - 200) / 500) })], t);
  f.interaction.update([pinched({ indexX: .7 })], 550); f.interaction.update([hand({ indexX: .7 })], 650);
  assert.deepEqual(f.selected, [a, b]);
});
test('manual priority cancels a candidate and reanchors the cursor; a held pinch cannot become a click', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  f.gestures.beginManual(); assert.equal(f.interaction.update([pinched()], 200), 'idle');
  assert.equal(f.drawings.at(-1), null); f.gestures.endManual();
  f.interaction.update([pinched({ x: .8, indexX: .8 })], 250);
  assert.equal(f.drawings.at(-1).point.x, 320); // no lerp from the pre-manual cursor
  f.interaction.update([hand({ x: .8 })], 300); assert.deepEqual(f.selected, []);
  f.block(true); f.interaction.update([hand()], 350); assert.equal(f.drawings.at(-1), null);
});
test('manual input entirely between inference results still invalidates candidate', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
  f.gestures.beginManual(); f.gestures.endManual(); f.interaction.update([hand()], 200);
  assert.deepEqual(f.selected, []);
});
test('stale results do no extra picking; gaps, discontinuity and explicit stop cancel selection', () => {
  const f = fixture(); prime(f); f.interaction.update([pinched()], 150);
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
  assert.equal(pointer.update(hand({ indexX: .8 }), 250, 4 / 3, rect), null, 'outlier needs explicit recovery');
  pointer.reanchor({ x: .8, y: .5 }, 250, false);
  assert.equal(pointer.update(hand({ indexX: .8 }), 300, 4 / 3, rect).x, 320);
});
test('normalization exposes landmark 8 with the same mirror as the preview, not the pinch midpoint', () => {
  const points = Array.from({ length: 21 }, () => ({ x: .2, y: .5, z: 0 }));
  points[9].y = .3; points[8] = { x: .25, y: .4, z: 0 };
  const [sample] = normalizeHands({ landmarks: [points], handedness: [[{ categoryName: 'Left', score: .99 }]] }, 4 / 3);
  assert.equal(sample.indexX, .75); assert.equal(sample.indexY, .4); assert.notEqual(sample.indexX, sample.x);
});
