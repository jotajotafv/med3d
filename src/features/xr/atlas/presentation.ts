import * as THREE from 'three';
import type { AtlasPart, AtlasResource } from '../../anatomy/atlas/asset-manager';
import type { AnatomyCatalog, AnatomyNode } from '../../anatomy/atlas/types';
import { createExplosionOffsets, explosionTarget } from '../../anatomy/atlas/explosion';
import { atlasPartVisible, type AtlasState } from './state';
import { xrSystem } from './systems';

export type AtlasPick = { kind: 'empty' } | { kind: 'selected'; selection: { id: string; node: AnatomyNode; mesh: THREE.Mesh } };
export type AtlasPicker = { rect: () => DOMRect; hitTest: (point: { x: number; y: number }) => AtlasPick; select: (result: AtlasPick) => void };
type Variants = { base: THREE.MeshStandardMaterial; selected: THREE.MeshStandardMaterial };

/** Own only XR material clones and instance offsets. Manager remains the geometry owner. */
export class XrAtlasPresentation {
  readonly parts: AtlasPart[] = [];
  visibleMeshes: THREE.Mesh[] = [];
  readonly byMesh = new Map<THREE.Object3D, AtlasPart>();
  private originals = new Map<AtlasPart, THREE.MeshStandardMaterial>();
  private materials = new Map<string, Variants>();
  private variants = new Map<AtlasPart, Variants>();
  private visibility?: Pick<AtlasState, 'systemVisibility' | 'hiddenStructures' | 'isolatedStructure'>;
  private shown = new Set<AtlasPart>();
  private offsets: ReturnType<typeof createExplosionOffsets> = new Map();
  private offsetCatalog?: AnatomyCatalog;
  private partCount = 0;
  add(resources: AtlasResource[]) {
    for (const resource of resources) for (const part of resource.parts) {
      if (this.byMesh.has(part.mesh)) continue;
      const color = xrSystem(part.node.systemId!).color(part.node);
      const key = part.node.systemId + ':' + color;
      let variant = this.materials.get(key);
      if (!variant) {
        const base = part.mesh.material.clone();
        base.color.set(color); base.roughness = .78; base.metalness = .015; base.side = THREE.DoubleSide;
        const selected = base.clone(); selected.emissive.set('#9dcbd2'); selected.emissiveIntensity = .24;
        variant = { base, selected }; this.materials.set(key, variant);
      }
      this.originals.set(part, part.mesh.material); this.variants.set(part, variant);
      this.parts.push(part); this.byMesh.set(part.mesh, part);
    }
  }
  apply(state: AtlasState, catalog: AnatomyCatalog) {
    const changed = this.partCount !== this.parts.length || this.visibility?.systemVisibility !== state.systemVisibility
      || this.visibility.hiddenStructures !== state.hiddenStructures || this.visibility.isolatedStructure !== state.isolatedStructure;
    if (changed) {
      const visible = this.parts.filter(part => atlasPartVisible(state, part.node, part.ancestors));
      this.visibleMeshes = visible.map(part => part.mesh); this.shown = new Set(visible);
      this.visibility = state; this.partCount = this.parts.length;
    }
    if (changed || this.offsetCatalog !== catalog) {
      this.offsets = createExplosionOffsets(catalog, new Set([...this.shown].map(part => part.node.systemId!)));
      this.offsetCatalog = catalog;
    }
    for (const part of this.parts) {
      const variant = this.variants.get(part)!, opacity = state.systemOpacity[part.node.systemId as keyof AtlasState['systemOpacity']];
      for (const [index, material] of [variant.base, variant.selected].entries()) {
        // Preserve the Atlas's corneal presentation for the newly included ocular surfaces.
        const effectiveOpacity = opacity * (part.node.ocularClass === 'cornea' ? [.22, .55][index] : 1);
        const transparent = effectiveOpacity < .999;
        if (material.transparent !== transparent) material.needsUpdate = true;
        material.opacity = effectiveOpacity; material.transparent = transparent; material.depthWrite = !transparent;
      }
      part.mesh.material = part.ancestors.has(state.selectedStructure || '') ? variant.selected : variant.base;
      part.mesh.visible = this.shown.has(part); part.mesh.renderOrder = part.mesh.material.transparent ? 1 : 0;
      part.targetOffset.set(...explosionTarget(this.offsets.get(part.node.id), 'regions', state.explodedAmount));
      part.offset.copy(part.targetOffset); part.mesh.position.copy(part.basePosition).add(part.offset);
    }
  }
  pick(point: { x: number; y: number }, rect: { left: number; top: number; width: number; height: number }, camera: THREE.Camera, root: THREE.Object3D, raycaster: THREE.Raycaster): AtlasPick {
    if (rect.width <= 0 || rect.height <= 0 || point.x < rect.left || point.y < rect.top || point.x > rect.left + rect.width || point.y > rect.top + rect.height) return { kind: 'empty' };
    root.updateWorldMatrix(true, true); camera.updateWorldMatrix(true, false);
    raycaster.setFromCamera(new THREE.Vector2((point.x - rect.left) / rect.width * 2 - 1, 1 - (point.y - rect.top) / rect.height * 2), camera);
    const hit = raycaster.intersectObjects(this.visibleMeshes, false)[0];
    const part = hit && this.byMesh.get(hit.object);
    return part ? { kind: 'selected', selection: { id: part.node.id, node: part.node, mesh: part.mesh } } : { kind: 'empty' };
  }
  accepts(result: AtlasPick) { return result.kind === 'empty' || this.visibleMeshes.includes(result.selection.mesh); }
  get materialCount() { return this.materials.size * 2; }
  dispose() {
    this.originals.forEach((original, part) => { part.mesh.material = original; part.mesh.position.copy(part.basePosition); });
    this.materials.forEach(({ base, selected }) => { base.dispose(); selected.dispose(); });
    this.materials.clear(); this.originals.clear(); this.variants.clear(); this.byMesh.clear(); this.parts.length = 0; this.visibleMeshes = [];
    this.shown.clear(); this.offsets.clear(); this.visibility = undefined; this.offsetCatalog = undefined; this.partCount = 0;
  }
}
