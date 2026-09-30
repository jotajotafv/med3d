// Phase 9 integumentary evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--camera','--review','--captures','--performance','--integration','--responsive'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase9','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
// Software WebGL can block screenshot/input acknowledgement beyond Playwright's
// normal 20 s default. Assertions are unchanged; this is not a physical-GPU claim.
h.context.setDefaultTimeout(120000);
page.setDefaultTimeout(120000);
const allSystems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];
const catalogs=await Promise.all(allSystems.map(s=>readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy',s,'catalog.json'),'utf8').then(JSON.parse)));
const nodes=catalogs.flatMap(c=>c.nodes),assets=catalogs.flatMap(c=>c.assets),byId=new Map(nodes.map(n=>[n.id,n])),totalMeshes=931,skinId='integ:FMA7163';
byId.set('body',{id:'body',name:'Cuerpo humano',children:allSystems,assetIds:assets.map(a=>a.id)});
let activeTotalMeshes=totalMeshes;
const sum=(list,key)=>list.reduce((total,item)=>total+item[key],0);
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
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):true);},value,{timeout:120000});}
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
async function regional(){
 await goto('integumentary');const initial=await h.metrics();assert.equal(initial.meshCount,1);assert.equal(initial.triangleCount,203382);await chooseId(skinId);await page.getByRole('region',{name:'Información anatómica de '+byId.get(skinId).name,exact:true}).waitFor();
 for(const view of ['anterior','posterior','left','right','superior','inferior']){await h.view(view);const points=(await parts())[0].screenSamples;assert.ok(points.length&&points.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Skin frustum '+view);}
 await action('Aislar');assert.equal((await parts()).filter(p=>p.visible).length,1);await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');await h.view('anterior');
 for(const value of [100,75,50,25,10]){await opacity(value);assert.ok((await parts())[0].raycastEnabled);}
 await opacity(100);await action('Deseleccionar');await clickId(skinId);await action('Deseleccionar');
 for(const level of ['regions','structures']){await explode(level,100);await atRest();await explode(level,0);}
 check('Native skin: six views, card, organ/system isolation, hide/restore, five opacities, real picking and coherent explosion');
 await layers();await systemInput('integumentary').uncheck();await h.waitMeshes(0);assert.equal((await h.metrics()).geometryBytes,0);await systemInput('integumentary').check();await h.waitMeshes(1);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 const moduleInput=assetInput(assets.find(a=>a.id==='integumentary:skin'));await moduleInput.uncheck();await h.waitMeshes(0);await moduleInput.check();await h.waitMeshes(1);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 check('Skin layer and module unload/reload release and restore bounded buffers');
 await goto('integumentary,urinary');await chooseId('uri:FMA7204');await h.view('anterior');await action('Deseleccionar');
 assert.ok((await parts()).find(p=>p.id===skinId).raycastEnabled);
 for(const value of [75,50,25,10]){await opacity(value);assert.equal((await parts()).find(p=>p.id===skinId).raycastEnabled,false);await clickId('uri:FMA7204');await action('Deseleccionar');}
 await chooseId(skinId);await action('Aislar');assert.ok((await parts()).find(p=>p.id===skinId).raycastEnabled);await action('Deseleccionar');await clickId(skinId);await action('Ver conjunto');
 await opacity(100);assert.ok((await parts()).find(p=>p.id===skinId).raycastEnabled);await opacity(25);
 check('Transparent skin passes real clicks to kidney at 75/50/25/10; skin remains selectable by search and alone');
 await chooseId(skinId);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1000);const targets=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(',');const expected=new Set(['integumentary:skin','urinary:organs',...targets.flatMap(id=>byId.get(id).assetIds)]);await h.waitMeshes(sum(assets.filter(a=>expected.has(a.id)),'meshCount'));assert.ok((await parts()).filter(p=>p.visible).every(p=>targets.some(id=>descendants(id).has(p.id))));assert.equal((await parts()).find(p=>p.id===skinId).opacity,.25);
 check('Explicit superficial muscle/bone context and stated 25% skin opacity');
 let allow=false;await page.route('**/models/anatomy/integumentary/skin.glb',route=>allow?route.continue():route.abort('failed'));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=integumentary');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor();await h.waitMeshes(0);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(1);await page.unroute('**/models/anatomy/integumentary/skin.glb');check('Failed skin download recovers on retry');
 await responsive();
}
async function responsive(){
 await goto('integumentary');
 for(const size of [{width:1366,height:768},{width:1050,height:844},{width:900,height:1100},{width:390,height:844}]){
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
async function captures(){
 await goto('integumentary');for(const [view,name] of [['anterior','01-piel-anterior'],['posterior','02-piel-posterior'],['left','03-piel-lateral-izquierda'],['right','04-piel-lateral-derecha']]){await h.view(view);await shot(name);}
 await surfaceDetail('skeletal:region:skull');await shot('05-piel-cabeza','Enfoque mediante referencia craneal, descargada antes de capturar. Una única piel sin regiones artificiales.');
 await surfaceDetail('muscular:region:arm-right:hand','anterior',5);await shot('06-piel-mano','Enfoque mediante referencia muscular de mano derecha y zoom manual; sólo piel visible y cargada.');
 await surfaceDetail('muscular:region:leg-right:foot','right',1);await shot('07-piel-pie','Enfoque mediante referencia muscular de pie derecho; sólo piel visible y cargada.');
 await goto('integumentary,muscular');await h.view('anterior');for(const [value,name] of [[75,'08-piel-75'],[50,'09-piel-50'],[25,'10-piel-25'],[10,'11-piel-10']]){await opacity(value);await shot(name);}
 await opacity(25);await h.view('posterior');await shot('12-piel-muscular-posterior');
 await goto('integumentary,skeletal');await opacity(25);await h.view('anterior');await shot('13-piel-oseo');
 await goto('integumentary,cardiovascular');await opacity(10);await h.view('anterior');await shot('14-piel-cardiovascular');
 await goto('integumentary,nervous');await opacity(10);await h.view('anterior');await shot('15-piel-nervioso');
 await goto('integumentary');await opacity(50);await chooseId(skinId);await action('Deseleccionar');await clickId(skinId);await shot('16-solo-piel-clic-transparente');
 await page.goto(h.origin+'/med3d/anatomia/?qa=1',{waitUntil:'domcontentloaded'});await h.waitMeshes(930);await wait(700);assert.ok((await parts()).every(p=>p.systemId!=='integumentary'));await layers();assert.equal(await systemInput('integumentary').isChecked(),false);await h.view('anterior');await shot('17-atlas-inicial-sin-piel');
 await systemInput('integumentary').check();await h.waitMeshes(931);await h.view('anterior');await shot('18-atlas-con-piel');await chooseId(skinId);await shot('19-piel-seleccionada');await action('Aislar');await shot('20-piel-aislada','Aislamiento de la unidad fuente completa. No hay una región cutánea separada que pueda aislarse sin recortar geometría.');
 await goto('integumentary,urinary');await chooseId('uri:FMA7204');await h.view('anterior');await action('Deseleccionar');await opacity(25);await clickId('uri:FMA7204');await shot('21-seleccion-interna-con-piel');
 for(const [size,name] of [[{width:1366,height:768},'22-panel-laptop'],[{width:900,height:1100},'23-panel-tablet'],[{width:390,height:844},'24-panel-movil']]){await page.setViewportSize(size);await layers();await systemInput('integumentary').scrollIntoViewIfNeeded();assert.equal(await page.locator('.atlas-layer-system').count(),11);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);await closePanels();}
 await page.setViewportSize({width:1440,height:900});await goto('integumentary,skeletal,muscular');await opacity(10);await explode('systems',100);await h.view('anterior');await shot('25-despiece-sistemas','La piel permanece como referencia espacial; huesos y músculos usan el despiece existente.');await explode('systems',0);
 await goto('integumentary');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('piel');await shot('26-busqueda-piel');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Contraer todo el árbol'}).click();await page.getByRole('button',{name:'Expandir Cuerpo humano',exact:true}).click();await shot('27-arbol-once-sistemas');
 await chooseId(skinId);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1500);const targets=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(','),wanted=new Set(targets.flatMap(id=>byId.get(id).assetIds));await h.waitMeshes(sum(assets.filter(a=>wanted.has(a.id)),'meshCount'));await h.view('anterior');await shot('28-contexto-superficial');
 await surfaceDetail('skeletal:region:thorax','anterior');await shot('29-piel-torax','Enfoque de referencia torácica sin separar la piel.');await surfaceDetail('skeletal:region:thorax','posterior');await shot('30-piel-espalda','Enfoque de referencia torácica posterior sin separar la piel.');
}
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});const cases={
  A:['integumentary',skinId],B:['integumentary,muscular','med3d:muscle:pectoralismajor:right'],C:['integumentary,skeletal','bp3d:FMA7485'],D:['integumentary,urinary,cardiovascular,nervous','uri:FMA7204'],E:[allSystems.join(','),'uri:FMA7204'],F:[allSystems.slice(0,10).join(','),'uri:FMA7204'],
 };const key=process.env.QA_PERF_CASE;assert.ok(cases[key],'Run one named case in a fresh browser');const [systems,id]=cases[key],node=byId.get(id);
 report.environment.limitations=['One fresh Chrome process per configuration; local unthrottled no-store HTTP.','Software SwiftShader only, no physical GPU/mobile claims.','Timings include automation; geometry buffers are arrays, not VRAM.'];
 const requested=await goto(systems),initial=await h.metrics(),record={configuration:key,systems:systems.split(','),modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
 record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').waitFor();});
 record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,id);});await settledCamera();
 const visibleIds=[...descendants(id)];record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(ids=>{const v=window.__med3dAtlasScene().parts.filter(p=>p.visible);return v.length&&v.every(p=>ids.includes(p.id));},visibleIds);});await action('Ver conjunto');
 record.hideMs=await measured(async()=>{await action('Ocultar',0);await page.waitForFunction(ids=>window.__med3dAtlasScene().parts.filter(p=>ids.includes(p.id)).every(p=>!p.visible),visibleIds);});record.showMs=await measured(async()=>{await action('Mostrar',0);await page.waitForFunction(ids=>window.__med3dAtlasScene().parts.filter(p=>ids.includes(p.id)).every(p=>p.visible),visibleIds);});
 record.opacitySystem=key==='F'?'urinary':'integumentary';record.opacity25Ms=await measured(()=>opacity(25,record.opacitySystem));await opacity(100,record.opacitySystem);
 if(key==='E'){await action('Deseleccionar');await page.getByRole('button',{name:'Centrar modelo',exact:true}).click();record.explodeSystemsMs=await measured(()=>explode('systems',70));await explode('systems',0);await atRest();}
 const module=requested.find(a=>a.id===(key==='F'?'urinary:organs':'integumentary:skin'));await layers();record.unloadMs=await measured(async()=>{await assetInput(module).uncheck();await h.waitMeshes(initial.meshCount-module.meshCount);});record.reloadMs=await measured(async()=>{await assetInput(module).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e?e.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[key]=record;console.log('MEASURE',key,JSON.stringify(record));
}
async function integration(){
 await goto();assert.equal((await h.metrics()).meshCount,931);
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

try{await withinQaDeadline(async()=>{await ({regional,review,camera:cameraReview,captures,performance:performanceQa,integration,responsive}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Integumentary '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'integumentary-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
