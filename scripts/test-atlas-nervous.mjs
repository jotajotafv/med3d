// Focused nervous checks; the original source-triangle proof is in nervous-validation.json.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const temporary=await mkdtemp(path.resolve('.nervous-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const checks=[];const check=name=>{checks.push(name);console.log('PASS',name);};
try {
 const files=['catalog-index','body-catalog','explosion','nerve-education'];
 for(const file of files){
  const source=await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8');
  let output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  for(const dep of files)output=output.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");
  await writeFile(path.join(temporary,file+'.mjs'),output);
 }
 const load=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index');
 const {resolveNerveDetail,getNerveContextIds}=await load('nerve-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const skeletal=await json('public/models/anatomy/skeletal/catalog.json'),muscular=await json('public/models/anatomy/muscular/catalog.json'),nervous=await json('public/models/anatomy/nervous/catalog.json');
 const before=JSON.stringify([skeletal,muscular,nervous]),catalog=composeBodyCatalog(skeletal,muscular,nervous),index=createCatalogIndex(catalog);
 assert.equal(JSON.stringify([skeletal,muscular,nervous]),before);assert.deepEqual(index.byId.get('body').children,['skeletal','muscular','nervous']);
 assert.equal(catalog.coverage.structures,385);assert.equal(catalog.coverage.meshes,474);assert.equal(catalog.assets.length,27);
 assert.equal(nervous.nodes.filter(n=>n.meshNames.length).length,79);assert.equal(nervous.nodes.filter(n=>n.kind==='component').length,49);
 const old=composeBodyCatalog(skeletal,muscular);
 for(const n of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(n.id),n,'Historical node '+n.id);
 check('Three systems compose without changing 509 historical source nodes or IDs');
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 const meshNames=nervous.nodes.flatMap(n=>n.meshNames);assert.equal(new Set(meshNames).size,87);
 for(const n of nervous.nodes){assert.ok(index.byId.has(n.regionId),'Registered region '+n.id);assert.ok(n.meshNames.length||n.children.length,'No empty branch '+n.id);if(!n.meshNames.length)continue;
  for(const q of [n.name,n.latin,n.sourceId,...n.aliases.filter(a=>a.startsWith('FJ'))])assert.ok(index.find(q).some(r=>r.id===n.id),'Search '+q);
  assert.ok(resolveNerveDetail(n),'Educational coverage '+n.id);
  for(const id of getNerveContextIds(n,index.byId))assert.equal(index.byId.get(id).systemId,'skeletal');
  if(n.side==='right')assert.ok((n.bounds[0][0]+n.bounds[1][0])/2<0,'Right source frame');
  if(n.side==='left')assert.ok((n.bounds[0][0]+n.bounds[1][0])/2>-.001,'Left source frame');
 }
 assert.ok(index.inside('bp3d:FMA50875','nervous:cns'));assert.ok(!index.inside('bp3d:FMA50875','nervous:pns'));
 assert.equal(index.byId.get('bp3d:FMA52574').kind,'component');
 assert.ok(!nervous.nodes.some(n=>n.sourceId==='FMA7647'||n.sourceId==='FMA78497'));
 check('79 cards, Spanish/Latin/FMA/FJ search, real tree, curated contexts and honest CNS/PNS scope');
 const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular','nervous']));
 assert.equal(new Set(['skeletal','muscular','nervous'].map(id=>JSON.stringify(offsets.get(id).systems))).size,3);
 for(const n of nervous.nodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
 const cranial=nervous.nodes.filter(n=>n.meshNames.length&&n.assetIds.includes('nervous:cranial'));
 assert.equal(new Set(cranial.map(n=>JSON.stringify(offsets.get(n.id).structures))).size,1,'Orbital paths stay coherent');
 check('Three system slots, exact zero and intact orbital branch relationships');
 const selection=await json('research/anatomy/nervous-selection.json'),manifest=await json('public/models/anatomy/nervous/nervous-source-manifest.json'),validation=await json('public/models/anatomy/nervous/nervous-validation.json');
 assert.equal(createHash('sha256').update(await readFile('research/anatomy/nervous-selection.json')).digest('hex'),manifest.selectionSha256);
 assert.equal(createHash('sha256').update(await readFile('research/anatomy/nervous-originals.zip')).digest('hex'),manifest.sourceZipSha256);
 assert.equal(selection.approved.length,87);assert.equal(manifest.files.length,87);assert.equal(validation.totalMeshes,87);assert.equal(validation.totalTriangles,317674);
 assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);
 assert.ok(validation.maxPositionErrorMetres<.0000001);
 for(const a of nervous.assets){const bytes=await readFile('public/'+a.path);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
 for(const m of validation.modules)for(const e of m.elements)assert.equal(e.triangleMultisetAndWindingPreserved,true);
 assert.equal(new Set(manifest.files.map(f=>f.elementId)).size,87);
 check('Pinned original identities, complete oriented topology, Float32 positions and final asset hashes');
 const broken=structuredClone(nervous);broken.frame.id='unregistered';assert.throws(()=>composeBodyCatalog(skeletal,muscular,broken),/marco/);
 const duplicated=structuredClone(nervous);duplicated.nodes.push({...duplicated.nodes[0]});assert.throws(()=>composeBodyCatalog(skeletal,muscular,duplicated),/repetidos/);
 check('Unregistered sources and duplicate IDs are rejected');
 console.log(JSON.stringify({success:true,checks:checks.length,nodes:catalog.nodes.length,structures:catalog.coverage.structures,neuralComponents:49,meshes:catalog.coverage.meshes,modules:catalog.assets.length}));
} finally {await rm(temporary,{recursive:true,force:true});}
