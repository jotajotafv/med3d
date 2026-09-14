#!/usr/bin/env node
/** Compress a freshly generated skeleton while validating its individual mesh contract. */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const args=process.argv.slice(2);
const option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const out=path.resolve(option('--output','public/models/anatomy/skeletal'));
const toolsDir=path.resolve(option('--tools-dir',process.cwd()));
const require=createRequire(path.join(toolsDir,'package.json'));
const imp=async name=>import(pathToFileURL(require.resolve(name)).href);
const [{NodeIO,getBounds},{ALL_EXTENSIONS},{meshopt},{MeshoptEncoder,MeshoptDecoder}]=await Promise.all([
  imp('@gltf-transform/core'),imp('@gltf-transform/extensions'),imp('@gltf-transform/functions'),imp('meshoptimizer')
]);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const catalog=JSON.parse(await fs.readFile(path.join(out,'catalog.json'),'utf8'));
const manifest=JSON.parse(await fs.readFile(path.join(out,'source-manifest.json'),'utf8'));
const sourceTriangles=new Map(manifest.files.map(f=>[f.elementId,f.triangles]));
const report={pipeline:'@gltf-transform 4.5.0; meshoptimizer 1.2.0',positionBits:16,normalBits:12,additionalDecimation:false,
  modules:[],totalBytes:0,totalTriangles:0,totalMeshes:0,maxBoundsErrorMetres:0};
for(const asset of catalog.assets){
  const file=path.join(out,path.basename(asset.path));
  const doc=await io.read(file);
  if(doc.getRoot().listExtensionsUsed().some(e=>e.extensionName==='EXT_meshopt_compression'))throw Error('Run build-skeleton.py first; do not repeatedly quantize compressed output.');
  const before=doc.getRoot().listNodes().filter(n=>n.getMesh()).map(n=>n.getName()).sort();
  await doc.transform(meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizationVolume:'mesh'}));
  await io.write(file,doc);
  const verified=await io.read(file);
  const meshNodes=verified.getRoot().listNodes().filter(n=>n.getMesh());
  const names=meshNodes.map(n=>n.getName()).sort();
  if(JSON.stringify(before)!==JSON.stringify(names))throw Error('Mesh names lost in '+asset.id);
  const expected=catalog.nodes.flatMap(n=>n.assetIds.includes(asset.id)?n.meshNames:[]).sort();
  if(JSON.stringify(expected)!==JSON.stringify(names))throw Error('Catalog/GLB mesh ownership differs in '+asset.id);
  let tri=0,error=0;
  for(const n of meshNodes){
    const owner=catalog.nodes.find(x=>x.meshNames.includes(n.getName()));
    if(!owner)throw Error('Unknown mesh '+n.getName());
    const bounds=getBounds(n);
    for(let i=0;i<3;i++)error=Math.max(error,Math.abs(bounds.min[i]-owner.bounds[0][i]),Math.abs(bounds.max[i]-owner.bounds[1][i]));
    const nt=n.getMesh().listPrimitives().reduce((s,p)=>s+p.getIndices().getCount()/3,0);
    if(nt!==sourceTriangles.get(n.getExtras().sourceElement))throw Error('Triangle count changed for '+n.getName());
    tri+=nt;
  }
  if(error>0.00005)throw Error('Coordinate error exceeds 0.05 mm: '+error+' for '+asset.id);
  const data=await fs.readFile(file);
  asset.bytes=data.byteLength;asset.sha256=crypto.createHash('sha256').update(data).digest('hex');
  if(asset.meshCount!==meshNodes.length||asset.triangles!==tri)throw Error('Asset totals changed: '+asset.id);
  report.modules.push({id:asset.id,bytes:asset.bytes,meshes:meshNodes.length,triangles:tri,maxBoundsErrorMetres:error});
  report.totalBytes+=asset.bytes;report.totalTriangles+=tri;report.totalMeshes+=meshNodes.length;report.maxBoundsErrorMetres=Math.max(report.maxBoundsErrorMetres,error);
}
if(report.totalMeshes!==catalog.coverage.meshes)throw Error('Coverage mismatch');
if(new Set(catalog.nodes.map(n=>n.id)).size!==catalog.nodes.length)throw Error('Duplicate anatomy ID');
for(const n of catalog.nodes){
  for(const id of [...n.children,...n.relatedIds])if(!catalog.nodes.some(x=>x.id===id))throw Error('Broken hierarchy/relation '+id);
  if(n.parentId&&!catalog.nodes.find(x=>x.id===n.parentId)?.children.includes(n.id))throw Error('Broken parent '+n.id);
}
await fs.writeFile(path.join(out,'catalog.json'),JSON.stringify(catalog,null,2)+'\n');
await fs.writeFile(path.join(out,'validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
