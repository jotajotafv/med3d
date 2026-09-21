// Source catalog composition and actual nine-GLB lifecycle checks. No WebGL mock.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(path.join(project, '.multisystem-tests-'));
const previousFetch = globalThis.fetch, previousWindow = globalThis.window;
try {
  for (const file of ['asset-manager', 'explosion', 'catalog-index', 'body-catalog', 'muscle-education']) {
    const source = (await readFile(path.join(project, 'src/features/anatomy/atlas', `${file}.ts`), 'utf8'))
      .replaceAll('import.meta.env.BASE_URL', JSON.stringify('/med3d/'));
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await writeFile(path.join(temporary, `${file}.mjs`), compiled.outputText.replaceAll("'./catalog-index'", "'./catalog-index.mjs'"));
  }
  const { composeBodyCatalog, BODY_ROOT_ID } = await import(pathToFileURL(path.join(temporary, 'body-catalog.mjs')));
  const { createCatalogIndex, flattenTree } = await import(pathToFileURL(path.join(temporary, 'catalog-index.mjs')));
  const { createExplosionOffsets, explosionTarget } = await import(pathToFileURL(path.join(temporary, 'explosion.mjs')));
  const { createAssetLoader, AtlasAssetManager } = await import(pathToFileURL(path.join(temporary, 'asset-manager.mjs')));
  const { MUSCLE_EDUCATION, resolveMuscleDetail, getMuscleContextIds } = await import(pathToFileURL(path.join(temporary, 'muscle-education.mjs')));
  const skeletal = JSON.parse(await readFile(path.join(project, 'public/models/anatomy/skeletal/catalog.json'), 'utf8'));
  const muscular = JSON.parse(await readFile(path.join(project, 'public/models/anatomy/muscular/catalog.json'), 'utf8'));
  const originalSkeleton = JSON.stringify(skeletal), originalMuscular = JSON.stringify(muscular);
  const catalog = composeBodyCatalog(skeletal, muscular), index = createCatalogIndex(catalog);
  assert.equal(JSON.stringify(skeletal), originalSkeleton, 'composition must not mutate the source skeleton');
  assert.equal(JSON.stringify(muscular), originalMuscular, 'composition must not mutate the source muscles');
  assert.equal(catalog.assets.length, 9);
  assert.equal(catalog.coverage.meshes, 231);
  assert.deepEqual(catalog.frame, skeletal.frame, 'whole-body scale and origin stay fixed');
  assert.equal(index.byId.get(BODY_ROOT_ID).kind, 'body');
  assert.equal(index.byId.get(BODY_ROOT_ID).systemId, undefined, 'body must not pretend to be skeletal');
  assert.deepEqual(index.byId.get(BODY_ROOT_ID).children, ['skeletal', 'muscular']);
  assert.equal(index.assetIdsFor(BODY_ROOT_ID).length, 9);
  assert.equal(index.assetIdsFor('skeletal').length, 7);
  assert.equal(index.assetIdsFor('muscular').length, 2);
  assert.equal(flattenTree(catalog, index, new Set(catalog.nodes.map(node => node.id))).length, catalog.nodes.length);
  assert.equal(muscular.nodes.filter(node => node.kind === 'structure').length, 16, '26 elements represent 16 complete muscle units');
  assert.equal(muscular.nodes.filter(node => node.meshNames.length).length, 26);
  for (const node of skeletal.nodes) {
    assert.ok(index.byId.has(node.id), `stable bone identifier ${node.id}`);
    assert.deepEqual(index.byId.get(node.id).meshNames, node.meshNames);
  }
  for (const name of ['deltoides', 'bíceps', 'tríceps', 'braquial', 'supraespinoso', 'infraespinoso', 'redondo menor', 'subescapular', 'húmero', 'escápula', 'clavícula', 'FMA34680', 'FJ1468']) {
    assert.ok(index.find(name).length, `global source/Spanish search ${name}`);
  }
  const fallback = composeBodyCatalog(skeletal);
  assert.equal(fallback.assets.length, 7);
  assert.equal(fallback.nodes[0].systemId, undefined);
  for (const change of [{ id: 'unregistered-donor' }, { units: 'millimetres' }, { up: 'Z' }]) {
    const broken = structuredClone(muscular); Object.assign(broken.frame, change);
    assert.throws(() => composeBodyCatalog(skeletal, broken), /marco/);
  }
  const badAssetFrame = structuredClone(muscular); badAssetFrame.assets[0].frameId = 'other-frame';
  assert.throws(() => composeBodyCatalog(skeletal, badAssetFrame), /marco/);
  const duplicate = structuredClone(muscular); duplicate.nodes[0].id = 'skeletal';
  assert.throws(() => composeBodyCatalog(skeletal, duplicate));
  const falseBody = structuredClone(catalog); falseBody.nodes[0].systemId = 'skeletal';
  assert.throws(() => createCatalogIndex(falseBody), /neutral/);
  const owners = muscular.nodes.filter(node => node.meshNames.length);
  assert.equal(Object.keys(MUSCLE_EDUCATION).length, 8, 'eight reviewed muscle families only');
  assert.equal(owners.filter(node => resolveMuscleDetail(node)).length, 26, 'every actual source element resolves to the correct card scope');
  const wholeMuscles = muscular.nodes.filter(node => node.kind === 'structure');
  assert.equal(wholeMuscles.filter(node => resolveMuscleDetail(node)?.scope === 'muscle').length, 16);
  assert.equal(owners.filter(node => resolveMuscleDetail(node)?.scope === 'component').length, 16, 'heads and portions never count as independent complete muscles');
  for (const node of catalog.nodes) {
    if (node.systemId !== 'muscular' || !['structure', 'component'].includes(node.kind)) {
      assert.equal(resolveMuscleDetail(node), undefined, 'individual muscle cards must not leak onto bones, groups or body root');
      assert.deepEqual(getMuscleContextIds(node, index.byId), []);
    }
  }
  for (const node of [...wholeMuscles, ...owners]) {
    const detail = resolveMuscleDetail(node);
    assert.ok(detail.origins.length && detail.insertions.length && detail.innervation && detail.action, `educational completeness ${node.id}`);
    assert.ok(detail.sources.length);
    for (const source of detail.sources) assert.equal(new URL(source.url).protocol, 'https:');
    for (const id of getMuscleContextIds(node, index.byId)) {
      const bone = index.byId.get(id);
      assert.equal(bone.systemId, 'skeletal');
      assert.equal(bone.side, node.side, 'context never falls back to the other side');
    }
  }
  for (const side of ['right', 'left']) {
    const bone = family => skeletal.nodes.find(node => node.family === family && node.side === side)?.id;
    const expected = {
      deltoid: ['clavicle', 'scapula', 'humerus'], bicepsbrachii: ['scapula', 'radius'],
      tricepsbrachii: ['scapula', 'humerus', 'ulna'], brachialis: ['humerus', 'ulna'],
      supraspinatus: ['scapula', 'humerus'], infraspinatus: ['scapula', 'humerus'],
      teresminor: ['scapula', 'humerus'], subscapularis: ['scapula', 'humerus'],
    };
    for (const [family, families] of Object.entries(expected)) {
      const muscle = wholeMuscles.find(node => node.family === family && node.side === side);
      assert.ok(muscle, `actual whole muscle ${family} ${side}`);
      assert.deepEqual(new Set(getMuscleContextIds(muscle, index.byId)), new Set(families.map(bone)), `curated origin/insertion bone context ${family} ${side}`);
    }
  }
  assert.deepEqual(new Set(getMuscleContextIds(index.byId.get('bp3d:FMA34680'), index.byId)), new Set(['bp3d:FMA13322', 'bp3d:FMA23130']), 'clavicular deltoid portion does not inherit scapular origins');
  assert.deepEqual(new Set(getMuscleContextIds(index.byId.get('bp3d:FMA37695'), index.byId)), new Set(['bp3d:FMA23130', 'bp3d:FMA23467']), 'medial triceps head does not inherit the long-head scapular origin');
  const unknownComponent = { ...owners[0], id: 'unreviewed-component', sourceId: 'unknown', kind: 'component' };
  assert.equal(resolveMuscleDetail(unknownComponent), undefined, 'unknown components require a separately reviewed card');
  const withoutScapula = new Map(index.byId); withoutScapula.delete('bp3d:FMA13395');
  assert.deepEqual(getMuscleContextIds(index.byId.get('bp3d:FMA32544'), withoutScapula), ['bp3d:FMA23130'], 'missing context bones are omitted without nearest-mesh substitution');
  const ambiguous = structuredClone(catalog);
  ambiguous.nodes.find(node => node.id === owners[1].id).meshNames.push(owners[0].meshNames[0]);
  ambiguous.nodes.find(node => node.id === owners[1].id).assetIds = [...owners[0].assetIds];
  assert.throws(() => createAssetLoader(ambiguous), /propietarios/);

  const offsets = createExplosionOffsets(catalog, new Set(['skeletal', 'muscular']));
  const reversed = createExplosionOffsets(catalog, new Set(['muscular', 'skeletal']));
  for (const node of catalog.nodes) {
    assert.deepEqual(offsets.get(node.id), reversed.get(node.id), 'system activation order must not randomise presentation');
    for (const level of ['systems', 'regions', 'structures']) {
      assert.deepEqual(explosionTarget(offsets.get(node.id), level, 0), [0, 0, 0], '0% restores exact source pose');
      assert.deepEqual(explosionTarget(offsets.get(node.id), level, NaN), [0, 0, 0]);
      assert.ok(explosionTarget(offsets.get(node.id), level, 1).every(Number.isFinite));
    }
    if (node.systemId) assert.deepEqual(offsets.get(node.id).systems, offsets.get(node.systemId).systems, 'every system is a coherent block');
  }
  assert.notDeepEqual(offsets.get('skeletal').systems, offsets.get('muscular').systems);
  const coincident = structuredClone(catalog);
  coincident.assets.forEach(asset => { asset.bounds = structuredClone(catalog.frame.bounds); });
  const sameCentres = createExplosionOffsets(coincident, new Set(['skeletal', 'muscular']));
  assert.notDeepEqual(sameCentres.get('skeletal').systems, sameCentres.get('muscular').systems, 'coincident system centroids still separate');
  for (const system of ['skeletal', 'muscular']) {
    const alone = createExplosionOffsets(catalog, new Set([system]));
    for (const node of catalog.nodes.filter(node => node.systemId === system)) assert.deepEqual(alone.get(node.id).systems, [0, 0, 0], 'one real system never drifts');
  }
  for (const side of ['right', 'left']) {
    const limb = catalog.nodes.filter(node => node.explosionRegionId === `upper-limb-${side}` && node.meshNames.length);
    assert.ok(limb.some(node => node.systemId === 'muscular') && limb.some(node => node.systemId === 'skeletal'));
    const reference = offsets.get(limb[0].id).regions;
    for (const node of limb) assert.deepEqual(offsets.get(node.id).regions, reference, 'muscles and arm bones retain their regional relationship');
    for (const family of ['deltoid', 'bicepsbrachii', 'tricepsbrachii']) {
      const parent = index.byId.get(`med3d:muscle:${family}:${side}`);
      assert.ok(parent?.children.length > 1);
      assert.ok(new Set(parent.children.map(id => JSON.stringify(offsets.get(id).structures))).size > 1, `${family} components separate around their real parent`);
      for (const child of parent.children) assert.ok(index.inside(child, parent.id));
    }
  }

  globalThis.window = { location: { origin: 'http://localhost' } };
  let failAsset, deferAsset, releaseFetch;
  globalThis.fetch = async (url, options) => {
    const pathname = new URL(url).pathname;
    if (failAsset && pathname.endsWith(failAsset.path)) return new Response('simulated partial network failure', { status: 503 });
    if (deferAsset && pathname.endsWith(deferAsset.path)) await new Promise(resolve => { releaseFetch = resolve; });
    options?.signal?.throwIfAborted();
    const data = await readFile(path.join(project, 'public', pathname.replace(/^\/med3d\//, '')));
    return new Response(data, { headers: { 'content-length': String(data.length) } });
  };
  const loader = createAssetLoader(catalog);
  let meshes = 0, triangles = 0, geometryBytes = 0;
  for (const asset of catalog.assets) {
    const resource = await loader(asset, new AbortController().signal, () => {});
    assert.equal(resource.parts.length, asset.meshCount);
    assert.equal(resource.triangles, asset.triangles);
    for (const part of resource.parts) {
      assert.ok(part.ancestors.has(BODY_ROOT_ID) && part.ancestors.has(asset.systemId));
      assert.equal(part.node.systemId, asset.systemId);
      assert.deepEqual(part.offset.toArray(), [0, 0, 0]);
    }
    meshes += resource.parts.length; triangles += resource.triangles; geometryBytes += resource.geometryBytes;
    resource.dispose();
  }
  assert.equal(meshes, 231);
  const muscleAsset = muscular.assets[0];
  const missingMesh = structuredClone(catalog);
  missingMesh.nodes.find(node => node.assetIds.includes(muscleAsset.id) && node.meshNames.length).meshNames.push('missing_registered_mesh');
  await assert.rejects(createAssetLoader(missingMesh)(muscleAsset, new AbortController().signal, () => {}), /todas las mallas/);
  await assert.rejects(loader({ ...muscleAsset, meshCount: 14 }, new AbortController().signal, () => {}), /todas las mallas/);
  await assert.rejects(loader({ ...muscleAsset, triangles: muscleAsset.triangles + 1 }, new AbortController().signal, () => {}), /triángulos/);
  const skeletonIds = skeletal.assets.map(asset => asset.id), muscleIds = muscular.assets.map(asset => asset.id), allIds = catalog.assets.map(asset => asset.id);
  const manager = new AtlasAssetManager(catalog);
  const settle = async () => {
    const deadline = performance.now() + 10000;
    while (manager.snapshot().statuses.some(status => status.state === 'queued' || status.state === 'loading')) {
      if (performance.now() > deadline) throw new Error('Asset lifecycle did not settle');
      await new Promise(resolve => setTimeout(resolve, 2));
    }
    return manager.snapshot();
  };
  try {
    manager.setDesired(skeletonIds); await settle();
    const skeletalResources = manager.snapshot().resources;
    assert.equal(skeletalResources.length, 7);
    failAsset = muscleAsset;
    manager.setDesired([...skeletonIds, muscleAsset.id]); await settle();
    assert.equal(manager.snapshot().statuses.find(status => status.id === muscleAsset.id).state, 'error');
    assert.deepEqual(manager.snapshot().resources, skeletalResources, 'partial muscle failure preserves the exact bone resource objects');
    failAsset = undefined; manager.retry(muscleAsset.id); await settle();
    assert.equal(manager.snapshot().resources.length, 8);
    manager.setDesired(allIds); await settle();
    assert.equal(manager.snapshot().resources.length, 9);
    assert.ok(skeletalResources.every(resource => manager.snapshot().resources.includes(resource)), 'adding both muscles does not recreate bones');
    const combinedBytes = manager.snapshot().resources.reduce((sum, resource) => sum + resource.geometryBytes, 0);
    assert.equal(combinedBytes, geometryBytes);
    const muscleResources = manager.snapshot().resources.filter(resource => resource.asset.systemId === 'muscular');
    manager.setDesired(muscleIds); await settle();
    assert.deepEqual(manager.snapshot().resources, muscleResources, 'disabling the skeleton preserves muscles');
    for (const id of muscleIds) {
      manager.setDesired([id]); await settle();
      assert.equal(manager.snapshot().resources[0].parts.length, 13, `independent regional module ${id}`);
    }
    for (let cycle = 0; cycle < 4; cycle++) {
      manager.setDesired(skeletonIds); await settle();
      manager.setDesired(allIds); await settle();
      assert.equal(manager.snapshot().resources.reduce((sum, resource) => sum + resource.geometryBytes, 0), combinedBytes, 'repeated regional reload does not grow retained geometry');
      assert.equal(new Set(manager.snapshot().resources.flatMap(resource => [...resource.geometries])).size, 231);
    }
    manager.setDesired(skeletonIds); await settle();
    deferAsset = muscleAsset; manager.setDesired([...skeletonIds, muscleAsset.id]);
    while (!releaseFetch) await new Promise(resolve => setTimeout(resolve, 2));
    manager.setDesired(skeletonIds); releaseFetch(); deferAsset = undefined;
    manager.setDesired(allIds); await settle();
    assert.equal(manager.snapshot().resources.length, 9, 'rapid disable/re-enable reaches the latest real module set');
    assert.equal(manager.snapshot().resources.reduce((sum, resource) => sum + resource.geometryBytes, 0), combinedBytes);
  } finally { manager.dispose(); }
  assert.equal(manager.snapshot().resources.length, 0);
  console.log('Multisystem source catalogs, neutral body, hierarchy, frame rejection, owner rejection, shared regional and deterministic system explosion passed.');
  console.log('Nine actual GLBs, unilateral/bilateral loading, partial failure/retry, retained other system, regional reload and rapid switching passed:', JSON.stringify({ meshes, triangles, geometryBytes }));
} finally {
  globalThis.fetch = previousFetch;
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  await rm(temporary, { recursive: true, force: true });
}
