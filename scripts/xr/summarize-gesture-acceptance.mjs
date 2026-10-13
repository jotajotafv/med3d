// Compact audit of every saved attempt, including failures. Raw timelines stay in .cache.
import {readdir,readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fixtureInputs} from './gesture-acceptance-inputs.mjs';
const root='.cache/xr-gesture-acceptance',destination='research/anatomy/completion-final';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const attempts=[];
for(const entry of await readdir(root,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const file=root+'/'+entry.name+'/result.json',bytes=await readFile(file).catch(()=>null);if(!bytes)continue;
  const r=JSON.parse(bytes),timelineFile=root+'/'+entry.name+'/timeline.json',timelineBytes=await readFile(timelineFile).catch(()=>null);
  const t=timelineBytes?JSON.parse(timelineBytes):null;
  attempts.push({id:entry.name,date:r.date,status:r.status,scope:r.section??'all',mode:r.mode,scenario:r.scenario,chrome:r.chrome,executable:r.executable??null,headed:r.headed,graphics:r.graphics,dpr:r.dpr,viewport:r.viewport,renderer:r.renderer,
    harnessHashes:r.harnessHashes??null,checks:r.checks.map(c=>({name:c.name,status:c.status,...(c.pose?{pose:c.pose}:{})})),failure:r.failure?.message??null,errors:r.errors,continuity:r.continuity??null,summary:r.summary,
    gestureSpans:(r.gestureSpans??[]).map(s=>({...s,nonTrackingCallbacks:t?.tracking.filter(f=>f.time>=s.start&&f.time<=s.end&&f.state!=='tracking').length??null})),loadStages:r.loadStages??[],intentionalInputMarkers:t?.marks??[],last:r.last,captures:r.captures,
    rawEvidence:{report:file,reportSha256:hash(bytes),timeline:timelineFile,timelineSha256:timelineBytes?hash(timelineBytes):null},
    worker:{sent:t?.sent??null,received:t?.received??null,sourceFrames:t?.produced??null,maxInFlight:t?.maxInFlight??null,realInferenceCalls:t?.inference.length??null},
    pipelineAssets:r.requests.filter(a=>a.url.includes('.wasm')||a.url.includes('hand_landmarker.task'))});
}
attempts.sort((a,b)=>a.date.localeCompare(b.date));
const decision=JSON.parse(await readFile(root+'/decision.json','utf8'));
if(!['GLOBAL_ACCEPTED','ENVIRONMENT_BLOCKED'].includes(decision.status))throw Error('Explicit audited decision required');
const validation=JSON.parse(await readFile(root+'/validation.json','utf8'));
const requireAttempt=(id)=>{const r=attempts.find(a=>a.id===id);if(!r||r.status!=='PASS')throw Error('Required acceptance attempt has not passed: '+id);return r;};
const required=JSON.parse(await readFile(root+'/required-attempts.json','utf8'));
for(const id of required)requireAttempt(id);
for(const id of required.filter(id=>id.includes('gestures-')||id.includes('mobile-'))){
  const a=requireAttempt(id);if(a.gestureSpans.some(s=>s.nonTrackingCallbacks!==0))throw Error('Unexpected transition in required gesture: '+id);if(a.scope!=='all')throw Error('Partial gesture scope cannot satisfy acceptance: '+id);
  for(const name of ['XR dwell','system scroll owns','educational card hand scroll','two-pinches pan up','two-pinches pan down','one-pinch rotation','scale, simultaneous','both unchanged scale clamps','150 ms input absence','loss beyond grace']){
    if(!a.checks.some(c=>c.name.includes(name)))throw Error('Missing functional acceptance check '+name+' in '+id);
  }
}
if(validation.xrTests.passed!==181||validation.xrTests.failed!==0)throw Error('181/181 XR tests required');
const changed=execFileSync('git',['diff','--name-only','1b67eaead6b6c39a3fa4fb748b7d3328b20582f1'],{encoding:'utf8',windowsHide:true}).trim().split(/\r?\n/).filter(Boolean);
if(changed.some(p=>!p.startsWith('scripts/xr/')&&!p.startsWith('docs/xr-gesture-acceptance')&&!p.startsWith(destination+'/xr-gesture')&&p!=='docs/anatomy-completion-nonfemale.md'))throw Error('Unexpected change outside the authorized QA paths');
await mkdir(destination+'/xr-gesture-captures',{recursive:true});
const captureRun=requireAttempt(required.find(id=>id.startsWith('real-gestures-')));
const captures=[];
for(const c of captureRun.captures.filter(c=>/\/0[1-8]-/.test(c.file))){const name=c.file.split('/').at(-1),target=destination+'/xr-gesture-captures/'+name;await copyFile(c.file,target);captures.push({file:target,mode:captureRun.mode,attempt:captureRun.id,sha256:hash(await readFile(target))});}
const mobile=requireAttempt(required.find(id=>id.startsWith('real-mobile-'))??required.find(id=>id.startsWith('controlled-mobile-')));
for(const name of ['03-card-scroll.png','08-final-state.png']){const c=mobile.captures.find(c=>c.file.endsWith('/'+name));if(c){const target=destination+'/xr-gesture-captures/mobile-'+name;await copyFile(c.file,target);captures.push({file:target,mode:mobile.mode,attempt:mobile.id,sha256:hash(await readFile(target))});}}
if(decision.status==='ENVIRONMENT_BLOCKED'){for(const id of decision.blockingAttempts){const a=attempts.find(a=>a.id===id);if(!a||a.status==='PASS')throw Error('Blocking attempt must exist and remain failed: '+id);}}
const result={status:decision.status,decision,date:new Date().toISOString(),base:'1b67eaead6b6c39a3fa4fb748b7d3328b20582f1',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8',windowsHide:true}).trim(),requiredAttempts:required,
  productChanged:false,thresholdsChanged:false,physicalWebcamTested:false,validation,fixtures:fixtureInputs,captures,attempts,
  limitations:['Synthetic photographs are composited into a live canvas video. They are not a physical webcam assessment.',
    'All failures are preserved. A successful campaign does not guarantee scheduling deadlines on every machine or every run.',
    'GC was not separately measured. Worker detectForVideo timings are wall-clock durations, not CPU-only profiling.',
    'The readback contrast deliberately takes screenshots inside tracking; functional captures are outside measured gestures.',
    'DPR settings below 1 do not lower the production Canvas below its existing minimum of 1.']};
// One line per attempt keeps complete transition histories compact and future additions reviewable.
const {attempts:allAttempts,...header}=result;
const compact=JSON.stringify(header,null,2).slice(0,-2)+',\n  \"attempts\": [\n'+allAttempts.map(a=>'    '+JSON.stringify(a)).join(',\n')+'\n  ]\n}\n';
await writeFile(destination+'/xr-gesture-acceptance.json',compact);
console.log(JSON.stringify({status:result.status,attempts:attempts.length,captures:captures.length,required:required.length}));
