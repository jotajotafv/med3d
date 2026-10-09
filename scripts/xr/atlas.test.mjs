import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GestureController } from '../../src/features/xr/gestures.ts';
import { HandInteraction } from '../../src/features/xr/handInteraction.ts';

// Compile unchanged production adapters/dependencies for Node; only provide the Vite URL environment.
const out = path.resolve('.cache/xr-atlas-tests'), compiled = new Set();
async function compile(relative) {
  relative = relative.replaceAll('\\', '/'); if (compiled.has(relative)) return; compiled.add(relative);
  const source = await readFile(path.resolve('src', relative), 'utf8'), imports = [...source.matchAll(/from ['"](\.\.?\/[^'"]+)['"]/g)];
  const resolutions = new Map();
  for (const [, specifier] of imports) {
    let dependency = path.posix.normalize(path.posix.join(path.posix.dirname(relative), specifier));
    if (!/\.tsx?$/.test(dependency)) { try { await readFile(path.join('src', dependency + '.ts')); dependency += '.ts'; } catch { dependency += '.tsx'; } }
    resolutions.set(specifier, specifier.replace(/\.tsx?$/, '') + '.mjs'); await compile(dependency);
  }
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  code = code.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (_, q, specifier) => `from ${q}${resolutions.get(specifier)}${q}`).replaceAll('import.meta.env.BASE_URL', "'/med3d/'");
  const file = path.join(out, relative.replace(/\.tsx?$/, '.mjs')); await mkdir(path.dirname(file), { recursive: true }); await writeFile(file, code);
}
const entries = ['state', 'assets', 'presentation', 'education', 'XrAtlasCard'];
for (const name of entries) await compile(`features/xr/atlas/${name}.${name === 'XrAtlasCard' ? 'tsx' : 'ts'}`);
const modules = await Promise.all(entries.map(name => import(pathToFileURL(path.join(out, `features/xr/atlas/${name}.mjs`)))));
const [{ initialAtlasState, atlasReducer }, { XrAtlasAssets }, { XrAtlasPresentation }, { atlasEducation }, { default: Card }] = modules;
const { AtlasAssetManager, createAssetLoader } = await import(pathToFileURL(path.join(out, 'features/anatomy/atlas/asset-manager.mjs')));
const { composeBodyCatalog } = await import(pathToFileURL(path.join(out, 'features/anatomy/atlas/body-catalog.mjs')));
const { createExplosionOffsets, explosionTarget } = await import(pathToFileURL(path.join(out, 'features/anatomy/atlas/explosion.mjs')));
const systems = ['skeletal', 'muscular', 'cardiovascular'];
const catalogs = Object.fromEntries(await Promise.all(systems.map(async id => [id, JSON.parse(await readFile(`public/models/anatomy/${id}/catalog.json`, 'utf8'))])));
const catalog = composeBodyCatalog(catalogs.skeletal, catalogs.muscular, undefined, catalogs.cardiovascular);
const originalCatalogs = JSON.stringify(catalogs);
globalThis.window = { location: { origin: 'http://xr-test.local' } };
const nativeFetch = globalThis.fetch, requests = [];
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted(); const pathname = new URL(url).pathname.replace(/^\/med3d\//, ''); requests.push(pathname);
  const bytes = await readFile(path.join('public', pathname)); signal?.throwIfAborted();
  return new Response(bytes, { headers: { 'Content-Length': String(bytes.length) } });
};
const resources = [];
try { for (const system of systems) { const load = createAssetLoader(catalogs[system]); for (const asset of catalogs[system].assets) resources.push(await load(asset, new AbortController().signal, () => {})); } }
finally { globalThis.fetch = nativeFetch; }
const root = new THREE.Group(); resources.forEach(resource => root.add(resource.group));
const originalGeometry = new Map(resources.flatMap(resource => resource.parts.map(part => [part, part.mesh.geometry])));
const sourceMaterials = new Map(resources.flatMap(resource => resource.parts.map(part => [part.mesh.material, part.mesh.material.toJSON()])));
const presentation = new XrAtlasPresentation(); presentation.add(resources);
const all = () => ({ ...initialAtlasState(), systemVisibility: { skeletal: true, muscular: true, cardiovascular: true } });
const visible = () => presentation.parts.filter(part => part.mesh.visible);
const waitUntil = async predicate => { for (let i = 0; i < 200; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); } throw new Error('Timed out'); };

test('pilot catalogs/loaders preserve all 32 native modules, 549 meshes and exact triangle/byte counts', () => {
  assert.equal(resources.length, 32); assert.equal(presentation.parts.length, 549);
  assert.equal(resources.reduce((n, r) => n + r.triangles, 0), 2083326);
  assert.equal(resources.reduce((n, r) => n + r.asset.bytes, 0), 18984084);
  assert.ok(requests.every(url => /models\/anatomy\/(skeletal|muscular|cardiovascular)\//.test(url)));
  assert.equal(JSON.stringify(catalogs), originalCatalogs);
});
test('skeletal starts on; muscular and cardiovascular off; only active meshes are pickable', () => {
  presentation.apply(initialAtlasState(), catalog);
  assert.equal(visible().length, 205); assert.ok(visible().every(part => part.node.systemId === 'skeletal'));
  assert.equal(presentation.visibleMeshes.length, 205);
});
test('progressive managers load on activation, retain across five off/on cycles and dispose exactly once', async () => {
  const fetched = [], loaded = [], disposed = [];
  const owner = new XrAtlasAssets(async system => { fetched.push(system); return catalogs[system]; }, source =>
    new AtlasAssetManager(source, async asset => { loaded.push(asset.id); return { asset, parts: [], dispose: () => disposed.push(asset.id) }; }));
  await owner.ensure('skeletal'); await waitUntil(() => owner.snapshot().systems.skeletal.ready === 7);
  assert.deepEqual(fetched, ['skeletal']); assert.equal(loaded.length, 7);
  let state = initialAtlasState();
  for (let i = 0; i < 5; i++) {
    state = atlasReducer(state, { type: 'system', system: 'muscular', enabled: true }); await owner.ensure('muscular');
    await waitUntil(() => owner.snapshot().systems.muscular.ready === 18);
    state = atlasReducer(state, { type: 'system', system: 'muscular', enabled: false }); presentation.apply(state, catalog);
    assert.ok(visible().every(part => part.node.systemId === 'skeletal'));
  }
  assert.equal(loaded.length, 25); assert.equal(new Set(loaded).size, 25); assert.equal(owner.snapshot().resources.length, 25);
  await owner.ensure('cardiovascular'); await waitUntil(() => owner.snapshot().systems.cardiovascular.ready === 7);
  assert.equal(loaded.length, 32); owner.dispose(); owner.dispose(); assert.equal(disposed.length, 32);
});
test('catalog failure can retry and late results after disposal cannot create resources', async () => {
  let calls = 0; const owner = new XrAtlasAssets(async system => { if (!calls++) throw new Error('offline'); return catalogs[system]; }, c => new AtlasAssetManager(c, async asset => ({ asset, parts: [], dispose() {} })));
  await owner.ensure('skeletal'); assert.match(owner.snapshot().systems.skeletal.error, /offline/);
  owner.retry('skeletal'); await waitUntil(() => owner.snapshot().systems.skeletal.ready === 7); owner.dispose();
  let finish, made = 0; const late = new XrAtlasAssets(() => new Promise(resolve => { finish = resolve; }), () => { made++; });
  const pending = late.ensure('skeletal'); late.dispose(); finish(catalogs.skeletal); await pending; assert.equal(made, 0);
});
test('opacity and highlight preserve source material and other layers; repeated changes allocate no materials', () => {
  let state = all(); presentation.apply(state, catalog); const bone = visible().find(part => part.node.systemId === 'skeletal');
  const muscle = visible().find(part => part.node.systemId === 'muscular'), base = bone.mesh.material;
  const count = presentation.materialCount;
  state = atlasReducer(state, { type: 'opacity', system: 'skeletal', value: .35 }); presentation.apply(state, catalog);
  assert.equal(bone.mesh.material.opacity, .35); assert.equal(muscle.mesh.material.opacity, 1); assert.equal(bone.mesh.material.depthWrite, false);
  for (let i = 0; i < 5; i++) { presentation.apply({ ...state, selectedStructure: bone.node.id }, catalog); assert.equal(bone.mesh.material.opacity, .35); presentation.apply(state, catalog); assert.equal(bone.mesh.material, base); }
  assert.equal(presentation.materialCount, count); assert.equal(base.transparent, true); assert.equal(base.emissiveIntensity, 1);
  for (const [part, geometry] of originalGeometry) assert.equal(part.mesh.geometry, geometry);
  for (const [material, json] of sourceMaterials) assert.deepEqual(material.toJSON(), json);
});
test('hide clears selection; restoreHidden keeps system toggles; isolation restores exact prior filters and opacity', () => {
  const bone = presentation.parts.find(part => part.node.systemId === 'skeletal'), other = presentation.parts.find(part => part !== bone && part.node.systemId === 'skeletal');
  let state = atlasReducer(all(), { type: 'opacity', system: 'muscular', value: .4 });
  state = atlasReducer(state, { type: 'hide', id: other.node.id }); const before = structuredClone(state);
  state = atlasReducer(state, { type: 'isolate', id: bone.node.id }); presentation.apply(state, catalog);
  assert.ok(visible().every(part => part.ancestors.has(bone.node.id)));
  state = atlasReducer(state, { type: 'exitIsolation' }); assert.deepEqual(state, before);
  state = atlasReducer({ ...state, selectedStructure: bone.node.id }, { type: 'hide', id: bone.node.id });
  assert.equal(state.selectedStructure, null); presentation.apply(state, catalog); assert.equal(bone.mesh.visible, false);
  state = atlasReducer(state, { type: 'system', system: 'muscular', enabled: false });
  state = atlasReducer(state, { type: 'restoreHidden' }); presentation.apply(state, catalog);
  assert.equal(bone.mesh.visible, true); assert.equal(state.systemVisibility.muscular, false);
});
function pickPart(part, state = all()) {
  presentation.apply(state, catalog); root.updateMatrixWorld(true);
  const camera = new THREE.PerspectiveCamera(38, 4 / 3, .001, 100);
  const centre = new THREE.Box3().setFromObject(part.mesh).getCenter(new THREE.Vector3());
  camera.position.copy(centre).add(new THREE.Vector3(0, 0, 3)); camera.lookAt(centre); camera.updateMatrixWorld(true);
  const rect = { left: 40, top: 80, width: 400, height: 300 }, position = part.mesh.geometry.getAttribute('position');
  for (let i = 0; i < Math.min(position.count, 150); i++) {
    const ndc = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(part.mesh.matrixWorld).project(camera);
    const point = { x: rect.left + (ndc.x + 1) * 200, y: rect.top + (1 - ndc.y) * 150 };
    const hit = presentation.pick(point, rect, camera, root, new THREE.Raycaster());
    if (hit.kind === 'selected') return { hit, point, camera, rect };
  }
  throw new Error('No real raycast hit');
}
test('real raycasts select bone, muscle and cardiovascular after XR transforms, opacity and explosion', () => {
  for (const system of systems) {
    const part = presentation.parts.find(part => part.node.systemId === system);
    root.rotation.set(.2, .3, 0); root.scale.setScalar(1.4);
    const state = { ...all(), isolatedStructure: part.node.id, explodedAmount: .5, systemOpacity: { skeletal: .3, muscular: .5, cardiovascular: .7 } };
    const { hit, point, camera, rect } = pickPart(part, state);
    assert.equal(hit.selection.id, part.node.id); assert.equal(hit.selection.node.systemId, system);
    presentation.apply({ ...state, hiddenStructures: [part.node.id] }, catalog);
    assert.equal(presentation.pick(point, rect, camera, root, new THREE.Raycaster()).kind, 'empty'); assert.equal(presentation.accepts(hit), false);
    presentation.apply({ ...state, systemVisibility: { ...state.systemVisibility, [system]: false } }, catalog);
    assert.equal(presentation.pick(point, rect, camera, root, new THREE.Raycaster()).kind, 'empty');
  }
  root.rotation.set(0, 0, 0); root.scale.setScalar(1);
});
test('existing explosion math at 0/50/100%; reset view and restore atlas have separate scope', () => {
  const state = all(), offsets = createExplosionOffsets(catalog, new Set(systems));
  for (const amount of [0, .5, 1, 0]) {
    presentation.apply({ ...state, explodedAmount: amount }, catalog);
    for (const part of presentation.parts) {
      const expected = part.basePosition.clone().add(new THREE.Vector3(...explosionTarget(offsets.get(part.node.id), 'regions', amount)));
      assert.deepEqual(part.mesh.position.toArray(), expected.toArray());
    }
  }
  const altered = { ...state, selectedStructure: 'x', hiddenStructures: ['y'], isolatedStructure: 'x', explodedAmount: .7 };
  assert.deepEqual(atlasReducer(altered, { type: 'resetView' }), { ...altered, explodedAmount: 0 });
  assert.deepEqual(atlasReducer(altered, { type: 'restoreAtlas' }), { ...initialAtlasState(), explodedAmount: .7 });
});
test('educational adapter reuses scoped sources; unknown content only renders available metadata', () => {
  for (const system of systems) {
    const part = presentation.parts.find(part => part.node.systemId === system), education = atlasEducation(part.node, catalog);
    assert.equal(education.name, part.node.name); assert.ok(education.provenance.length);
    const markup = renderToStaticMarkup(createElement(Card, { node: part.node, catalog, isolated: false, onClose() {}, onHide() {}, onIsolate() {} }));
    assert.ok(markup.includes(part.node.name)); assert.ok(markup.includes('Aislar')); assert.ok(markup.includes('Ocultar')); assert.ok(markup.includes('CC BY 4.0'));
    assert.ok(!markup.includes(part.mesh.name));
  }
  const unknown = { ...catalog.nodes.find(n => n.systemId === 'muscular' && n.meshNames.length), family: 'unknown', sourceId: 'unknown', kind: 'component' };
  const lesson = atlasEducation(unknown, catalog); assert.equal(lesson.fields.length, 0); assert.equal(lesson.sources.length, 0);
});
test('same calibrated hand arbitration selects atlas ID, rotates whole root target and scales with two pinches', () => {
  const part = presentation.parts.find(part => part.node.systemId === 'skeletal'), { hit } = pickPart(part, { ...all(), isolatedStructure: part.node.id });
  const gestures = new GestureController(), selected = [], interaction = new HandInteraction(gestures, {
    targetKey: value => value.kind === 'selected' ? value.selection.id : null,
    viewport: () => ({ left: 0, top: 0, width: 400, height: 300 }), hitTest: () => hit, select: value => selected.push(value), draw() {},
  });
  const hand = (pinchRatio, x = .5, id = 'Left') => ({ id, x, y: .5, indexX: x, indexY: .5, pinchRatio });
  for (let t = 100; t <= 1400; t += 50) interaction.update([hand(.5)], t); assert.equal(selected[0].selection.id, part.node.id);
  interaction.update([hand(.33)], 1450); assert.equal(interaction.update([hand(.33, .56)], 1500), 'rotate');
  assert.ok(gestures.target.rotationY > 0); interaction.update([hand(.5)], 1550); assert.equal(selected.length, 1);
  interaction.update([hand(.2, .4), hand(.2, .6, 'Right')], 1600);
  assert.equal(interaction.update([hand(.2, .35), hand(.2, .65, 'Right')], 1650), 'scale'); assert.ok(gestures.target.scale > 1);
});
test('release restores instance transforms/material ownership; geometry disposes once on owner teardown', () => {
  let materialDisposals = 0, geometryDisposals = 0;
  const clones = new Set(presentation.parts.map(part => part.mesh.material)); clones.forEach(material => material.addEventListener('dispose', () => materialDisposals++));
  const geometries = new Set(resources.flatMap(resource => [...resource.geometries])); geometries.forEach(geometry => geometry.addEventListener('dispose', () => geometryDisposals++));
  presentation.dispose(); presentation.dispose();
  assert.equal(materialDisposals, clones.size); assert.equal(geometryDisposals, 0);
  resources.forEach(resource => { for (const part of resource.parts) assert.deepEqual(part.mesh.position.toArray(), part.basePosition.toArray()); resource.dispose(); resource.dispose(); });
  assert.equal(geometryDisposals, geometries.size); assert.equal(JSON.stringify(catalogs), originalCatalogs);
});
