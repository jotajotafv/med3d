// Phase 8 internal systems evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--interaction','--review','--captures','--performance','--integration','--responsive'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase8','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
// Software WebGL can block screenshot/input acknowledgement beyond Playwright's
// normal 20 s default. Assertions are unchanged; this is not a physical-GPU claim.
h.context.setDefaultTimeout(120000);
page.setDefaultTimeout(120000);
const allSystems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive'];
const fresh=allSystems.slice(6),catalogs=await Promise.all(allSystems.map(s=>readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy',s,'catalog.json'),'utf8').then(JSON.parse)));
const newCatalogs=catalogs.slice(6),nodes=catalogs.flatMap(c=>c.nodes),assets=catalogs.flatMap(c=>c.assets),byId=new Map(nodes.map(n=>[n.id,n])),newAssets=newCatalogs.flatMap(c=>c.assets),totalMeshes=930;
byId.set('body',{id:'body',name:'Cuerpo humano',children:allSystems,assetIds:assets.map(a=>a.id)});
const samples={urinary:['uri:FMA7204','uri:FMA15572','uri:FMA15900','uri:FMA19667'],endocrine:['endo:thyroid','endo:FMA55560','endo:FMA13889','endo:FMA15630'],lymphatic:['lym:FMA7196','lym:FMA9607','lym:FMA71194'],reproductive:['rep:FMA7211','rep:FMA19236','rep:FMA9600','rep:penis','rep:FMA18247']};
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
async function opacity(value,system='urinary'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false,timeout:120000});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
const chooseId=id=>choose(byId.get(id));
async function regional(){
 for(const system of fresh){
  await goto(system);const expected=newCatalogs.find(c=>c.nodes.some(n=>n.id===system));assert.equal((await h.metrics()).meshCount,expected.coverage.meshes);
  for(const id of samples[system]){
   const node=byId.get(id);await chooseId(id);await page.getByRole('region',{name:'Información anatómica de '+node.name,exact:true}).waitFor();await action('Aislar');
   const visible=(await parts()).filter(p=>p.visible);assert.ok(visible.length&&visible.every(p=>descendants(id).has(p.id)));
   for(const view of ['anterior','posterior','left','right','superior','inferior']){await h.view(view);const screen=(await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples);assert.ok(screen.length&&screen.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Frustum '+id+' '+view);}
   await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
  }
  for(const value of [100,50,25,100])await opacity(value,system);
  await chooseId(system);await action('Aislar');assert.equal((await parts()).filter(p=>p.visible).length,expected.coverage.meshes);await action('Ver conjunto');
  const rest=await atRest();for(const level of ['regions','structures']){await explode(level,100);await explode(level,0);assert.deepEqual(await atRest(),rest);}
  await layers();await systemInput(system).uncheck();await h.waitMeshes(0);await systemInput(system).check();await h.waitMeshes(expected.coverage.meshes);
  check(system+': individual/component/group/system isolation, six views, cards, hide/restore, opacity 100/50/25, explosion and unload/reload');
 }
 await interaction();
}
async function interaction(){
 for(const id of ['uri:FMA7204','endo:FMA13369','lym:FMA7196','rep:FMA9600']){
  await goto(byId.get(id).systemId);await chooseId(id);await action('Aislar');await h.view('anterior');await action('Deseleccionar');await closePanels();
  // A projected vertex from an animating camera can move before the click.
  // Wait for the actual camera to settle, then prove selection at a visible
  // triangle sample. Hover alone is not evidence of a successful click.
  let previous='';for(let attempt=0;attempt<40;attempt++){const camera=JSON.stringify((await snapshot()).camera);if(camera===previous)break;previous=camera;await wait(200);if(attempt===39)throw Error('Camera did not settle');}
  const box=await page.locator('.atlas-canvas canvas').boundingBox();let hit=false;const attempts=[];
  for(const sample of (await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples)){
   const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;
   if(!await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.tagName==='CANVAS',{x,y}))continue;
   await page.mouse.move(x,y);await wait(150);
   const hovered=(await parts()).some(p=>p.id===id&&p.emissiveIntensity===.22);
   await page.mouse.click(x,y);await wait(200);const selected=await page.locator('.atlas-viewport').getAttribute('data-selected-id');attempts.push({x,y,hovered,selected});
   if(selected===id){hit=true;break;}
  }
  report.measurements['raycast-'+id]=attempts;console.log('RAYCAST',id,JSON.stringify(attempts));
  assert.ok(hit,'Actual raycast '+id);assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));
 }
 check('Real raycast, hover and selection in all four systems');
 for(const id of ['uri:FMA7204','endo:thyroid','lym:FMA7196','rep:FMA9600']){
  await goto(byId.get(id).systemId);await chooseId(id);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();
  const ids=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(','),requested=new Set([...assets.filter(a=>a.systemId===byId.get(id).systemId).map(a=>a.id),...ids.flatMap(id=>byId.get(id).assetIds)]);
  await h.waitMeshes(sum(assets.filter(a=>requested.has(a.id)),'meshCount'));assert.ok((await parts()).filter(p=>p.visible).every(p=>ids.some(id=>descendants(id).has(p.id))));
 }
 check('Explicit renal, cervical, splenic and prostatic contexts load existing systems');
 await goto(fresh.join(','));await layers();const initial=await h.metrics();for(const asset of newAssets){await assetInput(asset).uncheck();await h.waitMeshes(32-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(32);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 const failed=newAssets.find(a=>a.id==='endocrine:thyroid43'),pattern='**/'+failed.path;let allow=false;await page.route(pattern,r=>allow?r.continue():r.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+fresh.join(','));await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(25);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(32);await page.unroute(pattern);
 check('Five independent modules release and restore bounded buffers; failed thyroid module recovers');
 await responsive(false);
}
async function responsive(navigate=true){
 if(navigate)await goto(fresh.join(','));
 for(const size of [{width:1366,height:768},{width:1050,height:844},{width:900,height:1100},{width:390,height:844}]){
  await page.setViewportSize(size);await layers();assert.equal(await page.locator('.atlas-layer-system').count(),10);const last=systemInput('reproductive');await last.scrollIntoViewIfNeeded();assert.ok(await last.isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await last.uncheck();await h.waitMeshes(20);await last.check();await h.waitMeshes(32);await closePanels();assert.ok(await page.locator('.atlas-canvas canvas').isVisible());check('Ten-layer panel reaches and toggles last system without overflow',size);
 }
}
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL, no physical GPU or real mobile measurements.','Sequential unthrottled loopback no-store loads, not independent cold starts.','Buffers are decoded geometry arrays, not VRAM.','Interaction timings include browser automation.'];
 for(const [name,systems] of [['A-urinary','urinary'],['B-endocrine','endocrine'],['C-lymphatic','lymphatic'],['D-reproductive','reproductive'],['E-four-new',fresh.join(',')],['F-ten-systems',allSystems.join(',')],['G-renal-context','urinary,endocrine,cardiovascular'],['H-cervical-context','endocrine,respiratory']]){
  const requested=await goto(systems),initial=await h.metrics(),node=byId.get(systems.includes('urinary')?'uri:FMA7204':systems.includes('endocrine')?'endo:FMA15629':systems==='lymphatic'?'lym:FMA7196':'rep:FMA9600');
  const record={modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
  record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();});
  record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,node.id);});await wait(850);
  record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(id=>{const visible=window.__med3dAtlasScene().parts.filter(p=>p.visible);return visible.length&&visible.every(p=>p.id===id);},node.id);});await action('Ver conjunto');
  if(name==='F-ten-systems'){record.explodeSystemsMs=await measured(()=>explode('systems',70));await explode('systems',0);}else if(name==='E-four-new'){record.explodeRegionsMs=await measured(()=>explode('regions',70));await explode('regions',0);}
  const target=requested.find(a=>node.assetIds.includes(a.id));await layers();record.module=target.id;record.unloadMs=await measured(async()=>{await assetInput(target).uncheck();await h.waitMeshes(initial.meshCount-target.meshCount);});record.reloadMs=await measured(async()=>{await assetInput(target).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
  record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[name]=record;console.log('MEASURE',name,JSON.stringify(record));
 }
}
async function integration(){
 await goto();assert.equal((await h.metrics()).meshCount,930);
 for(const [query,id] of [['Fémur izquierdo',nodes.find(n=>n.name==='Fémur izquierdo').id],['esternocleidomastoideo',nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right').id],['FMA50735','bp3d:FMA50735'],['FJ2541','resp:FMA7394'],['Hepar','dig:FMA7197'],['nervio femoral derecho','zanatomy:femoral-nerve-r'],['FJ3147','uri:FMA7204'],['Hypophysis','endo:FMA13889'],['Splen','lym:FMA7196'],['Prostata','rep:FMA9600']]){
  await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await action('Aislar');assert.ok((await parts()).filter(p=>p.visible).every(p=>descendants(id).has(p.id)));await action('Ver conjunto');
 }
 for(const query of ['corazón','pulmon','encéfalo']){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);assert.ok(await page.locator('.atlas-global-results a.atlas-search-result').count()>0);}
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);await page.keyboard.press('Home');
 check('Ten-system selection, search and isolation; independent organ results; virtualized ARIA tree and keyboard');
 for(const organ of ['heart','lungs','brain']){
  await page.goto(h.origin+'/med3d/anatomia/?organ='+organ,{waitUntil:'domcontentloaded'});await page.locator('.atlas-canvas canvas').waitFor({state:'visible'});await page.waitForFunction(organ=>performance.getEntriesByType('resource').some(e=>e.name.endsWith('/models/'+organ+'.glb'))&&window.__atlasQa.draws>0,organ,{timeout:120000});await page.getByRole('progressbar',{name:'Descarga del modelo'}).waitFor({state:'detached',timeout:120000});assert.equal(await page.getByRole('alert').count(),0);check('Independent organ renders: '+organ);
 }
 for(const route of ['/','/procedimientos/','/primeros-auxilios/','/acerca/','/arquitectura/']){
  const response=await page.goto(h.origin+'/med3d'+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.locator('main h1').first().waitFor();assert.ok((await page.locator('main').innerText()).length>100);check('General route', {route,title:await page.locator('main h1').first().textContent()});
 }
}
async function review(){
 for(const [systems,id,name] of [['urinary,endocrine','uri:abdomen','preview-renal'],['endocrine,respiratory','endo:thyroid','preview-cervical'],['urinary,reproductive','reproductive','preview-pelvic']]){await goto(systems);await chooseId(id);await h.view('anterior');await action('Deseleccionar');await shot(name);}
}
async function captures(){
 async function organ(system,id,name,view='anterior'){await goto(system);await chooseId(id);await action('Aislar');await h.view(view);await action('Deseleccionar');await shot(name);}
 await goto('urinary');await chooseId('urinary');await h.view('anterior');await action('Deseleccionar');await shot('01-urinario-anterior');await chooseId('urinary');await h.view('posterior');await action('Deseleccionar');await shot('02-urinario-posterior');
 await organ('urinary','uri:abdomen','03-rinones');await organ('urinary','uri:FMA15571','04-ureter','left');await organ('urinary','uri:FMA15900','05-vejiga');await organ('urinary','uri:FMA19667','06-uretra','left');
 await organ('endocrine','endocrine','07-endocrino-global');await organ('endocrine','endo:thyroid','08-tiroides');await organ('endocrine','endo:neck','09-paratiroides-posteriores','posterior');await organ('endocrine','endo:FMA13889','10-hipofisis','left');await organ('endocrine','endo:abdomen','11-suprarrenales');
 await organ('lymphatic','lymphatic','12-linfatico-disponible');await organ('lymphatic','lym:FMA7196','13-bazo');await organ('lymphatic','lym:FMA9607','14-timo');
 await organ('reproductive','reproductive','15-reproductor-masculino');await organ('reproductive','rep:FMA7211','16-testiculo');await organ('reproductive','rep:FMA9600','17-prostata');await organ('reproductive','rep:penis','18-pene-componentes');
 await goto(fresh.join(','));await chooseId('body');await h.view('anterior');await action('Deseleccionar');await shot('19-cuatro-sistemas');
 await goto();await chooseId('body');await h.view('anterior');await action('Deseleccionar');await shot('20-diez-sistemas');
 await goto('urinary');await chooseId('uri:FMA7204');await h.view('anterior');await shot('21-rinon-seleccionado');await action('Aislar');await shot('22-rinon-aislado');
 await chooseId('uri:FMA7204');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(2000);await opacity(50,'urinary');await h.view('anterior');await shot('23-contexto-renal');
 await goto('endocrine');await chooseId('endo:thyroid');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1500);await opacity(50,'endocrine');await h.view('anterior');await shot('24-contexto-cervical');
 await goto(fresh.join(','));await chooseId('body');await explode('regions',100);await action('Enfocar');await action('Deseleccionar');await shot('25-exploded-regiones');await explode('regions',0);
 await chooseId('body');await explode('structures',100);await action('Enfocar');await action('Deseleccionar');await shot('26-exploded-estructuras');await explode('structures',0);
 await chooseId('uri:FMA7204');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('renal');await shot('27-busqueda-global');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Contraer todo el árbol'}).click();await page.getByRole('button',{name:'Expandir Cuerpo humano',exact:true}).click();await shot('28-arbol-global');
 for(const [size,name] of [[{width:1366,height:768},'29-laptop-capas'],[{width:1050,height:844},'30-intermedio-capas'],[{width:900,height:1100},'31-tablet-capas'],[{width:390,height:844},'32-movil-capas']]){await page.setViewportSize(size);await layers();await systemInput('reproductive').scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);await closePanels();}
 await page.setViewportSize({width:1440,height:900});await goto(fresh.join(','));for(const s of fresh)await opacity(50,s);await chooseId('body');await h.view('anterior');await action('Deseleccionar');await shot('33-transparencia-50');for(const s of fresh)await opacity(25,s);await shot('34-transparencia-25');for(const s of fresh)await opacity(100,s);
 await chooseId('body');await explode('systems',100);await action('Enfocar');await action('Deseleccionar');await shot('35-exploded-sistemas');await explode('systems',0);
}
try{await withinQaDeadline(async()=>{await ({regional,interaction,review,captures,performance:performanceQa,integration,responsive}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Internal systems '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'internal-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
