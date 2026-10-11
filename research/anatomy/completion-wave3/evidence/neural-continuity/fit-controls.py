import json,numpy as np,hashlib
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;parent=out.parent
refs=json.loads((out/'reference-plan.json').read_text())['pairs'];z=np.load(out/'source-geometry.npz');soft=json.loads((parent/'target-soft.json').read_text());base=json.loads((parent/'registration.json').read_text());src={};tgt={};scales=[]
for r in refs:
 n=r['source'];a=np.unique(z[n+'__p'][np.unique(z[n+'__f'])],axis=0);g=soft[r['target']];b=np.unique(np.array(g['vertices'])[np.unique(g['faces'])],axis=0);assert len(a)==len(b),(n,len(a),len(b));src[n]=a;tgt[n]=b;s=np.sqrt(np.sum((b-b.mean(0))**2)/np.sum((a-a.mean(0))**2));scales.append(dict(source=n,scale=float(s),sourceUniquePositions=len(a),targetUniquePositions=len(b)))
scale=float(np.median([r['scale'] for r in scales]));assert max(abs(r['scale']-scale) for r in scales)<1e-5
G=np.array(base['globalSimilarity']['matrix']);G[:3,:3]*=scale/base['globalSimilarity']['scale']
def transform(p,M):return np.asarray(p)@M[:3,:3].T+M[:3,3]
def fit(x,y):
 x=np.array(x);y=np.array(y);a=x-x.mean(0);b=y-y.mean(0);u,s,v=np.linalg.svd(a.T@b);R=v.T@np.diag([1,1,np.linalg.det(v.T@u.T)])@u.T;M=np.eye(4);M[:3,:3]=R;M[:3,3]=y.mean(0)-R@x.mean(0);return M
result=dict(method='Fresh fit to 38 unchanged existing same-source peripheral nerve owners. One shared scale independently recovered from centroidal second moments of all unique original/target positions; rotation initialized from new bone global fit; one rigid alignment per upper/lower cohort from nerve centers. Every fourth control held out. No historical matrix read, no candidate used as fitting control. Existing reference registration is not treated as renewed approval: all new candidates are screened again against 205 bones and current anatomy.',scaleControls=scales,globalSimilarity=dict(matrix=G.tolist(),scale=scale),regions={})
for region in ['upper','lower']:
 names=sorted(r['source'] for r in refs if r['anatomicalRegion']==region);held=names[3::4];fitted=[n for n in names if n not in held];R=fit([transform(src[n].mean(0),G) for n in fitted],[tgt[n].mean(0) for n in fitted]);M=R@G;landmarks=[]
 for n in names:
  ref=next(r for r in refs if r['source']==n);g=soft[ref['target']];tree=BVHTree.FromPolygons(g['vertices'],g['faces'],all_triangles=True);p=transform(src[n],M);p=p[::max(1,int(np.ceil(len(p)/1200)))];d=np.array([tree.find_nearest(Vector(q))[3]*1000 for q in p]);landmarks.append(dict(source=n,target=ref['target'],sourceLandmark=src[n].mean(0).tolist(),targetLandmark=tgt[n].mean(0).tolist(),landmarkErrorMm=float(np.linalg.norm(transform(src[n].mean(0),M)-tgt[n].mean(0))*1000),surfaceRmsMm=float(np.sqrt(np.mean(d**2))),surfaceMaxMm=float(d.max()),holdout=n in held))
 result['regions'][region]=dict(matrix=M.tolist(),regionalRigid=R.tolist(),globalScale=scale,landmarks=landmarks,fittedBones=fitted,heldOutBones=held,controlsAreNervesNotBones=True,surfaceRmsMm=float(np.sqrt(np.mean([r['surfaceRmsMm']**2 for r in landmarks]))),surfaceMaxMm=max(r['surfaceMaxMm'] for r in landmarks));print(region,scale,result['regions'][region]['surfaceRmsMm'],result['regions'][region]['surfaceMaxMm'],flush=True)
result['inputs']={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in [out/'source-geometry.npz',out/'reference-plan.json',parent/'target-soft.json',parent/'registration.json']}
(out/'registration.json').write_text(json.dumps(result,indent=2),encoding='utf8')
