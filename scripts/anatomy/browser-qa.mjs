import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.resolve(process.env.QA_OUTPUT_DIR || path.join(project, '.qa-anatomy'));
const distribution = path.resolve(project, process.env.QA_SERVE_DIR || 'dist');
const require = createRequire(import.meta.url);
let playwright;
for (const candidate of ['playwright', process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES && path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'), '/usr/local/lib/node_modules/playwright'].filter(Boolean)) {
  try { playwright = require(candidate); break; } catch {}
}
if (!playwright) throw new Error('Playwright is required. Install it or set CODEX_PRIMARY_RUNTIME_NODE_MODULES.');
await stat(path.join(distribution, 'index.html'));
await mkdir(output, {recursive:true});
const catalog = JSON.parse(await readFile(path.join(distribution, 'models/anatomy/skeletal/catalog.json'), 'utf8'));
const expectedMeshes = catalog.coverage.meshes, expectedTriangles = catalog.assets.reduce((sum, asset) => sum + asset.triangles, 0);
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.glb':'model/gltf-binary', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.webp':'image/webp', '.png':'image/png'};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname).replace(/^\/med3d\/?/, '/');
    let filename = path.resolve(distribution, '.' + pathname);
    if (!filename.startsWith(distribution + path.sep) && filename !== distribution) { response.writeHead(403); response.end(); return; }
    try { if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html'); }
    catch { filename = path.join(distribution, 'index.html'); }
    response.writeHead(200, {'Content-Type':mime[path.extname(filename)] || 'application/octet-stream'}); response.end(await readFile(filename));
  } catch (error) { response.writeHead(500); response.end(error.message); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await playwright.chromium.launch({headless:true, args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const context = await browser.newContext({viewport:{width:1440,height:1000}, deviceScaleFactor:1});
const page = await context.newPage(), errors = [], badRequests = [], report = {environment:'Headless Chromium; ANGLE SwiftShader software WebGL; local HTTP', expectedMeshes, expectedTriangles, checks:[]};
page.on('pageerror', error => errors.push(error.message));
page.on('response', response => { if(response.status() >= 400) badRequests.push({url:response.url(),status:response.status()}); });
await page.addInitScript(() => {
  window.__atlasQa = {draws:0, firstMeshMs:null, fullMeshMs:null};
  for (const Constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
    for (const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
      const original = Constructor.prototype[name]; if(!original)continue;
      Constructor.prototype[name] = function(...args) {window.__atlasQa.draws += 1; return original.apply(this,args);};
    }
  }
  document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{
    const count=Number(document.querySelector('.atlas-viewport')?.dataset.meshCount||0);
    if(count>0&&window.__atlasQa.firstMeshMs===null)window.__atlasQa.firstMeshMs=performance.now();
  }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-mesh-count']}));
});
const metrics = () => page.locator('.atlas-viewport').evaluate(element => Object.fromEntries(Object.entries(element.dataset).map(([key,value])=>[key,Number(value)])));
const waitMeshes = count => page.waitForFunction(expected=>Number(document.querySelector('.atlas-viewport')?.dataset.meshCount)===expected,count,{timeout:120000});
const waitDraws = count => page.waitForFunction(expected=>Number(document.querySelector('.atlas-viewport')?.dataset.drawCalls)===expected,count,{timeout:30000});
const setSlider = (locator,value) => locator.evaluate((input,value)=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));
  input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
},value);
const choose = async name => {
  await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(name);
  await page.locator('.atlas-search-result').filter({hasText:name}).first().click();
  await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,name);
};
const check = (name, values={}) => {report.checks.push({name,...values});console.log('PASS',name,JSON.stringify(values));};
try {
  await page.goto(origin+'/med3d/anatomia/',{waitUntil:'domcontentloaded',timeout:120000});
  await waitMeshes(expectedMeshes); await page.waitForTimeout(1500);
  const initial=await metrics(); assert.equal(initial.triangleCount,expectedTriangles); assert.equal(initial.loadedAssets,catalog.assets.length);
  report.initial=initial; report.firstMeshMs=await page.evaluate(()=>window.__atlasQa.firstMeshMs);
  report.fullLoadObservedMs=await page.evaluate(()=>performance.now());
  report.modelTransfers=await page.evaluate(()=>performance.getEntriesByType('resource').filter(entry=>entry.name.endsWith('.glb')).map(entry=>({name:entry.name.split('/').at(-1),durationMs:entry.duration,encodedBytes:entry.encodedBodySize})));
  check('Progressive complete registered model load',initial);
  await page.screenshot({path:path.join(output,'atlas-desktop.png'),fullPage:true});

  // Demand rendering must really stop. Software rasterisation may settle slowly.
  let stable=false, samples=[];
  for(let attempt=0;attempt<12;attempt++){
    const before=await page.evaluate(()=>window.__atlasQa.draws); await page.waitForTimeout(1000);
    const after=await page.evaluate(()=>window.__atlasQa.draws); samples.push(after-before);
    if(after===before){stable=true;break;}
  }
  assert.ok(stable,'WebGL must stop drawing when idle'); check('Idle demand rendering stops',{drawsPerSecond:samples});

  await choose('Fémur izquierdo'); await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();
  await waitDraws(1); await page.waitForTimeout(1300);
  assert.equal((await metrics()).meshCount,expectedMeshes); check('Selection, focus and isolation',{drawCalls:1,retainedMeshes:expectedMeshes});
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ocultar',exact:true}).click(); await waitDraws(0);
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Mostrar',exact:true}).click(); await waitDraws(1);
  check('Hide and reveal selected individual bone');
  await setSlider(page.locator('#skeletal-opacity'),10); assert.equal(await page.locator('#skeletal-opacity').inputValue(),'10');
  await setSlider(page.locator('#skeletal-opacity'),100); check('System opacity 10–100%');

  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Deseleccionar',exact:true}).click();
  const box=await page.locator('.atlas-canvas canvas').boundingBox(); let hit=false;
  for(const y of [.50,.43,.57,.35,.65]){
    for(const x of [.5,.46,.54,.42,.58]){
      await page.mouse.click(box.x+box.width*x,box.y+box.height*y);
      if(await page.locator('.atlas-detail-content h2').textContent()==='Fémur izquierdo'){hit=true;break;}
    }
    if(hit)break;
  }
  assert.ok(hit,'Real canvas raycast must select the isolated femur');check('Raycast selects registered bone ID');
  await page.getByRole('button',{name:'Restablecer atlas'}).click(); await waitMeshes(expectedMeshes); await page.waitForTimeout(1300);

  for(const level of ['regions','structures','systems']){
    await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);
    await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),100); await page.waitForTimeout(1600);
    const exploded=await metrics();assert.equal(exploded.meshCount,expectedMeshes);assert.equal(exploded.triangleCount,expectedTriangles);
    assert.equal(exploded.geometryBytes,initial.geometryBytes);
    await page.screenshot({path:path.join(output,`atlas-exploded-${level}.png`),fullPage:true});
    check('Exploded view '+level+' preserves ownership',exploded);
    await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),0);
  }
  await page.getByRole('button',{name:'Restablecer atlas'}).click();
  await page.getByRole('button',{name:'Capas',exact:true}).click();
  const leftLeg=page.locator('.atlas-region-layers label').filter({hasText:'Miembro inferior izquierdo'}).getByRole('checkbox');
  const leftAsset=catalog.assets.find(asset=>asset.id==='skeletal:leg-left');
  await leftLeg.uncheck();await waitMeshes(expectedMeshes-leftAsset.meshCount);
  const partial=await metrics();assert.ok(partial.geometryBytes<initial.geometryBytes);check('Disabled region releases decoded geometry',partial);
  await choose('Tibia izquierda');await waitMeshes(expectedMeshes);check('Search reactivates missing region and retains pending focus');
  await page.getByRole('button',{name:'Restablecer atlas'}).click();
  await page.getByRole('button',{name:'Capas',exact:true}).click();
  await page.locator('.atlas-layer-toggle input').uncheck();await waitMeshes(0);
  const unloaded=await metrics();assert.equal(unloaded.geometryBytes,0);assert.equal(unloaded.loadedAssets,0);
  assert.ok(unloaded.renderGeometries<=initial.renderGeometries-expectedMeshes,'GPU geometry ownership must be released');check('System unload releases CPU and GPU geometry',unloaded);
  await page.locator('.atlas-layer-toggle input').check();await waitMeshes(expectedMeshes);
  const reloaded=await metrics();assert.equal(reloaded.geometryBytes,initial.geometryBytes);assert.equal(reloaded.meshCount,initial.meshCount);check('Reload is bounded with no geometry growth',reloaded);

  for(const width of [1050,900,390]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(350);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+width);
    await page.getByRole('button',{name:'Inspección',exact:true}).click();
    assert.ok(await page.locator('.atlas-detail').isVisible());
    await page.getByRole('button',{name:'Cerrar inspección'}).click();
    const structuresButton=page.getByRole('button',{name:'Estructuras',exact:true});
    if(await structuresButton.isVisible())await structuresButton.click();
    await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('Frontal');
    await page.locator('.atlas-search-result').filter({hasText:'Frontal'}).first().click();
    assert.equal(await page.locator('.atlas-detail-content h2').textContent(),'Frontal');
    await page.screenshot({path:path.join(output,`atlas-${width}.png`),fullPage:true});
    check('Responsive panels and search '+width);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(origin+'/med3d/anatomia/?organ=heart&structure=VH_M_heart_right_ventricle',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.atlas-detail-content h2')?.textContent==='Ventrículo derecho',null,{timeout:60000});
  await page.locator('.atlas-canvas canvas').waitFor({state:'visible'});
  await page.waitForFunction(()=>performance.getEntriesByType('resource').some(entry=>entry.name.endsWith('/models/heart.glb'))&&window.__atlasQa.draws>0,null,{timeout:60000});
  await page.getByRole('progressbar',{name:'Descarga del modelo'}).waitFor({state:'detached',timeout:60000});
  assert.equal(await page.getByRole('alert').count(),0,'Legacy WebGL must load without renderer errors');
  await page.waitForTimeout(1800);await page.screenshot({path:path.join(output,'legacy-heart.png'),fullPage:true});
  assert.equal(await page.locator('.atlas-phase2').count(),0);check('Legacy heart route and selected structure preserved');
  assert.deepEqual(errors,[],'No unhandled browser errors');assert.deepEqual(badRequests,[],'No failing asset requests');
  report.errors=errors;report.badRequests=badRequests;report.success=true;
}catch(error){report.success=false;report.error=error.stack;report.errors=errors;report.badRequests=badRequests;await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'browser-qa.json'),JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(resolve=>server.close(resolve));}
