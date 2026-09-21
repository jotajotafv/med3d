// Reproducible camera and UI states. Screenshots are evidence for human review,
// never a substitute for anatomical inspection or an automatic approval gate.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHarness, project, setSlider, withinQaDeadline } from './browser-qa.mjs';

const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'docs/phase2.1/captures'),viewport:{width:1440,height:900},reducedMotion:'reduce'});
const {page,output,choose,reset,view,metrics,catalog}=h;
const report={date:new Date().toISOString(),source:'MED3D local production build',environment:'Headless Chromium, ANGLE SwiftShader; DPR 1. Human inspection required.',reducedMotion:'reduce',captureMethod:'The supported reduced-motion preference captures final poses deterministically. Functional and performance runs retain normal animation.',captures:[],errors:h.errors};
const shot=async (name,note='')=>{
  await page.mouse.move(10,10);await page.waitForTimeout(180);
  await page.screenshot({path:path.join(output,name+'.png'),fullPage:false});
  report.captures.push({file:name+'.png',viewport:page.viewportSize(),selection:await page.locator('.atlas-detail-content h2').textContent(),note,metrics:await metrics()});
  console.log('CAPTURE',name);
};
const zoomOut=async count=>{for(let i=0;i<count;i++){await page.getByRole('button',{name:'Alejar',exact:true}).click();await page.waitForTimeout(400);}await page.waitForTimeout(700);};
const group=async (id,direction='anterior')=>{const node=catalog.nodes.find(node=>node.id===id);assert.ok(node,'Required catalog group: '+id);await choose(node.name,id);await view(direction);};
const explode=async(level,value)=>{await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption(level);await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),value);await page.waitForTimeout(1500);};
try{
  await withinQaDeadline(async()=>{
  await page.goto(h.origin+'/med3d/anatomia/?systems=skeletal',{waitUntil:'domcontentloaded'});await h.waitMeshes(h.expectedMeshes);await page.waitForTimeout(1200);
  await view('anterior');await shot('01-esqueleto-frontal','Normal; no selection. Inspect complete frame, bilateral alignment and coverage.');
  await view('posterior');await shot('02-esqueleto-posterior');
  await view('left');await shot('03-lateral-izquierda','Left means the specimen’s anatomical left.');
  await view('right');await shot('04-lateral-derecha','Right means the specimen’s anatomical right.');
  await group('skeletal:group:skull:neurocranium','superior');await shot('05-craneo-superior');
  await group('skeletal:group:skull:neurocranium','inferior');await shot('06-craneo-inferior','Opaque mandible and spine can occlude this contextual inferior axis; compare the explicitly isolated neurocranium capture32.');
  await group('skeletal:region:skull');await shot('07-craneo-frontal');
  await group('skeletal:region:spine','posterior');await shot('08-columna');
  await group('skeletal:region:thorax');await shot('09-caja-toracica');
  await choose('Sacro');await view('anterior');await zoomOut(4);await shot('10-pelvis','Sacro focus, four existing zoom-out steps; geometry remains in its registered source frame.');
  await group('skeletal:group:arm-left:handphalanges');await zoomOut(2);await shot('11-mano','Left hand phalanges focus expanded with two zoom-out steps.');
  await group('skeletal:group:leg-left:tarsals','left');await zoomOut(4);await shot('12-pie','Left foot in anatomical left lateral context. Four zoom-out steps encompass tarsals, metatarsals and phalanges without looking through the opaque tibia.');
  await choose('Fémur izquierdo');await view('anterior');await shot('13-femur-seleccionado');
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await h.waitDraws(1);await page.waitForTimeout(1000);await shot('14-femur-aislado');
  await reset();await view('anterior');await explode('regions',100);await shot('15-exploded-regiones');
  await reset();await view('anterior');await explode('structures',100);await shot('16-exploded-estructuras');
  for(const [id,name,direction] of [
    ['skeletal:region:skull','17-craneo-exploded','anterior'],
    ['skeletal:region:spine','18-columna-exploded','posterior'],
    ['skeletal:region:thorax','19-torax-exploded','anterior'],
    ['skeletal:group:arm-left:handphalanges','20-mano-exploded','anterior'],
    ['skeletal:group:leg-left:tarsals','21-pie-exploded','superior'],
  ]){
    await reset();await group(id,direction);
    const isolated=name==='21-pie-exploded';
    if(isolated){await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await page.waitForTimeout(350);}
    await explode('structures',100);await shot(name,'100% structure separation, deterministic hierarchical bounds.'+(isolated?' Left tarsal group explicitly isolated; opaque tibial context would occlude the superior view.':''));
  }
  await reset();await choose('Escafoides izquierdo');await view('anterior');await zoomOut(3);await shot('22-carpo-seleccionado','Dense region selection, normal system opacity.');
  await setSlider(page.locator('#skeletal-opacity'),35);await page.waitForTimeout(500);await shot('23-carpo-transparente','System opacity 35%; selected structure retained.');
  await setSlider(page.locator('#skeletal-opacity'),100);
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ocultar',exact:true}).click();await page.waitForTimeout(500);await shot('24-carpo-oculto');
  await reset();await choose('Fémur izquierdo');await view('anterior');
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await h.waitDraws(1);await page.waitForTimeout(1000);
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Deseleccionar',exact:true}).click();
  const box=await page.locator('.atlas-canvas canvas').boundingBox();let hovered=false;
  for(const y of [.5,.43,.57,.35,.65]){for(const x of [.5,.46,.54,.42,.58]){
    await page.mouse.move(box.x+box.width*x,box.y+box.height*y);await page.waitForTimeout(50);
    if(await page.locator('.atlas-canvas canvas').evaluate(canvas=>canvas.style.cursor==='pointer')){hovered=true;break;}
  }if(hovered)break;}
  assert.ok(hovered,'Hover state must be observed on a real bone');
  await page.screenshot({path:path.join(output,'25-hover.png'),fullPage:false});
  report.captures.push({file:'25-hover.png',viewport:page.viewportSize(),note:'Real raycast hover on an isolated femur; no selection.'});
  for(const [width,height,name] of [[1366,768,'26-laptop-1366'],[1050,844,'27-laptop-1050'],[900,1000,'28-tablet-900'],[390,844,'29-mobile']]){
    await reset();await page.setViewportSize({width,height});await page.waitForTimeout(1200);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No page horizontal overflow: '+width);
    await shot(name,'CSS viewport profile only, not a physical hardware measurement.');
  }
  await page.getByRole('button',{name:'Estructuras',exact:true}).click();await choose('Fémur izquierdo');
  await page.getByRole('button',{name:'Inspección',exact:true}).click();await page.waitForTimeout(350);await shot('30-mobile-ficha','Mobile educational panel, selected femur.');
  await page.getByRole('button',{name:'Cerrar inspección'}).click();
  await page.setViewportSize({width:1440,height:900});await reset();
  await group('skeletal:group:leg-left:tarsals','superior');
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await page.waitForTimeout(500);await shot('31-tarso-superior-aislado','Explicit isolation reveals the left tarsal group without opaque tibial context. This is a tarsal group, not the complete foot.');
  await reset();await group('skeletal:group:skull:neurocranium','inferior');
  await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await page.waitForTimeout(500);await shot('32-neurocraneo-inferior-aislado','Explicit isolation for studying the cranial base. Capture06 preserves the occluded contextual view for comparison.');
  assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.generated=true;
  },360000,'Visual capture generation');
}catch(error){report.error=error.stack;await page.screenshot({path:path.join(output,'visual-failure.png'),fullPage:false,timeout:5000}).catch(()=>{});throw error;}
finally{await writeFile(path.join(output,'capture-manifest.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
