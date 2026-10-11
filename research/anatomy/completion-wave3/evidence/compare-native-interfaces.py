import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;root=out.parents[2]
geo=np.load(out/'source-geometry.npz');reg=json.loads((out/'registration.json').read_text());refs=json.loads((out/'reference-plan.json').read_text())['pairs'];plan=json.loads((out/'candidate-plan.json').read_text());bp=json.loads((root/'.cache/phase4-expansion/bp-reference.json').read_text());screen=json.loads((out/'bone-screen.json').read_text())
dirs=[Vector(v).normalized() for v in [(1,.173,.367),(.291,1,.419),(.137,.233,1)]]
def inside(q,t):
 for direction in dirs:
  p=Vector(q);n=0
  for _ in range(128):
   h=t.ray_cast(p,direction,3.)
   if h[0] is None:break
   n+=1;p=h[0]+direction*.0000005
  if n%2==0:return False
 return True
trees={}
for r in refs:
 n=r['source'];trees[r['target']]=(r,BVHTree.FromPolygons(geo[n+'__p'].tolist(),geo[n+'__f'].tolist(),all_triangles=True),BVHTree.FromPolygons(bp[r['target']]['vertices'],bp[r['target']]['faces'],all_triangles=True))
rows=[]
for c in plan['candidates']:
 if not any(g in ['muscular-face','muscular-mastication'] for g in c['gaps']):continue
 name=c['sourceObject'];p=geo[name+'__p'][np.unique(geo[name+'__f'])];p=p[::max(1,int(np.ceil(len(p)/2048)))];M=np.array(reg['regions'][c['region']]['matrix']);q=p@M[:3,:3].T+M[:3,3];contacts=[]
 for b in next(r for r in screen['results'] if r['sourceObject']==name)['contacts']:
  if b['bone'] not in trees:contacts.append(dict(target=b['bone'],sourceControlAbsent=True));continue
  r,s,t=trees[b['bone']];rowsB=[]
  for a,v in zip(p,q):
   if not inside(v,t):continue
   depth=t.find_nearest(Vector(v))[3]*1000;d0=s.find_nearest(Vector(a))[3]*1000*(reg['globalSimilarity']['scale']);wasInside=inside(a,s)
   rowsB.append(dict(targetDepthMm=depth,sourceSignedDepthMm=d0 if wasInside else -d0,point=v.tolist()))
  if rowsB:
   contacts.append(dict(target=b['bone'],source=r['source'],sampleCount=len(rowsB),newContactSamples=sum(v['sourceSignedDepthMm']<0 for v in rowsB),maxTargetDepthMm=max(v['targetDepthMm'] for v in rowsB),maxSourceDepthAtTargetContactMm=max(v['sourceSignedDepthMm'] for v in rowsB),maxDepthIncreaseMm=max(v['targetDepthMm']-v['sourceSignedDepthMm'] for v in rowsB)))
 rows.append(dict(sourceObject=name,samples=len(p),contacts=contacts));print(name,'new',sum(r.get('newContactSamples',0) for r in contacts),flush=True)
(out/'source-v-target-interfaces.json').write_text(json.dumps(dict(method='Same candidate sample in original source bones versus corresponding target bones after one craniofacial registration. Signed nearest depth, three parity directions. Positive means inside bone. Source contact is not itself proof of anatomical correctness; new/deeper occupancy requires review.',results=rows),indent=2),encoding='utf8')
