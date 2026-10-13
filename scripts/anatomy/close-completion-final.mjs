/** Reconcile actual Git/catalog cohorts with every original gap. No geometry writes. */
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {atlasTestCompiler} from '../xr/atlas-test-compiler.mjs';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const write=async(p,v)=>fs.writeFile(p,JSON.stringify(v,null,2)+'\n');
const base='101024e8d4083fcaf991e9c683733d0a02388e29';
const stages={BASELINE:base,WAVE1:'42def42361a0a39af7e1e7494a779bb4befbc382',WAVE2:'83deba445c221adb2a21098143c81e563ae8816a',WAVE3:'a0ec84efce918c0b0241bdcb359014ef6a4f61da',WAVE4:'3dcf955c7aa049826a2166a0be3277a9b6edbf9f',WAVE5:'1cb29b1046a8f3f93a1a39233de69e541efaecbd',FINAL:null};
const git=(sha,p)=>execFileSync('git',['show',sha+':'+p],{maxBuffer:200e6,windowsHide:true});
const names=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'];
const out=path.resolve('.cache/anatomy-completion/final/ledger-compiled'),compile=atlasTestCompiler(out);
for(const f of ['body-catalog','ocular-catalog'])await compile('features/anatomy/atlas/'+f+'.ts');
const {composeBodyCatalog}=await import(pathToFileURL(path.join(out,'features/anatomy/atlas/body-catalog.mjs')));
const {withOcularCoverage}=await import(pathToFileURL(path.join(out,'features/anatomy/atlas/ocular-catalog.mjs')));
async function catalog(sha){const cs=await Promise.all(names.map(async s=>{const p='public/models/anatomy/'+s+'/catalog.json';return sha?JSON.parse(git(sha,p)):read(p);}));const [s,m,n,c,r,d,...others]=cs,eye=others.pop();return composeBodyCatalog(s,m,withOcularCoverage(n,eye),c,r,d,...others);}
function inventory(c){return {systems:new Set(c.assets.map(a=>a.systemId)).size,structures:c.nodes.filter(n=>n.kind==='structure').length,components:c.nodes.filter(n=>n.kind==='component').length,nodes:c.nodes.length,editorials:c.nodes.filter(n=>!['structure','component'].includes(n.kind)).length,meshes:c.assets.reduce((s,a)=>s+a.meshCount,0),modules:c.assets.length,triangles:c.assets.reduce((s,a)=>s+a.triangles,0),glbBytes:c.assets.reduce((s,a)=>s+a.bytes,0)};}
const inventories={};let body;
for(const [stage,sha] of Object.entries(stages)){console.log('INVENTORY',stage);const c=await catalog(sha);inventories[stage]={sha,...inventory(c)};if(stage==='FINAL')body=c;}
const byId=new Map(body.nodes.map(n=>[n.id,n])),assets=new Map(body.assets.map(a=>[a.id,a]));
const baseline=await read('docs/anatomical-gaps-audit.json'),waves={};
for(let w=1;w<=5;w++)waves[w]=await read('research/anatomy/completion-wave'+w+'-decisions.json');
const supplemental=await read('research/anatomy/completion-final-macro-review.json');
const selections={};for(let w=1;w<=4;w++)selections[w]=await read('research/anatomy/completion-wave'+w+'-selection.json');
const micro=await read('research/anatomy/completion-wave5/source-lock.json');
const nativeCandidates=(await read('research/anatomy/completion-wave2/candidate-source-research.json')).candidates;
const sourceEntries=[];
for(const w of [1,2,4]){
 const lock=await read('research/anatomy/completion-wave'+w+'-source-lock.json');
 for(const n of selections[w].nodes.filter(n=>byId.has(n.id)&&n.sourceElements))for(const element of n.sourceElements){
  const f=lock.files.find(f=>f.elementId===element);assert.ok(f);const derivatives=n.assetIds.map(id=>assets.get(id)).filter(Boolean);
  sourceEntries.push({id:'wave'+w+':'+element,wave:w,ownerIds:[n.id],source:'BodyParts3D',asset:element,sourceId:f.sourceId||f.headers['Concept ID'],version:lock.version,url:lock.sourceArchive,doi:[],author:lock.author,organization:'DBCLS',date:lock.acquiredAt,license:lock.license,licenseUrl:lock.licenseUrl,sha256:f.sha256,bytes:f.bytes,sourceFrame:'BodyParts3D 4.0 male OBJ millimetres',targetFrame:body.frame.id,registration:{method:'Native coordinate conversion only; no fitted registration',matrix:[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]},derivative:derivatives.map(a=>({id:a.id,path:'public/'+a.path,sha256:a.sha256,bytes:a.bytes})),attribution:'BodyParts3D, The Database Center for Life Science, CC BY 4.0; original CC BY-SA 2.1 Japan header preserved verbatim.',originalHeader:f.headers,sourceLock:'research/anatomy/completion-wave'+w+'-source-lock.json'});
 }
}
const z=await read('research/anatomy/completion-wave3/manifest.json'),zlock=await read('research/anatomy/completion-wave3-source-lock.json');
for(const f of z.files){const n=selections[3].nodes.find(n=>n.id===f.anatomyId),a=assets.get(f.moduleId);assert.ok(n&&a);sourceEntries.push({id:'wave3:'+n.sourceObject,wave:3,ownerIds:[n.id],source:'Z-Anatomy',asset:n.sourceObject,version:zlock.sourceCommit,url:z.source.originalUrl,doi:[],author:z.source.author,organization:'Z-Anatomy / DBCLS',license:z.source.license,licenseUrl:z.source.licenseUrl,sha256:zlock.sourceBlendSha256,hashScope:'Complete original Startup.blend',selectedOriginalGeometrySha256:f.originalGeometrySha256,sourceArchiveSha256:zlock.sourceZipSha256,sourceFrame:'Pinned Blender evaluated object/world coordinates',targetFrame:body.frame.id,registration:{method:'Positive shared global similarity and one rigid transform per foot; no per-piece fitting',matrix:f.transform,region:n.registrationRegion,evidence:'research/anatomy/completion-wave3/registration.json'},derivative:[{id:a.id,path:'public/'+a.path,sha256:a.sha256,bytes:a.bytes}],attribution:z.source.attribution,sourceLock:'research/anatomy/completion-wave3-source-lock.json'});}
for(const s of micro.sources)sourceEntries.push({...s,wave:5,ownerIds:[s.id],sourceLock:'research/anatomy/completion-wave5/source-lock.json'});
assert.equal(new Set(sourceEntries.map(s=>s.id)).size,sourceEntries.length);
const sourceIdsFor=ids=>sourceEntries.filter(s=>s.ownerIds.some(id=>ids.includes(id))).map(s=>s.id);
const familyGaps={diaphragm:'muscular-diaphragm',intercostals:'muscular-intercostals','gemellus-superior':'muscular-hip-rotators','gemellus-inferior':'muscular-hip-rotators','permanent-tooth':'digestive-teeth',extraocular:'ocular-extraocular','eyelid-muscle':'ocular-extraocular',lens:'ocular-lens',retina:'ocular-retina','pelvic-floor':'muscular-pelvic-floor','anal-sphincter':'digestive-anal','lateral-circumflex-femoral':'cardio-profunda','descending-genicular':'cardio-profunda',tentorium:'nervous-meninges'};
const decisions=[];
for(const g of baseline.gaps){
 if(['reproductive-female-internal','reproductive-female-external'].includes(g.id)){decisions.push({gapId:g.id,structure:g.structure,level:g.level,baselineStatus:g.status,finalStatus:'EXCLUDED_FEMALE',wave:null,integratedIds:[],source:[],license:[],registration:{method:'Not evaluated: explicitly excluded'},evidence:['docs/anatomical-gaps-audit.json'],blocker:null});continue;}
 const history=[],accepted=new Set(),completed=[];
 const add=(wave,r,evidence)=>history.push({wave,status:r.status||r.decision,source:r.source||r.urls||'See pinned wave source lock',finding:r.finding||r.scope||r.reason||r.evidence,attempt:r.attempt||r.attempts||null,nextAction:r.nextAction||null,evidence:[evidence,...(Array.isArray(r.evidence)?r.evidence:[]),...(r.urls||[])]});
 const w1=waves[1].gaps.find(r=>r.gap===g.id);if(w1){add(1,w1,'research/anatomy/completion-wave1-decisions.json');for(const n of selections[1].nodes)if(familyGaps[n.family]===g.id&&byId.has(n.id))accepted.add(n.id);if(w1.status==='INTEGRATED')completed.push(1);}
 const w2=waves[2].gaps.find(r=>r.gap===g.id);if(w2){add(2,w2,'research/anatomy/completion-wave2-decisions.json');for(const id of w2.acceptedNodeIds)if(byId.has(id))accepted.add(id);if(w2.status==='INTEGRATED')completed.push(2);}
 const additionalNative=selections[2].nodes.filter(n=>byId.has(n.id)&&n.sourceElements?.some(e=>nativeCandidates.find(c=>c.elementId===e)?.gaps.includes(g.id))&&g.id!=='digestive-peritoneum'&&!accepted.has(n.id));
 if(additionalNative.length){for(const n of additionalNative)accepted.add(n.id);history.push({wave:2,status:'PARTIAL_ACCEPTED',source:'BodyParts3D 4.0 original identity crosswalk',finding:'Additional accepted native owners mapped from the source-candidate ledger: '+additionalNative.map(n=>n.name).join('; '),nextAction:null,evidence:['research/anatomy/completion-wave2/candidate-source-research.json','research/anatomy/completion-wave2-acceptance.json']});}
 const w3=waves[3].decisions.filter(r=>r.gaps.includes(g.id));
 if(w3.length){
  for(const [status,rows] of Object.entries(Object.groupBy(w3,r=>r.decision)))history.push({wave:3,status,source:[...new Set(rows.map(r=>r.source))],objects:rows.map(r=>r.sourceObject),finding:rows[0].reason,findingScope:'Representative example only; all individual reasons and metrics are preserved at candidateIndices in the source decision ledger.',nextAction:rows[0].nextAction,evidence:['research/anatomy/completion-wave3-decisions.json'],candidateIndices:rows.map(r=>waves[3].decisions.indexOf(r))});
  for(const n of selections[3].nodes)if(n.gaps.includes(g.id)&&byId.has(n.id))accepted.add(n.id);
  if(g.id==='muscular-edb'&&accepted.size===2)completed.push(3);
 }
 for(const r of waves[4].findings.filter(r=>r.gaps.includes(g.id))){add(4,{...r,evidence:r.evidence.map(p=>'research/anatomy/completion-wave4/'+p)},'research/anatomy/completion-wave4-decisions.json');for(const n of selections[4].nodes)if(n.gaps?.includes(g.id)&&byId.has(n.id))accepted.add(n.id);}
 for(const r of supplemental.findings.filter(r=>r.gap===g.id))add(4,r,'research/anatomy/completion-final-macro-review.json');
 const w5=waves[5].findings.find(r=>r.gap===g.id);if(w5){add(5,w5,'research/anatomy/completion-wave5-decisions.json');for(const id of w5.integratedIds||[])accepted.add(id);}
 assert.ok(history.length,'No gap disappears: '+g.id);
 const latest=history.filter(r=>r.wave===Math.max(...history.map(r=>r.wave)));
 const last=latest.find(r=>r.status==='BLOCKED_REGISTRATION')||latest.find(r=>r.status==='BLOCKED_ANATOMY')||latest.find(r=>r.status==='BLOCKED_IDENTITY')||latest[0];
 const finalStatus=accepted.size?(completed.length?'INTEGRATED':'PARTIAL_ACCEPTED'):last.status;
 assert.ok(['INTEGRATED','PARTIAL_ACCEPTED','BLOCKED_SOURCE','BLOCKED_IDENTITY','BLOCKED_REGISTRATION','BLOCKED_LICENSE','BLOCKED_ANATOMY'].includes(finalStatus),g.id+' '+finalStatus);
 const integratedIds=[...accepted].sort(),source=sourceIdsFor(integratedIds),used=sourceEntries.filter(s=>source.includes(s.id));
 const blocker=finalStatus.startsWith('BLOCKED')?{type:finalStatus,sourceInvestigated:last.source,attempt:last.attempt||last.objects||'Inspected original candidates and evidence referenced in the wave decision',reason:last.finding,evidence:last.evidence,nextAction:last.nextAction||({BLOCKED_REGISTRATION:'Obtain homologous regional controls and validate a shared fit, continuity and tissue interfaces.',BLOCKED_ANATOMY:'Obtain a source with justified interfaces; do not deform or invent connecting geometry.',BLOCKED_IDENTITY:'Obtain a separately identified original matching the exact gap, side and non-female scope.',BLOCKED_LICENSE:'Verify an explicit asset-level license permitting redistribution and derivatives.',BLOCKED_SOURCE:'Obtain an attributable scientific 3D original matching the gap and source-lock its identity and license.'}[finalStatus])}:null;
 decisions.push({gapId:g.id,structure:g.structure,system:g.system,level:g.level,baselineStatus:g.status,finalStatus,wave:Math.max(...history.map(r=>r.wave)),integrationWaves:[...new Set(used.map(s=>s.wave))],integratedIds,baselineCoveredIds:g.currentNodeIds,source,investigatedSources:[...new Set(history.flatMap(r=>Array.isArray(r.source)?r.source:[r.source]))],license:[...new Set(used.map(s=>s.license))],registration:{approved:[...new Set(used.map(s=>JSON.stringify(s.registration)))].map(s=>JSON.parse(s)),researchEvidence:history.flatMap(r=>r.evidence)},evidence:[...new Set(history.flatMap(r=>r.evidence))],blocker,scope:finalStatus==='INTEGRATED'?'Original named macroscopic family covered at the documented source resolution; no clinical accuracy claim.':finalStatus==='PARTIAL_ACCEPTED'?'Only listed original units accepted. Aggregates, missing portions and rejected alternatives are not counted as complete coverage.':'Remaining gap blocked; any listed baseline coverage is preserved.',reviewHistory:history,...(g.id==='reproductive-micro'?{excludedSubscope:'EXCLUDED_FEMALE: ovarian follicles; no research/download/integration'}:{})});
}
assert.equal(decisions.length,119);assert.equal(new Set(decisions.map(g=>g.gapId)).size,119);
const bodyNewIds=new Set(Object.values(selections).flatMap(s=>s.nodes.filter(n=>byId.has(n.id)&&n.sourceElements).map(n=>n.id)));
for(const id of bodyNewIds)assert.ok(decisions.some(g=>g.integratedIds.includes(id)),'Approved owner tracked by a gap: '+id);
for(const g of decisions)for(const id of g.integratedIds)assert.ok(byId.has(id)||micro.sources.some(s=>s.id===id),'Real integrated identity '+id);
for(const s of sourceEntries){assert.ok(s.sha256&&s.license&&s.url&&s.derivative.length);for(const d of s.derivative)assert.equal(hash(await fs.readFile(d.path)),d.sha256,'Pinned derivative '+d.path);}
console.log('SOURCE HASHES PASS',sourceEntries.length);
const protection=[];
for(const p of ['docs/anatomical-gaps-audit.json','docs/anatomical-gaps-audit.md']){const bytes=await fs.readFile(p);assert.equal(hash(bytes),hash(git(base,p)));protection.push({path:p,sha256:hash(bytes),baseline:base,unchanged:true});}
const oldModels=execFileSync('git',['ls-tree','-r','--name-only',stages.WAVE2,'public/models'],{encoding:'utf8'}).trim().split('\n').filter(p=>p.endsWith('.glb'));
for(const p of oldModels){console.log('PROTECT',p);const bytes=await fs.readFile(p);assert.equal(hash(bytes),hash(git(stages.WAVE2,p)));protection.push({path:p,sha256:hash(bytes),baseline:stages.WAVE2,unchanged:true});}
assert.equal(execFileSync('git',['diff','--name-only',stages.WAVE2,'--','src/features/xr'],{encoding:'utf8'}).trim(),'','XR interaction untouched since recovered W2');
const glomerulus=await read('research/anatomy/completion-wave5/glomerulus-validation.json');
const swcBytes=await fs.readFile('public/models/anatomy/micro/neuron-102401.swc');
const swcRows=swcBytes.toString().split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>l.split(/\s+/));
const microInventory={modules:micro.sources.length,bodySystemsAdded:0,neuron:{points:swcRows.length,edges:swcRows.filter(r=>Number(r[6])!==-1).length,bytes:swcBytes.length,triangleMeshes:0},glomerulus:{meshes:glomerulus.meshes,triangles:glomerulus.triangles,vertices:glomerulus.vertices,glbBytes:glomerulus.bytes},notIncludedInBodyTotals:true};
const counts=Object.fromEntries(Object.entries(Object.groupBy(decisions,g=>g.finalStatus)).map(([k,v])=>[k,v.length]));
const metadata={schemaVersion:1,date:'2026-10-13',branch:'phase-anatomy-completion-nonfemale',programBase:base,recoveredHead:stages.WAVE2,productHead:stages.WAVE5};
await write('docs/anatomy-completion-sources.json',{...metadata,scope:'Active original assets used by this completion program; historical assets retained in baseline audit/source locks. Withdrawn candidates excluded from used-source totals.',sources:sourceEntries});
await write('docs/anatomy-completion-blockers.json',{...metadata,scope:'One primary terminal blocker per unintegrated gap. History preserves other attempted sources and independent blocker types. Partial scopes retain their residual limits.',blockers:decisions.filter(g=>g.blocker).map(g=>({gapId:g.gapId,structure:g.structure,...g.blocker,allAttempts:g.reviewHistory})),partialScopes:decisions.filter(g=>g.finalStatus==='PARTIAL_ACCEPTED').map(g=>({gapId:g.gapId,acceptedIds:g.integratedIds,limits:g.reviewHistory}))});
await write('docs/anatomy-completion-nonfemale-final.json',{...metadata,closed:true,closureScope:'Anatomical gap decisions only; not global QA acceptance',globalAcceptance:'NOT_FULLY_PASSED: browser gestural XR acceptance remains unapproved',counting:{baselineGaps:119,excludedFemale:2,evaluatedNonfemale:117,unit:'Original gap families, not candidate objects, meshes or bilateral structures',statusCounts:counts,statusSemantics:'INTEGRATED/PARTIAL_ACCEPTED describe approved additions. BLOCKED describes the remaining gap and does not erase baseline partial coverage. wave is the latest review; integrationWaves names contributing cohorts.'},inventories,microInventory,usedSourceAssets:sourceEntries.length,protection:{files:protection,xrInteractionByteUnchangedSince:stages.WAVE2,female:'EXCLUDED_FEMALE; no female geometry downloaded, registered or integrated'},gaps:decisions});
console.log(JSON.stringify({counts,inventories,sources:sourceEntries.length,protectedFiles:protection.length},null,2));
