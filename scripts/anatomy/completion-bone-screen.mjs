import {qaWorldGeometry} from './qa-world-geometry.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {MeshBVH} from 'three-mesh-bvh';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const cats=await Promise.all(['skeletal','muscular','respiratory','ocular','digestive','nervous','cardiovascular'].map(s=>read('public/models/anatomy/'+s+'/catalog.json')));
const nodes=new Map(cats.flatMap(c=>c.nodes).map(n=>[n.id,n])),assets=cats.flatMap(c=>c.assets);
const audit=await read('docs/anatomical-gaps-audit.json');
const originalBoneAssets=new Set(audit.currentInventory.assets.filter(a=>a.systemId==='skeletal').map(a=>a.id));
const cohorts=await Promise.all(['wave1','wave2'].map(w=>read('research/anatomy/completion-'+w+'-selection.json')));
const targets=cohorts.flatMap(s=>s.nodes.filter(n=>n.sourceElements&&nodes.has(n.id)&&n.systemId!=='integumentary').map(n=>({...n,wave:s.wave})));
const targetIds=new Set(targets.map(n=>n.id)),needed=new Set(targets.flatMap(n=>n.assetIds));
assets.filter(a=>a.systemId==='skeletal'&&a.defaultEnabled!==false).forEach(a=>needed.add(a.id));
const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder),bones=[],parts=new Map();
for(const asset of assets.filter(a=>needed.has(a.id))){const bytes=await readFile('public/'+asset.path),g=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');g.scene.updateMatrixWorld(true);
 g.scene.traverse(m=>{if(!m.isMesh)return;const n=[...nodes.values()].find(n=>n.meshNames.includes(m.name));if(!n)return;
  const geometry=qaWorldGeometry(m);geometry.computeBoundingBox();
  if(originalBoneAssets.has(asset.id)&&n.bounds){const actual=[geometry.boundingBox.min.toArray(),geometry.boundingBox.max.toArray()];for(let j=0;j<2;j++)for(let k=0;k<3;k++)if(Math.abs(actual[j][k]-n.bounds[j][k])>.0002)throw Error('Decoded bone bounds mismatch '+n.id);}
  const p={name:m.name,id:n.id,label:n.name,geometry,box:geometry.boundingBox};
  if(originalBoneAssets.has(asset.id)){p.bvh=new MeshBVH(geometry);bones.push(p);}if(targetIds.has(n.id)){const list=parts.get(n.id)||[];list.push(p);parts.set(n.id,list);}
 });
}
if(bones.length!==205)throw Error('Incomplete historical skeletal controls: '+bones.length);
const directions=[[1,.173,.367],[.291,1,.419],[.137,.233,1]].map(v=>new THREE.Vector3(...v).normalize());
const report={date:new Date().toISOString(),frame:'bodyparts3d-4.0-male',method:'Up to 3072 deterministic unique source vertices per owner; three independent ray parity votes inside an original skeletal mesh and closest-surface depth. Numerical screening only; closedness and visual/anatomical review required. No relocation.',bones:bones.length,results:[]};
for(const n of targets){const all=new Map();for(const p of parts.get(n.id)||[]){const a=p.geometry.getAttribute('position');for(let i=0;i<a.count;i++){const v=new THREE.Vector3().fromBufferAttribute(a,i);all.set(v.toArray().join(','),v);}}
 const points=[...all.values()].filter((_,i)=>i%Math.max(1,Math.ceil(all.size/3072))===0),hits=new Map();
 for(const point of points)for(const bone of bones){if(!bone.box.containsPoint(point))continue;let votes=0;
  for(const dir of directions){const hits=bone.bvh.raycast(new THREE.Ray(point,dir),THREE.DoubleSide).map(h=>h.distance).filter(d=>d>1e-7).sort((a,b)=>a-b);const unique=hits.filter((d,i)=>!i||d-hits[i-1]>1e-7);if(unique.length%2===1)votes++;}
  if(votes!==3)continue;const nearest=bone.bvh.closestPointToPoint(point);if(!nearest||nearest.distance<=.00001)continue;
  const entry=hits.get(bone.id)||{bone:bone.id,name:bone.label,samples:0,over1mm:0,over3mm:0,maxDepthMm:0,deepestPointMetres:null};entry.samples++;if(nearest.distance>.001)entry.over1mm++;if(nearest.distance>.003)entry.over3mm++;
  if(nearest.distance*1000>entry.maxDepthMm){entry.maxDepthMm=nearest.distance*1000;entry.deepestPointMetres=point.toArray();entry.nearestSurfaceMetres=nearest.point.toArray();}hits.set(bone.id,entry);
 }
 const row={wave:n.wave,id:n.id,name:n.name,sampleCount:points.length,contacts:[...hits.values()].sort((a,b)=>b.maxDepthMm-a.maxDepthMm)};report.results.push(row);
 if(row.contacts.some(c=>c.over3mm))console.log('REVIEW',n.wave,n.id,n.name,row.contacts[0].maxDepthMm.toFixed(2)+' mm');
}
await writeFile('.cache/anatomy-completion/wave2/bone-screen.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({owners:targets.length,over3mm:report.results.filter(r=>r.contacts.some(c=>c.over3mm)).length}));
