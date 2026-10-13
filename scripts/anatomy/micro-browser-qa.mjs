import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, withinQaDeadline} from './browser-qa.mjs';
import {MICRO_MODULES} from '../../src/features/anatomy/micro/registry.ts';

const h=await createHarness({output:process.env.QA_OUTPUT_DIR||'.cache/anatomy-completion/wave5/browser-retry',viewport:{width:1366,height:900},actionTimeoutMs:90000,navigationTimeoutMs:180000,meshTimeoutMs:240000});
const {page}=h, requests=[], report={environment:'Headless Chromium / ANGLE SwiftShader; CPU and frame intervals are software-renderer measurements, not physical GPU FPS.',checks:[],modules:[],errors:h.errors,badRequests:h.badRequests};
page.on('request',request=>{if(request.url().includes('/micro/'))requests.push(request.url());});
await h.context.addInitScript(()=>{
  window.__microBuffers={created:0,deleted:0,drawCpuMs:[],frames:[]};
  for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext].filter(Boolean)){
    const c=C.prototype.createBuffer,d=C.prototype.deleteBuffer;
    C.prototype.createBuffer=function(...args){if(this.canvas.closest('.micro-viewport'))window.__microBuffers.created++;return c.apply(this,args);};
    C.prototype.deleteBuffer=function(buffer){if(buffer&&this.canvas.closest('.micro-viewport'))window.__microBuffers.deleted++;return d.call(this,buffer);};
    for(const name of ['drawElements','drawArrays']){const f=C.prototype[name];C.prototype[name]=function(...args){const started=performance.now(),result=f.apply(this,args);if(this.canvas.closest('.micro-viewport')){const q=window.__microBuffers;q.drawCpuMs.push(performance.now()-started);if(q.frames.length<2000)q.frames.push(started);}return result;};}
  }
});
try {await withinQaDeadline(async()=>{
  await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal');await page.waitForFunction(()=>window.__med3dAtlasScene?.().parts.length>0);
  await page.evaluate(()=>{window.__bodyCanvas=document.querySelector('.atlas-canvas canvas');});
  assert.equal(requests.length,0);report.checks.push('No micro asset requested with the body');
  for(const module of MICRO_MODULES){
    const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});await input.fill(module.parentIds[0]);
    await page.locator('.atlas-search-result[data-node-id="'+module.parentIds[0]+'"]').click();
    const access=page.getByRole('button',{name:/Explorar microanatomía/}).filter({hasText:module.title});
    console.log('OPEN',module.id);
    await access.click();await page.waitForFunction(id=>window.__med3dMicroQa?.id===id&&!window.__med3dMicroQa.disposed,module.id);
    await page.locator('.micro-viewport canvas').waitFor();await page.waitForTimeout(700);
    await page.waitForFunction(()=>window.__med3dMicroQa?.drawCalls>0);
    const metrics=await page.evaluate(()=>({...window.__med3dMicroQa}));report.modules.push(metrics);
    assert.ok(metrics.bytes>0);assert.equal(await page.locator('canvas').count(),2);
    for(const width of [1366,1050,900,768,390]){
      await page.setViewportSize({width,height:width===390?844:900});await page.waitForTimeout(500);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.ok(await page.locator('.micro-dialog').evaluate(element=>element.scrollWidth<=element.clientWidth));
      assert.ok(await page.getByRole('button',{name:'Cerrar microanatomía'}).isVisible());
      const box=await page.locator('.micro-viewport canvas').boundingBox();assert.ok(box.width>250&&box.height>=200);
      await page.screenshot({path:path.join(h.output,module.id.replace(':','-')+'-'+width+'.png')});
      report.checks.push(module.id+' responsive '+width+' no overflow, model and close visible');
    }
    const canvas=page.locator('.micro-viewport canvas'),before=await canvas.screenshot(),box=await canvas.boundingBox();
    await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5);await page.mouse.down();await page.mouse.move(box.x+box.width*.65,box.y+box.height*.6,{steps:12});await page.mouse.up();await page.waitForTimeout(350);
    assert.notDeepEqual(await canvas.screenshot(),before,'Micro rotation changes real rendered pixels');
    await page.getByRole('button',{name:'Restablecer vista',exact:true}).click();
    metrics.interaction=await page.evaluate(()=>({...window.__med3dMicroQa}));
    await page.keyboard.press('Escape');await page.locator('.micro-dialog').waitFor({state:'detached'});await page.waitForTimeout(1200);
    assert.ok(await page.evaluate(()=>window.__med3dMicroQa.disposed));
    assert.ok(await page.evaluate(()=>document.querySelector('.atlas-canvas canvas')===window.__bodyCanvas));
    assert.equal(await page.locator('.atlas-detail-content h2').textContent(),module.parentIds[0]==='nervous:cerebrum'?'Cerebro · regiones disponibles':'Riñón derecho');
    await page.setViewportSize({width:1366,height:900});
    await access.click();await page.waitForFunction(()=>!window.__med3dMicroQa?.disposed);await page.getByRole('button',{name:'Cerrar microanatomía'}).click();await page.waitForTimeout(1200);
    report.checks.push(module.id+' rotation, reset, Escape, reopen, close, disposal, original Canvas and selection retained');
  }
  // Actual failed fetch followed by user retry. Expected HTTP error is kept separately.
  const module=MICRO_MODULES[0];await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(module.parentIds[0]);await page.locator('.atlas-search-result[data-node-id="'+module.parentIds[0]+'"]').click();
  await page.route('**/'+module.path,route=>route.fulfill({status:503,body:'controlled QA failure'}),{times:1});
  await page.getByRole('button',{name:/Explorar microanatomía/}).filter({hasText:module.title}).click();await page.getByRole('button',{name:'Reintentar microanatomía'}).click();await page.locator('.micro-viewport canvas').waitFor();await page.getByRole('button',{name:'Cerrar microanatomía'}).click();await page.waitForTimeout(1200);
  report.checks.push('Controlled asset failure and retry; no main Canvas remount');
  report.resources=await page.evaluate(()=>window.__microBuffers);assert.equal(report.resources.created,report.resources.deleted,'All micro WebGL buffers released after close');
  assert.deepEqual(h.errors,[]);assert.equal(h.badRequests.length,1);assert.equal(h.badRequests[0].status,503);report.expectedFailure=h.badRequests[0];report.requests=requests;report.success=true;
},600000,'Micro browser QA');console.log('PASS micro QA',JSON.stringify(report.modules));}
catch(error){report.success=false;report.error=error.stack;throw error;}
finally{await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
