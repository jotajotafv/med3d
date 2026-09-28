import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const temporary=await mkdtemp(path.resolve('.digestive-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
 const files=['catalog-index','body-catalog','explosion','digestive-education'];
 for(const file of files){let out=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)out=out.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temporary,file+'.mjs'),out);}
 const load=n=>import(pathToFileURL(path.join(temporary,n+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{resolveDigestiveDetail,getDigestiveContextIds}=await load('digestive-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const systems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive'];
 const catalogs=await Promise.all(systems.map(s=>json('public/models/anatomy/'+s+'/catalog.json'))),dig=catalogs[5];
 const catalog=composeBodyCatalog(...catalogs),index=createCatalogIndex(catalog),old=composeBodyCatalog(...catalogs.slice(0,5));
 assert.equal(catalog.coverage.structures,550);assert.equal(catalog.coverage.meshes,898);assert.equal(catalog.assets.length,45);
 for(const n of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(n.id),n,'Historical node '+n.id);
 assert.equal(flattenTree(catalog,index,new Set(catalog.nodes.map(n=>n.id))).length,catalog.nodes.length);
 assert.equal(dig.nodes.filter(n=>n.kind==='structure').length,23);assert.equal(dig.nodes.filter(n=>n.kind==='component').length,17);
 for(const n of dig.nodes){assert.ok(n.meshNames.length||n.children.length,'No empty node '+n.id);assert.ok(resolveDigestiveDetail(n));}
 pass('Six systems: 550 structural units, 898 meshes, 45 modules; historical nodes unchanged; nonempty tree');
 const selection=await json('research/anatomy/digestive-selection.json');assert.equal(selection.units.length,38);
 const owners=new Set(),elements=new Set();
 for(const u of selection.units){
  const n=index.byId.get(u.id);assert.ok(n);assert.equal(n.sourceId,u.sourceId);assert.equal(n.side,u.side);assert.equal(n.assetIds.length,1);assert.equal(n.meshNames.length,u.elements.length);
  for(const name of n.meshNames){assert.ok(!owners.has(name));owners.add(name);}
  for(const fid of u.elements){assert.ok(!elements.has(fid));elements.add(fid);}
  for(const query of [n.name,n.latin,n.id,n.sourceId,...u.elements,...n.aliases])assert.ok(index.find(query).some(v=>v.id===n.id),'Search '+query+' -> '+n.id);
  const detail=resolveDigestiveDetail(n);assert.ok(detail.fields.length>=7);assert.ok(detail.sources.every(s=>s.url.startsWith('https://')));
 }
 assert.equal(owners.size,96);assert.equal(elements.size,96);
 const historicElements=new Set(old.nodes.flatMap(n=>n.meshNames).map(n=>n.split('_').at(-1)));
 assert.ok([...elements].every(fid=>!historicElements.has(fid)));
 for(const [q,id] of [['esofago','dig:FMA7131'],['Gaster','dig:FMA7148'],['yeyuno','dig:FMA7207'],['ileon','dig:FMA7208'],['higado','dig:FMA7197'],['vesicula','dig:FMA7202'],['pancreas','dig:FMA7198']])assert.ok(index.find(q).some(n=>n.id===id));
 pass('Spanish, Latin, aliases, FMA/FJ/IDs; unique owners, no historical geometry duplicates, sourced cards');
 const liver=index.byId.get('dig:FMA7197');assert.equal(liver.meshNames.length,8);assert.equal(liver.children.length,0,'Uncertain liver segmentation is not exposed');
 assert.equal(index.byId.get('dig:FMA7198').meshNames.length,1);assert.ok(!elements.has('FJ2629')&&!elements.has('FJ2630')&&!elements.has('FJ2409'));
 assert.equal(index.byId.get('dig:FMA11338').digestiveType,'unión anatómica');assert.ok(!dig.nodes.some(n=>n.sourceId==='FMA14541'||n.sourceId==='FMA14548'));
 for(const fid of ['FMA59802','FMA59803','FMA59804','FMA59805']){const n=index.byId.get('dig:'+fid);assert.ok(n.side==='right'?n.bounds[1][0]<0:n.bounds[0][0]>0);}
 for(const id of ['dig:FMA7207','dig:FMA7208']){const n=index.byId.get(id);assert.equal(n.children.length,3);assert.ok(n.children.every(c=>index.byId.get(c).kind==='component'));}
 pass('Aggregated liver, one pancreas, ileocecal identity, salivary laterality, grouped intestinal portions');
 const text=await readFile('src/features/anatomy/atlas/digestive-education.ts','utf8');
 for(const id of [...text.matchAll(/'(bp3d:[^']+|skeletal:[^']+|resp:[^']+|dig:[^']+)'/g)].map(m=>m[1]))assert.ok(index.byId.has(id),'Curated context ID '+id);
 assert.ok(getDigestiveContextIds(liver,index.byId).includes('bp3d:FMA50735'));
 assert.ok(getDigestiveContextIds(index.byId.get('dig:FMA7131'),index.byId).includes('resp:FMA7394'));
 for(const n of dig.nodes)for(const id of getDigestiveContextIds(n,index.byId))assert.ok(index.byId.has(id));
 pass('Explicit cross-system context resolves to existing anatomy, no invented mesenteric vessels or autonomic nerves');
 const offsets=createExplosionOffsets(catalog,new Set(systems));
 for(const n of dig.nodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(n.id),level,0),[0,0,0]);
 assert.equal(new Set(systems.map(id=>JSON.stringify(offsets.get(id).systems))).size,6);
 for(const region of ['dig-upper','dig-accessory','dig-small','dig-large'])assert.equal(new Set(dig.nodes.filter(n=>n.meshNames.length&&n.explosionRegionId===region).map(n=>JSON.stringify(offsets.get(n.id).regions))).size,1);
 for(const id of ['dig:FMA7207','dig:FMA7208'])assert.equal(new Set(index.byId.get(id).children.map(c=>JSON.stringify(offsets.get(c).structures))).size,1,'All portions follow their intestinal segment');
 pass('Six system slots; four regional blocks; intestinal loops stay together; exact zero in every mode');
 const v=await json('public/models/anatomy/digestive/digestive-validation.json');assert.equal(v.totalMeshes,96);assert.equal(v.totalTriangles,177240);assert.equal(v.positionBits,32);assert.equal(v.positionQuantization,false);assert.equal(v.additionalDecimation,false);assert.ok(v.maxPositionErrorMetres<1e-7);
 const lock=await json('research/anatomy/digestive-source-lock.json'),manifest=await json('public/models/anatomy/digestive/digestive-source-manifest.json');
 assert.equal(createHash('sha256').update(await readFile('research/anatomy/digestive-selection.json')).digest('hex'),lock.selectionSha256);assert.equal(manifest.selectionSha256,lock.selectionSha256);
 assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);
 for(const a of dig.assets){const b=await readFile('public/'+a.path);assert.equal(b.length,a.bytes);assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256);assert.equal(a.frameId,'bodyparts3d-4.0-male');}
 for(const f of manifest.files){assert.equal(f.sourceId,f.nativeConceptId);assert.ok(elements.has(f.elementId));assert.ok(index.byId.get(f.anatomyId).meshNames.includes('bp3d_'+f.sourceId+'_'+f.elementId));}
 pass('Four final GLB hashes, native per-mesh identities, one transform and oriented-triangle conservation');
 console.log(JSON.stringify({success:true,checks,nodes:catalog.nodes.length,structures:catalog.coverage.structures,components:17,meshes:catalog.coverage.meshes,modules:catalog.assets.length}));
}finally{assert.ok(temporary.startsWith(path.resolve('.')+path.sep));await rm(temporary,{recursive:true,force:true});}
