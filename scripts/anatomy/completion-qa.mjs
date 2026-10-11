import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,setSlider,withinQaDeadline} from './browser-qa.mjs';
const wave=process.argv[2]||'wave1';
const skipOwners=process.argv.includes('--resume-captures');
const selection=JSON.parse(await readFile(path.join(project,'research/anatomy/completion-'+wave+'-selection.json'),'utf8'));
const h=await createHarness({output:'.cache/anatomy-completion/'+wave+'/browser',viewport:{width:1366,height:900}}),{page,output}=h;
const cats=await Promise.all(['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'].map(async s=>JSON.parse(await readFile(path.join(project,'dist/models/anatomy/'+s+'/catalog.json'),'utf8'))));
const assets=cats.flatMap(c=>c.assets),nodes=cats.flatMap(c=>c.nodes),byId=new Map(nodes.map(n=>[n.id,n]));
const report={date:new Date().toISOString(),wave,environment:'Headless Chromium / ANGLE SwiftShader; loopback no-store; not physical-device FPS',checks:[],captures:[],performance:[],errors:h.errors,badRequests:h.badRequests};
const check=name=>{report.checks.push(name);console.log('PASS',name);};
const snapshot=()=>page.evaluate(()=>window.__med3dAtlasScene());
async function structures(){if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();}
async function choose(id){const n=byId.get(id);await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(n.sourceId||n.name);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,n.name);await page.waitForTimeout(850);}
async function action(name){const b=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await b.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await b.click();await page.waitForTimeout(500);}
async function shot(name){await page.mouse.move(5,5);await page.screenshot({path:path.join(output,name+'.png')});report.captures.push({file:name+'.png',selection:await page.locator('.atlas-detail-content h2').textContent(),visible:(await snapshot()).parts.filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
async function goto(systems,modules){const expected=assets.filter(a=>systems.includes(a.systemId)&&(modules?modules.includes(a.id)||(a.systemId==='skeletal'&&a.defaultEnabled!==false):a.defaultEnabled!==false));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems.join(',')+(modules?'&modules='+modules.join(','):''));await h.waitMeshes(expected.reduce((s,a)=>s+a.meshCount,0));await page.waitForTimeout(650);return expected;}
async function measure(name,systems,modules){const expected=await goto(systems,modules);await page.evaluate(()=>{window.__atlasQa.captureFrames=true;window.__atlasQa.frames=[];});await page.getByRole('button',{name:'Acercar',exact:true}).click();await page.waitForTimeout(1600);const timing=await page.evaluate(()=>{window.__atlasQa.captureFrames=false;const t=window.__atlasQa.frames;const intervals=t.slice(1).map((v,i)=>v-t[i]);return {frameIntervalsMs:intervals,meanFrameIntervalMs:intervals.length?intervals.reduce((a,b)=>a+b)/intervals.length:null,transfers:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({file:r.name.split('/').at(-1),bytes:r.encodedBodySize,durationMs:r.duration}))};});report.performance.push({name,expectedModules:expected.length,expectedBytes:expected.reduce((s,a)=>s+a.bytes,0),metrics:await h.metrics(),...timing});console.log('MEASURE',name);}
try{await withinQaDeadline(async()=>{
 await goto(['skeletal']);const baselineCanvas=await page.locator('canvas').count();
 if(!skipOwners) for(const node of selection.nodes.filter(n=>n.sourceElements)){
  await choose(node.id);await page.waitForFunction(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),node.id);await action('Aislar');assert.ok((await snapshot()).parts.filter(p=>p.visible).every(p=>p.id===node.id));await action('Ocultar');assert.equal((await snapshot()).parts.filter(p=>p.visible).length,0);await action('Mostrar');assert.ok((await snapshot()).parts.some(p=>p.visible&&p.id===node.id));await action('Ver conjunto');
  assert.equal(await page.locator('canvas').count(),baselineCanvas);
 }
 if(skipOwners){const previous=JSON.parse(await readFile(path.join(output,'qa.json'),'utf8'));assert.ok(previous.checks.includes('Every new owner: source-ID search, lazy load, selection, isolate, hide, restore and card without remount'));report.ownerChecksFrom=previous.date;}
 check('Every new owner: source-ID search, lazy load, selection, isolate, hide, restore and card without remount');
 for(const [id,name,view] of [['bp3d:FMA13295','01-diaphragm-context','anterior'],['bp3d:FMA9756','02-intercostals','posterior'],['dig:FMA55699','03-dentition','anterior'],['bp3d:FMA22340','04-hip','posterior'],['bp3d:FMA45858','05-pelvic-floor','inferior'],['ocular:FMA49044','06-orbit','anterior'],['ocular:FMA58242','07-lens','right'],['ocular:FMA58607','08-retina','posterior'],['bp3d:FMA83966','09-tentorium','posterior'],['bp3d:FMA20801','10-femoral-branches','anterior']]){
  if(!byId.has(id))continue;await choose(id);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await page.waitForTimeout(650);await h.view(view);await shot(name);
 }
 await choose('bp3d:FMA45858');await action('Aislar');await h.view('anterior');await shot('11-pelvic-right-isolated');await action('Ver conjunto');
 for(const level of ['systems','regions','structures']){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),35);await page.waitForTimeout(1000);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),0);await page.waitForFunction(()=>window.__med3dAtlasScene().parts.every(p=>p.position.every((v,i)=>v===p.restPosition[i])),undefined,{timeout:120000});}check('All explosion modes return to exact rest');
 await measure('first-load-default',assets.filter(a=>a.systemId!=='integumentary').map(a=>a.systemId).filter((x,i,a)=>a.indexOf(x)===i));
 await measure('isolated-muscular-with-additions',['muscular'],assets.filter(a=>a.systemId==='muscular').map(a=>a.id));
 await measure('multiple-systems',['skeletal','muscular','nervous'],assets.filter(a=>['skeletal','muscular','nervous'].includes(a.systemId)).map(a=>a.id));
 await measure('full-without-skin',cats.filter(c=>c.assets[0]?.systemId!=='integumentary').map(c=>c.assets[0]?.systemId).filter(Boolean),assets.filter(a=>a.systemId!=='integumentary').map(a=>a.id));
 await measure('full-with-skin',cats.map(c=>c.assets[0]?.systemId).filter(Boolean),assets.map(a=>a.id));
 assert.equal(report.performance[0].metrics.meshCount,936);check('Default load unchanged; skin and added modules remain off');
 await goto(['skeletal']);await page.setViewportSize({width:390,height:844});await choose('ocular:FMA58242');await page.getByRole('button',{name:'Inspección',exact:true}).click();assert.ok(await page.getByRole('region',{name:'Información anatómica de '+byId.get('ocular:FMA58242').name}).isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('12-mobile-card');check('Mobile optional selection and educational panel');
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
},1800000,'Completion '+wave);}
catch(error){report.success=false;report.error=error.stack;await page.screenshot({path:path.join(output,'failure.png')}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
