/** Lossless conversion of the four approved W3 owners; no source/target model mutation. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.resolve(process.argv.includes('--output')?process.argv[process.argv.indexOf('--output')+1]:path.join(root,'.cache/anatomy-completion/wave3/build'));
const verifyOnly=process.argv.includes('--verify-only'),install=process.argv.includes('--install');
assert.ok(!(verifyOnly&&install));
const json=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const write=async(n,v)=>fs.writeFile(path.join(output,n),JSON.stringify(v,null,2)+'\n');
const req=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));
const load=async n=>import(pathToFileURL(req.resolve(n)));
const [{Document,NodeIO},{ALL_EXTENSIONS,EXTMeshoptCompression,KHRMeshQuantization},{reorder,quantize},{MeshoptEncoder,MeshoptDecoder},validator]=await Promise.all([load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('@gltf-transform/functions'),load('meshoptimizer'),load('gltf-validator')]);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const prefix='research/anatomy/completion-wave3';
const selection=await json(prefix+'-selection.json'),lock=await json(prefix+'-source-lock.json'),acceptance=await json(prefix+'-acceptance.json');
assert.equal(hash(await fs.readFile(path.join(root,prefix+'-selection.json'))),lock.selectionSha256);
assert.equal(acceptance.selectionSha256,lock.selectionSha256);
assert.deepEqual(selection.nodes.map(n=>n.id),acceptance.acceptedNodeIds);
const registration=await json(prefix+'/registration.json');
assert.equal(hash(await fs.readFile(path.join(root,prefix+'/registration.json'))),lock.registrationSha256);
const catalog=await json(prefix+'/base-muscular-catalog.json');
assert.equal(hash(await fs.readFile(path.join(root,prefix+'/base-muscular-catalog.json'))),lock.baseCatalogSha256);
const base=structuredClone(catalog),zip=path.join(root,prefix+'-originals.zip');
assert.equal(hash(await fs.readFile(zip)),lock.sourceZipSha256);
const extracted=spawnSync(process.env.ANATOMY_PYTHON||'python',['-c','import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("world-geometry.json"))',zip],{encoding:'utf8',maxBuffer:16*1024*1024});
if(extracted.status!==0)throw Error(extracted.stderr);
const originals=JSON.parse(extracted.stdout),approved=selection.nodes.map(n=>({...n,module:n.assetIds[0]}));
const transform=(p,m)=>m.slice(0,3).map(r=>r[0]*p[0]+r[1]*p[1]+r[2]*p[2]+r[3]);
const bounds=positions=>[0,1].map(end=>[0,1,2].map(axis=>positions.reduce((v,p)=>end?Math.max(v,p[axis]):Math.min(v,p[axis]),end?-Infinity:Infinity)));
const union=boxes=>[0,1].map(end=>[0,1,2].map(axis=>end?Math.max(...boxes.map(b=>b[end][axis])):Math.min(...boxes.map(b=>b[end][axis]))));
const byId=new Map(catalog.nodes.map(n=>[n.id,n])),originalByMesh=new Map();
for(const r of approved){
 assert.ok(!byId.has(r.id));assert.ok(byId.has(r.parentId));
 const source=originals[r.sourceObject],matrix=registration.regions[r.registrationRegion].matrix;
 const positions=source.positions.map(p=>transform(p,matrix));
 const n={...r,bounds:bounds(positions)};delete n.module;delete n.sourceObject;delete n.registrationRegion;delete n.gaps;
 catalog.nodes.push(n);byId.set(n.id,n);byId.get(n.parentId).children.push(n.id);
 originalByMesh.set(n.meshNames[0],{r,n,positions,faces:source.faces,matrix});
}
const ancestors=new Set();for(const r of approved){let p=r.parentId;while(p){ancestors.add(p);p=byId.get(p).parentId;}}
function aggregate(id){const n=byId.get(id);for(const child of n.children)aggregate(child);if(ancestors.has(id)){n.bounds=union(n.children.map(c=>byId.get(c).bounds));n.assetIds=[...new Set([...n.assetIds,...n.children.flatMap(c=>byId.get(c).assetIds)])];}}
aggregate('muscular');for(const n of base.nodes)if(!ancestors.has(n.id))assert.deepEqual(byId.get(n.id),n);
catalog.education={...catalog.education,...selection.education};
const provenanceId='z-anatomy-completion-wave3';
catalog.provenance.push({id:provenanceId,source:'Z-Anatomy · musculatura dorsal del pie',author:'Gauthier Kervyn y colaboradores; BodyParts3D, Kousaku Okubo / DBCLS',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',version:lock.sourceCommit,originalUrl:'https://github.com/Z-Anatomy/Models-of-human-anatomy/tree/'+lock.sourceCommit,attribution:'Z-Anatomy — CC BY-SA 4.0. BodyParts3D — DBCLS — CC BY-SA 2.1 Japan (crédito original).',modifications:['Cuatro mallas originales evaluadas en Blender 5.1; conserva matrices y reflejos ya presentes en la fuente, con orientación de triángulos corregida al exportar. No se genera un lado a partir del otro.','Una similitud global y una transformación rígida por pie, compartida por todos los candidatos de cada región. Sin deformación, cortes, subdivisión artificial ni simplificación añadida.','Float32 y Meshopt; cuantización sólo de normales. Derivados y originales seleccionados bajo CC BY-SA 4.0.','Interóseos dorsales agrupados por lado. Contactos esquemáticos locales documentados; sin precisión clínica acreditada.']});
const report={wave:3,sourceZipSha256:lock.sourceZipSha256,positionBits:32,positionQuantization:false,additionalDecimation:false,modules:[],totalMeshes:0,totalTriangles:0,totalBytes:0,maxPositionErrorMetres:0};
const manifest={provenanceId,source:catalog.provenance.at(-1),registration:prefix+'/registration.json',uniformScale:registration.globalSimilarity.scale,matrices:Object.fromEntries(Object.entries(registration.regions).map(([k,v])=>[k,v.matrix])),sourceZipSha256:lock.sourceZipSha256,files:[]};
const canonical=(a,b,c)=>[a+','+b+','+c,b+','+c+','+a,c+','+a+','+b].sort()[0];
await fs.mkdir(output,{recursive:true});
if(!verifyOnly)for(const m of selection.modules){try{await fs.access(path.join(output,m.id.split(':')[1]+'.glb'));throw Error('Output exists; use --verify-only or a new --output');}catch(e){if(e.code!=='ENOENT')throw e;}}
for(const moduleId of [...new Set(approved.map(r=>r.module))].sort()){
 const elements=[...originalByMesh.values()].filter(e=>e.r.module===moduleId),filename=moduleId.split(':')[1]+'.glb',file=path.join(output,filename);
 if(!verifyOnly){
  const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene();
  const material=doc.createMaterial('Muscular').setBaseColorFactor([.48,.12,.12,1]).setMetallicFactor(0).setRoughnessFactor(.8);
  for(const e of elements){
   const p=Float32Array.from(e.positions.flat()),normals=new Float32Array(p.length);
   for(const [a,b,c] of e.faces){const ab=[0,1,2].map(i=>p[b*3+i]-p[a*3+i]),ac=[0,1,2].map(i=>p[c*3+i]-p[a*3+i]);const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];for(const v of [a,b,c])for(let i=0;i<3;i++)normals[v*3+i]+=n[i];}
   for(let i=0;i<normals.length;i+=3){const length=Math.hypot(...normals.slice(i,i+3));assert.ok(length>0,'Degenerate source normal');for(let k=0;k<3;k++)normals[i+k]/=length;}
   const accessor=(name,array,type)=>doc.createAccessor(name).setArray(array).setType(type).setBuffer(buffer);
   const primitive=doc.createPrimitive().setAttribute('POSITION',accessor('POSITION',p,'VEC3')).setAttribute('NORMAL',accessor('NORMAL',normals,'VEC3')).setIndices(accessor('indices',e.positions.length<65536?Uint16Array.from(e.faces.flat()):Uint32Array.from(e.faces.flat()),'SCALAR')).setMaterial(material);
   const mesh=doc.createMesh(e.n.meshNames[0]).addPrimitive(primitive);
   scene.addChild(doc.createNode(e.n.meshNames[0]).setMesh(mesh).setExtras({anatomyId:e.r.id,sourceObject:e.r.sourceObject,provenanceId}));
  }
  await doc.transform(reorder({encoder:MeshoptEncoder,target:'size'}),quantize({pattern:/^NORMAL$/,patternTargets:/^NORMAL$/,quantizeNormal:12}));
  doc.createExtension(KHRMeshQuantization).setRequired(true);doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method:EXTMeshoptCompression.EncoderMethod.QUANTIZE});await io.write(file,doc);
 }
 const data=await fs.readFile(file),doc=await io.readBinary(data),meshNodes=doc.getRoot().listNodes().filter(n=>n.getMesh()),module={id:moduleId,bytes:data.length,sha256:hash(data),meshes:meshNodes.length,triangles:0,decodedAccessorBytes:0,elements:[]};
 assert.equal(meshNodes.length,elements.length);
 for(const node of meshNodes){
  const e=originalByMesh.get(node.getName());assert.ok(e);assert.equal(node.getExtras().anatomyId,e.r.id);
  const map=new Map(),sourceMap=[];
  for(const p of e.positions){const key=Float32Array.from(p).join(',');if(!map.has(key))map.set(key,map.size);sourceMap.push(map.get(key));}
  const expected=new Map();for(const f of e.faces){const key=canonical(...f.map(i=>sourceMap[i]));expected.set(key,(expected.get(key)||0)+1);}
  let maxError=0,triangles=0;const used=new Set(),decodedPositions=[];
  assert.deepEqual(node.getWorldMatrix(),[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],'No hidden output transform');
  const originalPositions=new Map(e.positions.map((p,i)=>[sourceMap[i],p]));
  for(const primitive of node.getMesh().listPrimitives()){
   const position=primitive.getAttribute('POSITION'),indices=primitive.getIndices(),remap=[];assert.equal(position.getComponentType(),5126);
   for(let i=0;i<position.getCount();i++){const p=position.getElement(i,[]),index=map.get(p.join(','));assert.notEqual(index,undefined,'Lossless Float32 positions');decodedPositions.push(p);remap.push(index);used.add(index);maxError=Math.max(maxError,Math.hypot(...p.map((v,a)=>v-originalPositions.get(index)[a])));}
   const ix=indices.getArray();for(let i=0;i<ix.length;i+=3){const key=canonical(remap[ix[i]],remap[ix[i+1]],remap[ix[i+2]]),count=expected.get(key);assert.ok(count>0,'Oriented source triangle retained');expected.set(key,count-1);triangles++;}
  }
  assert.ok([...expected.values()].every(n=>n===0));assert.equal(used.size,new Set(e.faces.flat().map(i=>sourceMap[i])).size);assert.ok(maxError<1e-7);
  const decodedBounds=bounds(decodedPositions);for(let end=0;end<2;end++)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(decodedBounds[end][axis]-e.n.bounds[end][axis])<1e-7,'Decoded bounds');
  module.triangles+=triangles;module.elements.push({id:e.r.id,sourceObject:e.r.sourceObject,triangles,maxPositionErrorMetres:maxError,triangleMultisetAndWindingPreserved:true});report.maxPositionErrorMetres=Math.max(report.maxPositionErrorMetres,maxError);
  manifest.files.push({...e.r.geometry,anatomyId:e.r.id,meshName:node.getName(),side:e.r.side,moduleId,transform:e.matrix,boundsMetres:e.n.bounds,originalGeometrySha256:hash(JSON.stringify(originals[e.r.sourceObject]))});
 }
 const accessors=new Set(meshNodes.flatMap(n=>n.getMesh().listPrimitives().flatMap(p=>[...p.listAttributes(),p.getIndices()])));module.decodedAccessorBytes=[...accessors].reduce((sum,a)=>sum+a.getArray().byteLength,0);
 const raw=await validator.validateBytes(new Uint8Array(data),{uri:filename});assert.equal(raw.issues.numErrors,0);assert.equal(raw.issues.numWarnings,0);
 doc.getRoot().listExtensionsUsed().filter(e=>e.extensionName==='EXT_meshopt_compression').forEach(e=>e.dispose());const decoded=await validator.validateBytes(await io.writeBinary(doc),{uri:'decoded-'+filename});assert.equal(decoded.issues.numErrors,0);assert.equal(decoded.issues.numWarnings,0);
 module.gltfValidation={rawErrors:0,rawWarnings:0,decodedErrors:0,decodedWarnings:0};
 catalog.assets.push({id:moduleId,path:'models/anatomy/muscular/'+filename,systemId:'muscular',regionId:elements[0].n.regionId,defaultEnabled:false,label:selection.modules.find(m=>m.id===moduleId).label,frameId:catalog.frame.id,bytes:module.bytes,sha256:module.sha256,meshCount:module.meshes,triangles:module.triangles,bounds:union(elements.map(e=>e.n.bounds)),provenanceId});
 report.modules.push(module);report.totalBytes+=module.bytes;report.totalMeshes+=module.meshes;report.totalTriangles+=module.triangles;
}

catalog.coverage.structures=catalog.nodes.filter(n=>n.kind==='structure').length;
catalog.coverage.meshes=catalog.nodes.reduce((sum,n)=>sum+n.meshNames.length,0);
catalog.coverage.note='Cobertura muscular parcial; incluye ampliaciones opcionales y conjuntos originales sin individualización artificial.';
catalog.coverage.limitations.push('Wave 3: EDB bilateral e interóseos dorsales del pie agregados por lado, registrados con controles óseos. No incluye los nervios plantares ni los retináculos candidatos.');
if(verifyOnly){assert.deepEqual(await json(path.relative(root,path.join(output,'catalog.json'))),catalog);assert.deepEqual(await json(path.relative(root,path.join(output,'validation.json'))),report);}
else{await write('catalog.json',catalog);await write('manifest.json',manifest);await write('validation.json',report);}
if(install){
 const dest=path.join(root,'public/models/anatomy/muscular');assert.equal(hash(await fs.readFile(path.join(dest,'catalog.json'))),lock.baseCatalogSha256,'Install only over the pinned W2 catalog');
 for(const m of selection.modules){const filename=m.id.split(':')[1]+'.glb';await fs.copyFile(path.join(output,filename),path.join(dest,filename),1);}
 await fs.copyFile(path.join(output,'catalog.json'),path.join(dest,'catalog.json'));
 for(const f of ['validation.json','manifest.json'])await fs.copyFile(path.join(output,f),path.join(root,prefix,f));
}
console.log(JSON.stringify({meshes:report.totalMeshes,triangles:report.totalTriangles,bytes:report.totalBytes,maxPositionErrorMetres:report.maxPositionErrorMetres,verifyOnly,install},null,2));
