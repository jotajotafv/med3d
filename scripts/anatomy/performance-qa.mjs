// A single local software-rendering profile, not an extrapolation to mobile GPUs.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHarness, setSlider, withinQaDeadline } from './browser-qa.mjs';
const h=await createHarness({viewport:{width:1366,height:768}}),{page,metrics,choose,reset}=h;
const report={date:new Date().toISOString(),environment:{browser:'Headless Chromium',renderer:'ANGLE SwiftShader software',viewport:{width:1366,height:768},deviceScaleFactor:1,network:'Unthrottled loopback HTTP, no-store responses',physicalDevicesTested:[],limitations:['No desktop, laptop, phone or tablet physical GPU is available in this runtime.','Browser viewport checks cannot represent device GPU, thermal or network performance.','Geometry bytes are owned decoded buffers, not a measurement of GPU VRAM.','JS heap measures the browser JavaScript heap only.','FPS is measured during automated interaction on software WebGL; it is not a hardware performance prediction.']},measurements:{}};
const percentile=(values,p)=>values.length?[...values].sort((a,b)=>a-b)[Math.min(values.length-1,Math.floor(values.length*p))]:null;
const beginFrames=()=>page.evaluate(()=>{window.__atlasQa.frames=[];window.__atlasQa.captureFrames=true;});
const endFrames=async()=>{
  const frames=await page.evaluate(()=>{window.__atlasQa.captureFrames=false;return window.__atlasQa.frames;});
  const intervals=frames.slice(1).map((value,i)=>value-frames[i]).filter(value=>value>0);
  return {renderedFrames:frames.length,sampleDurationMs:frames.length>1?frames.at(-1)-frames[0]:0,fps:frames.length>1?(frames.length-1)*1000/(frames.at(-1)-frames[0]):null,medianFrameIntervalMs:percentile(intervals,.5),p95FrameIntervalMs:percentile(intervals,.95),definition:'Unique requestAnimationFrame timestamps with actual WebGL draw calls while continuous input was issued.'};
};
const measured=async action=>{const start=performance.now();await action();return performance.now()-start;};
try{
  await withinQaDeadline(async()=>{
  await page.goto(h.origin+'/med3d/anatomia/',{waitUntil:'domcontentloaded'});await h.waitMeshes(h.expectedMeshes);
  await page.waitForFunction(()=>Number(document.querySelector('.atlas-viewport')?.dataset.fullSystemMs)>0,null,{timeout:30000});
  report.measurements.initial=await metrics();
  report.measurements.loadMarks=await page.evaluate(()=>performance.getEntriesByType('mark').filter(e=>e.name.startsWith('med3d:')).map(e=>({name:e.name,startTimeMs:e.startTime})));
  report.measurements.resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.endsWith('.glb')).map(e=>({file:e.name.split('/').at(-1),durationMs:e.duration,encodedBodyBytes:e.encodedBodySize,transferBytes:e.transferSize})));
  report.measurements.encodedModelBytes=report.measurements.resources.reduce((s,e)=>s+e.encodedBodyBytes,0);
  const cdp=await h.context.newCDPSession(page);await cdp.send('Performance.enable');
  const browserMetrics=async()=>Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.filter(m=>['JSHeapUsedSize','JSHeapTotalSize','Nodes','Documents','LayoutCount'].includes(m.name)).map(m=>[m.name,m.value]));
  report.measurements.browserMemoryInitial=await browserMetrics();
  const glInfo=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');const ext=gl?.getExtension('WEBGL_debug_renderer_info');return gl?{renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER),vendor:gl.getParameter(ext?ext.UNMASKED_VENDOR_WEBGL:gl.VENDOR)}:null;});
  report.environment.detectedWebGL=glInfo;
  await page.waitForTimeout(1400);await h.view('anterior');
  const canvas=await page.locator('.atlas-canvas canvas').boundingBox(),x=canvas.x+canvas.width*.5,y=canvas.y+canvas.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();await beginFrames();
  const rotationStart=performance.now();let sample=0;
  while(performance.now()-rotationStart<3000){await page.mouse.move(x+Math.sin(sample*.2)*canvas.width*.19,y+Math.cos(sample*.13)*canvas.height*.05);sample++;await new Promise(resolve=>setTimeout(resolve,16));}
  report.measurements.orbit=await endFrames();await page.mouse.up();
  await reset();await beginFrames();
  await page.getByRole('slider',{name:'Separación de piezas'}).evaluate(async input=>{
    const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;
    const start=performance.now();await new Promise(resolve=>{
      const timer=setInterval(()=>{const value=Math.min(100,(performance.now()-start)/30);setter.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));if(value>=100){clearInterval(timer);resolve();}},33);
    });
  });
  report.measurements.explode=await endFrames();await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),0);await reset();
  report.measurements.search=[];
  for(const [query,expected] of [['femur','Fémur izquierdo'],['FÍBULA IZQUIERDA','Peroné izquierdo'],['os femoris','Fémur izquierdo'],['escafoides','Escafoides izquierdo']]){
    const ms=await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).evaluate((input,{query,expected})=>new Promise((resolve,reject)=>{
      const start=performance.now();let timer;
      const inspect=()=>{if([...document.querySelectorAll('.atlas-search-result span')].some(e=>e.textContent===expected)){observer.disconnect();clearTimeout(timer);resolve(performance.now()-start);}};
      const observer=new MutationObserver(inspect);
      observer.observe(document.querySelector('.atlas-sidebar'),{childList:true,subtree:true,characterData:true});
      timer=setTimeout(()=>{observer.disconnect();reject(new Error('Search result did not appear within 5000 ms: '+query+' → '+expected));},5000);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,query);input.dispatchEvent(new Event('input',{bubbles:true}));
      queueMicrotask(inspect);
    }),{query,expected});
    report.measurements.search.push({query,resultPaintMs:ms,definition:'Input event to result DOM mutation; excludes browser transport and human typing.'});
  }
  await reset();await page.getByRole('button',{name:'Capas',exact:true}).click();
  const leg=page.locator('.atlas-region-layers label').filter({hasText:'Miembro inferior izquierdo'}).getByRole('checkbox');
  const asset=h.catalog.assets.find(a=>a.id==='skeletal:leg-left');
  report.measurements.regionUnloadMs=await measured(async()=>{await leg.uncheck();await h.waitMeshes(h.expectedMeshes-asset.meshCount);});
  report.measurements.afterRegionUnload=await metrics();
  report.measurements.regionSearchReloadMs=await measured(async()=>{await choose('Tibia izquierda');await h.waitMeshes(h.expectedMeshes);});
  await reset();await page.getByRole('button',{name:'Capas',exact:true}).click();
  report.measurements.fullUnloadMs=await measured(async()=>{await page.locator('.atlas-layer-toggle input').uncheck();await h.waitMeshes(0);});
  report.measurements.afterFullUnload=await metrics();report.measurements.browserMemoryUnloaded=await browserMetrics();
  assert.equal(report.measurements.afterFullUnload.geometryBytes,0);
  report.measurements.fullReloadMs=await measured(async()=>{await page.locator('.atlas-layer-toggle input').check();await h.waitMeshes(h.expectedMeshes);});
  report.measurements.afterFullReload=await metrics();report.measurements.browserMemoryReloaded=await browserMetrics();
  assert.equal(report.measurements.afterFullReload.geometryBytes,report.measurements.initial.geometryBytes);
  report.measurements.operationTimingDefinition='Region/unload/reload wall times include automated UI click, load and React DOM metrics acknowledgement; not isolated network or GPU kernel timings.';
  assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
  },180000,'Performance validation');
}catch(error){report.success=false;report.error=error.stack;throw error;}
finally{await writeFile(path.join(h.output,'performance-qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
