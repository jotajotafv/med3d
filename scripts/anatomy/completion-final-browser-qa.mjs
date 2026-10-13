// Final production-build regression. Only read-only QA observations and real UI input.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,setSlider,withinQaDeadline} from './browser-qa.mjs';
const names=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'];
const catalogs=await Promise.all(names.map(async s=>JSON.parse(await readFile('dist/models/anatomy/'+s+'/catalog.json','utf8'))));
const nodes=catalogs.flatMap(c=>c.nodes),assets=catalogs.flatMap(c=>c.assets),byId=new Map(nodes.map(n=>[n.id,n]));
const representatives=['bp3d:FMA24474','zanatomy:extensor-digitorum-brevis-l','bp3d:FMA258716','bp3d:FMA22802','resp:FMA46590','dig:FMA16549','uri:FMA7204','endo:FMA13889','lym:FMA7196','rep:FMA9600','integ:FMA54241','ocular:FMA58242'];
for(const id of representatives)assert.ok(byId.has(id),'Real catalog representative '+id);
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||'.cache/anatomy-completion/final/atlas',viewport:{width:1366,height:900},reducedMotion:'reduce',navigationTimeoutMs:180000,meshTimeoutMs:240000,actionTimeoutMs:90000}),{page}=h;
const report={date:new Date().toISOString(),environment:'Local production build, headless Chromium / SwiftShader; no physical-device claims',checks:[],captures:[],errors:h.errors,badRequests:h.badRequests};
const pass=(name,data={})=>{report.checks.push({name,...data});console.log('PASS',name);};
const scene=()=>page.evaluate(()=>window.__med3dAtlasScene());
async function structures(){if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();}
async function closePanels(){for(const name of ['Cerrar estructuras','Cerrar inspección']){const b=page.getByRole('button',{name,exact:true});if(await b.isVisible())await b.click();}}
async function action(name){const b=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await b.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await b.click();await page.waitForTimeout(350);}
async function choose(id){await structures();const n=byId.get(id);await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(n.sourceId||n.name);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForFunction(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),id);await page.waitForFunction(id=>document.querySelector('.atlas-viewport').dataset.selectedId===id,id);}
function descendants(id){return [id,...(byId.get(id)?.children||[]).flatMap(descendants)];}
async function capture(name){await page.screenshot({path:path.join(h.output,name+'.png'),timeout:180000});report.captures.push({file:name+'.png',viewport:page.viewportSize()});}
async function clickOwner(id){
 await closePanels();await page.waitForTimeout(900);
 const box=await page.locator('.atlas-canvas canvas').boundingBox();let hover=false;
 for(const p of (await scene()).parts.filter(p=>p.id===id&&p.visible).flatMap(p=>p.screenSamples)){
  const x=box.x+(p[0]+1)*box.width/2,y=box.y+(1-p[1])*box.height/2;
  if(Math.abs(p[2])>1||!await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName==='CANVAS',{x,y}))continue;
  await page.mouse.move(x,y);await page.waitForTimeout(90);hover ||= (await scene()).parts.some(p=>p.id===id&&p.emissiveIntensity>0);
  await page.mouse.click(x,y);await page.waitForTimeout(100);
  if(await page.locator('.atlas-viewport').getAttribute('data-selected-id')===id){assert.ok(hover);return;}
 }
 throw Error('Real pointer selection/hover failed '+id);
}
await h.context.addInitScript(()=>{window.__finalBuffers={created:0,deleted:0};for(const C of [window.WebGLRenderingContext,window.WebGL2RenderingContext].filter(Boolean)){const a=C.prototype.createBuffer,b=C.prototype.deleteBuffer;C.prototype.createBuffer=function(...v){window.__finalBuffers.created++;return a.apply(this,v);};C.prototype.deleteBuffer=function(v){if(v)window.__finalBuffers.deleted++;return b.call(this,v);};}});
try{await withinQaDeadline(async()=>{
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal');await h.waitMeshes(205);
 assert.equal((await h.metrics()).loadedAssets,7);assert.ok(!await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/micro/'))));
 await page.evaluate(()=>{window.__finalCanvas=document.querySelector('.atlas-canvas canvas');});pass('Default skeletal: seven modules; optional and micro geometry remain lazy');
 for(const [i,id] of representatives.entries()){
  await choose(id);const n=byId.get(id),desc=descendants(id);
  await action('Aislar');assert.ok((await scene()).parts.filter(p=>p.visible).every(p=>desc.includes(p.id)));
  await action('Ocultar');assert.equal((await scene()).parts.filter(p=>p.visible).length,0);
  await action('Mostrar');assert.ok((await scene()).parts.some(p=>p.visible&&desc.includes(p.id)));
  await action('Enfocar');await h.view('anterior');
  assert.ok(await page.getByRole('region',{name:(n.systemId==='skeletal'?'Información de ':'Información anatómica de ')+n.name}).isVisible());
  await action('Deseleccionar');await clickOwner(id);
  assert.equal(await page.locator('.atlas-detail-content h2').textContent(),n.name);
  assert.ok(await page.evaluate(()=>document.querySelector('.atlas-canvas canvas')===window.__finalCanvas));
  if([1,3,11].includes(i))await capture('category-'+names[i]);
  await action('Ver conjunto');pass(names[i]+': search, real click/hover, card, focus, isolate/hide/restore, same Canvas',{id});
 }
 await choose(representatives[0]);await action('Aislar');await action('Enfocar');
 for(const view of ['anterior','posterior','left','right','superior','inferior']){await h.view(view);const ps=(await scene()).parts.filter(p=>p.visible);assert.ok(ps.length&&ps.every(p=>p.screenSamples.every(s=>s.every(Number.isFinite))));}
 await h.view('anterior');await action('Ver conjunto');
 for(const level of ['systems','regions','structures']){
  await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);
  for(const amount of [65,0]){await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),amount);await page.waitForFunction(amount=>window.__med3dAtlasScene().parts.every(p=>p.position.every((v,i)=>v===p.targetPosition[i]))&&(amount?window.__med3dAtlasScene().parts.some(p=>p.targetPosition.some((v,i)=>v!==p.restPosition[i])):window.__med3dAtlasScene().parts.every(p=>p.position.every((v,i)=>v===p.restPosition[i]))),amount);}
 }
 pass('Six orientations and all three explosion levels restore exact rest positions');
 await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();
 const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);await page.keyboard.press('Home');pass('Virtualized semantic tree, Home/End keyboard navigation');
 await page.getByRole('button',{name:'Capas',exact:true}).click();assert.equal(await page.locator('.atlas-layer-system').count(),11);
 await setSlider(page.locator('[data-system-id="muscular"] .atlas-layer-opacity input'),36);
 await page.waitForFunction(()=>window.__med3dAtlasScene().parts.filter(p=>p.systemId==='muscular').every(p=>p.opacity===.36));
 await setSlider(page.locator('[data-system-id="muscular"] .atlas-layer-opacity input'),100);pass('Eleven layers and real per-system opacity');
 await choose('bp3d:FMA22802');await action('Aislar');await action('Enfocar');
 for(const width of [1366,1050,900,768,390]){
  await page.setViewportSize({width,height:900});await closePanels();await choose('bp3d:FMA22802');await action('Enfocar');
  assert.ok(await page.getByRole('region',{name:'Información anatómica de '+byId.get('bp3d:FMA22802').name}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await capture('responsive-'+width);
  await closePanels();assert.ok(await page.locator('.atlas-canvas canvas').isVisible());assert.ok(await page.evaluate(()=>document.querySelector('.atlas-canvas canvas')===window.__finalCanvas));
 }
 pass('1366/1050/900/768/390: card opens/closes, model visible, no overflow, retained Canvas');
 await page.setViewportSize({width:1366,height:900});await page.getByRole('button',{name:'Restablecer atlas'}).click();await page.waitForFunction(()=>!document.querySelector('.atlas-viewport').dataset.selectedId);pass('Reset clears selection and restores display');
 // Controlled loader failure on a real newly added module; no product changes.
 const asset=assets.find(a=>a.id==='cardiovascular:completion4-ulnar-recurrent');let allow=false;
 await page.route('**/'+asset.path,route=>allow?route.continue():route.fulfill({status:503,body:'controlled QA failure'}));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=cardiovascular&modules='+asset.id);
 await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor();await page.evaluate(()=>{window.__retryCanvas=document.querySelector('.atlas-canvas canvas');});allow=true;
 await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(asset.meshCount);
 assert.ok(await page.evaluate(()=>document.querySelector('.atlas-canvas canvas')===window.__retryCanvas));await page.unroute('**/'+asset.path);
 const expectedFailures=h.badRequests.filter(r=>r.status===503&&r.url.endsWith(asset.path));assert.equal(expectedFailures.length,1);
 pass('Controlled 503: explicit retry restores the real optional module without replacing Canvas');
 await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');await page.getByRole('button',{name:'Capas',exact:true}).click();
 const buffersBefore=await page.evaluate(()=>({...window.__finalBuffers}));await page.locator('[data-system-id="cardiovascular"] .atlas-layer-toggle input').uncheck();await h.waitMeshes(0);
 const buffersAfter=await page.evaluate(()=>({...window.__finalBuffers}));assert.ok(buffersAfter.deleted>buffersBefore.deleted);assert.equal((await h.metrics()).geometryBytes,0);pass('Layer OFF releases actual geometry buffers',{buffersBefore,buffersAfter});
 for(const organ of ['heart','lungs','brain']){
  await page.goto(h.origin+'/med3d/anatomia/?organ='+organ,{waitUntil:'domcontentloaded'});await page.locator('.atlas-canvas canvas').waitFor();
  await page.waitForFunction(organ=>performance.getEntriesByType('resource').some(e=>e.name.endsWith('/models/'+organ+'.glb'))&&window.__atlasQa.draws>0,organ,{timeout:180000});
  await page.getByRole('progressbar',{name:'Descarga del modelo'}).waitFor({state:'detached'});assert.equal(await page.getByRole('alert').count(),0);pass('Site smoke '+organ);
 }
 for(const route of ['/','/acerca/']){const response=await page.goto(h.origin+'/med3d'+route,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);await page.locator('main h1').first().waitFor();pass('Site smoke '+route,{title:await page.locator('main h1').first().textContent()});}
 await page.goto(h.origin+'/med3d/experiencia-xr/?xrQa=1');await page.waitForFunction(()=>window.__med3dXrAtlas?.().meshes===205);pass('Site smoke XR: initial real skeletal geometry rendered');
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,expectedFailures);report.success=true;
},1500000,'Final Atlas regression');}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(h.output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(h.output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
