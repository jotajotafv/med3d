import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,setSlider,withinQaDeadline} from './browser-qa.mjs';
const wave=process.argv[2]||'wave1';
const skipOwners=process.argv.includes('--resume-captures');
const selection=JSON.parse(await readFile(path.join(project,'research/anatomy/completion-'+wave+'-selection.json'),'utf8'));
const acceptance=JSON.parse(await readFile(path.join(project,'research/anatomy/completion-'+wave+'-acceptance.json'),'utf8'));
selection.nodes=selection.nodes.filter(n=>acceptance.acceptedNodeIds.includes(n.id));
const h=await createHarness({output:'.cache/anatomy-completion/'+wave+'/browser',viewport:{width:1366,height:900},reducedMotion:'reduce'}),{page,output}=h;
const cats=await Promise.all(['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'].map(async s=>JSON.parse(await readFile(path.join(project,'dist/models/anatomy/'+s+'/catalog.json'),'utf8'))));
const assets=cats.flatMap(c=>c.assets),nodes=cats.flatMap(c=>c.nodes),byId=new Map(nodes.map(n=>[n.id,n]));
const report={date:new Date().toISOString(),wave,environment:'Headless Chromium / ANGLE SwiftShader; loopback no-store; not physical-device FPS',checks:[],captures:[],performance:[],errors:h.errors,badRequests:h.badRequests};
const check=name=>{report.checks.push(name);console.log('PASS',name);};
const pickedModules=new Set();
const snapshot=()=>page.evaluate(()=>window.__med3dAtlasScene());
async function structures(){if(!await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();}
async function choose(id){const n=byId.get(id);await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(n.sourceId||n.name);await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForFunction(name=>document.querySelector('.atlas-detail-content h2')?.textContent===name,n.name);await page.waitForTimeout(850);}
async function action(name){const b=page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true});if(!await b.isVisible())await page.getByRole('button',{name:'Inspección',exact:true}).click();await b.click();await page.waitForTimeout(500);}
async function shot(name){await page.mouse.move(5,5);await page.screenshot({path:path.join(output,name+'.png')});report.captures.push({file:name+'.png',selection:await page.locator('.atlas-detail-content h2').textContent(),visible:(await snapshot()).parts.filter(p=>p.visible).map(p=>p.id)});console.log('CAPTURE',name);}
async function goto(systems,modules){const expected=assets.filter(a=>systems.includes(a.systemId)&&(modules?modules.includes(a.id)||(a.systemId==='skeletal'&&a.defaultEnabled!==false):a.defaultEnabled!==false));await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems.join(',')+(modules?'&modules='+modules.join(','):''));await h.waitMeshes(expected.reduce((s,a)=>s+a.meshCount,0));await page.waitForTimeout(650);return expected;}
async function measure(name,systems,modules){const expected=await goto(systems,modules);await page.evaluate(()=>{window.__atlasQa.captureFrames=true;window.__atlasQa.frames=[];});await page.getByRole('button',{name:'Acercar',exact:true}).click();await page.waitForTimeout(1600);const timing=await page.evaluate(()=>{window.__atlasQa.captureFrames=false;const t=window.__atlasQa.frames;const intervals=t.slice(1).map((v,i)=>v-t[i]);return {frameIntervalsMs:intervals,meanFrameIntervalMs:intervals.length?intervals.reduce((a,b)=>a+b)/intervals.length:null,transfers:performance.getEntriesByType('resource').filter(r=>r.name.endsWith('.glb')).map(r=>({file:r.name.split('/').at(-1),bytes:r.encodedBodySize,durationMs:r.duration}))};});report.performance.push({name,expectedModules:expected.length,expectedBytes:expected.reduce((s,a)=>s+a.bytes,0),metrics:await h.metrics(),...timing});console.log('MEASURE',name);}
try{await withinQaDeadline(async()=>{
 console.log('OPEN baseline');await goto(['skeletal']);const baselineCanvas=await page.locator('canvas').count();await page.evaluate(()=>{window.__completionCanvas=document.querySelector('canvas');});console.log('READY baseline');
 if(!skipOwners) for(const node of selection.nodes.filter(n=>n.sourceElements)){
  if(!report.ownerCount||report.ownerCount<3)console.log('OWNER',node.id);
  await choose(node.id);await page.waitForFunction(id=>window.__med3dAtlasScene().parts.some(p=>p.id===id),node.id);await action('Aislar');assert.ok((await snapshot()).parts.filter(p=>p.visible).every(p=>p.id===node.id));await action('Ocultar');assert.equal((await snapshot()).parts.filter(p=>p.visible).length,0);await action('Mostrar');assert.ok((await snapshot()).parts.some(p=>p.visible&&p.id===node.id));
  if(node.assetIds.some(id=>!pickedModules.has(id))){
   await action('Enfocar');await page.waitForTimeout(700);const canvas=page.locator('.atlas-canvas canvas'),box=await canvas.boundingBox();
   await action('Deseleccionar');let hit=false,hover=false;
   for(const p of (await snapshot()).parts.filter(p=>p.id===node.id).flatMap(p=>p.screenSamples)){
    if(Math.abs(p[0])>.95||Math.abs(p[1])>.95||p[2]<-1||p[2]>1)continue;
    const x=box.x+(p[0]+1)*box.width/2,y=box.y+(1-p[1])*box.height/2;
    await page.mouse.move(x,y);await page.waitForTimeout(80);hover=(await snapshot()).parts.some(p=>p.id===node.id&&p.emissiveIntensity>0);
    await page.mouse.click(x,y);await page.waitForTimeout(100);
    if(await page.evaluate(()=>document.querySelector('.atlas-detail-content h2')?.textContent)===node.name){hit=true;break;}
   }
   assert.ok(hit,'Real click '+node.id);assert.ok(hover,'Real hover '+node.id);node.assetIds.forEach(id=>pickedModules.add(id));
  }
  if(await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ver conjunto',exact:true}).isVisible())await action('Ver conjunto');
  assert.equal(await page.locator('canvas').count(),baselineCanvas);assert.ok(await page.evaluate(()=>document.querySelector('canvas')===window.__completionCanvas),'Same Canvas DOM object');
  if(report.ownerCount===undefined)report.ownerCount=0;report.ownerCount++;if(report.ownerCount%20===0)console.log('OWNERS',report.ownerCount);
 }
 if(skipOwners){const previous=JSON.parse(await readFile(path.join(output,'qa.json'),'utf8'));assert.ok(previous.checks.includes('Every new owner: source-ID search, lazy load, selection, isolate, hide, restore and card without remount'));report.ownerChecksFrom=previous.date;}
 check('Every new owner: source-ID search, lazy load, selection, isolate, hide, restore and card without remount');
 report.realPickedModules=[...pickedModules];
 const captures=wave==='wave2'?[
 ['bp3d:FMA46286','01-neck','anterior'],['bp3d:FMA38507','02-forearm','posterior'],['bp3d:FMA65198','03-hand','anterior'],['bp3d:FMA22546','04-leg','anterior'],['bp3d:FMA72311','05-stylohyoid','left'],['bp3d:FMA258716','06-deep-brain','anterior'],['bp3d:FMA78454','07-ventricles','posterior'],['resp:FMA46590','08-larynx','posterior'],['resp:FMA46632','09-pharynx','right'],['bp3d:FMA7260','10-papillary','anterior'],['bp3d:FMA3818','11-coronary','anterior'],['dig:FMA16549','12-mesoappendix','anterior'],['ocular:FMA58300','13-choroid','posterior'],['ocular:FMA59103','14-lacrimal','anterior'],['integ:FMA54241','15-hair','posterior']
 ]:[['bp3d:FMA13295','01-diaphragm-context','anterior'],['bp3d:FMA9756','02-intercostals','posterior'],['dig:FMA55699','03-dentition','anterior'],['bp3d:FMA22340','04-hip','posterior'],['bp3d:FMA45858','05-pelvic-floor','inferior'],['ocular:FMA49044','06-orbit','anterior'],['ocular:FMA58242','07-lens','right'],['ocular:FMA58607','08-retina','posterior'],['bp3d:FMA83966','09-tentorium','posterior'],['bp3d:FMA20801','10-femoral-branches','anterior']];
 for(const [id,name,view] of captures){
  if(!byId.has(id))continue;await choose(id);await page.getByRole('button',{name:'Mostrar contexto',exact:true}).click();await page.waitForTimeout(650);await h.view(view);await shot(name);
 }
 await choose(wave==='wave2'?'bp3d:FMA65198':'bp3d:FMA45858');await action('Aislar');await h.view('anterior');await shot('16-detail-isolated');await action('Ver conjunto');
 for(const level of ['systems','regions','structures']){await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),35);await page.waitForTimeout(1000);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),0);await page.waitForFunction(()=>window.__med3dAtlasScene().parts.every(p=>p.position.every((v,i)=>v===p.restPosition[i])),undefined,{timeout:120000});}check('All explosion modes return to exact rest');
 await measure('first-load-default',assets.filter(a=>a.systemId!=='integumentary').map(a=>a.systemId).filter((x,i,a)=>a.indexOf(x)===i));
 await measure('isolated-muscular-with-additions',['muscular'],assets.filter(a=>a.systemId==='muscular').map(a=>a.id));
 await measure('multiple-systems',['skeletal','muscular','nervous'],assets.filter(a=>['skeletal','muscular','nervous'].includes(a.systemId)).map(a=>a.id));
 await measure('full-without-skin',[...new Set(assets.map(a=>a.systemId))],assets.filter(a=>a.id!=='integumentary:skin').map(a=>a.id));
 await measure('full-with-skin',cats.map(c=>c.assets[0]?.systemId).filter(Boolean),assets.map(a=>a.id));
 assert.equal(report.performance[0].metrics.meshCount,936);check('Default load unchanged; skin and added modules remain off');
 const mobileId=wave==='wave2'?'ocular:FMA59103':'ocular:FMA58242';
 await goto(['skeletal']);await page.setViewportSize({width:390,height:844});await choose(mobileId);await page.getByRole('button',{name:'Inspección',exact:true}).click();assert.ok(await page.getByRole('region',{name:'Información anatómica de '+byId.get(mobileId).name}).isVisible());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('17-mobile-card');check('Mobile optional selection and educational panel');
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
},1800000,'Completion '+wave);}
catch(error){report.success=false;report.error=error.stack;console.error(error.stack);await page.screenshot({path:path.join(output,'failure.png'),timeout:5000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
