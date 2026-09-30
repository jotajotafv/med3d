// Phase 10 integration and performance evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--eye-review','--regional','--camera','--review','--captures','--performance','--integration','--responsive'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase10','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
// Software WebGL can block screenshot/input acknowledgement beyond Playwright's
// normal 20 s default. Assertions are unchanged; this is not a physical-GPU claim.
h.context.setDefaultTimeout(120000);
page.setDefaultTimeout(120000);
const allSystems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
const catalogs=await Promise.all(allSystems.map(s=>readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy',s,'catalog.json'),'utf8').then(JSON.parse)));
try{catalogs.push(JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/ocular/catalog.json'),'utf8')));}catch(error){if(error.code!=='ENOENT')throw error;}
const nodes=catalogs.flatMap(c=>c.nodes),assets=catalogs.flatMap(c=>c.assets),byId=new Map(nodes.map(n=>[n.id,n])),totalMeshes=sum(catalogs.flatMap(c=>c.assets),'meshCount'),skinId='integ:FMA7163';
if(byId.has('nervous:ocular'))byId.get('nervous').children.push('nervous:ocular');
byId.set('body',{id:'body',name:'Cuerpo humano',children:allSystems,assetIds:assets.map(a=>a.id)});
let activeTotalMeshes=totalMeshes;
function sum(list,key){return list.reduce((total,item)=>total+item[key],0);}
const report={codeCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:project,encoding:'utf8'}).trim(),workingTreeDirty:!!execFileSync('git',['status','--porcelain'],{cwd:project,encoding:'utf8'}).trim(),implementationDirty:!!execFileSync('git',['status','--porcelain','--','.',':(exclude)docs'],{cwd:project,encoding:'utf8'}).trim(),date:new Date().toISOString(),mode,source:'Local production build over unthrottled loopback HTTP; no-store responses',environment:{browser:'Headless Chromium',renderer:'ANGLE SwiftShader software WebGL',deviceScaleFactor:1,physicalGpuTested:false},checks:[],captures:[],measurements:{},errors:h.errors,badRequests:h.badRequests};
const check=(name,value={})=>{report.checks.push({name,...value});console.log('PASS',name,JSON.stringify(value));};
const wait=ms=>page.waitForTimeout(ms);
const snapshot=()=>page.evaluate(()=>window.__med3dAtlasScene());
const parts=async()=>[...(await snapshot()).parts].sort((a,b)=>a.id.localeCompare(b.id));
const positions=list=>list.map(part=>({id:part.id,position:part.position,restPosition:part.restPosition}));
const selectedName=()=>page.locator('.atlas-detail-content h2').textContent();
const systemInput=id=>page.locator(`[data-system-id="${id}"] .atlas-layer-toggle input`);
const assetInput=asset=>page.locator(`[data-system-id="${asset.systemId}"] [data-asset-id="${asset.id}"]`).getByRole('checkbox');
function descendants(id) {const ids=new Set([id]);for(const child of byId.get(id)?.children||[])for(const value of descendants(child))ids.add(value);return ids;}
async function structures(){if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();}
async function clearSearch(){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');}
async function layers(){await clearSearch();await page.getByRole('button',{name:'Capas',exact:true}).click();}
async function choose(node){assert.ok(node,'Catalog target exists');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator(`.atlas-search-result[data-node-id="${node.id}"]`).click();await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,node.name);await wait(850);}
async function closePanels(){for(const name of ['Cerrar estructuras','Cerrar inspección']){const button=page.getByRole('button',{name,exact:true});if(await button.isVisible())await button.click();}}
async function action(name,settle=400){const button=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await button.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await button.click();if(settle)await wait(settle);}
async function goto(systems=allSystems.join(','),moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId==='skeletal'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value,system='integumentary'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&(value===0||!parts.some(p=>p.systemId!=='integumentary')||parts.some(p=>p.targetPosition.some((x,i)=>x!==p.restPosition[i])))&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):true);},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false,timeout:120000});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
const chooseId=id=>choose(byId.get(id));
async function settledCamera(){let previous='';for(let i=0;i<60;i++){const current=JSON.stringify((await snapshot()).camera);if(current===previous)return;previous=current;await wait(150);}throw Error('Camera did not settle');}
async function clickId(id){
 await closePanels();await settledCamera();const box=await page.locator('.atlas-canvas canvas').boundingBox(),samples=(await parts()).filter(p=>p.id===id&&p.visible).flatMap(p=>[p.screenCenter,...p.screenSamples]);const attempts=[];
 for(const sample of samples){
  const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;
  if(!await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName==='CANVAS',{x,y}))continue;
  await page.mouse.move(x,y);await wait(150);await page.mouse.click(x,y);await wait(200);const selected=await page.locator('.atlas-viewport').getAttribute('data-selected-id');attempts.push({x,y,selected});if(selected===id){report.measurements['raycast-'+id]=attempts;return;}
 }
 report.measurements['raycast-'+id]=attempts;throw Error('Actual raycast failed '+id+' '+JSON.stringify(attempts));
}
async function eyeReview(){
 await goto('integumentary,nervous');await chooseId('nervous:ocular');await h.view('anterior');
 for(let i=0;i<4;i++){await page.getByRole('button',{name:'Alejar',exact:true}).click();await settledCamera();}
 await action('Deseleccionar');await opacity(100);await shot('eye-face-100','Native eye surfaces and skin, without registration adjustment.');
 await opacity(25);await shot('eye-face-25');
 await chooseId('nervous:ocular');await action('Aislar');await h.view('anterior');await shot('eye-bilateral-isolated');
 await chooseId('ocular:FMA12514');await action('Aislar');await h.view('anterior');await shot('eye-right-isolated');
 await chooseId('ocular:FMA58236');await action('Aislar');await h.view('anterior');await shot('eye-iris-isolated');
 await chooseId('ocular:FMA12514');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1200);await h.view('anterior');await shot('eye-context');
 await goto('integumentary,urinary');await chooseId('uri:FMA7204');assert.equal((await parts()).find(p=>p.id===skinId).opacity,.25);await action('Deseleccionar');await clickId('uri:FMA7204');
 await opacity(100);assert.ok((await parts()).filter(p=>p.visible&&p.systemId!=='integumentary').every(p=>!p.raycastEnabled));
 await layers();await page.getByRole('button',{name:'Aislar piel',exact:true}).click();assert.equal((await parts()).filter(p=>p.visible).length,1);await shot('skin-exterior-preset');
 await layers();await page.getByRole('button',{name:'Explorar interior',exact:true}).click();assert.ok((await parts()).filter(p=>p.visible).length>1);await shot('skin-interior-preset');
 check('Partial ocular geometry, eye search/focus/isolation/context, opaque skin priority, automatic internal reveal and surface presets');
}
async function regional(){
 await goto('integumentary');const initial=await h.metrics();assert.equal(initial.meshCount,1);
 for(const value of [100,75,50,25,10]){await opacity(value);assert.ok((await parts())[0].raycastEnabled);}
 await chooseId(skinId);for(const view of ['anterior','posterior','left','right','superior','inferior']){await h.view(view);assert.ok((await parts())[0].screenSamples.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1));}
 await h.view('anterior');await action('Deseleccionar');await clickId(skinId);await action('Aislar');await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 await layers();await systemInput('integumentary').uncheck();await h.waitMeshes(0);assert.equal((await h.metrics()).geometryBytes,0);await systemInput('integumentary').check();await h.waitMeshes(1);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 const module=assetInput(assets.find(a=>a.id==='integumentary:skin'));await module.uncheck();await h.waitMeshes(0);await module.check();await h.waitMeshes(1);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 check('Skin six views, five opacities, real picking, hide/restore, layer/module release and bounded reload');
 await goto('integumentary,urinary');await chooseId('uri:FMA7204');assert.equal((await parts()).find(p=>p.id===skinId).opacity,.25);await page.locator('.atlas-skin-notice').waitFor();await h.view('anterior');await action('Deseleccionar');
 for(const value of [75,50,25,10]){await opacity(value);assert.equal((await parts()).find(p=>p.id===skinId).raycastEnabled,false);await clickId('uri:FMA7204');await action('Deseleccionar');}
 await opacity(100);assert.ok((await parts()).filter(p=>p.visible&&p.systemId!=='integumentary').every(p=>!p.raycastEnabled));
 await chooseId(skinId);await action('Aislar');assert.equal((await parts()).filter(p=>p.visible).length,1);await action('Deseleccionar');await clickId(skinId);await action('Ver conjunto');
 await layers();await page.getByRole('button',{name:'Aislar piel',exact:true}).click();assert.equal((await parts()).filter(p=>p.visible).length,1);await layers();await page.getByRole('button',{name:'Explorar interior',exact:true}).click();assert.ok((await parts()).filter(p=>p.visible).length>1);assert.equal((await parts()).find(p=>p.id===skinId).opacity,.25);
 check('Opaque skin priority, automatic internal reveal, real transparent raycast, isolated fallback and explicit surface presets');
 await goto('nervous','nervous:ocular'.split(','));await chooseId('ocular:FMA12514');await action('Aislar');assert.equal((await parts()).filter(p=>p.visible).length,3);await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 await chooseId('ocular:FMA58236');await action('Aislar');await h.view('anterior');await action('Deseleccionar');await clickId('ocular:FMA58236');
 await chooseId('ocular:FMA12515');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1000);const targets=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(',');assert.ok(targets.includes('bp3d:FMA50878')&&targets.includes('bp3d:FMA52734'));await page.waitForFunction(ids=>{const p=window.__med3dAtlasScene().parts.filter(p=>p.visible);return p.length>3&&p.every(p=>ids.includes(p.id));},[...new Set(targets.flatMap(id=>[...descendants(id)]))]);
 check('Partial eye hierarchy, unilateral isolation, hide/restore, actual iris picking and explicit optic/bone context');
 let allow=false;await page.route('**/models/anatomy/ocular/ocular.glb',route=>allow?route.continue():route.abort('failed'));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=nervous&modules=nervous:ocular');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor();allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(6);await page.unroute('**/models/anatomy/ocular/ocular.glb');
 for(const level of ['regions','structures']){await explode(level,100);const eye=(await parts());assert.equal(new Set(eye.map(p=>JSON.stringify(p.position))).size,1);await explode(level,0);await atRest();}
 check('Ocular module recovers after failure; eye components move coherently and return exactly to zero');
 await responsive();
}

async function responsive(){
 await goto('integumentary');
 for(const size of [{width:1366,height:768},{width:1050,height:844},{width:900,height:1100},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(size);await layers();assert.equal(await page.locator('.atlas-layer-system').count(),11);for(const id of ['integumentary','reproductive']){await systemInput(id).scrollIntoViewIfNeeded();assert.ok(await systemInput(id).isVisible());}assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await systemInput('integumentary').scrollIntoViewIfNeeded();await systemInput('integumentary').uncheck();await h.waitMeshes(0);await systemInput('integumentary').check();await h.waitMeshes(1);await closePanels();check('Eleven-layer panel and skin toggling',size);
 }
}
async function review(){
 await goto('integumentary');for(const [view,name] of [['anterior','preview-front'],['posterior','preview-back'],['left','preview-side']]){await h.view(view);await shot(name);}
 await goto('integumentary,muscular');await opacity(25);await h.view('anterior');await shot('preview-muscle25');
 await goto('integumentary,skeletal');await h.view('anterior');await shot('preview-skeleton100');await opacity(25);await shot('preview-skeleton25');
}

async function surfaceDetail(anchorId,view='anterior',zoomOut=0){
 await goto('integumentary');await chooseId(anchorId);await h.view(view);for(let i=0;i<zoomOut;i++){await page.getByRole('button',{name:'Alejar',exact:true}).click();await settledCamera();}await settledCamera();await action('Deseleccionar');await layers();await systemInput(byId.get(anchorId).systemId).uncheck();await h.waitMeshes(1);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await closePanels();
}
async function cameraReview(){
 for(const [id,view,zoom,name] of [['muscular:region:arm-right:hand','anterior',5,'preview-hand']]){await surfaceDetail(id,view,zoom);await shot(name);}
}
async function regionDetail(id,view='anterior',zoom=0){
 await chooseId(id);await h.view(view);for(let i=0;i<zoom;i++){await page.getByRole('button',{name:'Alejar',exact:true}).click();await settledCamera();}await settledCamera();await action('Deseleccionar');await opacity(100);await closePanels();
}
async function captures(){
 await goto();await h.view('anterior');for(const [value,name] of [[100,'01-atlas-piel-100'],[75,'02-atlas-piel-75'],[50,'03-atlas-piel-50'],[25,'04-atlas-piel-25'],[10,'05-atlas-piel-10']]){await opacity(value);await shot(name);}
 await layers();await systemInput('integumentary').uncheck();await h.waitMeshes(totalMeshes-1);await shot('06-atlas-sin-piel');await systemInput('integumentary').check();await h.waitMeshes(totalMeshes);await page.getByRole('button',{name:'Aislar piel',exact:true}).click();await shot('07-superficie-aislada','Explicit isolation; the other loaded systems are hidden, not geometrically repaired.');await layers();await page.getByRole('button',{name:'Explorar interior',exact:true}).click();
 for(const [id,view,zoom,name] of [
  ['skeletal:region:skull','anterior',0,'08-cabeza-ojos'],['muscular:region:neck','anterior',0,'09-cuello'],['skeletal:region:thorax','anterior',0,'10-torax'],['muscular:region:abdomen','anterior',0,'11-abdomen'],['reproductive','anterior',1,'12-pelvis-genital'],['muscular:group:arm-right:shoulder','anterior',1,'13-hombro'],['muscular:region:arm-right','anterior',0,'14-brazo-antebrazo'],['muscular:region:arm-right:hand','anterior',5,'15-mano'],['muscular:region:leg-right:thigh','anterior',0,'16-muslo'],['muscular:region:leg-right:leg','posterior',0,'17-pierna'],['muscular:region:leg-right:foot','right',1,'18-pie']
 ]){await regionDetail(id,view,zoom);await shot(name,'All eleven systems, native positions; skin at 100%. Regional focus does not clip or repair geometry.');}
 await chooseId('zanatomy:deep-fibular-nerve-r');await h.view('right');await opacity(25);await shot('19-nervio-fibular-revisado','Registered historical nerve, skin at 25%; no adjustment to conceal source mismatch.');
 await chooseId('bp3d:FMA45957');await h.view('posterior');await opacity(100);await shot('20-gastrocnemio-revisado','Native BP3D muscle and skin at 100%; geometric intersections retained.');
 await goto('integumentary,nervous');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('ojo');await shot('21-busqueda-ojo');await chooseId('ocular:FMA12514');await action('Aislar');await h.view('anterior');await shot('22-ojo-derecho-aislado');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1000);await h.view('anterior');await shot('23-contexto-ocular');
 await goto('integumentary,urinary');await chooseId('uri:FMA7204');await h.view('anterior');await action('Deseleccionar');await clickId('uri:FMA7204');await shot('24-seleccion-interna');await action('Aislar');await shot('25-rinon-aislado');await chooseId(skinId);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1200);await h.view('anterior');await shot('26-contexto-mixto');
 await goto();await opacity(10);for(const [level,name] of [['systems','27-despiece-sistemas'],['regions','28-despiece-regiones'],['structures','29-despiece-estructuras']]){await explode(level,70);await h.view('anterior');await shot(name);await explode(level,0);await atRest();}
 await goto('integumentary');await page.setViewportSize({width:1440,height:1050});await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Contraer todo el árbol'}).click();await page.getByRole('button',{name:'Expandir Cuerpo humano',exact:true}).click();await shot('30-arbol-once-sistemas');
 for(const [size,name] of [[{width:1366,height:768},'31-panel-1366'],[{width:1050,height:844},'32-panel-1050'],[{width:900,height:1100},'33-panel-900'],[{width:768,height:1024},'34-panel-768'],[{width:390,height:844},'35-panel-390']]){await page.setViewportSize(size);await layers();await systemInput('integumentary').scrollIntoViewIfNeeded();assert.equal(await page.locator('.atlas-layer-system').count(),11);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);await closePanels();}
}

async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});const cases={
  A:[allSystems.slice(0,10).join(','),'uri:FMA7204'],B:[allSystems.join(','),'uri:FMA7204'],D:[allSystems.join(','),'uri:FMA7204'],H:['integumentary,muscular','med3d:muscle:pectoralismajor:right'],
 };const key=process.env.QA_PERF_CASE;assert.ok(cases[key],'Run one named case in a fresh browser');const [systems,id]=cases[key],node=byId.get(id);
 report.environment.limitations=['One fresh Chrome process per configuration; local unthrottled no-store HTTP.','Software SwiftShader only, no physical GPU/mobile claims.','Timings include automation; geometry buffers are arrays, not VRAM.'];
 const requested=await goto(systems),initial=await h.metrics(),record={configuration:key,systems:systems.split(','),modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
 if(key==='D')await opacity(25);
 record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').waitFor();});
 record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,id);});record.focusMs=await measured(()=>settledCamera());
 const visibleIds=[...descendants(id)];record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(ids=>{const v=window.__med3dAtlasScene().parts.filter(p=>p.visible);return v.length&&v.every(p=>ids.includes(p.id));},visibleIds);});await action('Ver conjunto');
 record.hideMs=await measured(async()=>{await action('Ocultar',0);await page.waitForFunction(ids=>window.__med3dAtlasScene().parts.filter(p=>ids.includes(p.id)).every(p=>!p.visible),visibleIds);});record.showMs=await measured(async()=>{await action('Mostrar',0);await page.waitForFunction(ids=>window.__med3dAtlasScene().parts.filter(p=>ids.includes(p.id)).every(p=>p.visible),visibleIds);});
 record.opacitySystem=key==='A'?'urinary':'integumentary';record.opacity25Ms=await measured(()=>opacity(25,record.opacitySystem));await opacity(100,record.opacitySystem);
 if(key==='B'){await action('Deseleccionar');await page.getByRole('button',{name:'Centrar modelo',exact:true}).click();record.explodeSystemsMs=await measured(()=>explode('systems',70));await explode('systems',0);await atRest();}
 const module=requested.find(a=>a.id===(key==='A'?'urinary:organs':'integumentary:skin'));await layers();record.unloadMs=await measured(async()=>{await assetInput(module).uncheck();await h.waitMeshes(initial.meshCount-module.meshCount);});record.reloadMs=await measured(async()=>{await assetInput(module).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 record.idleDraws=await page.evaluate(()=>window.__atlasQa.draws);await wait(1000);record.idleDraws=(await page.evaluate(()=>window.__atlasQa.draws))-record.idleDraws;
 record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[key]=record;console.log('MEASURE',key,JSON.stringify(record));
}
async function integration(){
 await goto();assert.equal((await h.metrics()).meshCount,totalMeshes);
 for(const [query,id] of [['Fémur izquierdo',nodes.find(n=>n.name==='Fémur izquierdo').id],['esternocleidomastoideo',nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right').id],['FMA50735','bp3d:FMA50735'],['FJ2541','resp:FMA7394'],['Hepar','dig:FMA7197'],['nervio femoral derecho','zanatomy:femoral-nerve-r'],['FJ3147','uri:FMA7204'],['Hypophysis','endo:FMA13889'],['Splen','lym:FMA7196'],['Prostata','rep:FMA9600']]){
  await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await action('Aislar');assert.ok((await parts()).filter(p=>p.visible).every(p=>descendants(id).has(p.id)));await action('Ver conjunto');
 }
 for(const query of ['corazón','pulmon','encéfalo']){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);assert.ok(await page.locator('.atlas-global-results a.atlas-search-result').count()>0);}
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);await page.keyboard.press('Home');
 check('Eleven-system selection, search and isolation; independent organ results; virtualized ARIA tree and keyboard');
 for(const organ of ['heart','lungs','brain']){
  await page.goto(h.origin+'/med3d/anatomia/?organ='+organ,{waitUntil:'domcontentloaded'});await page.locator('.atlas-canvas canvas').waitFor({state:'visible'});await page.waitForFunction(organ=>performance.getEntriesByType('resource').some(e=>e.name.endsWith('/models/'+organ+'.glb'))&&window.__atlasQa.draws>0,organ,{timeout:120000});await page.getByRole('progressbar',{name:'Descarga del modelo'}).waitFor({state:'detached',timeout:120000});assert.equal(await page.getByRole('alert').count(),0);check('Independent organ renders: '+organ);
 }
 for(const route of ['/','/procedimientos/','/primeros-auxilios/','/acerca/','/arquitectura/']){
  const response=await page.goto(h.origin+'/med3d'+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.locator('main h1').first().waitFor();assert.ok((await page.locator('main').innerText()).length>100);check('General route', {route,title:await page.locator('main h1').first().textContent()});
 }
}

try{await withinQaDeadline(async()=>{await ({'eye-review':eyeReview,regional,review,camera:cameraReview,captures,performance:performanceQa,integration,responsive}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Integumentary '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'integration-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
