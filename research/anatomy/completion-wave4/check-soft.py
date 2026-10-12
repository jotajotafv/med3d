import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent
plan=json.loads((out/'candidate-plan.json').read_text());geo=np.load(out/'source-geometry.npz');reg=json.loads((out/'registration.json').read_text());soft=json.loads((out/'target-soft.json').read_text())
trees={}
for key,data in soft.items():
 if data['system']=='nervous':continue
 v=np.asarray(data['vertices']);trees[key]=dict(data=data,lo=v.min(0),hi=v.max(0),tree=BVHTree.FromPolygons(data['vertices'],data['faces'],all_triangles=True))
directions=[Vector(v).normalized() for v in [(1,.173,.367),(.291,1,.419),(.137,.233,1)]]
def inside(point,tree):
 votes=0
 for direction in directions:
  start=Vector(point);count=0
  for _ in range(128):
   hit=tree.ray_cast(start,direction,3.)
   if hit[0] is None:break
   count+=1;start=hit[0]+direction*.0000005
  if count%2:votes+=1
 return votes==3
rows=[]
for i,c in enumerate(plan['candidates']):
 name=c['sourceObject']
 if name+'__p' not in geo:continue
 M=np.asarray(reg['regions'][c['region']]['matrix']);p=geo[name+'__p'][np.unique(geo[name+'__f'])];p=p@M[:3,:3].T+M[:3,3];p=np.unique(np.round(p,10),axis=0);p=p[::max(1,int(np.ceil(len(p)/2048)))];lo=p.min(0);hi=p.max(0)
 skin=trees['integ:FMA7163'];outside=[];contacts=[]
 for q in p:
  nearest=skin['tree'].find_nearest(Vector(q))
  if not inside(q,skin['tree']):outside.append(nearest[3])
 for key,data in trees.items():
  if data['data']['system']=='integumentary' or any(g.startswith('nervous') for g in c['gaps']):continue
  if np.any(lo>data['hi']) or np.any(hi<data['lo']):continue
  candidate=p[((p>=data['lo'])&(p<=data['hi'])).all(1)];depths=[];worst=None
  for q in candidate:
   nearest=data['tree'].find_nearest(Vector(q));depth=nearest[3]
   if depth<.00001 or not inside(q,data['tree']):continue
   depths.append(depth)
   if worst is None or depth>worst['depthMm']/1000:worst=dict(depthMm=depth*1000,point=q.tolist(),surface=list(nearest[0]))
  if depths:contacts.append(dict(target=key,name=data['data']['name'],samples=len(depths),over1mm=sum(d>.001 for d in depths),maxDepthMm=max(depths)*1000,deepest=worst))
 row=dict(sourceObject=name,samples=len(p),outsideSkinTissueSamples=len(outside),distanceToSkinTissueMm=max(outside,default=0)*1000,contacts=sorted(contacts,key=lambda r:-r['maxDepthMm']));rows.append(row)
 if i%20==0:print('Soft checked',i+1,flush=True)
 if any(d['maxDepthMm']>3 for d in contacts):print('REVIEW',name,'worst soft',round(row['contacts'][0]['maxDepthMm'],2) if contacts else 0,flush=True)
(out/'soft-screen.json').write_text(json.dumps(dict(method='Original current soft tissues; deterministic used-vertex sampling; three parity directions, maximum sampled nearest-surface depth. Skin is a volumetric shell: parity measures skin tissue occupancy, NOT body enclosure. Expected physiological interfaces require separate interpretation.',results=rows),indent=2),encoding='utf-8')
print('Complete soft screen',len(rows),flush=True)
