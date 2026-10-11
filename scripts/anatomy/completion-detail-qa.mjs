/** Focused follow-up for occluded WAVE 2 interiors and the no-skin scenario. */
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,withinQaDeadline} from './browser-qa.mjs';
const h=await createHarness({output:'.cache/anatomy-completion/wave2/browser-detail',viewport:{width:1366,height:900},reducedMotion:'reduce'});
const {page,output}=h;
const systems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'];
const catalogs=await Promise.all(systems.map(s=>readFile(path.join(project,'dist/models/anatomy',s,'catalog.json'),'utf8').then(JSON.parse)));
const nodes=catalogs.flatMap(c=>c.nodes),assets=catalogs.flatMap(c=>c.assets);
const report={date:new Date().toISOString(),environment:'Chromium headless / ANGLE SwiftShader; loopback no-store; not hardware FPS',captures:[],checks:[],errors:h.errors,badRequests:h.badRequests};
try {await withinQaDeadline(async()=>{
  await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=skeletal');
  await h.waitMeshes(205);
  await page.evaluate(()=>{window.__completionCanvas=document.querySelector('canvas');});
  for(const [id,file,view] of [
    ['bp3d:FMA258716','01-thalamus-isolated','anterior'],
    ['bp3d:FMA78454','02-ventricle-isolated','left'],
    ['bp3d:FMA7260','03-papillary-isolated','anterior'],
    ['ocular:FMA58300','04-choroid-isolated','anterior'],
  ]) {
    const node=nodes.find(n=>n.id===id);
    await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(node.sourceId);
    await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();
    await page.waitForFunction(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),id);
    await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();
    await h.view(view);
    await page.waitForTimeout(1000);
    assert.ok(await page.evaluate(()=>document.querySelector('canvas')===window.__completionCanvas));
    await page.screenshot({path:path.join(output,file+'.png')});
    report.captures.push({id,file:file+'.png'});
    await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ocultar',exact:true}).click();
    await page.locator('.atlas-selection-actions').getByRole('button',{name:'Mostrar',exact:true}).click();
    await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ver conjunto',exact:true}).click();
    await page.locator('.atlas-selection-actions').getByRole('button',{name:'Deseleccionar',exact:true}).click();
    assert.ok(await page.evaluate(()=>document.querySelector('canvas')===window.__completionCanvas));
    console.log('PASS',file,'same Canvas object');
  }
  report.checks.push('Four interior selections, isolate, hide, restore, deselect: identical Canvas DOM object');
  const expected=assets.filter(a=>a.id!=='integumentary:skin');
  await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+[...new Set(assets.map(a=>a.systemId))].join(',')+'&modules='+expected.map(a=>a.id).join(','));
  await h.waitMeshes(expected.reduce((sum,a)=>sum+a.meshCount,0));
  await page.waitForTimeout(1000);
  await page.evaluate(()=>{window.__atlasQa.captureFrames=true;window.__atlasQa.frames=[];});
  await page.getByRole('button',{name:'Acercar',exact:true}).click();
  await page.waitForTimeout(2000);
  const timings=await page.evaluate(()=>{
    window.__atlasQa.captureFrames=false;
    const frames=window.__atlasQa.frames;
    return {frameIntervalsMs:frames.slice(1).map((v,i)=>v-frames[i]),transfers:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({file:r.name.split('/').at(-1),bytes:r.encodedBodySize,durationMs:r.duration}))};
  });
  report.performance={name:'full-without-skin-including-hair',expectedModules:expected.length,expectedBytes:expected.reduce((sum,a)=>sum+a.bytes,0),metrics:await h.metrics(),...timings};
  assert.ok(!timings.transfers.some(t=>t.file==='skin.glb'));
  assert.ok(timings.transfers.some(t=>t.file==='completion2-hair.glb'));
  assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
  console.log('PASS full-without-skin including hair');
},600000,'Completion interior follow-up');}
catch(error){report.success=false;report.error=error.stack;throw error;}
finally{await writeFile(path.join(output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
