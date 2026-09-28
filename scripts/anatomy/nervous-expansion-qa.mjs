// Phase 4 evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--review','--captures','--performance'].includes(arg))?.slice(2)||'regional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache','phase4-expansion','browser',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
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

const nerve=id=>byId.get(id),median=nerve('zanatomy:median-nerve-r'),femoral=nerve('zanatomy:femoral-nerve-r');
async function regional(){
 await goto('nervous');assert.equal((await h.metrics()).meshCount,125);assert.equal((await h.metrics()).loadedAssets,6);
 const added=nervous.nodes.filter(n=>n.id.startsWith('zanatomy:'));
 for(const node of added)for(const query of [node.name,node.latin,node.sourceId,node.id]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();}
 check('All 38 added objects found by Spanish, Latin, source object and stable ID');
 for(const id of ['nervous:brachial-right','nervous:brachial-left','zanatomy:median-nerve-r','zanatomy:ulnar-nerve-l','nervous:lumbar-right','nervous:sacral-left','zanatomy:femoral-nerve-r','zanatomy:tibial-nerve-r','zanatomy:common-fibular-nerve-l','zanatomy:deep-fibular-nerve-r','zanatomy:dorsal-digital-branches-of-radial-nerve-r']){
  const node=nerve(id);await choose(node);await action('Aislar');
  assert.ok((await parts()).filter(p=>p.visible).every(p=>descendants(id).has(p.id)));
  for(const view of ['anterior','posterior','left']){await h.view(view);const samples=(await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples||[]);assert.ok(samples.length);assert.ok(samples.every(p=>p.every(Number.isFinite)&&Math.abs(p[0])<1.01&&Math.abs(p[1])<1.01&&p[2]>-1&&p[2]<1),'Visible sampled geometry inside frustum '+id+' '+view);}
  await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');await action('Ver conjunto');
 }
 check('Both partial plexuses, long nerves, pelvis/leg/hand: cameras, isolation and hide/restore');
 await choose(median);await action('Aislar');await h.view('anterior');await action('Deseleccionar');await closePanels();
 const canvas=page.locator('.atlas-canvas canvas'),box=await canvas.boundingBox();let hit=false;
 for(const sample of (await parts()).filter(p=>p.visible).flatMap(p=>p.screenSamples||[])){
  const x=box.x+(sample[0]+1)*box.width/2,y=box.y+(1-sample[1])*box.height/2;
  await page.mouse.move(x,y);await wait(120);
  if((await parts()).some(p=>p.id===median.id&&p.emissiveIntensity===.22)){await page.mouse.click(x,y);hit=true;break;}
 }
 assert.ok(hit,'Real pointer raycast on a thin registered nerve');await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,median.id);
 assert.ok((await parts()).filter(p=>p.visible).every(p=>p.color==='36bcb1'));
 check('Thin nerve real hover/raycast/cyan selection; no enlarged picking geometry');
 await goto();await choose(median);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(600);
 const context=(await parts()).filter(p=>p.visible);assert.ok(context.some(p=>p.id==='bp3d:FMA38460'));assert.ok(context.some(p=>p.systemId==='skeletal'));assert.ok(context.every(p=>p.id===median.id||['bp3d:FMA23130','bp3d:FMA23464','bp3d:FMA23467','bp3d:FMA38460'].includes(p.id)));
 await reset();await opacity(25,'skeletal');await opacity(10,'muscular');await opacity(100);await opacity(50);await opacity(25);await opacity(100);
 const before=await atRest();for(const level of ['systems','regions','structures']){await explode(level,50);await explode(level,0);assert.deepEqual(await atRest(),before);}
 check('Curated nerve–muscle–bone context; independent 100/50/25/10 opacity; exact restoration');
 const failed=nervous.assets.find(a=>a.id==='nervous:upper-right'),pattern='**/'+failed.path;let allow=false;await page.route(pattern,r=>allow?r.continue():r.abort('failed'));
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=nervous');await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(125-failed.meshCount);allow=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(125);await page.unroute(pattern);
 await layers();const initial=await h.metrics();for(const asset of nervous.assets.filter(a=>a.provenanceId.startsWith('z-'))){await assetInput(asset).uncheck();await h.waitMeshes(125-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(125);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('Every expansion module unloads/reloads without retained buffers; failed module recovers');
 await choose(femoral);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.focus();await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor();assert.ok(await tree.getByRole('treeitem').count()<100);
 check('Expanded hierarchy retains virtualized ARIA tree and keyboard navigation');
}
const measured=async fn=>{const start=performance.now();await fn();return performance.now()-start;};
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});report.environment.limitations=['SwiftShader software WebGL; no physical GPU or real mobile measurement.','Sequential loopback no-store loads, not independent cold starts.','Buffer bytes are CPU geometry arrays, not VRAM.','Interaction durations include automation and rendering.'];
 for(const [name,systems] of [['A-bone','skeletal'],['B-muscle','muscular'],['C-expanded-nervous','nervous'],['D-bone-nervous','skeletal,nervous'],['E-muscle-nervous','muscular,nervous'],['F-all','skeletal,muscular,nervous']]){
  const requested=await goto(systems),initial=await h.metrics();const record={modules:requested.length,glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,buffers:initial.geometryBytes,firstGeometryMs:initial.firstGeometryMs,fullSystemMs:initial.fullSystemMs};
  const node=systems.includes('nervous')?femoral:systems==='skeletal'?nodes.find(n=>n.name==='Fémur izquierdo'):nodes.find(n=>n.family==='sternocleidomastoid'&&n.side==='right');
  record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();});
  record.selectMs=await measured(async()=>{await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').click();await page.waitForFunction(id=>document.querySelector('.atlas-viewport')?.dataset.selectedId===id,node.id);});await wait(900);
  record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(id=>{const visible=window.__med3dAtlasScene().parts.filter(p=>p.visible);return visible.length&&visible.every(p=>p.id===id);},node.id);});await action('Ver conjunto');
  const level=systems.includes(',')?'systems':'structures';record.explodeMs=await measured(()=>explode(level,100));await explode(level,0);
  const target=requested.find(a=>node.assetIds.includes(a.id));await layers();record.module=target.id;
  record.unloadMs=await measured(async()=>{await assetInput(target).uncheck();await h.waitMeshes(initial.meshCount-target.meshCount);});record.reloadMs=await measured(async()=>{await assetInput(target).check();await h.waitMeshes(initial.meshCount);});assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
  record.renderer=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER);});report.measurements[name]=record;console.log('MEASURE',name,JSON.stringify(record));
 }
}
async function captures(){
 await goto('nervous');
 for(const [view,name] of [['anterior','01-nervioso-expandido-anterior'],['posterior','02-nervioso-expandido-posterior'],['left','03-nervioso-expandido-lateral']]){await choose(nerve('nervous'));await h.view(view);await action('Deseleccionar');await shot(name,'Cobertura distribuida parcial; sin médula, raíces espinales ni ciático.');}
 for(const [id,name,view] of [['nervous:brachial-right','04-plexo-braquial-derecho-parcial','anterior'],['nervous:brachial-left','05-plexo-braquial-izquierdo-parcial','anterior'],['zanatomy:median-nerve-r','06-mediano','anterior'],['zanatomy:ulnar-nerve-r','07-cubital','anterior'],['zanatomy:axillary-nerve-r','08-axilar','posterior'],['zanatomy:musculocutaneous-nerve-r','09-musculocutaneo','anterior'],['nervous:lumbar-right','10-plexo-lumbar-ramas','anterior'],['nervous:sacral-right','11-plexo-sacro-ramas','posterior'],['zanatomy:femoral-nerve-r','12-femoral','anterior'],['zanatomy:tibial-nerve-r','13-tibial','posterior'],['zanatomy:common-fibular-nerve-r','14-fibular-comun','right'],['zanatomy:deep-fibular-nerve-r','15-fibular-profundo','anterior']]){
  await choose(nerve(id));await action('Aislar');await h.view(view);await shot(name);await action('Ver conjunto');
 }
 await goto('skeletal,nervous');await choose(nerve('nervous'));await opacity(25,'skeletal');await h.view('anterior');await action('Deseleccionar');await shot('16-nervioso-oseo');
 await goto('muscular,nervous');await choose(nerve('nervous'));await opacity(10,'muscular');await h.view('anterior');await action('Deseleccionar');await shot('17-nervioso-muscular');
 await goto();await choose(nerve('nervous'));await opacity(25,'skeletal');await opacity(10,'muscular');await action('Deseleccionar');await shot('18-tres-sistemas');
 await choose(median);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('19-contexto-mediano-musculo-hueso');
 await reset();await choose(nerve('nervous'));await opacity(25,'skeletal');await opacity(10,'muscular');await explode('systems',100);await action('Enfocar');await shot('20-exploded-sistemas');await explode('systems',0);
 await explode('regions',45);await action('Enfocar');await shot('21-exploded-regiones');await explode('regions',0);
 await goto('nervous');await choose(median);await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('femoral');await shot('22-busqueda-global');await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('23-arbol-ampliado');
 for(const [size,name] of [[{width:1366,height:768},'24-laptop'],[{width:820,height:1180},'25-tablet'],[{width:390,height:844},'26-movil']]){await page.setViewportSize(size);await choose(nerve('nervous'));await h.view('anterior');await action('Deseleccionar');await closePanels();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot(name);}
}
async function review(){
 await goto('nervous');await choose(nerve('nervous'));await h.view('anterior');await action('Deseleccionar');await shot('preview-overview');
 await goto();await choose(median);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('preview-median-context');
 await reset();await choose(femoral);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await h.view('anterior');await shot('preview-femoral-context');
}
try{await withinQaDeadline(async()=>{await ({regional,review,captures,performance:performanceQa}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Nervous expansion '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'nervous-expansion-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
