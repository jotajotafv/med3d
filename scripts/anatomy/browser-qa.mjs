import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const setSlider = (locator,value) => locator.evaluate((input,value)=>{
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));
  input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));
},value);
export async function withinQaDeadline(task, timeoutMs, label) {
  let timer;
  try {
    return await Promise.race([task(), new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(new Error(`${label}: exceeded ${timeoutMs} ms; partial evidence is retained.`)),timeoutMs);
    })]);
  } finally {clearTimeout(timer);}
}
export async function createHarness(options={}) {
  const output = path.resolve(options.output || process.env.QA_OUTPUT_DIR || path.join(project, '.qa-anatomy'));
  const distribution = path.resolve(project, process.env.QA_SERVE_DIR || 'dist');
  const require = createRequire(import.meta.url); let playwright;
  for (const candidate of [process.env.QA_PLAYWRIGHT_MODULE, 'playwright', process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES && path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'), '/usr/local/lib/node_modules/playwright'].filter(Boolean)) {
    try { playwright = require(candidate); break; } catch {}
  }
  if (!playwright) throw new Error('Playwright is required. Install it or set QA_PLAYWRIGHT_MODULE.');
  await stat(path.join(distribution, 'index.html')); await mkdir(output, {recursive:true});
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
      catch {
        if(path.extname(filename)) {response.writeHead(404);response.end('Not found');return;}
        filename = path.join(distribution, 'index.html');
      }
      response.writeHead(200, {'Content-Type':mime[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-store'}); response.end(await readFile(filename));
    } catch (error) { response.writeHead(500); response.end(error.message); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch({headless:true, ...(process.env.QA_BROWSER_EXECUTABLE?{executablePath:process.env.QA_BROWSER_EXECUTABLE}:{}), args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const context = await browser.newContext({viewport:options.viewport||{width:1440,height:900}, deviceScaleFactor:1,reducedMotion:options.reducedMotion||'no-preference'});
  context.setDefaultTimeout(20000);context.setDefaultNavigationTimeout(60000);
  await context.addInitScript(() => {
    window.__atlasQa = {draws:0, captureFrames:false, frames:[], firstMeshObservedMs:null, fullMeshObservedMs:null};
    const request = window.requestAnimationFrame.bind(window); let frameTime=0;
    window.requestAnimationFrame = callback => request(time=>{frameTime=time;callback(time);});
    for (const Constructor of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
      for (const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) {
        const original = Constructor.prototype[name]; if(!original)continue;
        Constructor.prototype[name] = function(...args) {
          window.__atlasQa.draws += 1;
          const q=window.__atlasQa; if(q.captureFrames && q.frames.at(-1)!==frameTime)q.frames.push(frameTime);
          return original.apply(this,args);
        };
      }
    }
    document.addEventListener('DOMContentLoaded',()=>new MutationObserver(()=>{
      const count=Number(document.querySelector('.atlas-viewport')?.dataset.meshCount||0);
      if(count>0&&window.__atlasQa.firstMeshObservedMs===null)window.__atlasQa.firstMeshObservedMs=performance.now();
    }).observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['data-mesh-count']}));
  });
  const page = await context.newPage(), errors=[], badRequests=[];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if(response.status() >= 400) badRequests.push({url:response.url(),status:response.status()}); });
  const metrics = () => page.locator('.atlas-viewport').evaluate(element => Object.fromEntries(Object.entries(element.dataset).map(([key,value])=>[key,Number(value)])));
  const waitMeshes = count => page.waitForFunction(expected=>Number(document.querySelector('.atlas-viewport')?.dataset.meshCount)===expected,count,{timeout:120000});
  const waitDraws = count => page.waitForFunction(expected=>Number(document.querySelector('.atlas-viewport')?.dataset.drawCalls)===expected,count,{timeout:30000});
  const choose = async (name,id) => {
    const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});
    if(!await input.isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();
    await input.fill(name);
    const result=page.locator('.atlas-search-result').filter({has:page.locator('span').filter({hasText:new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')})});
    if(id){
      const matches=catalog.nodes.filter(node=>node.name===name); const which=matches.findIndex(node=>node.id===id);
      await result.nth(Math.max(0,which)).click();
    }else await result.first().click();
    await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,name);
  };
  const reset = async () => {await page.getByRole('button',{name:'Restablecer atlas'}).click();await waitMeshes(expectedMeshes);await page.waitForTimeout(1100);};
  const view = async value => {
    await page.getByRole('combobox',{name:'Vista anatómica'}).selectOption(value);
    await page.waitForTimeout(1100);
  };
  const close = async () => {
    // A crashed browser must not keep CI alive after the report has been saved.
    await withinQaDeadline(()=>browser.close(),5000,'Browser teardown').catch(error=>console.error(error.message));
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  };
  return {output,catalog,expectedMeshes,expectedTriangles,origin,browser,context,page,errors,badRequests,metrics,waitMeshes,waitDraws,choose,reset,view,close};
}
export async function runBrowserQa() {
const harness=await createHarness();
const {output,catalog,expectedMeshes,expectedTriangles,origin,browser,context,page,errors,badRequests,metrics,waitMeshes,waitDraws,choose,reset,view}=harness;
const report = {date:new Date().toISOString(),environment:'Headless Chromium; ANGLE SwiftShader software WebGL; local HTTP; not physical-device performance', expectedMeshes, expectedTriangles, checks:[]};
const check = (name, values={}) => {report.checks.push({name,...values});console.log('PASS',name,JSON.stringify(values));};
try {
  await withinQaDeadline(async()=>{
  await page.goto(origin+'/med3d/anatomia/?systems=skeletal',{waitUntil:'domcontentloaded',timeout:120000});
  await waitMeshes(expectedMeshes); await page.waitForTimeout(1500);
  const initial=await metrics(); assert.equal(initial.triangleCount,expectedTriangles); assert.equal(initial.loadedAssets,catalog.assets.length);
  report.initial=initial; report.geometryMarks=await page.evaluate(()=>performance.getEntriesByType('mark').filter(entry=>entry.name.startsWith('med3d:')).map(entry=>({name:entry.name,startTime:entry.startTime})));
  // Load timings above are renderer marks, not an observation made after a fixed settling pause.
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

  for(const [query,name] of [['FEMUR IZQUIERDO','Fémur izquierdo'],['fíbula izquierda','Peroné izquierdo'],['ulna izquierda','Cúbito izquierdo'],['Os femoris','Fémur izquierdo']]){
    await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(query);
    await page.locator('.atlas-search-result').filter({hasText:name}).first().click();
    assert.equal(await page.locator('.atlas-detail-content h2').textContent(),name);
  }
  check('Case, accents, common synonyms and Latin search');
  await page.getByRole('button',{name:'Limpiar búsqueda'}).click();
  await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();
  await page.getByRole('button',{name:'Expandir todo el árbol'}).click();
  const tree=page.getByRole('tree',{name:'Árbol anatómico'});
  assert.ok(await tree.getByRole('treeitem').count()<catalog.nodes.length/2,'Tree must remain virtualized');
  await tree.focus();await page.keyboard.press('End');
  await page.waitForFunction(()=>document.querySelector('[role=treeitem][aria-selected=true]'));
  assert.ok(await tree.getByRole('treeitem',{selected:true}).isVisible());
  const lastTreeName=await page.locator('.atlas-detail-content h2').textContent();
  await page.keyboard.press('Home');assert.equal(await page.locator('.atlas-detail-content h2').textContent(),'Cuerpo humano');
  await page.keyboard.press('ArrowDown');assert.equal(await page.locator('.atlas-detail-content h2').textContent(),'Sistema óseo');
  check('Virtual tree keyboard navigation retains visible selected row',{renderedRows:await tree.getByRole('treeitem').count(),catalogNodes:catalog.nodes.length,lastTreeName});

  for(const direction of ['anterior','posterior','left','right','superior','inferior'])await view(direction);
  check('Six anatomical camera orientations execute without a rendering error');
  await reset();
  const cameraCanvas=page.locator('.atlas-canvas canvas');
  const restImage=await cameraCanvas.screenshot();
  await page.getByRole('button',{name:'Acercar',exact:true}).click();await page.waitForTimeout(1000);
  assert.notDeepEqual(await cameraCanvas.screenshot(),restImage,'Zoom must alter the rendered camera view');
  await page.getByRole('button',{name:'Alejar',exact:true}).click();await page.waitForTimeout(1000);
  const beforePan=await cameraCanvas.screenshot(),cameraBox=await cameraCanvas.boundingBox();
  await page.mouse.move(cameraBox.x+cameraBox.width*.5,cameraBox.y+cameraBox.height*.5);
  await page.mouse.down({button:'right'});await page.mouse.move(cameraBox.x+cameraBox.width*.6,cameraBox.y+cameraBox.height*.55,{steps:8});await page.mouse.up({button:'right'});await page.waitForTimeout(1200);
  assert.notDeepEqual(await cameraCanvas.screenshot(),beforePan,'Pan must alter the rendered camera view');
  check('Zoom and right-button pan change actual WebGL pixels');await reset();

  await choose('Fémur izquierdo');
  const education=page.getByRole('region',{name:'Información de Fémur izquierdo',exact:true});
  assert.ok(await education.getByRole('heading',{name:'Articulaciones',exact:true}).isVisible());
  assert.ok(await education.getByRole('heading',{name:'Partes principales',exact:true}).count()>0);
  const readingSizes=await education.locator('p:not(.atlas-bone-classification),li').evaluateAll(elements=>elements.map(element=>parseFloat(getComputedStyle(element).fontSize)));
  assert.ok(readingSizes.every(size=>size>=13),'Educational body text must be at least 13 px');
  assert.ok(await education.locator('a[href^="https://"]').count()>0,'Individual card must link its educational references');
  assert.equal(await page.locator('.atlas-planned').count(),0,'Future unavailable systems must not dominate the public layers UI');
  assert.doesNotMatch(await page.locator('.atlas-load-summary').textContent(),/\bMB\b|módulos/i);
  check('Individual educational card, source links and readable body typography',{minimumEducationFontPx:Math.min(...readingSizes)});
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();
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

  assert.equal(await page.getByRole('combobox',{name:'Nivel de despiece'}).locator('option[value=systems]').count(),0);
  check('Single-system UI exposes regions and structures only');
  for(const level of ['regions','structures']){
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
  await page.locator('[data-system-id=skeletal] .atlas-layer-toggle input').uncheck();await waitMeshes(0);
  const unloaded=await metrics();assert.equal(unloaded.geometryBytes,0);assert.equal(unloaded.loadedAssets,0);
  assert.ok(unloaded.renderGeometries<=initial.renderGeometries-expectedMeshes,'GPU geometry ownership must be released');check('System unload releases CPU and GPU geometry',unloaded);
  await page.locator('[data-system-id=skeletal] .atlas-layer-toggle input').check();await waitMeshes(expectedMeshes);
  const reloaded=await metrics();assert.equal(reloaded.geometryBytes,initial.geometryBytes);assert.equal(reloaded.meshCount,initial.meshCount);check('Reload is bounded with no geometry growth',reloaded);

  for(const width of [1366,1050,900,390]){
    await page.setViewportSize({width,height:844});await page.waitForTimeout(350);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow at '+width);
    if(width<=680){
      const canvasBounds=await page.locator('.atlas-canvas canvas').boundingBox(),actionsBounds=await page.locator('.atlas-mobile-actions').boundingBox();
      assert.ok(canvasBounds.y>=actionsBounds.y+actionsBounds.height-1,'Mobile anatomy canvas must begin below the action buttons');
    }
    const inspect=page.getByRole('button',{name:'Inspección',exact:true});
    if(await inspect.isVisible()){
      await inspect.click(); assert.ok(await page.locator('.atlas-detail').isVisible());
      await page.getByRole('button',{name:'Cerrar inspección'}).click();
    }
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
  for(const organ of ['lungs','brain']){
    await page.goto(origin+'/med3d/anatomia/?organ='+organ,{waitUntil:'domcontentloaded'});
    await page.locator('.atlas-canvas canvas').waitFor({state:'visible'});
    await page.waitForFunction(organ=>performance.getEntriesByType('resource').some(entry=>entry.name.endsWith('/models/'+organ+'.glb'))&&window.__atlasQa.draws>0,organ,{timeout:120000});
    await page.getByRole('progressbar',{name:'Descarga del modelo'}).waitFor({state:'detached',timeout:120000});
    assert.equal(await page.getByRole('alert').count(),0);check('Legacy '+organ+' model renders');
  }

  // Use the existing page: retaining a background brain WebGL context would add
  // an unrelated GPU-pressure variable to this regional network recovery test.
  // Keep transport unavailable until the explicit retry instead of depending on
  // the lifetime of a momentary error during progressive loading.
  const faultPage=page;let allowSpine=false,spineAttempts=0;
  await faultPage.route('**/models/anatomy/skeletal/spine.glb',route=>{
    spineAttempts++;if(!allowSpine)return route.abort('failed');return route.continue();
  });
  await faultPage.goto(origin+'/med3d/anatomia/?systems=skeletal',{waitUntil:'domcontentloaded'});
  await faultPage.getByRole('button',{name:'Reintentar regiones pendientes'}).waitFor({timeout:120000});
  const healthyMeshes=expectedMeshes-catalog.assets.find(asset=>asset.id==='skeletal:spine').meshCount;
  await waitMeshes(healthyMeshes);
  report.recoveryBefore={spineAttempts,metrics:await metrics(),alerts:await faultPage.getByRole('alert').allTextContents()};
  assert.equal(spineAttempts,1,'A failed region must remain failed until the user retries');
  allowSpine=true;
  await faultPage.getByRole('button',{name:'Reintentar regiones pendientes'}).click();
  await faultPage.waitForFunction(expected=>Number(document.querySelector('.atlas-viewport')?.dataset.meshCount)===expected,expectedMeshes,{timeout:120000});
  assert.equal(await faultPage.getByRole('alert').count(),0);assert.equal(spineAttempts,2);
  check('Failed regional request is recoverable without rebuilding the atlas',{requests:spineAttempts,retainedHealthyMeshes:healthyMeshes});
  assert.deepEqual(errors,[],'No unhandled browser errors');assert.deepEqual(badRequests,[],'No failing asset requests');
  report.errors=errors;report.badRequests=badRequests;report.success=true;
  },360000,'Functional validation');
}catch(error){report.success=false;report.error=error.stack;report.errors=errors;report.badRequests=badRequests;await page.screenshot({path:path.join(output,'failure.png'),fullPage:true,timeout:5000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'browser-qa.json'),JSON.stringify(report,null,2)+'\n');await harness.close();}
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runBrowserQa();
