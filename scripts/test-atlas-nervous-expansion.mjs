import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const temporary=await mkdtemp(path.resolve('.nervous-expansion-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
 const files=['catalog-index','body-catalog','explosion','nerve-education','nerve-expansion-education'];
 for(const file of files){let output=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)output=output.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temporary,file+'.mjs'),output);}
 const load=name=>import(pathToFileURL(path.join(temporary,name+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{resolveNerveDetail,getNerveContextIds}=await load('nerve-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const skeletal=await json('public/models/anatomy/skeletal/catalog.json'),muscular=await json('public/models/anatomy/muscular/catalog.json'),nervous=await json('public/models/anatomy/nervous/catalog.json'),base=await json('research/anatomy/nervous-expansion-base-catalog.json');
 const catalog=composeBodyCatalog(skeletal,muscular,nervous),index=createCatalogIndex(catalog),selection=await json('research/anatomy/nervous-expansion-selection.json');
 assert.equal(catalog.coverage.structures,411);assert.equal(catalog.coverage.meshes,512);assert.equal(catalog.assets.length,31);
 for(const n of base.nodes)if(!['nervous','nervous:pns'].includes(n.id))assert.deepEqual(nervous.nodes.find(x=>x.id===n.id),n);
 for(const a of base.assets)assert.deepEqual(nervous.assets.find(x=>x.id===a.id),a);
 const old=composeBodyCatalog(skeletal,muscular);for(const n of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(n.id),n);
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 pass('411 structures, 512 meshes, 31 modules; historical structures/assets/IDs retained');
 const added=nervous.nodes.filter(n=>n.id.startsWith('zanatomy:'));assert.equal(added.length,38);assert.equal(added.filter(n=>n.kind==='structure').length,26);assert.equal(added.filter(n=>n.kind==='component').length,12);
 const approved=selection.candidates.filter(r=>r.decision==='APROBADO');assert.equal(approved.length,38);
 for(const r of selection.candidates)assert.equal(index.byId.has(r.id),r.decision==='APROBADO','Audit gates every candidate');
 assert.ok(!nervous.assets.some(a=>a.id==='nervous:spinal'));
 assert.ok(nervous.coverage.limitations.some(s=>s.includes('ciático')));
 for(const n of added){
  for(const query of [n.id,n.name,n.latin,n.sourceId])assert.ok(index.find(query).some(v=>v.id===n.id),'Search '+query);
  assert.ok(index.byId.has(n.regionId));assert.ok(n.meshNames.length&&n.assetIds.length===1);assert.ok(resolveNerveDetail(n),'Card '+n.id);
  assert.ok(n.side==='right'?(n.bounds[0][0]+n.bounds[1][0])<0:(n.bounds[0][0]+n.bounds[1][0])>0);
  const context=getNerveContextIds(n,index.byId);for(const id of context){const c=index.byId.get(id);assert.ok(['skeletal','muscular'].includes(c.systemId));if(c.side)assert.equal(c.side,n.side);}
 }
 const median=index.byId.get('zanatomy:median-nerve-r');assert.ok(getNerveContextIds(median,index.byId).includes('bp3d:FMA38460'));
 const sensory=index.byId.get('zanatomy:lateral-femoral-cutaneous-nerve-r');assert.ok(getNerveContextIds(sensory,index.byId).every(id=>index.byId.get(id).systemId==='skeletal'));
 pass('Audit exclusion, honest coverage, bilateral search/cards and curated motor/sensory contexts');
 const offsets=createExplosionOffsets(catalog,new Set(['skeletal','muscular','nervous']));
 for(const n of added)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
 for(const region of new Set(added.map(n=>n.regionId)))assert.equal(new Set(added.filter(n=>n.regionId===region).map(n=>JSON.stringify(offsets.get(n.id).structures))).size,1,'Regional neural paths remain coherent');
 assert.equal(new Set(['skeletal','muscular','nervous'].map(id=>JSON.stringify(offsets.get(id).systems))).size,3);
 pass('Long nerves/components remain coherent in all explosion modes; exact zero');
 const validation=await json('public/models/anatomy/nervous/nervous-expansion-validation.json');assert.equal(validation.totalMeshes,38);assert.equal(validation.totalTriangles,110592);assert.equal(validation.positionBits,32);assert.equal(validation.positionQuantization,false);assert.equal(validation.additionalDecimation,false);assert.ok(validation.maxPositionErrorMetres<1e-7);
 for(const a of nervous.assets){const bytes=await readFile('public/'+a.path);assert.equal(bytes.length,a.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),a.sha256);}
 const registration=await json('research/anatomy/nervous-expansion-registration.json');
 for(const region of Object.values(registration.regions)){
  assert.ok(region.landmarkCount>=10);const m=region.matrix,s=registration.globalFit.uniformScale;
  for(let a=0;a<3;a++)for(let b=0;b<3;b++){let dot=0;for(let k=0;k<3;k++)dot+=m[k][a]*m[k][b];assert.ok(Math.abs(dot-(a===b?s*s:0))<1e-10,'Uniform scale, no shear');}
 }
 for(const r of approved)assert.ok(r.boneCheck.maxPenetrationMm<=.5);
 pass('Original oriented topology, Float32, asset hashes and measured global-scale/regional-rigid registration');
 console.log(JSON.stringify({success:true,checks,nodes:catalog.nodes.length,structures:411,meshes:512,modules:31}));
}finally{await rm(temporary,{recursive:true,force:true});}
