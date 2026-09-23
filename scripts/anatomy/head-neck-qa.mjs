// Fase 3DE evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--regional','--functional','--captures','--performance','--search'].includes(arg))?.slice(2)||'functional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.qa-anatomy','neck',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes],assets=[...h.catalog.assets,...muscular.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const neckAssets=muscular.assets.filter(asset=>asset.provenanceId==='bodyparts3d-4.0-muscular-head-neck');
const neckAssetIds=new Set(neckAssets.map(asset=>asset.id));
const neckNodes=muscular.nodes.filter(node=>node.assetIds.some(id=>neckAssetIds.has(id)));
const wholeNeck=neckNodes.filter(node=>node.kind==='structure');
const boneMeshes=h.expectedMeshes,muscleMeshes=muscular.coverage.meshes,totalMeshes=boneMeshes+muscleMeshes;
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
function muscle(family,side='right') {const matches=wholeNeck.filter(node=>node.family===family&&node.side===side);assert.equal(matches.length,1,`One approved ${family} ${side}`);return matches[0];}
function descendants(id) {const ids=new Set([id]);for(const child of byId.get(id)?.children||[])for(const value of descendants(child))ids.add(value);return ids;}
async function structures(){if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();}
async function clearSearch(){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');}
async function layers(){await clearSearch();await page.getByRole('button',{name:'Capas',exact:true}).click();}
async function choose(node){assert.ok(node,'Catalog target exists');await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator(`.atlas-search-result[data-node-id="${node.id}"]`).click();await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,node.name);await wait(850);}
async function closePanels(){for(const name of ['Cerrar estructuras','Cerrar inspección']){const button=page.getByRole('button',{name,exact:true});if(await button.isVisible())await button.click();}}
async function action(name,settle=400){const button=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await button.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await button.click();if(settle)await wait(settle);}
async function goto(systems='skeletal,muscular',moduleIds){const expected=assets.filter(asset=>systems.split(',').includes(asset.systemId)&&(asset.systemId!=='muscular'||!moduleIds||moduleIds.includes(asset.id)));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems+(moduleIds?'&modules='+moduleIds.join(','):''),{waitUntil:'domcontentloaded'});activeTotalMeshes=sum(expected,'meshCount');await h.waitMeshes(activeTotalMeshes);await wait(700);return expected;}
async function reset(){await page.getByRole('button',{name:'Restablecer atlas'}).click();await h.waitMeshes(activeTotalMeshes);await wait(1100);}
async function opacity(value){await layers();await setSlider(page.locator('[data-system-id="muscular"] .atlas-layer-opacity input'),value);await page.waitForFunction(value=>{const muscles=window.__med3dAtlasScene().parts.filter(part=>part.systemId==='muscular');return muscles.length>0&&muscles.every(part=>Math.abs(part.opacity-value/100)<1e-8&&part.transparent===(value<100)&&part.depthWrite===(value===100));},value);await wait(350);}
async function explode(level,value){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForFunction(value=>{const parts=window.__med3dAtlasScene().parts;return parts.length&&parts.every(part=>part.position.every((position,i)=>position===part.targetPosition[i]))&&(value===0?parts.every(part=>part.position.every((position,i)=>position===part.restPosition[i])):parts.some(part=>part.position.some((position,i)=>position!==part.restPosition[i])));},value,{timeout:120000});}
async function atRest(){const values=await parts();for(const part of values)assert.deepEqual(part.position,part.restPosition,'Exact rest position '+part.id);return positions(values);}
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),scene:await snapshot()});console.log('CAPTURE',name);}
async function context(node){await choose(node);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(700);const visible=(await parts()).filter(part=>part.visible),own=descendants(node.id);assert.ok(visible.some(part=>part.systemId==='skeletal'));assert.ok(visible.some(part=>part.systemId==='muscular'));assert.ok(visible.filter(part=>part.systemId==='muscular').every(part=>own.has(part.id)));assert.ok(visible.length<totalMeshes);return visible.map(part=>part.id);}


async function regional(){
 await goto('skeletal,muscular',['muscular:neck']);const initial=await h.metrics();
 assert.equal(wholeNeck.length,20);assert.equal(neckAssets.length,1);assert.equal(initial.meshCount,boneMeshes+20);
 check('Registered cervical cohort loads with the unchanged skeletal frame',{meshes:initial.meshCount,newTriangles:neckAssets[0].triangles});
 for(const node of wholeNeck){
  await choose(node);
  const card=page.getByRole('region',{name:'Información muscular de '+node.name,exact:true});
  for(const heading of ['Origen','Inserción','Inervación'])assert.ok(await card.getByRole('heading',{name:heading,exact:true}).count());
  assert.ok(await card.locator('a[href^="https://"]').count());
 }
 check('All twenty cervical muscles select and expose scoped sourced cards');
 const scm=muscle('sternocleidomastoid'),platysma=muscle('platysma'),deep=muscle('longuscapitis');
 for(const node of [scm,platysma,deep,muscle('mylohyoid'),muscle('scalenusposterior','left')]){
  const visible=await context(node);assert.ok(visible.includes(node.id));
  if(node.family==='platysma')assert.deepEqual(new Set(visible),new Set([node.id,'bp3d:FMA52748']));
  await reset();
 }
 check('Five explicit cervical contexts, including soft-tissue platysma without bone surrogates');
 await choose(scm);await action('Aislar');assert.deepEqual((await parts()).filter(p=>p.visible).map(p=>p.id),[scm.id]);
 await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');
 assert.deepEqual((await parts()).filter(p=>p.visible).map(p=>p.id),[scm.id]);await action('Ver conjunto');
 check('Cervical isolation, hide, show and return preserve ownership');
 for(const node of [scm,deep]){await choose(node);const visible=(await parts()).filter(p=>p.visible).map(p=>p.id);
  for(const view of ['anterior','posterior','left','right','superior','inferior']){await h.view(view);assert.deepEqual((await parts()).filter(p=>p.visible).map(p=>p.id),visible);}
 }
 check('Six cervical orientations retain deep structures without automatic occlusion removal');
 for(const value of [100,50,25]){await opacity(value);const state=await parts();assert.ok(state.filter(p=>p.systemId==='muscular').every(p=>p.opacity===value/100&&p.transparent===(value<100)&&p.depthWrite===(value===100)));assert.ok(state.filter(p=>p.systemId==='skeletal').every(p=>p.opacity===1));}
 check('Cervical opacity 100/50/25 with opaque bone and existing depth rules');await reset();
 const rest=await atRest();
 for(const level of ['systems','regions','structures']){await explode(level,100);const first=positions(await parts());assert.notDeepEqual(first,rest);
  if(level==='regions'){
   const ids=new Set([...wholeNeck.map(n=>n.id),...h.catalog.nodes.filter(n=>n.regionId==='skeletal:region:skull'||n.family==='cervicalvertebrae').map(n=>n.id)]);
   const group=(await parts()).filter(p=>ids.has(p.id)).map(p=>p.position.map((v,i)=>v-p.restPosition[i]));
   for(const offset of group)for(let axis=0;axis<3;axis++)assert.ok(Math.abs(offset[axis]-group[0][axis])<1e-12);
  }
  await explode(level,0);assert.deepEqual(await atRest(),rest);
 }
 check('All explosion modes preserve coherent head-neck block and exact restoration');
 const asset=neckAssets[0];await layers();
 for(let cycle=0;cycle<3;cycle++){await assetInput(asset).uncheck();await h.waitMeshes(boneMeshes);await assetInput(asset).check();await h.waitMeshes(boneMeshes+20);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('Cervical module releases and reloads without buffer growth');
 const pattern='**/'+asset.path;let allowed=false,attempts=0;
 await page.route(pattern,route=>{attempts++;return allowed?route.continue():route.abort('failed');});
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal,muscular&modules=muscular:neck',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(boneMeshes);assert.equal(attempts,1);
 allowed=true;await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(boneMeshes+20);assert.equal(attempts,2);await page.unroute(pattern);
 check('Regional network failure retains bone until explicit recovery',{attempts});
 for(const direction of ['anterior','right','posterior']){await choose(byId.get('muscular:region:neck'));await h.view(direction);await action('Deseleccionar');await shot('regional-'+direction,'New cervical coverage; facial/masticatory candidates not identified in BP3D 4.0 tables.');}
}
async function functional(){
 await goto();assert.equal((await h.metrics()).meshCount,339);assert.equal((await h.metrics()).loadedAssets,21);
 check('Final available body: 313 structures, 339 meshes and 21 modules',await h.metrics());
 const initial=await h.metrics(),scm=muscle('sternocleidomastoid');
 for(const query of [scm.name,scm.latin,scm.sourceId,'FJ1595','ECM','Cutáneo del cuello']){
  await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);
  assert.ok(await page.locator('.atlas-search-result[data-node-id]').count());const text=await page.locator('.atlas-search-result').first().innerText();assert.match(text,/Músculo/);assert.match(text,/Sistema muscular/);assert.match(text,/Cuello/);
 }
 check('New Spanish, Latin, alias, FMA and FJ searches retain type/system/region');
 await choose(scm);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();
 const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.getByRole('treeitem',{selected:true}).waitFor({state:'visible'});assert.ok(await tree.getByRole('treeitem').count()<nodes.length/2);
 await tree.focus();await page.keyboard.press('Home');assert.equal(await selectedName(),'Cuerpo humano');await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor({state:'visible'});
 check('Final virtual tree, expanded ancestors and Home/End selection');
 for(const name of ['Corazón','Pulmones','Encéfalo']){
  await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(name);
  const result=page.locator('.atlas-global-results a.atlas-search-result').filter({hasText:name});await result.first().waitFor();assert.ok(await result.count(),'External organ search '+name);
 }
 check('Global search retains heart, lungs and brain links');
 await reset();await layers();await systemInput('skeletal').uncheck();await h.waitMeshes(134);await systemInput('skeletal').check();await systemInput('muscular').uncheck();await h.waitMeshes(205);await systemInput('muscular').check();await h.waitMeshes(339);
 check('Two independent body systems retain all available regional modules');
 for(const value of [100,50,25])await opacity(value);await reset();check('Final muscle opacity independent of bone');
 for(const node of [scm,muscle('platysma'),muscle('longuscapitis')]){await context(node);await reset();}
 check('New contexts remain scoped in the fully integrated body');
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,100);assert.notDeepEqual(positions(await parts()),rest);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 check('Global three-mode explosion returns exactly to source rest');
 await layers();const asset=neckAssets[0];await assetInput(asset).uncheck();await h.waitMeshes(319);await assetInput(asset).check();await h.waitMeshes(339);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);
 check('New module unload/reload preserves all 319 historical meshes');
 for(const [width,height] of [[1366,768],[1050,844],[900,1000],[390,844]]){
  await page.setViewportSize({width,height});await wait(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await layers();assert.ok(await assetInput(asset).isVisible());await closePanels();
  await choose(scm);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await tree.getByRole('treeitem',{selected:true}).waitFor({state:'visible'});await closePanels();
  if(width===390){await page.getByRole('button',{name:'Inspección',exact:true}).click();assert.ok(await page.getByRole('region',{name:'Información muscular de '+scm.name,exact:true}).isVisible());await closePanels();}
  check('Final responsive tree, layers, search, card and viewport '+width);
 }
}
async function searchTypes(){
 await goto('skeletal,muscular',['muscular:neck']);
 const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});
 for(const [query,id,expected] of [
  ['Corazón','VH_M_heart','Órgano'],['Encéfalo','Allen_brain','Órgano'],
  ['Pulmón izquierdo','VH_M_lungs_L','Órgano'],['Pulmones','VH_M_lungs','Grupo de órganos'],
  ['Ventrículo derecho','VH_M_heart_right_ventricle','Componente'],
 ]){
  await input.fill(query);const result=page.locator('.atlas-global-results a.atlas-search-result').filter({has:page.locator('span').filter({hasText:new RegExp('^'+query+'$')})});
  await result.first().waitFor();assert.equal(await result.count(),1);assert.match(await result.getAttribute('href'),new RegExp('structure='+id+'$'));
  assert.equal((await result.locator('small').innerText()).split(' · ')[0],expected);check('Precise legacy search kind '+query,{expected});
 }
 const component=muscular.nodes.find(n=>n.kind==='component'&&n.meshNames.length);
 for(const [node,expected] of [[h.catalog.nodes.find(n=>n.name==='Frontal'),'Hueso'],[muscle('sternocleidomastoid'),'Músculo'],[component,'Componente'],[byId.get('muscular:region:neck'),'Región']]){
  await input.fill(node.name);const result=page.locator('.atlas-search-result[data-node-id="'+node.id+'"]');await result.waitFor();
  assert.equal((await result.locator('small').last().innerText()).split(' · ')[0],expected);check('Precise body search kind '+node.name,{expected});
 }
}
async function captures(){
 await goto();const neck=byId.get('muscular:region:neck'),head=byId.get('skeletal:region:skull');
 for(const [direction,file] of [['anterior','01-cabeza-anterior'],['right','02-cabeza-lateral'],['posterior','03-cabeza-posterior']]){
  await reset();await choose(head);await h.view(direction);await action('Deseleccionar');await shot(file,'Cranial bone context. Facial/masticatory coverage absent from the audited tables; no empty muscular head region.');
 }
 for(const [direction,file] of [['anterior','04-cuello-anterior'],['right','05-cuello-lateral'],['posterior','06-cuello-posterior']]){
  await reset();await choose(neck);await h.view(direction);await action('Deseleccionar');await shot(file);
 }
 await reset();await choose(muscle('platysma'));await h.view('anterior');await shot('07-platisma-seleccionado','Cervical muscle participating in facial expression; not a substitute for absent facial muscles.');await action('Aislar');await shot('08-platisma-aislado');
 await reset();await choose(muscle('sternocleidomastoid'));await h.view('right');await shot('09-cervical-seleccionado');await action('Aislar');await shot('10-cervical-aislado');
 for(const [direction,file] of [['anterior','11-muscular-anterior'],['posterior','12-muscular-posterior'],['right','13-muscular-lateral']]){
  await goto('muscular');await h.view(direction);await shot(file,'Integrated available coverage; not a complete human muscular system.');
 }
 await goto();await shot('14-oseo-muscular');await goto('muscular');await shot('15-solo-muscular');
 await goto();await choose(neck);await h.view('anterior');await action('Deseleccionar');await opacity(50);await shot('16-cuello-transparencia-50');
 for(const [level,file] of [['systems','17-exploded-sistemas'],['regions','18-exploded-regiones'],['structures','19-exploded-estructuras']]){
  await goto();if(level==='structures')await choose(neck);await h.view('anterior');await explode(level,100);await shot(file,'Bounded educational displacement; zero restores rest.');await explode(level,0);
 }
 await goto();await context(muscle('sternocleidomastoid'));await h.view('right');await shot('20-contexto-cervical');
 await goto();await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('Corazón');await shot('21-busqueda-global');
 await choose(neck);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();await page.getByRole('tree',{name:'Árbol anatómico'}).getByRole('treeitem',{selected:true}).waitFor({state:'visible'});await shot('22-arbol-global');
 for(const [width,height,file] of [[1366,768,'23-laptop'],[900,1000,'24-tablet'],[390,844,'25-movil']]){
  await page.setViewportSize({width,height});await goto();await closePanels();await shot(file,'Responsive desktop viewport, not a physical device benchmark.');
 }
 await choose(muscle('sternocleidomastoid'));await closePanels();await page.getByRole('button',{name:'Inspección',exact:true}).click();await shot('26-movil-ficha');await closePanels();await layers();await assetInput(neckAssets[0]).scrollIntoViewIfNeeded();await shot('27-movil-capas');
 await page.setViewportSize({width:1440,height:900});await goto();await choose(neck);await h.view('anterior');await action('Deseleccionar');await opacity(25);await shot('28-cuello-transparencia-25');
 await goto();await choose(muscle('longuscapitis'));await action('Aislar');await h.view('anterior');await shot('29-prevertebral-aislado');
 report.humanReview='Each final PNG requires individual inspection; no clinical certification.';
}
const measured=async action=>{const start=performance.now();await action();return performance.now()-start;};
async function performanceQa(){
 await page.setViewportSize({width:1366,height:768});
 report.environment.limitations=['ANGLE SwiftShader software WebGL; no physical GPU/mobile performance claim.','Sequential loopback no-store runs; not independent cold starts.','Geometry arrays are CPU buffers, not total VRAM.','Interaction timings include automation; no FPS claim.'];
 const configurations=[['A-skeletal','skeletal'],['B-muscular','muscular'],['C-combined','skeletal,muscular'],['D-neck','muscular',['muscular:neck']]];
 for(const [name,systems,modules] of configurations){
  const requested=await goto(systems,modules);await page.waitForFunction(()=>Number(document.querySelector('.atlas-viewport')?.dataset.fullSystemMs)>0);
  const initial=await h.metrics();assert.equal(initial.meshCount,sum(requested,'meshCount'));assert.equal(initial.triangleCount,sum(requested,'triangles'));
  const record={modules:requested.map(a=>a.id),glbBytes:sum(requested,'bytes'),meshes:initial.meshCount,triangles:initial.triangleCount,geometryBuffersBytes:initial.geometryBytes,drawCalls:initial.drawCalls,firstGeometryMs:initial.firstGeometryMs,fullReadyMs:initial.fullSystemMs};
  const node=name==='A-skeletal'?h.catalog.nodes.find(n=>n.name==='Fémur izquierdo'):muscle('sternocleidomastoid');
  record.searchMs=await measured(async()=>{await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.name);await page.locator('.atlas-search-result[data-node-id="'+node.id+'"]').waitFor();});
  await choose(node);record.isolateMs=await measured(async()=>{await action('Aislar',0);await page.waitForFunction(id=>{const visible=window.__med3dAtlasScene().parts.filter(p=>p.visible);return visible.length===1&&visible[0].id===id;},node.id);});await action('Ver conjunto');
  const level=name==='C-combined'?'systems':'structures';record.explosionFirstResponseMs=await measured(async()=>{await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),100);await page.waitForFunction(()=>window.__med3dAtlasScene().parts.some(p=>p.position.some((v,i)=>v!==p.restPosition[i])));});await explode(level,0);
  const target=requested.find(a=>a.id===(name==='A-skeletal'?'skeletal:leg-left':'muscular:neck'));await layers();record.region=target.id;
  record.regionUnloadMs=await measured(async()=>{await assetInput(target).uncheck();await h.waitMeshes(initial.meshCount-target.meshCount);});record.afterRegionUnload=await h.metrics();
  record.regionReloadMs=await measured(async()=>{await assetInput(target).check();await h.waitMeshes(initial.meshCount);});record.afterRegionReload=await h.metrics();assert.equal(record.afterRegionReload.geometryBytes,initial.geometryBytes);
  const system=name==='A-skeletal'?'skeletal':'muscular',retained=name==='C-combined'?boneMeshes:0;
  record.systemUnloadMs=await measured(async()=>{await systemInput(system).uncheck();await h.waitMeshes(retained);});record.afterSystemUnload=await h.metrics();
  if(!retained)assert.equal(record.afterSystemUnload.geometryBytes,0);
  record.systemReloadMs=await measured(async()=>{await systemInput(system).check();await h.waitMeshes(initial.meshCount);});record.afterSystemReload=await h.metrics();assert.equal(record.afterSystemReload.geometryBytes,initial.geometryBytes);
  record.detectedWebGL=await page.locator('.atlas-canvas canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:gl.getParameter(ext?ext.UNMASKED_RENDERER_WEBGL:gl.RENDERER)};});
  report.measurements[name]=record;console.log('MEASURE',name,JSON.stringify(record));
 }
}
const suiteTimeoutMs=Number(process.env.QA_SUITE_TIMEOUT_MS||1200000);
assert.ok(Number.isFinite(suiteTimeoutMs)&&suiteTimeoutMs>0);
try{await withinQaDeadline(async()=>{await ({regional,functional,captures,performance:performanceQa,search:searchTypes}[mode])();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},suiteTimeoutMs,'Fase 3DE '+mode);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'head-neck-'+mode+'.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
