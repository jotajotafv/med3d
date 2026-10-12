import json,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent; root=out.parents[2]
def read(p):return json.loads(p.read_text(encoding='utf8'))
bp=read(root/'.cache/phase4-expansion/bp-reference.json');soft=read(out/'target-soft.json');bp.update(soft);results={}
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
 globalM=globalMatrix;R=np.eye(4)
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

# Fresh common donor scale from 27 homologous whole-bone controls; source arrays
# fixed by W3, but no stored matrix is used as the final W4 registration.
previous=root/'.cache/anatomy-completion/wave3'
spine=read(previous/'hra-spinal-references.json');pelvis=read(previous/'hra-pelvis-references.json')
prior=read(previous/'hra-registration.json');skeleton={**spine,**pelvis}
pairs={l['source']:l['target'] for k in ['spinal','pelvis'] for l in prior[k]['landmarks']}
globalMatrix=fit([center(skeleton[n]) for n in skeleton],[center(bp[pairs[n]]) for n in skeleton])
def organ(name):return read(out/'hra'/name/'geometry.json')
kL=organ('kidney-male-left');kR=organ('kidney-male-right');pan=organ('pancreas-male');bl=organ('urinary-bladder-male');pros=organ('prostate-male');colon=organ('large-intestine-male')
source={'kidney-L':kL['VH_M_kidney_capsule_L'],'kidney-R':kR['VH_M_kidney_capsule_R'],'bladder':merge(list(bl.values())),'pancreas':merge(list(pan.values())),'prostate':merge([g for n,g in pros.items() if any(w in n for w in ['zone','fibromuscular','apex_of','base_of'])])}
register('abdominopelvic',source,{'kidney-L':'uri:FMA7205','kidney-R':'uri:FMA7204','bladder':'uri:FMA15900','pancreas':'dig:FMA7198','prostate':'rep:FMA9600'},['renal substructures','ejaculatory duct','pancreatic regions'])
register('colon',{'ascending':colon['VH_M_ascending_colon'],'descending':colon['VH_M_descending_colon'],'rectum':colon['VH_M_rectum']},{'ascending':'dig:FMA14545','descending':'dig:FMA14547','rectum':'dig:FMA14544'},['VH_M_caecum','VH_M_sigmoid_colon'])
results['globalControlCount']=len(skeleton);results['method']='Fresh common positive global similarity from 24 vertebral plus 3 pelvic whole-bone centers, followed by one common rigid fit per anatomical region; no per-piece scale, no deformation. Abdominopelvic pancreas is withheld from regional fitting. Colon with three controls has no independent holdout; quantitative failure does not justify adding controls from the candidate itself.'
results['inputs']={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [previous/'hra-spinal-references.json',previous/'hra-pelvis-references.json',previous/'hra-registration.json',out/'hra-source-lock.json']}
(out/'hra-registration.json').write_text(json.dumps(results,indent=2)+'\n',encoding='utf8',newline='\n')
