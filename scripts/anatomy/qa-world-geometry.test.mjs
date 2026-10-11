import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {qaWorldGeometry} from './qa-world-geometry.mjs';

test('normalized source positions are expanded before the world transform, without mutating source geometry',()=>{
 const raw=new Uint16Array([0,32768,65535,65535,0,32768,32768,65535,0]);
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(raw,3,true));
 geometry.setIndex([0,1,2]);geometry.addGroup(0,3,0);
 const mesh=new THREE.Mesh(geometry);mesh.position.set(-.12,.967,-.05);mesh.scale.set(.1,.042,.2);mesh.rotation.y=.4;mesh.updateMatrixWorld(true);
 const expected=Array.from({length:3},(_,i)=>new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld));
 const original=Array.from(raw),result=qaWorldGeometry(mesh);
 assert.ok(result.getAttribute('position').array instanceof Float32Array);
 expected.forEach((v,i)=>assert.ok(v.distanceTo(new THREE.Vector3().fromBufferAttribute(result.getAttribute('position'),i))<1e-7));
 assert.deepEqual(Array.from(raw),original);assert.deepEqual(Array.from(result.index.array),[0,1,2]);
 assert.deepEqual(result.groups,geometry.groups);
 assert.ok(result.boundingBox.min.y>.96&&result.boundingBox.max.y<1.02);
 assert.notEqual(result.index,geometry.index);
});
