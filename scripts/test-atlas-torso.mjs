// New Fase 3B checks supplement, and do not replace, the original pilot suite.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';
import {PILOT_ASSET_IDS,PILOT_FAMILIES,pilotCatalog} from './anatomy/pilot-catalog.mjs';
import {torsoCatalog,PHASE3B_FAMILIES} from './anatomy/torso-catalog.mjs';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=await mkdtemp(path.join(project,'.torso-tests-'));
const json=async file=>JSON.parse(await readFile(path.join(project,file),'utf8'));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const previousFetch=globalThis.fetch,previousWindow=globalThis.window;
try {
  for(const file of ['asset-manager','explosion','catalog-index','body-catalog','muscle-education','limb-education']){
    const source=(await readFile(path.join(project,'src/features/anatomy/atlas',file+'.ts'),'utf8')).replaceAll('import.meta.env.BASE_URL',JSON.stringify('/med3d/'));
    const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}});
    await writeFile(path.join(temporary,file+'.mjs'),compiled.outputText.replaceAll("'./catalog-index'","'./catalog-index.mjs'").replaceAll("'./limb-education'","'./limb-education.mjs'"));
  }
  const {composeBodyCatalog,BODY_ROOT_ID}=await import(pathToFileURL(path.join(temporary,'body-catalog.mjs')));
  const {createCatalogIndex}=await import(pathToFileURL(path.join(temporary,'catalog-index.mjs')));
  const {createAssetLoader,AtlasAssetManager}=await import(pathToFileURL(path.join(temporary,'asset-manager.mjs')));
  const {createExplosionOffsets,explosionTarget}=await import(pathToFileURL(path.join(temporary,'explosion.mjs')));
  const {MUSCLE_EDUCATION,resolveMuscleDetail,getMuscleContextIds}=await import(pathToFileURL(path.join(temporary,'muscle-education.mjs')));
  const skeletal=await json('public/models/anatomy/skeletal/catalog.json'),muscular=torsoCatalog(await json('public/models/anatomy/muscular/catalog.json'));
  const originals=JSON.stringify([skeletal,muscular]),catalog=composeBodyCatalog(skeletal,muscular),index=createCatalogIndex(catalog);
  assert.equal(JSON.stringify([skeletal,muscular]),originals,'Full composition never mutates the source catalogs');
  const torsoAssets=muscular.assets.filter(asset=>!PILOT_ASSET_IDS.includes(asset.id)),torsoAssetIds=new Set(torsoAssets.map(asset=>asset.id));
  const torso=muscular.nodes.filter(node=>node.assetIds.some(id=>torsoAssetIds.has(id))),whole=torso.filter(node=>node.kind==='structure'),owners=torso.filter(node=>node.meshNames.length);
  const families=['pectoralismajor','pectoralisminor','serratusanterior','subclavius','externaloblique','trapezius','rhomboidmajor','rhomboidminor','iliocostalislumborum','iliocostalisthoracis','longissimusthoracis','spinalisthoracis','teresmajor'];
  assert.deepEqual(new Set(torsoAssets.map(asset=>asset.id)),new Set(['muscular:thorax-anterior','muscular:abdomen','muscular:back']));
  assert.equal(catalog.assets.length,12);assert.equal(catalog.coverage.meshes,265);assert.equal(muscular.coverage.meshes,60);assert.equal(whole.length,26);assert.equal(owners.length,34);assert.equal(owners.filter(node=>node.kind==='component').length,12);
  assert.deepEqual(new Set(whole.map(node=>node.family)),new Set(families));assert.equal(Object.keys(MUSCLE_EDUCATION).filter(family=>PHASE3B_FAMILIES.includes(family)).length,21);
  assert.deepEqual(catalog.frame,skeletal.frame);assert.equal(catalog.frame.id,'bodyparts3d-4.0-male');assert.equal(index.byId.get(BODY_ROOT_ID).systemId,undefined);
  assert.ok(index.inside('muscular:region:thorax-anterior','muscular:region:trunk'));assert.ok(index.inside('muscular:region:abdomen','muscular:region:trunk'));assert.ok(index.inside('muscular:region:back','muscular:region:trunk'));
  for(const region of ['muscular:region:thorax-anterior','muscular:region:abdomen','muscular:region:back'])assert.equal(index.byId.get(region).systemId,'muscular','Torso is a region, never a new system');
  for(const family of families)for(const side of ['right','left'])assert.equal(whole.filter(node=>node.family===family&&node.side===side).length,1,`${family} ${side} is one anatomical muscle`);
  for(const family of ['rectusabdominis','internaloblique','transversusabdominis','latissimusdorsi'])assert.ok(!muscular.nodes.some(node=>node.family===family),'Absent source family is not fabricated: '+family);

  // The published Fase 3A binary payload and every original source leaf remain stable.
  const pilot=pilotCatalog(muscular),pilotManifest=await json('public/models/anatomy/muscular/source-manifest.json');
  const pilotHashes={'muscular:upper-right':'9aea14bb438f006103f48cf0f42cd2c9d58031973a0e3c355c033f880b719d21','muscular:upper-left':'1a5885fe1258bde59dfc88437726f3ddb9db7dee4c3e4c2ae834feb701c3b559'};
  assert.equal(pilot.coverage.structures,16);assert.equal(pilot.coverage.meshes,26);
  for(const asset of pilot.assets)assert.equal(hash(await readFile(path.join(project,'public',asset.path))),pilotHashes[asset.id]);
  for(const file of pilotManifest.files){const node=index.byId.get(file.anatomyId);assert.ok(node);assert.equal(node.sourceId,file.sourceId);assert.equal(node.side,file.side);assert.equal(node.family,file.family);assert.ok(node.assetIds.every(id=>PILOT_ASSET_IDS.includes(id)));assert.ok(node.meshNames.length);}
  for(const family of PILOT_FAMILIES)assert.ok(MUSCLE_EDUCATION[family]);

  const selection=await json('research/anatomy/torso-selection.json'),manifest=await json('public/models/anatomy/muscular/torso-source-manifest.json'),validation=await json('public/models/anatomy/muscular/torso-validation.json'),sourceLock=await json('research/anatomy/muscular-torso-source-lock.json');
  const selectionSha256=hash(await readFile(path.join(project,'research/anatomy/torso-selection.json')));
  assert.equal(sourceLock.selectionSha256,selectionSha256,'Extraction uses the exact reviewed selection');
  assert.equal(manifest.selectionSha256,selectionSha256,'Conversion uses the exact reviewed selection');
  const transform=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]];
  assert.deepEqual(manifest.transform,transform);assert.deepEqual(validation.transform,transform);assert.equal(manifest.additionalRegistration,'none');
  assert.equal(manifest.files.length,34);assert.equal(sourceLock.files.length,34);assert.equal(validation.totalMeshes,34);assert.equal(validation.positionBits,32);assert.equal(validation.additionalDecimation,false);
  assert.ok(validation.maxPositionErrorMetres<=.00005);assert.ok(validation.maxBoundsErrorMetres<=.00005);assert.equal(validation.numericalToleranceMetres,.00005);
  assert.equal(hash(await readFile(path.join(project,manifest.sourceZip))),manifest.sourceZipSha256);assert.equal(sourceLock.sourceZipSha256,manifest.sourceZipSha256);
  assert.deepEqual(new Set(manifest.files.map(file=>file.elementId)),new Set(selection.approved.map(file=>file.elementId)),'Only the explicitly approved source elements were converted');
  for(const file of manifest.files){const locked=sourceLock.files.find(item=>item.elementId===file.elementId),node=index.byId.get(file.anatomyId);assert.ok(locked&&node);assert.equal(file.sha256,locked.sha256);assert.equal(file.bytes,locked.bytes);assert.equal(node.sourceId,file.sourceId);assert.equal(node.side,file.side);assert.equal(node.family,file.family);assert.deepEqual(node.bounds,file.boundsMetres);assert.equal(file.headerCompatibilityVersion,'4.0');}
  for(const module of validation.modules){const asset=torsoAssets.find(asset=>asset.id===module.id);assert.ok(asset);const bytes=await readFile(path.join(project,'public',asset.path));assert.equal(bytes.length,module.bytes);assert.equal(hash(bytes),module.sha256);assert.equal(asset.meshCount,module.meshes);assert.equal(asset.triangles,module.triangles);assert.ok(module.compression.includes('EXT_meshopt_compression'));for(const element of module.elements){assert.equal(element.triangleMultisetAndWindingPreserved,true);assert.ok(element.maxPositionErrorMetres<=.00005);}}

  for(const node of [...whole,...owners]){const detail=resolveMuscleDetail(node);assert.ok(detail,`Reviewed card for ${node.id}`);for(const key of ['name','latin','region','group','description','function','action','innervation','relations'])assert.ok(detail[key]?.trim(),`Educational ${key}: ${node.id}`);assert.ok(detail.origins.length&&detail.insertions.length&&detail.sources.length);for(const source of detail.sources)assert.equal(new URL(source.url).protocol,'https:');for(const id of getMuscleContextIds(node,index.byId)){const bone=index.byId.get(id);assert.equal(bone.systemId,'skeletal');assert.ok(bone.side===node.side||bone.side==='midline','No contralateral context fallback');}}
  assert.equal(whole.filter(node=>resolveMuscleDetail(node)?.scope==='muscle').length,26);assert.equal(owners.filter(node=>resolveMuscleDetail(node)?.scope==='component').length,12);
  for(const node of catalog.nodes.filter(node=>node.systemId!=='muscular'||!['structure','component'].includes(node.kind))){assert.equal(resolveMuscleDetail(node),undefined);assert.deepEqual(getMuscleContextIds(node,index.byId),[]);}
  const context=id=>getMuscleContextIds(index.byId.get('bp3d:'+id),index.byId);
  assert.deepEqual(new Set(context('FMA34690')),new Set(['bp3d:FMA13322','bp3d:FMA23130']),'Clavicular pectoral has its own origin');
  assert.deepEqual(new Set(context('FMA79979')),new Set(['bp3d:FMA7485','bp3d:FMA23130']),'Sternocostal pectoral keeps the sternum but does not fabricate costal cartilage');
  assert.deepEqual(context('FMA45874'),['bp3d:FMA23130'],'Abdominal pectoral aponeurosis is not replaced by a fake bone');
  assert.deepEqual(new Set(context('FMA33586')),new Set(['bp3d:FMA52735','bp3d:FMA13322']),'Descending trapezius has occipital and ipsilateral clavicle context');
  assert.deepEqual(new Set(context('FMA33584')),new Set(['bp3d:FMA9165','bp3d:FMA9187','bp3d:FMA9209','bp3d:FMA9248','bp3d:FMA13395']),'Transverse trapezius retains its T1–T4 scope and scapular insertion');
  assert.deepEqual(new Set(context('FMA33581')),new Set(['bp3d:FMA9248','bp3d:FMA9922','bp3d:FMA9945','bp3d:FMA9968','bp3d:FMA9991','bp3d:FMA10014','bp3d:FMA10037','bp3d:FMA10059','bp3d:FMA10081','bp3d:FMA13395']),'Ascending trapezius retains its T4–T12 scope and scapular insertion');
  const unknown={...owners[0],id:'unknown-torso-component',sourceId:'unknown',kind:'component'};assert.equal(resolveMuscleDetail(unknown),undefined,'Unknown torso components do not inherit a whole-muscle card');
  const withoutHumerus=new Map(index.byId);withoutHumerus.delete('bp3d:FMA23130');assert.deepEqual(getMuscleContextIds(index.byId.get('bp3d:FMA45874'),withoutHumerus),[],'Missing context omitted without proximity substitution');
  for(const query of ['PECTORAL MAYOR','oblicuo externo','trapecio','romboides','Musculus pectoralis major','FMA34690'])assert.ok(index.find(query).length,'Torso search '+query);

  const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular'])),reversed=createExplosionOffsets(catalog,new Set(['muscular','skeletal']));
  for(const node of torso){assert.deepEqual(offsets.get(node.id),reversed.get(node.id));for(const level of ['systems','regions','structures']){assert.deepEqual(explosionTarget(offsets.get(node.id),level,0),[0,0,0]);assert.ok(explosionTarget(offsets.get(node.id),level,1).every(Number.isFinite));}}
  const torsoRegionOffset=offsets.get(owners[0].id).regions;for(const node of owners){assert.deepEqual(offsets.get(node.id).regions,torsoRegionOffset,'Cross-region torso anatomy stays one coherent presentation block');assert.deepEqual(offsets.get(node.id).systems,offsets.get('muscular').systems);}
  for(const family of ['pectoralismajor','trapezius'])for(const side of ['right','left']){const parent=index.byId.get(`med3d:muscle:${family}:${side}`);assert.equal(parent.children.length,3);assert.equal(new Set(parent.children.map(id=>JSON.stringify(offsets.get(id).structures))).size,3,'Source portions have distinct bounded offsets');}

  globalThis.window={location:{origin:'http://localhost'}};let failedAsset,deferredAsset,releaseFetch;
  globalThis.fetch=async(url,options)=>{const pathname=new URL(url).pathname;if(failedAsset&&pathname.endsWith(failedAsset.path))return new Response('controlled torso failure',{status:503});if(deferredAsset&&pathname.endsWith(deferredAsset.path))await new Promise(resolve=>{releaseFetch=resolve;});options?.signal?.throwIfAborted();const bytes=await readFile(path.join(project,'public',pathname.replace(/^\/med3d\//,'')));return new Response(bytes,{headers:{'content-length':String(bytes.length)}});};
  const loader=createAssetLoader(catalog),released=new Map();let decodedMeshes=0,decodedTriangles=0,geometryBytes=0;
  for(const asset of catalog.assets){const resource=await loader(asset,new AbortController().signal,()=>{});assert.equal(resource.parts.length,asset.meshCount);assert.equal(resource.triangles,asset.triangles);for(const part of resource.parts){assert.ok(part.ancestors.has(BODY_ROOT_ID));assert.equal(part.node.systemId,asset.systemId);assert.deepEqual(part.offset.toArray(),[0,0,0]);}decodedMeshes+=resource.parts.length;decodedTriangles+=resource.triangles;geometryBytes+=resource.geometryBytes;let disposed=0;resource.geometries.forEach(geometry=>geometry.addEventListener('dispose',()=>disposed++));resource.dispose();resource.dispose();assert.equal(disposed,resource.geometries.size);}
  assert.equal(decodedMeshes,265);assert.equal(decodedTriangles,catalog.assets.reduce((total,asset)=>total+asset.triangles,0));
  const trackedLoader=async(...args)=>{const resource=await loader(...args),dispose=resource.dispose.bind(resource);released.set(resource,0);resource.dispose=()=>{released.set(resource,released.get(resource)+1);dispose();};return resource;};
  const manager=new AtlasAssetManager(catalog,trackedLoader),baseIds=[...skeletal.assets.map(asset=>asset.id),...PILOT_ASSET_IDS],allIds=catalog.assets.map(asset=>asset.id);
  const settle=async()=>{const deadline=performance.now()+20000;while(manager.snapshot().statuses.some(status=>['queued','loading'].includes(status.state))){if(performance.now()>deadline)throw new Error('Torso lifecycle did not settle');await new Promise(resolve=>setTimeout(resolve,2));}return manager.snapshot();};
  try{
    manager.setDesired(baseIds);await settle();const baseResources=manager.snapshot().resources;assert.equal(baseResources.length,9);
    for(const asset of torsoAssets){failedAsset=asset;manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().statuses.find(status=>status.id===asset.id).state,'error');assert.equal(manager.snapshot().resources.length,11);assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().statuses.find(status=>status.id===asset.id).state,'error','Failure stays explicit until retry');failedAsset=undefined;manager.retry(asset.id);await settle();assert.equal(manager.snapshot().resources.length,12);assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);manager.setDesired(baseIds);await settle();assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));}
    for(let cycle=0;cycle<3;cycle++){manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);for(const asset of torsoAssets){manager.setDesired(allIds.filter(id=>id!==asset.id));await settle();assert.ok(manager.snapshot().resources.every(resource=>resource.asset.id!==asset.id));manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);}}
    for(const asset of torsoAssets){manager.setDesired(baseIds);await settle();deferredAsset=asset;releaseFetch=undefined;manager.setDesired([...baseIds,asset.id]);const deadline=performance.now()+10000;while(!releaseFetch){if(performance.now()>deadline)throw new Error('Deferred torso fetch did not start');await new Promise(resolve=>setTimeout(resolve,2));}manager.setDesired(baseIds);releaseFetch();deferredAsset=undefined;manager.setDesired(allIds);await settle();assert.equal(manager.snapshot().resources.length,12);assert.equal(manager.snapshot().resources.reduce((total,resource)=>total+resource.geometryBytes,0),geometryBytes);assert.ok(baseResources.every(resource=>manager.snapshot().resources.includes(resource)));}
    manager.setDesired([]);await settle();assert.equal(manager.snapshot().resources.length,0);
  }finally{manager.dispose();}
  for(const count of released.values())assert.equal(count,1,'Every decoded resource, including late cancelled results, disposed exactly once');
  console.log('Torso audit/bindings, pilot binaries, preserved frame, 26 sourced cards, scoped context, exact restoration, all 12 real GLBs and every regional failure/reload/cancellation passed:',JSON.stringify({meshes:decodedMeshes,triangles:decodedTriangles,geometryBytes}));
}finally{globalThis.fetch=previousFetch;if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;await rm(temporary,{recursive:true,force:true});}
