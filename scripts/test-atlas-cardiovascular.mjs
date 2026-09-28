import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const temporary=await mkdtemp(path.resolve('.cardiovascular-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
 const files=['catalog-index','body-catalog','explosion','cardiovascular-education'];
 for(const file of files){let output=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)output=output.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temporary,file+'.mjs'),output);}
 const load=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{resolveCardiovascularDetail,getCardiovascularContextIds}=await load('cardiovascular-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const catalogs=await Promise.all(['skeletal','muscular','nervous','cardiovascular'].map(s=>json('public/models/anatomy/'+s+'/catalog.json'))),cardio=catalogs[3];
 const catalog=composeBodyCatalog(...catalogs),index=createCatalogIndex(catalog),old=composeBodyCatalog(...catalogs.slice(0,3));
 assert.equal(catalog.coverage.structures,521);assert.equal(catalog.coverage.meshes,674);assert.equal(catalog.assets.length,38);
 for(const n of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(n.id),n,'Historical node '+n.id);
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 assert.equal(cardio.nodes.filter(n=>n.kind==='structure').length,110);assert.equal(cardio.nodes.filter(n=>n.kind==='component').length,30);
 for(const n of cardio.nodes){assert.ok(n.meshNames.length||n.children.length,'No empty node '+n.id);if(n.parentId)assert.ok(index.byId.get(n.parentId).children.includes(n.id));}
 pass('Four systems: 521 structures, 674 meshes, 38 modules; historical nodes unchanged and no empty groups');
 const selection=await json('research/anatomy/cardiovascular-selection.json'),approved=selection.units.filter(u=>u.decision==='APROBADO');assert.equal(approved.length,134);
 const meshNames=new Set(),sourceElements=new Set();
 for(const u of approved){
  const n=index.byId.get(u.id);assert.ok(n);assert.equal(n.sourceId,u.sourceId);assert.equal(n.side,u.side);assert.equal(n.assetIds.length,1);assert.equal(n.meshNames.length,u.elements.length);
  for(const name of n.meshNames){assert.ok(!meshNames.has(name));meshNames.add(name);}
  for(const id of u.elements){assert.ok(!sourceElements.has(id));sourceElements.add(id);}
  for(const query of [n.name,n.latin,n.id,n.sourceId,...u.elements,...n.aliases])assert.ok(index.find(query).some(v=>v.id===n.id),'Search '+query+' -> '+n.id);
  const detail=resolveCardiovascularDetail(n);assert.ok(detail?.fields.length>=4,'Specific educational fields '+n.family);assert.ok(detail.sources.every(s=>s.url.startsWith('https://')));
  const contexts=getCardiovascularContextIds(n,index.byId);for(const id of contexts){const c=index.byId.get(id);assert.ok(c);if(c.side&&n.side!=='midline')assert.equal(c.side,n.side);}
 }
 assert.equal(meshNames.size,162);assert.equal(sourceElements.size,162);
 assert.equal(cardio.nodes.filter(n=>n.family?.startsWith('cavity-')).length,4);assert.ok(cardio.nodes.filter(n=>n.family?.startsWith('cavity-')).every(n=>n.kind==='component'&&n.cardioType==='espacio cardíaco'));
 assert.equal(cardio.nodes.filter(n=>n.cardioType==='válvula').length,4);
 for(const n of cardio.nodes.filter(n=>n.family?.includes('pulmonary')&&n.cardioType!=='válvula'&&n.cardioType!=='valva'))assert.equal(n.vascularClass,n.family.includes('vein')?'venous':'arterial');
 pass('Every approved FMA/FJ has one owner, searchable Spanish/Latin/aliases and a sourced family card; cavities remain spaces');
 const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular','nervous','cardiovascular']));
 for(const n of cardio.nodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
 for(const region of new Set(cardio.nodes.filter(n=>n.meshNames.length).map(n=>n.explosionRegionId)))assert.equal(new Set(cardio.nodes.filter(n=>n.meshNames.length&&n.explosionRegionId===region).map(n=>JSON.stringify(offsets.get(n.id).structures))).size,1,'Regional vessel block '+region);
 assert.equal(new Set(['skeletal','muscular','nervous','cardiovascular'].map(id=>JSON.stringify(offsets.get(id).systems))).size,4);
 pass('Four deterministic system offsets; coherent vascular regional blocks and exact zero in all modes');
 const validation=await json('public/models/anatomy/cardiovascular/cardiovascular-validation.json');assert.equal(validation.totalMeshes,162);assert.equal(validation.totalTriangles,685016);assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);assert.ok(validation.maxPositionErrorMetres<1e-7);
 const lock=await json('research/anatomy/cardiovascular-source-lock.json'),manifest=await json('public/models/anatomy/cardiovascular/cardiovascular-source-manifest.json');
 assert.equal(createHash('sha256').update(await readFile('research/anatomy/cardiovascular-selection.json')).digest('hex'),lock.selectionSha256);assert.equal(manifest.selectionSha256,lock.selectionSha256);
 assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 for(const a of cardio.assets){const bytes=await readFile('public/'+a.path);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(a.frameId,'bodyparts3d-4.0-male');}
 for(const f of manifest.files){assert.equal(f.sourceId,f.nativeConceptId);assert.ok(sourceElements.has(f.elementId));}
 pass('Seven asset hashes, identity-preserving source mapping, fixed transform and Float32 geometric validation');
 console.log(JSON.stringify({success:true,checks,nodes:catalog.nodes.length,structures:catalog.coverage.structures,meshes:catalog.coverage.meshes,modules:catalog.assets.length}));
}finally{assert.ok(temporary.startsWith(path.resolve('.')+path.sep));await rm(temporary,{recursive:true,force:true});}
