"""Reproduce the frozen registration, without modifying catalogs or model assets.

Run expansion-reference.mjs first, then Blender 5.1 --background --factory-startup
--disable-autoexec --python scripts/anatomy/register-nervous-expansion.py.
Source bone geometry is preserved in nervous-expansion-originals.zip.
"""
import io,json,zipfile,numpy as np
from pathlib import Path
from mathutils.kdtree import KDTree
ROOT=Path(__file__).resolve().parents[2]
CACHE=ROOT/'.cache/phase4-expansion'
registration=json.loads((ROOT/'research/anatomy/nervous-expansion-registration.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(ROOT/'research/anatomy/nervous-expansion-originals.zip') as archive:
 source=np.load(io.BytesIO(archive.read('registration-bones.npz')))
target=json.loads((CACHE/'bp-reference.json').read_text(encoding='utf-8'))
def sample(v,f,count,seed):
 rng=np.random.default_rng(seed);tri=v[f];area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)
 chosen=tri[rng.choice(len(f),count,p=area/area.sum())];uv=rng.random((count,2));uv[uv.sum(1)>1]=1-uv[uv.sum(1)>1]
 return chosen[:,0]+uv[:,0,None]*(chosen[:,1]-chosen[:,0])+uv[:,1,None]*(chosen[:,2]-chosen[:,0])
def fit(x,y,fixed_scale=None):
 a=x-x.mean(0);b=y-y.mean(0);u,s,v=np.linalg.svd(a.T@b);R=v.T@np.diag([1,1,np.linalg.det(v.T@u.T)])@u.T
 scale=fixed_scale if fixed_scale is not None else np.sum(b*(a@R.T))/np.sum(a*a)
 M=np.eye(4);M[:3,:3]=scale*R;M[:3,3]=y.mean(0)-scale*R@x.mean(0);return M
results={}
for region,saved in [('global',registration['globalFit']),*registration['regions'].items()]:
 rows=saved['landmarks'];fixed=None if region=='global' else registration['globalFit']['uniformScale'];samples=[];trees=[];targets=[]
 for row in rows:
  name=row['source'];mesh=target[row['target']];count=2000 if region=='lower' and name.startswith('Hip bone') else 500
  samples.append(sample(source[name+'__p'],source[name+'__f'],count,123));points=sample(np.array(mesh['vertices']),np.array(mesh['faces']),12000,456);targets.append(points)
  tree=KDTree(len(points))
  for i,p in enumerate(points):tree.insert(p,i)
  tree.balance();trees.append(tree)
 x=np.concatenate(samples);M=fit(np.array([p['sourcePoint'] for p in rows]),np.array([p['targetPoint'] for p in rows]),fixed)
 for iteration in range(100):
  y=[]
  for points,tree,reference in zip(samples,trees,targets):
   transformed=points@M[:3,:3].T+M[:3,3];y.append(reference[[tree.find(p)[1] for p in transformed]])
  new=fit(x,np.concatenate(y),fixed);delta=np.max(np.abs(new-M));M=new
  if delta<1e-9:break
 error=float(np.max(np.abs(M-np.array(saved['matrix']))));assert error<1e-8,(region,error)
 results[region]=dict(matrix=M.tolist(),iterations=iteration+1,maxMatrixDifference=error)
(CACHE/'registration-reproduction.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print('Reproduced global similarity and both regional rigid fits',[(k,v['maxMatrixDifference']) for k,v in results.items()])
