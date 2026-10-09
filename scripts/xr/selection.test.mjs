import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import ts from 'typescript';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PointerIntent } from '../../src/features/xr/pointerIntent.ts';

// Compile the actual adapters and existing data for Node, without changing production sources.
const directory = path.resolve('.cache/xr-selection-tests'); await mkdir(directory, { recursive: true });
for (const relative of ['xr/selection.ts', 'xr/selection-data.ts', 'xr/XrEducationCard.tsx', 'anatomy/data.ts', 'anatomy/model-index.ts', 'anatomy/education.ts']) {
  const source = await readFile(path.resolve('src/features', relative), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
  const output = compiled.outputText.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (_, quote, specifier) => `from ${quote}./${path.basename(specifier)}.mjs${quote}`);
  await writeFile(path.join(directory, path.basename(relative).replace(/\.tsx?$/, '.mjs')), output);
}
const { indexHeartMeshes, pickHeart, highlightHeartMesh } = await import(pathToFileURL(path.join(directory, 'selection.mjs')));
const { heartEducationForMesh, HEART_PROVENANCE } = await import(pathToFileURL(path.join(directory, 'selection-data.mjs')));
const { default: XrEducationCard } = await import(pathToFileURL(path.join(directory, 'XrEducationCard.mjs')));
const bytes = await readFile('public/models/heart.glb');
const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const realIndex = indexHeartMeshes(gltf.scene);

test('click and short touch tap are selection candidates, including sub-threshold jitter', () => {
  for (const id of [1, 101]) {
    const intent = new PointerIntent(); intent.begin(id, { x: 20, y: 30 }, 100);
    assert.equal(intent.move(id, { x: 23, y: 32 }), false);
    assert.equal(intent.finish(id, { x: 23, y: 32 }, 250), true);
    assert.equal(intent.finish(id, { x: 23, y: 32 }, 251), false);
  }
});
test('drag cannot select even after returning to its origin; final displacement is checked', () => {
  const intent = new PointerIntent(); intent.begin(1, { x: 0, y: 0 }, 100);
  assert.equal(intent.move(1, { x: 7, y: 0 }), true);
  assert.equal(intent.finish(1, { x: 0, y: 0 }, 200), false);
  intent.begin(1, { x: 0, y: 0 }, 300);
  assert.equal(intent.finish(1, { x: 0, y: 8 }, 400), false);
});
test('long press, multi-finger gesture, cancellation and wrong pointer cannot select', () => {
  const intent = new PointerIntent(); intent.begin(1, { x: 0, y: 0 }, 100);
  assert.equal(intent.finish(1, { x: 0, y: 0 }, 600), false);
  intent.begin(1, { x: 0, y: 0 }, 700); intent.begin(2, { x: 0, y: 0 }, 710);
  assert.equal(intent.finish(1, { x: 0, y: 0 }, 750), false);
  intent.begin(2, { x: 0, y: 0 }, 800); assert.equal(intent.finish(1, { x: 0, y: 0 }, 810), false);
  intent.cancel(); assert.equal(intent.finish(2, { x: 0, y: 0 }, 850), false);
});
test('actual unchanged GLB has 14 identified selectable meshes, 9 lessons and 5 partial records', () => {
  assert.equal(realIndex.meshes.length, 14); assert.equal(realIndex.byMesh.size, 14);
  assert.equal([...realIndex.byMesh.values()].filter(value => value.lesson).length, 9);
  for (const [mesh, selection] of realIndex.byMesh) {
    assert.equal(selection.id, mesh.name); assert.equal(selection.mesh, mesh);
    assert.equal(selection.structure, heartEducationForMesh(mesh.name).structure);
  }
  const right = heartEducationForMesh('VH_M_heart_right_ventricle');
  assert.equal(right.structure.title, 'Ventrículo derecho'); assert.equal(right.structure.latin, 'Ventriculus dexter');
  assert.equal(right.lesson.source, 'https://www.nhlbi.nih.gov/health/heart/blood-flow');
  assert.equal(HEART_PROVENANCE.license, 'CC BY 4.0');
});
test('unknown mesh and non-mesh parent never fall back to a whole-heart lesson', () => {
  assert.equal(heartEducationForMesh('unknown'), null); assert.equal(heartEducationForMesh('VH_M_heart'), null);
  const papillary = heartEducationForMesh('VH_M_papillary_muscle_of_heart_anterior');
  assert.equal(papillary.lesson, undefined); assert.equal(papillary.structure.latin, undefined);
});
test('raycast uses current parent rotation, scale, camera and offset canvas rect; empty tap clears', () => {
  const scene = new THREE.Group(), model = new THREE.Group(); scene.add(model);
  const a = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.45), new THREE.MeshStandardMaterial());
  a.name = 'VH_M_heart_right_ventricle'; a.position.x = -0.7;
  const b = new THREE.Mesh(a.geometry, a.material); b.name = 'VH_M_heart_left_ventricle'; b.position.x = 0.7;
  model.add(a, b); const index = indexHeartMeshes(scene), ray = new THREE.Raycaster();
  const rect = { left: 57, top: 120, width: 700, height: 500 };
  const camera = new THREE.PerspectiveCamera(38, rect.width / rect.height, 0.1, 100); camera.position.set(0.1, 0.2, 6); camera.lookAt(0, 0, 0);
  const project = mesh => { scene.updateMatrixWorld(true); camera.updateMatrixWorld(); const p = mesh.getWorldPosition(new THREE.Vector3()).project(camera);
    return { x: rect.left + (p.x + 1) * rect.width / 2, y: rect.top + (1 - p.y) * rect.height / 2 }; };
  for (const [angle, scale] of [[0, 1], [0.8, 1.65], [-0.65, 0.6]]) {
    model.rotation.set(0.25, angle, 0); model.scale.setScalar(scale);
    assert.equal(pickHeart(project(a), rect, camera, scene, index, ray).selection.mesh, a);
    assert.equal(pickHeart(project(b), rect, camera, scene, index, ray).selection.mesh, b);
    assert.equal(pickHeart({ x: 60, y: 123 }, rect, camera, scene, index, ray).kind, 'empty');
  }
  b.name = 'unmapped'; const unknownIndex = indexHeartMeshes(scene);
  assert.equal(pickHeart(project(b), rect, camera, scene, unknownIndex, ray).kind, 'unknown');
  b.visible = false; assert.equal(pickHeart(project(b), rect, camera, scene, unknownIndex, ray).kind, 'empty');
  a.geometry.dispose(); a.material.dispose();
});
test('A → B highlight restores exact shared materials; geometry/transforms stay identical and clones dispose once', () => {
  const [a, b] = realIndex.meshes, originalA = a.material, originalB = b.material;
  const geometry = a.geometry, matrix = a.matrix.toArray(), originalJson = originalA.toJSON();
  const restoreA = highlightHeartMesh(a); const cloneA = a.material; let disposedA = 0;
  cloneA.addEventListener('dispose', () => disposedA++);
  assert.notEqual(cloneA, originalA); assert.equal(b.material, originalB);
  restoreA(); const restoreB = highlightHeartMesh(b);
  assert.equal(a.material, originalA); assert.notEqual(b.material, originalB);
  restoreA(); restoreB(); assert.equal(disposedA, 1); assert.equal(b.material, originalB);
  assert.equal(a.geometry, geometry); assert.deepEqual(a.matrix.toArray(), matrix); assert.deepEqual(originalA.toJSON(), originalJson);
});
test('card renders existing educational fields only, no source IDs or invented papillary lesson', () => {
  const selection = [...realIndex.byMesh.values()].find(s => s.id === 'VH_M_heart_right_ventricle');
  const html = renderToStaticMarkup(createElement(XrEducationCard, { selection, unknown: false, onClose() {} }));
  assert.ok(html.includes('Ventriculus dexter')); assert.ok(html.includes(selection.lesson.description));
  assert.ok(html.includes('Relaciones anatómicas')); assert.ok(html.includes('CC BY 4.0')); assert.ok(!html.replace(/<[^>]*>/g, '').includes('VH_M_'));
  const partial = [...realIndex.byMesh.values()].find(s => !s.lesson);
  const partialHtml = renderToStaticMarkup(createElement(XrEducationCard, { selection: partial, unknown: false, onClose() {} }));
  for (const missing of ['Descripción', 'Función', 'Relaciones anatómicas', 'Región']) assert.ok(!partialHtml.includes(missing));
  assert.ok(partialHtml.includes(partial.structure.title)); assert.ok(!partialHtml.replace(/<[^>]*>/g, '').includes('VH_M_'));
});
