import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent
soft=json.loads((out/'target-soft.json').read_text(encoding='utf8'))
trees={k:BVHTree.FromPolygons(g['vertices'],g['faces'],all_triangles=True) for k,g in soft.items()}
directions=[Vector(v).normalized() for v in [(1,.173,.367),(.291,1,.419),(.137,.233,1)]]
def inside(q,tree):
 votes=0
 for d in directions:
  start=Vector(q);count=0
  for _ in range(128):
   hit=tree.ray_cast(start,d,3.)
   if hit[0] is None:break
   count+=1;start=hit[0]+d*.0000005
  if count%2:votes+=1
 return votes==3
def compare(name,p,target):
 t=trees[target];p=np.unique(np.round(p,10),axis=0);p=p[::max(1,int(np.ceil(len(p)/4096)))];ds=np.array([t.find_nearest(Vector(q))[3]*1000 for q in p]);insideFlags=[inside(q,t) for q in p]
 return dict(source=name,target=target,targetName=soft[target]['name'],samples=len(p),insideSamples=sum(insideFlags),distanceMm=dict(min=float(ds.min()),median=float(np.median(ds)),p95=float(np.quantile(ds,.95)),max=float(ds.max())),outsideMaxMm=float(max([d for d,i in zip(ds,insideFlags) if not i],default=0)))
geo=np.load(out/'source-geometry.npz');reg=json.loads((out/'registration.json').read_text());rows=[]
for name,region,target in [('Adenohypophysis','craniofacial','endo:FMA13889'),('Neurohypophysis','craniofacial','endo:FMA13889'),('Nail plate (foot).l','foot_l','integ:FMA7163'),('Nail plate (foot).r','foot_r','integ:FMA7163'),('Nail plate.l','upper','integ:FMA7163'),('Nail plate.r','upper','integ:FMA7163')]:
 m=np.array(reg['regions'][region]['matrix']);p=geo[name+'__p'];p=p@m[:3,:3].T+m[:3,3];rows.append(compare(name,p,target))
vgeo=np.load(out/'visceral/source-geometry.npz');vreg=json.loads((out/'visceral/registration.json').read_text());m=np.array(vreg['pelvic-source']['matrix'])
for name in ['Ejaculatory duct.l','Ejaculatory duct.r']:
 p=vgeo[name+'__p'];p=p@m[:3,:3].T+m[:3,3]
 for target in ['rep:FMA9600','uri:FMA15900','uri:FMA19667','rep:FMA19387','rep:FMA19388']:
  if target in trees:rows.append(compare(name,p,target))
native=np.load(out/'native/source-geometry.npz');plan=json.loads((out/'native/candidate-plan.json').read_text())['candidates']
for r in plan:
 if not any(w in r['name'].lower() for w in ['renal artery','pancreatic duct']):continue
 p=native[r['sourceObject']+'__p'];side='izquier' if 'left' in r['name'].lower() else 'derech'
 targets=[k for k,g in soft.items() if ((('arteria renal' in g['name'].lower() or 'riñón' in g['name'].lower()) and side in g['name'].lower()) or ('pancreatic duct' in r['name'].lower() and ('pancreático' in g['name'].lower() or g['name']=='Páncreas')))]
 for target in targets:rows.append(compare(r['sourceObject'],p,target))
(out/'interfaces.json').write_text(json.dumps(dict(method='Unsigned nearest-surface distances and three-ray containment sampling. Occupancy inside a parent organ is expected for its own substructure; it is not a generic rejection. Skin tissue occupancy is not body containment.',results=rows),indent=2)+'\n',encoding='utf8',newline='\n')
for r in rows:print(r['source'],r['targetName'],'inside',r['insideSamples'],'/',r['samples'],'median',round(r['distanceMm']['median'],2),'maxOutside',round(r['outsideMaxMm'],2),flush=True)
