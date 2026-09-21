import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import type { AnatomyAsset, AnatomyCatalog, AnatomyNode, AssetLoadStatus } from './types';

export interface AtlasPart {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
  node: AnatomyNode;
  ancestors: ReadonlySet<string>;
  basePosition: THREE.Vector3;
  baseBounds: THREE.Box3;
  offset: THREE.Vector3;
  targetOffset: THREE.Vector3;
}
export interface AtlasResource {
  asset: AnatomyAsset;
  group: THREE.Group;
  parts: AtlasPart[];
  geometries: ReadonlySet<THREE.BufferGeometry>;
  geometryBytes: number;
  triangles: number;
  loadMs: number;
  dispose: () => void;
}
export interface AssetSnapshot { resources: AtlasResource[]; statuses: AssetLoadStatus[] }
type Entry = { asset: AnatomyAsset; status: AssetLoadStatus; abort?: AbortController; resource?: AtlasResource };
type LoadAsset = (asset: AnatomyAsset, signal: AbortSignal, onProgress: (progress: number) => void) => Promise<AtlasResource>;

/** Reuses shared attribute/interleaved buffers without counting the same allocation twice. */
export function geometryMemoryBytes(geometries: Iterable<THREE.BufferGeometry>): number {
  const buffers = new Set<ArrayBufferLike>();
  for (const geometry of geometries) {
    const attributes = [...Object.values(geometry.attributes), ...(geometry.index ? [geometry.index] : []), ...Object.values(geometry.morphAttributes).flat()];
    attributes.forEach(attribute => buffers.add(attribute.array.buffer));
  }
  return [...buffers].reduce((total, buffer) => total + buffer.byteLength, 0);
}
function collectResources(scene: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
  });
  materials.forEach(material => Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); }));
  return { geometries, materials, textures };
}
function disposeMaterials(resources: ReturnType<typeof collectResources>) {
  resources.textures.forEach(texture => {
    texture.dispose();
    if (typeof ImageBitmap !== 'undefined' && texture.image instanceof ImageBitmap) texture.image.close();
  });
  resources.materials.forEach(material => material.dispose());
  resources.textures.clear(); resources.materials.clear();
}

export function createAssetLoader(catalog: AnatomyCatalog): LoadAsset {
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]));
  const ancestry = new Map<string, ReadonlySet<string>>();
  catalog.nodes.forEach(node => {
    const ids = new Set<string>(); let current: AnatomyNode | undefined = node;
    while (current && !ids.has(current.id)) { ids.add(current.id); current = current.parentId ? nodes.get(current.parentId) : undefined; }
    ancestry.set(node.id, ids);
  });
  const assetNodes = new Map<string, Map<string, AnatomyNode>>();
  catalog.assets.forEach(asset => assetNodes.set(asset.id, new Map()));
  // A mesh belongs to its deepest selectable catalog node; groups are resolved by ancestors.
  catalog.nodes.forEach(node => node.assetIds.forEach(assetId => node.meshNames.forEach(name => {
    const mapping = assetNodes.get(assetId), previous = mapping?.get(name);
    if (!mapping) throw new Error(`La estructura ${node.id} referencia un módulo inexistente.`);
    if (!node.systemId || catalog.assets.find(asset => asset.id === assetId)?.systemId !== node.systemId) {
      throw new Error(`La malla ${name} no pertenece al sistema de ${assetId}.`);
    }
    if (previous && !ancestry.get(node.id)?.has(previous.id) && !ancestry.get(previous.id)?.has(node.id)) {
      throw new Error(`La malla ${name} tiene propietarios anatómicos incompatibles.`);
    }
    if (!previous || ancestry.get(node.id)!.size > ancestry.get(previous.id)!.size) mapping?.set(name, node);
  })));
  return async (asset, signal, onProgress) => {
    const started = performance.now();
    if (asset.frameId !== catalog.frame.id || catalog.frame.units !== 'metres' || catalog.frame.up !== 'Y') {
      throw new Error(`La región ${asset.id} utiliza un marco anatómico incompatible.`);
    }
    const url = new URL(asset.path.replace(/^\//, ''), new URL(import.meta.env.BASE_URL, window.location.origin));
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`No se pudo descargar ${asset.id} (HTTP ${response.status}).`);
    const total = Number(response.headers.get('content-length')) || asset.bytes;
    const reader = response.body?.getReader();
    let buffer: ArrayBuffer;
    if (reader) {
      const chunks: Uint8Array[] = []; let received = 0, previousUpdate = 0;
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          signal.throwIfAborted(); chunks.push(value); received += value.byteLength;
          const now = performance.now();
          if (now - previousUpdate > 80) { onProgress(Math.min(95, received / Math.max(total, 1) * 95)); previousUpdate = now; }
        }
      } finally { reader.releaseLock(); }
      const joined = new Uint8Array(received); let cursor = 0;
      chunks.forEach(chunk => { joined.set(chunk, cursor); cursor += chunk.byteLength; });
      buffer = joined.buffer;
    } else buffer = await response.arrayBuffer();
    signal.throwIfAborted(); onProgress(96);
    const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer, new URL('.', url).href);
    const source = collectResources(gltf.scene), group = new THREE.Group(), parts: AtlasPart[] = [];
    const placeholder = new THREE.MeshStandardMaterial();
    try {
      signal.throwIfAborted(); gltf.scene.updateMatrixWorld(true);
      const mapping = assetNodes.get(asset.id)!;
      const observed = new Set<string>();
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const node = mapping.get(object.name);
        if (!node) throw new Error(`La malla ${object.name || '(sin nombre)'} no tiene una estructura registrada en ${asset.id}.`);
        if (observed.has(object.name)) throw new Error(`La malla ${object.name} está duplicada en ${asset.id}.`);
        observed.add(object.name);
        const geometry = object.geometry;
        if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
        if (!geometry.boundingBox) geometry.computeBoundingBox();
        if (!geometry.boundingSphere) geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, placeholder);
        mesh.name = object.name; mesh.userData.anatomyNodeId = node.id;
        object.matrixWorld.decompose(mesh.position, mesh.quaternion, mesh.scale);
        const ancestors = ancestry.get(node.id)!;
        const baseBounds = geometry.boundingBox!.clone().applyMatrix4(object.matrixWorld);
        parts.push({ mesh, node, ancestors, basePosition: mesh.position.clone(), baseBounds, offset: new THREE.Vector3(), targetOffset: new THREE.Vector3() });
        group.add(mesh);
      });
      if (!parts.length) throw new Error(`El archivo ${asset.id} no contiene estructuras 3D.`);
      const missing = [...mapping.keys()].filter(name => !observed.has(name));
      if (missing.length || parts.length !== asset.meshCount) throw new Error(`El archivo ${asset.id} no contiene todas las mallas catalogadas (${parts.length}/${asset.meshCount}; faltan ${missing.join(', ') || 'elementos'}).`);
      const geometryBytes = geometryMemoryBytes(source.geometries);
      const triangles = parts.reduce((sum, part) => sum + (part.mesh.geometry.index?.count ?? part.mesh.geometry.getAttribute('position').count) / 3, 0);
      if (triangles !== asset.triangles) throw new Error(`La geometría de ${asset.id} no coincide con el recuento de triángulos registrado.`);
      let disposed = false;
      return { asset, group, parts, geometries: source.geometries, geometryBytes, triangles, loadMs: performance.now() - started,
        dispose() {
          if (disposed) return; disposed = true;
          group.removeFromParent(); group.clear();
          source.geometries.forEach(geometry => geometry.dispose()); placeholder.dispose();
        },
      };
    } catch (error) {
      source.geometries.forEach(geometry => geometry.dispose()); placeholder.dispose(); group.clear(); throw error;
    } finally {
      // Mesh geometries are transferred to the resource, not cloned or disposed here.
      disposeMaterials(source); gltf.scene.clear();
    }
  };
}

/** Bounded, cancellable ownership. No retained decoded cache after a layer is disabled. */
export class AtlasAssetManager {
  private entries = new Map<string, Entry>();
  private wanted: string[] = [];
  private running = 0;
  private disposed = false;
  private listeners = new Set<(snapshot: AssetSnapshot) => void>();
  private assets: Map<string, AnatomyAsset>;
  constructor(catalog: AnatomyCatalog, private load: LoadAsset = createAssetLoader(catalog), private concurrency = 2) {
    this.assets = new Map(catalog.assets.map(asset => [asset.id, asset]));
    this.concurrency = Math.max(1, Math.min(2, concurrency));
  }
  subscribe(listener: (snapshot: AssetSnapshot) => void) { this.listeners.add(listener); listener(this.snapshot()); return () => { this.listeners.delete(listener); }; }
  snapshot(): AssetSnapshot {
    return { resources: this.wanted.flatMap(id => this.entries.get(id)?.resource ? [this.entries.get(id)!.resource!] : []),
      statuses: this.wanted.flatMap(id => this.entries.get(id) ? [{ ...this.entries.get(id)!.status }] : []) };
  }
  private emit() { if (!this.disposed) { const snapshot = this.snapshot(); this.listeners.forEach(listener => listener(snapshot)); } }
  setDesired(ids: string[]) {
    if (this.disposed) return;
    this.wanted = [...new Set(ids)].filter(id => this.assets.has(id));
    const wanted = new Set(this.wanted);
    this.entries.forEach((entry, id) => { if (!wanted.has(id)) { entry.abort?.abort(); entry.resource?.dispose(); this.entries.delete(id); } });
    this.wanted.forEach(id => { if (!this.entries.has(id)) this.entries.set(id, { asset: this.assets.get(id)!, status: { id, state: 'queued', progress: 0 } }); });
    this.emit(); this.pump();
  }
  retry(id?: string) {
    this.entries.forEach(entry => { if ((!id || entry.asset.id === id) && entry.status.state === 'error') entry.status = { id: entry.asset.id, state: 'queued', progress: 0 }; });
    this.emit(); this.pump();
  }
  private pump() {
    if (this.disposed) return;
    while (this.running < this.concurrency) {
      const entry = this.wanted.map(id => this.entries.get(id)).find(entry => entry?.status.state === 'queued');
      if (!entry) break;
      const abort = new AbortController(); entry.abort = abort;
      entry.status = { id: entry.asset.id, state: 'loading', progress: 0 }; this.running += 1; this.emit();
      const current = () => !this.disposed && this.entries.get(entry.asset.id) === entry && !abort.signal.aborted;
      this.load(entry.asset, abort.signal, progress => {
        if (current()) { entry.status = { id: entry.asset.id, state: 'loading', progress }; this.emit(); }
      }).then(resource => {
        if (!current()) { resource.dispose(); return; }
        entry.resource = resource; entry.status = { id: entry.asset.id, state: 'ready', progress: 100 }; this.emit();
      }).catch(error => {
        if (!current()) return;
        entry.status = { id: entry.asset.id, state: 'error', progress: 0, error: error instanceof Error ? error.message : 'No se pudo cargar esta región.' }; this.emit();
      }).finally(() => { this.running -= 1; this.pump(); });
    }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.entries.forEach(entry => { entry.abort?.abort(); entry.resource?.dispose(); });
    this.entries.clear(); this.wanted = []; this.listeners.clear();
  }
}
