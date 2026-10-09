// Approximate CPU comparison of actual pure input pipelines; not DOM/raycast cost or FPS.
// Baseline source is read from the requested local XR 1.5 commit, without switching branches.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve, dirname } from 'node:path';
const base = 'ad7b5cf00b5b1ab21f49379e970e535a41f2db9c';
const output = '.cache/xr-stability';
for (const file of ['handConfig.ts', 'handPointer.ts', 'gestures.ts', 'handInteraction.ts', 'ui/handUiRouter.ts']) {
  const destination = resolve(output, 'baseline', file); await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, execFileSync('git', ['show', `${base}:src/features/xr/${file}`], { windowsHide: true }));
}
async function modules(directory) {
  const load = file => import(pathToFileURL(resolve(directory, file)).href);
  return { ...(await load('gestures.ts')), ...(await load('handInteraction.ts')), ...(await load('ui/handUiRouter.ts')) };
}
const baseline = await modules(output + '/baseline'), current = await modules('src/features/xr');
const { HandStability } = await import('../../src/features/xr/handStability.ts');
function measure(module, stable, uiRoute, iterations = 50000) {
  const rect = { left: 0, top: 0, width: 800, height: 600 }, target = { id: 'button', kind: 'toggle', enabled: true, rect };
  const gestures = new module.GestureController(); let pipeline;
  const anatomy = new module.HandInteraction(gestures, { viewport: () => rect,
    ...(stable ? { point: () => pipeline.point } : {}), targetKey: value => value.selection.id,
    hitTest: point => ({ kind: 'selected', selection: { id: point.x < 321 ? 'A' : 'B' } }), select() {}, draw() {} });
  const router = new module.HandUiRouter(gestures, anatomy, { surface: () => rect,
    hitTest: () => uiRoute ? { route: 'ui', target } : { route: 'anatomy' }, resolve: () => target, activate() {}, change() {}, feedback() {} },
  () => false, stable ? { point: () => pipeline.point } : {});
  pipeline = stable ? new HandStability(router, gestures, { surface: () => rect, blocked: () => false, report() {} }) : router;
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    const x = .4 + Math.sin(i * 1.7) * .004, y = .5 + Math.cos(i * 2.3) * .003;
    pipeline.update([{ id: 'Left', x, y, indexX: x, indexY: y, pinchRatio: i % 20 >= 16 && i % 20 <= 18 ? .33 : .5 }], 100 + i * 50, 4 / 3);
  }
  return (performance.now() - start) / iterations;
}
const results = [];
for (const uiRoute of [false, true]) {
  measure(baseline, false, uiRoute, 5000); measure(current, true, uiRoute, 5000);
  const before = [], after = [];
  for (let i = 0; i < 7; i++) {
    if (i % 2) { after.push(measure(current, true, uiRoute)); before.push(measure(baseline, false, uiRoute)); }
    else { before.push(measure(baseline, false, uiRoute)); after.push(measure(current, true, uiRoute)); }
  }
  const median = values => [...values].sort((a, b) => a - b)[3];
  results.push({ route: uiRoute ? 'UI' : 'anatomy', baselineMs: median(before), currentMs: median(after), deltaMs: median(after) - median(before), before, after });
}
await writeFile(`${output}/performance-core.json`, JSON.stringify({ base, iterations: 50000, rounds: 7, results }, null, 2));
console.log(JSON.stringify({ base, results }, null, 2));
