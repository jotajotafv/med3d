// Targeted investigation of the 116 s full-load observation, without retesting
// historical behavior or rerunning the global regression or exploded benchmark.
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {createHarness} from '../../scripts/anatomy/browser-qa.mjs';
const h=await createHarness({viewport:{width:1366,height:768}}),report={codeCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),date:new Date().toISOString(),reason:'Investigate full atlas load outlier against unchanged six-system assets in the same final build',renderer:'ANGLE SwiftShader software WebGL',comparisons:[],errors:h.errors,badRequests:h.badRequests};
try{
 for(const [name,systems,count] of [['six-historical','skeletal,muscular,nervous,cardiovascular,respiratory,digestive',898],['ten-final','skeletal,muscular,nervous,cardiovascular,respiratory,digestive,urinary,endocrine,lymphatic,reproductive',930]]){
  const start=performance.now();await h.page.goto(h.origin+'/med3d/anatomia/?qa=1&systems='+systems,{waitUntil:'domcontentloaded'});await h.waitMeshes(count);const metrics=await h.metrics();report.comparisons.push({name,wallMs:performance.now()-start,metrics});console.log(name,JSON.stringify(metrics));await h.page.goto('about:blank');
 }
 assert.deepEqual(h.errors,[]);assert.deepEqual(h.badRequests,[]);report.success=true;
}catch(error){report.success=false;report.error=error.stack;throw error;}
finally{await writeFile(path.join(h.output,'load-comparison.json'),JSON.stringify(report,null,2)+'\n');await h.close();}
