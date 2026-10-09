import { Component, useEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { GestureController } from './gestures';

type HeartResource = { scene: THREE.Group; center: THREE.Vector3; scale: number };
function disposeHeart(scene: THREE.Group) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
    }
  });
  textures.forEach(value => value.dispose()); materials.forEach(value => value.dispose()); geometries.forEach(value => value.dispose());
}

function Heart({ resource, gestures }: { resource: HeartResource; gestures: GestureController }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current) return;
    const alpha = 1 - Math.exp(-Math.min(dt, 0.1) / 0.055), target = gestures.target;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, target.rotationX, alpha);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target.rotationY, alpha);
    group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, target.scale, alpha));
  });
  return <group ref={group} name="xrRootGroup"><group scale={resource.scale}>
    <group position={[-resource.center.x, -resource.center.y, -resource.center.z]}>
      <primitive object={resource.scene} dispose={null}/>
    </group>
  </group></group>;
}

function Framing() {
  const { camera, size } = useThree();
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.position.set(0, 0, 6.8 / Math.min(1, size.width / Math.max(1, size.height)));
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

class XrSceneBoundary extends Component<{ children: ReactNode; retry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="xr-scene-message" role="alert"><p>No se pudo iniciar la vista 3D. Comprueba la aceleración gráfica del navegador.</p>
      <button type="button" aria-label="Reintentar vista 3D" onClick={this.props.retry}>Reintentar</button></div>;
  }
}

export default function XrHeartScene({ gestures }: { gestures: GestureController }) {
  const [resource, setResource] = useState<HeartResource | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    let owned: THREE.Group | null = null;
    setResource(null); setError(false);
    const load = async () => {
      const response = await fetch(import.meta.env.BASE_URL + 'models/heart.glb', { signal: abort.signal });
      if (!response.ok) throw new Error('Heart unavailable');
      const bytes = await response.arrayBuffer(); abort.signal.throwIfAborted();
      const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(bytes, import.meta.env.BASE_URL + 'models/');
      if (abort.signal.aborted) { disposeHeart(gltf.scene); return; }
      owned = gltf.scene;
      const bounds = new THREE.Box3().setFromObject(owned);
      if (bounds.isEmpty()) throw new Error('Empty heart');
      const size = bounds.getSize(new THREE.Vector3());
      setResource({ scene: owned, center: bounds.getCenter(new THREE.Vector3()), scale: 3 / Math.max(size.x, size.y, size.z) });
    };
    void load().catch(() => { if (!abort.signal.aborted) setError(true); });
    return () => { abort.abort(); if (owned) disposeHeart(owned); };
  }, [retry]);
  const retryLoad = () => setRetry(value => value + 1);
  return <div className="xr-scene" data-model-status={error ? 'error' : resource ? 'ready' : 'loading'}>
    {error ? <div className="xr-scene-message" role="alert"><p>No se pudo cargar el corazón. Comprueba la conexión e inténtalo de nuevo.</p>
      <button type="button" aria-label="Reintentar carga del corazón" onClick={retryLoad}>Reintentar</button></div>
      : resource ? <XrSceneBoundary key={retry} retry={retryLoad}>
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 38, near: 0.1, far: 100 }} gl={{ alpha: true, antialias: true }}>
          <Framing/><ambientLight intensity={1.3}/><directionalLight position={[3, 5, 5]} intensity={3.2}/>
          <directionalLight position={[-4, 1, -2]} intensity={1.4}/><Heart resource={resource} gestures={gestures}/>
        </Canvas>
      </XrSceneBoundary>
        : <div className="xr-scene-message" role="status">Cargando corazón…</div>}
  </div>;
}
