// Fase 3F evidence from the production build and actual WebGL objects.
// Geometry, visibility and opacity are inspected through the read-only ?qa=1 bridge.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness, project, setSlider, withinQaDeadline} from './browser-qa.mjs';

const mode=process.argv.find(arg=>['--functional','--captures'].includes(arg))?.slice(2)||'functional';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.qa-anatomy','gaps',mode),viewport:{width:1440,height:900},reducedMotion:mode==='captures'?'reduce':'no-preference'});
const {page,output}=h;
const muscular=JSON.parse(await readFile(path.join(project,process.env.QA_SERVE_DIR||'dist','models/anatomy/muscular/catalog.json'),'utf8'));
const nodes=[...h.catalog.nodes,...muscular.nodes],assets=[...h.catalog.assets,...muscular.assets],byId=new Map(nodes.map(node=>[node.id,node]));
const newAssets=muscular.assets.filter(asset=>asset.provenanceId==='bodyparts3d-4.0-muscular-gaps');
const newAssetIds=new Set(newAssets.map(asset=>asset.id));
const newNodes=muscular.nodes.filter(node=>node.assetIds.some(id=>newAssetIds.has(id)));
const newWhole=newNodes.filter(node=>node.kind==='structure');
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
function muscle(family,side='right') {const matches=newWhole.filter(node=>node.family===family&&node.side===side);assert.equal(matches.length,1,`One approved ${family} ${side}`);return matches[0];}
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
async function shot(name,note=''){await page.mouse.move(10,10);await wait(200);await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await selectedName(),note,metrics:await h.metrics(),visibleIds:(await parts()).filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
async function context(node){await choose(node);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await wait(700);const visible=(await parts()).filter(part=>part.visible),own=descendants(node.id);assert.ok(visible.some(part=>part.systemId==='skeletal'));assert.ok(visible.some(part=>part.systemId==='muscular'));assert.ok(visible.filter(part=>part.systemId==='muscular').every(part=>own.has(part.id)));assert.ok(visible.length<totalMeshes);return visible.map(part=>part.id);}



async function functional(){
 await goto('skeletal,muscular',newAssets.map(a=>a.id));const initial=await h.metrics();
 assert.equal(initial.meshCount,253);assert.equal(newWhole.length,42);assert.equal(newAssets.length,4);
 report.measurements.regional=initial;check('Four new modules register 48 meshes beside 205 skeletal meshes',initial);
 for(const node of newNodes.filter(n=>['structure','component'].includes(n.kind))){
  await choose(node);const card=page.getByRole('region',{name:'Información muscular de '+node.name,exact:true});
  for(const heading of ['Origen','Inserción','Inervación'])assert.ok(await card.getByRole('heading',{name:heading,exact:true}).count());assert.ok(await card.locator('a[href^="https://"]').count());
 }
 check('All 42 muscle cards and 12 component cards select through real search');
 const hand=muscle('abductorpollicisbrevis'),foot=muscle('abductorhallucis');
 for(const node of [hand,foot]){
  for(const query of [node.name,node.latin,node.sourceId,...node.aliases.filter(a=>a.startsWith('FJ'))]){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);const result=page.locator(`.atlas-search-result[data-node-id="${node.id}"]`);await result.waitFor();assert.match(await result.innerText(),/Músculo/);}
  await choose(node);await action('Aislar');assert.deepEqual((await parts()).filter(p=>p.visible).map(p=>p.id),[node.id]);await action('Ocultar');assert.equal((await parts()).filter(p=>p.visible).length,0);await action('Mostrar');assert.deepEqual((await parts()).filter(p=>p.visible).map(p=>p.id),[node.id]);await action('Ver conjunto');
 }
 await choose(muscle('quadratusplantae'));await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('Flexor accesorio');assert.ok(await page.locator('.atlas-search-result[data-node-id="bp3d:FMA37465"]').count());
 check('Spanish/Latin/FMA/FJ/alias search; intrinsic selection, isolation, hide and restore');
 for(const node of [hand,muscle('adductorpollicis','left'),foot,muscle('quadratusplantae'),byId.get('bp3d:FMA46020')]){
  const ids=await context(node);if(node.id==='bp3d:FMA46020')assert.deepEqual(new Set(ids),new Set(['bp3d:FMA46020','bp3d:FMA43253']));await reset();
 }
 check('Five contexts use curated ipsilateral bones and scoped head origins');
 for(const node of [hand,foot]){await choose(node);for(const direction of ['anterior','posterior','left','right','superior','inferior'])await h.view(direction);}
 for(const value of [100,50,25]){await opacity(value);assert.ok((await parts()).filter(p=>p.systemId==='skeletal').every(p=>p.opacity===1));}await reset();
 check('Six anatomical orientations and 100/50/25 muscle opacity retain independent bone');
 for(const asset of newAssets){await layers();await assetInput(asset).uncheck();await h.waitMeshes(253-asset.meshCount);await assetInput(asset).check();await h.waitMeshes(253);assert.equal((await h.metrics()).geometryBytes,initial.geometryBytes);}
 check('Each new module unloads and reloads without buffer growth');
 const failed=newAssets[0],pattern='**/'+failed.path;let allowed=false,attempts=0;
 await page.route(pattern,route=>{attempts++;return allowed?route.continue():route.abort('failed');});
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal,muscular&modules='+newAssets.map(a=>a.id).join(','),{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});await h.waitMeshes(253-failed.meshCount);assert.equal(attempts,1);allowed=true;
 await page.getByRole('button',{name:'Reintentar regiones pendientes'}).click();await h.waitMeshes(253);assert.equal(attempts,2);await page.unroute(pattern);
 check('Failed new hand module preserves other modules and explicitly recovers',{attempts});
 await goto();const final=await h.metrics();assert.equal(final.meshCount,387);assert.equal(final.loadedAssets,25);assert.equal(final.triangleCount,sum(assets,'triangles'));report.measurements.combined=final;
 const rest=await atRest();for(const level of ['systems','regions','structures']){await explode(level,100);assert.notDeepEqual(positions(await parts()),rest);await explode(level,0);assert.deepEqual(await atRest(),rest);}
 check('Final 387-mesh body: all explosion modes restore original positions exactly',final);
 await layers();await systemInput('skeletal').uncheck();await h.waitMeshes(182);await systemInput('skeletal').check();await systemInput('muscular').uncheck();await h.waitMeshes(205);await systemInput('muscular').check();await h.waitMeshes(387);
 check('Independent systems retain 182 muscle and 205 skeletal meshes');
 await choose(hand);await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('button',{name:'Expandir todo el árbol'}).click();const tree=page.getByRole('tree',{name:'Árbol anatómico'});await tree.getByRole('treeitem',{selected:true}).waitFor({state:'visible'});assert.ok(await tree.getByRole('treeitem').count()<nodes.length/2);
 await tree.focus();await page.keyboard.press('Home');assert.equal(await selectedName(),'Cuerpo humano');await page.keyboard.press('End');await tree.getByRole('treeitem',{selected:true}).waitFor({state:'visible'});
 for(const name of ['Corazón','Pulmones','Encéfalo']){await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(name);await page.locator('.atlas-global-results a.atlas-search-result').filter({hasText:name}).first().waitFor();}
 check('Virtual global tree and existing organ search links');
 for(const [width,height] of [[1366,768],[900,1000],[390,844]]){
  await page.setViewportSize({width,height});await wait(250);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await layers();await assetInput(newAssets[0]).scrollIntoViewIfNeeded();assert.ok(await assetInput(newAssets[0]).isVisible());await closePanels();await choose(foot);await closePanels();
  if(width===390){await page.getByRole('button',{name:'Inspección',exact:true}).click();assert.ok(await page.getByRole('region',{name:'Información muscular de '+foot.name,exact:true}).isVisible());await closePanels();}
 }
 check('New regions/cards/layers fit laptop, tablet and mobile viewports');await page.setViewportSize({width:1440,height:900});
}
async function captures(){
 await goto();
 for(const [rid,views] of [
  ['muscular:region:arm-right:hand',[['anterior','01-mano-palmar'],['posterior','02-mano-dorsal']]],
  ['muscular:region:leg-right:foot',[['superior','04-pie-dorsal'],['inferior','05-pie-plantar']]],
 ]){
  for(const [direction,file] of views){await reset();await choose(byId.get(rid));await h.view(direction);await action('Deseleccionar');await shot(file,'Original common frame; muscle coverage remains partial.');}
 }
 for(const [family,file,direction] of [['abductorpollicisbrevis','03-intrinseco-mano-aislado','anterior'],['abductorhallucis','06-intrinseco-pie-aislado','inferior']]){
  await reset();await choose(muscle(family));await action('Aislar');await h.view(direction);await shot(file);
 }
 for(const [direction,file] of [['anterior','07-muscular-final-anterior'],['posterior','08-muscular-final-posterior']]){await goto('muscular');await h.view(direction);await shot(file,'Available muscular coverage; face remains absent.');}
 await goto();await context(muscle('adductorpollicis'));await h.view('anterior');await shot('09-contexto-aductor-pulgar');
 await reset();await context(byId.get('bp3d:FMA46020'));await h.view('inferior');await shot('10-contexto-cabeza-transversa-pie','Capsuloligamentous origin retained as text.');
 await reset();await choose(byId.get('muscular:region:arm-left:hand'));await h.view('anterior');await action('Deseleccionar');await shot('11-mano-izquierda');
 await reset();await choose(byId.get('muscular:region:leg-left:foot'));await h.view('inferior');await action('Deseleccionar');await shot('12-pie-izquierdo');
}
try{await withinQaDeadline(async()=>{if(mode==='functional')await functional();await captures();assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;},1200000,'Fase 3F');}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png'),timeout:15000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'muscle-gaps-qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
