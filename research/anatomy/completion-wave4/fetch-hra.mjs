import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const out=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'));
const hash=b=>createHash('sha256').update(b).digest('hex');
const names=process.argv.length>2?process.argv.slice(2):['kidney-male-left','kidney-male-right','ureter-male-left','ureter-male-right','renal-pelvis-male-left','renal-pelvis-male-right','lymph-node-male','male-reproductive-system','skin-male','integumentary-system-male','adipose-male','large-intestine-male','pancreas-male'];
let records=[];try{records=JSON.parse(await fs.readFile(path.join(out,'hra-source-lock.json'))).records.filter(r=>!names.includes(r.name));}catch(e){if(e.code!=='ENOENT')throw e;}
async function get(url,file){try{return await fs.readFile(file);}catch(e){if(e.code!=='ENOENT')throw e;}const r=await fetch(url,{signal:AbortSignal.timeout(90000)});if(!r.ok)throw Error(r.status+' '+url);const b=Buffer.from(await r.arrayBuffer());await fs.writeFile(file,b);return b;}
for(let i=0;i<names.length;i+=3)await Promise.all(names.slice(i,i+3).map(async name=>{
const dir=path.join(out,'hra',name);await fs.mkdir(dir,{recursive:true});
const metadataUrl='https://cdn.humanatlas.io/digital-objects/ref-organ/'+name+'/latest/metadata.json';
try{const metaBytes=await get(metadataUrl,path.join(dir,'metadata.json')),meta=JSON.parse(metaBytes),source=meta.was_derived_from; if(!source||!/by\/4.0|CC BY 4.0/.test(source.license))throw Error('Asset license not verified');
const record={name,id:meta.id,metadataUrl,metadataSha256:hash(metaBytes),metadataBytes:metaBytes.length,source,files:[]};
for(const d of source.distributions.filter(d=>/model\/gltf-binary|text\/csv/.test(d.mediaType))){if(/female/i.test(d.downloadUrl))throw Error('Excluded source');const file=path.basename(new URL(d.downloadUrl).pathname),b=await get(d.downloadUrl,path.join(dir,file));const entry={file,url:d.downloadUrl,sha256:hash(b),bytes:b.length};if(file.endsWith('.glb')){const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));entry.meshes=g.meshes?.length;entry.nodes=g.nodes?.map(n=>({name:n.name,mesh:n.mesh,translation:n.translation,scale:n.scale,matrix:n.matrix}));}record.files.push(entry);}
records.push(record);console.log(name,meta.version,record.files.map(f=>f.file+':'+f.bytes).join(' '));
}catch(error){records.push({name,metadataUrl,error:error.message});console.log('REVIEW',name,error.message);}
}));
await fs.writeFile(path.join(out,'hra-source-lock.json'),JSON.stringify({date:new Date().toISOString(),scope:'Male assets only; original byte copies retained. No integration or registration asserted.',records},null,2)+'\n');
