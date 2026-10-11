import json,numpy as np,hashlib,re
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;root=out.parents[2]
refs=json.loads((out/'reference-plan.json').read_text(encoding='utf-8'))['pairs']
z=np.load(out/'source-geometry.npz')
bp=json.loads((root/'.cache/phase4-expansion/bp-reference.json').read_text(encoding='utf-8'))
def transform(p,M):return np.asarray(p)@M[:3,:3].T+M[:3,3]
def fit(x,y,scale=True):
 x=np.asarray(x);y=np.asarray(y);a=x-x.mean(0);b=y-y.mean(0);u,sv,v=np.linalg.svd(a.T@b);R=v.T@np.diag([1,1,np.linalg.det(v.T@u.T)])@u.T;s=np.sum(b*(a@R.T))/np.sum(a*a) if scale else 1.
 M=np.eye(4);M[:3,:3]=s*R;M[:3,3]=y.mean(0)-s*R@x.mean(0);return M
samples={};trees={};sources={};targets={}
for row in refs:
 name=row['source'];v=z[name+'__p'];f=z[name+'__f'];tv=np.asarray(bp[row['target']]['vertices']);tf=bp[row['target']]['faces']
 sources[name]=(v.min(0)+v.max(0))/2;targets[name]=(tv.min(0)+tv.max(0))/2
 triangles=v[f];a=np.linalg.norm(np.cross(triangles[:,1]-triangles[:,0],triangles[:,2]-triangles[:,0]),axis=1);rng=np.random.default_rng(20261011);ix=rng.choice(len(f),800,p=a/a.sum());uv=rng.random((800,2));uv[uv.sum(1)>1]=1-uv[uv.sum(1)>1];t=triangles[ix];samples[name]=t[:,0]+uv[:,0,None]*(t[:,1]-t[:,0])+uv[:,1,None]*(t[:,2]-t[:,0]);trees[name]=BVHTree.FromPolygons(tv.tolist(),tf,all_triangles=True)
allnames=[r['source'] for r in refs]
globalM=fit([sources[n] for n in allnames],[targets[n] for n in allnames]);scale=float(np.linalg.det(globalM[:3,:3])**(1/3));print('Global scale',scale,flush=True)
cranial=[r['source'] for r in refs if r['anatomicalRegion']=='craniofacial']
spinal=[n for n in allnames if n.startswith('Vertebra ') or n in ['Atlas (C1)','Axis (C2)','Sacrum']]
upper=[n for n in allnames if re.match(r'^(Clavicle|Scapula|Humerus|Radius|Ulna)[.]',n) or n in ['Vertebra C5','Vertebra C6','Vertebra C7','Vertebra T1','Vertebra T2','Vertebra T3','Vertebra T4']]
lower=[n for n in allnames if re.match(r'^(Hip bone|Femur|Tibia|Fibula|Talus|Calcaneus)[.]',n) or n=='Sacrum' or n.startswith('Vertebra L')]
trunk=[n for n in allnames if n.startswith('Vertebra T') or n.startswith('Vertebra L') or re.match(r'^(Hip bone|Clavicle|Scapula)[.]',n) or n=='Sacrum' or re.match(r'^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth|Eleventh|Twelfth) rib[.]',n) or 'sternum' in n]
def metrics(names,M,holdouts=[]):
 rows=[]
 for name in names:
  p=transform(samples[name],M);ds=np.array([trees[name].find_nearest(Vector(q))[3] for q in p]);rows.append(dict(source=name,target=next(r['target'] for r in refs if r['source']==name),sourceLandmark=sources[name].tolist(),targetLandmark=targets[name].tolist(),landmarkErrorMm=float(np.linalg.norm(transform(sources[name],M)-targets[name])*1000),surfaceRmsMm=float(np.sqrt(np.mean(ds**2))*1000),surfaceMaxMm=float(ds.max()*1000),holdout=name in holdouts,samples=len(p)))
 return dict(landmarks=rows,landmarkRmsMm=float(np.sqrt(np.mean([r['landmarkErrorMm']**2 for r in rows]))),landmarkMaxMm=max(r['landmarkErrorMm'] for r in rows),surfaceRmsMm=float(np.sqrt(np.mean([r['surfaceRmsMm']**2 for r in rows]))),surfaceMaxMm=max(r['surfaceMaxMm'] for r in rows))
result=dict(method='Fresh global similarity from whole-bone bounds centers, followed by one rigid regional point-to-surface fit per anatomical cohort. Fixed global scale. Every fourth sorted regional control held out of regional optimization. 90% nearest-point trimming within each fitting bone. No candidate geometry participates in fitting. Positive determinant only.',globalSimilarity=dict(matrix=globalM.tolist(),scale=scale,**metrics(allnames,globalM)),regions={})
for group,names in dict(craniofacial=cranial,spinal=spinal,upper=upper,lower=lower,trunk=trunk).items():
 names=sorted(names);held=names[3::4];trained=[n for n in names if n not in held];x=np.concatenate([transform(samples[n],globalM) for n in trained]);R=fit([transform(sources[n],globalM) for n in trained],[targets[n] for n in trained],False)
 for iteration in range(80):
  xx=[];yy=[]
  for name in trained:
   base=transform(samples[name],globalM);p=transform(base,R);hits=[trees[name].find_nearest(Vector(q)) for q in p];d=np.array([h[3] for h in hits]);keep=d<=np.quantile(d,.9);xx.append(base[keep]);yy.append(np.array([list(h[0]) for h in hits])[keep])
  new=fit(np.concatenate(xx),np.concatenate(yy),False);delta=np.max(np.abs(new-R));R=new
  if delta<1e-8:break
 M=R@globalM;assert np.linalg.det(R[:3,:3])>0.999999
 result['regions'][group]=dict(globalScale=scale,regionalRigid=R.tolist(),matrix=M.tolist(),iterations=iteration+1,fittedBones=trained,heldOutBones=held,**metrics(names,M,held))
 print(group,'RMS/max mm',result['regions'][group]['surfaceRmsMm'],result['regions'][group]['surfaceMaxMm'],flush=True)
result['inputs']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [out/'source-geometry.npz',out/'reference-plan.json',root/'.cache/phase4-expansion/bp-reference.json']}
(out/'registration.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
