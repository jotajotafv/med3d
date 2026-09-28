// Phase 6 respiratory evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--review','--captures','--performance','--explosion'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase6','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nervous=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/nervous/catalog.json'),'utf8'));
const cardio=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/cardiovascular/catalog.json'),'utf8'));
const resp=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/respiratory/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes,...nervous.nodes,...cardio.nodes,...resp.nodes],assets=[...h.catalog.assets,...muscular.assets,...nervous.assets,...cardio.assets,...resp.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const newAssets=resp.assets;
// The neutral root is composed by the UI, so it is absent from source catalogs.
byId.set('body',{id:'body',name:'Cuerpo humano',children:['skeletal','muscular','nervous','cardiovascular','respiratory'],assetIds:assets.map(asset=>asset.id)});
const boneMeshes=h.expectedMeshes,muscleMeshes=muscular.coverage.meshes,totalMeshes=boneMeshes+muscleMeshes+nervous.coverage.meshes+cardio.coverage.meshes+resp.coverage.meshes;
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
async function goto(systems='skeletal,muscular,nervous,cardiovascular,respiratory',moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId==='skeletal'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value,system='respiratory'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
const chooseId=id=>choose(byId.get(id));
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL; no physical GPU or real mobile measurement.','Sequential loopback no-store loads, not independent cold starts.','Buffer bytes are CPU geometry arrays, not VRAM.','Interaction durations include automation and rendering.'];
 for(const [name,systems] of [['A-bone','skeletal'],['B-muscle','muscular'],['C-nervous','nervous'],['D-cardio','cardiovascular'],['E-respiratory','respiratory'],['F-respiratory-bone','respiratory,skeletal'],['G-respiratory-cardio','respiratory,cardiovascular'],['H-five-systems','skeletal,muscular,nervous,cardiovascular,respiratory']]){
  const requested=await goto(systems),initial=await h.metrics();const record={modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
  const node=systems.includes('respiratory')?byId.get('resp:FMA7394'):systems==='cardiovascular'?cardio.nodes.find(n=>n.family==='femoral-artery'&&n.side==='right'):systems==='nervous'?byId.get('zanatomy:femoral-nerve-r'):systems==='skeletal'?nodes.find(n=>n.name==='Fémur izquierdo'):nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right');
  record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();});
  record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,node.id);});await wait(900);
  record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(id=>{const visible=window.__med3dAtlasScene().parts.filter(p=>p.visible);return visible.length&&visible.every(p=>p.id===id);},node.id);});await action('Ver conjunto');
  const level=systems.includes(',')?'systems':'structures';record.explodeMs=await measured(()=>explode(level,100));await explode(level,0);
  const target=requested.find(a=>node.assetIds.includes(a.id));await layers();record.module=target.id;
  record.unloadMs=await measured(async()=>{await assetInput(target).uncheck();await h.waitMeshes(initial.meshCount-target.meshCount);});record.reloadMs=await measured(async()=>{await assetInput(target).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
  record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[name]=record;console.log('MEASURE',name,JSON.stringify(record));
 }
}
async function regional(){
 await goto('respiratory');assert.equal((await h.metrics()).meshCount,128);assert.equal((await h.metrics()).loadedAssets,3);
 for(const id of ['resp:larynx','resp:FMA55130','resp:FMA7394','resp:FMA68418','resp:FMA7396','resp:lung:right','resp:lung:left','resp:lobe:right-middle','resp:FMA68226']){
  const node=byId.get(id);await choose(node);await page.getByRole('region',{name:'Información respiratoria de '+node.name,exact:true}).waitFor();await action('Aislar');
  const visible=(await parts()).filter(p=>p.visible);assert.ok(visible.length&&visible.every(p=>descendants(id).has(p.id)));
  for(const view of id==='resp:larynx'?['anterior','posterior','left','right','superior','inferior']:['anterior','posterior','left']){await h.view(view);const samples=(await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples);assert.ok(samples.length);assert.ok(samples.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Frustum '+id+' '+view);}
  await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 }
 check('Larynx, epiglottis, trachea, main bronchi, both lungs, lobes and segmental tree: cards, focus, six orientations, isolation and hide/restore');
 for(const id of ['resp:FMA7394','resp:FMA27373','resp:FMA7396']){
  await chooseId(id);await action('Aislar');await h.view('anterior');await action('Deseleccionar');await closePanels();
  const box=await page.locator('.atlas-canvas canvas').boundingBox();let hit=false;
  for(const sample of (await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples)){
   const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;await page.mouse.move(x,y);await wait(120);
   if((await parts()).some(p=>p.id===id&&p.emissiveIntensity===.22)){await page.mouse.click(x,y);hit=true;break;}
  }
  assert.ok(hit,'Actual raycast '+id);await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,id);assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));await action('Ver conjunto');
 }
 check('Real hover/raycast/cyan selection on trachea, parenchyma and main bronchus');
 await goto('respiratory');const colors={cartilage:'a9b9b7',parenchyma:'bd9fa6',trachea:'729dab','main-bronchus':'729dab','bronchial-tree':'729dab'};assert.ok((await parts()).every(p=>p.color===colors[byId.get(p.id).respiratoryClass]));
 for(const value of [100,75,50,25,100])await opacity(value);
 check('Respiratory materials; 100/75/50/25 percent use DoubleSide, depthTest and depthWrite=false below 100');
 await chooseId('resp:lung:right');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();
 const context=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(',');assert.deepEqual(new Set(context),new Set(['resp:lung:right','skeletal:region:thorax','cardio:heart','resp:FMA68418','bp3d:FMA50872','bp3d:FMA49914','bp3d:FMA49911']));
 const contextAssets=new Set([...resp.assets.map(a=>a.id),...context.flatMap(id=>byId.get(id).assetIds)]);await h.waitMeshes(sum(assets.filter(a=>contextAssets.has(a.id)),'meshCount'));
 assert.ok((await parts()).filter(p=>p.visible).every(p=>context.some(id=>descendants(id).has(p.id))));
 check('Lung context loads curated thorax, ipsilateral main bronchus/pulmonary vessels and mediastinal heart');
 await goto();await opacity(30,'skeletal');await opacity(15,'muscular');await opacity(50,'nervous');await opacity(75,'cardiovascular');await opacity(50);
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,70);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 await layers();await systemInput('respiratory').uncheck();await h.waitMeshes(totalMeshes-128);await systemInput('respiratory').check();await h.waitMeshes(totalMeshes);
 check('Five independent opacity layers; all three explosion modes restore exact zero; respiratory system unload/reload');
 const failed=resp.assets.find(a=>a.id==='respiratory:airway'),pattern='**/'+failed.path;let allow=false;await page.route(pattern,r=>allow?r.continue():r.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=respiratory');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(128-failed.meshCount);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(128);await page.unroute(pattern);
 await layers();const initial=await h.metrics();for(const asset of resp.assets){await assetInput(asset).uncheck();await h.waitMeshes(128-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(128);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('All three modules unload/reload without retained buffers; failed airway module recovers');
 for(const [query,id] of [['epiglotis','resp:FMA55130'],['FJ2541','resp:FMA7394'],['Pulmo dexter','resp:lung:right']]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').waitFor();}
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);await page.keyboard.press('Home');
 for(const size of [{width:1366,height:768},{width:820,height:1180},{width:390,height:844}]){await page.setViewportSize(size);await chooseId('respiratory');await closePanels();assert.ok(await page.locator('.atlas-canvas canvas').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 check('Source/Latin search, virtualized expanded ARIA tree and keyboard, laptop/tablet/mobile without overflow');
}
async function review(){
 await goto('respiratory');await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('preview-respiratory');
 await goto('skeletal,cardiovascular,respiratory');await opacity(25,'skeletal');await opacity(35);await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('preview-registration');
 await goto('respiratory');await chooseId('resp:larynx');await action('Aislar');await h.view('left');await action('Deseleccionar');await shot('preview-larynx');
}
async function explosion(){
 await goto('respiratory');await chooseId('respiratory');const rest=await atRest();
 const delta=p=>p.position.map((x,i)=>Number((x-p.restPosition[i]).toFixed(8)));
 for(const level of ['regions','structures']){
  await explode(level,100);const airway=(await parts()).filter(p=>byId.get(p.id).explosionRegionId==='resp-airway');
  assert.equal(new Set(airway.map(p=>JSON.stringify(delta(p)))).size,level==='regions'?1:3);
  for(const side of ['right','left'])assert.equal(new Set(airway.filter(p=>byId.get(p.id).side===side).map(p=>JSON.stringify(delta(p)))).size,1,'Ipsilateral branches remain one block');
  await explode(level,0);assert.deepEqual(await atRest(),rest);
 }
 check('Actual WebGL: region airway remains whole; Structures separates trachea and two ipsilateral main bronchial blocks; exact zero restored');
}
async function captures(){
 await goto('respiratory');
 for(const [view,name] of [['anterior','01-respiratorio-anterior'],['posterior','02-respiratorio-posterior'],['left','03-respiratorio-lateral']]){await chooseId('respiratory');await h.view(view);await action('Deseleccionar');await shot(name);}
 for(const [id,name,view] of [['resp:upper','04-via-superior-disponible','anterior'],['resp:larynx','05-laringe','left'],['resp:FMA7394','06-traquea','anterior'],['resp:lower','07-bifurcacion-traqueal','anterior'],['resp:bronchi','08-bronquios','anterior'],['resp:lung:right','09-pulmon-derecho','anterior'],['resp:lung:left','10-pulmon-izquierdo','left'],['resp:lungs','11-lobulos','posterior']]){
  await chooseId(id);await action('Aislar');await h.view(view);await action('Deseleccionar');await shot(name);await page.getByRole('button',{name:'Mostrar todas las piezas',exact:true}).click();
 }
 await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await layers();await shot('12-solo-respiratorio');
 await goto('skeletal,respiratory');await opacity(30,'skeletal');await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('13-respiratorio-oseo');
 await goto('cardiovascular,respiratory');await opacity(35);await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('14-respiratorio-cardiovascular');
 await goto('muscular,respiratory');await opacity(15,'muscular');await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('15-respiratorio-muscular');
 await goto();await opacity(25,'skeletal');await opacity(10,'muscular');await opacity(40,'nervous');await opacity(50);await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await shot('16-cinco-sistemas');
 await goto('respiratory');await opacity(25);await chooseId('resp:FMA7394');await h.view('anterior');await shot('17-traquea-seleccionada');
 await opacity(100);await chooseId('resp:lung:right');await h.view('anterior');await shot('18-pulmon-seleccionado');
 await chooseId('resp:FMA7396');await action('Aislar');await h.view('anterior');await shot('19-bronquio-seleccionado');
 await chooseId('resp:FMA55130');await action('Aislar');await h.view('left');await shot('20-epiglotis-aislada');
 await chooseId('resp:lung:left');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1500);await opacity(25,'skeletal');await opacity(35);await h.view('anterior');await shot('21-contexto-pulmonar');
 await goto();await chooseId('body');await explode('systems',100);await action('Enfocar');await action('Deseleccionar');await shot('22-exploded-sistemas');
 await goto('respiratory');await chooseId('respiratory');await explode('regions',85);await action('Enfocar');await action('Deseleccionar');await shot('23-exploded-regiones');await explode('regions',0);
 await chooseId('resp:lung:right');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('pulmon');await shot('24-busqueda-global');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('25-arbol-global');
 for(const [size,name] of [[{width:1366,height:768},'26-laptop'],[{width:820,height:1180},'27-tablet'],[{width:390,height:844},'28-movil']]){await page.setViewportSize(size);await chooseId('respiratory');await h.view('anterior');await action('Deseleccionar');await closePanels();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);}
 await page.setViewportSize({width:1440,height:900});await goto('respiratory');await opacity(25);await chooseId('respiratory');await explode('structures',100);await action('Enfocar');await h.view('anterior');await action('Deseleccionar');await shot('29-exploded-estructuras','Main bronchial blocks and real lobar pieces; 25 percent respiratory opacity.');
}
try{await withinQaDeadline(async()=>{await ({regional,review,captures,performance:performanceQa,explosion}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Respiratory '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'respiratory-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
