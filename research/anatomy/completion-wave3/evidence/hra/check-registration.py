import json,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;root=out.parents[3]
plan=json.loads((out/'candidate-plan.json').read_text(encoding='utf-8'))
geo=np.load(out/'source-geometry.npz')
registration=json.loads((out/'registration.json').read_text(encoding='utf-8'))
bp=json.loads((root/'.cache/phase4-expansion/bp-reference.json').read_text(encoding='utf-8'))
controls=json.loads((out/'target-bones.json').read_text(encoding='utf-8'))
trees=[]
for bone in controls:
 data=bp[bone['id']];v=np.asarray(data['vertices']);lo=v.min(0);hi=v.max(0)
 assert np.max(np.abs(np.array([lo,hi])-np.asarray(bone['bounds'])))<.0002,bone['id']
 trees.append((bone,lo,hi,BVHTree.FromPolygons(data['vertices'],data['faces'],all_triangles=True)))
assert len(trees)==205
directions=[Vector(v).normalized() for v in [(1,.173,.367),(.291,1,.419),(.137,.233,1)]]
rows=[]
for index,candidate in enumerate(plan['candidates']):
 name=candidate['sourceObject'];region=candidate['region'];key=name+'__p'
 if key not in geo:
  rows.append(dict(sourceObject=name,region=region,emptySurface=True));continue
 M=np.asarray(registration['regions'][region]['matrix']);p=geo[key][np.unique(geo[name+'__f'])];p=p@M[:3,:3].T+M[:3,3]
 unique=np.unique(np.round(p,10),axis=0);samples=unique[::max(1,int(np.ceil(len(unique)/4096)))];contacts=[]
 for bone,lo,hi,tree in trees:
  if np.any(p.min(0)>hi) or np.any(p.max(0)<lo):continue
  nearpoints=samples[((samples>=lo)&(samples<=hi)).all(1)];inside=[];worst=None
  for point in nearpoints:
   closest=tree.find_nearest(Vector(point));distance=closest[3]
   if distance<.00001:continue
   votes=0
   for direction in directions:
    start=Vector(point);count=0
    for _ in range(128):
     hit=tree.ray_cast(start,direction,3.)
     if hit[0] is None:break
     count+=1;start=hit[0]+direction*.0000005
    if count%2:votes+=1
   if votes==3:
    inside.append(distance)
    if worst is None or distance>worst['depthMm']/1000:worst=dict(depthMm=float(distance*1000),point=point.tolist(),surface=list(closest[0]))
  if inside:contacts.append(dict(bone=bone['id'],name=bone['name'],sampleCount=len(inside),over1mm=sum(v>.001 for v in inside),over3mm=sum(v>.003 for v in inside),maxDepthMm=max(inside)*1000,deepest=worst))
 contacts.sort(key=lambda row:-row['maxDepthMm'])
 row=dict(sourceObject=name,gaps=candidate['gaps'],region=region,samples=len(samples),bounds=[p.min(0).tolist(),p.max(0).tolist()],sideMedianX=float(np.median(p[:,0])),contacts=contacts,maxDepthMm=max([c['maxDepthMm'] for c in contacts],default=0))
 rows.append(row)
 if index%20==0:print('Checked',index+1,'/',len(plan['candidates']),flush=True)
 if row['maxDepthMm']>3:print('REVIEW',name,round(row['maxDepthMm'],2),contacts[0]['name'],flush=True)
result=dict(method='Fresh global similarity plus regional rigid; up to 4096 deterministic unique used vertices; three ray-parity votes within each original bone; closest-surface sampled depth. No deformation or piece-specific fit. Open surfaces and sparse sampling require visual review; not clinical accuracy.',bones=len(trees),results=rows)
result['inputs']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [out/'source-geometry.npz',out/'candidate-plan.json',out/'registration.json',out/'target-bones.json']}
(out/'bone-screen.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print('Complete',len(rows),'candidate records',flush=True)
