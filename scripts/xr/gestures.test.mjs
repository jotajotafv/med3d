import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureController, isPinching, normalizeHands, clampScale, MIN_SCALE, MAX_SCALE } from '../../src/features/xr/gestures.ts';

const hand = (id = 'Left', x = 0.4, y = 0.5, pinchRatio = 0.15) => ({ id, x, y, pinchRatio });
test('pinch uses hysteresis and rejects invalid samples', () => {
  assert.equal(isPinching(0.29), true); assert.equal(isPinching(0.33), true);
  assert.equal(isPinching(0.34), false); assert.equal(isPinching(0.35), false);
  assert.equal(isPinching(0.40, true), true); assert.equal(isPinching(0.43, true), false);
  assert.equal(isPinching(NaN), false); assert.equal(isPinching(-1), false);
});
test('idle → rotate has no jump; horizontal and vertical movements rotate their axes', () => {
  const controller = new GestureController();
  controller.target.rotationY = 0.7;
  assert.equal(controller.update([hand()], 100), 'rotate'); assert.equal(controller.target.rotationY, 0.7);
  controller.update([hand('Left', 0.5, 0.6)], 150);
  assert.ok(controller.target.rotationY > 0.7); assert.ok(controller.target.rotationX > 0);
});
test('rotate → idle and tracking loss preserve pose; reacquisition rebases', () => {
  const controller = new GestureController();
  controller.update([hand()], 100); controller.update([hand('Left', 0.5)], 150);
  const pose = { ...controller.target };
  assert.equal(controller.update([], 200), 'idle'); assert.deepEqual(controller.target, pose);
  controller.update([hand('Left', 0.1)], 250); assert.deepEqual(controller.target, pose);
  assert.equal(controller.update([hand('Left', 0.1, 0.5, 0.8)], 300), 'idle');
});
test('two pinches scale relative to baseline with upper and lower clamps', () => {
  const controller = new GestureController();
  const pair = (distance) => [hand('Left', 0.5 - distance / 2), hand('Right', 0.5 + distance / 2)];
  assert.equal(controller.update(pair(0.25), 100), 'scale'); assert.equal(controller.target.scale, 1);
  for (let index = 1; index <= 12; index++) controller.update(pair(0.25 + index * 0.05), 100 + index * 50);
  assert.equal(controller.target.scale, MAX_SCALE);
  controller.endGesture(); controller.update(pair(0.8), 1000);
  for (let index = 1; index <= 14; index++) controller.update(pair(0.8 - index * 0.05), 1000 + index * 50);
  assert.equal(controller.target.scale, MIN_SCALE);
  assert.equal(clampScale(0), MIN_SCALE); assert.equal(clampScale(Infinity), 1);
});
test('two to one hand, changing identity, mode changes and frame gaps do not jump', () => {
  const controller = new GestureController();
  controller.update([hand('Left', 0.2), hand('Right', 0.8)], 100);
  controller.update([hand('Left', 0.15), hand('Right', 0.85)], 150);
  const pose = { ...controller.target };
  controller.update([hand('Left', 0.8)], 200); assert.deepEqual(controller.target, pose);
  controller.update([hand('Right', 0.2)], 250); assert.deepEqual(controller.target, pose);
  controller.update([hand('Right', 0.8)], 600); assert.deepEqual(controller.target, pose);
});
test('dead zone suppresses small jitter, but accumulated slow motion is retained', () => {
  const controller = new GestureController(); controller.update([hand()], 100);
  controller.update([hand('Left', 0.402)], 150); assert.equal(controller.target.rotationY, 0);
  for (let i = 1; i <= 20; i++) controller.update([hand('Left', 0.402 + i * 0.001)], 150 + 50 * i);
  assert.ok(controller.target.rotationY > 0.05);
});
test('manual input takes precedence and reset restores only XR pose', () => {
  const controller = new GestureController(); controller.beginManual(); controller.rotate(0.5, 0.2, 100);
  controller.update([hand()], 500); assert.equal(controller.mode, 'idle'); assert.equal(controller.target.rotationX, 0.5);
  controller.endManual(); controller.update([hand()], 550); assert.equal(controller.target.rotationX, 0.5);
  controller.scale(99, 600); assert.equal(controller.target.scale, MAX_SCALE);
  controller.reset(); assert.deepEqual(controller.target, { rotationX: 0, rotationY: 0, scale: 1 });
});
test('normalization mirrors X, accounts for aspect ratio, filters malformed and duplicate hands', () => {
  const points = Array.from({ length: 21 }, () => ({ x: 0.2, y: 0.5, z: 0 }));
  points[9].y = 0.3; points[4].x = 0.19; points[8].x = 0.21;
  const category = [{ categoryName: 'Left', score: 0.9 }];
  const samples = normalizeHands({ landmarks: [points, points], handedness: [category, category] }, 2);
  assert.equal(samples.length, 1); assert.equal(samples[0].x, 0.8); assert.ok(Math.abs(samples[0].pinchRatio - 0.2) < 1e-9);
  assert.deepEqual(normalizeHands({ landmarks: [points.slice(0, 20)], handedness: [category] }, 1), []);
  points[4].x = NaN; assert.deepEqual(normalizeHands({ landmarks: [points], handedness: [category] }, 1), []);
});
