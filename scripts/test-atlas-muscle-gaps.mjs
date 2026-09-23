// Focused Phase 3F checks. Historical geometry is not rebuilt or revalidated here.
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';
import * as THREE from 'three';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=await mkdtemp(path.join(root,'.muscle-gaps-tests-'));
const json=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const oldFetch=globalThis.fetch,oldWindow=globalThis.window;
const checks=[];
const check=name=>{checks.push(name);console.log('PASS',name);};
try{
 const files=['asset-manager','explosion','catalog-index','body-catalog','muscle-education','limb-education','neck-education','gaps-education','camera-framing'];
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
 const catalog=composeBodyCatalog(skeletal,muscular),index=createCatalogIndex(catalog);
 const assets=muscular.assets.filter(a=>a.provenanceId==='bodyparts3d-4.0-muscular-gaps'),assetIds=new Set(assets.map(a=>a.id));
 const cohort=muscular.nodes.filter(n=>n.assetIds.length&&n.assetIds.every(id=>assetIds.has(id))),owners=cohort.filter(n=>n.meshNames.length),whole=cohort.filter(n=>n.kind==='structure');
 assert.equal(assets.length,4);assert.equal(owners.length,48);assert.equal(whole.length,42);assert.equal(cohort.filter(n=>n.kind==='component').length,12);assert.equal(new Set(whole.map(n=>n.family)).size,21);
 assert.equal(muscular.coverage.structures,152);assert.equal(muscular.coverage.meshes,182);assert.equal(catalog.coverage.structures,355);assert.equal(catalog.coverage.meshes,387);assert.equal(catalog.assets.length,25);
 assert.equal(Object.keys(MUSCLE_EDUCATION).length,76);assert.deepEqual(catalog.frame,skeletal.frame);
 const owned=catalog.nodes.flatMap(n=>n.meshNames);assert.equal(owned.length,387);assert.equal(new Set(owned).size,387);
 for(const n of catalog.nodes){if(['region','division','system','body'].includes(n.kind))assert.ok(n.children.length,'No empty branch '+n.id);for(const id of n.relatedIds)assert.ok(index.byId.has(id));}
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 check('355 body structures, 387 unique mesh owners, 25 modules, no empty/duplicate nodes');
 const git=p=>{const r=spawnSync('git',['show','0841ad7942755905886d86e799c2e510473d6649:'+p],{cwd:root,maxBuffer:8e6});assert.equal(r.status,0,r.stderr.toString());return r.stdout;};
 const baseline=JSON.parse(git('public/models/anatomy/muscular/catalog.json'));
 const ancestors=new Set(['muscular',...['arm','leg'].flatMap(l=>['right','left'].map(s=>'muscular:region:'+l+'-'+s))]);
 for(const n of baseline.nodes){const current=muscular.nodes.find(x=>x.id===n.id);assert.ok(current);if(!ancestors.has(n.id))assert.deepEqual(current,n,'Preserved node '+n.id);else for(const key of Object.keys(n).filter(k=>!['bounds','children','assetIds'].includes(k)))assert.deepEqual(current[key],n[key],'Preserved ancestor identity');}
 for(const a of baseline.assets)assert.deepEqual(muscular.assets.find(x=>x.id===a.id),a,'Historical metadata');
 let baselineEducation=ts.transpileModule(git('src/features/anatomy/atlas/muscle-education.ts').toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replaceAll("'./limb-education'","'./limb-education.mjs'").replaceAll("'./neck-education'","'./neck-education.mjs'");
 await writeFile(path.join(temporary,'baseline-education.mjs'),baselineEducation);const before=await load('baseline-education');
 for(const n of baseline.nodes)assert.deepEqual(resolveMuscleDetail(n),before.resolveMuscleDetail(n),'Preserved education '+n.id);
 check('202 old nodes and 55 old educational families preserved; only five ancestors aggregate new children');
 const selection=await json('research/anatomy/muscle-gaps-selection.json'),manifest=await json('public/models/anatomy/muscular/muscle-gaps-source-manifest.json'),validation=await json('public/models/anatomy/muscular/muscle-gaps-validation.json'),lock=await json('research/anatomy/muscular-muscle-gaps-source-lock.json');
 assert.deepEqual(selection.counts,{candidates:{face:34,hand:25,foot:38},decisions:{APROBADO:48,DESCARTADO:14,APLAZADO:35},families:21,structures:42,meshes:48,modules:4,missingRequestedFamilies:23});
 assert.equal(selection.source.geometryExtractedDuringAudit,false);assert.ok(selection.other.every(r=>r.reason&&r.decision!=='APROBADO'));assert.ok(!muscular.nodes.some(n=>n.id==='muscular:region:head'));
 assert.deepEqual(new Set(lock.files.map(f=>f.elementId)),new Set(selection.approved.map(f=>f.elementId)));
 const selectionHash=hash(await readFile(path.join(root,'research/anatomy/muscle-gaps-selection.json')));assert.equal(selectionHash,lock.selectionSha256);assert.equal(selectionHash,manifest.selectionSha256);
 assert.equal(hash(await readFile(path.join(root,manifest.sourceZip))),manifest.sourceZipSha256);
 assert.equal(validation.totalMeshes,48);assert.equal(validation.totalTriangles,40724);assert.equal(validation.totalBytes,694436);assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);assert.ok(validation.maxPositionErrorMetres<=.00005);
 assert.equal(manifest.additionalRegistration,'none');assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 for(const a of assets)assert.equal(hash(await readFile(path.join(root,'public',a.path))),a.sha256);
 for(const row of manifest.files){const n=index.byId.get(row.anatomyId);assert.equal(n.sourceId,row.sourceId);assert.equal(n.side,row.side);assert.deepEqual(n.bounds,row.boundsMetres);const cx=(n.bounds[0][0]+n.bounds[1][0])/2;assert.ok(n.side==='right'?cx<0:cx>0);assert.equal(n.kind,row.sourceType==='head'?'component':'structure');}
 check('Only 48 approved originals, exact side/header identities, Float32 Meshopt and oriented triangle validation');
 for(const n of [...owners,...whole]){
  const d=resolveMuscleDetail(n);assert.ok(d);assert.equal(d.scope,n.kind==='component'?'component':'muscle');
  for(const key of ['name','latin','region','description','function','action','innervation','relations'])assert.ok(d[key]?.length>2,key+' '+n.id);
  assert.ok(d.sources.length&&d.origins.length&&d.origins.every(Boolean)&&d.insertions.length);
  for(const term of [n.name,n.latin,n.sourceId,...n.aliases.filter(a=>a.startsWith('FJ'))].filter(Boolean))assert.ok(index.find(term).some(hit=>hit.id===n.id),'Search '+term);
  for(const a of [...d.origins,...d.insertions])for(const id of Object.values(a.boneIds||{}).flat()){const b=index.byId.get(id);assert.ok(b&&b.systemId==='skeletal','Explicit existing bone '+id);}
  const ctx=getMuscleContextIds(n,index.byId);if(n.family.startsWith('lumbrical'))assert.deepEqual(ctx,[]);else assert.ok(ctx.length);
  for(const id of ctx)assert.equal(index.byId.get(id).side,n.side);
 }
 const context=id=>getMuscleContextIds(index.byId.get('bp3d:'+id),index.byId).sort();
 assert.deepEqual(context('FMA46123'),['bp3d:FMA24450','bp3d:FMA24468']);
 assert.deepEqual(context('FMA46020'),['bp3d:FMA43253'],'Capsuloligamentous transverse head has no fake metatarsal origin');
 assert.deepEqual(context('FMA37465'),['bp3d:FMA24497'],'Quadratus inserts on tendon, not toe surrogate');
 assert.deepEqual(context('FMA37717'),[],'Lumbrical has soft-tissue attachments');
 const missing=new Map(index.byId);missing.delete('bp3d:FMA43253');assert.deepEqual(getMuscleContextIds(index.byId.get('bp3d:FMA46020'),missing),[]);
 check('42 whole cards and 12 scoped component cards; Spanish/Latin/FMA/FJ; explicit ipsilateral context');
 const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular']));
 for(const n of cohort)for(const level of ['systems','regions','structures']){assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);assert.ok(explosionTarget(offsets.get(n.id),level,1).every(Number.isFinite));}
 for(const n of owners){const limb=(n.regionId.includes(':arm-')?'upper-limb-':'lower-limb-')+n.side;assert.equal(index.byId.get(n.id).explosionRegionId,limb);const peers=catalog.nodes.filter(p=>p.explosionRegionId===limb&&p.meshNames.length);for(const p of peers)assert.deepEqual(offsets.get(p.id).regions,offsets.get(n.id).regions);}
 // Existing contract: test-atlas-multisystem lines 136-139 and explosion.ts
 // separate components around their own parent only in Structures mode.
 for(const n of whole.filter(n=>n.children.length)){
  assert.equal(new Set(n.children.map(id=>JSON.stringify(offsets.get(id).structures))).size,2,'Two named heads separate in Structures: '+n.id);
  for(const id of n.children){assert.deepEqual(offsets.get(id).regions,offsets.get(n.id).regions,'Heads retain regional coherence');assert.ok(index.inside(id,n.id),'Head remains owned by its parent');}
 }
 check('Hand/foot share their limb region; heads separate only in Structures; exact zero restoration');
 const {ANATOMICAL_VIEWS,fitCameraBounds}=await load('camera-framing');
 for(const n of cohort)for(const aspect of [.42,1,1.8])for(const view of Object.values(ANATOMICAL_VIEWS)){
  const box=new THREE.Box3(new THREE.Vector3(...n.bounds[0]),new THREE.Vector3(...n.bounds[1])),goal=fitCameraBounds(box,34,aspect,view.direction,view.up);
  assert.ok(!box.containsPoint(goal.position)&&goal.minDistance>box.getSize(new THREE.Vector3()).length()/2);
  const camera=new THREE.PerspectiveCamera(34,aspect,goal.near,80);camera.position.copy(goal.position);camera.up.copy(goal.up);camera.lookAt(goal.target);camera.updateMatrixWorld();
  for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1/1.18+1e-6&&Math.abs(p.y)<=1/1.18+1e-6&&p.z>=-1&&p.z<=1);}
 }
 check('All new nodes fit six orientations at three viewport proportions');

 let failure=false;
 globalThis.window={location:{origin:'http://localhost'}};
 globalThis.fetch=async(url,options)=>{if(failure)return new Response('controlled regional failure',{status:503});options?.signal?.throwIfAborted();const bytes=await readFile(path.join(root,'public',new URL(url).pathname.replace(/^\/med3d\//,'')));return new Response(bytes,{headers:{'content-length':String(bytes.length)}});};
 const loader=createAssetLoader(catalog);let geometryBytes=0;
 for(const asset of assets){
  const resource=await loader(asset,new AbortController().signal,()=>{});assert.equal(resource.parts.length,asset.meshCount);assert.equal(resource.triangles,asset.triangles);geometryBytes+=resource.geometryBytes;
  let disposed=0;resource.geometries.forEach(g=>g.addEventListener('dispose',()=>disposed++));resource.dispose();resource.dispose();assert.equal(disposed,resource.geometries.size);
  const manager=new AtlasAssetManager(catalog,loader);const settle=async()=>{const deadline=Date.now()+20000;while(manager.snapshot().statuses.some(s=>['queued','loading'].includes(s.state))){assert.ok(Date.now()<deadline);await new Promise(r=>setTimeout(r,2));}};
  try{for(let i=0;i<2;i++){manager.setDesired([asset.id]);await settle();assert.equal(manager.snapshot().resources[0].geometryBytes,resource.geometryBytes);manager.setDesired([]);await settle();assert.equal(manager.snapshot().resources.length,0);}
   failure=true;manager.setDesired([asset.id]);await settle();assert.equal(manager.snapshot().statuses[0].state,'error');failure=false;manager.retry(asset.id);await settle();assert.equal(manager.snapshot().resources.length,1);
  }finally{failure=false;manager.dispose();}
 }
 // Actual decoded bufferViews include NORMAL stride padding; accessor element
 // bytes in the geometry report intentionally exclude that padding.
 let decodedBufferBytes=0;
 for(const asset of assets){const glb=await readFile(path.join(root,'public',asset.path));const g=JSON.parse(glb.subarray(20,20+glb.readUInt32LE(12)));for(const v of g.bufferViews){const e=v.extensions?.EXT_meshopt_compression;if(e)decodedBufferBytes+=e.count*e.byteStride;}}
 assert.equal(geometryBytes,decodedBufferBytes);assert.equal(decodedBufferBytes,1128724);
 check('Four real modules decode, dispose once, unload/reload without growth and recover after 503');
 console.log(JSON.stringify({success:true,checks:checks.length,newMuscles:42,newMeshes:48,newTriangles:40724,geometryBytes,bodyStructures:355,bodyMeshes:387}));
}finally{
 globalThis.fetch=oldFetch;if(oldWindow===undefined)delete globalThis.window;else globalThis.window=oldWindow;
 assert.ok(path.resolve(temporary).startsWith(root+path.sep+'.muscle-gaps-tests-'));await rm(temporary,{recursive:true,force:true});
}
