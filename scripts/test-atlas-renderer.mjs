// Meaningful ownership/regression checks without a browser or WebGL dependency.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = await mkdtemp(path.join(project, '.renderer-tests-'));
try {
  for (const file of ['asset-manager', 'explosion']) {
    const source = (await readFile(path.join(project, 'src/features/anatomy/atlas', file + '.ts'), 'utf8')).replaceAll('import.meta.env.BASE_URL', JSON.stringify('/med3d/'));
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
    await writeFile(path.join(temporary, file + '.mjs'), compiled.outputText);
  }
  const { AtlasAssetManager, geometryMemoryBytes, createAssetLoader } = await import(pathToFileURL(path.join(temporary, 'asset-manager.mjs')));
  const { createExplosionOffsets, explosionTarget } = await import(pathToFileURL(path.join(temporary, 'explosion.mjs')));
  const bounds = [[-.5, 0, -.2], [.5, 2, .2]];
  const node = (id, parentId, kind, box, children = []) => ({ id, parentId, kind, children, bounds: box,
    regionId: kind === 'region' ? id : 'skull', systemId: 'skeletal', meshNames: [], assetIds: ['a'], name: id, anatomicalName: id, aliases: [], relatedIds: [] });
  const catalog = { frame: { bounds }, nodes: [node('skeleton', undefined, 'system', bounds, ['skull']),
    node('skull', 'skeleton', 'region', [[-.1, 1.7, -.1], [.1, 2, .1]], ['frontal', 'occipital']),
    node('frontal', 'skull', 'structure', [[-.08, 1.85, .03], [.08, 1.98, .1]]),
    node('occipital', 'skull', 'structure', [[-.08, 1.77, -.1], [.08, 1.9, -.03]])],
    assets: ['a', 'b', 'c', 'd'].map(id => ({ id, systemId: 'skeletal', bounds })) };
  const offsets = createExplosionOffsets(catalog, new Set(['skeletal']));
  for (const node of catalog.nodes) {
    assert.deepEqual(explosionTarget(offsets.get(node.id), 'systems', 1), [0, 0, 0], 'one system must not drift');
    for (const level of ['systems', 'regions', 'structures']) {
      assert.deepEqual(explosionTarget(offsets.get(node.id), level, 0), [0, 0, 0], 'zero restores exact original pose');
      const target = explosionTarget(offsets.get(node.id), level, 1);
      assert.ok(target.every(Number.isFinite));
      assert.ok(Math.hypot(...target) <= 2 * (.16 + .18 + .115) + 1e-9, 'explosion remains within the registered body bound');
    }
  }
  const frontal = explosionTarget(offsets.get('frontal'), 'structures', 1), occipital = explosionTarget(offsets.get('occipital'), 'structures', 1);
  assert.ok(frontal[2] > occipital[2], 'anterior/posterior relationship is preserved');
  assert.deepEqual(explosionTarget(offsets.get('frontal'), 'regions', 1), explosionTarget(offsets.get('occipital'), 'regions', 1), 'region components move together');
  assert.deepEqual(explosionTarget(offsets.get('frontal'), 'structures', NaN), [0, 0, 0]);

  const buffer = new Float32Array(18);
  const geometry = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(buffer.subarray(0, 9), 3)).setAttribute('normal', new THREE.BufferAttribute(buffer.subarray(9), 3));
  assert.equal(geometryMemoryBytes([geometry, geometry]), buffer.byteLength, 'shared geometry/attributes counted once');
  geometry.dispose();

  const jobs = [], released = new Map(); let concurrent = 0, maximum = 0;
  const manager = new AtlasAssetManager(catalog, (asset, signal) => new Promise((resolve, reject) => {
    concurrent += 1; maximum = Math.max(maximum, concurrent);
    jobs.push({ id: asset.id, signal, finish() {
      concurrent -= 1;
      resolve({ asset, dispose() { released.set(asset.id, (released.get(asset.id) ?? 0) + 1); } });
    }, fail() { concurrent -= 1; reject(new Error('expected transport failure')); } });
  }));
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));
  manager.setDesired(['a', 'b', 'c']);
  assert.deepEqual(jobs.map(job => job.id), ['a', 'b']);
  jobs[0].finish(); await flush();
  assert.deepEqual(jobs.map(job => job.id), ['a', 'b', 'c']);
  const retained = manager.snapshot().resources[0];
  manager.setDesired(['a', 'c', 'd']);
  assert.equal(jobs[1].signal.aborted, true, 'disabled downloading region is cancelled');
  assert.equal(manager.snapshot().resources[0], retained, 'loaded region stays owned while other layers change');
  jobs[1].finish(); await flush();
  assert.equal(released.get('b'), 1, 'late decoder result after cancellation is disposed once');
  assert.deepEqual(jobs.map(job => job.id), ['a', 'b', 'c', 'd']);
  assert.equal(maximum, 2, 'decoding and transfer share a two-job concurrency bound');
  jobs[2].finish(); jobs[3].fail(); await flush();
  assert.equal(manager.snapshot().statuses.find(status => status.id === 'd').state, 'error');
  manager.retry('d'); assert.equal(jobs.length, 5);
  jobs[4].finish(); await flush();
  assert.equal(manager.snapshot().resources.length, 3);
  manager.setDesired(['c']);
  assert.equal(released.get('a'), 1); assert.equal(released.get('d'), 1);
  assert.deepEqual(manager.snapshot().resources.map(resource => resource.asset.id), ['c'], 'no decoded unbounded cache');
  manager.dispose(); manager.dispose();
  assert.equal(released.get('c'), 1, 'resource teardown is idempotent');
  assert.equal(manager.snapshot().resources.length, 0);
  console.log('Atlas renderer: bounded concurrency, cancellation, retained ownership, retry, memory accounting and hierarchical explosion passed.');

  // Parse the actual optimized GLBs with the browser's loader/decoder, replacing
  // only HTTP transport. This catches mesh-name, frame and ownership mismatches.
  const realCatalog = JSON.parse(await readFile(path.join(project, 'public/models/anatomy/skeletal/catalog.json'), 'utf8'));
  const previousFetch = globalThis.fetch, previousWindow = globalThis.window;
  let meshes = 0, triangles = 0, geometryBytes = 0, decodingMs = 0;
  try {
    globalThis.window = {location:{origin:'http://localhost'}};
    globalThis.fetch = async url => {
      const data = await readFile(path.join(project, 'public', new URL(url).pathname.replace(/^\/med3d\//, '')));
      return new Response(data, {headers:{'content-length':String(data.length)}});
    };
    const realLoader = createAssetLoader(realCatalog);
    for (const asset of realCatalog.assets) {
      const resource = await realLoader(asset, new AbortController().signal, () => {});
      assert.equal(resource.parts.length, asset.meshCount); assert.equal(resource.triangles, asset.triangles);
      resource.parts.forEach(part => {
        assert.ok(part.node.meshNames.includes(part.mesh.name)); assert.ok(part.ancestors.has(part.node.id));
        assert.ok(part.baseBounds.min.toArray().every(Number.isFinite));
      });
      meshes += resource.parts.length; triangles += resource.triangles; geometryBytes += resource.geometryBytes; decodingMs += resource.loadMs;
      let disposals = 0;
      resource.geometries.forEach(geometry => geometry.addEventListener('dispose', () => { disposals += 1; }));
      resource.dispose(); resource.dispose();
      assert.equal(disposals, resource.geometries.size, 'every owned geometry is disposed exactly once');
    }
    assert.equal(meshes, realCatalog.coverage.meshes);
    assert.equal(triangles, realCatalog.assets.reduce((sum, asset) => sum + asset.triangles, 0));
    console.log('Real GLB renderer parsing:', JSON.stringify({meshes, triangles, geometryBytes, localTransportAndDecodeMs:Math.round(decodingMs)}));
  } finally { globalThis.fetch = previousFetch; if(previousWindow === undefined)delete globalThis.window; else globalThis.window = previousWindow; }
} finally { await rm(temporary, { recursive: true, force: true }); }
