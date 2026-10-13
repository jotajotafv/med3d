/** Final read-only geometry campaign: every active completion GLB and original SWC. */
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const output=path.resolve('.cache/anatomy-completion/final');fs.mkdirSync(output,{recursive:true});
const results=[];
function run(name,script,args=[],extraEnv={}){
 const log=path.join(output,name+'.log'),fd=fs.openSync(log,'w');console.log('RUN',name);
 try{execFileSync(process.execPath,[script,...args],{windowsHide:true,env:{...process.env,NODE_OPTIONS:'',...extraEnv},stdio:['ignore',fd,fd]});results.push({name,command:[process.execPath,script,...args],status:'PASS',log});console.log('PASS',name);}
 catch(error){results.push({name,status:'FAIL',log});throw error;}
 finally{fs.closeSync(fd);fs.writeFileSync(path.join(output,'geometry-campaign.json'),JSON.stringify({readOnly:true,results},null,2)+'\n');}
}
for(const wave of [1,2,4]){
 const prefix='research/anatomy/completion-wave'+wave;
 run('geometry-wave'+wave,'scripts/anatomy/optimize-completion.mjs',['--verify-only','--output',prefix,'--source',prefix+'-originals.zip']);
 run('gltf-wave'+wave,'scripts/anatomy/validate-completion-gltf.mjs',[],{COMPLETION_CATALOG:prefix+'/catalog.json',QA_OUTPUT_DIR:path.join(output,'gltf-wave'+wave)});
}
run('geometry-wave3','scripts/anatomy/build-completion-registered.mjs',['--verify-only']);
run('geometry-micro','scripts/anatomy/build-micro-glomerulus.mjs',['--verify-only']);
run('micro-tests','scripts/anatomy/micro.test.mjs');
console.log('All active original-to-derived and compressed/decoded checks passed; no model rebuilt.');
