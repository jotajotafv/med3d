import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import { atlasTestCompiler } from './atlas-test-compiler.mjs';

const out = path.resolve('.cache/xr-full-atlas-tests'), compile = atlasTestCompiler(out);
for (const name of ['systems', 'assets', 'state', 'presentation', 'education']) await compile(`features/xr/atlas/${name}.ts`);
const moduleAt = file => import(pathToFileURL(path.join(out, file + '.mjs')));
const { XR_ATLAS_SYSTEMS: systems, loadXrCatalog, composeXrCatalog } = await moduleAt('features/xr/atlas/systems');
const { XrAtlasAssets } = await moduleAt('features/xr/atlas/assets');
const { AtlasAssetManager } = await moduleAt('features/anatomy/atlas/asset-manager');
const { initialAtlasState, atlasReducer } = await moduleAt('features/xr/atlas/state');
const { XrAtlasPresentation } = await moduleAt('features/xr/atlas/presentation');
const { atlasEducation } = await moduleAt('features/xr/atlas/education');
const { createExplosionOffsets, explosionTarget } = await moduleAt('features/anatomy/atlas/explosion');
const { SYSTEMS } = await moduleAt('features/anatomy/atlas/catalog-index');
globalThis.window = { location: { origin: 'http://xr-test.local' } };
const nativeFetch = globalThis.fetch, requests = [], catalogs = {}, originals = {};
globalThis.fetch = async (url, { signal } = {}) => {
  signal?.throwIfAborted(); const pathname = new URL(url, window.location.origin).pathname.replace(/^\/med3d\//, '');
  requests.push(pathname); const data = await readFile(path.join('public', pathname)); signal?.throwIfAborted();
  return new Response(data, { headers: { 'Content-Length': String(data.length) } });
};
const wait = async predicate => {
  for (let i = 0; i < 1000; i++) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 5)); }
  throw new Error('Atlas load timed out');
};
const owner = new XrAtlasAssets(async (id, signal) => {
  const catalog = await loadXrCatalog(id, signal); catalogs[id] = catalog; originals[id] = JSON.stringify(catalog); return catalog;
});
const presentation = new XrAtlasPresentation(), root = new THREE.Group();
const all = () => ({ ...initialAtlasState(), systemVisibility: Object.fromEntries(systems.map(s => [s.id, true])) });

test('eleven configured systems derive public names and only skeletal defaults ON', () => {
  assert.equal(systems.length, 11); assert.deepEqual(new Set(systems.map(s => s.id)), new Set(SYSTEMS.map(s => s.id)));
  for (const system of systems) assert.equal(system.name, SYSTEMS.find(s => s.id === system.id).name);
  const state = initialAtlasState(); assert.deepEqual(Object.entries(state.systemVisibility).filter(([, on]) => on).map(([id]) => id), ['skeletal']);
  assert.ok(Object.values(state.systemOpacity).every(value => value === 1));
});
test('progressive real catalogs/GLBs request only the chosen system, verify bytes/hashes, retain exact resource identities', async () => {
  let expectedBytes = 0, expectedMeshes = 0, expectedTriangles = 0, previousMemory = 0;
  for (const system of systems) {
    const before = requests.length; await owner.ensure(system.id);
    await wait(() => !owner.snapshot().systems[system.id].pending);
    const snapshot = owner.snapshot(), catalog = catalogs[system.id]; assert.equal(snapshot.systems[system.id].error, undefined);
    assert.deepEqual(new Set(requests.slice(before)), new Set([...system.catalogPaths, ...catalog.assets.map(a => a.path)]));
    assert.equal(catalog.frame.id, 'bodyparts3d-4.0-male');
    for (const asset of catalog.assets) {
      const bytes = await readFile('public/' + asset.path); assert.equal(bytes.length, asset.bytes);
      assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
      expectedBytes += asset.bytes; expectedMeshes += asset.meshCount; expectedTriangles += asset.triangles;
    }
    presentation.add(snapshot.resources); snapshot.resources.forEach(resource => root.add(resource.group));
    assert.equal(presentation.parts.length, expectedMeshes);
    assert.equal(snapshot.resources.reduce((n, r) => n + r.triangles, 0), expectedTriangles);
    assert.equal(snapshot.resources.reduce((n, r) => n + r.asset.bytes, 0), expectedBytes);
    const memory = snapshot.resources.reduce((n, r) => n + r.geometryBytes, 0); assert.ok(memory > previousMemory); previousMemory = memory;
    const refs = snapshot.resources, count = requests.length;
    for (let i = 0; i < 3; i++) await owner.ensure(system.id);
    assert.equal(requests.length, count); assert.equal(owner.snapshot().resources, refs);
  }
  assert.equal(owner.snapshot().resources.length, 52); assert.equal(presentation.parts.length, 937);
  assert.equal(JSON.stringify(catalogs.nervous), originals.nervous);
  assert.ok(catalogs.nervous.nodes.some(n => n.ocularClass)); assert.ok(catalogs.nervous.provenance.some(p => p.license === 'CC BY-SA 4.0'));
  globalThis.fetch = nativeFetch;
});
test('each system supports opacity, real transformed raycasts, existing lessons, isolate/hide/restore and exact material reuse', () => {
  const catalog = owner.snapshot().catalog, originalMaterials = new Map(presentation.parts.map(p => [p, p.mesh.material]));
  const geometry = new Map(presentation.parts.map(p => [p, p.mesh.geometry]));
  root.rotation.set(.15, .35, 0); root.scale.setScalar(1.35);
  for (const { id } of systems) {
    const part = presentation.parts.find(p => p.node.systemId === id && atlasEducation(p.node, catalog).fields.length);
    assert.ok(part, id + ' has real educational content');
    let state = atlasReducer(all(), { type: 'opacity', system: id, value: .35 });
    state = atlasReducer(state, { type: 'isolate', id: part.node.id }); presentation.apply(state, catalog);
    assert.ok(presentation.visibleMeshes.length); assert.ok(presentation.parts.filter(p => p.mesh.visible).every(p => p.ancestors.has(part.node.id)));
    assert.equal(part.mesh.material.opacity, .35); assert.equal(part.mesh.material.transparent, true);
    root.updateMatrixWorld(true);
    const centre = new THREE.Box3().setFromObject(part.mesh).getCenter(new THREE.Vector3());
    const camera = new THREE.PerspectiveCamera(38, 4 / 3, .001, 100); camera.position.copy(centre).add(new THREE.Vector3(0, 0, 3)); camera.lookAt(centre); camera.updateMatrixWorld(true);
    const position = part.mesh.geometry.getAttribute('position'), rect = { left: 40, top: 80, width: 400, height: 300 };
    let hit, point;
    for (let i = 0; i < Math.min(position.count, 300); i++) {
      const ndc = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(part.mesh.matrixWorld).project(camera);
      point = { x: rect.left + (ndc.x + 1) * 200, y: rect.top + (1 - ndc.y) * 150 };
      hit = presentation.pick(point, rect, camera, root, new THREE.Raycaster()); if (hit.kind === 'selected') break;
    }
    assert.equal(hit.kind, 'selected', id); assert.equal(hit.selection.id, part.node.id);
    const lesson = atlasEducation(hit.selection.node, catalog); assert.ok(lesson.fields.length); assert.ok(lesson.provenance.length); assert.equal(lesson.name, part.node.name);
    const collection = presentation.visibleMeshes, base = part.mesh.material, count = presentation.materialCount;
    presentation.apply({ ...state, selectedStructure: part.node.id }, catalog); assert.equal(presentation.visibleMeshes, collection);
    presentation.apply(state, catalog); assert.equal(part.mesh.material, base); assert.equal(presentation.materialCount, count);
    state = atlasReducer({ ...state, selectedStructure: part.node.id }, { type: 'hide', id: part.node.id }); presentation.apply(state, catalog);
    assert.equal(state.selectedStructure, null); assert.equal(part.mesh.visible, false); assert.equal(presentation.accepts(hit), false);
    assert.equal(presentation.pick(point, rect, camera, root, new THREE.Raycaster()).selection?.id === part.node.id, false);
    state = atlasReducer(state, { type: 'system', system: id, enabled: false }); state = atlasReducer(state, { type: 'restoreHidden' }); presentation.apply(state, catalog);
    assert.equal(part.mesh.visible, false); state = atlasReducer(state, { type: 'system', system: id, enabled: true }); presentation.apply(state, catalog); assert.equal(part.mesh.visible, true);
  }
  for (const [part, g] of geometry) assert.equal(part.mesh.geometry, g);
  presentation.dispose(); for (const [part, material] of originalMaterials) assert.equal(part.mesh.material, material);
  presentation.add(owner.snapshot().resources);
});
test('all-system explosion uses original offsets; zero restores exact base; reset retains geometry and independent filters', () => {
  const catalog = owner.snapshot().catalog, state = all(), offsets = createExplosionOffsets(catalog, new Set(systems.map(s => s.id)));
  for (const amount of [0, .5, 1, 0]) {
    presentation.apply({ ...state, explodedAmount: amount }, catalog);
    for (const part of presentation.parts) assert.deepEqual(part.mesh.position.toArray(), part.basePosition.clone().add(new THREE.Vector3(...explosionTarget(offsets.get(part.node.id), 'regions', amount))).toArray());
  }
  const reset = atlasReducer({ ...state, hiddenStructures: ['x'], selectedStructure: 'x', isolatedStructure: 'x', explodedAmount: .5 }, { type: 'restoreAtlas' });
  assert.deepEqual(reset, { ...initialAtlasState(), explodedAmount: .5 });
  for (const id of Object.keys(catalogs)) assert.equal(JSON.stringify(catalogs[id]), originals[id]);
});
test('new lessons keep semantic labels, asset-specific licenses, corneal transparency and unknown nerve omissions', () => {
  const catalog = owner.snapshot().catalog;
  const peripheral = catalog.nodes.find(n => n.family?.startsWith('z:') && n.meshNames.length);
  assert.ok(peripheral);
  const lesson = atlasEducation(peripheral, catalog);
  assert.ok(lesson.fields.some(([label]) => label === 'Recorrido general'));
  assert.ok(lesson.fields.some(([label]) => label === 'Territorio'));
  assert.ok(lesson.provenance.some(p => p.license === 'CC BY-SA 4.0'));
  const unknown = atlasEducation({ ...peripheral, family: 'unknown', sourceId: 'unknown' }, catalog);
  assert.equal(unknown.fields.length, 0); assert.equal(unknown.sources.length, 0);
  for (const id of ['respiratory', 'endocrine']) {
    const source = catalogs[id].provenance.find(p => p.license === 'CC BY-SA 2.1 Japan');
    const asset = catalogs[id].assets.find(a => a.provenanceId === source.id);
    const node = catalogs[id].nodes.find(n => n.meshNames.length && n.assetIds.includes(asset.id));
    assert.ok(atlasEducation(node, catalog).provenance.some(p => p.id === source.id));
  }
  const cornea = presentation.parts.find(p => p.node.ocularClass === 'cornea');
  presentation.apply(all(), catalog); assert.equal(cornea.mesh.material.opacity, .22);
  const collection = presentation.visibleMeshes;
  presentation.apply({ ...all(), systemVisibility: all().systemVisibility, selectedStructure: cornea.node.id }, catalog);
  assert.equal(cornea.mesh.material.opacity, .55); assert.ok(presentation.visibleMeshes.includes(cornea.mesh));
  // Opacity and explosion do not rebuild the pickable set when visibility references are unchanged.
  const state = all(); presentation.apply(state, catalog); const stable = presentation.visibleMeshes;
  presentation.apply({ ...state, systemOpacity: { ...state.systemOpacity, nervous: .4 }, explodedAmount: .5 }, catalog);
  assert.equal(presentation.visibleMeshes, stable); assert.equal(collection.length, 937);
});
test('rapid activation and failed-module retry respect two global slots; pending owners dispose without starting downloads', async () => {
  let inFlight = 0, peak = 0, fail = true; const loaded = [], freed = [], catalogRequests = [];
  const queue = new XrAtlasAssets(async id => { catalogRequests.push(id); return catalogs[id]; }, c => new AtlasAssetManager(c, async asset => {
    peak = Math.max(peak, ++inFlight); loaded.push(asset.id); await new Promise(resolve => setTimeout(resolve, 2)); inFlight--;
    if (asset.id === catalogs.skeletal.assets[0].id && fail) throw new Error('fixture failure');
    return { asset, parts: [], dispose: () => freed.push(asset.id) };
  }, 1));
  const pending = systems.map(s => queue.ensure(s.id)); assert.equal(catalogRequests.length, 2);
  await wait(() => !!queue.snapshot().systems.skeletal.error && !queue.snapshot().systems.skeletal.pending); fail = false; queue.retry('skeletal');
  await Promise.all(pending); await wait(() => systems.every(s => !queue.snapshot().systems[s.id].pending));
  assert.equal(peak, 2); assert.equal(queue.snapshot().resources.length, 52); assert.equal(loaded.length, 53);
  const refs = queue.snapshot().resources; await Promise.all(systems.map(s => queue.ensure(s.id))); assert.equal(queue.snapshot().resources, refs);
  queue.dispose(); queue.dispose(); assert.equal(freed.length, 52); assert.equal(new Set(freed).size, 52);
  const starts = []; let finish;
  const stopped = new XrAtlasAssets(id => { starts.push(id); return new Promise(resolve => { finish = resolve; }); });
  const promises = systems.map(s => stopped.ensure(s.id)); stopped.dispose(); await Promise.all(promises); assert.equal(starts.length, 2); finish(catalogs.muscular);
});
test('teardown restores all source materials and transforms and releases geometry once', () => {
  const geometry = new Set(owner.snapshot().resources.flatMap(r => [...r.geometries])); let disposals = 0;
  for (const g of geometry) g.addEventListener('dispose', () => disposals++);
  presentation.dispose(); assert.equal(disposals, 0);
  for (const resource of owner.snapshot().resources) for (const part of resource.parts) assert.deepEqual(part.mesh.position.toArray(), part.basePosition.toArray());
  owner.dispose(); owner.dispose(); assert.equal(disposals, geometry.size); assert.equal(presentation.materialCount, 0);
});
