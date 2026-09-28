// Targeted continuation after the legacy suite checked h1 before lazy content rendered.
// Run from repo root: node docs/phase5/recheck-routes.mjs
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createHarness,project,withinQaDeadline} from '../../scripts/anatomy/browser-qa.mjs';
const h=await createHarness({output:process.env.QA_OUTPUT_DIR||path.join(project,'.cache/phase5/browser/routes-continuation')});
const report={codeCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:project,encoding:'utf8'}).trim(),date:new Date().toISOString(),reason:'Legacy immediate h1 count raced lazy route rendering at procedimientos/vendaje. Original failure report retained; only affected and not-yet-run route checks repeated with bounded visibility wait.',routes:[],errors:h.errors,badRequests:h.badRequests};
try{await withinQaDeadline(async()=>{
 for(const route of ['procedimientos/vendaje','procedimientos/inmovilizacion','primeros-auxilios/rcp','primeros-auxilios/atragantamiento','primeros-auxilios/hemorragias','primeros-auxilios/quemaduras','primeros-auxilios/fracturas','primeros-auxilios/desmayos','primeros-auxilios/convulsiones','primeros-auxilios/botiquin']){
  await h.page.goto(h.origin+'/med3d/'+route);const title=h.page.locator('h1');await title.waitFor({state:'visible',timeout:30000});assert.ok(await title.count());report.routes.push({route,title:await title.textContent()});console.log('PASS route',route);
 }
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
},300000,'Remaining static routes');}catch(error){report.success=false;report.error=error.stack;throw error;}
finally{await writeFile(path.join(h.output,'routes-continuation.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
