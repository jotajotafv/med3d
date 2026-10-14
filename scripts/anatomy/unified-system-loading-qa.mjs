// Real app, assets and picking. Only the camera/landmarks for UI regression are controlled.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {installAcceptanceFixture,observeAcceptanceControllers} from '../xr/gesture-acceptance-fixture.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.XR_PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.XR_QA_DEV_ORIGIN||'http://127.0.0.1:5173';
const output=process.env.XR_QA_OUTPUT||'.cache/unified-system-loading/browser';
await mkdir(output,{recursive:true});
const ids=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
const catalogs=Object.fromEntries(await Promise.all([...ids,'ocular'].map(async id=>[id,JSON.parse(await readFile('public/models/anatomy/'+id+'/catalog.json','utf8'))])));
const assets=id=>id==='nervous'?[...catalogs.nervous.assets,...catalogs.ocular.assets]:catalogs[id].assets;
const allAssets=ids.flatMap(assets),meshCount=id=>assets(id).reduce((n,a)=>n+a.meshCount,0);
const browser=await chromium.launch({headless:true,...(process.env.XR_BROWSER_EXECUTABLE?{executablePath:process.env.XR_BROWSER_EXECUTABLE}:{})});
const context=await browser.newContext({viewport:{width:1366,height:1000},deviceScaleFactor:1,hasTouch:true});
await context.addInitScript(installAcceptanceFixture,{mode:'controlled',images:{}});
const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(120000);
const report={date:new Date().toISOString(),browser:browser.version(),base:process.env.QA_BASE,scope:'Unified system UI/loading; controlled landmarks, no physical camera or MediaPipe acceptance',checks:[],performance:[],responsive:[],captures:[],errors:[],requests:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('request',r=>{if(r.url().endsWith('.glb'))report.requests.push({url:r.url(),at:Date.now()});});
const pass=(name,evidence={})=>{report.checks.push({name,...evidence});console.log('PASS',name);};
const wait=(fn,arg,timeout=120000)=>page.waitForFunction(fn,arg,{timeout,polling:200});
const read=xr=>page.evaluate(xr=>xr?window.__med3dXrAtlas():window.__med3dAtlasScene(),xr);
const control=id=>page.locator('[data-xr-hand-control="'+id+'"]');
const setSlider=(el,value)=>el.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);
const shot=async name=>{const file=output+'/'+name+'.png';await page.screenshot({path:file,timeout:20000});report.captures.push(file);};
const cleanText=async()=>{assert.doesNotMatch(await page.locator('main').innerText(),/ampliación anatómica|anatomical expansion|completion\d?|contenido ampliado|módulos adicionales/i);};
const atlasCount=count=>wait(n=>Number(document.querySelector('.atlas-viewport')?.dataset.loadedAssets)===n,count);
const xrCount=count=>wait(n=>window.__med3dXrAtlas?.().modules.length===n,count);
async function atlasLayers(){const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});if(!await input.isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();if(await input.inputValue())await input.fill('');await page.getByRole('button',{name:'Capas',exact:true}).click();}
const atlasToggle=id=>page.locator('[data-system-id="'+id+'"] .atlas-layer-toggle input');
const metrics=async(xr,name,start)=>{await page.waitForTimeout(500);const state=await read(xr);console.log('MEASURE',xr?'XR':'Atlas',name,Date.now()-start);report.performance.push({name,viewer:xr?'XR':'Atlas',elapsedMs:Date.now()-start,...(xr?{modules:state.modules.length,meshes:state.meshes,geometryBytes:state.geometryBytes,frameIntervalMs:state.frameIntervalMs,renderCpuMs:state.renderCpuMs,timings:state.timings}:await page.locator('.atlas-viewport').evaluate(e=>({...e.dataset}))),requests:report.requests.length});};
async function progressive(xr){
  let release;const gate=new Promise(r=>release=r),first=assets('skeletal').find(a=>a.defaultEnabled===false);
  await page.route('**/'+first.path,async route=>{await gate;await route.continue();});
  const start=Date.now(),before=report.requests.length;
  await page.goto(origin+(xr?'/med3d/experiencia-xr/?xrQa=1':'/med3d/anatomia/?qa=1'));
  await wait(xr=>xr?window.__med3dXrAtlas?.().meshes===205:window.__med3dAtlasScene?.().parts.length===205,xr);
  assert.ok(report.requests.slice(before).every(r=>assets('skeletal').some(a=>r.url.endsWith(a.path))));
  const rendered=await read(xr);assert.ok(rendered.parts.some(p=>p.visible));pass((xr?'XR':'Atlas')+' base renders before delayed addition and no other system starts');
  release();await (xr?xrCount(9):atlasCount(9));await page.unroute('**/'+first.path);
  assert.equal((await read(xr)).parts.length,207);await cleanText();await metrics(xr,'initial skeletal',start);
}
async function choose(id){
  const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});if(!await input.isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();
  await input.fill(id);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();
  await wait(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,id);await page.waitForTimeout(700);
}
const action=name=>page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true}).click();
async function pointFor(xr,id){
 return page.evaluate(({xr,id})=>{
  const c=document.querySelector(xr?'.xr-scene canvas':'.atlas-canvas canvas'),r=c.getBoundingClientRect(),s=xr?window.__med3dXrAtlas():window.__med3dAtlasScene();
  return s.parts.filter(p=>p.visible&&(!id||p.id===id)).flatMap(p=>[...(p.screenCenter?[p.screenCenter]:[]),...p.screenSamples]).filter(([x,y,z])=>Math.abs(x)<1&&Math.abs(y)<1&&Math.abs(z)<1).map(([x,y])=>({x:r.left+(x+1)*r.width/2,y:r.top+(1-y)*r.height/2})).filter(p=>document.elementFromPoint(p.x,p.y)===c);
 },{xr,id});
}
async function pointerPick(xr,id,touch=false){
  const points=await pointFor(xr,id);for(const p of points){if(touch)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
    const selected=xr?(await read(true)).state.selectedStructure:await page.locator('.atlas-viewport').getAttribute('data-selected-id');
    if(selected&&(!id||selected===id))return selected;
  }throw Error('No selectable surface '+id);
}
async function responsive(xr){
 for(const width of [1366,1050,900,768,390]){
  await page.setViewportSize({width,height:1000});
  if(xr){if(await page.locator('.xr-atlas-layers').getAttribute('open')===null)await control('layers-panel').click();await control('integumentary-toggle').scrollIntoViewIfNeeded();}
  else {await atlasLayers();await atlasToggle('integumentary').scrollIntoViewIfNeeded();}
  await page.waitForTimeout(200);const size=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert.ok(size.scroll<=size.width+1,JSON.stringify(size));const target=xr?control('integumentary-toggle'):atlasToggle('integumentary');assert.ok(await target.isVisible());
  const list=xr?control('systems-scroll'):page.locator('.atlas-layers-scroll');const scroll=await list.evaluate(el=>{el.scrollTop=0;el.scrollTop=el.scrollHeight;return {top:el.scrollTop,max:el.scrollHeight-el.clientHeight,overflow:getComputedStyle(el).overflowY};});
  assert.ok(['auto','scroll'].includes(scroll.overflow));if(scroll.max>0)assert.ok(scroll.top>0);
  await target.scrollIntoViewIfNeeded();const bounds=await target.boundingBox();const region=await list.boundingBox();assert.ok(bounds.y>=region.y&&bounds.y+bounds.height<=region.y+region.height+1);await cleanText();await shot((xr?'xr':'atlas')+'-'+width);report.responsive.push({viewer:xr?'XR':'Atlas',...size,scroll});
 }
 pass((xr?'XR':'Atlas')+' responsive 1366/1050/900/768/390, manual scroll and Tegumentario');
 await page.setViewportSize({width:1366,height:1000});
 if(!xr&&await page.getByRole('button',{name:'Cerrar estructuras',exact:true}).isVisible())await page.getByRole('button',{name:'Cerrar estructuras',exact:true}).click();
}
try{
 if(process.argv.includes('--tracking-smoke')){
  await page.goto(origin+'/med3d/anatomia/?qa=1');await atlasCount(9);await atlasLayers();
  await atlasToggle('muscular').check();await atlasCount(42);await atlasToggle('nervous').check();await atlasCount(57);
  const requests=report.requests.length;await atlasToggle('muscular').uncheck();await atlasCount(24);
  await atlasToggle('muscular').check();await atlasCount(57);assert.equal(report.requests.length,requests);
  const candidate=catalogs.muscular.nodes.find(n=>n.kind==='structure'&&n.educationId&&n.assetIds.some(id=>id.includes('completion-hip-right')));assert.ok(candidate);
  await choose(candidate.id);assert.ok(await page.locator('.atlas-education').isVisible());await cleanText();await shot('atlas-tracking-smoke');
  pass('Atlas smoke: skeletal, muscular, nervous, search, added structure selection, OFF/ON reuse');
  await page.goto(origin+'/med3d/experiencia-xr/?xrQa=1');await xrCount(9);
  for(const id of ids)await control(id+'-toggle').check();await xrCount(92);assert.equal((await read(true)).meshes,1240);
  assert.equal(await page.locator('.xr-atlas-layer input[type=checkbox]').count(),11);await cleanText();
  await setSlider(control('muscular-opacity'),50);await wait(()=>window.__med3dXrAtlas().parts.filter(p=>p.system==='muscular').every(p=>p.opacity===.5));
  await setSlider(control('explosion'),50);assert.ok((await read(true)).parts.some(p=>p.offset.some(v=>v!==0)));
  await control('restore-atlas').click();await wait(()=>window.__med3dXrAtlas().visibleMeshes===207);assert.equal((await read(true)).modules.length,92);
  await control('skeletal-toggle').uncheck();await control('muscular-toggle').check();
  const newIds=new Set(catalogs.muscular.nodes.filter(n=>n.educationId&&n.assetIds.some(id=>assets('muscular').find(a=>a.id===id)?.defaultEnabled===false)).map(n=>n.id));
  let hit;for(const id of newIds){try{const points=await pointFor(true,id);for(const p of points){await page.mouse.click(p.x,p.y);const chosen=(await read(true)).state.selectedStructure;if(newIds.has(chosen)){hit=chosen;break;}}}catch{}if(hit)break;}
  assert.ok(hit,'real raycast selects an added muscle');assert.ok(await page.locator('#xr-education-title').isVisible());
  await control('isolate').click();await wait(id=>window.__med3dXrAtlas().parts.filter(p=>p.visible).every(p=>p.id===id),hit);
  await control('hide').click();await wait(id=>window.__med3dXrAtlas().parts.filter(p=>p.id===id).every(p=>!p.visible),hit);
  await control('restore-hidden').click();await control('restore-atlas').click();await control('reset-view').click();
  await shot('xr-tracking-smoke');pass('XR smoke: 11 systems, 92/1240, opacity, selection/card, isolate, hide, restore, explosion');
  await page.goto(origin+'/med3d/');assert.equal(await page.evaluate(()=>typeof window.__med3dXrAtlas),'undefined');pass('XR route cleanup');
 }else if(process.argv.includes('--catalog-retry-only')){
  let fail=true;
  await page.route('**/models/anatomy/skeletal/catalog.json',route=>fail?route.fulfill({status:503,body:'QA catalog failure'}):route.continue());
  await page.goto(origin+'/med3d/experiencia-xr/?xrQa=1');await page.getByRole('alert').waitFor();
  await control('skeletal-toggle').uncheck();assert.equal(await page.getByRole('alert').count(),0);
  fail=false;await control('skeletal-toggle').check();await xrCount(9);assert.equal(await page.getByRole('alert').count(),0);
  pass('XR catalog failure: OFF hides inactive error, ON reloads and clears stale error');
 }else if(process.argv.includes('--responsive-only')){
  await page.goto(origin+'/med3d/anatomia/?qa=1');await atlasCount(9);await responsive(false);
  await page.goto(origin+'/med3d/experiencia-xr/?xrQa=1');await xrCount(9);await responsive(true);
 }else{
 await progressive(false);await atlasLayers();assert.equal(await page.locator('.atlas-layer-toggle input').count(),11);
 let start=Date.now();await atlasToggle('muscular').check();await atlasCount(42);await metrics(false,'muscular',start);
 const mus=page.locator('[data-system-id=muscular] input[type=range]');await setSlider(mus,50);
 await wait(()=>window.__med3dAtlasScene().parts.filter(p=>p.systemId==='muscular').every(p=>p.opacity===.5));
 const before=report.requests.length;await atlasToggle('muscular').uncheck();await atlasCount(9);assert.ok((await read(false)).parts.every(p=>p.systemId!=='muscular'));
 await atlasToggle('muscular').check();await atlasCount(42);assert.equal(report.requests.length,before);pass('Atlas ON/OFF/ON, all muscle opacity, off picking and zero repeated requests');
 start=Date.now();await atlasToggle('nervous').check();await atlasCount(57);await metrics(false,'several with nervous',start);
 start=Date.now();for(const id of ids)await atlasToggle(id).check();await atlasCount(allAssets.length);await metrics(false,'all eleven systems',start);assert.equal((await read(false)).parts.length,1240);
 await setSlider(page.getByRole('slider',{name:'Separación de piezas',exact:true}),50);
 await wait(()=>window.__med3dAtlasScene().parts.some(p=>p.assetId.includes('completion')&&p.position.some((v,i)=>Math.abs(v-p.restPosition[i])>.001)));
 pass('Atlas 92 modules / 1240 meshes, additions participate in explosion');
 await page.getByRole('button',{name:'Restablecer atlas',exact:true}).click();await atlasCount(9);
 const candidate=catalogs.muscular.nodes.find(n=>n.kind==='structure'&&n.educationId&&n.assetIds.some(id=>id.includes('completion-hip-right')));
 assert.ok(candidate);const startRequests=report.requests.length;
 await choose(candidate.id);await wait(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),candidate.id);
 assert.equal(report.requests.length,startRequests,'search reuses loaded resources');await action('Aislar');
 await wait(id=>window.__med3dAtlasScene().parts.filter(p=>p.visible).every(p=>p.id===id),candidate.id);
 await page.getByRole('button',{name:'Enfocar selección',exact:true}).click();await page.waitForTimeout(900);
 await action('Deseleccionar');await pointerPick(false,candidate.id);assert.ok((await page.locator('.atlas-education').innerText()).length>100);
 await action('Ocultar');await wait(id=>window.__med3dAtlasScene().parts.filter(p=>p.id===id).every(p=>!p.visible&&!p.raycastEnabled),candidate.id);
 await page.getByRole('button',{name:'Mostrar todas las piezas',exact:true}).click();await action('Aislar');await action('Ver conjunto');
 pass('Atlas new structure search/focus, real picking, card, isolate, hide and restore');
 await atlasLayers();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();assert.ok(await page.getByRole('tree',{name:'Árbol anatómico'}).isVisible());await page.getByRole('button',{name:'Centrar modelo',exact:true}).click();await page.waitForTimeout(900);await responsive(false);
 // A fresh scene tests on-demand search, system priority and retry without cached assets.
 const retryAsset=assets('muscular').find(a=>a.defaultEnabled===false);let failures=0;
 await page.route('**/'+retryAsset.path,route=>++failures===1?route.fulfill({status:503,body:'QA retry'}):route.continue());
 await page.goto(origin+'/med3d/anatomia/?qa=1');await atlasCount(9);await choose(candidate.id);
 await wait(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),candidate.id);pass('Atlas fresh search automatically loads its necessary module');
 await atlasLayers();await atlasToggle('muscular').uncheck();await atlasCount(9);await atlasToggle('muscular').check();
 await page.getByRole('button',{name:'Reintentar regiones pendientes',exact:true}).waitFor();await cleanText();await page.getByRole('button',{name:'Reintentar regiones pendientes',exact:true}).click();await atlasCount(42);
 assert.equal(failures,2);await page.unroute('**/'+retryAsset.path);pass('Atlas module failure uses normal visible retry, without internal labels');
 await progressive(true);assert.equal(await page.locator('.xr-atlas-layer input[type=checkbox]').count(),11);
 await page.evaluate(observeAcceptanceControllers);
 start=Date.now();await control('muscular-toggle').check();await xrCount(42);await metrics(true,'muscular',start);
 await setSlider(control('muscular-opacity'),50);await wait(()=>window.__med3dXrAtlas().parts.filter(p=>p.system==='muscular').every(p=>p.opacity===.5));
 const xrRequests=report.requests.length,scene=(await read(true)).sceneId;
 await control('muscular-toggle').uncheck();await wait(()=>window.__med3dXrAtlas().parts.filter(p=>p.system==='muscular').every(p=>!p.visible));
 await control('muscular-toggle').check();await wait(()=>window.__med3dXrAtlas().parts.filter(p=>p.system==='muscular').every(p=>p.visible));
 assert.equal(report.requests.length,xrRequests);assert.equal((await read(true)).sceneId,scene);
 start=Date.now();await control('nervous-toggle').check();await xrCount(57);await metrics(true,'several with nervous',start);
 start=Date.now();for(const id of ids)await control(id+'-toggle').check();await xrCount(92);await metrics(true,'all eleven systems',start);
 await setSlider(control('explosion'),50);assert.ok((await read(true)).parts.some(p=>p.offset.some(v=>v!==0)));
 await control('restore-atlas').click();await wait(()=>window.__med3dXrAtlas().visibleMeshes===207);assert.equal((await read(true)).modules.length,92);
 await control('reset-view').click();await control('skeletal-toggle').uncheck();await control('muscular-toggle').check();await setSlider(control('muscular-opacity'),100);
 const newIds=new Set(catalogs.muscular.nodes.filter(n=>n.educationId).filter(n=>n.assetIds.some(id=>assets('muscular').find(a=>a.id===id)?.defaultEnabled===false)).map(n=>n.id));
 let hit;for(const id of newIds){try{const points=await pointFor(true,id);for(const p of points){await page.mouse.click(p.x,p.y);const chosen=(await read(true)).state.selectedStructure;if(newIds.has(chosen)){hit=chosen;break;}}}catch{}if(hit)break;}
 assert.ok(hit,'real raycast selects an added muscle');assert.ok(await page.locator('#xr-education-title').isVisible());await control('isolate').click();
 await wait(id=>window.__med3dXrAtlas().parts.filter(p=>p.visible).every(p=>p.id===id),hit);
 await control('hide').click();await wait(id=>window.__med3dXrAtlas().parts.filter(p=>p.id===id).every(p=>!p.visible),hit);
 await control('restore-hidden').click();await control('restore-atlas').click();await control('reset-view').click();
 const box=await page.locator('.xr-scene canvas').boundingBox();await page.mouse.move(box.x+box.width*.3,box.y+box.height*.4);await page.mouse.down();await page.mouse.move(box.x+box.width*.4,box.y+box.height*.5,{steps:10});await page.mouse.up();assert.equal((await read(true)).state.selectedStructure,null);
 await page.mouse.wheel(0,-120);await pointerPick(true,null,true);await control('close-card').click();assert.equal((await read(true)).state.selectedStructure,null);assert.equal((await read(true)).sceneId,scene);
 pass('XR all systems, reuse, opacity, picking new structure, card/isolate/hide/restore, explosion, drag and touch after transform');
 await responsive(true);
 await page.evaluate(()=>{document.querySelector('[data-xr-hand-control=systems-scroll]').scrollTop=0;});
 await control('reset-view').click();
 // Controlled input traverses the unchanged registry/router/dwell pipeline.
 await page.getByRole('button',{name:'Activar control con manos',exact:true}).click();
 await wait(()=>document.querySelector('.xr-tracking-status')?.textContent.includes('Activa'));
 const put=hands=>page.evaluate(h=>{window.gestureQa.hands=h;window.gestureQa.plan=null;},hands);
 const release=async()=>{await put([]);await page.waitForTimeout(650);};
 const at=point=>page.evaluate(point=>{const w=document.querySelector('.xr-atlas-workspace').getBoundingClientRect(),c=document.querySelector('.xr-atlas-card')?.getBoundingClientRect()??w;const l=Math.max(0,Math.min(w.left,c.left)),t=Math.max(0,Math.min(w.top,c.top)),r=Math.min(innerWidth,Math.max(w.right,c.right)),b=Math.min(innerHeight,Math.max(w.bottom,c.bottom)),width=Math.max(r-l,(b-t)*4/3),height=width/(4/3);return {id:'Left',u:(point.x-l+(width-r+l)/2)/width,v:(point.y-t+(height-b+t)/2)/height,ratio:.5};},point);
 async function dwell(id){await release();const b=await control(id).boundingBox();const h=await at({x:b.x+b.width/2,y:b.y+b.height/2});const count=await page.evaluate(()=>window.gestureQa.fired?.length??0);await put([h]);await wait(n=>(window.gestureQa.fired?.length??0)>n,count,10000);const fired=await page.evaluate(()=>window.gestureQa.fired.at(-1));assert.equal(fired.target.id,id);assert.equal(fired.elapsedMs,1000);return {h,b};}
 await control('systems-scroll').evaluate(el=>el.scrollTop=0);await dwell('muscular-toggle');await release();assert.equal(await control('muscular-toggle').isChecked(),true);
 await page.waitForTimeout(400);const slider=await dwell('muscular-opacity');const end=await at({x:slider.b.x+slider.b.width*.35,y:slider.b.y+slider.b.height/2});
 await page.evaluate(({from,to})=>window.gestureQa.plan={start:performance.now(),duration:1100,from:[from],to:[to]},{from:slider.h,to:end});
 await page.waitForTimeout(1500);assert.ok(Number(await control('muscular-opacity').inputValue())<65);await release();
 await control('muscular-toggle').uncheck();await control('systems-scroll').evaluate(el=>el.scrollTop=0);
 await put([{id:'Left',u:.35,v:.5,ratio:.5}]);await wait(()=>window.gestureQa.uiAt);await release();
 let scrolls=0;
 while(await control('systems-scroll').evaluate(e=>e.scrollTop<e.scrollHeight-e.clientHeight-2)&&scrolls++<8){
  const p=await control('systems-scroll').evaluate(el=>{const r=el.getBoundingClientRect();for(let y=r.bottom-24;y>r.top+40;y-=3)for(const f of [.5,.35,.65]){const p={x:r.left+r.width*f,y};if(window.gestureQa.uiAt(p).target?.id==='systems-scroll')return p;}return null;});assert.ok(p);
  const h=await at(p);await put([h]);await wait(()=>window.gestureQa.readCapture?.()==='systems-scroll',null,10000);
  const b=await control('systems-scroll').boundingBox(),to=await at({x:p.x,y:Math.max(b.y+12,p.y-180)});
  await page.evaluate(({h,to})=>window.gestureQa.plan={start:performance.now(),duration:1000,from:[h],to:[to]},{h,to});
  await page.waitForTimeout(1350);await release();
 }
 await dwell('integumentary-toggle');await release();assert.equal(await control('integumentary-toggle').isChecked(),true);
 assert.ok(!(await page.evaluate(()=>window.gestureQa.fired)).some(f=>/expansion|optional|completion/.test(f.target.id)));
 await page.getByRole('button',{name:'Desactivar control con manos',exact:true}).click();
 pass('Controlled gesture UI: system dwell 1000ms, opacity, freed scroll-region space, scroll to Tegumentario; no expansion targets');
 // Standard XR error/retry after a fresh scene; no landmark continuity campaign.
 let xrFailures=0;await page.route('**/'+retryAsset.path,route=>++xrFailures===1?route.fulfill({status:503,body:'QA retry'}):route.continue());
 await page.goto(origin+'/med3d/experiencia-xr/?xrQa=1');await xrCount(9);await control('muscular-toggle').check();await page.getByRole('button',{name:'Reintentar Muscular',exact:true}).waitFor({timeout:120000});
 await cleanText();await page.getByRole('button',{name:'Reintentar Muscular',exact:true}).click();await xrCount(42);assert.equal(xrFailures,2);pass('XR module failure and normal system retry');
 await page.goto(origin+'/med3d/');assert.equal(await page.evaluate(()=>typeof window.__med3dXrAtlas),'undefined');pass('XR route cleanup removes inspector and scene');
 }
 assert.deepEqual(report.errors,[]);report.status='PASS';report.environmentBlocked='UNCHANGED; no prolonged-load or physical MediaPipe acceptance claimed';
}catch(error){report.status='NOT_PASSED';report.failure={message:String(error),stack:error.stack};report.lastInspection=await read(!!(await page.locator('.xr-page').count())).catch(()=>null);process.exitCode=1;console.error(error);await shot('failure').catch(()=>{});}
finally{await writeFile(output+'/result.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
