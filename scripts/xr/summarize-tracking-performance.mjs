// Compact, reproducible report; full traces remain in the ignored cache.
import assert from 'node:assert/strict';
import {readFile,readdir,writeFile,stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {statistics,summarizeWindow} from './tracking-performance-observers.mjs';
const base='4999c8d7fbb298d6faedcbf0287626720d2eb84f';
const directory='.cache/xr-tracking-performance';
const output='research/anatomy/completion-final/xr-tracking-performance.json';
async function artifact(file){
  try{const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return {file,bytes:(await stat(file)).size,sha256:hash.digest('hex')};}
  catch(e){if(e.code==='ENOENT')return null;throw e;}
}
async function workerRenderer(file){
  let tail='';try{for await(const chunk of createReadStream(file,{encoding:'utf8'})){const text=tail+chunk,m=text.match(/"workerRenderer":"([^"\n]+)"/);if(m)return m[1];tail=text.slice(-1024);}}catch(e){if(e.code!=='ENOENT')throw e;}return null;
}
function qosSummary(rows,processes=[]){
  if(!Array.isArray(rows))return rows??null;
  const activeRenderer=processes.filter(p=>p.type==='renderer').sort((a,b)=>b.cpuTime-a.cpuTime)[0]?.id;
  return rows.map(row=>({type:processes.find(p=>p.id===row.id)?.type??'unknown',activeRenderer:row.id===activeRenderer,cpuMs:row.cpuMs,workingSetBytes:row.memory,qos:row.qos,error:row.error,
    threadStates:Object.entries((row.threads??[]).reduce((a,t)=>{const k=JSON.stringify({basePriority:t.basePriority,ok:t.qos?.Ok,control:t.qos?.ControlMask,state:t.qos?.StateMask,error:t.qos?.Error});a[k]=(a[k]??0)+1;return a;},{})).map(([state,n])=>({n,...JSON.parse(state)}))}));
}
const metrics=['sampleGapMs','sampleClockGapMs','sampleAgeMs','inferenceMs','workerQueueMs','resultDeliveryMs','bitmapMs','rafMs','renderCpuMs','drawCalls','programSwitches','longTasks','sourceFrameGapMs'];
function compactWindow(w){
  const categories=w.interruptions.reduce((a,g)=>{a[g.category]=(a[g.category]??0)+1;return a;},{});
  return {stage:w.stage,phase:w.phase,acceptanceEligible:w.acceptanceEligible!==false,start:w.start,end:w.end,durationMs:w.durationMs,
    pass:w.pass,measurementNote:w.measurementNote,firstGeometryAfterActionMs:w.firstGeometryAfterActionMs,allGeometryAfterActionMs:w.allGeometryAfterActionMs,validSamples:w.validSamples,received:w.received,maxInFlight:w.maxInFlight,
    ...Object.fromEntries(metrics.filter(k=>w[k]).map(k=>[k,w[k]])),
    trackingLosses:w.trackingLosses,graceEntries:w.graceEntries,reactCommits:w.reactCommits,
    sampleMonotonic:w.sampleMonotonic,videoMonotonic:w.videoMonotonic,droppedVideoFrames:w.droppedVideoFrames,visibility:w.visibility,focus:w.focus,
    scene:w.scene?{modules:w.scene.modules.length,meshes:w.scene.meshes,visibleMeshes:w.scene.visibleMeshes,materials:w.scene.materials,geometryBytes:w.scene.geometryBytes,bytes:w.scene.bytes,timings:w.scene.timings}:null,
    events:w.eventsByKind,interruptionCount:w.interruptions.length,categories,
    worstInterruptions:[...w.interruptions].sort((a,b)=>b.gap-a.gap).slice(0,3),transitions:w.transitions,
    loadEvents:(w.loadEvents??[]).filter(e=>e.kind==='glb-parse').map(({asset,start,end})=>({asset,start,end})),
  };
}
const runs=[];
for(const entry of await readdir(directory,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const folder=directory+'/'+entry.name;
  let r;try{r=JSON.parse(await readFile(folder+'/result.json','utf8'));}catch(e){if(e.code==='ENOENT')continue;throw e;}
  let timeline=null;try{if(r.windows)timeline=JSON.parse(await readFile(folder+'/timeline.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const artifacts=(await Promise.all(['result.json','timeline.json','main-thread.cpuprofile','diagnostic-trace.json','host-samples.json'].map(f=>artifact(folder+'/'+f)))).filter(Boolean);
  let host=null;
  try{const a=JSON.parse(await readFile(folder+'/host-samples.json','utf8'));const cpu=a.slice(1).map((s,i)=>{let idle=0,total=0;s.cpu.forEach((c,k)=>{for(const key in c){const d=c[key]-a[i].cpu[k][key];total+=d;if(key==='idle')idle+=d;}});return 100*(1-idle/total);});host={freeMemoryBytes:statistics(a.map(x=>x.freeMemory)),cpuPercent:statistics(cpu)};}catch(e){if(e.code!=='ENOENT')throw e;}
  let diagnostic=null;
  try{
    const p=JSON.parse(await readFile(folder+'/main-thread.cpuprofile','utf8')),nodes=new Map(p.nodes.map(n=>[n.id,n.callFrame])),totals={};
    p.samples.forEach((id,i)=>{const n=nodes.get(id),key=n.functionName+' @ '+n.url.split('?')[0];totals[key]=(totals[key]??0)+p.timeDeltas[i]/1000;});
    const tr=JSON.parse(await readFile(folder+'/diagnostic-trace.json','utf8'));
    const gc=tr.traceEvents.filter(e=>['MinorGC','MajorGC'].includes(e.name)&&e.dur!==undefined);
    diagnostic={outsideAcceptance:true,sampledMainThreadMs:p.timeDeltas.reduce((s,x)=>s+x,0)/1000,topSelfTimeMs:Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,20),gc:statistics(gc.map(e=>e.dur/1000)),gcKinds:[...new Set(gc.map(e=>e.name))],gcClockCorrelation:'Separate steady-state diagnostic; not claimed as an exclusive cause of acceptance gaps'};
  }catch(e){if(e.code!=='ENOENT')throw e;}
  runs.push({id:entry.name,date:r.date,status:r.status,failure:r.failure,interruption:r.interruption,
    mode:r.mode,scenario:r.scenario,section:r.section,allModules:r.allModules,through:r.through,secondaryLossInput:r.secondaryLossInput,delegate:r.delegate??r.delegateOverride??'CPU (product)',headed:r.headed,graphics:r.graphics,viewport:r.viewport??{width:r.width,height:r.height,dpr:r.dpr},
    browser:r.chrome??r.browser,renderer:r.renderer,workerRenderer:await workerRenderer(folder+'/timeline.json'),gpuDevices:r.gpuInfo?.devices,
    host,windowsQos:qosSummary(r.windowsQos,r.browserProcesses),windowsQosScriptHash:r.windowsQosScriptHash,sourceHashes:r.hashes??r.harnessHashes,
    interruptionClassifier:timeline?'wall-time-overlap-v2':'original-live-classifier',
    windows:r.windows?.map(w=>{
      if(r.graphics==='swiftshader')w={...w,acceptanceEligible:false,measurementNote:w.validSamples?'Software-rendering stress diagnostic only.':'No valid results after Worker timeout; preserved observation, not active tracking acceptance.'};
      if(!timeline?.q)return compactWindow(w);
      const s=summarizeWindow(timeline,w.start,w.end);
      const target={B_SKELETAL_BASE:205,C_SKELETAL_COMPLETE:207,D_PLUS_MUSCULAR:505,E_PLUS_NERVOUS:694,F_ELEVEN_SYSTEMS:1240}[w.stage];
      const complete=w.phase==='WHILE_LOADING'&&target?timeline.p.render.find(f=>f.start>=w.start&&f.meshes===target)?.end:undefined;
      return compactWindow({...w,allGeometryAfterActionMs:complete===undefined?undefined:complete-w.start,interruptions:s.interruptions,sampleClockGapMs:s.sampleClockGapMs,sampleAgeMs:s.sampleAgeMs});
    }),continuity:r.continuity,gestureSpans:r.gestureSpans,scrollRuns:r.scrollRuns,checks:r.checks,errors:r.errors,
    summary:r.windows?undefined:r.summary,diagnostic,artifacts,captures:r.captures,maxInFlight:r.maxInFlight,observerDropped:r.observerDropped,
  });
}
const ids=['skeletal','muscular','nervous','ocular','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
const anatomy=[];let meshes=0;
for(const id of ids){const c=JSON.parse(await readFile(`public/models/anatomy/${id}/catalog.json`,'utf8'));for(const a of c.assets){meshes+=a.meshCount;const file='public/'+a.path.replace(/^\//,'');anatomy.push({id:a.id,meshes:a.meshCount,...await artifact(file),expectedSha256:a.sha256});}}
assert.equal(anatomy.length,92);assert.equal(meshes,1240);assert.ok(anatomy.every(a=>a.sha256===a.expectedSha256),'Every GLB still matches its approved catalog hash');
const protectedPaths=['src','public','package.json','package-lock.json','vite.config.ts'];
const protectedDiff=execFileSync('git',['diff','--name-only',base,'--',...protectedPaths],{encoding:'utf8',windowsHide:true}).trim();
assert.equal(protectedDiff,'','No product, anatomy, package or gesture source changed');
let validation={};try{validation=JSON.parse(await readFile(directory+'/validation.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
let decision={status:'ENVIRONMENT_BLOCKED',final:false,reason:'Campaign in progress; no acceptance inferred from partial evidence.'};
try{decision=JSON.parse(await readFile(directory+'/decision.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
const report={date:new Date().toISOString(),base,branch:'phase-xr-tracking-performance',decision,productChanged:false,physicalWebcamTested:false,
  thresholds:{watchdogMs:250,graceMs:380,dwellMs:1000,changed:false},concurrency:{systemOwners:2,modulesPerOwner:1,changed:false},
  protocol:{criticalWindowMs:15000,maxFramesInFlight:1,maxInputProductionHz:20,legacyMinimumValidSamples:100,realPipeline:'Photos -> canvas.captureStream -> video -> createImageBitmap -> real Worker/WASM/model -> unchanged landmarks/controllers',renderSuppression:'Diagnostic only; never acceptance',sourceHashNote:'Early runs hashed source files at end; subsequent runs capture at start. Preserved baseline observer source matches the CPU v2 hash. Report individual limitations in the delivery document.'},
  beforeAfter:{productChanged:false,afterProductRun:null,comparisons:'CPU/GPU delegates and execution environments; no product improvement claimed'},
  environment:{...JSON.parse(await readFile(directory+'/environment.json','utf8')),node:process.version,mediapipeVersion:JSON.parse(await readFile('node_modules/@mediapipe/tasks-vision/package.json','utf8')).version},
  inputArtifacts:await Promise.all(['pointing_up.jpg','fist.jpg','thumb_up.jpg','right_hands.jpg'].map(f=>artifact('.cache/xr-gesture-acceptance/input/'+f))),
  preservedObserver:await artifact(directory+'/baseline-observers.mjs'),runs,
  reportGenerator:await artifact('scripts/xr/summarize-tracking-performance.mjs'),
  contextCaptures:await Promise.all(JSON.parse(await readFile(directory+'/captures.json','utf8')).map(async c=>({...c,...await artifact(c.file)}))),
  anatomy:{modules:anatomy.length,meshes,protectedPaths,protectedDiff:protectedDiff?protectedDiff.split(/\r?\n/):[],assets:anatomy},validation,
};
// Millisecond metrics retain microsecond precision; raw files retain original numbers.
// One compact JSON row per run avoids versioning tens of thousands of metric-only lines.
const rounded=JSON.parse(JSON.stringify(report,(_key,value)=>typeof value==='number'&&Number.isFinite(value)?Math.round(value*1000)/1000:value));
const fields=Object.entries(rounded).map(([key,value])=>{
  const json=key==='runs'?'[\n'+value.map(run=>'    '+JSON.stringify(run)).join(',\n')+'\n  ]':JSON.stringify(value,null,2).replaceAll('\n','\n  ');
  return '  '+JSON.stringify(key)+': '+json;
});
await writeFile(output,'{\n'+fields.join(',\n')+'\n}\n');
console.log(JSON.stringify({output,runs:runs.length,modules:anatomy.length,meshes,bytes:(await stat(output)).size,status:decision.status}));
