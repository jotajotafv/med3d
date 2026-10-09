import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SceneBoundary from '../../anatomy/SceneBoundary';
import type { GestureController } from '../gestures';
import type { AtlasAssetsSnapshot } from './assets';
import type { AtlasState } from './state';
import { XrAtlasPresentation, type AtlasPicker } from './presentation';

type Props = { assets: AtlasAssetsSnapshot; state: AtlasState; gestures: GestureController;
  pickRef: RefObject<AtlasPicker | null>; onSelect: (id: string | null) => void };
declare global { interface Window { __med3dXrAtlas?: () => unknown } }

function AtlasContents({ assets, state, gestures, pickRef, onSelect }: Props) {
  const { camera, gl, scene, size } = useThree();
  const root = useRef<THREE.Group>(null);
  const presentation = useMemo(() => new XrAtlasPresentation(), []);
  const latest = useRef({ assets, state }); latest.current = { assets, state };
  const timings = useRef<Record<string, { firstGeometryMs?: number; completeMs?: number }>>({});
  const metrics = useRef({ drawCalls: 0, frameIntervalMs: 0, renderCpuMs: 0 });
  const transform = useMemo(() => {
    const bounds = assets.catalog!.frame.bounds;
    const box = new THREE.Box3(new THREE.Vector3(...bounds[0]), new THREE.Vector3(...bounds[1]));
    const scale = 3.45 / Math.max(...box.getSize(new THREE.Vector3()).toArray());
    return { scale, position: box.getCenter(new THREE.Vector3()).multiplyScalar(-scale) };
  }, [assets.catalog]);
  useLayoutEffect(() => {
    presentation.add(assets.resources); presentation.apply(state, assets.catalog!);
  }, [presentation, assets.resources, assets.catalog, state]);
  useEffect(() => () => presentation.dispose(), [presentation]);
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.set(0, 0, 6.8 / Math.min(1, size.width / Math.max(1, size.height)));
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const picker: AtlasPicker = { rect: () => gl.domElement.getBoundingClientRect(),
      hitTest: point => root.current ? presentation.pick(point, gl.domElement.getBoundingClientRect(), camera, root.current, raycaster) : { kind: 'empty' },
      select: result => { if (presentation.accepts(result)) onSelect(result.kind === 'selected' ? result.selection.id : null); },
    };
    pickRef.current = picker; return () => { if (pickRef.current === picker) pickRef.current = null; };
  }, [camera, gl, presentation, pickRef, onSelect]);
  useFrame((_, dt) => {
    if (!root.current) return;
    const alpha = 1 - Math.exp(-Math.min(dt, .1) / .055), target = gestures.target;
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, target.rotationX, alpha);
    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, target.rotationY, alpha);
    root.current.scale.setScalar(THREE.MathUtils.lerp(root.current.scale.x, target.scale, alpha));
  });
  useEffect(() => {
    // Read-only QA measurements, never landmarks or user/session persistence.
    if (new URLSearchParams(window.location.search).get('xrQa') !== '1') return;
    const before = scene.onBeforeRender, after = scene.onAfterRender;
    let started = 0, previous = 0;
    const intervals: number[] = [], renderTimes: number[] = [];
    scene.onBeforeRender = function (...args) { before.apply(this, args); started = performance.now(); };
    scene.onAfterRender = function (...args) {
      after.apply(this, args); const now = performance.now();
      if (previous) intervals.push(now - previous); previous = now;
      renderTimes.push(now - started); if (intervals.length > 60) intervals.shift(); if (renderTimes.length > 60) renderTimes.shift();
      metrics.current = { drawCalls: gl.info.render.calls,
        frameIntervalMs: intervals.reduce((a, b) => a + b, 0) / Math.max(1, intervals.length),
        renderCpuMs: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length };
      for (const [system, load] of Object.entries(latest.current.assets.systems)) {
        if (!load) continue;
        const timing = timings.current[system] ||= {};
        if (timing.firstGeometryMs === undefined && presentation.parts.some(part => part.node.systemId === system && part.mesh.visible)) timing.firstGeometryMs = now - load.startedAt;
        if (timing.completeMs === undefined && load.total && load.ready === load.total) timing.completeMs = now - load.startedAt;
      }
    };
    const inspect = () => {
      scene.updateMatrixWorld(true);
      return { ...metrics.current, sceneId: scene.uuid, timings: timings.current, state: latest.current.state,
        modules: latest.current.assets.resources.map(resource => resource.asset.id),
        bytes: latest.current.assets.resources.reduce((sum, resource) => sum + resource.asset.bytes, 0),
        triangles: latest.current.assets.resources.reduce((sum, resource) => sum + resource.triangles, 0),
        geometryBytes: latest.current.assets.resources.reduce((sum, resource) => sum + resource.geometryBytes, 0),
        visibleMeshes: presentation.visibleMeshes.length, meshes: presentation.parts.length,
        materials: presentation.materialCount, geometries: gl.info.memory.geometries,
        root: { rotation: root.current?.rotation.toArray(), scale: root.current?.scale.x },
        parts: presentation.parts.map(part => {
          const positions = part.mesh.geometry.getAttribute('position'), indices = part.mesh.geometry.index;
          const screenSamples = [part.baseBounds.getCenter(new THREE.Vector3()).add(part.offset).applyMatrix4(part.mesh.parent!.matrixWorld).project(camera).toArray()];
          if (indices) for (let i = 0; i < 10; i++) {
            const first = Math.floor(i * (indices.count / 3 - 1) / 9) * 3, point = new THREE.Vector3();
            for (let corner = 0; corner < 3; corner++) point.add(new THREE.Vector3().fromBufferAttribute(positions, indices.getX(first + corner)));
            screenSamples.push(point.multiplyScalar(1 / 3).applyMatrix4(part.mesh.matrixWorld).project(camera).toArray());
          }
          return { id: part.node.id, name: part.node.name, system: part.node.systemId, visible: part.mesh.visible,
            opacity: part.mesh.material.opacity, transparent: part.mesh.material.transparent, depthWrite: part.mesh.material.depthWrite,
            position: part.mesh.position.toArray(), basePosition: part.basePosition.toArray(), offset: part.offset.toArray(), screenSamples };
        }),
      };
    };
    window.__med3dXrAtlas = inspect;
    return () => { scene.onBeforeRender = before; scene.onAfterRender = after; if (window.__med3dXrAtlas === inspect) delete window.__med3dXrAtlas; };
  }, [scene, gl, camera, presentation]);
  return <group ref={root} name="xrAtlasRoot"><group position={transform.position} scale={transform.scale} dispose={null}>
    {assets.resources.map(resource => <primitive key={resource.asset.id} object={resource.group} dispose={null}/>)}
  </group></group>;
}

export default function XrAtlasScene(props: Props) {
  return <div className="xr-scene" data-model-status={props.assets.resources.length ? 'ready' : 'loading'}>
    <SceneBoundary resetKey="xr-atlas"><Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 6.8], fov: 38, near: .01, far: 80 }} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={.9}/><hemisphereLight color="#fff5e9" groundColor="#53686b" intensity={.6}/>
      <directionalLight position={[4, 5, 6]} intensity={2.2}/><directionalLight position={[-4, 1, 2]} color="#c4e5e5" intensity={1.2}/>
      <directionalLight position={[0, 3, -5]} intensity={1.4}/>
      <AtlasContents {...props}/>
    </Canvas></SceneBoundary>
  </div>;
}
