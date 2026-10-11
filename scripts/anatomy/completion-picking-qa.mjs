import {createHarness} from './browser-qa.mjs';
import {writeFile} from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const h=await createHarness({output:'.cache/anatomy-completion/wave1/presentation',viewport:{width:1366,height:900}}),{page,output}=h;
try{
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=digestive&modules=digestive:completion-dentition');await h.waitMeshes(28);
 await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('FMA57143');await page.locator('[data-node-id="dig:FMA57143"]').click();await page.waitForTimeout(900);await h.view('superior');
 await page.screenshot({path:path.join(output,'16-dentition-focus.png')});
 for(let i=0;i<7;i++)await page.getByRole('button',{name:'Alejar',exact:true}).click();await page.waitForTimeout(1000);await page.screenshot({path:path.join(output,'16-dentition-28.png')});
 await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');await page.getByRole('button',{name:'Capas',exact:true}).click();const layer=page.locator('[data-asset-id="digestive:completion-dentition"]');await layer.scrollIntoViewIfNeeded();assert.ok(await layer.getByText('Dentición permanente · 28 piezas',{exact:true}).isVisible());await page.screenshot({path:path.join(output,'17-optional-module-labels.png')});
 await writeFile(path.join(output,'capture-corrections.json'),JSON.stringify({reason:'Focus the dental target while changing view; scroll the layers panel to the new module',meshCount:(await h.metrics()).meshCount,files:['16-dentition-focus.png','16-dentition-28.png','17-optional-module-labels.png'],errors:h.errors,badRequests:h.badRequests},null,2)+'\n');

 const picks=[];
 for(const id of ['bp3d:FMA13295','bp3d:FMA9756','dig:FMA55699','ocular:FMA58242','ocular:FMA58607','bp3d:FMA83966','bp3d:FMA20801']){
  await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill(id.split(':').at(-1));await page.locator('[data-node-id="'+id+'"]').click();await page.waitForTimeout(650);await page.locator('.atlas-selection-actions').getByRole('button',{name:'Aislar',exact:true}).click();await h.view(id==='bp3d:FMA83966'?'superior':'anterior');await page.locator('.atlas-selection-actions').getByRole('button',{name:'Deseleccionar',exact:true}).click();await page.waitForTimeout(250);
  const scene=await page.evaluate(()=>window.__med3dAtlasScene()),part=scene.parts.find(p=>p.id===id&&p.visible),box=await page.locator('.atlas-canvas canvas').boundingBox();assert.ok(part?.raycastEnabled);
  let hit=false;for(const point of [part.screenCenter,...part.screenSamples]){const x=box.x+(point[0]+1)*box.width/2,y=box.y+(1-point[1])*box.height/2;if(x<box.x+10||x>box.x+box.width-50||y<box.y+90||y>box.y+box.height-70)continue;await page.mouse.move(x,y);await page.waitForTimeout(100);await page.mouse.click(x,y);await page.waitForTimeout(200);if(await page.locator('.atlas-viewport').getAttribute('data-selected-id')===id){hit=true;break;}}assert.ok(hit,'Real canvas pointer raycast '+id);picks.push(id);await page.locator('.atlas-selection-actions').getByRole('button',{name:'Ver conjunto',exact:true}).click();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('');await page.getByRole('button',{name:'Capas',exact:true}).click();
 }
 await writeFile(path.join(output,'pointer-qa.json'),JSON.stringify({picks,method:'Real browser mouse events at projected actual triangle/centre candidates; asserted resulting application selected ID',errors:h.errors,badRequests:h.badRequests},null,2)+'\n');
}finally{await h.close();}
