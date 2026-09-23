// Focused Phase 3DE checks. Historical geometry is not rebuilt or revalidated here.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import * as THREE from 'three';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=await mkdtemp(path.join(root,'.head-neck-tests-'));
const json=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldFetch=globalThis.fetch,oldWindow=globalThis.window;
const checks=[];
const check=name=>{checks.push(name);console.log('PASS',name);};
try{
 const files=['asset-manager','explosion','catalog-index','body-catalog','muscle-education','limb-education','neck-education','camera-framing'];
 for(const file of files){
  const source=(await readFile(path.join(root,'src/features/anatomy/atlas',file+'.ts'),'utf8')).replaceAll('import.meta.env.BASE_URL',JSON.stringify('/med3d/'));
  let output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  for(const dependency of files)output=output.replaceAll("'./"+dependency+"'","'./"+dependency+".mjs'");
  await writeFile(path.join(temporary,file+'.mjs'),output);
 }
 const load=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index');
 const {resolveMuscleDetail,getMuscleContextIds,MUSCLE_EDUCATION}=await load('muscle-education');
 const {createExplosionOffsets,explosionTarget}=await load('explosion');
 const {createAssetLoader,AtlasAssetManager}=await load('asset-manager');
 const skeletal=await json('public/models/anatomy/skeletal/catalog.json'),muscular=await json('public/models/anatomy/muscular/catalog.json');
 const catalog=composeBodyCatalog(skeletal,muscular),index=createCatalogIndex(catalog),asset=catalog.assets.find(a=>a.id==='muscular:neck');
 const cohort=muscular.nodes.filter(n=>n.regionId==='muscular:region:neck'),owners=cohort.filter(n=>n.meshNames.length);
 assert.equal(owners.length,20);assert.equal(new Set(owners.map(n=>n.family)).size,10);
 assert.equal(muscular.coverage.structures,110);assert.equal(muscular.coverage.meshes,134);
 assert.equal(catalog.coverage.structures,313);assert.equal(catalog.coverage.meshes,339);assert.equal(catalog.assets.length,21);
 assert.deepEqual(catalog.frame,skeletal.frame);
 const owned=catalog.nodes.flatMap(n=>n.meshNames);assert.equal(owned.length,339);assert.equal(new Set(owned).size,339);
 for(const n of catalog.nodes){if(['region','division','system','body'].includes(n.kind))assert.ok(n.children.length,'No empty branch '+n.id);for(const id of n.relatedIds)assert.ok(index.byId.has(id),'Related identity '+id);}
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 check('Final hierarchy, unique mesh owners, nonempty branches and 313 body structures');
 const git=p=>{const r=spawnSync('git',['show','5ba794438287a16b6482c6a63d3d2b6ca8ee6542:'+p],{cwd:root,maxBuffer:8e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout;};
 const baseline=JSON.parse(git('public/models/anatomy/muscular/catalog.json'));
 for(const n of baseline.nodes)if(n.id!=='muscular')assert.deepEqual(muscular.nodes.find(x=>x.id===n.id),n,'Preserved old node '+n.id);
 for(const a of baseline.assets)assert.deepEqual(muscular.assets.find(x=>x.id===a.id),a,'Historical module metadata');
 let baselineEducation=ts.transpileModule(git('src/features/anatomy/atlas/muscle-education.ts').toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replaceAll("'./limb-education'","'./limb-education.mjs'");
 await writeFile(path.join(temporary,'baseline-education.mjs'),baselineEducation);
 const before=await load('baseline-education');
 for(const n of baseline.nodes)assert.deepEqual(resolveMuscleDetail(n),before.resolveMuscleDetail(n),'Old educational scope '+n.id);
 assert.equal(Object.keys(MUSCLE_EDUCATION).length,55);
 check('All 175 previous IDs and 45 educational families preserved; only muscular root grows');
 const selection=await json('research/anatomy/head-neck-selection.json'),manifest=await json('public/models/anatomy/muscular/head-neck-source-manifest.json'),validation=await json('public/models/anatomy/muscular/head-neck-validation.json'),lock=await json('research/anatomy/muscular-head-neck-source-lock.json');
 assert.deepEqual(selection.counts,{families:10,structures:20,meshes:20,modules:1,candidates:60,approvedConceptRows:20,discardedConceptRows:7,deferredConceptRows:33,requestedFamiliesWithoutIdentification:14});
 assert.equal(selection.source.geometryExtractedDuringAudit,false);
 assert.ok(selection.other.every(r=>r.reason&&['DESCARTADO','APLAZADO'].includes(r.decision)));
 assert.ok(selection.missingRequestedFamilies.every(r=>r.sourceId===null&&r.elementId===null));
 assert.ok(!muscular.nodes.some(n=>n.id==='muscular:region:head'));
 const selectionHash=hash(await readFile(path.join(root,'research/anatomy/head-neck-selection.json')));
 assert.equal(selectionHash,lock.selectionSha256);assert.equal(selectionHash,manifest.selectionSha256);
 assert.equal(hash(await readFile(path.join(root,manifest.sourceZip))),manifest.sourceZipSha256);
 assert.equal(manifest.files.length,20);assert.equal(lock.files.length,20);assert.equal(validation.totalMeshes,20);
 assert.equal(validation.totalTriangles,101700);assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);
 assert.equal(manifest.additionalRegistration,'none');assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 assert.ok(validation.maxPositionErrorMetres<=.00005);
 assert.equal(hash(await readFile(path.join(root,'public',asset.path))),asset.sha256);
 for(const row of manifest.files){
  const n=index.byId.get(row.anatomyId);assert.equal(n.sourceId,row.sourceId);assert.equal(n.side,row.side);assert.deepEqual(n.bounds,row.boundsMetres);
  const centerX=(n.bounds[0][0]+n.bounds[1][0])/2;assert.ok(n.side==='right'?centerX<0:centerX>0,'Source lateral identity '+n.id);
  assert.ok(selection.approved.some(r=>r.sourceId===n.sourceId&&r.elementId===row.elementId&&r.isaType==='muscle organ'));
 }
 check('Regional audit, exact FMA/FJ/side, approved-only source and lossless triangle report');
 for(const n of owners){
  const detail=resolveMuscleDetail(n);assert.ok(detail&&detail.scope==='muscle');
  for(const key of ['name','latin','region','description','function','action','innervation','relations'])assert.ok(detail[key].length>4,key);
  assert.ok(detail.sources.length&&detail.origins.length&&detail.insertions.length);
  for(const term of [n.name,n.latin,n.sourceId,...n.aliases.filter(a=>a.startsWith('FJ'))])assert.ok(index.find(term).some(hit=>hit.id===n.id),'Search '+term);
  const context=getMuscleContextIds(n,index.byId);assert.ok(context.length);
  for(const id of context){const bone=index.byId.get(id);assert.equal(bone.systemId,'skeletal');assert.ok([n.side,'midline'].includes(bone.side));}
 }
 const context=id=>getMuscleContextIds(index.byId.get('bp3d:'+id),index.byId).sort();
 assert.deepEqual(context('FMA13408'),['FMA13322','FMA52735','FMA52738','FMA7485'].map(id=>'bp3d:'+id).sort());
 assert.deepEqual(context('FMA45739'),['bp3d:FMA52748'],'Platysma fascia has no clavicle surrogate');
 assert.deepEqual(context('FMA46321'),['bp3d:FMA52748','bp3d:FMA52749']);
 assert.deepEqual(context('FMA13388'),['FMA12523','FMA12524','FMA12525','FMA7882'].map(id=>'bp3d:'+id).sort());
 assert.match(resolveMuscleDetail(index.byId.get('bp3d:FMA46326')).innervation,/C1/);
 const missing=new Map(index.byId);missing.delete('bp3d:FMA52748');assert.deepEqual(getMuscleContextIds(index.byId.get('bp3d:FMA45739'),missing),[]);
 check('Twenty sourced cards, multilingual identifiers and explicit ipsilateral/midline context');
 const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular']));
 const members=catalog.nodes.filter(n=>n.explosionRegionId==='head-neck'&&n.meshNames.length);
 assert.ok(members.some(n=>n.systemId==='skeletal')&&members.some(n=>n.systemId==='muscular'));
 for(const n of members)assert.deepEqual(offsets.get(n.id).regions,offsets.get(members[0].id).regions);
 for(const n of cohort)for(const level of ['systems','regions','structures']){
  assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
  assert.ok(explosionTarget(offsets.get(n.id),level,1).every(Number.isFinite));
 }
 check('Head and cervical bone/muscle regional block and exact zero restoration');
 const {ANATOMICAL_VIEWS,fitCameraBounds}=await load('camera-framing');
 for(const n of cohort)for(const aspect of [.42,1,1.8])for(const view of Object.values(ANATOMICAL_VIEWS)){
  const box=new THREE.Box3(new THREE.Vector3(...n.bounds[0]),new THREE.Vector3(...n.bounds[1])),goal=fitCameraBounds(box,34,aspect,view.direction,view.up);
  assert.ok(!box.containsPoint(goal.position)&&goal.minDistance>box.getSize(new THREE.Vector3()).length()/2);
  const camera=new THREE.PerspectiveCamera(34,aspect,goal.near,80);camera.position.copy(goal.position);camera.up.copy(goal.up);camera.lookAt(goal.target);camera.updateMatrixWorld();
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1/1.18+1e-6&&Math.abs(p.y)<=1/1.18+1e-6&&p.z>=-1&&p.z<=1);}
 }
 check('Every new node fits six orientations at three viewport proportions without entering its bounds');
 let failure=false,delay=false,release;
 globalThis.window={location:{origin:'http://localhost'}};
 globalThis.fetch=async(url,options)=>{
  if(failure)return new Response('controlled neck failure',{status:503});
  if(delay)await new Promise(resolve=>release=resolve);
  options?.signal?.throwIfAborted();
  const bytes=await readFile(path.join(root,'public',new URL(url).pathname.replace(/^\/med3d\//,'')));
  return new Response(bytes,{headers:{'content-length':String(bytes.length)}});
 };
 const loader=createAssetLoader(catalog),resource=await loader(asset,new AbortController().signal,()=>{});
 assert.equal(resource.parts.length,20);assert.equal(resource.triangles,101700);
 const geometryBytes=resource.geometryBytes;let disposed=0;resource.geometries.forEach(g=>g.addEventListener('dispose',()=>disposed++));
 resource.dispose();resource.dispose();assert.equal(disposed,resource.geometries.size);
 const manager=new AtlasAssetManager(catalog,loader);
 const settle=async()=>{const deadline=Date.now()+20000;while(manager.snapshot().statuses.some(s=>['queued','loading'].includes(s.state))){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,2));}};
 try{
  for(let i=0;i<3;i++){manager.setDesired([asset.id]);await settle();assert.equal(manager.snapshot().resources[0].geometryBytes,geometryBytes);manager.setDesired([]);await settle();assert.equal(manager.snapshot().resources.length,0);}
  failure=true;manager.setDesired([asset.id]);await settle();assert.equal(manager.snapshot().statuses[0].state,'error');
  failure=false;manager.retry(asset.id);await settle();assert.equal(manager.snapshot().resources.length,1);
  manager.setDesired([]);await settle();delay=true;manager.setDesired([asset.id]);const deadline=Date.now()+10000;while(!release){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,2));}manager.setDesired([]);release();delay=false;await settle();manager.setDesired([asset.id]);await settle();assert.equal(manager.snapshot().resources[0].geometryBytes,geometryBytes);
 }finally{manager.dispose();}
 check('Actual new Meshopt GLB load, single disposal, bounded reload, explicit retry and late cancellation');
 console.log(JSON.stringify({success:true,checks:checks.length,newMeshes:20,newTriangles:101700,geometryBytes,bodyStructures:313,bodyMeshes:339}));
}finally{
 globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
 assert.ok(path.resolve(temporary).startsWith(root+path.sep+'.head-neck-tests-'));
 await rm(temporary,{recursive:true,force:true});
}
