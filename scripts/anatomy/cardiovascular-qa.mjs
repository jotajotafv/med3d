// Phase 5 cardiovascular evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--review','--captures','--performance'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase5','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nervous=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/nervous/catalog.json'),'utf8'));
const cardio=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/cardiovascular/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes,...nervous.nodes,...cardio.nodes],assets=[...h.catalog.assets,...muscular.assets,...nervous.assets,...cardio.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const newAssets=cardio.assets;
const boneMeshes=h.expectedMeshes,muscleMeshes=muscular.coverage.meshes,totalMeshes=boneMeshes+muscleMeshes+nervous.coverage.meshes+cardio.coverage.meshes;
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
async function goto(systems='skeletal,muscular,nervous,cardiovascular',moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId==='skeletal'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value,system='cardiovascular'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}


const family=(key,side)=>cardio.nodes.find(n=>n.family===key&&(!side||n.side===side));
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL; no physical GPU or real mobile measurement.','Sequential loopback no-store loads, not independent cold starts.','Buffer bytes are CPU geometry arrays, not VRAM.','Interaction durations include automation and rendering.'];
 for(const [name,systems] of [['A-bone','skeletal'],['B-muscle','muscular'],['C-nervous','nervous'],['D-cardio','cardiovascular'],['E-bone-cardio','skeletal,cardiovascular'],['F-muscle-cardio','muscular,cardiovascular'],['G-all','skeletal,muscular,nervous,cardiovascular']]){
  const requested=await goto(systems),initial=await h.metrics();const record={modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
  const node=systems.includes('cardiovascular')?family('femoral-artery','right'):systems.includes('nervous')?byId.get('zanatomy:femoral-nerve-r'):systems==='skeletal'?nodes.find(n=>n.name==='Fémur izquierdo'):nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right');
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
 await goto('cardiovascular');assert.equal((await h.metrics()).meshCount,162);assert.equal((await h.metrics()).loadedAssets,7);
 const keys=['ascending-aorta','arch-of-aorta','common-carotid-artery','subclavian-artery','brachial-artery','radial-artery','abdominal-aorta','common-iliac-artery','femoral-artery','popliteal-artery','posterior-tibial-artery','superior-vena-cava','inferior-vena-cava','cephalic-vein','great-saphenous-vein','trunk-of-right-coronary-artery'];
 for(const node of [byId.get('cardio:heart'),...keys.map(key=>family(key))]){
  for(const query of [node.name,node.latin,node.sourceId,...node.aliases.filter(x=>x.startsWith('FJ'))].filter(Boolean)){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();}
  await choose(node);await page.getByRole('region',{name:'Información cardiovascular de '+node.name,exact:true}).waitFor();await action('Aislar');
  const visible=(await parts()).filter(p=>p.visible);assert.ok(visible.length&&visible.every(p=>descendants(node.id).has(p.id)));
  for(const view of node.id==='cardio:heart'?['anterior','posterior','left','right','superior','inferior']:['anterior','posterior','left']){await h.view(view);const samples=(await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples);assert.ok(samples.length);assert.ok(samples.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Frustum '+node.id+' '+view);}
  await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 }
 check('Heart and 16 representative vascular families: search, cards, cameras, isolation and hide/restore');
 for(const node of [family('radial-artery','right'),family('great-saphenous-vein','left'),family('wall-of-left-atrium')]){
  await choose(node);await action('Aislar');await h.view('anterior');await action('Deseleccionar');await closePanels();
  const box=await page.locator('.atlas-canvas canvas').boundingBox();let hit=false;
  for(const sample of (await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples)){
   const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;await page.mouse.move(x,y);await wait(120);
   if((await parts()).some(p=>p.id===node.id&&p.emissiveIntensity===.22)){await page.mouse.click(x,y);hit=true;break;}
  }
  assert.ok(hit,'Actual raycast '+node.id);await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,node.id);assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));await action('Ver conjunto');
 }
 check('Real hover/raycast/cyan selection on artery, vein and atrial wall without enlarged geometry');
 await goto('cardiovascular');await layers();
 for(const [label,category] of [['arterias','arterial'],['venas','venous'],['corazón','heart']]){
  await page.getByRole('checkbox',{name:'Mostrar '+label,exact:true}).uncheck();await wait(200);assert.ok((await parts()).filter(p=>byId.get(p.id).vascularClass===category).every(p=>!p.visible));await page.getByRole('checkbox',{name:'Mostrar '+label,exact:true}).check();
 }
 const colors={arterial:'b5635e',venous:'648fab',heart:'a96d78'};assert.ok((await parts()).every(p=>p.color===colors[byId.get(p.id).vascularClass]));
 check('Arterial, venous and heart sublayers; anatomical categories determine colors including pulmonary vessels');
 await goto();await choose(family('femoral-artery','right'));await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(500);
 assert.deepEqual(new Set((await parts()).filter(p=>p.visible).map(p=>p.id)),new Set([family('femoral-artery','right').id,'bp3d:FMA16586','bp3d:FMA24474']));
 await choose(family('trunk-of-right-coronary-artery'));await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(500);assert.ok((await parts()).filter(p=>p.visible).some(p=>byId.get(p.id).vascularClass==='heart'));
 await reset();await opacity(25,'skeletal');await opacity(10,'muscular');await opacity(10,'nervous');for(const value of [100,50,25,100])await opacity(value);
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,70);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 await layers();await systemInput('cardiovascular').uncheck();await h.waitMeshes(totalMeshes-162);await systemInput('cardiovascular').check();await h.waitMeshes(totalMeshes);
 check('Explicit femoral/bone and coronary/heart context; four opacity layers; three explosion modes restore exact zero; independent system loading');
 const failed=cardio.assets.find(a=>a.id==='cardio:upper-right'),pattern='**/'+failed.path;let allow=false;await page.route(pattern,r=>allow?r.continue():r.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=cardiovascular');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(162-failed.meshCount);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(162);await page.unroute(pattern);
 await layers();const initial=await h.metrics();for(const asset of cardio.assets){await assetInput(asset).uncheck();await h.waitMeshes(162-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(162);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('All seven modules unload/reload without retained buffers; failed region recovers');
 await choose(family('femoral-artery','left'));await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);
 for(const size of [{width:1366,height:768},{width:820,height:1180},{width:390,height:844}]){await page.setViewportSize(size);await choose(byId.get('cardiovascular'));await closePanels();assert.ok(await page.locator('.atlas-canvas canvas').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
 check('Virtualized expanded ARIA tree, keyboard, laptop/tablet/mobile without horizontal overflow');
}
async function review(){await goto('cardiovascular');await choose(byId.get('cardiovascular'));await h.view('anterior');await action('Deseleccionar');await shot('preview-overview');await choose(byId.get('cardio:heart'));await action('Aislar');await h.view('anterior');await shot('preview-heart');await goto('skeletal,cardiovascular');await choose(family('femoral-artery','right'));await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('preview-femoral-context');}
async function captures(){
 await goto('cardiovascular');
 for(const [view,name] of [['anterior','01-cardio-anterior'],['posterior','02-cardio-posterior'],['left','03-cardio-lateral']]){await choose(byId.get('cardiovascular'));await h.view(view);await action('Deseleccionar');await shot(name);}
 for(const [id,name,view] of [
 ['cardio:heart','04-corazon','anterior'],['cardio:arterial:trunk','05-grandes-vasos','anterior'],['cardio:aorta','06-aorta','anterior'],
 [family('arch-of-aorta').id,'07-arco-aortico','anterior'],['cardio:arterial:head-neck','08-carotidas','anterior'],['cardio:arterial:upper-right','09-brazo-arterial','anterior'],
 [family('radial-artery','right').id,'10-radial-seleccionada','anterior'],['cardio:arterial:trunk','11-tronco-arterial','left'],[family('abdominal-aorta').id,'12-aorta-abdominal','anterior'],
 [family('common-iliac-artery','right').id,'13-pelvis-arterial','anterior'],[family('femoral-artery','left').id,'14-femoral','anterior'],['cardio:arterial:lower-right','15-pierna-arterial','anterior'],
 ['cardio:venous','16-venoso-anterior','anterior'],[family('superior-vena-cava').id,'17-cava-superior','anterior'],[family('inferior-vena-cava').id,'18-cava-inferior','anterior'],
 ['cardio:venous:upper-left','19-brazo-venoso','anterior'],[family('common-iliac-vein','left').id,'20-pelvis-venosa','anterior'],['cardio:venous:lower-right','21-femoral-safena','anterior']]){
  await choose(byId.get(id));await action('Aislar');await h.view(view);if(!['10-radial-seleccionada','14-femoral','17-cava-superior'].includes(name))await action('Deseleccionar');await shot(name);await page.getByRole('button',{name:'Mostrar todas las piezas',exact:true}).click();
 }
 await choose(byId.get('cardio:heart'));await h.view('anterior');await shot('22-corazon-y-grandes-vasos');
 await goto('skeletal,cardiovascular');await opacity(35,'skeletal');await choose(byId.get('cardiovascular'));await h.view('anterior');await action('Deseleccionar');await shot('23-cardio-oseo');
 await goto('muscular,cardiovascular');await opacity(15,'muscular');await choose(byId.get('cardiovascular'));await h.view('anterior');await action('Deseleccionar');await shot('24-cardio-muscular');
 await goto();await opacity(30,'skeletal');await opacity(10,'muscular');await opacity(10,'nervous');await choose(byId.get('cardiovascular'));await h.view('anterior');await action('Deseleccionar');await shot('25-cuatro-sistemas');
 await choose(family('brachial-artery','right'));await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('26-contexto-braquial');
 await goto('cardiovascular');await choose(family('great-saphenous-vein','left'));await action('Aislar');await h.view('anterior');await shot('27-vena-aislada');
 await choose(family('trunk-of-right-coronary-artery'));await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('28-contexto-coronario');
 await goto();await choose(byId.get('body'));await explode('systems',100);await action('Enfocar');await action('Deseleccionar');await shot('29-exploded-sistemas');
 await goto('cardiovascular');await choose(byId.get('cardiovascular'));await explode('regions',70);await action('Enfocar');await action('Deseleccionar');await shot('30-exploded-regiones');await explode('regions',0);
 await choose(family('femoral-artery','right'));await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('femoral');await shot('31-busqueda-global');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('32-arbol-global');
 for(const [size,name] of [[{width:1366,height:768},'33-laptop'],[{width:820,height:1180},'34-tablet'],[{width:390,height:844},'35-movil']]){await page.setViewportSize(size);await choose(byId.get('cardiovascular'));await h.view('anterior');await action('Deseleccionar');await closePanels();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);}
}
try{await withinQaDeadline(async()=>{await ({regional,review,captures,performance:performanceQa}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Cardiovascular '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'cardiovascular-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
