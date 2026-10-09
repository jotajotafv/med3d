import * as THREE from 'three';
import { heartEducationForMesh, type HeartEducation } from './selection-data';

export type HeartSelection = HeartEducation & { id: string; mesh: THREE.Mesh };
export type SelectionIndex = { meshes: THREE.Mesh[]; byMesh: Map<THREE.Mesh, HeartSelection> };
export type ScreenPoint = { x: number; y: number };
export type SelectionResult = { kind: 'empty' } | { kind: 'unknown' } | { kind: 'selected'; selection: HeartSelection };
export type PickHandler = (point: ScreenPoint) => void;

/** Build once per resource. All meshes remain occluders, including any unknown mesh. */
export function indexHeartMeshes(scene: THREE.Object3D): SelectionIndex {
  const meshes: THREE.Mesh[] = [], byMesh = new Map<THREE.Mesh, HeartSelection>();
  scene.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    meshes.push(object);
    const education = heartEducationForMesh(object.name);
    if (education) byMesh.set(object, { ...education, id: education.structure.id, mesh: object });
  });
  return { meshes, byMesh };
}

function visible(object: THREE.Object3D) {
  for (let parent: THREE.Object3D | null = object; parent; parent = parent.parent) if (!parent.visible) return false;
  return true;
}

/** Called only for a qualified click/tap. Uses the rendered matrices, not gesture targets. */
export function pickHeart(point: ScreenPoint, rect: { left: number; top: number; width: number; height: number },
  camera: THREE.Camera, scene: THREE.Object3D, index: SelectionIndex, raycaster: THREE.Raycaster): SelectionResult {
  if (rect.width <= 0 || rect.height <= 0 || point.x < rect.left || point.y < rect.top
    || point.x > rect.left + rect.width || point.y > rect.top + rect.height) return { kind: 'empty' };
  scene.updateWorldMatrix(true, true);
  camera.updateWorldMatrix(true, false);
  raycaster.setFromCamera(new THREE.Vector2((point.x - rect.left) / rect.width * 2 - 1, -(point.y - rect.top) / rect.height * 2 + 1), camera);
  const hit = raycaster.intersectObjects(index.meshes, false).find(intersection => visible(intersection.object));
  if (!hit) return { kind: 'empty' };
  const selection = index.byMesh.get(hit.object as THREE.Mesh);
  return selection ? { kind: 'selected', selection } : { kind: 'unknown' };
}

/** Clone only the selected mesh's material; preserve shared source material identity. */
export function highlightHeartMesh(mesh: THREE.Mesh): () => void {
  const original = mesh.material;
  const clones = (Array.isArray(original) ? original : [original]).map(material => {
    const clone = material.clone();
    if (clone instanceof THREE.MeshStandardMaterial) {
      clone.emissive.set('#9dcbd2'); clone.emissiveIntensity = 0.24;
    }
    return clone;
  });
  mesh.material = Array.isArray(original) ? clones : clones[0];
  let restored = false;
  return () => {
    if (restored) return;
    restored = true; mesh.material = original;
    // Textures/geometry remain shared; only temporary material clones are owned here.
    clones.forEach(material => material.dispose());
  };
}
