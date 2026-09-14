import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import SceneBoundary from '../SceneBoundary';
import { AtlasAssetManager, type AssetSnapshot, type AtlasPart, type AtlasResource } from './asset-manager';
import { createExplosionOffsets, explosionTarget } from './explosion';
import { ANATOMICAL_VIEWS, fitCameraBounds } from './camera-framing';
import type { AnatomyCatalog, AtlasAnatomicalView, AtlasSceneProps, Bounds, SystemId } from './types';

type Controls = ComponentRef<typeof OrbitControls>;
type MaterialVariants = { base: THREE.MeshStandardMaterial; selected: THREE.MeshStandardMaterial; hover: THREE.MeshStandardMaterial };
type LoadTiming = { startedAt: number; initialAssets: string[]; firstGeometryMs?: number; fullSystemMs?: number };
function useReducedMotionPreference() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)'), change = () => setReduced(query.matches);
    query.addEventListener('change', change); return () => query.removeEventListener('change', change);
  }, []);
  return reduced;
}
const SYSTEM_COLORS: Record<SystemId, string> = {
  skeletal: '#d7c6a1', integumentary: '#cdb3a0', muscular: '#b67070', nervous: '#d7c487',
  cardiovascular: '#ba7770', respiratory: '#caa1a1', digestive: '#c49f8c', urinary: '#af8175',
  endocrine: '#bba287', lymphatic: '#94b29a', reproductive: '#b9969a',
};
const boxFrom = (bounds: Bounds) => new THREE.Box3(new THREE.Vector3(...bounds[0]), new THREE.Vector3(...bounds[1]));
function frameTransform(catalog: AnatomyCatalog) {
  const bounds = boxFrom(catalog.frame.bounds), centre = bounds.getCenter(new THREE.Vector3()), size = bounds.getSize(new THREE.Vector3());
  const scale = 3.45 / Math.max(size.x, size.y, size.z, .001);
  return { scale, position: centre.multiplyScalar(-scale) };
}
function useAssets(catalog: AnatomyCatalog, assetIds: string[], reset: number) {
  const manager = useRef<AtlasAssetManager | null>(null);
  const desired = useRef(assetIds); desired.current = assetIds;
  const loadTiming = useRef<LoadTiming>({ startedAt: 0, initialAssets: [] });
  const [snapshot, setSnapshot] = useState<AssetSnapshot>({ resources: [], statuses: [] });
  useEffect(() => {
    performance.clearMarks('med3d:load-start'); performance.clearMarks('med3d:first-geometry'); performance.clearMarks('med3d:all-assets-rendered');
    loadTiming.current = { startedAt: performance.mark('med3d:load-start').startTime, initialAssets: [...desired.current] };
    const next = new AtlasAssetManager(catalog); manager.current = next;
    const unsubscribe = next.subscribe(value => setSnapshot(previous => ({ ...value,
      resources: value.resources.length === previous.resources.length && value.resources.every((resource, index) => resource === previous.resources[index]) ? previous.resources : value.resources,
    })));
    next.setDesired(desired.current);
    return () => { unsubscribe(); next.dispose(); if (manager.current === next) manager.current = null; };
  }, [catalog, reset]);
  const assetKey = assetIds.join('|');
  useEffect(() => { manager.current?.setDesired(desired.current); }, [assetKey]);
  return { ...snapshot, loadTiming, retry: (id?: string) => manager.current?.retry(id) };
}
function useMaterials(catalog: AnatomyCatalog) {
  const materials = useMemo(() => new Map<SystemId, MaterialVariants>([...new Set(catalog.assets.map(asset => asset.systemId))].map(system => {
    const options = { color: SYSTEM_COLORS[system], roughness: .78, metalness: .015, side: THREE.DoubleSide };
    return [system, {
      base: new THREE.MeshStandardMaterial(options),
      selected: new THREE.MeshStandardMaterial({ ...options, color: '#36bcb1', emissive: '#36bcb1', emissiveIntensity: .16 }),
      hover: new THREE.MeshStandardMaterial({ ...options, emissive: SYSTEM_COLORS[system], emissiveIntensity: .15 }),
    }];
  })), [catalog]);
  useEffect(() => () => { materials.forEach(variants => Object.values(variants).forEach(material => material.dispose())); }, [materials]);
  return materials;
}
type ModelProps = AtlasSceneProps & { resources: AtlasResource[]; parts: AtlasPart[] };
function Models(props: ModelProps) {
  const { catalog, resources, parts, selected, isolated, hidden, opacityBySystem, explodeLevel, exploded, onSelect } = props;
  const { invalidate, gl } = useThree();
  const [hovered, setHovered] = useState<string | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const materials = useMaterials(catalog), transform = useMemo(() => frameTransform(catalog), [catalog]);
  const activeSystems = useMemo(() => new Set(props.assetIds.flatMap(id => catalog.assets.find(asset => asset.id === id)?.systemId ? [catalog.assets.find(asset => asset.id === id)!.systemId] : [])), [catalog, props.assetIds.join('|')]);
  const offsets = useMemo(() => createExplosionOffsets(catalog, activeSystems), [catalog, activeSystems]);
  useEffect(() => {
    const hiddenIds = new Set(hidden);
    materials.forEach((variants, system) => {
      const supplied = opacityBySystem[system] ?? 1;
      const opacity = Number.isFinite(supplied) ? Math.max(.1, Math.min(1, supplied)) : 1;
      Object.values(variants).forEach(material => {
        const transparent = opacity < .999, changed = material.transparent !== transparent;
        material.opacity = opacity; material.transparent = transparent; material.depthWrite = !transparent;
        if (changed) material.needsUpdate = true;
      });
    });
    parts.forEach(part => {
      part.mesh.visible = ![...part.ancestors].some(id => hiddenIds.has(id)) && (!isolated || part.ancestors.has(isolated));
      const variants = materials.get(part.node.systemId)!;
      part.mesh.material = selected && part.ancestors.has(selected) ? variants.selected : part.node.id === hovered ? variants.hover : variants.base;
      part.mesh.renderOrder = (opacityBySystem[part.node.systemId] ?? 1) < .999 ? 1 : 0;
    });
    invalidate();
  }, [parts, selected, isolated, hidden.join('|'), opacityBySystem, hovered, materials, invalidate]);
  useEffect(() => {
    parts.forEach(part => { part.targetOffset.set(...explosionTarget(offsets.get(part.node.id), explodeLevel, exploded)); });
    invalidate();
  }, [parts, offsets, explodeLevel, exploded, invalidate]);
  useFrame((_, delta) => {
    let moving = false;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-11 * Math.min(delta, .05));
    parts.forEach(part => {
      if (part.offset.equals(part.targetOffset)) return;
      part.offset.lerp(part.targetOffset, alpha);
      if (part.offset.distanceToSquared(part.targetOffset) < 1e-10) part.offset.copy(part.targetOffset);
      else moving = true;
      // At zero, copy the original transform exactly (no accumulating translations).
      part.mesh.position.copy(part.basePosition).add(part.offset);
    });
    if (moving) invalidate();
  });
  useEffect(() => () => { gl.domElement.style.cursor = 'grab'; }, [gl]);
  const pointer = (event: ThreeEvent<PointerEvent>, entering: boolean) => {
    event.stopPropagation(); const id = event.object.userData.anatomyNodeId;
    setHovered(entering && typeof id === 'string' ? id : null); gl.domElement.style.cursor = entering ? 'pointer' : 'grab';
  };
  return <group position={transform.position} scale={transform.scale} dispose={null}>
    {resources.map(resource => <primitive key={resource.asset.id} object={resource.group} dispose={null}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation(); const id = event.object.userData.anatomyNodeId;
        if (event.delta < 5 && typeof id === 'string') onSelect(id);
      }}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => pointer(event, true)}
      onPointerOut={(event: ThreeEvent<PointerEvent>) => pointer(event, false)} />)}
  </group>;
}
function CameraRig({ catalog, parts, cameraRequest, resources, exploded, explodeLevel, assetIds, selected }: Pick<ModelProps, 'catalog' | 'parts' | 'cameraRequest' | 'resources' | 'exploded' | 'explodeLevel' | 'assetIds' | 'selected'>) {
  const controls = useRef<Controls>(null), { camera, invalidate, size } = useThree();
  const destination = useRef<ReturnType<typeof fitCameraBounds> | null>(null);
  const pending = useRef<AtlasSceneProps['cameraRequest'] | null>(null), handledVersion = useRef(-1);
  const focused = useRef<string | null>(null), lastCatalog = useRef<AnatomyCatalog | null>(null);
  const reducedMotion = useReducedMotionPreference();
  const transform = useMemo(() => frameTransform(catalog), [catalog]);
  const current = useRef({ catalog, parts, resources, exploded, explodeLevel, assetIds });
  current.current = { catalog, parts, resources, exploded, explodeLevel, assetIds };
  const frame = useCallback((id?: string | null, view?: AtlasAnatomicalView): boolean => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return false;
    const box = new THREE.Box3(), state = current.current;
    if (id) {
      const node = state.catalog.nodes.find(node => node.id === id);
      if (!node) return true;
      const requestedAssets = node.assetIds.filter(asset => state.assetIds.includes(asset));
      // Preserve the request until every requested region of this target is decoded.
      if (!requestedAssets.length || requestedAssets.some(asset => !state.resources.some(resource => resource.asset.id === asset))) return false;
      state.parts.forEach(part => {
        if (!part.ancestors.has(id) || !part.mesh.visible) return;
        // Use the destination bounds while separation is still interpolating.
        box.union(part.baseBounds.clone().translate(part.targetOffset));
      });
      if (box.isEmpty()) return false;
    } else {
      box.copy(boxFrom(catalog.frame.bounds));
      if (state.exploded > 0) {
        const wanted = new Set(state.assetIds), activeSystems = new Set(state.catalog.assets.filter(asset => wanted.has(asset.id)).map(asset => asset.systemId));
        const offsets = createExplosionOffsets(state.catalog, activeSystems);
        state.catalog.nodes.forEach(node => {
          if (node.bounds && node.meshNames.length && node.assetIds.some(id => wanted.has(id))) {
            box.union(boxFrom(node.bounds).translate(new THREE.Vector3(...explosionTarget(offsets.get(node.id), state.explodeLevel, state.exploded))));
          }
        });
      }
    }
    box.min.multiplyScalar(transform.scale).add(transform.position); box.max.multiplyScalar(transform.scale).add(transform.position);
    const direction = view ? ANATOMICAL_VIEWS[view].direction : camera.position.clone().sub(controls.current?.target ?? new THREE.Vector3());
    const up = view ? ANATOMICAL_VIEWS[view].up : camera.up;
    const goal = fitCameraBounds(box, camera.fov, size.width / Math.max(size.height, 1), direction, up);
    camera.near = goal.near; camera.far = Math.max(80, goal.distance * 2); camera.updateProjectionMatrix();
    if (controls.current) { controls.current.minDistance = goal.minDistance; controls.current.maxDistance = Math.max(35, goal.distance * 1.2); }
    focused.current = id ?? null; destination.current = goal;
    invalidate(); return true;
  }, [camera, catalog, invalidate, size.width, size.height, transform]);
  useEffect(() => {
    const changedCatalog = lastCatalog.current !== catalog; lastCatalog.current = catalog;
    if (changedCatalog) focused.current = null;
    // Resizing must retain a detail already being studied.
    frame(focused.current, changedCatalog ? 'anterior' : undefined);
  }, [catalog, size.width, size.height, frame]);
  useEffect(() => {
    frame(focused.current);
  }, [exploded, explodeLevel]);
  useEffect(() => {
    if (handledVersion.current !== cameraRequest.version) { pending.current = cameraRequest; handledVersion.current = cameraRequest.version; }
    const request = pending.current; if (!request) return;
    if (request.kind === 'focus') { if (frame(request.id)) pending.current = null; }
    else if (request.kind === 'view') { if (frame(request.id ?? selected, request.view ?? 'anterior')) pending.current = null; }
    else if (request.kind === 'reset') { frame(null, 'anterior'); pending.current = null; }
    else {
      const target = controls.current?.target.clone() ?? new THREE.Vector3();
      const offset = camera.position.clone().sub(target).multiplyScalar(request.kind === 'zoomIn' ? .78 : 1.28);
      const distance = THREE.MathUtils.clamp(offset.length(), controls.current?.minDistance ?? .001, controls.current?.maxDistance ?? 35);
      const direction = offset.normalize(), up = camera.up.clone();
      // Orientation-only bounds supply the same stable camera basis used by framing.
      const basis = fitCameraBounds(new THREE.Box3(target.clone(), target.clone()), (camera as THREE.PerspectiveCamera).fov, 1, direction, up);
      destination.current = { ...basis, target, position: target.clone().addScaledVector(direction, distance), distance };
      invalidate(); pending.current = null;
    }
  }, [cameraRequest.version, resources, frame, camera, invalidate, parts, exploded, explodeLevel, selected]);
  useFrame((_, delta) => {
    const goal = destination.current, orbit = controls.current;
    if (!goal || !orbit) return;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-10 * Math.min(delta, .05));
    const distance = THREE.MathUtils.lerp(camera.position.distanceTo(orbit.target), goal.distance, alpha);
    const orientation = camera.quaternion.clone().slerp(goal.orientation, alpha);
    orbit.target.lerp(goal.target, alpha);
    // Slerp an orthogonal camera frame: interpolating position/up independently
    // crosses a singular pose for posterior -> superior and flips the scene.
    camera.up.set(0, 1, 0).applyQuaternion(orientation);
    camera.position.set(0, 0, 1).applyQuaternion(orientation).multiplyScalar(distance).add(orbit.target);
    camera.quaternion.copy(orientation); orbit.update();
    const tolerance = Math.max(1e-7, goal.distance * 1e-5);
    if (camera.position.distanceTo(goal.position) < tolerance && orbit.target.distanceTo(goal.target) < tolerance && camera.quaternion.angleTo(goal.orientation) < .0001) {
      camera.position.copy(goal.position); camera.up.copy(goal.up); orbit.target.copy(goal.target); orbit.update(); destination.current = null;
    } else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping={!reducedMotion} dampingFactor={.12} minDistance={.001} maxDistance={35}
    rotateSpeed={.65} panSpeed={.65} zoomSpeed={.85} onStart={() => { destination.current = null; pending.current = null; }} onChange={() => invalidate()} />;
}
function Monitor({ resources, loadTiming, onMetrics, onContextLost }: { resources: AtlasResource[]; loadTiming: { current: LoadTiming }; onMetrics: AtlasSceneProps['onMetrics']; onContextLost: (lost: boolean) => void }) {
  const { gl, scene, invalidate } = useThree();
  const latest = useRef({ resources, onMetrics }); latest.current = { resources, onMetrics };
  useEffect(() => {
    const before = scene.onBeforeRender, after = scene.onAfterRender;
    let started = 0, disposed = false, timer: ReturnType<typeof setTimeout> | undefined;
    let reported = '';
    scene.onBeforeRender = function (...args) { before.apply(this, args); started = performance.now(); };
    scene.onAfterRender = function (...args) {
      after.apply(this, args);
      const resources = latest.current.resources;
      const timing = loadTiming.current;
      if (timing.startedAt && timing.firstGeometryMs === undefined && resources.some(resource => resource.parts.some(part => part.mesh.visible))) {
        timing.firstGeometryMs = performance.mark('med3d:first-geometry').startTime - timing.startedAt;
      }
      if (timing.startedAt && timing.fullSystemMs === undefined && timing.initialAssets.length && timing.initialAssets.every(id => resources.some(resource => resource.asset.id === id))) {
        timing.fullSystemMs = performance.mark('med3d:all-assets-rendered').startTime - timing.startedAt;
      }
      const metrics = {
        loadedAssets: resources.length, meshes: resources.reduce((sum, resource) => sum + resource.parts.length, 0),
        triangles: resources.reduce((sum, resource) => sum + resource.triangles, 0), geometryBytes: resources.reduce((sum, resource) => sum + resource.geometryBytes, 0),
        loadMs: resources.reduce((max, resource) => Math.max(max, resource.loadMs), 0), drawCalls: gl.info.render.calls,
        renderGeometries: gl.info.memory.geometries, renderTextures: gl.info.memory.textures,
        frameMs: performance.now() - started,
        firstGeometryMs: timing.firstGeometryMs, fullSystemMs: timing.fullSystemMs,
      };
      // Reporting unchanged timing on every draw would trigger React -> R3F -> React
      // forever. Counts are the invalidation key; frameMs samples the actual render
      // when visible content changes, never the elapsed wall time of a demand frame.
      const signature = [resources.map(resource => resource.asset.id).join('|'), metrics.meshes, metrics.triangles,
        metrics.geometryBytes, metrics.drawCalls, metrics.renderGeometries, metrics.renderTextures].join(':');
      if (signature === reported) return;
      reported = signature; clearTimeout(timer);
      timer = setTimeout(() => { if (!disposed) latest.current.onMetrics?.(metrics); }, 0);
    };
    const lost = (event: Event) => { event.preventDefault(); onContextLost(true); };
    const restored = () => { onContextLost(false); invalidate(); };
    gl.domElement.addEventListener('webglcontextlost', lost); gl.domElement.addEventListener('webglcontextrestored', restored);
    return () => {
      disposed = true; clearTimeout(timer); scene.onBeforeRender = before; scene.onAfterRender = after;
      gl.domElement.removeEventListener('webglcontextlost', lost); gl.domElement.removeEventListener('webglcontextrestored', restored);
    };
  }, [gl, scene, invalidate, onContextLost, loadTiming]);
  return null;
}

export default function AtlasScene(props: AtlasSceneProps) {
  const [reset, setReset] = useState(0), [contextLost, setContextLost] = useState(false);
  const { resources, statuses, loadTiming, retry } = useAssets(props.catalog, props.assetIds, reset);
  const parts = useMemo(() => resources.flatMap(resource => resource.parts), [resources]);
  const callback = useRef(props.onLoadStatus); callback.current = props.onLoadStatus;
  useEffect(() => { callback.current?.(statuses); }, [statuses]);
  const pointerStart = useRef<[number, number]>([0, 0]), dragDistance = useRef(0);
  const errors = statuses.filter(status => status.state === 'error'), pending = statuses.filter(status => status.state === 'loading' || status.state === 'queued');
  const progress = statuses.length ? Math.round(statuses.reduce((sum, status) => sum + status.progress, 0) / statuses.length) : 0;
  const resetRenderer = () => { setContextLost(false); setReset(value => value + 1); };
  return <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: 280 }} aria-label="Explorador anatómico 3D por sistemas"
    onPointerDownCapture={event => { pointerStart.current = [event.clientX, event.clientY]; dragDistance.current = 0; }}
    onPointerUpCapture={event => { dragDistance.current = Math.hypot(event.clientX - pointerStart.current[0], event.clientY - pointerStart.current[1]); }}>
    <SceneBoundary resetKey={props.catalog.id + reset} onRetry={resetRenderer}>
      <Canvas key={reset} frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, .1, 7.4], fov: 34, near: .005, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ gl }) => { gl.setClearColor('#edf2f2', 0); gl.domElement.style.cursor = 'grab'; gl.domElement.setAttribute('aria-label', 'Modelo anatómico: arrastra para girar y selecciona una estructura'); }}
        onPointerMissed={event => { if (event.type === 'click' && dragDistance.current < 5) props.onSelect(null); }} style={{ touchAction: 'none' }}>
        <ambientLight intensity={.75} />
        <hemisphereLight color="#fff5e9" groundColor="#53686b" intensity={.6} />
        <directionalLight position={[4, 5, 6]} color="#fff6ec" intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} color="#c4e5e5" intensity={1.2} />
        <directionalLight position={[0, 3, -5]} color="#e8ffff" intensity={1.8} />
        <Models {...props} resources={resources} parts={parts} />
        <CameraRig {...props} resources={resources} parts={parts} />
        <Monitor resources={resources} loadTiming={loadTiming} onMetrics={props.onMetrics} onContextLost={setContextLost} />
        <GizmoHelper alignment="bottom-left" margin={[48, 48]}><GizmoViewport axisColors={['#b87874', '#819b8a', '#779fae']} labelColor="#ffffff" hideNegativeAxes /></GizmoHelper>
      </Canvas>
    </SceneBoundary>
    {contextLost && <div role="alert" style={{ position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', textAlign: 'center', padding: 24, background: '#edf2f2ed', color: '#355c60' }}>
      <strong>La vista 3D se ha interrumpido</strong><p>El navegador perdió temporalmente la conexión gráfica.</p><button type="button" onClick={resetRenderer}>Restaurar la vista 3D</button>
    </div>}
    {!contextLost && pending.length > 0 && <div role="status" aria-live="polite" style={{ position: 'absolute', left: 16, bottom: 18, maxWidth: 'calc(100% - 110px)', padding: '9px 12px', borderRadius: 9, fontSize: 12, color: '#456b69', background: '#f7faf9ed', pointerEvents: 'none' }}>
      Cargando anatomía · {progress}% · {resources.length}/{statuses.length} regiones
    </div>}
    {!contextLost && errors.length > 0 && <div role="alert" style={{ position: 'absolute', left: 16, top: 16, maxWidth: 'min(370px, calc(100% - 32px))', padding: '12px 14px', borderRadius: 10, fontSize: 12, color: '#65534c', background: '#fffaf5f5' }}>
      <strong>No se pudieron cargar {errors.length === 1 ? 'una región' : `${errors.length} regiones`}</strong>
      <p style={{ lineHeight: 1.5, margin: '7px 0' }}>{errors[0].error}</p>
      <button type="button" onClick={() => retry()} style={{ border: '1px solid #b0bfba', padding: '7px 12px', borderRadius: 7, background: 'white', color: '#356760', cursor: 'pointer' }}>Reintentar regiones pendientes</button>
    </div>}
  </div>;
}
