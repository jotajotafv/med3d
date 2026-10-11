import json,struct,numpy as np
from pathlib import Path
out=Path(__file__).parent;root=out.parents[3]
plan=json.loads((out/'candidate-plan.json').read_text())
source=np.load(out/'source-geometry.npz');reg=json.loads((out/'registration.json').read_text())
bp=json.loads((root/'.cache/phase4-expansion/bp-reference.json').read_text())
bones=json.loads((out/'target-bones.json').read_text())
refs=json.loads((out/'reference-plan.json').read_text())['pairs']
def glb(path,parts):
 binary=bytearray();views=[];accessors=[];meshes=[];nodes=[]
 def add(array,component,kind,target):
  while len(binary)%4:binary.append(0)
  offset=len(binary);binary.extend(array.tobytes());views.append(dict(buffer=0,byteOffset=offset,byteLength=array.nbytes,target=target))
  a=dict(bufferView=len(views)-1,componentType=component,count=len(array),type=kind)
  if kind=='VEC3':a.update(min=array.min(0).tolist(),max=array.max(0).tolist())
  accessors.append(a);return len(accessors)-1
 for name,positions,faces,extras in parts:
  p=np.asarray(positions,dtype='<f4');f=np.asarray(faces,dtype='<u4');normal=np.zeros_like(p);t=p[f];n=np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0])
  for k in range(3):np.add.at(normal,f[:,k],n)
  lengths=np.linalg.norm(normal,axis=1);normal[lengths>0]/=lengths[lengths>0,None];normal[lengths==0]=[0,1,0]
  pos=add(p,5126,'VEC3',34962);nor=add(normal,5126,'VEC3',34962);ix=add(f.ravel(),5125,'SCALAR',34963)
  meshes.append(dict(name=name,primitives=[dict(attributes=dict(POSITION=pos,NORMAL=nor),indices=ix,material=0)]));nodes.append(dict(name=name,mesh=len(meshes)-1,extras=extras))
 doc=dict(asset=dict(version='2.0',generator='MED3D unapproved registration QA'),buffers=[dict(byteLength=len(binary))],bufferViews=views,accessors=accessors,meshes=meshes,nodes=nodes,scenes=[dict(nodes=list(range(len(nodes))))],scene=0,materials=[dict(pbrMetallicRoughness=dict(baseColorFactor=[.6,.6,.6,1],metallicFactor=0,roughnessFactor=.8),doubleSided=True)])
 raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary+=b'\0'*((-len(binary))%4)
 path.write_bytes(struct.pack('<4sII',b'glTF',2,12+8+len(raw)+8+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary)
def transform(p,M):return p@M[:3,:3].T+M[:3,3]
glb(out/'qa-target.glb',[(b['id'].replace(':','_'),bp[b['id']]['vertices'],bp[b['id']]['faces'],dict(boneId=b['id'],label=b['name'])) for b in bones])
for region,data in reg['regions'].items():
 parts=[]
 for mode,M in [('global',np.array(reg['globalSimilarity']['matrix'])),('regional',np.array(data['matrix']))]:
  for i,c in enumerate(plan['candidates']):
   name=c['sourceObject']
   if c['region']!=region or name+'__p' not in source:continue
   parts.append((mode+'_candidate_'+str(i),transform(source[name+'__p'],M),source[name+'__f'],dict(role='candidate',mode=mode,label=name,gaps=c['gaps'])))
  for i,name in enumerate(data['fittedBones']+data['heldOutBones']):
   parts.append((mode+'_reference_'+str(i),transform(source[name+'__p'],M),source[name+'__f'],dict(role='reference',mode=mode,label=name,boneId=next(r['target'] for r in refs if r['source']==name))))
 glb(out/('qa-'+region+'.glb'),parts)
 print('QA geometry',region,len(parts),flush=True)
