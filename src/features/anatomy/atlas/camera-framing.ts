import * as THREE from 'three';
import type { AtlasAnatomicalView } from './types';

/** BodyParts3D's registered viewer frame: +X left, +Y superior, +Z anterior. */
export const ANATOMICAL_VIEWS: Record<AtlasAnatomicalView, { direction: THREE.Vector3; up: THREE.Vector3 }> = {
  anterior: { direction: new THREE.Vector3(0, 0, 1), up: new THREE.Vector3(0, 1, 0) },
  posterior: { direction: new THREE.Vector3(0, 0, -1), up: new THREE.Vector3(0, 1, 0) },
  left: { direction: new THREE.Vector3(1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  right: { direction: new THREE.Vector3(-1, 0, 0), up: new THREE.Vector3(0, 1, 0) },
  superior: { direction: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) },
  inferior: { direction: new THREE.Vector3(0, -1, 0), up: new THREE.Vector3(0, 0, 1) },
};

/** Fit all eight corners in camera space, including the depth of each corner.
 * A world X/Y fit clips deep or oblique selections. Absolute minimum distances
 * also prevent meaningful close-ups of carpal bones and other small structures.
 */
export function fitCameraBounds(bounds: THREE.Box3, verticalFov: number, aspect: number,
  suppliedDirection: THREE.Vector3, suppliedUp: THREE.Vector3, padding = 1.18) {
  const target = bounds.getCenter(new THREE.Vector3());
  const direction = suppliedDirection.clone().normalize();
  if (!direction.lengthSq()) direction.set(0, 0, 1);
  const up = suppliedUp.clone().normalize();
  if (!up.lengthSq()) up.set(0, 1, 0);
  if (Math.abs(direction.dot(up)) > .9999) up.set(0, 0, Math.abs(direction.z) < .9 ? 1 : 0);
  if (!up.lengthSq() || Math.abs(direction.dot(up)) > .9999) up.set(1, 0, 0);
  const right = new THREE.Vector3().crossVectors(up, direction).normalize();
  const vertical = new THREE.Vector3().crossVectors(direction, right).normalize();
  const orientation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, vertical, direction));
  const tanY = Math.tan(THREE.MathUtils.degToRad(verticalFov) / 2), tanX = tanY * Math.max(aspect, .001);
  const radius = Math.max(bounds.getSize(new THREE.Vector3()).length() / 2, .00001);
  const near = Math.min(.005, Math.max(.000001, radius * .015));
  const minDistance = radius + near * 2;
  let distance = minDistance;
  for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
    const corner = new THREE.Vector3(x, y, z).sub(target), depth = corner.dot(direction);
    distance = Math.max(distance, depth + padding * Math.abs(corner.dot(right)) / tanX,
      depth + padding * Math.abs(corner.dot(vertical)) / tanY, depth + near * 2);
  }
  return { target, position: target.clone().addScaledVector(direction, distance), distance, minDistance, near, up, orientation };
}
