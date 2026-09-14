import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;
import SceneBoundary from './SceneBoundary';

export type AnatomyModelId = 'heart' | 'lungs' | 'brain' | 'body';
export type CameraRequest = { kind: 'reset' | 'zoomIn' | 'zoomOut' | 'focus'; version: number; id?: string | null };
export type AnatomySceneProps = {
  modelId: AnatomyModelId; selected: string | null; hidden: string[]; isolated: string | null;
  opacity: number; exploded: number; explodeLevel: 'organ' | 'parts';
  onSelect: (id: string | null) => void;
  focusRequest?: { id: string | null; version: number };
  cameraRequest?: CameraRequest;
  onLoaded?: (meshes: Array<{ id: string; label: string }>) => void;
  quality?: 'standard' | 'high' | 'low';
  framing?: 'full' | 'torso';
};
type AssetId = Exclude<AnatomyModelId, 'body'> | 'skin';
type Part = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  id: string; label: string; asset: AssetId; organGroup: string; aliases: Set<string>;
  center: THREE.Vector3; partDirection: THREE.Vector3; organDirection: THREE.Vector3; baseColor: THREE.Color;
};
type Resource = { group: THREE.Group; parts: Part[]; dispose: () => void };
type LoadState = { resource: Resource | null; progress: number; error: string | null };
const ASSETS: Record<AssetId, { bytes: number; color: string }> = {
  heart: { bytes: 715820, color: '#b45655' }, lungs: { bytes: 1992744, color: '#c5949a' },
  brain: { bytes: 3496140, color: '#cba18c' }, skin: { bytes: 399176, color: '#b2c8c7' },
};
const TEAL = new THREE.Color('#31bcb3');
const BLACK = new THREE.Color('#000000');
const limit = (value: number) => Math.max(0, Math.min(1, value));
function disposeParts(parts: Part[]) { parts.forEach(part => { part.mesh.geometry.dispose(); part.mesh.material.dispose(); }); }
function disposeSource(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => {
    Object.values(material).forEach(value => { if (value instanceof THREE.Texture) value.dispose(); });
    material.dispose();
  });
}
async function loadAsset(asset: AssetId, signal: AbortSignal, onProgress: (bytes: number, total: number) => void): Promise<Part[]> {
  const response = await fetch(import.meta.env.BASE_URL + 'models/' + asset + '.glb', { signal });
  if (!response.ok) throw new Error('El archivo ' + asset + ' no está disponible (' + response.status + ').');
  const reader = response.body?.getReader();
  const contentSize = Number(response.headers.get('content-length')) || ASSETS[asset].bytes;
  let buffer: ArrayBuffer;
  if (reader) {
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      chunks.push(result.value); length += result.value.byteLength; onProgress(length, contentSize);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.byteLength; });
    buffer = bytes.buffer;
  } else { buffer = await response.arrayBuffer(); onProgress(buffer.byteLength, contentSize); }
  signal.throwIfAborted();
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, import.meta.env.BASE_URL + 'models/');
  if (signal.aborted) { disposeSource(gltf.scene); signal.throwIfAborted(); }
  gltf.scene.updateMatrixWorld(true);
  const parts: Part[] = [];
  gltf.scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const source = Array.isArray(object.material) ? object.material[0] : object.material;
    const baseColor = new THREE.Color(ASSETS[asset].color);
    if (source && 'color' in source && source.color instanceof THREE.Color && asset !== 'skin') baseColor.lerp(source.color, .24);
    const material = new THREE.MeshStandardMaterial({
      color: baseColor, roughness: .77, metalness: .015, side: THREE.DoubleSide,
      transparent: asset === 'skin', opacity: asset === 'skin' ? .09 : 1, depthWrite: asset !== 'skin',
    });
    const geometry = object.geometry.clone();
    geometry.applyMatrix4(object.matrixWorld);
    if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = object.name || asset + '-structure-' + parts.length;
    mesh.renderOrder = asset === 'skin' ? 2 : 0;
    if (asset === 'skin') mesh.raycast = () => {};
    const aliases = new Set([mesh.name, asset, 'body']);
    let branch: THREE.Object3D = object;
    while (branch.parent && branch.parent !== gltf.scene && branch.parent !== gltf.scene.children[0]) branch = branch.parent;
    const organGroup = branch.name || asset;
    let node: THREE.Object3D | null = object;
    while (node) {
      if (node.name) aliases.add(node.name);
      if (typeof node.userData?.ontologyid === 'string') aliases.add(node.userData.ontologyid);
      node = node.parent;
    }
    parts.push({ mesh, id: mesh.name, label: String(object.userData?.label || object.name || asset), asset, organGroup, aliases,
      center: geometry.boundingBox!.getCenter(new THREE.Vector3()), partDirection: new THREE.Vector3(),
      organDirection: new THREE.Vector3(), baseColor });
  });
  disposeSource(gltf.scene);
  if (!parts.length) throw new Error('Este archivo no contiene estructuras 3D.');
  return parts;
}
function makeResource(parts: Part[], modelId: AnatomyModelId): Resource {
  const group = new THREE.Group();
  parts.forEach(part => group.add(part.mesh));
  const bounds = new THREE.Box3().setFromObject(group), center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3()), largest = Math.max(size.x, size.y, size.z);
  const normalization = 3.45 / Math.max(largest, .001), assetBoxes = new Map<AssetId, THREE.Box3>();
  parts.forEach(part => {
    if (!assetBoxes.has(part.asset)) assetBoxes.set(part.asset, new THREE.Box3());
    assetBoxes.get(part.asset)!.union(part.mesh.geometry.boundingBox!);
  });
  const groupBoxes = new Map<string, THREE.Box3>();
  parts.forEach(part => {
    const key = modelId === 'body' ? part.asset : part.organGroup;
    if (!groupBoxes.has(key)) groupBoxes.set(key, new THREE.Box3());
    groupBoxes.get(key)!.union(part.mesh.geometry.boundingBox!);
  });
  parts.forEach((part, index) => {
    const box = assetBoxes.get(part.asset)!, assetCenter = box.getCenter(new THREE.Vector3());
    const assetSize = box.getSize(new THREE.Vector3()), spread = Math.max(assetSize.x, assetSize.y, assetSize.z) * .38;
    part.partDirection.copy(part.center).sub(assetCenter);
    if (part.partDirection.lengthSq() < 1e-9) part.partDirection.set(Math.sin(index * 2.399), .35 * Math.cos(index), Math.cos(index * 2.399));
    part.partDirection.normalize().multiplyScalar(spread);
    const organCenter = groupBoxes.get(modelId === 'body' ? part.asset : part.organGroup)!.getCenter(new THREE.Vector3());
    part.organDirection.copy(organCenter).sub(modelId === 'body' ? center : assetCenter);
    if (part.organDirection.lengthSq() < 1e-9) part.organDirection.copy(part.partDirection);
    part.organDirection.normalize().multiplyScalar(modelId === 'body' ? largest * .13 : spread);
    if (part.asset === 'skin') { part.partDirection.set(0, 0, 0); part.organDirection.set(0, 0, 0); }
  });
  group.scale.setScalar(normalization);
  group.position.copy(center).multiplyScalar(-normalization);
  group.updateMatrixWorld(true);
  return { group, parts, dispose() { disposeParts(parts); group.clear(); } };
}
function useAnatomyResource(modelId: AnatomyModelId, retry: number): LoadState {
  const [state, setState] = useState<LoadState>({ resource: null, progress: 0, error: null });
  useEffect(() => {
    const abort = new AbortController();
    let active = true, resource: Resource | null = null, lastUpdate = 0;
    const loadedParts: Part[] = [];
    const assets: AssetId[] = modelId === 'body' ? ['skin', 'heart', 'lungs', 'brain'] : [modelId];
    const totals = new Map(assets.map(id => [id, ASSETS[id].bytes])), progress = new Map<AssetId, number>();
    setState({ resource: null, progress: 0, error: null });
    Promise.all(assets.map(async asset => {
      const parts = await loadAsset(asset, abort.signal, (bytes, total) => {
        progress.set(asset, bytes); totals.set(asset, total);
        const now = performance.now();
        if (active && now - lastUpdate > 90) {
          lastUpdate = now;
          const loaded = Array.from(progress.values()).reduce((sum, count) => sum + count, 0);
          setState({ resource: null, progress: Math.min(98, Math.round(loaded / Array.from(totals.values()).reduce((sum, count) => sum + count, 0) * 100)), error: null });
        }
      });
      loadedParts.push(...parts);
    })).then(() => {
      if (!active) { disposeParts(loadedParts); return; }
      resource = makeResource(loadedParts, modelId);
      setState({ resource, progress: 100, error: null });
    }).catch(error => {
      abort.abort(); disposeParts(loadedParts);
      if (active) setState({ resource: null, progress: 0, error: error instanceof Error ? error.message : 'No se pudo cargar el modelo.' });
    });
    return () => { active = false; abort.abort(); resource?.dispose(); };
  }, [modelId, retry]);
  return state;
}
function matches(part: Part, id: string | null | undefined): boolean { return !!id && part.aliases.has(id); }
function Model({ resource, onSelect, selected, hidden, isolated, opacity, exploded, explodeLevel }: AnatomySceneProps & { resource: Resource }) {
  const { invalidate, gl } = useThree(), [hover, setHover] = useState<string | null>(null);
  const motion = useRef<Array<{ part: Part; target: THREE.Vector3 }>>([]);
  const animating = useRef(false), reducedMotion = useRef(false);
  const hiddenKey = hidden.join('|');
  useEffect(() => {
    const hiddenIds = new Set(hidden);
    resource.parts.forEach(part => {
      const hiddenByUser = Array.from(part.aliases).some(id => hiddenIds.has(id));
      part.mesh.visible = !hiddenByUser && (!isolated || matches(part, isolated));
      if (part.asset === 'skin') part.mesh.visible = !hiddenByUser && !isolated;
      const chosen = matches(part, selected), hovered = part.id === hover, material = part.mesh.material;
      material.color.copy(chosen ? TEAL : part.baseColor);
      material.emissive.copy(chosen ? TEAL : hovered ? part.baseColor : BLACK);
      material.emissiveIntensity = chosen ? .19 : hovered ? .12 : 0;
      material.opacity = part.asset === 'skin' ? .085 * limit(opacity) : limit(opacity);
      material.transparent = material.opacity < .999; material.depthWrite = material.opacity > .6;
      material.needsUpdate = true;
    });
    resource.group.updateMatrixWorld(true); invalidate();
  }, [resource, selected, hiddenKey, isolated, opacity, hover, invalidate]);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => { reducedMotion.current = preference.matches; invalidate(); };
    update(); preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, [invalidate]);
  useEffect(() => {
    motion.current = resource.parts.map(part => ({ part,
      target: (explodeLevel === 'parts' ? part.partDirection : part.organDirection).clone().multiplyScalar(limit(exploded)),
    }));
    animating.current = true; invalidate();
    return () => { animating.current = false; motion.current = []; };
  }, [resource, exploded, explodeLevel, invalidate]);
  useFrame((_, delta) => {
    if (!animating.current) return;
    const alpha = reducedMotion.current ? 1 : 1 - Math.exp(-12 * Math.min(delta, .05));
    let pending = false;
    motion.current.forEach(({ part, target }) => {
      part.mesh.position.lerp(target, alpha);
      if (part.mesh.position.distanceToSquared(target) < 1e-10) part.mesh.position.copy(target);
      else pending = true;
    });
    resource.group.updateMatrixWorld(true); animating.current = pending;
    if (pending) invalidate();
  });
  useEffect(() => () => { gl.domElement.style.cursor = 'grab'; }, [gl]);
  function pointer(event: ThreeEvent<PointerEvent>, entering: boolean) {
    event.stopPropagation(); setHover(entering ? event.object.name : null);
    gl.domElement.style.cursor = entering ? 'pointer' : 'grab';
  }
  return <primitive object={resource.group} dispose={null}
    onClick={(event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); if (event.delta < 5) onSelect(event.object.name); }}
    onPointerOver={(event: ThreeEvent<PointerEvent>) => pointer(event, true)}
    onPointerOut={(event: ThreeEvent<PointerEvent>) => pointer(event, false)} />;
}
function CameraRig({ resource, focusRequest, cameraRequest, framing = 'full' }: { resource: Resource | null; focusRequest?: AnatomySceneProps['focusRequest']; cameraRequest?: CameraRequest; framing?: 'full' | 'torso' }) {
  const controls = useRef<OrbitControlsImpl>(null), { camera, invalidate, size } = useThree();
  const destination = useRef<{ position: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const previousResource = useRef<Resource | null>(null);
  function frame(id?: string | null, reset = false) {
    if (!resource || !(camera instanceof THREE.PerspectiveCamera)) return;
    resource.group.updateMatrixWorld(true);
    const box = new THREE.Box3();
    resource.parts.forEach(part => { if (part.mesh.visible && (!id || matches(part, id))) box.expandByObject(part.mesh); });
    if (box.isEmpty()) box.setFromObject(resource.group);
    if (!id && framing === 'torso' && resource.parts.some(part => part.asset === 'skin')) {
      const fullSize = box.getSize(new THREE.Vector3());
      const organs = new THREE.Box3();
      resource.parts.forEach(part => { if (part.asset !== 'skin') organs.expandByObject(part.mesh); });
      const midX = (box.max.x + box.min.x) / 2;
      box.min.y = organs.min.y - fullSize.y * .15;
      box.min.x = midX - fullSize.x * .36;
      box.max.x = midX + fullSize.x * .36;
    }
    const center = box.getCenter(new THREE.Vector3()), dimensions = box.getSize(new THREE.Vector3());
    const fov = THREE.MathUtils.degToRad(camera.fov), aspect = size.width / Math.max(size.height, 1);
    const distance = Math.max(dimensions.y / (2 * Math.tan(fov / 2)), dimensions.x / (2 * Math.tan(fov / 2) * aspect), dimensions.z * .8) * 1.24;
    const direction = reset ? new THREE.Vector3(.05, .015, 1) : camera.position.clone().sub(controls.current?.target || new THREE.Vector3()).normalize();
    destination.current = { target: center, position: center.clone().add(direction.normalize().multiplyScalar(Math.max(.45, distance))) };
    invalidate();
  }
  useEffect(() => {
    if (resource && previousResource.current !== resource) { previousResource.current = resource; frame(null, true); }
  }, [resource, size.width, size.height, framing]);
  useEffect(() => { if (focusRequest?.version) frame(focusRequest.id); }, [focusRequest?.version, resource]);
  useEffect(() => {
    if (!cameraRequest?.version) return;
    if (cameraRequest.kind === 'reset') frame(null, true);
    else if (cameraRequest.kind === 'focus') frame(cameraRequest.id);
    else {
      const target = controls.current?.target.clone() || new THREE.Vector3();
      const offset = camera.position.clone().sub(target).multiplyScalar(cameraRequest.kind === 'zoomIn' ? .78 : 1.28);
      offset.clampLength(.35, 22);
      destination.current = { target, position: target.clone().add(offset) }; invalidate();
    }
  }, [cameraRequest?.version, resource]);
  useFrame((_, delta) => {
    const goal = destination.current;
    if (!goal || !controls.current) return;
    const alpha = 1 - Math.exp(-10 * Math.min(delta, .05));
    camera.position.lerp(goal.position, alpha); controls.current.target.lerp(goal.target, alpha); controls.current.update();
    if (camera.position.distanceToSquared(goal.position) < .000002 && controls.current.target.distanceToSquared(goal.target) < .000002) {
      camera.position.copy(goal.position); controls.current.target.copy(goal.target); controls.current.update(); destination.current = null;
    } else invalidate();
  });
  return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.12} minDistance={.35} maxDistance={22}
    rotateSpeed={.65} panSpeed={.65} zoomSpeed={.85} onStart={() => { destination.current = null; }} onChange={() => invalidate()} />;
}
function ContextEvents({ onLost }: { onLost: (lost: boolean) => void }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onLost(true); };
    const restored = () => { onLost(false); invalidate(); };
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', lost); canvas.addEventListener('webglcontextrestored', restored);
    return () => { canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored); };
  }, [gl, invalidate, onLost]);
  return null;
}
export default function AnatomyScene(props: AnatomySceneProps) {
  const [retry, setRetry] = useState(0), [contextLost, setContextLost] = useState(false);
  const { resource, progress, error } = useAnatomyResource(props.modelId, retry);
  const loadedCallback = useRef(props.onLoaded);
  loadedCallback.current = props.onLoaded;
  useEffect(() => { if (resource) loadedCallback.current?.(resource.parts.filter(part => part.asset !== 'skin').map(part => ({ id: part.id, label: part.label }))); }, [resource]);
  const dpr: [number, number] = props.quality === 'low' ? [1, 1] : [1, 1.5];
  return <div style={{ width: '100%', height: '100%', position: 'relative', minHeight: 280 }} aria-label="Visor anatómico 3D interactivo">
    <SceneBoundary resetKey={props.modelId + retry} onRetry={() => setRetry(value => value + 1)}>
      <Canvas key={retry} frameloop="demand" dpr={dpr} camera={{ position: [0, .1, 7.4], fov: 34, near: .01, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ gl }) => { gl.setClearColor('#edf2f2', 0); gl.domElement.style.cursor = 'grab'; gl.domElement.setAttribute('aria-label', 'Modelo 3D: arrastra para rotar, usa la rueda para acercar'); }}
        onPointerMissed={event => { if (event.type === 'click') props.onSelect(null); }} style={{ touchAction: 'none' }}>
        <ambientLight intensity={1.65} />
        <hemisphereLight color="#fff5e9" groundColor="#53686b" intensity={1.2} />
        <directionalLight position={[4, 5, 6]} color="#fff6ec" intensity={2.2} />
        <directionalLight position={[-4, 1, 2]} color="#c4e5e5" intensity={1.2} />
        <directionalLight position={[0, 3, -5]} color="#e8ffff" intensity={1.8} />
        {resource && <Model {...props} resource={resource} />}
        <CameraRig resource={resource} focusRequest={props.focusRequest} cameraRequest={props.cameraRequest} framing={props.framing} />
        <ContextEvents onLost={setContextLost} />
        <GizmoHelper alignment="bottom-right" margin={[53, 58]}>
          <GizmoViewport axisColors={['#b87874', '#819b8a', '#779fae']} labelColor="#ffffff" hideNegativeAxes />
        </GizmoHelper>
      </Canvas>
    </SceneBoundary>
    {(!resource || contextLost) && <div role={error || contextLost ? 'alert' : 'status'} aria-live="polite" style={{ position: 'absolute', inset: 0, zIndex: 5, display: 'grid', placeContent: 'center', textAlign: 'center', padding: 28, background: 'rgba(239,245,244,.90)', color: '#557477' }}>
      {error || contextLost ? <>
        <strong style={{ fontSize: 17, color: '#274e52' }}>{contextLost ? 'La vista 3D se ha interrumpido' : 'No se pudo cargar el modelo'}</strong>
        <p style={{ maxWidth: 330, lineHeight: 1.6, fontSize: 13 }}>{contextLost ? 'El navegador perdió temporalmente la conexión gráfica.' : error}</p>
        <button type="button" onClick={() => { setContextLost(false); setRetry(value => value + 1); }} style={{ justifySelf: 'center', border: '1px solid #a5bfbd', background: 'white', color: '#236461', borderRadius: 10, padding: '10px 20px', font: 'inherit', cursor: 'pointer' }}>Reintentar</button>
      </> : <>
        <span style={{ fontSize: 12, letterSpacing: '.13em', textTransform: 'uppercase', color: '#72928f' }}>Preparando la anatomía</span>
        <strong style={{ fontSize: 34, fontWeight: 500, margin: '14px 0 12px', color: '#305f61' }}>{progress}%</strong>
        <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Descarga del modelo" style={{ width: 180, height: 3, background: '#d7e3e1', borderRadius: 3, overflow: 'hidden' }}><div style={{ width: progress + '%', height: '100%', background: '#3d9b91', transition: 'width .15s linear' }} /></div>
        <span style={{ fontSize: 11, marginTop: 13, color: '#78918e' }}>{progress >= 98 ? 'Preparando las estructuras 3D…' : 'Cargando el modelo anatómico…'}</span>
      </>}
    </div>}
  </div>;
}
