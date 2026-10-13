// Official MediaPipe test photographs, QA input only. Never copied into public/ or anatomy.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export const fixtureInputs=[
  {name:'pointing_up.jpg',sha256:'ecf8ca2611d08fa25948a4fc10710af9120e88243a54da6356bacea17ff3e36e'},
  {name:'fist.jpg',sha256:'43fa1cabf3f90d574accc9a56986e2ee48638ce59fc65af1846487f73bb2ef24'},
  {name:'thumb_up.jpg',sha256:'5d673c081ab13b8a1812269ff57047066f9c33c07db5f4178089e8cb3fdc0291'},
  {name:'right_hands.jpg',sha256:'4b5134daa4cb60465535239535f9f74c2842aba3aa5fd30bf04ef5678f93d87f'},
].map(a=>({...a,url:'https://storage.googleapis.com/mediapipe-assets/'+a.name}));
export async function prepareInputs(){
  const output='.cache/xr-gesture-acceptance/input';await mkdir(output,{recursive:true});
  for(const asset of fixtureInputs){
    let bytes=await readFile(output+'/'+asset.name).catch(()=>null);
    if(!bytes){const response=await fetch(asset.url,{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(asset.url+': '+response.status);bytes=Buffer.from(await response.arrayBuffer());}
    if(createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Unexpected QA fixture hash: '+asset.name);
    await writeFile(output+'/'+asset.name,bytes);
  }
  await writeFile(output+'/assets.json',JSON.stringify(fixtureInputs,null,2)+'\n');
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/gesture-acceptance-inputs.mjs'))await prepareInputs();
