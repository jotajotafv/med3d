"""Native cross-version control; no fitted transform and no clinical accuracy claim.

Requires numpy. Measures vertex-to-triangle distance, not vertex spacing, for the
same trachea in 4.0 and the official pulmonary revision 4.3. The control is never
included as a second trachea. Source hashes and exact frame checks accompany it.
"""
from pathlib import Path
import zipfile,json,hashlib
import numpy as np
root=Path(__file__).resolve().parents[2]
def parse(data):
 vertices=[];faces=[]
 for line in data.decode().splitlines():
  w=line.split()
  if w and w[0]=='v':vertices.append(list(map(float,w[1:4])))
  if w and w[0]=='f':faces.append([int(x.split('/')[0])-1 for x in w[1:]])
 return np.array(vertices),np.array(faces)
with zipfile.ZipFile(root/'research/anatomy/respiratory-originals.zip') as z:a=z.read(next(n for n in z.namelist() if n.endswith('/FJ2541.obj')))
with zipfile.ZipFile(root/'research/anatomy/respiratory-metadata.zip') as z:b=z.read('registration-control-FJ6588.obj')
va,fa=parse(a);vb,fb=parse(b)
def surface_distances(points,vertices,faces):
 t=vertices[faces];a,b,c=t[:,0],t[:,1],t[:,2];ab=b-a;ac=c-a;n=np.cross(ab,ac);n2=(n*n).sum(1);valid=n2>1e-20
 a,b,c,ab,ac,n,n2=[x[valid] for x in [a,b,c,ab,ac,n,n2]]
 d00=(ab*ab).sum(1);d01=(ab*ac).sum(1);d11=(ac*ac).sum(1);den=d00*d11-d01*d01
 out=[]
 for start in range(0,len(points),32):
  p=points[start:start+32,None,:];ap=p-a;d20=(ap*ab).sum(2);d21=(ap*ac).sum(2)
  v=(d11*d20-d01*d21)/den;w=(d00*d21-d01*d20)/den
  plane=((ap*n).sum(2)**2)/n2
  best=np.where((v>=0)&(w>=0)&(v+w<=1),plane,np.inf)
  for x,y in [(a,b),(b,c),(c,a)]:
   edge=y-x;length=(edge*edge).sum(1);ratio=np.clip(((p-x)*edge).sum(2)/length,0,1)
   best=np.minimum(best,((p-(x+ratio[:,:,None]*edge))**2).sum(2))
  out.extend(np.sqrt(best.min(1)).tolist())
 return np.array(out)
ab=surface_distances(va,vb,fb);ba=surface_distances(vb,va,fa)
def summary(values):return dict(median=float(np.median(values)),p95=float(np.percentile(values,95)),maximum=float(values.max()))
bounds_delta=float(np.abs(np.array([va.min(0),va.max(0)])-np.array([vb.min(0),vb.max(0)])).max())
assert bounds_delta<.2,'Native tracheal bounds differ by >0.2 mm; review coordinate compatibility'
assert max(np.percentile(ab,95),np.percentile(ba,95))<.2,'Native surface controls differ; no automatic registration'
catalog=json.loads((root/'public/models/anatomy/respiratory/catalog.json').read_text(encoding='utf-8'))
report=dict(method='Native coordinates; all tracheal vertices to triangles of alternate official revision. No optimization/fitting; no clinical validation.',units='millimetres',control40=dict(fileId='FJ2541',sha256=hashlib.sha256(a).hexdigest(),vertices=len(va),triangles=len(fa)),control43=dict(fileId='FJ6588',sha256=hashlib.sha256(b).hexdigest(),vertices=len(vb),triangles=len(fb)),distances40To43=summary(ab),distances43To40=summary(ba),maximumBoundsDelta=bounds_delta,additionalTransform='identity',transformToBody=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],frame='bodyparts3d-4.0-male',allLungSidesCorrect=all(n['bounds'][1][0]<0 if n['side']=='right' else n['bounds'][0][0]>0 for n in catalog['nodes'] if n.get('respiratoryClass')=='parenchyma'),limitations=['A common tracheal control supports frame compatibility but cannot certify all organ surfaces.','Full lung/airway/thoracic placement additionally reviewed visually; no per-piece adjustments.'])
dst=root/'public/models/anatomy/respiratory/respiratory-registration.json';dst.write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n');print(json.dumps(report,indent=2))
