import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const temp=await mkdtemp(path.resolve('.internal-tests-'));
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
let checks=0;const pass=name=>{checks++;console.log('PASS',name);};
try{
 const files=['catalog-index','body-catalog','explosion','internal-education'];
 for(const file of files){let js=ts.transpileModule(await readFile('src/features/anatomy/atlas/'+file+'.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;for(const dep of files)js=js.replaceAll("'./"+dep+"'","'./"+dep+".mjs'");await writeFile(path.join(temp,file+'.mjs'),js);}
 const load=n=>import(pathToFileURL(path.join(temp,n+'.mjs')));
 const {composeBodyCatalog}=await load('body-catalog'),{createCatalogIndex,flattenTree}=await load('catalog-index'),{resolveInternalDetail,getInternalContextIds,INTERNAL_CONTEXT}=await load('internal-education'),{createExplosionOffsets,explosionTarget}=await load('explosion');
 const systems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive'];
 const catalogs=await Promise.all(systems.map(s=>json('public/models/anatomy/'+s+'/catalog.json'))),old=composeBodyCatalog(...catalogs.slice(0,6)),all=composeBodyCatalog(...catalogs),index=createCatalogIndex(all),newNodes=catalogs.slice(6).flatMap(c=>c.nodes);
 assert.equal(all.coverage.structures,577);assert.equal(all.coverage.meshes,930);assert.equal(all.assets.length,50);
 assert.equal(newNodes.filter(n=>n.kind==='structure').length,27);assert.equal(newNodes.filter(n=>n.kind==='component').length,8);
 for(const node of old.nodes.filter(n=>n.id!=='body'))assert.deepEqual(index.byId.get(node.id),node,'Historical node preserved '+node.id);
 assert.equal(index.byId.get('body').children.length,10);
 assert.equal(flattenTree(all,index,new Set(all.nodes.map(n=>n.id))).length,all.nodes.length);
 for(const node of newNodes)assert.ok(node.meshNames.length||node.children.length,'No empty node '+node.id);
 pass('Ten systems; 577 structures, 930 meshes, 50 modules; historical nodes identical; nonempty hierarchy');
 const selection=await json('research/anatomy/internal-selection.json'),manifest=await json('public/models/anatomy/internal/internal-source-manifest.json'),lock=await json('research/anatomy/internal-source-lock.json');
 assert.equal(selection.approved.length,32);assert.equal(selection.modules.length,5);assert.equal(hash(await readFile('research/anatomy/internal-selection.json')),lock.selectionSha256);
 assert.equal(hash(await readFile('research/anatomy/internal-originals.zip')),lock.sourceZipSha256);assert.equal(manifest.sourceZipSha256,lock.sourceZipSha256);
 const historicFj=new Set(old.nodes.flatMap(n=>n.meshNames).map(m=>m.split('_').at(-1))),newFj=new Set();
 for(const unit of selection.units){
  const node=index.byId.get(unit.id);assert.equal(node.side,unit.side);assert.equal(node.parentId,unit.parent);assert.equal(node.sourceId,unit.sourceId);
  for(const fid of unit.elements){assert.ok(!newFj.has(fid)&&!historicFj.has(fid));newFj.add(fid);}
  for(const q of [node.id,node.name,node.latin,node.sourceId,...node.aliases])assert.ok(index.find(q).some(n=>n.id===node.id),'Search '+q);
  const d=resolveInternalDetail(node);assert.ok(d&&d.fields.length>=5&&d.sources.length>=2);assert.ok(!d.fields.some(([name])=>['Origen','Inserción','Inervación muscular'].includes(name)));
 }
 assert.equal(newFj.size,32);assert.equal(new Set(all.nodes.flatMap(n=>n.meshNames)).size,930);
 assert.equal(newNodes.filter(n=>n.family==='thyroid'&&n.kind==='structure').length,1);assert.equal(index.byId.get('endo:thyroid').meshNames.length,0);assert.equal(index.byId.get('endo:thyroid').children.length,3);
 assert.equal(index.byId.get('lym:FMA9607').children.length,2);assert.equal(index.byId.get('rep:penis').children.length,3);
 assert.equal(index.byId.get('rep:FMA19618').side,'midline');assert.equal(index.byId.get('uri:FMA19667').systemId,'urinary');assert.equal(index.byId.get('dig:FMA7198').systemId,'digestive');
 assert.ok(!newNodes.some(n=>/ovario|útero|ganglio|conducto torácico/i.test(n.name)),'Unavailable candidates never create empty anatomy');
 pass('Curated organs/components; source/Latin/alias search; single urethra, gonads and pancreas; pending anatomy not fabricated');
 for(const [id,targets] of Object.entries(INTERNAL_CONTEXT)){assert.ok(index.byId.has(id),id);for(const target of targets)assert.ok(index.byId.has(target),'Explicit context '+target);}
 assert.ok(getInternalContextIds(index.byId.get('uri:FMA7204'),index.byId).includes('bp3d:FMA14752'));
 assert.ok(getInternalContextIds(index.byId.get('endo:FMA15630'),index.byId).includes('uri:FMA7205'));
 assert.ok(getInternalContextIds(index.byId.get('rep:FMA9600'),index.byId).includes('uri:FMA19667'));
 pass('Existing curated vascular, urinary, digestive, neural and skeletal contexts; no distance inference');
 const offsets=createExplosionOffsets(all,new Set(systems));
 assert.equal(new Set(systems.map(s=>JSON.stringify(offsets.get(s).systems))).size,10);
 for(const node of newNodes)for(const level of ['systems','regions','structures'])assert.deepEqual(explosionTarget(offsets.get(node.id),level,0),[0,0,0]);
 assert.deepEqual(offsets.get('uri:FMA7204').regions,offsets.get('uri:FMA15571').regions);
 assert.deepEqual(offsets.get('uri:FMA15571').regions,offsets.get('uri:FMA15571').structures);
 pass('Ten system slots, coherent urinary region, bounded organ offsets, exact rest in all modes');
 const v=await json('public/models/anatomy/internal/internal-validation.json');assert.equal(v.totalMeshes,32);assert.equal(v.totalTriangles,40704);assert.equal(v.totalBytes,691756);assert.equal(v.positionBits,32);assert.equal(v.additionalDecimation,false);assert.ok(v.maxPositionErrorMetres<1e-7);
 assert.deepEqual(manifest.transform,[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]);assert.equal(manifest.frameControls.length,2);assert.ok(manifest.frameControls.every(c=>c.geometryRecordsIdentical));
 for(const file of manifest.files){const owner=index.byId.get(file.anatomyId);assert.ok(owner.meshNames.includes('bp3d_'+file.sourceId+'_'+file.elementId));assert.equal(file.sourceVersion,selection.approved.find(a=>a.elementId===file.elementId).sourceVersion);if(owner.side==='right'||owner.side==='left'){const center=(owner.bounds[0][0]+owner.bounds[1][0])/2;assert.ok(owner.side==='right'?center<0:center>0,'Native laterality '+owner.id);}}
 for(const c of catalogs.slice(6))for(const asset of c.assets){const bytes=await readFile('public/'+asset.path);assert.equal(bytes.length,asset.bytes);assert.equal(hash(bytes),asset.sha256);assert.equal(asset.frameId,'bodyparts3d-4.0-male');}
 pass('Original/GLB provenance, 4.3 frame controls, numerical conservation, lateral centroids and final hashes');
 console.log(JSON.stringify({success:true,checks,nodes:all.nodes.length,structures:577,componentsNew:8,meshes:930,modules:50}));
}finally{assert.ok(temp.startsWith(path.resolve('.')+path.sep));await rm(temp,{recursive:true,force:true});}
