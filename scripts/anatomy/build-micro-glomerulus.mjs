/** Preserve original GLB graph, materials, attributes and index order under lossless Meshopt. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const require=createRequire(path.resolve('.cache/anatomy-tools/package.json'));
const load=async name=>import(pathToFileURL(require.resolve(name)).href);
const [{NodeIO,getBounds},{ALL_EXTENSIONS,EXTMeshoptCompression},{MeshoptEncoder,MeshoptDecoder},validator]=await Promise.all([load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('meshoptimizer'),load('gltf-validator')]);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const sourcePath='.cache/anatomy-completion/wave5/glomerulus-original-retry.glb';
const target='public/models/anatomy/micro/glomerulus.glb',output='research/anatomy/completion-wave5/glomerulus-validation.json';
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const original=await fs.readFile(sourcePath);
assert.equal(hash(original),'2c0a6f005aad31991fa247dea4602b258e9f0416990596ff604b80045882f52e');
const source=await io.readBinary(original);
if(!process.argv.includes('--verify-only')){
 const doc=await io.readBinary(original);
 doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});
 await io.write(target,doc);
}
const bytes=await fs.readFile(target),decoded=await io.readBinary(bytes);
const report={sourceSha256:hash(original),sourceBytes:original.length,sha256:hash(bytes),bytes:bytes.length,method:'Lossless Meshopt only. No vertex reordering, quantization, decimation, repair or coordinate transform. All decoded attributes compared byte-for-byte; each ordered triangle retains its three indices and winding (Meshopt may cyclically rotate a triangle). Graph, transforms, material properties and bounds preserved.',meshes:0,triangles:0,vertices:0,decodedAccessorBytes:0,nodes:[],bounds:getBounds(decoded.getRoot().getDefaultScene()),bodyRegistration:null};
const sourceNodes=source.getRoot().listNodes(),finalNodes=decoded.getRoot().listNodes();assert.equal(finalNodes.length,sourceNodes.length);
for(let i=0;i<sourceNodes.length;i++){
 const a=sourceNodes[i],b=finalNodes[i];assert.equal(a.getName(),b.getName());assert.deepEqual(a.getMatrix(),b.getMatrix());assert.deepEqual(a.listChildren().map(n=>n.getName()),b.listChildren().map(n=>n.getName()));
 if(!a.getMesh())continue;
 const ap=a.getMesh().listPrimitives(),bp=b.getMesh().listPrimitives();assert.equal(ap.length,bp.length);report.meshes++;
 const item={name:a.getName(),triangles:0,vertices:0};
 for(let j=0;j<ap.length;j++){
  assert.equal(ap[j].getMode(),bp[j].getMode());assert.deepEqual(ap[j].listSemantics(),bp[j].listSemantics());
  for(const semantic of [...ap[j].listSemantics(),'INDEX']){
   const x=semantic==='INDEX'?ap[j].getIndices():ap[j].getAttribute(semantic),y=semantic==='INDEX'?bp[j].getIndices():bp[j].getAttribute(semantic);
   assert.equal(x.getComponentType(),y.getComponentType());assert.equal(x.getNormalized(),y.getNormalized());assert.equal(x.getType(),y.getType());
   const u=x.getArray(),v=y.getArray();assert.equal(u.byteLength,v.byteLength);
   if(semantic==='INDEX')for(let k=0;k<u.length;k+=3)assert.ok([0,1,2].some(offset=>[0,1,2].every(t=>u[k+t]===v[k+(t+offset)%3])),a.getName()+' oriented triangle '+k/3);
   else assert.equal(Buffer.compare(Buffer.from(u.buffer,u.byteOffset,u.byteLength),Buffer.from(v.buffer,v.byteOffset,v.byteLength)),0,a.getName()+' '+semantic);
   report.decodedAccessorBytes+=v.byteLength;
  }
  assert.equal(ap[j].getMaterial()?.getName(),bp[j].getMaterial()?.getName());
  item.triangles+=bp[j].getIndices().getCount()/3;item.vertices+=bp[j].getAttribute('POSITION').getCount();
 }
 report.triangles+=item.triangles;report.vertices+=item.vertices;report.nodes.push(item);
}
const materialProperties=m=>({name:m.getName(),color:m.getBaseColorFactor(),metallic:m.getMetallicFactor(),roughness:m.getRoughnessFactor(),emissive:m.getEmissiveFactor(),alpha:m.getAlphaMode(),cutoff:m.getAlphaCutoff(),doubleSided:m.getDoubleSided()});
assert.deepEqual(source.getRoot().listMaterials().map(materialProperties),decoded.getRoot().listMaterials().map(materialProperties));assert.deepEqual(report.bounds,getBounds(source.getRoot().getDefaultScene()));
const raw=await validator.validateBytes(bytes,{maxIssues:100});
decoded.getRoot().listExtensionsUsed().filter(e=>e.extensionName==='EXT_meshopt_compression').forEach(e=>e.dispose());
const decodedValidation=await validator.validateBytes(await io.writeBinary(decoded),{maxIssues:100});
report.validator={version:validator.version(),raw:raw.issues,decoded:decodedValidation.issues};
assert.equal(raw.issues.numErrors,0);assert.equal(decodedValidation.issues.numErrors,0);
if(process.argv.includes('--verify-only'))assert.deepEqual(report,JSON.parse(await fs.readFile(output,'utf8')));
else await fs.writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
