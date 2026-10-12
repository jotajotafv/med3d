import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const out=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(out,'../../..');
const req=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));
const load=async name=>import(pathToFileURL(req.resolve(name)));
const [{NodeIO},{ALL_EXTENSIONS},{MeshoptDecoder}]=await Promise.all([load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('meshoptimizer')]);
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
function geometry(nodes){
 const vertices=[],faces=[],matrices=[];
 for(const node of nodes){const m=node.getWorldMatrix();matrices.push({node:node.getName(),matrix:m});
  for(const p of node.getMesh().listPrimitives()){
   const offset=vertices.length,a=p.getAttribute('POSITION');
   for(let i=0;i<a.getCount();i++){const [x,y,z]=a.getElement(i,[]);vertices.push([m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]);}
   const ix=p.getIndices()?.getArray()||Array.from({length:a.getCount()},(_,i)=>i);
   for(let i=0;i<ix.length;i+=3)faces.push([ix[i]+offset,ix[i+1]+offset,ix[i+2]+offset]);
  }
 }
 return {vertices,faces,matrices};
}
const audit=JSON.parse(await fs.readFile(path.join(root,'docs/anatomical-gaps-audit.json'),'utf8'));
const baselineAssets=new Set(audit.currentInventory.assets.map(a=>a.id));
const soft={};
for(const system of ['muscular','digestive','respiratory','urinary','reproductive','integumentary','ocular','nervous','cardiovascular','endocrine']){
 const cat=JSON.parse(await fs.readFile(path.join(root,'public/models/anatomy',system,'catalog.json'),'utf8'));
 const selected=cat.nodes.filter(n=>n.meshNames.length);
 for(const asset of cat.assets.filter(a=>selected.some(n=>n.assetIds.includes(a.id)))){
  const doc=await io.read(path.join(root,'public',asset.path));
  for(const n of selected.filter(n=>n.assetIds.includes(asset.id))){
   const data=geometry(doc.getRoot().listNodes().filter(x=>x.getMesh()&&n.meshNames.includes(x.getName())));
   if(!data.faces.length)continue;
   soft[n.id]={id:n.id,name:n.name,system,sourceId:n.sourceId,aliases:n.aliases,...data};
  }
 }
}
await fs.writeFile(path.join(out,'target-soft.json'),JSON.stringify(soft));
const lock=JSON.parse(await fs.readFile(path.join(out,'hra-source-lock.json')));const report=[];
for(const r of lock.records.filter(r=>r.files))for(const file of r.files.filter(f=>f.file.endsWith('.glb'))){
 const doc=await io.read(path.join(out,'hra',r.name,file.file)),records={};
 for(const node of doc.getRoot().listNodes().filter(n=>n.getMesh()))records[node.getName()]=geometry([node]);
 await fs.writeFile(path.join(out,'hra',r.name,'geometry.json'),JSON.stringify(records));
 report.push({name:r.name,nodes:Object.entries(records).map(([name,g])=>({name,vertices:g.vertices.length,triangles:g.faces.length,bounds:[0,1].map(end=>[0,1,2].map(i=>g.vertices.reduce((v,p)=>end?Math.max(v,p[i]):Math.min(v,p[i]),end?-Infinity:Infinity)))}))});
 console.log(r.name,Object.keys(records).length);
}
await fs.writeFile(path.join(out,'hra-geometry-inventory.json'),JSON.stringify(report,null,2)+'\n');
console.log('Current soft controls',Object.keys(soft).length);
