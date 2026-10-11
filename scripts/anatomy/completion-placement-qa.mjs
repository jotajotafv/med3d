import {readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MeshoptDecoder} from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import {MeshBVH} from 'three-mesh-bvh';
const cats=await Promise.all(['skeletal','muscular','digestive','respiratory','ocular','nervous'].map(async s=>JSON.parse(await readFile('public/models/anatomy/'+s+'/catalog.json','utf8'))));
const nodes=new Map(cats.flatMap(c=>c.nodes).map(n=>[n.id,n])),assets=new Map(cats.flatMap(c=>c.assets).map(a=>[a.id,a]));
const pairs=[['bp3d:FMA13295','dig:FMA7197'],['bp3d:FMA13295','resp:lung:right'],['bp3d:FMA13295','resp:lung:left'],['bp3d:FMA13295','skeletal:region:thorax'],['bp3d:FMA13295','skeletal:group:spine:lumbarvertebrae'],['ocular:FMA58242','ocular:FMA12514'],['ocular:FMA58243','ocular:FMA12515'],['ocular:FMA58607','ocular:FMA12514'],['ocular:FMA58608','ocular:FMA12515'],['bp3d:FMA45858','bp3d:FMA45859'],['bp3d:FMA45854','bp3d:FMA45855'],['bp3d:FMA45856','bp3d:FMA45857']];
function descendants(id){const n=nodes.get(id);return [n,...n.children.flatMap(descendants)];}
const targetNodes=[...new Map(pairs.flatMap(p=>p.flatMap(descendants)).map(n=>[n.id,n])).values()];
const needed=[...new Set(targetNodes.flatMap(n=>n.assetIds))],parts=new Map(),loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
for(const id of needed){const bytes=await readFile('public/'+assets.get(id).path),g=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');g.scene.updateMatrixWorld(true);g.scene.traverse(m=>{if(!m.isMesh)return;const owner=targetNodes.find(n=>n.meshNames.includes(m.name));if(!owner)return;const geometry=m.geometry.clone().applyMatrix4(m.matrixWorld),bvh=new MeshBVH(geometry);const arr=parts.get(owner.id)||[];arr.push({name:m.name,geometry,bvh});parts.set(owner.id,arr);});}
const report={frame:'bodyparts3d-4.0-male',transform:[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],registration:'No registration fitted. Original coordinates retained.',method:'Triangle/triangle surface crossings on independently decoded world-coordinate meshes using MeshBVH; coplanar contact is included. Counts are not penetration volume or clinical accuracy. Visual review required.',pairs:[]};
for(const [a,b] of pairs){let intersections=0,tested=0;const crossingBox=new THREE.Box3(),segment=new THREE.Line3();
 for(const na of descendants(a))for(const pa of parts.get(na.id)||[])for(const nb of descendants(b))for(const pb of parts.get(nb.id)||[]){if(pa===pb)continue;tested++;pa.bvh.bvhcast(pb.bvh,new THREE.Matrix4(),{intersectsTriangles:(ta,tb)=>{if(ta.intersectsTriangle(tb,segment)){intersections++;if(Number.isFinite(segment.start.x)&&Number.isFinite(segment.end.x)){crossingBox.expandByPoint(segment.start);crossingBox.expandByPoint(segment.end);}}return false;}});}

 // Deterministic vertex samples: classify against each closed target piece by
 // three independent parity rays, then measure nearest-surface distance.
 const sources=descendants(a).flatMap(n=>parts.get(n.id)||[]),targets=descendants(b).flatMap(n=>parts.get(n.id)||[]).filter(p=>!sources.includes(p));
 const pointMap=new Map();for(const part of sources){const attr=part.geometry.getAttribute('position');for(let i=0;i<attr.count;i++){const p=new THREE.Vector3().fromBufferAttribute(attr,i);pointMap.set(p.toArray().join(','),p);}}
 const points=[...pointMap.values()].filter((_,i)=>i%Math.max(1,Math.ceil(pointMap.size/1024))===0);
 const directions=[[1,.173,.367],[.291,1,.419],[.137,.233,1]].map(v=>new THREE.Vector3(...v).normalize());let inside=0,maxDepth=0,over1mm=0,over3mm=0;
 for(const point of points){let depth=0;for(const part of targets){if(!part.geometry.boundingBox.containsPoint(point))continue;let votes=0;
 for(const dir of directions){const hits=part.bvh.raycast(new THREE.Ray(point,dir),THREE.DoubleSide).map(h=>h.distance).filter(d=>d>1e-7).sort((a,b)=>a-b);const unique=hits.filter((d,i)=>!i||d-hits[i-1]>1e-7);if(unique.length%2===1)votes++;}
 if(votes===3){const nearest=part.bvh.closestPointToPoint(point);if(nearest)depth=Math.max(depth,nearest.distance);}}
 if(depth>1e-5){inside++;maxDepth=Math.max(maxDepth,depth);if(depth>.001)over1mm++;if(depth>.003)over3mm++;}}
 const interiorSamples={sampleCount:points.length,allRayVotesInsideAndBeyond001mm:inside,over1mm,over3mm,maxDepthMetres:maxDepth,scope:'Sampling screen, not a proof of closed topology or penetration volume. Contacts within 0.01 mm excluded.'};
 report.pairs.push({a,b,meshPairs:tested,interiorSamples,intersectingTrianglePairs:intersections,crossingBoundsMetres:crossingBox.isEmpty()?null:[crossingBox.min.toArray(),crossingBox.max.toArray()]});console.log(a,b,intersections);
}
await writeFile('.cache/anatomy-completion/wave1/native-placement.json',JSON.stringify(report,null,2)+'\n');
