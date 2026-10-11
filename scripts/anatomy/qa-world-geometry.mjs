import * as THREE from 'three';

/** Expand normalized integer accessors before baking a world matrix. Applying
 * metre coordinates in-place to normalized integers would quantize/wrap them. */
export function qaWorldGeometry(mesh) {
  const source=mesh.geometry,position=source.getAttribute('position');
  const values=new Float32Array(position.count*3);
  for(let i=0;i<position.count;i++){
    values[i*3]=position.getX(i);values[i*3+1]=position.getY(i);values[i*3+2]=position.getZ(i);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(values,3));
  if(source.index)geometry.setIndex(source.index.clone());
  geometry.setDrawRange(source.drawRange.start,source.drawRange.count);
  for(const group of source.groups)geometry.addGroup(group.start,group.count,group.materialIndex);
  geometry.applyMatrix4(mesh.matrixWorld);geometry.computeBoundingBox();
  return geometry;
}
