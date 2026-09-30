// Bounded sampled geometry audit. No modifications, decimation or inferred anatomy.
import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {pathToFileURL} from 'node:url';import {spawnSync} from 'node:child_process';
const root=process.cwd(),out=path.join(root,'.cache/phase10');await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));const imp=n=>import(pathToFileURL(require.resolve(n)).href);
const [{NodeIO},{ALL_EXTENSIONS},{MeshoptDecoder}]=await Promise.all([imp('@gltf-transform/core'),imp('@gltf-transform/extensions'),imp('meshoptimizer')]);await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});const samples=[];
for(const system of ['muscular','nervous','cardiovascular','ocular']){
 const cat=JSON.parse(await fs.readFile(path.join(root,'public/models/anatomy',system,'catalog.json'),'utf8'));const owners=new Map(cat.nodes.flatMap(n=>n.meshNames.map(name=>[name,n])));
 for(const asset of cat.assets){const doc=await io.read(path.join(root,'public',asset.path));
  for(const node of doc.getRoot().listNodes()){if(!node.getMesh())continue;const owner=owners.get(node.getName());if(!owner)throw Error('Missing owner '+node.getName());const matrix=node.getWorldMatrix();const points=[];
   for(const primitive of node.getMesh().listPrimitives()){const position=primitive.getAttribute('POSITION'),indices=primitive.getIndices();if(!indices)throw Error('Expected indexed source');
    for(let i=0;i<32;i++){const first=Math.floor(i*(indices.getCount()/3-1)/31)*3,p=[0,0,0];for(let j=0;j<3;j++){const v=position.getElement(indices.getScalar(first+j),[]);for(let k=0;k<3;k++)p[k]+=v[k]/3;}
     points.push([matrix[0]*p[0]+matrix[4]*p[1]+matrix[8]*p[2]+matrix[12],matrix[1]*p[0]+matrix[5]*p[1]+matrix[9]*p[2]+matrix[13],matrix[2]*p[0]+matrix[6]*p[1]+matrix[10]*p[2]+matrix[14]]);
    }
   }
   samples.push({id:owner.id,name:owner.name,sourceId:owner.sourceId,system:owner.systemId,region:owner.regionId,asset:asset.id,mesh:node.getName(),points});
  }
 }
}
await fs.writeFile(path.join(out,'skin-interior-samples.json'),JSON.stringify(samples));
const result=spawnSync(process.env.ANATOMY_PYTHON||'python',['-X','utf8','scripts/anatomy/audit-skin-projection.py'],{stdio:'inherit'});if(result.status!==0)throw Error('Projection audit failed');
