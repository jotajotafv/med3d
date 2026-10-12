/** One fresh browser per performance scenario; no product behavior changes. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,withinQaDeadline} from './browser-qa.mjs';
const scenario=process.argv[2]||'full-with-skin';
const wave=process.env.QA_COMPLETION_WAVE||'wave3';
const selection=JSON.parse(await readFile(path.join(project,'research/anatomy/completion-'+wave+'-selection.json'),'utf8'));
const cats=await Promise.all(['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'].map(async s=>JSON.parse(await readFile(path.join(project,'dist/models/anatomy/'+s+'/catalog.json'),'utf8'))));
const assets=cats.flatMap(c=>c.assets),nodes=cats.flatMap(c=>c.nodes),byId=new Map(nodes.map(n=>[n.id,n]));
const systemsFor={desktop:['skeletal'],mobile:['skeletal'],skeletal:['skeletal'],muscular:['muscular'],nervous:['nervous'],internal:['cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive']};
const systems=systemsFor[scenario]||[...new Set(assets.map(a=>a.systemId))];
const expected=assets.filter(a=>systems.includes(a.systemId)&&(scenario!=='full-without-skin'||a.id!=='integumentary:skin'));
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||'.cache/anatomy-completion/'+wave+'/recovery-'+scenario,viewport:{width:1366,height:900},reducedMotion:'reduce',navigationTimeoutMs:180000,meshTimeoutMs:240000,actionTimeoutMs:90000}),{page}=h;
const report={scenario,environment:'Fresh headless Chromium / ANGLE SwiftShader, HTTP loopback no-store. CPU measures command submission, not GPU completion; frame samples do not establish sustained physical-device FPS.',expectedModules:expected.length,expectedMeshes:expected.reduce((s,a)=>s+a.meshCount,0),expectedTriangles:expected.reduce((s,a)=>s+a.triangles,0),expectedBytes:expected.reduce((s,a)=>s+a.bytes,0),progress:[],checks:[],errors:h.errors,badRequests:h.badRequests};
let received=0;page.on('response',r=>{if(r.url().endsWith('.glb'))received++;});
const started=Date.now(),progress=setInterval(()=>{report.progress.push({elapsedMs:Date.now()-started,glbResponses:received});console.log('PROGRESS',scenario,Date.now()-started,received);},15000);
await h.context.addInitScript(()=>{window.__bufferQa={created:0,deleted:0};for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext].filter(Boolean)){const create=C.prototype.createBuffer,del=C.prototype.deleteBuffer;C.prototype.createBuffer=function(...args){window.__bufferQa.created++;return create.apply(this,args);};C.prototype.deleteBuffer=function(buffer){if(buffer)window.__bufferQa.deleted++;return del.call(this,buffer);};}});
async function action(name){const b=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await b.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await b.click();await page.waitForTimeout(350);}
try{await withinQaDeadline(async()=>{
 const readiness=await fetch(h.origin+'/med3d/');assert.equal(readiness.status,200);report.serverReadyMs=Date.now()-started;
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems.join(',')+'&modules='+expected.map(a=>a.id).join(','));report.navigationCompletedMs=Date.now()-started;
 await h.waitMeshes(report.expectedMeshes);report.allMeshesObservedWallMs=Date.now()-started;
 assert.equal((await h.metrics()).triangleCount,report.expectedTriangles);assert.equal((await h.metrics()).loadedAssets,expected.length);
 await page.evaluate(()=>{window.__atlasQa.captureFrames=true;window.__atlasQa.frames=[];});
 await page.getByRole('button',{name:'Acercar',exact:true}).click();await page.waitForTimeout(1800);
 report.metrics=await h.metrics();report.timing=await page.evaluate(()=>{window.__atlasQa.captureFrames=false;return {frameIntervalsMs:window.__atlasQa.frames.slice(1).map((t,i)=>t-window.__atlasQa.frames[i]),buffers:{...window.__bufferQa,live:window.__bufferQa.created-window.__bufferQa.deleted},transfers:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({file:r.name.split('/').at(-1),bytes:r.encodedBodySize,durationMs:r.duration}))};});
 report.checks.push('All expected modules, meshes and triangles loaded');report.measurementComplete=true;
 // Pixel capture is a separate QA operation: preserve its errors independently
 // from completed load/renderer measurements. Regional/mobile visual QA below
 // remains mandatory; --capture adds a full-body evidence image.
 if(process.argv.includes('--capture'))await page.screenshot({path:path.join(h.output,scenario+'.png'),timeout:240000});
 if(scenario==='mobile'||scenario==='desktop'){
  await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal');await h.waitMeshes(cats[0].assets.filter(a=>a.defaultEnabled!==false).reduce((s,a)=>s+a.meshCount,0));
  await page.setViewportSize({width:scenario==='mobile'?390:1366,height:scenario==='mobile'?844:900});await page.evaluate(()=>{window.__recoveryCanvas=document.querySelector('canvas');});
  const selectedIds=selection.nodes.filter(n=>byId.has(n.id)&&byId.get(n.id).meshNames.length).map(n=>n.id);
  for(const id of (scenario==='mobile'?[selectedIds[0],selectedIds.at(-1)]:selectedIds)){
   if(scenario==='mobile'&&await page.getByRole('button',{name:'Cerrar inspección',exact:true}).isVisible())await page.getByRole('button',{name:'Cerrar inspección',exact:true}).click();
   if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();
   await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(byId.get(id).sourceId);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();
   await page.waitForFunction(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),id);
   await action('Aislar');assert.ok((await page.evaluate(()=>window.__med3dAtlasScene().parts.filter(p=>p.visible))).every(p=>p.id===id));
   await action('Ocultar');assert.equal((await page.evaluate(()=>window.__med3dAtlasScene().parts.filter(p=>p.visible))).length,0);
   await action('Mostrar');assert.ok(await page.evaluate(id=>window.__med3dAtlasScene().parts.some(p=>p.visible&&p.id===id),id));
   await action('Enfocar');assert.ok(await page.getByRole('region',{name:'Información anatómica de '+byId.get(id).name}).isVisible());
   if(scenario==='desktop'){
    await page.waitForTimeout(750);await action('Deseleccionar');
    const box=await page.locator('.atlas-canvas canvas').boundingBox();let picked=false,hover=false;
    const samples=await page.evaluate(id=>window.__med3dAtlasScene().parts.filter(p=>p.id===id).flatMap(p=>p.screenSamples),id);
    for(const p of samples){
     if(Math.abs(p[0])>.95||Math.abs(p[1])>.95||p[2]<-1||p[2]>1)continue;
     const x=box.x+(p[0]+1)*box.width/2,y=box.y+(1-p[1])*box.height/2;
     await page.mouse.move(x,y);await page.waitForTimeout(80);hover=await page.evaluate(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id&&p.emissiveIntensity>0),id);
     await page.mouse.click(x,y);await page.waitForTimeout(100);
     if(await page.locator('.atlas-detail-content h2').textContent()===byId.get(id).name){picked=true;break;}
    }
    assert.ok(picked,'Actual raycast selection '+id);assert.ok(hover,'Actual raycast hover '+id);
    report.checks.push('Actual pointer selection and hover '+id);
   }
   assert.ok(await page.evaluate(()=>document.querySelector('canvas')===window.__recoveryCanvas));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(h.output,id.split(':')[1]+'-card.png')});
   if(scenario==='mobile'){await page.getByRole('button',{name:'Cerrar inspección',exact:true}).click();await page.screenshot({path:path.join(h.output,id.split(':')[1]+'-model.png')});}
   await action('Ver conjunto');
   if(scenario==='desktop'){await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view(wave==='wave3'?'superior':'anterior');await page.screenshot({path:path.join(h.output,id.split(':')[1]+'-context.png')});}
   report.checks.push(scenario+' '+id+': search, selection, card, isolate, hide, restore, focus, same Canvas, no overflow');console.log('OWNER PASS',scenario,id);
  }
 }
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;console.log('PASS',scenario,JSON.stringify(report.metrics));
},480000,'Recovery QA '+scenario);}
catch(error){report.success=false;report.error=error.stack;throw error;}
finally{clearInterval(progress);await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
