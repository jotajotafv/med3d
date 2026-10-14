import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {installAcceptanceFixture,observeAcceptanceControllers} from './gesture-acceptance-fixture.mjs';
import {installPerformanceObservers,instrumentPerformance,summarizeWindow} from './tracking-performance-observers.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.XR_PLAYWRIGHT_MODULE||'playwright');
const args=Object.fromEntries(process.argv.slice(2).map(a=>a.replace(/^--/,'').split('=')));
const delegate=args.delegate||'CPU',headed=args.headed==='true',graphics=args.graphics||'normal',minimal=args.scenario==='minimal';
const mode=args.mode||'real',width=Number(args.width||1366),duration=15000;
assert.ok(['CPU','GPU'].includes(delegate),'Supported QA delegate');
assert.ok(['real','controlled'].includes(mode),'Explicit fixture mode');
assert.ok(['normal','swiftshader'].includes(graphics),'Supported graphics diagnostic');
assert.ok(Number.isFinite(width)&&width>=320,'Valid viewport width');
assert.ok(!args.through||['E','H'].includes(args.through),'Supported final matrix stage');
const output=process.env.XR_QA_OUTPUT||`.cache/xr-tracking-performance/${args.run||`${delegate}-${graphics}-${headed?'headed':'headless'}-${minimal?'minimal':'matrix'}-${width}`}`;
await mkdir(output,{recursive:true});
try{await readFile(output+'/result.json');throw Error('Refusing to overwrite '+output);}catch(e){if(e.code!=='ENOENT')throw e;}
const harnessHashes=Object.fromEntries(await Promise.all(['tracking-performance-browser-qa.mjs','tracking-performance-observers.mjs','gesture-acceptance-fixture.mjs','tracking-performance-qos.ps1'].map(async name=>[name,createHash('sha256').update(await readFile('scripts/xr/'+name)).digest('hex')])));
const images={};
for(const [key,name]of [['pointing','pointing_up.jpg'],['fist','fist.jpg'],['thumb','thumb_up.jpg'],['two','right_hands.jpg']])images[key]='data:image/jpeg;base64,'+(await readFile('.cache/xr-gesture-acceptance/input/'+name)).toString('base64');
const executablePath=process.env.XR_BROWSER_EXECUTABLE||chromium.executablePath();
const browser=await chromium.launch({headless:!headed,ignoreDefaultArgs:['--hide-scrollbars'],executablePath,args:graphics==='swiftshader'?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]});
const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,hasTouch:true});
await context.addInitScript(installAcceptanceFixture,{mode,images,maxRecords:60000});
await context.addInitScript(installPerformanceObservers);
const page=await context.newPage();page.setDefaultTimeout(30000);page.setDefaultNavigationTimeout(120000);
const report={date:new Date().toISOString(),delegate,mode,headed,graphics,width,height:1000,dpr:1,chrome:browser.version(),executablePath,windows:[],captures:[],errors:[],requests:[],classification:'ENVIRONMENT_BLOCKED',productChanged:false,through:args.through??'H'};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('response',r=>{if(/\.glb|\.wasm|hand_landmarker\.task/.test(r.url()))report.requests.push({url:r.url(),status:r.status()});});
await instrumentPerformance(page,{delegate});
let releaseBase,releaseComplete;
const baseGate=new Promise(resolve=>releaseBase=resolve),completeGate=new Promise(resolve=>releaseComplete=resolve);
if(!minimal)await page.route('**/skeletal/*.glb',async route=>{
  await baseGate;if(route.request().url().includes('completion2-'))await completeGate;
  await route.continue();
});
if(minimal)await page.route('**/tracking-performance-minimal',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html><head><meta charset="utf-8"><style>body{font:16px sans-serif;background:#111;color:white}button{padding:12px}</style></head><body><div id="root"></div><script type="module">import RefreshRuntime from '/med3d/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>(type)=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/med3d/scripts/xr/gesture-minimal-qa.tsx"></script></body></html>`}));
const timeline=()=>page.evaluate(()=>{
  const q=window.gestureQa,p=window.xrPerf;
  return {q:{timeOrigin:q.timeOrigin,frames:q.frames,video:q.video,raf:q.raf,longTasks:q.longTasks,tracking:q.tracking,inference:q.inference,marks:q.marks,sent:q.sent,received:q.received,maxInFlight:q.maxInFlight,produced:q.produced},p:{events:p.events,render:p.render,commits:p.commits,heap:p.heap,dropped:p.dropped}};
});
const now=()=>page.evaluate(()=>performance.now());
const lightScene=()=>page.evaluate(()=>window.xrPerf.scene?.());
async function window15(stage,phase,action){
  console.log('WINDOW',stage,phase);
  await page.waitForTimeout(1000); // Let prior out-of-window evidence serialization/readback settle.
  const start=await now();await page.evaluate(({stage,phase})=>window.xrPerf.event('qa-window',performance.now(),performance.now(),{stage,phase}),{stage,phase});
  if(action)await action();
  const remain=duration-(await now()-start);if(remain>0)await page.waitForTimeout(remain);
  const end=await now(),data=await timeline(),scene=await lightScene();
  const row={stage,phase,acceptanceEligible:phase!=='DIAGNOSTIC_ONLY',scene,...summarizeWindow(data,start,end)};
  row.firstGeometryAfterActionMs=data.p.render.find(r=>r.start>=start&&r.meshes>(report.windows.at(-1)?.scene?.meshes??0))?.end-start;
  row.loadEvents=data.p.events.filter(e=>['download','glb-parse','geometry-prepare'].includes(e.kind)&&e.end>=start&&e.end<=end);report.windows.push(row);
  await writeFile(output+'/progress.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({stage,phase,pass:row.pass,valid:row.validSamples,gap:row.sampleGapMs.max,inference:row.inferenceMs,losses:row.trackingLosses,modules:scene?.modules.length,meshes:scene?.meshes}));
}
async function loaded(modules,meshes){
  await page.waitForFunction(({modules,meshes})=>{const s=window.xrPerf.scene?.();return s?.modules.length===modules&&s.meshes===meshes;},{modules,meshes},{timeout:180000,polling:250});
}
async function capture(name){
  await page.evaluate(name=>window.xrPerf.event('qa-screenshot-start',performance.now(),performance.now(),{name}),name);
  const file=output+'/'+name+'.png';await page.screenshot({path:file,timeout:30000});
  report.captures.push({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});
  await page.evaluate(name=>window.xrPerf.event('qa-screenshot-end',performance.now(),performance.now(),{name}),name);
}
async function toggle(system,on=true){
  // Invoke the real checkbox handler, without a pointer event that deliberately interrupts hands.
  await page.locator(`[data-xr-hand-control="${system}-toggle"]`).evaluate((el,on)=>{if(el.checked!==on)el.click();},on);
}
try{
  const origin=process.env.XR_QA_DEV_ORIGIN||'http://127.0.0.1:5173';
  await page.goto(origin+(minimal?'/med3d/tracking-performance-minimal':'/med3d/experiencia-xr/?xrQa=1'));
  await page.locator(minimal?'#qa-start':'.xr-atlas-workspace').waitFor();
  await page.evaluate(observeAcceptanceControllers);
  await (minimal?page.locator('#qa-start'):page.getByRole('button',{name:'Activar control con manos',exact:true})).click();
  await page.waitForFunction(()=>document.querySelector('#qa-camera')?.textContent==='active'||document.querySelector('.xr-tracking-status')?.textContent.includes('Activa'),null,{timeout:60000,polling:200});
  if(!minimal)await page.locator('.xr-viewport').scrollIntoViewIfNeeded();
  await page.evaluate(width=>{window.gestureQa.hands=[{id:'Left',u:width<600?.25:.45,v:.45,ratio:.5,image:'pointing',size:280}];},width);
  await page.waitForFunction(()=>window.gestureQa.frames.some(f=>f.hands>0),null,{timeout:30000});
  await page.waitForTimeout(1000);
  if(minimal)await window15('A_MINIMAL','STEADY_STATE');
  else{
    await window15('B_SKELETAL_BASE','WHILE_LOADING',async()=>releaseBase());await loaded(7,205);
    await window15('B_SKELETAL_BASE','STEADY_STATE');await capture('01-skeletal-tracking');
    await window15('C_SKELETAL_COMPLETE','WHILE_LOADING',async()=>releaseComplete());await loaded(9,207);
    await window15('C_SKELETAL_COMPLETE','STEADY_STATE');
    await window15('D_PLUS_MUSCULAR','WHILE_LOADING',()=>toggle('muscular'));await loaded(42,505);
    await window15('D_PLUS_MUSCULAR','STEADY_STATE');
    await window15('E_PLUS_NERVOUS','WHILE_LOADING',()=>toggle('nervous'));await loaded(57,694);
    await window15('E_PLUS_NERVOUS','STEADY_STATE');await capture('02-multiple-systems');
    if(args.through!=='E'){
    await window15('F_ELEVEN_SYSTEMS','WHILE_LOADING',async()=>{for(const id of ['cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary']){await toggle(id);await page.waitForTimeout(900);}});
    await loaded(92,1240);await window15('F_ELEVEN_SYSTEMS','STEADY_STATE');
    await window15('G_92_SKIN_OFF','VISIBILITY_TRANSITION',()=>toggle('integumentary',false));
    await window15('G_92_SKIN_OFF','STEADY_STATE');await capture('03-92-skin-off');
    await window15('H_92_SKIN_ON','VISIBILITY_TRANSITION',()=>toggle('integumentary',true));
    await window15('H_92_SKIN_ON','STEADY_STATE');await capture('04-92-skin-on');
    // Causal contrast only: all resources remain resident. This is never product acceptance.
    await window15('DIAG_RENDER_OFF','DIAGNOSTIC_ONLY',()=>page.evaluate(()=>{window.xrPerf.suspendRender=true;}));
    await window15('DIAG_RENDER_RESTORED','DIAGNOSTIC_ONLY',()=>page.evaluate(()=>{window.xrPerf.suspendRender=false;}));
    }
  }
  if(args.profile==='true'){
    console.log('DIAGNOSTIC CPU/GC trace outside acceptance windows');
    const cdp=await context.newCDPSession(page);
    await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:1000});
    await cdp.send('Tracing.start',{categories:'devtools.timeline,v8,disabled-by-default-v8.gc',transferMode:'ReturnAsStream'});
    await cdp.send('Profiler.start');await page.waitForTimeout(15000);
    const {profile}=await cdp.send('Profiler.stop');await writeFile(output+'/main-thread.cpuprofile',JSON.stringify(profile));
    const complete=new Promise(resolve=>cdp.once('Tracing.tracingComplete',resolve));await cdp.send('Tracing.end');const {stream}=await complete;
    let trace='';for(;;){const chunk=await cdp.send('IO.read',{handle:stream});trace+=chunk.data;if(chunk.eof)break;}await cdp.send('IO.close',{handle:stream});await writeFile(output+'/diagnostic-trace.json',trace);await cdp.detach();
  }
  report.status=report.windows.filter(w=>w.acceptanceEligible!==false).every(w=>w.pass)&&!report.errors.length?'PASS':'NOT_PASSED';
}catch(error){report.status='HARNESS_OR_RUNTIME_ERROR';report.failure={message:String(error),stack:error.stack};console.log(String(error));}
finally{
  releaseBase();releaseComplete();
  const data=await timeline().catch(()=>null);
  if(data){await writeFile(output+'/timeline.json',JSON.stringify(data));report.observerDropped=data.p.dropped;report.maxInFlight=data.q.maxInFlight;}
  report.scene=await lightScene().catch(()=>null);
  report.renderer=await page.evaluate(()=>{const c=document.querySelector('.xr-scene canvas'),g=c?.getContext('webgl2'),ext=g?.getExtension('WEBGL_debug_renderer_info');return {devicePixelRatio,innerWidth,clientWidth:document.documentElement.clientWidth,visibility:document.visibilityState,focused:document.hasFocus(),hardwareConcurrency:navigator.hardwareConcurrency,canvas:c?{width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight}:null,renderer:g?g.getParameter(ext?.UNMASKED_RENDERER_WEBGL??g.RENDERER):null};}).catch(()=>null);
  const browserCdp=await browser.newBrowserCDPSession();report.gpuInfo=await browserCdp.send('SystemInfo.getInfo').then(r=>r.gpu).catch(()=>null);try{
    const {processInfo}=await browserCdp.send('SystemInfo.getProcessInfo');report.browserProcesses=processInfo;
    const ids=processInfo.map(p=>Number(p.id)).filter(Number.isSafeInteger);
    report.windowsQosScriptHash=createHash('sha256').update(await readFile('scripts/xr/tracking-performance-qos.ps1')).digest('hex');
    const command="& '"+resolve('scripts/xr/tracking-performance-qos.ps1').replaceAll("'","''")+"' -ProcessIds @("+ids.join(',')+")";
    report.windowsQos=JSON.parse(execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe',['-NoLogo','-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(command,'utf16le').toString('base64')],{encoding:'utf8',windowsHide:true,timeout:15000}));
  }catch(e){report.windowsQos={unavailable:String(e).slice(0,500)};}
  await browserCdp.detach();
  report.hashes=harnessHashes;
  await writeFile(output+'/result.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({output,status:report.status,renderer:report.renderer,windows:report.windows.length,errors:report.errors,failure:report.failure}));
  await browser.close();
  if(report.status!=='PASS')process.exitCode=1;
}
