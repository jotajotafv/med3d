import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {atlasTestCompiler} from './xr/atlas-test-compiler.mjs';
const out=path.resolve('.cache/anatomy-completion/test-compiled');await mkdir(out,{recursive:true});const compile=atlasTestCompiler(out);
const files=['features/anatomy/atlas/body-catalog.ts','features/anatomy/atlas/ocular-catalog.ts','features/anatomy/atlas/initial-assets.ts','features/anatomy/atlas/explosion.ts','features/xr/atlas/education.ts'];for(const f of files)await compile(f);
const load=rel=>import(pathToFileURL(path.join(out,rel.replace(/\.ts$/,'.mjs'))));
const {composeBodyCatalog}=await load(files[0]),{withOcularCoverage}=await load(files[1]),{initialAtlasAssets}=await load(files[2]),{createExplosionOffsets,explosionTarget}=await load(files[3]),{atlasEducation}=await load(files[4]);
const {createCatalogIndex}=await load('features/anatomy/atlas/catalog-index.ts');
const names=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'];
const catalogs=await Promise.all(names.map(async n=>JSON.parse(await readFile('public/models/anatomy/'+n+'/catalog.json','utf8'))));
const [skeletal,muscular,nervous,cardio,resp,dig,...internal]=catalogs,ocular=internal.pop();
const body=composeBodyCatalog(skeletal,muscular,withOcularCoverage(nervous,ocular),cardio,resp,dig,...internal),index=createCatalogIndex(body),hash=b=>createHash('sha256').update(b).digest('hex');
const audit=JSON.parse(await readFile('docs/anatomical-gaps-audit.json','utf8'));

for(const original of [...audit.currentInventory.assets,...audit.legacyOrganAssets]){
 const file=original.path.startsWith('public/')?original.path:'public/'+original.path;
 assert.equal(hash(await readFile(file)),original.sha256,'Historical model intact '+file);
}
const waves=(await readdir('research/anatomy')).filter(n=>/^completion-wave\d-selection.json$/.test(n));
const selections=await Promise.all(waves.map(async n=>JSON.parse(await readFile('research/anatomy/'+n,'utf8'))));
for (const selection of selections) {
 const prefix='research/anatomy/completion-wave'+selection.wave;
 const lock=JSON.parse(await readFile(prefix+'-source-lock.json','utf8'));
 assert.equal(hash(await readFile(prefix+'-selection.json')),lock.selectionSha256,'Pinned selection');
 assert.equal(hash(await readFile(prefix+'-originals.zip')),lock.sourceZipSha256,'Pinned originals');
}
const activeSelections=[];
for(const selection of selections){
 let acceptance;try{acceptance=JSON.parse(await readFile('research/anatomy/completion-wave'+selection.wave+'-acceptance.json','utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
 if(!acceptance){activeSelections.push(selection);continue;}
 assert.equal(acceptance.selectionSha256,hash(await readFile('research/anatomy/completion-wave'+selection.wave+'-selection.json')));
 const active=new Set(acceptance.acceptedNodeIds),rejected=new Set(acceptance.rejected.map(n=>n.id));
 assert.equal(active.size+rejected.size,selection.nodes.length);assert.ok([...active].every(id=>!rejected.has(id)));
 for(const id of rejected){assert.ok(!index.byId.has(id),'Rejected candidate absent '+id);for(const fj of selection.nodes.find(n=>n.id===id).sourceElements||[])assert.ok(!body.nodes.some(n=>n.meshNames.some(name=>name.endsWith('_'+fj))),'Rejected source absent '+fj);}
 const nodes=selection.nodes.filter(n=>active.has(n.id)).map(n=>({...n,relatedIds:n.relatedIds.filter(id=>!rejected.has(id))}));
 const moduleIds=new Set(nodes.filter(n=>n.sourceElements).flatMap(n=>n.assetIds));
 activeSelections.push({...selection,nodes,modules:selection.modules.filter(m=>moduleIds.has(m.id))});
}
const added=activeSelections.flatMap(s=>s.nodes),modules=activeSelections.flatMap(s=>s.modules),moduleIds=new Set(modules.map(a=>a.id));
assert.equal(new Set(added.map(n=>n.id)).size,added.length);assert.equal(new Set(modules.map(a=>a.id)).size,modules.length);
assert.equal(body.nodes.length,981+added.length);assert.equal(body.assets.length,52+modules.length);
assert.equal(body.nodes.filter(n=>n.kind==='structure').length,580+added.filter(n=>n.kind==='structure').length);
assert.equal(body.nodes.filter(n=>n.kind==='component').length,228+added.filter(n=>n.kind==='component').length);
assert.equal(new Set(body.assets.map(a=>a.systemId)).size,11);
const owners=new Map();for(const n of body.nodes)for(const mesh of n.meshNames){assert.ok(!owners.has(mesh),'One owner '+mesh);owners.set(mesh,n.id);}
for(const asset of body.assets){const bytes=await readFile('public/'+asset.path);assert.equal(hash(bytes),asset.sha256);assert.equal(bytes.length,asset.bytes);if(moduleIds.has(asset.id)){assert.equal(asset.defaultEnabled,false);assert.ok(asset.label?.trim(),'Public module label');}}
const systems=[...new Set(body.assets.map(a=>a.systemId))].filter(s=>s!=='integumentary');
const initial=initialAtlasAssets(body,systems);assert.equal(initial.length,51);assert.ok(initial.every(id=>!moduleIds.has(id)));
for(const module of modules)assert.ok(initialAtlasAssets(body,[module.systemId],[module.id]).includes(module.id));
const offsets=createExplosionOffsets(body,new Set(systems));
for(const n of added){const actual=index.byId.get(n.id);assert.ok(actual);assert.equal(actual.systemId,n.systemId);for(const id of n.relatedIds)assert.ok(index.byId.has(id));if(!n.sourceElements)continue;
 for(const term of [n.name,n.sourceId,n.latin,...n.sourceElements].filter(Boolean))assert.ok(index.find(term).some(x=>x.id===n.id),'Search '+term);
 assert.ok(index.assetIdsFor(n.id).every(id=>moduleIds.has(id)),'Selected owner loads its own new module');
 assert.ok(index.inside(n.id,n.parentId));assert.ok(index.reveal([n.parentId],n.id).every(id=>id!==n.parentId));
 const lesson=body.education[n.educationId];assert.ok(lesson?.description&&lesson.function&&lesson.relations&&lesson.limits&&lesson.sources.length);
 const xr=atlasEducation(actual,body);assert.ok(xr.fields.some(([key,value])=>key==='Descripción'&&value===lesson.description));assert.ok(xr.provenance.length);assert.equal(xr.name,n.name);
 for(const level of ['systems','regions','structures']){assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);assert.ok(explosionTarget(offsets.get(n.id),level,1).every(Number.isFinite));}
}
const wave1=selections.find(s=>s.wave===1);
if(wave1){assert.equal(wave1.nodes.filter(n=>n.family==='permanent-tooth').length,28);assert.ok(wave1.nodes.filter(n=>n.family==='permanent-tooth').every(n=>n.systemId==='digestive'&&n.anatomyType==='Diente permanente'));assert.equal(skeletal.coverage.structures,203);
 assert.deepEqual(wave1.nodes.filter(n=>n.family==='intercostals').map(n=>n.sourceElements.length),[2,2,2]);
 assert.ok(wave1.nodes.filter(n=>n.systemId==='cardiovascular').every(n=>!/^Arteria femoral profunda/.test(n.name)));
 assert.equal(wave1.nodes.filter(n=>n.family==='extraocular').length,12);assert.equal(wave1.nodes.filter(n=>n.family==='eyelid-muscle').length,2);
}
const wave2=activeSelections.find(s=>s.wave===2);
if(wave2){
 const names=[...owners.keys()];
 for(const id of ['FJ1469','FJ1469M','FJ2440'])assert.ok(!names.some(name=>name.endsWith('_'+id)),'No disputed side or duplicate cricoid '+id);
 assert.equal(wave2.nodes.filter(n=>n.family==='completion2:superficial-head-of-flexor-pollicis-brevis').length,2);
 assert.equal(wave2.nodes.filter(n=>n.family?.includes('part-of-longus-colli')).length,3);
 assert.ok(wave2.nodes.filter(n=>n.family?.includes('part-of-longus-colli')).every(n=>n.side==='left'));
 assert.ok(wave2.nodes.filter(n=>n.ocularClass==='tarsal').every(n=>n.kind==='component'&&n.name.startsWith('Tarso')));
 assert.ok(wave2.nodes.filter(n=>n.ocularClass==='ciliary').every(n=>n.name.startsWith('Corona ciliar')));
 assert.ok(!wave2.nodes.some(n=>/yugular externa/i.test(n.name)));
 assert.equal(skeletal.coverage.structures,203,'Connective components do not inflate bone count');
}

const brokenLesson=structuredClone(body);delete brokenLesson.education[added.find(n=>n.educationId).educationId];
assert.throws(()=>createCatalogIndex(brokenLesson),/ficha educativa/);
const report={systems:11,nodes:body.nodes.length,structures:body.nodes.filter(n=>n.kind==='structure').length,components:body.nodes.filter(n=>n.kind==='component').length,meshes:owners.size,modules:body.assets.length,triangles:body.assets.reduce((s,a)=>s+a.triangles,0),bytes:body.assets.reduce((s,a)=>s+a.bytes,0),newNodes:added.length,newModules:modules.length,defaultModules:initial.length,checks:['unique owners and hashes','11 systems','optional defaults and explicit opt-in','ES/Latin/FMA/FJ search','scope and education shared with XR','isolation ancestry and reveal','zero explosion','dentition / aggregate / actual vessel identity']};
await writeFile('.cache/anatomy-completion/catalog-tests.json',JSON.stringify(report,null,2)+'\n');console.log(report);
