// New Fase 3C checks supplement, and do not replace, the original pilot suite.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import {limbsCatalog,PHASE3C_FAMILIES} from './anatomy/limbs-catalog.mjs';
import {PILOT_ASSET_IDS,PILOT_FAMILIES,pilotCatalog} from './anatomy/pilot-catalog.mjs';
import {PHASE3B_ASSET_IDS} from './anatomy/torso-catalog.mjs';
import {spawnSync} from 'node:child_process';
import * as THREE from 'three';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=await mkdtemp(path.join(project,'.limbs-tests-'));
const json=async file=>JSON.parse(await readFile(path.join(project,file),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const previousFetch=globalThis.fetch,previousWindow=globalThis.window;
try {
  for(const file of ['asset-manager','explosion','catalog-index','body-catalog','muscle-education','limb-education','neck-education','camera-framing']){
    const source=(await readFile(path.join(project,'src/features/anatomy/atlas',file+'.ts'),'utf8')).replaceAll('import.meta.env.BASE_URL',JSON.stringify('/med3d/'));
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
    await writeFile(path.join(temporary,file+'.mjs'),compiled.outputText.replaceAll("'./neck-education'","'./neck-education.mjs'").replaceAll("'./catalog-index'","'./catalog-index.mjs'").replaceAll("'./limb-education'","'./limb-education.mjs'"));
  }
  const {composeBodyCatalog,BODY_ROOT_ID}=await import(pathToFileURL(path.join(temporary,'body-catalog.mjs')));
  const {createCatalogIndex}=await import(pathToFileURL(path.join(temporary,'catalog-index.mjs')));
  const {createAssetLoader,AtlasAssetManager}=await import(pathToFileURL(path.join(temporary,'asset-manager.mjs')));
  const {createExplosionOffsets,explosionTarget}=await import(pathToFileURL(path.join(temporary,'explosion.mjs')));
  const {MUSCLE_EDUCATION,resolveMuscleDetail,getMuscleContextIds}=await import(pathToFileURL(path.join(temporary,'muscle-education.mjs')));
  const skeletal=await json('public/models/anatomy/skeletal/catalog.json'),muscular=limbsCatalog(await json('public/models/anatomy/muscular/catalog.json'));
  const catalog=composeBodyCatalog(skeletal,muscular),index=createCatalogIndex(catalog);
  const limbsAssets=muscular.assets.filter(a=>a.provenanceId==='bodyparts3d-4.0-muscular-limbs'),assetIds=new Set(limbsAssets.map(a=>a.id));
  const limbNodes=muscular.nodes.filter(n=>n.assetIds.some(id=>assetIds.has(id))),whole=limbNodes.filter(n=>n.kind==='structure'),owners=limbNodes.filter(n=>n.meshNames.length);
  assert.equal(limbsAssets.length,8);assert.equal(whole.length,48);assert.equal(owners.length,54);assert.equal(new Set(whole.map(n=>n.family)).size,24);
  assert.equal(catalog.assets.length,20);assert.equal(catalog.coverage.structures,293);assert.equal(catalog.coverage.meshes,319);assert.deepEqual(catalog.frame,skeletal.frame);
  assert.equal(muscular.coverage.structures,90);assert.equal(muscular.coverage.meshes,114);assert.equal(Object.keys(MUSCLE_EDUCATION).filter(family=>PHASE3C_FAMILIES.includes(family)).length,45);
  for(const family of new Set(whole.map(n=>n.family)))for(const side of ['right','left'])assert.equal(whole.filter(n=>n.family===family&&n.side===side).length,1);
  const gitFile=file=>{const result=spawnSync('git',['show','1d58140bec7cdf946f3400d461a218756799bbc5:'+file],{cwd:project,maxBuffer:64*1024*1024});assert.equal(result.status,0,result.stderr.toString());return result.stdout;};
  const oldMuscular=JSON.parse(gitFile('public/models/anatomy/muscular/catalog.json'));
  assert.deepEqual(skeletal,JSON.parse(gitFile('public/models/anatomy/skeletal/catalog.json')),'Skeletal source catalog is unchanged');
  for(const asset of [...skeletal.assets,...oldMuscular.assets]){
    assert.equal(hash(await readFile(path.join(project,'public',asset.path))),hash(gitFile('public/'+asset.path)),'Protected old GLB '+asset.id);
    assert.deepEqual(catalog.assets.find(a=>a.id===asset.id),asset,'Old module metadata '+asset.id);
  }
  for(const old of oldMuscular.nodes){const now=muscular.nodes.find(n=>n.id===old.id);assert.ok(now,'Old identity retained '+old.id);
    const before=structuredClone(old),after=structuredClone(now);
    if(['muscular','muscular:region:arm-right','muscular:region:arm-left'].includes(old.id))for(const key of ['bounds','assetIds','children','name','anatomicalName']){delete before[key];delete after[key];}
    assert.deepEqual(after,before,'Every old node stays exact except documented growing ancestors: '+old.id);
  }
  // Compare all old educational cards on their actual nodes, not just key counts.
  const oldEducation=ts.transpileModule(gitFile('src/features/anatomy/atlas/muscle-education.ts').toString(),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  await writeFile(path.join(temporary,'baseline-education.mjs'),oldEducation);
  const baselineEducation=await import(pathToFileURL(path.join(temporary,'baseline-education.mjs')));
  for(const n of oldMuscular.nodes)assert.equal(JSON.stringify(resolveMuscleDetail(n)),JSON.stringify(baselineEducation.resolveMuscleDetail(n)),'Existing card preserved '+n.id);
  const selection=await json('research/anatomy/limbs-selection.json'),manifest=await json('public/models/anatomy/muscular/limbs-source-manifest.json'),validation=await json('public/models/anatomy/muscular/limbs-validation.json'),lock=await json('research/anatomy/muscular-limbs-source-lock.json');
  const selectionSha=hash(await readFile(path.join(project,'research/anatomy/limbs-selection.json')));
  assert.equal(lock.selectionSha256,selectionSha);assert.equal(manifest.selectionSha256,selectionSha);assert.equal(selection.source.geometryExtractedDuringAudit,false);
  assert.deepEqual(selection.counts,{families:24,structures:48,meshes:54,modules:8,candidates:202,approvedConceptRows:54,discardedConceptRows:18,pendingConceptRows:130});
  assert.ok(selection.other.every(r=>['DESCARTADO','PENDIENTE'].includes(r.decision)&&r.reason));
  assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);assert.equal(manifest.additionalRegistration,'none');
  assert.equal(manifest.files.length,54);assert.equal(lock.files.length,54);assert.equal(validation.totalMeshes,54);assert.equal(validation.totalTriangles,179956);
  assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);assert.equal(validation.numericalToleranceMetres,.00005);assert.ok(validation.maxPositionErrorMetres<=.00005);
  assert.equal(hash(await readFile(path.join(project,manifest.sourceZip))),manifest.sourceZipSha256);assert.equal(lock.sourceZipSha256,manifest.sourceZipSha256);
  assert.equal(new Set(manifest.files.map(f=>f.elementId)).size,54);assert.deepEqual(new Set(manifest.files.map(f=>f.elementId)),new Set(selection.approved.map(f=>f.elementId)));
  const oldElements=new Set((await json('public/models/anatomy/muscular/source-manifest.json')).files.concat((await json('public/models/anatomy/muscular/torso-source-manifest.json')).files).map(f=>f.elementId));
  for(const file of manifest.files){assert.ok(!oldElements.has(file.elementId),'No previous geometry duplicated');const n=index.byId.get(file.anatomyId),r=lock.files.find(r=>r.elementId===file.elementId);assert.equal(n.sourceId,file.sourceId);assert.equal(n.side,file.side);assert.equal(n.family,file.family);assert.equal(file.sha256,r.sha256);assert.equal(file.bytes,r.bytes);assert.deepEqual(n.bounds,file.boundsMetres);assert.equal(file.headerCompatibilityVersion,'4.0');assert.equal(file.faces,file.triangles);
    const centerX=(n.bounds[0][0]+n.bounds[1][0])/2;assert.ok(file.side==='right'?centerX<0:centerX>0,'Source side and registered global axis '+file.elementId);
    for(const term of [file.sourceId,file.elementId,n.latin||n.name])assert.ok(index.find(term).some(hit=>(hit.node||hit).id===n.id),'Exact source/name search '+term);
  }
  for(const m of validation.modules){const a=limbsAssets.find(a=>a.id===m.id),data=await readFile(path.join(project,'public',a.path));assert.equal(hash(data),m.sha256);assert.equal(data.length,m.bytes);assert.equal(a.sha256,m.sha256);assert.equal(a.triangles,m.triangles);assert.ok(m.compression.includes('EXT_meshopt_compression'));for(const e of m.elements)assert.ok(e.triangleMultisetAndWindingPreserved&&e.maxPositionErrorMetres<=.00005);}
  for(const side of ['right','left']){const q=index.byId.get('muscular:group:quadriceps:'+side);assert.equal(q.kind,'division');assert.equal(q.children.length,4);for(const id of q.children){const n=index.byId.get(id);assert.equal(n.kind,'structure');assert.equal(manifest.files.find(f=>f.anatomyId===id).isaType,'zone of muscle organ');}
    for(const family of ['bicepsfemoris','gastrocnemius','pronatorteres']){const n=index.byId.get(`med3d:muscle:${family}:${side}`);assert.equal(n.kind,'structure');assert.equal(n.children.length,2);assert.ok(n.children.every(id=>index.byId.get(id).kind==='component'));}}
  for(const n of [...whole,...owners]){const d=resolveMuscleDetail(n);assert.ok(d);for(const key of ['name','latin','region','group','description','function','action','innervation','relations'])assert.ok(d[key]?.trim());assert.ok(d.origins.length&&d.insertions.length&&d.sources.length);for(const s of d.sources)assert.equal(new URL(s.url).protocol,'https:');for(const id of getMuscleContextIds(n,index.byId)){const b=index.byId.get(id);assert.equal(b.systemId,'skeletal');assert.ok(b.side===n.side||b.side==='midline');}}
  const ctx=id=>getMuscleContextIds(index.byId.get(id),index.byId).sort();
  const expected={
    'muscular:group:quadriceps:right':['FMA16586','FMA24474','FMA24486','FMA24477'],
    'muscular:group:quadriceps:left':['FMA16587','FMA24475','FMA24487','FMA24478'],
    'bp3d:FMA38928':['FMA16586','FMA24486','FMA24477'],
    'bp3d:FMA38930':['FMA24474','FMA24486','FMA24477'],
    'med3d:muscle:gastrocnemius:right':['FMA24474','FMA24497'],
    'bp3d:FMA22544':['FMA24477','FMA24521','FMA24507'],
    'bp3d:FMA22545':['FMA24478','FMA24522','FMA24508'],
    'bp3d:FMA45888':['FMA16586','FMA24480','FMA24477'],
    'bp3d:FMA45891':['FMA24474','FMA24480','FMA24477'],
    'bp3d:FMA38560':['FMA23130','FMA23464'],
    'bp3d:FMA38562':['FMA23467','FMA23464'],
    'bp3d:FMA22425':['FMA16586'],
    'bp3d:FMA38460':['FMA23130','FMA24466'],
  };
  for(const [id,bones] of Object.entries(expected))assert.deepEqual(ctx(id),bones.map(f=>'bp3d:'+f).sort(),'Independently curated attachments '+id);
  assert.match(resolveMuscleDetail(index.byId.get('bp3d:FMA45888')).innervation,/tibial/);assert.match(resolveMuscleDetail(index.byId.get('bp3d:FMA45891')).innervation,/fibular común/);
  assert.equal(resolveMuscleDetail(index.byId.get('bp3d:FMA45891')).innervationScope,'component');assert.doesNotMatch(resolveMuscleDetail(index.byId.get('bp3d:FMA45891')).origins.map(a=>a.label).join(' '),/isqui/);
  assert.equal(resolveMuscleDetail({...owners[0],id:'unknown',sourceId:'unknown',kind:'component'}),undefined);
  const missing=new Map(index.byId);missing.delete('bp3d:FMA24507');assert.deepEqual(getMuscleContextIds(index.byId.get('bp3d:FMA22544'),missing).sort(),['bp3d:FMA24477','bp3d:FMA24521']);
  for(const term of ['glúteo','cuádriceps','peroneo largo','recto interno','Musculus supinator'])assert.ok(index.find(term).length);
  const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular'])),reverse=createExplosionOffsets(catalog,new Set(['muscular','skeletal']));
  for(const n of limbNodes){assert.deepEqual(offsets.get(n.id),reverse.get(n.id));for(const level of ['systems','regions','structures']){assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);assert.ok(explosionTarget(offsets.get(n.id),level,1).every(Number.isFinite));}}
  for(const side of ['right','left'])for(const block of ['upper-limb-','lower-limb-']){const members=catalog.nodes.filter(n=>n.explosionRegionId===block+side&&n.meshNames.length);assert.ok(members.some(n=>n.systemId==='skeletal')&&members.some(n=>n.systemId==='muscular'));for(const n of members)assert.deepEqual(offsets.get(n.id).regions,offsets.get(members[0].id).regions);}
  const {ANATOMICAL_VIEWS,fitCameraBounds}=await import(pathToFileURL(path.join(temporary,'camera-framing.mjs')));
  for(const n of limbNodes)for(const aspect of [.42,1,1.8])for(const view of Object.values(ANATOMICAL_VIEWS)){
    const box=new THREE.Box3(new THREE.Vector3(...n.bounds[0]),new THREE.Vector3(...n.bounds[1])),goal=fitCameraBounds(box,34,aspect,view.direction,view.up);
    assert.ok(!box.containsPoint(goal.position)&&goal.minDistance>box.getSize(new THREE.Vector3()).length()/2,'Camera outside selection '+n.id);
    const camera=new THREE.PerspectiveCamera(34,aspect,goal.near,80);camera.position.copy(goal.position);camera.up.copy(goal.up);camera.lookAt(goal.target);camera.updateMatrixWorld();
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=1/1.18+1e-6&&Math.abs(p.y)<=1/1.18+1e-6&&p.z>=-1&&p.z<=1,'All corners fit '+n.id);}
  }

  globalThis.window={location:{origin:'http://localhost'}};let failedAsset,deferredAsset,releaseFetch;
  globalThis.fetch=async(url,options)=>{const pathname=new URL(url).pathname;if(failedAsset&&pathname.endsWith(failedAsset.path))return new Response('controlled limbs failure',{status:503});if(deferredAsset&&pathname.endsWith(deferredAsset.path))await new Promise(resolve=>{releaseFetch=resolve;});options?.signal?.throwIfAborted();const bytes=await readFile(path.join(project,'public',pathname.replace(/^\/med3d\//,'')));return new Response(bytes,{headers:{'content-length':String(bytes.length)}});};
  const loader=createAssetLoader(catalog),released=new Map();let decodedMeshes=0,decodedTriangles=0,geometryBytes=0;
  for(const asset of catalog.assets){const resource=await loader(asset,new AbortController().signal,()=>{});assert.equal(resource.parts.length,asset.meshCount);assert.equal(resource.triangles,asset.triangles);for(const part of resource.parts){assert.ok(part.ancestors.has(BODY_ROOT_ID));assert.equal(part.node.systemId,asset.systemId);assert.deepEqual(part.offset.toArray(),[0,0,0]);}decodedMeshes+=resource.parts.length;decodedTriangles+=resource.triangles;geometryBytes+=resource.geometryBytes;let disposed=0;resource.geometries.forEach(geometry=>geometry.addEventListener('dispose',()=>disposed++));resource.dispose();resource.dispose();assert.equal(disposed,resource.geometries.size);}
  assert.equal(decodedMeshes,319);assert.equal(decodedTriangles,catalog.assets.reduce((total,asset)=>total+asset.triangles,0));
  const trackedLoader=async(...args)=>{const resource=await loader(...args),dispose=resource.dispose.bind(resource);released.set(resource,0);resource.dispose=()=>{released.set(resource,released.get(resource)+1);dispose();};return resource;};
  const manager=new AtlasAssetManager(catalog,trackedLoader),baseIds=[...skeletal.assets.map(asset=>asset.id),...PHASE3B_ASSET_IDS],allIds=catalog.assets.map(asset=>asset.id);
  const settle=async()=>{const deadline=performance.now()+20000;while(manager.snapshot().statuses.some(status=>['queued','loading'].includes(status.state))){if(performance.now()>deadline)throw new Error('Limbs lifecycle did not settle');await new Promise(resolve=>setTimeout(resolve,2));}return manager.snapshot();};
  try{
    manager.setDesired(baseIds);await settle();const baseResources=manager.snapshot().resources;assert.equal(baseResources.length,12);
    for(const asset of limbsAssets){failedAsset=asset;manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().statuses.find(status=>status.id===asset.id).state,'error');assert.equal(manager.snapshot().resources.length,19);assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().statuses.find(status=>status.id===asset.id).state,'error','Failure stays explicit until retry');failedAsset=undefined;manager.retry(asset.id);await settle();assert.equal(manager.snapshot().resources.length,20);assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);manager.setDesired(baseIds);await settle();assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));}
    for(let cycle=0;cycle<3;cycle++){manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);for(const asset of limbsAssets){manager.setDesired(allIds.filter(id=>id!==asset.id));await settle();assert.ok(manager.snapshot().resources.every(resource=>resource.asset.id!==asset.id));manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);}}
    for(const asset of limbsAssets){manager.setDesired(baseIds);await settle();deferredAsset=asset;releaseFetch=undefined;manager.setDesired([...baseIds,asset.id]);const deadline=performance.now()+10000;while(!releaseFetch){if(performance.now()>deadline)throw new Error('Deferred limbs fetch did not start');await new Promise(resolve=>setTimeout(resolve,2));}manager.setDesired(baseIds);releaseFetch();deferredAsset=undefined;manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.length,20);assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));}
    manager.setDesired([]);await settle();assert.equal(manager.snapshot().resources.length,0);
  }finally{manager.dispose();}
  for(const count of released.values())assert.equal(count,1,'Every decoded resource, including late cancelled results, disposed exactly once');
  console.log('Limbs audit/bindings, pilot binaries, preserved frame, 48 sourced cards, scoped context, exact restoration, all 20 real GLBs and every regional failure/reload/cancellation passed:',JSON.stringify({meshes:decodedMeshes,triangles:decodedTriangles,geometryBytes}));
}finally{globalThis.fetch=previousFetch;if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;await rm(temporary,{recursive:true,force:true});}
