// Phase 4 evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--functional','--captures','--performance','--entry'].includes(arg))?.slice(2)||'functional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase4','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nervous=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/nervous/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes,...nervous.nodes],assets=[...h.catalog.assets,...muscular.assets,...nervous.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const newAssets=nervous.assets;
const boneMeshes=h.expectedMeshes,muscleMeshes=muscular.coverage.meshes,totalMeshes=boneMeshes+muscleMeshes+nervous.coverage.meshes;
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
async function goto(systems='skeletal,muscular,nervous',moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId==='skeletal'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value,system='nervous'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}



const nerve=id=>byId.get(id);
const optic=nerve('bp3d:FMA50875'),cerebellum=nerve('bp3d:FMA67944'),trochlear=nerve('bp3d:FMA50881');
async function entry(){
 await goto('nervous',['nervous:cns']);await layers();await systemInput('muscular').check();await h.waitMeshes(57+182);
 await systemInput('nervous').uncheck();await h.waitMeshes(182);await systemInput('nervous').check();await h.waitMeshes(239);
 assert.ok(!await assetInput(newAssets[1]).isChecked());check('Regional nervous entry can activate a different system and restores its remembered subset');
}
async function functional(){
 await goto();assert.equal((await h.metrics()).meshCount,474);assert.equal((await h.metrics()).loadedAssets,27);
 for(const node of [cerebellum,optic,trochlear,nerve('bp3d:FMA52574'),nerve('bp3d:FMA52622'),nerve('bp3d:FMA53549'),nerve('bp3d:FMA72661')]){
  for(const query of [node.name,node.latin,node.sourceId,...node.aliases.filter(x=>x.startsWith('FJ'))]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();}
  await choose(node);const card=page.getByRole('region',{name:'Información nerviosa de '+node.name,exact:true});for(const heading of ['Descripción','Función','Recorrido general','Modalidad funcional','Territorio','Relaciones anatómicas'])assert.ok(await card.getByRole('heading',{name:heading,exact:true}).count());
  await action('Aislar');assert.ok((await parts()).filter(p=>p.visible).every(p=>descendants(node.id).has(p.id)));await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 }
 check('Seven representative nervous cards, all search keys, isolation/hide/restore');
 for(const node of [cerebellum,optic]){await choose(node);for(const view of ['anterior','posterior','left','right','superior','inferior'])await h.view(view);}
 await choose(optic);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(800);const visible=(await parts()).filter(p=>p.visible);assert.deepEqual(new Set(visible.map(p=>p.id)),new Set([optic.id,'bp3d:FMA52736','bp3d:FMA52734']));
 await reset();for(const value of [100,50,25])await opacity(value);await opacity(100);await opacity(25,'muscular');await opacity(25,'skeletal');assert.ok((await parts()).filter(p=>p.systemId==='nervous').every(p=>p.opacity===1));
 check('Six views, curated context, DoubleSide/depthTest and three independent opacity layers');
 await reset();const initial=await h.metrics();for(const asset of newAssets){await layers();await assetInput(asset).uncheck();await h.waitMeshes(474-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(474);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 for(const sys of ['nervous','muscular','skeletal']){await layers();await systemInput(sys).uncheck();await h.waitMeshes(474-sum(assets.filter(a=>a.systemId===sys),'meshCount'));await systemInput(sys).check();await h.waitMeshes(474);}
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,100);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 check('All systems/modules unload independently and all explosion modes restore exact zero');
 const failed=newAssets[1],pattern='**/'+failed.path;let allowed=false;await page.route(pattern,route=>allowed?route.continue():route.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=nervous',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(87-failed.meshCount);allowed=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(87);await page.unroute(pattern);
 check('Failed cranial module preserves CNS and recovers by explicit retry');
 await choose(cerebellum);await action('Aislar');await h.view('posterior');await action('Deseleccionar');await closePanels();
 const canvas=page.locator('.atlas-canvas canvas'),box=await canvas.boundingBox();let hit=false;
 for(const p of (await parts()).filter(p=>p.visible)){
  if(!p.screenCenter)continue;const [x,y]=p.screenCenter;const px=box.x+(x+1)*box.width/2,py=box.y+(1-y)*box.height/2;
  await page.mouse.move(px,py);await wait(120);if((await parts()).some(p=>p.visible&&p.emissiveIntensity===.22)){await page.mouse.click(px,py);hit=true;break;}
 }
 assert.ok(hit,'Actual raycast hover');await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,cerebellum.id);assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));
 check('Real pointer raycast, hover and cyan selection on original cerebellar geometry');
 await goto();for(const query of ['Fémur izquierdo','Bíceps braquial','Esternocleidomastoideo','Abductor del pulgar','Corazón','Pulmón','Encéfalo']){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);assert.ok(await page.locator('.atlas-search-result').count(),'Global search '+query);}
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();await page.keyboard.press('Home');assert.equal(await selectedName(),'Cuerpo humano');assert.ok(await tree.getByRole('treeitem').count()<100);
 check('Global search across historical systems and independent organs; virtual tree keyboard navigation');
 for(const viewport of [{width:1366,height:768},{width:820,height:1180},{width:390,height:844}]){await page.setViewportSize(viewport);await choose(optic);await closePanels();assert.ok(await canvas.isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await structures();await clearSearch();}
 await page.setViewportSize({width:1440,height:900});
 for(const organ of ['heart','lungs','brain']){await page.goto(h.origin+'/med3d/anatomia/?organ='+organ);await page.locator('canvas').waitFor({timeout:120000});await page.waitForFunction(()=>!document.querySelector('.model-loading'),null,{timeout:120000});assert.ok((await page.locator('body').innerText()).length>100);}
 const routeList=['','acerca','arquitectura','procedimientos','primeros-auxilios','procedimientos/presion-arterial','procedimientos/signos-vitales','procedimientos/vendaje','procedimientos/inmovilizacion','primeros-auxilios/rcp','primeros-auxilios/atragantamiento','primeros-auxilios/hemorragias','primeros-auxilios/quemaduras','primeros-auxilios/fracturas','primeros-auxilios/desmayos','primeros-auxilios/convulsiones','primeros-auxilios/botiquin'];
 for(const route of routeList){await page.goto(h.origin+'/med3d/'+route);assert.ok(await page.locator('h1').count(),'Route '+route);}
 check('Laptop/tablet/mobile, three independent organ routes and all general static routes');
}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL; no physical GPU/mobile result.','Sequential loopback no-store loads; not independent cold starts.','Buffers are CPU geometry arrays, not VRAM.','Interaction timings include automation and rendering; no FPS claim.'];
 for(const [name,systems] of [['A-bone','skeletal'],['B-muscle','muscular'],['C-nervous','nervous'],['D-bone-muscle','skeletal,muscular'],['E-all','skeletal,muscular,nervous']]){
  const requested=await goto(systems);await page.waitForFunction(()=>Number(document.querySelector('.atlas-viewport')?.dataset.fullSystemMs)>0);const initial=await h.metrics();
  const record={glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffersBytes:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullReadyMs:initial.fullSystemMs};
  const node=systems.includes('nervous')?optic:systems==='skeletal'?nodes.find(n=>n.name==='Fémur izquierdo'):nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right');
  record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();});
  record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,node.id);});await wait(900);
  record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(id=>{const visible=window.__med3dAtlasScene().parts.filter(p=>p.visible);return visible.length&&visible.every(p=>p.id===id);},node.id);});await action('Ver conjunto');
  const level=systems.includes(',')?'systems':'structures';record.explodeMs=await measured(()=>explode(level,100));await explode(level,0);
  const target=requested.find(a=>node.assetIds.includes(a.id));await layers();record.module=target.id;
  record.unloadMs=await measured(async()=>{await assetInput(target).uncheck();await h.waitMeshes(initial.meshCount-target.meshCount);});
  record.reloadMs=await measured(async()=>{await assetInput(target).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
  record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[name]=record;console.log('MEASURE',name,JSON.stringify(record));
 }
}
async function captures(){
 await goto('nervous');
 for(const [view,file] of [['anterior','01-nervioso-anterior'],['posterior','02-nervioso-posterior'],['left','03-nervioso-lateral']]){await choose(nerve('nervous'));await h.view(view);await action('Deseleccionar');await shot(file);}
 for(const [id,file,view] of [['nervous:cns','04-snc','anterior'],['nervous:brain','05-encefalo','left'],['bp3d:FMA67944','06-cerebelo','posterior'],['nervous:brainstem','07-tronco','left'],['nervous:cranial','08-craneales','anterior']]){await choose(nerve(id));await action('Aislar');await h.view(view);await action('Deseleccionar');await shot(file);await page.getByRole('button',{name:'Mostrar todas las piezas',exact:true}).click();}
 await choose(optic);await h.view('anterior');await shot('09-optico-seleccionado');await action('Aislar');await shot('10-optico-aislado');await action('Ver conjunto');
 await choose(trochlear);await action('Aislar');await h.view('left');await shot('11-troclear-aislado');
 await goto('skeletal,nervous');await choose(nerve('nervous'));await opacity(25,'skeletal');await h.view('anterior');await action('Deseleccionar');await shot('12-nervioso-oseo');
 await choose(optic);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('left');await shot('13-contexto-optico');
 await goto('muscular,nervous');await choose(nerve('nervous'));await opacity(25,'muscular');await h.view('anterior');await action('Deseleccionar');await shot('14-nervioso-muscular');
 await goto();await choose(nerve('nervous'));await opacity(25,'muscular');await opacity(25,'skeletal');await action('Deseleccionar');await shot('15-tres-capas');
 await page.getByRole('button',{name:'Centrar modelo',exact:true}).click();await wait(1000);await shot('16-cuerpo-integrado');
 await explode('systems',100);await shot('17-despiece-sistemas');await explode('systems',0);
 await choose(nerve('nervous'));await explode('regions',40);await action('Enfocar');await wait(1000);await shot('18-despiece-regiones');await explode('regions',0);
 await goto('nervous');await choose(nerve('nervous'));await explode('structures',40);await action('Enfocar');await wait(1000);await action('Deseleccionar');await shot('19-despiece-estructuras');await explode('structures',0);
 await choose(optic);await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('óptico');await shot('20-busqueda');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('21-arbol');
 await choose(nerve('nervous'));await opacity(50);await action('Deseleccionar');await shot('22-transparencia-50');await opacity(25);await shot('23-transparencia-25');
 for(const [size,file] of [[{width:1366,height:768},'24-laptop'],[{width:820,height:1180},'25-tablet'],[{width:390,height:844},'26-movil']]){await page.setViewportSize(size);await opacity(100);await choose(nerve('nervous'));await h.view('anterior');await action('Deseleccionar');await closePanels();await shot(file);}
}
try{await withinQaDeadline(async()=>{await ({functional,captures,performance:performanceQa,entry}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Nervous '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'nervous-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
