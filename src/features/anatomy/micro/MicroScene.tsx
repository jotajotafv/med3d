import {useEffect, useRef, useState, type ComponentRef} from 'react';
import {Canvas, useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
import SceneBoundary from '../SceneBoundary';
import {parseSwc, swcSegments} from './swc';
import type {EducationalMicroModule} from './registry';

type Resource = {object: THREE.Object3D; bounds: THREE.Box3; bytes: number; points?: number; edges?: number; loadedMs: number};
declare global {interface Window {__med3dMicroQa?: {id: string; bytes: number; points?: number; edges?: number; loadedMs: number; meshes: number; triangles: number; drawCalls: number; geometryBytes: number; disposed: boolean; cpuRenderMs?: number; frameTimes?: number[]}}}

function dispose(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  object.traverse(child => {
    const part = child as THREE.Mesh;
    if (part.geometry) geometries.add(part.geometry);
    if (part.material) for (const material of Array.isArray(part.material) ? part.material : [part.material]) materials.add(material);
  });
  for (const material of materials) for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
  geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose()); textures.forEach(texture => texture.dispose());
}

async function load(module: EducationalMicroModule, signal: AbortSignal): Promise<Resource> {
  const started = performance.now();
  const response = await fetch(import.meta.env.BASE_URL + module.path, {signal});
  if (!response.ok) throw new Error('No se pudo cargar esta microanatomía.');
  const data = await response.arrayBuffer();
  let object: THREE.Object3D, points: number | undefined, edges: number | undefined;
  if (module.format === 'swc') {
    const tracing = parseSwc(new TextDecoder().decode(data));
    const segments = swcSegments(tracing); points = tracing.length; edges = segments.length;
    const positions: number[] = [], colors: number[] = [];
    for (const segment of segments) {
      const color = new THREE.Color(segment.to.type === 2 ? '#8dd7ed' : '#d8b6e8');
      for (const point of [segment.from, segment.to]) {positions.push(point.x, point.y, point.z); colors.push(color.r, color.g, color.b);}
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const group = new THREE.Group();
    group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({vertexColors: true})));
    const root = tracing.find(point => point.parent === -1)!;
    const soma = new THREE.BufferGeometry(); soma.setAttribute('position', new THREE.Float32BufferAttribute([root.x, root.y, root.z], 3));
    group.add(new THREE.Points(soma, new THREE.PointsMaterial({color: '#f1dca0', size: 7, sizeAttenuation: false})));
    object = group;
  } else {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    object = (await loader.parseAsync(data, '')).scene;
  }
  return {object, bounds: new THREE.Box3().setFromObject(object), bytes: data.byteLength, points, edges, loadedMs: performance.now() - started};
}

function Model({resource, reset}: {resource: Resource; reset: number}) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const {camera, size, invalidate, gl} = useThree();
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('qa')) return;
    const render = gl.render;
    gl.render = function (...args) {
      const started = performance.now(); render.apply(this, args);
      const qa = window.__med3dMicroQa;
      if (qa && !qa.disposed) {qa.cpuRenderMs = performance.now() - started; qa.drawCalls = gl.info.render.calls; if ((qa.frameTimes?.length || 0) < 240) (qa.frameTimes ??= []).push(started);}
    };
    return () => {gl.render = render;};
  }, [gl]);
  useEffect(() => {
    const center = resource.bounds.getCenter(new THREE.Vector3());
    const radius = resource.bounds.getSize(new THREE.Vector3()).length() / 2;
    const perspective = camera as THREE.PerspectiveCamera;
    const angle = Math.min(perspective.fov * Math.PI / 360, Math.atan(Math.tan(perspective.fov * Math.PI / 360) * size.width / size.height));
    const distance = radius / Math.sin(angle) * 1.1;
    perspective.near = Math.max(radius / 10000, .000001); perspective.far = distance + radius * 100;
    perspective.position.copy(center).add(new THREE.Vector3(0, 0, distance)); perspective.lookAt(center); perspective.updateProjectionMatrix();
    controls.current?.target.copy(center); controls.current?.update(); invalidate();
  }, [resource, reset, size.width, size.height, camera, invalidate, gl]);
  return <><primitive object={resource.object} dispose={null}/><ambientLight intensity={1.6}/><directionalLight position={[5, 8, 10]} intensity={2.2}/><OrbitControls ref={controls} makeDefault enableDamping={false}/></>;
}

export default function MicroScene({module}: {module: EducationalMicroModule}) {
  const [resource, setResource] = useState<Resource | null>(null), [error, setError] = useState(''), [retry, setRetry] = useState(0), [reset, setReset] = useState(0);
  useEffect(() => {
    const abort = new AbortController(); let owned: Resource | null = null;
    setResource(null); setError('');
    load(module, abort.signal).then(value => {
      if (abort.signal.aborted) {dispose(value.object); return;}
      owned = value; setResource(value);
      if (new URLSearchParams(location.search).has('qa')) {
        let meshes = 0, triangles = 0, geometryBytes = 0;
        value.object.traverse(child => {const part = child as THREE.Mesh; if (part.isMesh) {meshes++; triangles += (part.geometry.index?.count || part.geometry.getAttribute('position').count) / 3;} if (part.geometry) {for (const attribute of Object.values(part.geometry.attributes)) geometryBytes += attribute.array.byteLength; geometryBytes += part.geometry.index?.array.byteLength || 0;}});
        window.__med3dMicroQa = {id: module.id, bytes: value.bytes, points: value.points, edges: value.edges, loadedMs: value.loadedMs, meshes, triangles, geometryBytes, drawCalls: 0, disposed: false};
      }
    }).catch(reason => {if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo abrir esta microanatomía.');});
    return () => {abort.abort(); if (owned) dispose(owned.object); if (window.__med3dMicroQa?.id === module.id) window.__med3dMicroQa.disposed = true;};
  }, [module, retry]);
  return <>
    {error ? <div className="micro-load" role="alert"><p>{error}</p><button onClick={() => setRetry(value => value + 1)}>Reintentar microanatomía</button></div> : !resource ? <p className="micro-load" role="status">Cargando microanatomía…</p> : <SceneBoundary><Canvas frameloop="demand" dpr={[1, 1.5]} camera={{fov: 42}} aria-label={'Vista tridimensional de ' + module.title}><Model resource={resource} reset={reset}/></Canvas></SceneBoundary>}
    {resource && <button className="micro-reset" onClick={() => setReset(value => value + 1)}>Restablecer vista</button>}
  </>;
}
