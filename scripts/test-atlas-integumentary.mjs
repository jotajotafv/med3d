import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=await mkdtemp(path.resolve('.integumentary-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try {
 const files=['catalog-index','body-catalog','explosion','integumentary-education','integumentary-picking'];
 for(const file of files){let js=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)js=js.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temp,file+'.mjs'),js);}
 const load=n=>import(pathToFileURL(path.join(temp,n+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{createExplosionOffsets,explosionTarget}=await load('explosion'),{SKIN_EDUCATION,SKIN_CONTEXT_IDS,getIntegumentaryContextIds}=await load('integumentary-education'),{skinAllowsRaycast}=await load('integumentary-picking');
 const systems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
 const catalogs=await Promise.all(systems.map(s=>json('public/models/anatomy/'+s+'/catalog.json'))),old=composeBodyCatalog(...catalogs.slice(0,10)),all=composeBodyCatalog(...catalogs),index=createCatalogIndex(all),skin=index.byId.get('integ:FMA7163'),addition=catalogs.at(-1);
 assert.equal(all.coverage.structures,578);assert.equal(all.coverage.meshes,931);assert.equal(all.assets.length,51);assert.equal(all.nodes.length,972);assert.equal(index.byId.get('body').children.length,11);
 for(const node of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(node.id),node,'Historical identity preserved '+node.id);
 assert.equal(flattenTree(all,index,new Set(all.nodes.map(n=>n.id))).length,972);
 assert.equal(new Set(all.nodes.flatMap(n=>n.meshNames)).size,931);assert.equal(addition.nodes.length,2);assert.equal(skin.kind,'structure');assert.equal(skin.parentId,'integumentary');assert.equal(skin.children.length,0);
 assert.equal(addition.nodes.filter(n=>n.kind==='component'||n.kind==='region').length,0,'No invented regional pieces or histological components');
 pass('Eleven systems, unchanged ten-system identities, unique mesh owner and no empty/fabricated regions');
 for(const q of ['piel','skin','integument','Cutis','FMA7163','FJ2810','BP9115','integ:FMA7163'])assert.ok(index.find(q).some(n=>n.id===skin.id),'Skin search '+q);
 assert.ok(index.find('sistema tegumentario').some(n=>n.id==='integumentary'));
 assert.deepEqual(index.assetIdsFor(skin.id),['integumentary:skin']);assert.ok(index.inside(skin.id,'integumentary'));assert.ok(!index.inside('uri:FMA7204','integumentary'));
 assert.deepEqual(index.reveal(['integumentary','uri:FMA7204'],skin.id),['uri:FMA7204']);
 pass('Spanish, Latin, English and source-ID search; ancestors, asset selection and scoped restoration');
 for(const id of SKIN_CONTEXT_IDS)assert.ok(index.byId.has(id),'Curated context exists '+id);
 assert.deepEqual(getIntegumentaryContextIds(skin,index.byId),SKIN_CONTEXT_IDS);assert.deepEqual(getIntegumentaryContextIds(index.byId.get('uri:FMA7204'),index.byId),[]);
 assert.ok(SKIN_EDUCATION.fields.length>=5&&SKIN_EDUCATION.sources.every(s=>s.url.startsWith('https://')));
 pass('Explicit skin references and educational distinction between surface and histology');
 for(const opacity of [1,.75,.5,.25,.1]){
  assert.equal(skinAllowsRaycast(opacity,false),true,'Skin alone is selectable');
  assert.equal(skinAllowsRaycast(opacity,true),opacity===1,'Transparent envelope does not block internal picking');
 }
 assert.equal(skinAllowsRaycast(NaN,true),true);
 const offsets=createExplosionOffsets(all,new Set(systems));
 for(const level of ['systems','regions','structures'])for(const amount of [0,.5,1])assert.deepEqual(explosionTarget(offsets.get(skin.id),level,amount),[0,0,0]);
 for(const node of all.nodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(node.id),level,0),[0,0,0]);
 const oldOffsets=createExplosionOffsets(old,new Set(systems.slice(0,10))),skinOff=createExplosionOffsets(all,new Set(systems.slice(0,10)));
 for(const node of old.nodes)assert.deepEqual(oldOffsets.get(node.id),skinOff.get(node.id),'Skin off retains prior explosion '+node.id);
 pass('Deterministic transparent picking, coherent intact skin and exact zero in all explosion modes');
 const lock=await json('research/anatomy/integumentary-source-lock.json'),manifest=await json('public/models/anatomy/integumentary/integumentary-source-manifest.json'),v=await json('public/models/anatomy/integumentary/integumentary-validation.json');
 assert.equal(hash(await readFile('research/anatomy/integumentary-originals.zip')),lock.sourceZipSha256);assert.equal(hash(await readFile('research/anatomy/integumentary-selection.json')),lock.selectionSha256);
 assert.equal(manifest.files.length,1);assert.equal(manifest.files[0].elementId,'FJ2810');assert.equal(manifest.files[0].sourceId,'FMA7163');assert.equal(manifest.files[0].sourceVersion,'4.0');
 assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 assert.equal(v.totalTriangles,203382);assert.equal(v.totalMeshes,1);assert.equal(v.totalBytes,1631504);assert.equal(v.positionBits,32);assert.equal(v.additionalDecimation,false);assert.ok(v.maxPositionErrorMetres<1e-7);
 for(const asset of addition.assets){const bytes=await readFile('public/'+asset.path);assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);assert.equal(asset.frameId,'bodyparts3d-4.0-male');}
 pass('Pinned native original and final GLB hashes, common transform and numerical conservation');
 const registration=await json('public/models/anatomy/integumentary/integumentary-registration.json');
 assert.equal(registration.skinBoundingBoxEnclosesReference,true);assert.equal(registration.probeSummary.total,24);assert.equal(registration.probeSummary.within,24);assert.equal(registration.connectedComponents,100);assert.equal(registration.anatomicalComponents,0);assert.equal(registration.boundaryEdges,1512);assert.equal(registration.nonManifoldEdges,0);
 pass('Native topology retained; 24 bounded body-envelope reference probes, not clinical thickness');
 console.log(JSON.stringify({success:true,checks,systems:11,structures:578,nodes:972,meshes:931,modules:51}));
} finally {assert.ok(temp.startsWith(path.resolve('.')+path.sep));await rm(temp,{recursive:true,force:true});}
