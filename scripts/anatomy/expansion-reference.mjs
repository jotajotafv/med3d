/** Read-only decode of existing bones for registration; no historical GLB rebuild. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const req=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));
const load=async n=>import(pathToFileURL(req.resolve(n)));
const [{NodeIO},{ALL_EXTENSIONS},{MeshoptDecoder}]=await Promise.all([load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('meshoptimizer')]);
await MeshoptDecoder.ready;const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const catalog=JSON.parse(await fs.readFile(path.join(root,'public/models/anatomy/skeletal/catalog.json'),'utf8')),results={};
for(const asset of catalog.assets){
 const doc=await io.read(path.join(root,'public',asset.path));
 for(const owner of catalog.nodes.filter(n=>n.meshNames.length&&n.assetIds.includes(asset.id))){
  const vertices=[],faces=[];
  for(const node of doc.getRoot().listNodes().filter(n=>owner.meshNames.includes(n.getName()))){
   const m=node.getWorldMatrix();
   for(const prim of node.getMesh().listPrimitives()){
    const offset=vertices.length,p=prim.getAttribute('POSITION'),ix=prim.getIndices().getArray();
    for(let i=0;i<p.getCount();i++){const [x,y,z]=p.getElement(i,[]);vertices.push([m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]]);}
    for(let i=0;i<ix.length;i+=3)faces.push([ix[i]+offset,ix[i+1]+offset,ix[i+2]+offset]);
   }
  }
  results[owner.id]={vertices,faces};
 }
}
const out=path.join(root,'.cache/phase4-expansion');await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'bp-reference.json'),JSON.stringify(results));console.log('Decoded',Object.keys(results).length,'existing bone references; no files under public changed.');
