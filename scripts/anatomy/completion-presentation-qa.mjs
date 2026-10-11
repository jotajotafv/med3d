import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project} from './browser-qa.mjs';
const h=await createHarness({output:'.cache/anatomy-completion/wave1/presentation',viewport:{width:1366,height:900}}),{page,output}=h;
const report={checks:[],captures:[],metrics:[],errors:h.errors,badRequests:h.badRequests};
async function choose(id){const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});if(!await input.isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();await input.fill(id.split(':').at(-1));await page.locator('.atlas-search-result[data-node-id="'+id+'"]').click();await page.waitForTimeout(900);}
async function action(name){await page.locator('.atlas-selection-actions').getByRole('button',{name,exact:true}).click();await page.waitForTimeout(600);}
async function shot(name){await page.screenshot({path:path.join(output,name+'.png')});report.captures.push(name+'.png');console.log('CAPTURE',name);}
try{
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=nervous&modules=nervous:completion-ocular-internal,nervous:completion-tentorium');await h.waitMeshes(5);
 for(const [id,name,view] of [['ocular:FMA58242','13-lens-isolated','anterior'],['ocular:FMA58607','14-retina-isolated','anterior'],['bp3d:FMA83966','15-tentorium-isolated','superior']]){await choose(id);await action('Aislar');await h.view(view);await shot(name);await action('Ver conjunto');}
 await page.goto(h.origin+'/med3d/anatomia/?qa=1&systems=digestive&modules=digestive:completion-dentition');await h.waitMeshes(28);await choose('dig:FMA57143');await h.view('superior');for(let i=0;i<7;i++)await page.getByRole('button',{name:'Alejar',exact:true}).click();await page.waitForTimeout(900);await shot('16-dentition-28');
 const input=page.getByRole('textbox',{name:'Buscar estructura anatómica'});if(!await input.isVisible())await page.getByRole('button',{name:'Estructuras',exact:true}).click();await input.fill('');await page.getByRole('button',{name:'Capas',exact:true}).click();
 const selection=JSON.parse(await readFile('research/anatomy/completion-wave1-selection.json','utf8'));for(const asset of selection.modules){const el=page.locator('[data-asset-id="'+asset.id+'"]');assert.equal((await el.locator('span').textContent()).trim(),asset.label);}
 await page.locator('[data-asset-id="digestive:completion-dentition"]').scrollIntoViewIfNeeded();await shot('17-optional-module-labels');report.checks.push('Every new module has its curated accessible label');
 for(const [name,systems,modules] of [['default',null,null],['muscular','muscular','all'],['several','skeletal,muscular,nervous','all'],['complete-no-skin','skeletal,muscular,nervous,cardiovascular,respiratory,digestive,urinary,endocrine,lymphatic,reproductive','all'],['complete-skin','skeletal,muscular,nervous,cardiovascular,respiratory,digestive,urinary,endocrine,lymphatic,reproductive,integumentary','all']]){
  const cats=await Promise.all(['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary','ocular'].map(async s=>JSON.parse(await readFile('dist/models/anatomy/'+s+'/catalog.json','utf8'))));const assets=cats.flatMap(c=>c.assets).filter(a=>(systems?systems.split(',').includes(a.systemId):a.systemId!=='integumentary')&&(modules||a.defaultEnabled!==false));
  await page.goto(h.origin+'/med3d/anatomia/?qa=1'+(systems?'&systems='+systems:'')+(modules?'&modules='+assets.map(a=>a.id).join(','):''));await h.waitMeshes(assets.reduce((n,a)=>n+a.meshCount,0));await page.waitForTimeout(800);const metrics=await h.metrics();assert.ok(Number.isFinite(metrics.renderCpuMs)&&metrics.renderCpuMs>0);report.metrics.push({name,...metrics,cpuScope:'Published render submission duration; excludes GPU completion'});console.log('CPU',name,metrics.renderCpuMs);
 }
 await page.setViewportSize({width:390,height:844});await choose('ocular:FMA58242');await page.getByRole('button',{name:'Inspección',exact:true}).click();const lesson=page.getByRole('region',{name:'Información anatómica de Cristalino derecho'});await lesson.scrollIntoViewIfNeeded();assert.ok(await lesson.getByText('Lens dextra',{exact:true}).isVisible());await shot('18-mobile-lesson');
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
}finally{await writeFile(path.join(output,'qa.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
