import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tmp=await mkdtemp(path.join(root,'.catalog-tests-'));
try {
 const source=await readFile(path.join(root,'src/features/anatomy/atlas/catalog-index.ts'),'utf8');
 await writeFile(path.join(tmp,'index.mjs'),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const {createCatalogIndex,flattenTree}=await import(pathToFileURL(path.join(tmp,'index.mjs')));
 const detailSource=await readFile(path.join(root,'src/features/anatomy/atlas/bone-details.ts'),'utf8');
 await writeFile(path.join(tmp,'bone-details.mjs'),ts.transpileModule(detailSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText);
 const {BONE_DETAILS,resolveBoneDetail}=await import(pathToFileURL(path.join(tmp,'bone-details.mjs')));
 const catalog=JSON.parse(await readFile(path.join(root,'public/models/anatomy/skeletal/catalog.json'),'utf8'));
 const index=createCatalogIndex(catalog);
 // Phase 2.1 educational coverage: named bones only, never groups or components.
 assert.equal(Object.keys(BONE_DETAILS).length,20,'Expected 20 reviewed bone cards');
 const detailedNodes=catalog.nodes.filter(node=>resolveBoneDetail(node));
 assert.equal(detailedNodes.length,33,'Expected cards for 33 real catalog structures');
 assert.equal(new Set(detailedNodes.map(resolveBoneDetail)).size,20,'Every reviewed card resolves from a real structure');
 for (const [key,detail] of Object.entries(BONE_DETAILS)) {
  assert.equal(detail.scope,'bone','Individual scope: '+key);
  assert.ok(detail.sources.length>0,'Sources required: '+key);
  for (const source of detail.sources) {
   assert.ok(source.title.trim(),'Source title required: '+key);
   assert.equal(new URL(source.url).protocol,'https:','HTTPS source required: '+key);
  }
 }
 for (const node of catalog.nodes.filter(node=>node.kind!=='structure')) assert.equal(resolveBoneDetail(node),undefined,'No individual card for '+node.kind+': '+node.id);
 const atlas=catalog.nodes.find(node=>node.sourceId==='FMA12519');
 const axis=catalog.nodes.find(node=>node.sourceId==='FMA12520');
 assert.equal(resolveBoneDetail(atlas),BONE_DETAILS.FMA12519,'C1 must use its atlas card');
 assert.equal(resolveBoneDetail(axis),BONE_DETAILS.FMA12520,'C2 must use its axis card');
 assert.notEqual(resolveBoneDetail(atlas),resolveBoneDetail(axis),'C1 and C2 have distinct anatomy');
 assert.equal(resolveBoneDetail(catalog.nodes.find(node=>node.sourceId==='FMA12521')),undefined,'C3 retains family fallback');
 for (const kind of ['system','division','region','component']) assert.equal(resolveBoneDetail({...atlas,kind}),undefined,'Scope guard must reject a bone identifier on '+kind);
 for (const query of ['fémur','FEMUR','Os femoris','peroné','fibula','cúbito','ulna','tibia','húmero','radio','costilla','vértebra','frontal']) assert.ok(index.find(query).length>0,'Expected anatomical search: '+query);
 const femur=index.find('fémur derecho')[0];
 assert.ok(femur&&femur.side==='right');
 const ancestors=index.ancestors.get(femur.id);
 assert.equal(ancestors[0],'skeletal');
 assert.equal(ancestors.at(-1),femur.id);
 const other=index.find('fémur izquierdo')[0];
 assert.deepEqual(index.reveal(['skeletal',femur.id,other.id],femur.id),[other.id]);
 assert.deepEqual(index.reveal([femur.id,other.id],'skeletal'),[]);
 assert.equal(index.assetIdsFor('skeletal').length,7);
 const rows=flattenTree(catalog,index,new Set(catalog.nodes.map(node=>node.id)));
 assert.equal(rows.length,catalog.nodes.length);
 assert.equal(new Set(rows.map(row=>row.node.id)).size,catalog.nodes.length);
 assert.ok(rows.every(row=>row.depth>=0&&row.depth<20));
 assert.throws(()=>createCatalogIndex({...catalog,nodes:[...catalog.nodes,catalog.nodes[0]]}),/repetidos/);
 const broken=structuredClone(catalog);broken.nodes[0].children.push('missing');
 assert.throws(()=>createCatalogIndex(broken),/jerarquía/);
 const cycle=structuredClone(catalog),a=cycle.nodes[0],b=cycle.nodes[1];
 a.children=[b.id];b.parentId=a.id;b.children=[a.id];a.parentId=b.id;
 assert.throws(()=>createCatalogIndex(cycle));
 const meshOwners=catalog.nodes.filter(node=>node.meshNames.length).flatMap(node=>node.meshNames);
 assert.equal(new Set(meshOwners).size,catalog.coverage.meshes,'Each source mesh has exactly one deepest semantic owner');
 // Scalability fixture only: metadata records, no anatomical or 3D assets are generated.
 const fake={...catalog,assets:[],nodes:Array.from({length:10000},(_,i)=>({id:'metadata:'+i,name:'Estructura '+i,anatomicalName:'Test '+i,aliases:['test'],systemId:'skeletal',regionId:'skeletal',kind:'structure',children:[],assetIds:[],meshNames:[],relatedIds:[]}))};
 const started=performance.now(),large=createCatalogIndex(fake),indexed=performance.now();
 assert.equal(large.find('test').length,10000);const searched=performance.now();
 assert.equal(flattenTree(fake,large,new Set()).length,10000);const flattened=performance.now();
 console.log(JSON.stringify({realNodes:catalog.nodes.length,meshes:catalog.coverage.meshes,boneCards:Object.keys(BONE_DETAILS).length,detailedStructures:detailedNodes.length,syntheticMetadataNodes:10000,indexMs:Math.round(indexed-started),searchMs:Math.round(searched-indexed),flattenMs:Math.round(flattened-searched)}));
 console.log('Atlas catalog: source identities, hierarchy, multilingual search, reveal, ownership, individual bone cards and scale passed.');
} finally {await rm(tmp,{recursive:true,force:true});}
