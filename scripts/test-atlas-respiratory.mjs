import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const temporary=await mkdtemp(path.resolve('.respiratory-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
 const files=['catalog-index','body-catalog','explosion','respiratory-education'];
 for(const file of files){let output=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)output=output.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temporary,file+'.mjs'),output);}
 const load=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{resolveRespiratoryDetail,getRespiratoryContextIds}=await load('respiratory-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const systems=['skeletal','muscular','nervous','cardiovascular','respiratory'];
 const catalogs=await Promise.all(systems.map(s=>json('public/models/anatomy/'+s+'/catalog.json'))),resp=catalogs[4];
 const catalog=composeBodyCatalog(...catalogs),index=createCatalogIndex(catalog),old=composeBodyCatalog(...catalogs.slice(0,4));
 assert.equal(catalog.coverage.structures,527);assert.equal(catalog.coverage.meshes,802);assert.equal(catalog.assets.length,41);
 for(const n of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(n.id),n,'Historical node '+n.id);
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 assert.equal(resp.nodes.filter(n=>n.kind==='structure').length,6);assert.equal(resp.nodes.filter(n=>n.kind==='component').length,51);
 for(const n of resp.nodes){assert.ok(n.meshNames.length||n.children.length,'No empty node '+n.id);if(n.parentId)assert.ok(index.byId.get(n.parentId).children.includes(n.id));assert.ok(resolveRespiratoryDetail(n));}
 pass('Five systems, 527 structures, 802 meshes, 41 modules; unchanged historical nodes and nonempty respiratory tree');
 const selection=await json('research/anatomy/respiratory-selection.json');assert.equal(selection.units.length,49);
 const owners=new Set(),elements=new Set();
 for(const u of selection.units){
  const n=index.byId.get(u.id);assert.ok(n);assert.equal(n.sourceId,u.sourceId);assert.equal(n.side,u.side);assert.equal(n.assetIds.length,1);assert.equal(n.meshNames.length,u.elements.length);
  for(const name of n.meshNames){assert.ok(!owners.has(name));owners.add(name);}
  for(const id of u.elements){assert.ok(!elements.has(id));elements.add(id);}
  for(const query of [n.name,n.latin,n.id,n.sourceId,...u.elements,...n.aliases])assert.ok(index.find(query).some(v=>v.id===n.id),'Search '+query+' -> '+n.id);
  const detail=resolveRespiratoryDetail(n);assert.ok(detail.fields.length>=6);assert.ok(detail.sources.every(s=>s.url.startsWith('https://')));
  for(const id of getRespiratoryContextIds(n,index.byId))assert.ok(index.byId.has(id));
 }
 assert.equal(owners.size,128);assert.equal(elements.size,128);
 for(const [query,id] of [['pulmón derecho','resp:lung:right'],['pulmón izquierdo','resp:lung:left'],['lóbulo superior','resp:lobe:right-upper'],['carina','resp:FMA7394'],['FMA7395','resp:FMA68418']])assert.ok(index.find(query).some(n=>n.id===id));
 pass('Every source unit searchable by Spanish/Latin/FMA/FJ/alias; unique mesh ownership and sourced cards');
 const lungParts=resp.nodes.filter(n=>n.respiratoryClass==='parenchyma');assert.equal(lungParts.length,17);assert.equal(lungParts.flatMap(n=>n.meshNames).length,18);
 assert.equal(resp.nodes.filter(n=>n.respiratoryClass==='lobe').length,5);
 for(const n of lungParts){assert.equal(n.kind,'component');assert.equal(index.byId.get(n.parentId).respiratoryClass,'lobe');assert.equal(index.byId.get(n.parentId).side,n.side);assert.ok(n.side==='right'?n.bounds[1][0]<0:n.bounds[0][0]>0);}
 assert.equal(resp.nodes.filter(n=>n.respiratoryClass==='bronchial-tree'&&n.meshNames.length).length,20);
 assert.ok(!resp.nodes.some(n=>n.sourceId==='FMA13295'||n.vascularClass));
 for(const side of ['right','left']){const ids=getRespiratoryContextIds(index.byId.get('resp:lung:'+side),index.byId);assert.ok(ids.includes('cardio:heart'));assert.ok(ids.includes('skeletal:region:thorax'));for(const id of ids.filter(id=>id.startsWith('bp3d:')))assert.equal(index.byId.get(id).side,side);}
 pass('Two lungs, five lobes, 17 parenchymal identities/18 pieces; 20 segmental trees; curated ipsilateral cardiovascular context without duplicated vessels');
 const offsets=createExplosionOffsets(catalog,new Set(systems));
 for(const n of resp.nodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
 assert.equal(new Set(systems.map(id=>JSON.stringify(offsets.get(id).systems))).size,5);
 const airway=resp.nodes.filter(n=>n.meshNames.length&&n.explosionRegionId==='resp-airway');assert.equal(new Set(airway.map(n=>JSON.stringify(offsets.get(n.id).structures))).size,1);
 for(const lobe of resp.nodes.filter(n=>n.respiratoryClass==='lobe'))assert.equal(new Set(lobe.children.map(id=>JSON.stringify(offsets.get(id).structures))).size,1);
 pass('Five system slots, coherent long airway and lobar blocks, exact zero in three explosion modes');
 const validation=await json('public/models/anatomy/respiratory/respiratory-validation.json');assert.equal(validation.totalMeshes,128);assert.equal(validation.totalTriangles,212484);assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);assert.ok(validation.maxPositionErrorMetres<1e-7);
 const lock=await json('research/anatomy/respiratory-source-lock.json'),manifest=await json('public/models/anatomy/respiratory/respiratory-source-manifest.json');
 assert.equal(createHash('sha256').update(await readFile('research/anatomy/respiratory-selection.json')).digest('hex'),lock.selectionSha256);assert.equal(manifest.selectionSha256,lock.selectionSha256);
 assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 for(const a of resp.assets){const bytes=await readFile('public/'+a.path);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.equal(a.frameId,'bodyparts3d-4.0-male');}
 for(const f of manifest.files){assert.equal(f.sourceId,f.nativeConceptId);assert.ok(elements.has(f.elementId));}
 pass('Three GLB hashes, fixed transform and independent Float32/oriented-triangle validation');
 console.log(JSON.stringify({success:true,checks,nodes:catalog.nodes.length,structures:catalog.coverage.structures,components:resp.nodes.filter(n=>n.kind==='component').length,meshes:catalog.coverage.meshes,modules:catalog.assets.length}));
}finally{assert.ok(temporary.startsWith(path.resolve('.')+path.sep));await rm(temporary,{recursive:true,force:true});}
