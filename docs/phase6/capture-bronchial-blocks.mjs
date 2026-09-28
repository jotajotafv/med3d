// Supplemental evidence for the bounded structure-explosion correction.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,setSlider} from '../../scripts/anatomy/browser-qa.mjs';
const h=await createHarness({output:'docs/phase6/captures',viewport:{width:1440,height:900},reducedMotion:'reduce'});
const {page}=h;
try{
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=respiratory&modules=respiratory:airway');await h.waitMeshes(101);
 await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('Vías respiratorias inferiores');await page.locator('[data-node-id="resp:lower"]').click();
 await page.getByRole('combobox',{name:'Nivel de despiece'}).selectOption('structures');await setSlider(page.getByRole('slider',{name:'Separación de piezas'}),100);
 await page.waitForFunction(()=>window.__med3dAtlasScene().parts.every(p=>p.position.every((x,i)=>x===p.targetPosition[i])));
 await page.getByRole('button',{name:'Enfocar',exact:true}).click();await h.view('anterior');await page.getByRole('button',{name:'Deseleccionar',exact:true}).click();await page.mouse.move(10,10);await page.waitForTimeout(200);
 const file='30-exploded-bronquios-principales.png';await page.screenshot({path:path.join(h.output,file)});
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);
 await writeFile(path.join(h.output,'supplemental-capture.json'),JSON.stringify({codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),success:true,file,viewport:page.viewportSize(),note:'Only the airway module at 100 percent opacity; trachea and coherent right/left main-bronchial blocks at full Structures explosion.',metrics:await h.metrics()},null,2)+'\n');
}finally{await h.close();}
