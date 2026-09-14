import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import SceneBoundary from '../SceneBoundary';
import { AtlasAssetManager, type AssetSnapshot, type AtlasPart, type AtlasResource } from './asset-manager';
import { createExplosionOffsets, explosionTarget } from './explosion';
import type { AnatomyCatalog, AtlasSceneProps, Bounds, SystemId } from './types';

type Controls = ComponentRef<typeof OrbitControls>;
type MaterialVariants = { base: THREE.MeshStandardMaterial; selected: THREE.MeshStandardMaterial; hover: THREE.MeshStandardMaterial };
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
  const [snapshot, setSnapshot] = useState<AssetSnapshot>({ resources: [], statuses: [] });
  useEffect(() => {
    const next = new AtlasAssetManager(catalog); manager.current = next;
    const unsubscribe = next.subscribe(value => setSnapshot(previous => ({ ...value,
      resources: value.resources.length === previous.resources.length && value.resources.every((resource, index) => resource === previous.resources[index]) ? previous.resources : value.resources,
    })));
    next.setDesired(desired.current);
    return () => { unsubscribe(); next.dispose(); if (manager.current === next) manager.current = null; };
  }, [catalog, reset]);
  const assetKey = assetIds.join('|');
  useEffect(() => { manager.current?.setDesired(desired.current); }, [assetKey]);
  return { ...snapshot, retry: (id?: string) => manager.current?.retry(id) };
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
    const alpha = 1 - Math.exp(-11 * Math.min(delta, .05));
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
function CameraRig({ catalog, parts, cameraRequest, resources, exploded, explodeLevel, assetIds }: Pick<ModelProps, 'catalog' | 'parts' | 'cameraRequest' | 'resources' | 'exploded' | 'explodeLevel' | 'assetIds'>) {
  const controls = useRef<Controls>(null), { camera, invalidate, size } = useThree();
  const destination = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const pending = useRef<AtlasSceneProps['cameraRequest'] | null>(null), handledVersion = useRef(-1);
  const transform = useMemo(() => frameTransform(catalog), [catalog]);
  const current = useRef({ catalog, parts, cameraRequest, resources, exploded, explodeLevel, assetIds });
  current.current = { catalog, parts, cameraRequest, resources, exploded, explodeLevel, assetIds };
  const frame = useCallback((id?: string | null, reset = false): boolean => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return false;
    const box = new THREE.Box3();
    if (id) {
      const state = current.current;
      const node = state.catalog.nodes.find(node => node.id === id);
      if (!node) return true;
      const requestedAssets = node.assetIds.filter(asset => state.assetIds.includes(asset));
      // Keep the request pending until every requested region of this target is decoded.
      if (!requestedAssets.length || requestedAssets.some(asset => !state.resources.some(resource => resource.asset.id === asset))) return false;
      state.parts.forEach(part => {
        if (!part.ancestors.has(id) || !part.mesh.visible) return;
        // Focus on the final exploded bounds so it remains correct during the smooth transition.
        box.union(part.baseBounds.clone().translate(part.targetOffset));
      });
      if (box.isEmpty()) return false;
    } else {
      const state = current.current;
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
    const centre = box.getCenter(new THREE.Vector3()), dimensions = box.getSize(new THREE.Vector3());
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(dimensions.y / (2 * tan), dimensions.x / (2 * tan * aspect), dimensions.z * .8) * 1.2;
    const direction = reset ? new THREE.Vector3(.025, .008, 1) : camera.position.clone().sub(controls.current?.target ?? new THREE.Vector3());
    if (direction.lengthSq() < .0001) direction.set(0, 0, 1);
    destination.current = { target: centre, position: centre.clone().add(direction.normalize().multiplyScalar(Math.max(.16, Math.min(35, distance)))) };
    invalidate(); return true;
  }, [camera, catalog, invalidate, size.width, size.height, transform]);
  useEffect(() => { frame(null, true); }, [catalog, size.width, size.height, frame]);
  useEffect(() => {
    // Fit the destination pose while separation animates; changing levels cannot
    // push structures outside the view. A focused detail remains the focus.
    if (cameraRequest.kind === 'focus' && cameraRequest.id) frame(cameraRequest.id);
    else frame(null);
  }, [exploded, explodeLevel]);
  useEffect(() => {
    if (handledVersion.current !== cameraRequest.version) { pending.current = cameraRequest; handledVersion.current = cameraRequest.version; }
    const request = pending.current; if (!request) return;
    if (request.kind === 'focus') { if (frame(request.id)) pending.current = null; }
    else if (request.kind === 'reset') { frame(null, true); pending.current = null; }
    else {
      const target = controls.current?.target.clone() ?? new THREE.Vector3();
      const offset = camera.position.clone().sub(target).multiplyScalar(request.kind === 'zoomIn' ? .78 : 1.28).clampLength(.12, 35);
      destination.current = { target, position: target.clone().add(offset) }; invalidate(); pending.current = null;
    }
  }, [cameraRequest.version, resources, frame, camera, invalidate, parts, exploded, explodeLevel]);
  useFrame((_, delta) => {
    const goal = destination.current;
    if (!goal || !controls.current) return;
    const alpha = 1 - Math.exp(-10 * Math.min(delta, .05));
    camera.position.lerp(goal.position, alpha); controls.current.target.lerp(goal.target, alpha); controls.current.update();
    if (camera.position.distanceToSquared(goal.position) < .0000002 && controls.current.target.distanceToSquared(goal.target) < .0000002) {
      camera.position.copy(goal.position); controls.current.target.copy(goal.target); controls.current.update(); destination.current = null;
    } else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.12} minDistance={.12} maxDistance={35}
    rotateSpeed={.65} panSpeed={.65} zoomSpeed={.85} onStart={() => { destination.current = null; pending.current = null; }} onChange={() => invalidate()} />;
}
function Monitor({ resources, onMetrics, onContextLost }: { resources: AtlasResource[]; onMetrics: AtlasSceneProps['onMetrics']; onContextLost: (lost: boolean) => void }) {
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
      const metrics = {
        loadedAssets: resources.length, meshes: resources.reduce((sum, resource) => sum + resource.parts.length, 0),
        triangles: resources.reduce((sum, resource) => sum + resource.triangles, 0), geometryBytes: resources.reduce((sum, resource) => sum + resource.geometryBytes, 0),
        loadMs: resources.reduce((max, resource) => Math.max(max, resource.loadMs), 0), drawCalls: gl.info.render.calls,
        renderGeometries: gl.info.memory.geometries, renderTextures: gl.info.memory.textures,
        frameMs: performance.now() - started,
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
  }, [gl, scene, invalidate, onContextLost]);
  return null;
}

export default function AtlasScene(props: AtlasSceneProps) {
  const [reset, setReset] = useState(0), [contextLost, setContextLost] = useState(false);
  const { resources, statuses, retry } = useAssets(props.catalog, props.assetIds, reset);
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
        <ambientLight intensity={1.65} />
        <hemisphereLight color="#fff5e9" groundColor="#53686b" intensity={1.2} />
        <directionalLight position={[4, 5, 6]} color="#fff6ec" intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} color="#c4e5e5" intensity={1.2} />
        <directionalLight position={[0, 3, -5]} color="#e8ffff" intensity={1.8} />
        <Models {...props} resources={resources} parts={parts} />
        <CameraRig {...props} resources={resources} parts={parts} />
        <Monitor resources={resources} onMetrics={props.onMetrics} onContextLost={setContextLost} />
        <GizmoHelper alignment="bottom-right" margin={[53, 58]}><GizmoViewport axisColors={['#b87874', '#819b8a', '#779fae']} labelColor="#ffffff" hideNegativeAxes /></GizmoHelper>
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
