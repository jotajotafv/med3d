// Runs unchanged application input/controllers. real mode keeps the real MediaPipe Worker/WASM/model.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runAtlasGestures,runLoadMatrix} from './gesture-acceptance-scenarios.mjs';
import {installAcceptanceFixture,observeAcceptanceControllers} from './gesture-acceptance-fixture.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.XR_PLAYWRIGHT_MODULE||'playwright');
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const mode=args.mode||'controlled',scenario=args.scenario||'minimal',graphics=args.graphics||'normal',dpr=Number(args.dpr||1),headed=args.headed==='true';
const origin=process.env.XR_QA_DEV_ORIGIN||'http://127.0.0.1:5173';
const output=process.env.XR_QA_OUTPUT||`.cache/xr-gesture-acceptance/${mode}-${scenario}-${graphics}-dpr${dpr}-${headed?'headed':'headless'}${args.run?'-'+args.run:''}`;
await mkdir(output,{recursive:true});
try{await readFile(output+'/result.json');throw new Error('Refusing to overwrite prior QA evidence: '+output);}catch(error){if(error.code!=='ENOENT')throw error;}
const images={};
if(mode==='real')for(const [key,name]of [['pointing','pointing_up.jpg'],['fist','fist.jpg'],['thumb','thumb_up.jpg'],['two','right_hands.jpg']])images[key]='data:image/jpeg;base64,'+(await readFile('.cache/xr-gesture-acceptance/input/'+name)).toString('base64');
// Full Chromium preserves the installed GPU path; headless_shell remains an explicit diagnostic override.
const executablePath=process.env.XR_BROWSER_EXECUTABLE||chromium.executablePath();
const browser=await chromium.launch({headless:!headed,ignoreDefaultArgs:['--hide-scrollbars'],executablePath,
  args:graphics==='swiftshader'?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
const context=await browser.newContext({viewport:{width:Number(args.width||1366),height:1000},deviceScaleFactor:dpr,hasTouch:true});
await context.addInitScript(installAcceptanceFixture,{mode,images});
const page=await context.newPage();page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(120000);
const report={executable:executablePath,date:new Date().toISOString(),mode,scenario,graphics,dpr,headed,delegateOverride:args.delegate??null,allModules:args['all-modules']==='true',section:args.section??'all',viewport:{width:Number(args.width||1366),height:1000},chrome:browser.version(),checks:[],errors:[],requests:[],captures:[]};
report.harnessHashes=Object.fromEntries(await Promise.all(['gesture-acceptance-browser-qa.mjs','gesture-acceptance-fixture.mjs','gesture-acceptance-scenarios.mjs','gesture-minimal-qa.tsx'].map(async name=>[name,createHash('sha256').update(await readFile('scripts/xr/'+name)).digest('hex')])));
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(r.url().includes('.wasm')||r.url().includes('hand_landmarker')||r.url().endsWith('.glb'))report.requests.push({url:r.url(),status:r.status()});});
await page.route('**/hand-tracking.worker.ts?*',async route=>{
  const response=await route.fetch(),original=await response.text();
  const needle='const result = detector.detectForVideo(message.bitmap, message.timestamp);';
  assert.ok(original.includes(needle),'Observe the actual production detectForVideo call');
  let body=original.replace(needle,'const __qaStart=performance.now(); '+needle+' send({type:"qa-inference",sampleTime:message.timestamp,start:__qaStart,end:performance.now(),timeOrigin:performance.timeOrigin});');
  if(args.delegate==='GPU'){assert.ok(body.includes('baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },'));body=body.replace('baseOptions: { modelAssetPath: modelUrl, delegate: "CPU" },','canvas: new OffscreenCanvas(1,1), baseOptions: { modelAssetPath: modelUrl, delegate: "GPU" },');}
  await route.fulfill({response,body});
});
if(scenario==='minimal')await page.route('**/gesture-acceptance-minimal',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><style>body{font:16px sans-serif;background:#111;color:white}button{padding:12px}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/med3d/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(type)=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/med3d/scripts/xr/gesture-minimal-qa.tsx"></script></body></html>`}));
const pass=(name,evidence={})=>{report.checks.push({name,status:'PASS',...evidence});console.log('PASS',name);};
const mark=name=>page.evaluate(name=>window.gestureQa.mark(name),name);
const put=hands=>page.evaluate(h=>{window.gestureQa.hands=h;window.gestureQa.photo=null;window.gestureQa.plan=null;},hands);
const pose=()=>page.evaluate(()=>window.gestureQa.pose?.());
const waitTracking=()=>page.waitForFunction(()=>window.gestureQa.state==='tracking',null,{timeout:12000,polling:100});
const at=point=>page.evaluate(point=>{
  const w=document.querySelector('.xr-atlas-workspace').getBoundingClientRect(),c=document.querySelector('.xr-atlas-card')?.getBoundingClientRect()??w;
  const l=Math.max(0,Math.min(w.left,c.left)),t=Math.max(0,Math.min(w.top,c.top)),r=Math.min(innerWidth,Math.max(w.right,c.right)),b=Math.min(innerHeight,Math.max(w.bottom,c.bottom));
  const width=Math.max(r-l,(b-t)*4/3),height=width/(4/3);
  return {id:'Left',u:(point.x-l+(width-r+l)/2)/width,v:(point.y-t+(height-b+t)/2)/height,ratio:.5};
},point);
const snapshot=()=>page.evaluate(()=>{const q=window.gestureQa;return {timeOrigin:q.timeOrigin,sent:q.sent,received:q.received,maxInFlight:q.maxInFlight,produced:q.produced,
  frames:q.frames,video:q.video,raf:q.raf,longTasks:q.longTasks,tracking:q.tracking,inference:q.inference,marks:q.marks,dwellEvents:q.dwellEvents??[],fired:q.fired??[],state:q.state,inputHands:q.hands,surface:q.surface,normalized:q.normalized,point:q.point,pose:q.pose?.()};});
const summary=timeline=>{
  const stats=a=>{a=[...a].sort((a,b)=>a-b);return {n:a.length,min:a[0]??null,p50:a[Math.floor(a.length*.5)]??null,p95:a[Math.floor(a.length*.95)]??null,p99:a[Math.floor(a.length*.99)]??null,max:a.at(-1)??null};};
  const frames=timeline.frames,valid=frames.filter(f=>f.hands>0),deltas=a=>a.slice(1).map((f,i)=>f.time-a[i].time);
  return {frames:frames.length,validHands:valid.length,maxInFlight:timeline.maxInFlight,receiveIntervalsMs:stats(deltas(frames)),validIntervalsMs:stats(deltas(valid)),sampleAgeMs:stats(frames.map(f=>f.time-f.sampleTime)),
    inferenceMs:stats(timeline.inference.map(f=>f.end-f.start)),bitmapMs:stats(timeline.video.filter(f=>f.kind==='bitmap').map(f=>f.end-f.start)),rafMs:stats(timeline.raf.map(f=>f.dt)),
    sourceFrameIntervalsMs:stats(deltas(timeline.video.filter(f=>f.kind==='produced'))),visibility:[...new Set(frames.map(f=>f.visibility))],videoReadyStates:[...new Set(frames.map(f=>f.readyState))],pausedVideoSamples:frames.filter(f=>f.paused).length,
    inputCallbackMs:stats(timeline.tracking.map(f=>f.end-f.time)),longTasks:stats(timeline.longTasks.map(f=>f.duration)),
    transitions:timeline.tracking.filter((f,i,a)=>!i||f.state!==a[i-1].state).map(({time,sampleTime,state,hands})=>({time,sampleTime,state,hands})),
    videoMonotonic:frames.every((f,i)=>!i||f.currentTime>=frames[i-1].currentTime),sampleMonotonic:frames.every((f,i)=>!i||f.sampleTime>frames[i-1].sampleTime)};
};
try{
  await page.goto(origin+(scenario==='minimal'?'/med3d/gesture-acceptance-minimal':'/med3d/experiencia-xr/?xrQa=1'));
  if(scenario!=='minimal')await page.waitForFunction(()=>window.__med3dXrAtlas?.().meshes===207,null,{timeout:60000,polling:500});
  if(report.allModules&&scenario!=='minimal'){
    for(const id of ['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'])await page.locator('[data-xr-hand-control="'+id+'-toggle"]').evaluate(el=>{if(!el.checked)el.click();});
    await page.waitForFunction(()=>{const s=window.__med3dXrAtlas();return s.modules.length===92&&s.meshes===1240;},null,{timeout:180000,polling:500});
    await page.locator('[data-xr-hand-control="integumentary-toggle"]').evaluate(el=>el.click());
  }
  await page.evaluate(observeAcceptanceControllers);
  await (scenario==='minimal'?page.locator('#qa-start'):page.getByRole('button',{name:'Activar control con manos',exact:true})).click();
  await page.waitForFunction(()=>document.querySelector('#qa-camera')?.textContent==='active'||document.querySelector('.xr-tracking-status')?.textContent.includes('Activa'),null,{timeout:45000,polling:200});
  if(scenario!=='minimal')await page.locator('.xr-viewport').scrollIntoViewIfNeeded();
  const stableHand={id:'Left',u:Number(args.width||1366)<600?.25:.45,v:.45,ratio:.5,image:args.image||'pointing',size:280};
  await put([stableHand]);
  await waitTracking();
  const start=await mark('stable-15s-start');await page.waitForTimeout(15000);const end=await mark('stable-15s-end');
  const measured=await snapshot(),span=measured.tracking.filter(f=>f.time>=start&&f.time<=end),valid=measured.frames.filter(f=>f.time>=start&&f.time<=end&&f.hands>0);
  if(mode==='real'){assert.ok(measured.inference.length>0);assert.ok(report.requests.some(r=>r.url.endsWith('.wasm')&&r.status===200));assert.ok(report.requests.some(r=>r.url.endsWith('hand_landmarker.task')&&r.status===200));pass('actual MediaPipe Worker, WASM, task model and detectForVideo observed');}
  report.continuity={durationMs:end-start,validSamples:valid.length,losses:span.filter(f=>f.state!=='tracking').length,summary:summary({...measured,frames:measured.frames.filter(f=>f.time>=start&&f.time<=end),tracking:span,raf:measured.raf.filter(f=>f.time>=start&&f.time<=end),longTasks:measured.longTasks.filter(f=>f.time>=start&&f.time<=end),video:measured.video.filter(f=>(f.time??f.start)>=start&&(f.time??f.start)<=end),inference:measured.inference.filter(f=>f.sampleTime>=start&&f.sampleTime<=end)})};
  assert.ok(valid.length>=100,'At least 100 real-time hand samples in 15 s');assert.equal(report.continuity.losses,0,'No unexpected tracking loss during the stable interval');
  assert.ok(report.continuity.summary.validIntervalsMs.max<=250,'No unintended sample gap above 250 ms');
  assert.ok(measured.maxInFlight<=1,'One frame in flight');pass('stable hand for 15 seconds',report.continuity);
  let imageAnchor;
  if(mode==='real'){
    const n=measured.normalized[0];
    imageAnchor={x:.5+(stableHand.u-n.indexX)*640/280,y:.5+(n.indexY-stableHand.v)*480/280};
    report.imageAnchor=imageAnchor;
  }
  if(scenario==='minimal'){
    const rect=await page.locator('[data-xr-hand-control=qa-dwell]').boundingBox(),h=await at({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
    if(imageAnchor)Object.assign(h,{anchor:imageAnchor,size:240,image:'pointing'});
    await put([]);await page.waitForTimeout(500);await put([h]);await waitTracking();
    await page.waitForFunction(()=>Number(document.querySelector('#qa-fires').textContent)===1,null,{timeout:7000,polling:100});
    await page.waitForTimeout(1200);assert.equal(await page.locator('#qa-fires').textContent(),'1');
    const fired=await page.evaluate(()=>window.gestureQa.fired.filter(f=>f.target?.id==='qa-dwell'));
    assert.equal(fired.length,1);assert.equal(fired[0].elapsedMs,1000);pass('isolated dwell fires once at 1000 ms');
    const events=await page.evaluate(()=>window.gestureQa.dwellEvents??[]),zero=events.find(e=>e.target?.id==='qa-dwell'&&e.state==='dwelling'&&e.elapsedMs===0);
    assert.ok(zero&&fired[0].sampleTime-zero.sampleTime>=1000,'No early isolated dwell');
    await put([]);await page.waitForTimeout(600);await put([{id:'Left',u:.2,v:.5,ratio:.5,...(imageAnchor?{anchor:imageAnchor,size:240,image:'pointing'}:{})}]);await waitTracking();await page.waitForTimeout(550);
    await put([]);await page.waitForTimeout(600);await put([h]);await waitTracking();await page.waitForFunction(()=>Number(document.querySelector('#qa-fires').textContent)===2,null,{timeout:7000,polling:100});pass('isolated dwell does not fire early and rearms after stable departure');
    if(mode==='real'){
      report.calibration={};
      for(const image of ['pointing','fist','thumb']){
        await put([{id:'Left',u:.5,v:.4,ratio:.5,image,size:280}]);
        const start=await page.evaluate(()=>window.gestureQa.received);
        await page.waitForFunction(start=>window.gestureQa.received>=start+20,start,{timeout:12000,polling:100});
        report.calibration[image]=await page.evaluate(()=>window.gestureQa.normalized);
      }
    }
  }
  if(args.suite==='gestures') await runAtlasGestures({page,mode,report,pass,mark,put,pose,at,waitTracking,output,imageAnchor,section:args.section});
  if(args.suite==='load') await runLoadMatrix({page,mode,report,pass,mark,put,snapshot,summary,output});
  assert.deepEqual(report.errors,[],'No browser JavaScript errors');
  report.status='PASS';
}catch(error){report.status='NOT_PASSED';report.failure={message:String(error),stack:error.stack};console.log('NOT_PASSED',String(error));process.exitCode=1;}
finally{
  const timeline=await snapshot().catch(()=>null);if(timeline){report.summary=summary(timeline);report.last={inputHands:timeline.inputHands,surface:timeline.surface,state:timeline.state,normalized:timeline.normalized,point:timeline.point,pose:timeline.pose};await writeFile(output+'/timeline.json',JSON.stringify(timeline));}
  // Evidence/readback after the measured gesture interval, never inside it.
  await put([]).catch(()=>{});
  const file=output+'/final-state.png';await page.screenshot({path:file,timeout:15000}).then(async()=>report.captures.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})).catch(e=>report.captureError=String(e));
  report.renderer=await page.evaluate(()=>{const c=document.querySelector('.xr-scene canvas'),g=c?.getContext('webgl2'),ext=g?.getExtension('WEBGL_debug_renderer_info');return {devicePixelRatio,canvas:c?{width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}:null,renderer:g?g.getParameter(ext?.UNMASKED_RENDERER_WEBGL??g.RENDERER):null};}).catch(()=>null);
  await writeFile(output+'/result.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,status:report.status,frames:report.summary?.frames,lossTransitions:report.summary?.transitions.filter(t=>t.state==='lost').length,last:report.last,renderer:report.renderer}));
  await browser.close();
}
