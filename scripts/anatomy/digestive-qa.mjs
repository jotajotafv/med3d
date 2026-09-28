// Phase 7 digestive evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--review','--captures','--performance','--integration','--responsive'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase7','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
// Software WebGL can block screenshot/input acknowledgement beyond Playwright's
// normal 20 s default. Assertions are unchanged; this is not a physical-GPU claim.
h.context.setDefaultTimeout(120000);
page.setDefaultTimeout(120000);
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nervous=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/nervous/catalog.json'),'utf8'));
const cardio=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/cardiovascular/catalog.json'),'utf8'));
const resp=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/respiratory/catalog.json'),'utf8'));
const dig=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/digestive/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes,...nervous.nodes,...cardio.nodes,...resp.nodes,...dig.nodes],assets=[...h.catalog.assets,...muscular.assets,...nervous.assets,...cardio.assets,...resp.assets,...dig.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const newAssets=dig.assets;
// The neutral root is composed by the UI, so it is absent from source catalogs.
byId.set('body',{id:'body',name:'Cuerpo humano',children:['skeletal','muscular','nervous','cardiovascular','respiratory','digestive'],assetIds:assets.map(asset=>asset.id)});
const boneMeshes=h.expectedMeshes,muscleMeshes=muscular.coverage.meshes,totalMeshes=boneMeshes+muscleMeshes+nervous.coverage.meshes+cardio.coverage.meshes+resp.coverage.meshes+dig.coverage.meshes;
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
async function goto(systems='skeletal,muscular,nervous,cardiovascular,respiratory,digestive',moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId==='skeletal'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value,system='digestive'){await layers();await setSlider(page.locator('[data-system-id="'+system+'"] .atlas-layer-opacity input'),value);await page.waitForFunction(({value,system})=>{const parts=window.__med3dAtlasScene().parts.filter(p=>p.systemId===system);return parts.length&&parts.every(p=>Math.abs(p.opacity-value/100)<1e-8&&p.transparent===(value<100)&&p.depthWrite===(value===100)&&p.depthTest&&p.side===2);},{value,system});await wait(250);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false,timeout:120000});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
const chooseId=id=>choose(byId.get(id));
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL; no physical GPU or real mobile measurement.','Sequential loopback no-store loads, not independent cold starts.','Buffer bytes are CPU geometry arrays, not VRAM.','Interaction durations include automation and rendering.'];
 for(const [name,systems] of [['A-bone','skeletal'],['B-muscle','muscular'],['C-nervous','nervous'],['D-cardio','cardiovascular'],['E-respiratory','respiratory'],['F-digestive','digestive'],['G-digestive-cardio','digestive,cardiovascular'],['H-six-systems','skeletal,muscular,nervous,cardiovascular,respiratory,digestive']]){
  const requested=await goto(systems),initial=await h.metrics();const record={modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
  const node=systems.includes('digestive')?byId.get('dig:FMA7148'):systems.includes('respiratory')?byId.get('resp:FMA7394'):systems==='cardiovascular'?cardio.nodes.find(n=>n.family==='femoral-artery'&&n.side==='right'):systems==='nervous'?byId.get('zanatomy:femoral-nerve-r'):systems==='skeletal'?nodes.find(n=>n.name==='Fémur izquierdo'):nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right');
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
 await goto('digestive');assert.equal((await h.metrics()).meshCount,96);assert.equal((await h.metrics()).loadedAssets,4);
 for(const id of ['dig:FMA7131','dig:FMA7148','dig:FMA7197','dig:FMA7202','dig:FMA7198','dig:FMA7206','dig:small','dig:FMA7207','dig:FMA7208','dig:colon','dig:FMA14544','dig:FMA54640','dig:FMA59802']){
  const node=byId.get(id);await choose(node);await page.getByRole('region',{name:'Información digestiva de '+node.name,exact:true}).waitFor();await action('Aislar');
  const visible=(await parts()).filter(p=>p.visible);assert.ok(visible.length&&visible.every(p=>descendants(id).has(p.id)));
  for(const view of id==='dig:FMA7148'?['anterior','posterior','left','right','superior','inferior']:['anterior','posterior','left']){
   await h.view(view);const samples=(await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples);assert.ok(samples.length);assert.ok(samples.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Frustum '+id+' '+view);
  }
  await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 }
 check('Esophagus, stomach, liver, gallbladder, pancreas, duodenum, intestine, colon, rectum and oral structures: cards, focus, six views, isolation, hide/restore');
 for(const id of ['dig:FMA7131','dig:FMA7148','dig:FMA7202']){
  await chooseId(id);await action('Aislar');await h.view('anterior');await action('Deseleccionar');await closePanels();const box=await page.locator('.atlas-canvas canvas').boundingBox();let hit=false;
  for(const sample of (await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples)){
   const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;await page.mouse.move(x,y);await wait(120);
   if((await parts()).some(p=>p.id===id&&p.emissiveIntensity===.22)){await page.mouse.click(x,y);hit=true;break;}
  }
  assert.ok(hit,'Actual raycast '+id);await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,id);assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));await action('Ver conjunto');
 }
 check('Real hover, raycast and cyan selection on esophagus, stomach and gallbladder');
 await goto('digestive');const colors={tract:'b47d72',liver:'875952',biliary:'819274',gland:'bfaa82'};assert.ok((await parts()).every(p=>p.color===colors[byId.get(p.id).digestiveClass]));
 for(const value of [100,75,50,25,100])await opacity(value);
 check('Digestive palette and 100/75/50/25 opacity: DoubleSide, depthTest and depthWrite=false below 100');
 await chooseId('dig:FMA7197');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();
 const context=(await page.locator('.atlas-viewport').getAttribute('data-context-ids')).split(',');assert.deepEqual(new Set(context),new Set(['dig:FMA7197','dig:FMA7202','dig:biliary','bp3d:FMA14772','bp3d:FMA50735','bp3d:FMA14338','bp3d:FMA14340','bp3d:FMA14339']));
 const contextAssets=new Set([...dig.assets.map(a=>a.id),...context.flatMap(id=>byId.get(id).assetIds)]);await h.waitMeshes(sum(assets.filter(a=>contextAssets.has(a.id)),'meshCount'));assert.ok((await parts()).filter(p=>p.visible).every(p=>context.some(id=>descendants(id).has(p.id))));
 check('Liver context loads existing portal/hepatic vessels with gallbladder and bile ducts; no duplicated vasculature');
 await goto('digestive');await chooseId('digestive');await action('Aislar');assert.equal((await parts()).filter(p=>p.visible).length,96);await action('Ver conjunto');
 const rest=await atRest();const delta=p=>p.position.map((v,i)=>Number((v-p.restPosition[i]).toFixed(8)));
 for(const level of ['systems','regions','structures']){
  // A single active system has no systems offset, so use the other modes here.
  if(level==='systems')continue;
  await explode(level,100);
  for(const id of ['dig:FMA7207','dig:FMA7208'])assert.equal(new Set((await parts()).filter(p=>descendants(id).has(p.id)).map(p=>JSON.stringify(delta(p)))).size,1);
  await explode(level,0);assert.deepEqual(await atRest(),rest);
 }
 await layers();await systemInput('digestive').uncheck();await h.waitMeshes(0);await systemInput('digestive').check();await h.waitMeshes(96);
 const failed=dig.assets.find(a=>a.id==='digestive:small-intestine'),pattern='**/'+failed.path;let allow=false;await page.route(pattern,r=>allow?r.continue():r.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=digestive');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(96-failed.meshCount);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(96);await page.unroute(pattern);
 await layers();const initial=await h.metrics();for(const asset of dig.assets){await assetInput(asset).uncheck();await h.waitMeshes(96-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(96);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('Whole-system isolation, coherent intestinal explosion, exact zero, independent unload/reload, four modules and failed-module recovery');
 for(const [query,id] of [['esofago','dig:FMA7131'],['FJ2564','dig:FMA7148'],['Hepar','dig:FMA7197'],['dig:FMA7198','dig:FMA7198']]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').waitFor();}
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);await page.keyboard.press('Home');
 await responsive(false);
 check('Global source/Latin/ID search; virtualized expanded ARIA tree and keyboard; laptop/tablet/mobile without overflow');
}
async function responsive(navigate=true){
 if(navigate)await goto('digestive');
 for(const size of [{width:1366,height:768},{width:820,height:1180},{width:390,height:844}]){await page.setViewportSize(size);await chooseId('digestive');await closePanels();assert.ok(await page.locator('.atlas-canvas canvas').isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));check('Responsive viewport',size);}
}
async function integration(){
 await goto();assert.equal((await h.metrics()).meshCount,898);
 for(const [system,value] of [['skeletal',25],['muscular',15],['nervous',50],['cardiovascular',75],['respiratory',25],['digestive',50]])await opacity(value,system);
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,70);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 await layers();await systemInput('digestive').uncheck();await h.waitMeshes(totalMeshes-96);await systemInput('digestive').check();await h.waitMeshes(totalMeshes);
 for(const [query,id] of [['Fémur izquierdo',nodes.find(n=>n.name==='Fémur izquierdo').id],['esternocleidomastoideo',nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right').id],['FMA50735','bp3d:FMA50735'],['FJ2541','resp:FMA7394'],['Hepar','dig:FMA7197'],['nervio femoral derecho','zanatomy:femoral-nerve-r']]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').waitFor();}
 for(const query of ['corazón','pulmon','encéfalo']){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);assert.ok(await page.locator('.atlas-global-results a.atlas-search-result').count()>0,'Independent organ search '+query);}
 check('Six systems, independent opacity, exact rest in all explosion modes, digestive unload/reload, six-system and independent-organ search');
}
async function review(){
 await goto('digestive');await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('preview-digestive');
 await goto('skeletal,cardiovascular,respiratory,digestive');await opacity(25,'skeletal');await opacity(20,'respiratory');await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('preview-registration');
 await goto('digestive');await chooseId('dig:FMA7197');await action('Aislar');await h.view('posterior');await action('Deseleccionar');await shot('preview-liver');
}
async function captures(){
 await goto('digestive');
 for(const [view,name] of [['anterior','01-digestivo-anterior'],['posterior','02-digestivo-posterior'],['left','03-digestivo-lateral']]){await chooseId('digestive');await h.view(view);await action('Deseleccionar');await shot(name);}
 for(const [id,name,view] of [['dig:FMA7131','04-esofago','left'],['dig:FMA7148','05-estomago','anterior'],['dig:FMA7197','06-higado','anterior'],['dig:FMA7202','07-vesicula','anterior'],['dig:FMA7198','08-pancreas','anterior'],['dig:FMA7206','09-duodeno','anterior'],['dig:small','10-intestino-delgado','anterior'],['dig:large','11-intestino-grueso','anterior'],['dig:FMA14544','12-recto','left']]){
  await chooseId(id);await action('Aislar');await h.view(view);await action('Deseleccionar');await shot(name);await page.getByRole('button',{name:'Mostrar todas las piezas',exact:true}).click();
 }
 await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await layers();await shot('13-solo-digestivo');
 await goto('skeletal,digestive');await opacity(25,'skeletal');await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('14-digestivo-oseo');
 await goto('cardiovascular,digestive');await opacity(50);await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('15-digestivo-cardiovascular');
 await goto('respiratory,digestive');await opacity(25,'respiratory');await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('16-digestivo-respiratorio');
 await goto();await opacity(25,'skeletal');await opacity(10,'muscular');await opacity(40,'nervous');await opacity(25,'respiratory');await opacity(75);await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await shot('17-seis-sistemas');
 await goto('digestive');await chooseId('dig:FMA7148');await h.view('anterior');await shot('18-estomago-seleccionado');await action('Aislar');await shot('19-estomago-aislado');
 await chooseId('dig:FMA7197');await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(1800);await opacity(25);await h.view('anterior');await shot('20-contexto-hepatico');
 await goto();await chooseId('body');await explode('systems',100);await action('Enfocar');await action('Deseleccionar');await shot('21-exploded-sistemas');
 await goto('digestive');await chooseId('digestive');await explode('regions',100);await action('Enfocar');await action('Deseleccionar');await shot('22-exploded-regiones');await explode('regions',0);
 await explode('structures',100);await action('Enfocar');await action('Deseleccionar');await shot('23-exploded-estructuras');await explode('structures',0);
 await chooseId('dig:FMA7148');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('estomago');await shot('24-busqueda-global');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('25-arbol-global');
 for(const [size,name] of [[{width:1366,height:768},'26-laptop'],[{width:820,height:1180},'27-tablet'],[{width:390,height:844},'28-movil']]){await page.setViewportSize(size);await chooseId('digestive');await h.view('anterior');await action('Deseleccionar');await closePanels();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);}
 await page.setViewportSize({width:1440,height:900});await goto('digestive');await chooseId('dig:oral');await action('Aislar');await h.view('anterior');await action('Deseleccionar');await shot('29-region-oral','Lengua y cuatro glándulas; faringe y parótidas pendientes.');
 await goto('digestive');await opacity(25);await chooseId('dig:biliary');await action('Aislar');await opacity(100);await h.view('anterior');await action('Deseleccionar');await shot('30-vias-biliares','Conductos originales; no se fabrica un colédoco ni continuidad ausente.');
}
try{await withinQaDeadline(async()=>{await ({regional,review,captures,performance:performanceQa,integration,responsive}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Digestive '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'digestive-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
