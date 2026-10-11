import json,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent; root=out.parents[2]
def read(p):return json.loads(p.read_text(encoding='utf8'))
bp=read(root/'.cache/phase4-expansion/bp-reference.json');refs=read(out/'reference-plan.json')['pairs'];results={}
def points(g):return np.asarray(g['vertices'])
def center(g):
 p=points(g)[np.unique(g['faces'])];return (p.min(0)+p.max(0))/2
def transform(p,M):return np.asarray(p)@M[:3,:3].T+M[:3,3]
def fit(x,y,scaled=True):
 x=np.asarray(x);y=np.asarray(y);a=x-x.mean(0);b=y-y.mean(0);u,s,v=np.linalg.svd(a.T@b);R=v.T@np.diag([1,1,np.linalg.det(v.T@u.T)])@u.T;scale=np.sum(b*(a@R.T))/np.sum(a*a) if scaled else 1
 M=np.eye(4);M[:3,:3]=scale*R;M[:3,3]=y.mean(0)-scale*R@x.mean(0);assert np.linalg.det(M[:3,:3])>0;return M
def tree(g):return BVHTree.FromPolygons(g['vertices'],g['faces'],all_triangles=True)
def samples(g):
 p=points(g);f=np.asarray(g['faces']);t=p[f];area=np.linalg.norm(np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]),axis=1);rng=np.random.default_rng(20261011);t=t[rng.choice(len(f),1200,p=area/area.sum())];uv=rng.random((len(t),2));uv[uv.sum(1)>1]=1-uv[uv.sum(1)>1];return t[:,0]+uv[:,0,None]*(t[:,1]-t[:,0])+uv[:,1,None]*(t[:,2]-t[:,0])
def merge(gs):
 v=[];f=[]
 for g in gs:f.extend((np.asarray(g['faces'])+len(v)).tolist());v.extend(g['vertices'])
 return dict(vertices=v,faces=f)
def register(label,source,pairs,candidate):
 target={n:bp[id] for n,id in pairs.items()};trees={n:tree(g) for n,g in target.items()};sample={n:samples(g) for n,g in source.items()};names=list(source);held=names[3::4] if len(names)>4 else [];trained=[n for n in names if n not in held]
 globalM=fit([center(source[n]) for n in names],[center(target[n]) for n in names]);R=np.eye(4)
 for iteration in range(100):
  xx=[];yy=[]
  for n in trained:
   base=transform(sample[n],globalM);p=transform(base,R);hits=[trees[n].find_nearest(Vector(q)) for q in p];ds=np.asarray([h[3] for h in hits]);keep=ds<=np.quantile(ds,.9);xx.extend(base[keep]);yy.extend(np.asarray([list(h[0]) for h in hits])[keep])
  new=fit(xx,yy,False);delta=np.max(np.abs(new-R));R=new
  if delta<1e-8:break
 M=R@globalM;landmarks=[]
 for n in names:
  ds=np.asarray([trees[n].find_nearest(Vector(q))[3] for q in transform(sample[n],M)])*1000
  landmarks.append(dict(source=n,target=pairs[n],sourceLandmark=center(source[n]).tolist(),targetLandmark=center(target[n]).tolist(),landmarkErrorMm=float(np.linalg.norm(transform(center(source[n]),M)-center(target[n]))*1000),surfaceRmsMm=float(np.sqrt(np.mean(ds**2))),surfaceMaxMm=float(ds.max()),holdout=n in held))
 report=dict(globalSimilarity=globalM.tolist(),regionalRigid=R.tolist(),matrix=M.tolist(),globalScale=float(np.linalg.det(globalM[:3,:3])**(1/3)),landmarks=landmarks,heldOutBones=held,iterations=iteration+1,landmarkRmsMm=float(np.sqrt(np.mean([l['landmarkErrorMm']**2 for l in landmarks]))),landmarkMaxMm=max(l['landmarkErrorMm'] for l in landmarks),surfaceRmsMm=float(np.sqrt(np.mean([l['surfaceRmsMm']**2 for l in landmarks]))),surfaceMaxMm=max(l['surfaceMaxMm'] for l in landmarks))
 print(label,report['globalScale'],report['landmarkRmsMm'],report['surfaceRmsMm'],report['surfaceMaxMm'],flush=True)
 (out/('hra-'+label+'-references.json')).write_text(json.dumps(source),encoding='utf8');report['candidates']=candidate;results[label]=report
pelvis=read(out/'hra-pelvis-geometry.json')
src={'sacrum':pelvis['VH_M_sacrum']}
for side in ['L','R']:src['coxal-'+side]=merge([pelvis[f'VH_M_{part}_compact_bone_{side}'] for part in ['ilium','ischium','pubis']])
register('pelvis',src,{'sacrum':'bp3d:FMA16202','coxal-L':'bp3d:FMA16587','coxal-R':'bp3d:FMA16586'},['VH_M_coccyx'])
groups=read(out/'hra-spinal-landmarks-geometry.json');src={};pairs={};components=[]
for name,g in groups.items():
 v=points(g);unique,inverse=np.unique(v,axis=0,return_inverse=True);parent=list(range(len(unique)))
 def find(a):
  while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
  return a
 for face in g['faces']:
  a,b,c=[find(int(inverse[i])) for i in face];parent[b]=a;parent[c]=a
 clusters={}
 for i in range(len(v)):clusters.setdefault(find(int(inverse[i])),[]).append(i)
 big=[ix for ix in clusters.values() if len(ix)>=60];big.sort(key=lambda ix:-float((v[ix,1].min()+v[ix,1].max())/2))
 region='C' if 'cervical' in name else 'T' if 'thoracic' in name else 'L';expected={'C':7,'T':12,'L':5}[region];assert len(big)==expected,(name,len(big))
 for i,ix in enumerate(big):
  selected=set(ix);faces=[f for f in g['faces'] if f[0] in selected];order=sorted(set(k for f in faces for k in f));remap={k:j for j,k in enumerate(order)};key=region+str(i+1);src[key]=dict(vertices=v[order].tolist(),faces=[[remap[k] for k in f] for f in faces]);sourceName='Atlas (C1)' if key=='C1' else 'Axis (C2)' if key=='C2' else 'Vertebra '+key;pairs[key]=next(r['target'] for r in refs if r['source']==sourceName);components.append(dict(id=key,sourceGroup=name,vertices=len(order),triangles=len(faces),center=center(src[key]).tolist()))
register('spinal',src,pairs,list(read(out/'hra-spinal-geometry.json')))
results['method']='Fresh donor-specific global similarity from corresponding whole-bone centers, followed by one fixed-scale rigid fit of the entire pelvis or entire spine. Seeded surface sampling, 90% trimmed fitting; every fourth vertebra held out of regional optimization. No candidate-specific fits; no deformation. Vertebrae identified by original regional labels, connected topology and superior-to-inferior order. These are research fits, not accepted anatomy or clinical precision.'
results['components']=components
results['inputs']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [out/'hra-pelvis-geometry.json',out/'hra-spinal-landmarks-geometry.json',out/'hra-spinal-geometry.json',root/'.cache/phase4-expansion/bp-reference.json']}
(out/'hra-registration.json').write_text(json.dumps(results,indent=2),encoding='utf8')
