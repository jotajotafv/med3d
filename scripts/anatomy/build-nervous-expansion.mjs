/** Build only the approved Z-Anatomy expansion. Original Phase 4 assets are read-only.
 * Node dependencies: .cache/anatomy-tools (same pinned tools as the BP3D pipeline).
 * ANATOMY_PYTHON may point to Python 3; it only reads the retained source ZIP.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const output=path.resolve(process.argv.includes('--output')?process.argv[process.argv.indexOf('--output')+1]:path.join(root,'public/models/anatomy/nervous'));
const verifyOnly=process.argv.includes('--verify-only');
const json=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const write=async(n,v)=>fs.writeFile(path.join(output,n),JSON.stringify(v,null,2)+'\n');
const req=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));
const load=async n=>import(pathToFileURL(req.resolve(n)));
const [{Document,NodeIO},{ALL_EXTENSIONS,EXTMeshoptCompression,KHRMeshQuantization},{reorder,quantize},{MeshoptEncoder,MeshoptDecoder},validator]=await Promise.all([load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('@gltf-transform/functions'),load('meshoptimizer'),load('gltf-validator')]);
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const selection=await json('research/anatomy/nervous-expansion-selection.json');
const lock=await json('research/anatomy/nervous-expansion-source-lock.json');
const registration=await json('research/anatomy/nervous-expansion-registration.json');
const catalog=await json('research/anatomy/nervous-expansion-base-catalog.json');
const approved=selection.candidates.filter(r=>r.decision==='APROBADO');
assert.equal(approved.length,38);assert.equal(new Set(approved.map(r=>r.id)).size,38);
const zip=path.join(root,'research/anatomy/nervous-expansion-originals.zip');
assert.equal(hash(await fs.readFile(zip)),lock.sourceZipSha256);
const extracted=spawnSync(process.env.ANATOMY_PYTHON||'python',['-c','import sys,zipfile;sys.stdout.buffer.write(zipfile.ZipFile(sys.argv[1]).read("world-geometry.json"))',zip],{encoding:'utf8',maxBuffer:32*1024*1024});
if(extracted.status!==0)throw Error(extracted.stderr);
assert.equal(hash(extracted.stdout),lock.geometrySha256);
const originals=JSON.parse(extracted.stdout);
const transform=(p,m)=>m.slice(0,3).map(r=>r[0]*p[0]+r[1]*p[1]+r[2]*p[2]+r[3]);
const bounds=positions=>[0,1].map(end=>[0,1,2].map(axis=>positions.reduce((v,p)=>end?Math.max(v,p[axis]):Math.min(v,p[axis]),end?-Infinity:Infinity)));
const union=boxes=>[0,1].map(end=>[0,1,2].map(axis=>end?Math.max(...boxes.map(b=>b[end][axis])):Math.min(...boxes.map(b=>b[end][axis]))));
const byId=new Map(catalog.nodes.map(n=>[n.id,n]));
function add(id,name,parent,region,extra={}){
 assert.ok(!byId.has(id));
 const n={id,name,anatomicalName:name,aliases:[],systemId:'nervous',regionId:region||id,children:[],kind:'region',assetIds:[],meshNames:[],relatedIds:[],parentId:parent,...extra};
 catalog.nodes.push(n);byId.set(id,n);byId.get(parent).children.push(id);return n;
}
add('nervous:upper','Miembros superiores','nervous:pns',undefined,{latin:'Membra superiora',aliases:['upper limb','brazo','antebrazo','mano']});
add('nervous:lower','Miembros inferiores y plexos','nervous:pns',undefined,{latin:'Membra inferiora',aliases:['lower limb','plexo lumbosacro','lumbosacral plexus','pelvis','pierna','pie']});
for(const side of ['right','left']){
 const word=side==='right'?'derecho':'izquierdo';
 for(const region of ['upper','lower'])add('nervous:'+region+'-'+side,'Miembro '+(region==='upper'?'superior':'inferior')+' '+word,'nervous:'+region,undefined,{side,explosionRegionId:(region==='upper'?'upper':'lower')+'-limb-'+side});
 add('nervous:brachial-'+side,'Plexo braquial '+word+' · componentes disponibles','nervous:upper-'+side,'nervous:upper-'+side,{side,neuralType:'plexo parcial',family:'z:brachial-plexus',latin:'Plexus brachialis',aliases:['brachial plexus','plexo braquial'],explosionRegionId:'upper-limb-'+side});
 add('nervous:radial-branches-'+side,'Ramas radiales '+(side==='right'?'derechas':'izquierdas'),'nervous:upper-'+side,'nervous:upper-'+side,{side,neuralType:'ramas disponibles',family:'z:radial-nerve',latin:'Rami nervi radialis',aliases:['nervio radial','radial nerve'],explosionRegionId:'upper-limb-'+side});
 for(const plexus of ['lumbar','sacral'])add('nervous:'+plexus+'-'+side,'Plexo '+(plexus==='lumbar'?'lumbar':'sacro')+' '+word+' · ramas disponibles','nervous:lower-'+side,'nervous:lower-'+side,{side,neuralType:'ramas de plexo',family:'z:'+plexus+'-plexus',latin:'Plexus '+(plexus==='lumbar'?'lumbalis':'sacralis'),aliases:[plexus+' plexus','plexo lumbosacro'],explosionRegionId:'lower-limb-'+side});
}
const originalByMesh=new Map();
for(const r of approved){
 let parent='nervous:'+r.region+'-'+r.side;
 if(r.family==='brachial-plexus')parent='nervous:brachial-'+r.side;
 else if(r.family==='radial-nerve')parent='nervous:radial-branches-'+r.side;
 else if(r.parent==='ulnar-nerve')parent='zanatomy:ulnar-nerve-'+r.side[0];
 else if(r.region==='lower')parent='nervous:'+(['femoral-nerve','lateral-femoral-cutaneous-nerve','iliohypogastric-nerve'].includes(r.family)?'lumbar':'sacral')+'-'+r.side;
 const source=originals[r.id],matrix=registration.regions[r.region].matrix;
 const positions=source.positions.map(p=>transform(p,matrix)),meshName=r.id.replace(':','_');
 const n=add(r.id,r.name,parent,'nervous:'+r.region+'-'+r.side,{kind:r.kind,sourceId:r.sourceObject,latin:r.latin,family:'z:'+r.family,neuralType:r.entity,side:r.side,aliases:[r.sourceObject,r.id,r.latin,...(r.family.includes('fibular')?[r.name.replace('fibular','peroneo')]:[])],assetIds:[r.module],meshNames:[meshName],bounds:bounds(positions),explosionRegionId:r.region+'-limb-'+r.side});
 originalByMesh.set(meshName,{r,n,positions,faces:source.faces,matrix});
}
function aggregate(id){
 const n=byId.get(id);for(const child of n.children)aggregate(child);
 if((id==='nervous'||id==='nervous:pns'||id.startsWith('zanatomy:')||!catalog.assets.some(a=>a.id===id))&&n.children.length){
  const boxes=n.children.map(c=>byId.get(c).bounds);if(n.meshNames.length)boxes.push(n.bounds);
  n.bounds=union(boxes);n.assetIds=[...new Set([...n.assetIds,...n.children.flatMap(c=>byId.get(c).assetIds)])];
 }
}
aggregate('nervous');
delete byId.get('nervous').explosionRegionId;
delete byId.get('nervous:pns').explosionRegionId;
// Only ancestors gaining new children may differ from the original catalog.
const base=await json('research/anatomy/nervous-expansion-base-catalog.json');
for(const old of base.nodes)if(!['nervous','nervous:pns'].includes(old.id))assert.deepEqual(byId.get(old.id),old,'Historical node must be unchanged: '+old.id);
const provenanceId='z-anatomy-38649f4-peripheral';
catalog.provenance.push({id:provenanceId,source:'Z-Anatomy · selección periférica',author:'Gauthier Kervyn y colaboradores; modelo original BodyParts3D, Kousaku Okubo / DBCLS',license:'CC BY-SA 4.0',licenseUrl:'https://creativecommons.org/licenses/by-sa/4.0/',version:selection.commit,originalUrl:'https://github.com/Z-Anatomy/Models-of-human-anatomy/tree/'+selection.commit,attribution:'Z-Anatomy — The libre 3D atlas of anatomy — CC BY-SA 4.0. BodyParts3D — The Database Center for Life Science — CC BY-SA 2.1 Japan (crédito original conservado).',modifications:['Selección periférica; curvas y grosor tubular originales. No equivalen a diámetros físicos medidos.','Teselación original Blender 5.1; transformación global uniforme y registro rígido de dos regiones. Sin deformación, decimación ni reflejos nuevos.','Se excluyen cerebro/pares craneales adicionales, oído interno y riñón; no se distribuyen los contenidos con excepciones NC.','Derivados GLB y originales de esta selección bajo CC BY-SA 4.0. Matrices y métricas en nervous-expansion-manifest.json.']});
const report={sourceZipSha256:lock.sourceZipSha256,positionBits:32,positionQuantization:false,additionalDecimation:false,modules:[],totalMeshes:0,totalTriangles:0,totalBytes:0,maxPositionErrorMetres:0};
const manifest={provenanceId,source:catalog.provenance.at(-1),registration:'research/anatomy/nervous-expansion-registration.json',uniformScale:registration.globalFit.uniformScale,matrices:Object.fromEntries(Object.entries(registration.regions).map(([k,v])=>[k,v.matrix])),sourceZipSha256:lock.sourceZipSha256,files:[]};
const canonical=(a,b,c)=>[a+','+b+','+c,b+','+c+','+a,c+','+a+','+b].sort()[0];
await fs.mkdir(output,{recursive:true});
for(const moduleId of [...new Set(approved.map(r=>r.module))].sort()){
 const elements=[...originalByMesh.values()].filter(e=>e.r.module===moduleId),filename=moduleId.split(':')[1]+'.glb',file=path.join(output,filename);
 if(!verifyOnly){
  const doc=new Document(),buffer=doc.createBuffer(),scene=doc.createScene();
  const material=doc.createMaterial('Nervioso').setBaseColorFactor([.72,.55,.23,1]).setMetallicFactor(0).setRoughnessFactor(.8);
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
  let maxError=0,triangles=0;const used=new Set();
  const originalPositions=new Map(e.positions.map((p,i)=>[sourceMap[i],p]));
  for(const primitive of node.getMesh().listPrimitives()){
   const position=primitive.getAttribute('POSITION'),indices=primitive.getIndices(),remap=[];assert.equal(position.getComponentType(),5126);
   for(let i=0;i<position.getCount();i++){const p=position.getElement(i,[]),index=map.get(p.join(','));assert.notEqual(index,undefined,'Lossless Float32 positions');remap.push(index);used.add(index);maxError=Math.max(maxError,Math.hypot(...p.map((v,a)=>v-originalPositions.get(index)[a])));}
   const ix=indices.getArray();for(let i=0;i<ix.length;i+=3){const key=canonical(remap[ix[i]],remap[ix[i+1]],remap[ix[i+2]]),count=expected.get(key);assert.ok(count>0,'Oriented source triangle retained');expected.set(key,count-1);triangles++;}
  }
  assert.ok([...expected.values()].every(n=>n===0));assert.equal(used.size,new Set(e.faces.flat().map(i=>sourceMap[i])).size);assert.ok(maxError<1e-7);
  module.triangles+=triangles;module.elements.push({id:e.r.id,sourceObject:e.r.sourceObject,triangles,maxPositionErrorMetres:maxError,triangleMultisetAndWindingPreserved:true});report.maxPositionErrorMetres=Math.max(report.maxPositionErrorMetres,maxError);
  manifest.files.push({...e.r.geometry,anatomyId:e.r.id,meshName:node.getName(),side:e.r.side,moduleId,transform:e.matrix,boundsMetres:e.n.bounds,originalGeometrySha256:hash(JSON.stringify(originals[e.r.id]))});
 }
 const accessors=new Set(meshNodes.flatMap(n=>n.getMesh().listPrimitives().flatMap(p=>[...p.listAttributes(),p.getIndices()])));module.decodedAccessorBytes=[...accessors].reduce((sum,a)=>sum+a.getArray().byteLength,0);
 const raw=await validator.validateBytes(new Uint8Array(data),{uri:filename});assert.equal(raw.issues.numErrors,0);assert.equal(raw.issues.numWarnings,0);
 doc.getRoot().listExtensionsUsed().filter(e=>e.extensionName==='EXT_meshopt_compression').forEach(e=>e.dispose());const decoded=await validator.validateBytes(await io.writeBinary(doc),{uri:'decoded-'+filename});assert.equal(decoded.issues.numErrors,0);assert.equal(decoded.issues.numWarnings,0);
 module.gltfValidation={rawErrors:0,rawWarnings:0,decodedErrors:0,decodedWarnings:0};
 catalog.assets.push({id:moduleId,path:'models/anatomy/nervous/'+filename,systemId:'nervous',regionId:moduleId,frameId:catalog.frame.id,bytes:module.bytes,sha256:module.sha256,meshCount:module.meshes,triangles:module.triangles,bounds:union(elements.map(e=>e.n.bounds)),provenanceId});
 report.modules.push(module);report.totalBytes+=module.bytes;report.totalMeshes+=module.meshes;report.totalTriangles+=module.triangles;
}
catalog.coverage.structures=catalog.nodes.filter(n=>n.kind==='structure').length;catalog.coverage.meshes=catalog.nodes.reduce((sum,n)=>sum+n.meshNames.length,0);
catalog.coverage.note='Encéfalo y órbitas BP3D, más 26 nervios y 12 componentes periféricos seleccionados de Z-Anatomy. Cobertura corporal parcial; no representa una red continua completa.';
catalog.coverage.limitations=['Médula, raíces espinales, ciático y otras piezas pendientes: el registro permitido produce solapes óseos; no se deforman para forzar su encaje.','Plexo braquial: sólo troncos y fascículo posterior. Plexos lumbar/sacro: ramas disponibles, sin una malla completa del plexo.','Del radial se muestran sólo ramas digitales dorsales; el tronco principal no está integrado.','Curvas tubulares educativas originales; bilateralidad simétrica de la fuente, sin diámetro físico exacto ni validación clínica.',...base.coverage.limitations.slice(1)];
if(verifyOnly){
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(output,'catalog.json'),'utf8')),catalog);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(output,'nervous-expansion-validation.json'),'utf8')),report);
}else{await write('catalog.json',catalog);await write('nervous-expansion-manifest.json',manifest);await write('nervous-expansion-validation.json',report);}
console.log(JSON.stringify({newMeshes:report.totalMeshes,newTriangles:report.totalTriangles,newBytes:report.totalBytes,maxPositionErrorMetres:report.maxPositionErrorMetres,structures:catalog.coverage.structures,allOrientedSourceTrianglesPreserved:true,verifyOnly},null,2));
