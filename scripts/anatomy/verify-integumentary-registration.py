#!/usr/bin/env python3
"""Read-only native-frame checks and bounded projected-envelope probes.
Requires NumPy. Probes are engineering checks, not tissue thickness or clinical validation.
"""
from pathlib import Path
import zipfile,json,collections,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'public/models/anatomy/integumentary'
manifest=json.loads((out/'integumentary-source-manifest.json').read_text(encoding='utf8'))
with zipfile.ZipFile(ROOT/manifest['sourceZip']) as z:data=z.read('FJ2810.obj')
assert hashlib.sha256(data).hexdigest()==manifest['files'][0]['sha256']
lines=data.decode().splitlines()
source=np.array([list(map(float,l.split()[1:4])) for l in lines if l.startswith('v ')],dtype=float)
v=source[:,[0,2,1]]/1000;v[:,2]*=-1
f=np.array([[int(t.split('/')[0])-1 for t in l.split()[1:]] for l in lines if l.startswith('f ')],dtype=int)
parent=list(range(len(v)))
def find(x):
 while parent[x]!=x:parent[x]=parent[parent[x]];x=parent[x]
 return x
edges=collections.Counter()
for a,b,c in f:
 ra=find(int(a));rb=find(int(b));rc=find(int(c));parent[rb]=ra;parent[rc]=ra
 for x,y in [(a,b),(b,c),(c,a)]:edges[tuple(sorted((int(x),int(y))))]+=1
groups=collections.defaultdict(list)
for i in np.unique(f):groups[find(int(i))].append(int(i))
components=[]
for indices in groups.values():
 points=v[indices];components.append(dict(vertices=len(indices),boundsMetres=[points.min(axis=0).tolist(),points.max(axis=0).tolist()]))
components.sort(key=lambda c:-c['vertices'])
a,b,c=v[f[:,0]],v[f[:,1]],v[f[:,2]]
den=(b[:,1]-c[:,1])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,1]-c[:,1]);usable=np.abs(den)>1e-15;den=np.where(usable,den,1)
def envelope(point):
 x,y,z=point
 u=((b[:,1]-c[:,1])*(x-c[:,0])+(c[:,0]-b[:,0])*(y-c[:,1]))/den
 w=((c[:,1]-a[:,1])*(x-c[:,0])+(a[:,0]-c[:,0])*(y-c[:,1]))/den
 inside=usable&(u>=-1e-10)&(w>=-1e-10)&(u+w<=1+1e-10)
 depths=u[inside]*a[inside,2]+w[inside]*b[inside,2]+(1-u[inside]-w[inside])*c[inside,2]
 if len(depths)<2:return dict(intersections=len(depths),withinProjectedEnvelope=None,reason='Insufficient intersections; open surface or projection gap, not evidence of misregistration.')
 lo,hi=float(depths.min()),float(depths.max());return dict(intersections=len(depths),depthIntervalMetres=[lo,hi],withinProjectedEnvelope=bool(lo<=z<=hi),nearestIntervalMarginMillimetres=float(min(z-lo,hi-z)*1000))
probes=[]
families={'skeletal':{'frontal','sternum','ilium','humerus','radius','femur','tibia','calcaneus'},'muscular':{'pectoralismajor','deltoid','gluteusmaximus','rectusfemoris'}}
explicit={'bp3d:FMA16586','bp3d:FMA16587','bp3d:FMA24468','bp3d:FMA24469','bp3d:FMA24497','bp3d:FMA24498'}
for system,selected in families.items():
 catalog=json.loads((ROOT/'public/models/anatomy'/system/'catalog.json').read_text(encoding='utf8'))
 for n in catalog['nodes']:
  if n['kind']!='structure' or (n.get('family') not in selected and n['id'] not in explicit):continue
  lo,hi=np.array(n['bounds']);point=(lo+hi)/2
  probes.append(dict(id=n['id'],name=n['name'],system=system,pointType='catalog anatomical bounding-box centre',pointMetres=point.tolist(),**envelope(point)))
assert len(probes)==24, [(p['id'],p['name']) for p in probes]
skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'));skinBounds=np.array([v.min(axis=0),v.max(axis=0)]);boneBounds=np.array(skeleton['frame']['bounds'])
assert np.all(skinBounds[0]<=boneBounds[0]) and np.all(skinBounds[1]>=boneBounds[1])
result=dict(source='FMA7163 / FJ2810 / BP9115, native BodyParts3D 4.0',transform=manifest['transform'],additionalRegistration='none',vertices=len(v),triangles=len(f),referencedVertices=len(np.unique(f)),connectedComponents=len(components),anatomicalComponents=0,boundaryEdges=sum(n==1 for n in edges.values()),nonManifoldEdges=sum(n>2 for n in edges.values()),components=components,skinBoundsMetres=skinBounds.tolist(),skeletalFrameBoundsMetres=boneBounds.tolist(),skinBoundingBoxEnclosesReference=True,probes=probes,probeSummary=dict(total=len(probes),within=sum(p['withinProjectedEnvelope'] is True for p in probes),outside=sum(p['withinProjectedEnvelope'] is False for p in probes),indeterminate=sum(p['withinProjectedEnvelope'] is None for p in probes)),limitations=['Geometric connected components are not anatomical or histological layers. No parts were removed or relabelled as tissue.','Projected front/back intervals at curated reference centres are bounded registration checks; they do not establish complete volume containment or measure cutaneous thickness.','Native openings and intersections are preserved. See visual review for silhouette and relevant penetrations. No clinical validation.'])
(out/'integumentary-registration.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps({k:result[k] for k in ['vertices','triangles','connectedComponents','boundaryEdges','nonManifoldEdges','skinBoundingBoxEnclosesReference','probeSummary']},indent=2))
