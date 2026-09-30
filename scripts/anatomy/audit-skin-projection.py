"""Sampled anterior/posterior envelope intervals, not watertight containment or clinical error."""
from pathlib import Path
import json,zipfile,hashlib,collections
import numpy as np
r=Path(__file__).resolve().parents[2];out=r/'.cache/phase10'
with zipfile.ZipFile(r/'research/anatomy/integumentary-originals.zip') as z:data=z.read('FJ2810.obj')
assert hashlib.sha256(data).hexdigest()=='682f402206f15592acdeaae8ffb6b34c3e5c3267fa4685e63d2e4920ef2a80e0'
lines=data.decode().splitlines();v=np.array([list(map(float,l.split()[1:4])) for l in lines if l.startswith('v ')]);v=v[:,[0,2,1]]/1000;v[:,2]*=-1
f=np.array([[int(x.split('/')[0])-1 for x in l.split()[1:]] for l in lines if l.startswith('f ')],dtype=int);tri=v[f]
lo=tri[:,:,:2].min(axis=1);hi=tri[:,:,:2].max(axis=1);origin=lo.min(axis=0);step=(hi.max(axis=0)-origin)/np.array([64,128]);grid=collections.defaultdict(list)
low=np.floor((lo-origin)/step).astype(int);high=np.floor((hi-origin)/step).astype(int)
for i in range(len(f)):
 for x in range(low[i,0],high[i,0]+1):
  for y in range(low[i,1],high[i,1]+1):grid[(x,y)].append(i)
a,b,c=tri[:,0],tri[:,1],tri[:,2];den=(b[:,1]-c[:,1])*(a[:,0]-c[:,0])+(c[:,0]-b[:,0])*(a[:,1]-c[:,1])
def probe(point):
 x,y,z=point;key=tuple(np.floor((np.array([x,y])-origin)/step).astype(int));idx=np.array(grid.get(key,[]),dtype=int);idx=idx[np.abs(den[idx])>1e-15]
 if not len(idx):return dict(classification='indeterminate',reason='projection gap or source aperture')
 aa,bb,cc,dd=a[idx],b[idx],c[idx],den[idx]
 u=((bb[:,1]-cc[:,1])*(x-cc[:,0])+(cc[:,0]-bb[:,0])*(y-cc[:,1]))/dd;w=((cc[:,1]-aa[:,1])*(x-cc[:,0])+(aa[:,0]-cc[:,0])*(y-cc[:,1]))/dd
 inside=(u>=-1e-10)&(w>=-1e-10)&(u+w<=1+1e-10);depth=u[inside]*aa[inside,2]+w[inside]*bb[inside,2]+(1-u[inside]-w[inside])*cc[inside,2]
 if len(depth)<2:return dict(classification='indeterminate',reason='insufficient skin intersections')
 # Both hits can belong to the inner/outer faces of the SAME native skin patch,
 # especially behind an open orbit. Such a thin cluster is not a body interval.
 if np.max(np.diff(np.sort(depth)),initial=0)<.006:return dict(classification='indeterminate',reason='single thin depth cluster; aperture or silhouette edge')
 outside=max(float(depth.min()-z),float(z-depth.max()),0)
 return dict(classification='outside' if outside>.0002 else 'within',projectedExcessMillimetres=outside*1000)
samples=json.loads((out/'skin-interior-samples.json').read_text(encoding='utf8'));rows=[];totals=collections.defaultdict(collections.Counter)
for sample in samples:
 results=[probe(p) for p in sample['points']];counts=collections.Counter(p['classification'] for p in results);totals[sample['system']].update(counts)
 flagged=[dict(pointMetres=p,**q) for p,q in zip(sample['points'],results) if q['classification']!='within']
 rows.append({k:v for k,v in sample.items() if k!='points'}|dict(samples=len(results),counts=dict(counts),maxProjectedExcessMillimetres=max((p.get('projectedExcessMillimetres',0) for p in results),default=0),flagged=flagged))
report=dict(method='32 deterministic triangle-centre samples per mesh; anterior/posterior intervals of original FJ2810 on XY projection. No geometric edits.',thresholdMetres=.0002,minimumDepthClusterGapMetres=.006,thresholdMeaning='Reporting thresholds for projection excess and separated skin patches; not tissue clearance or anatomical tolerance. A single thin cluster cannot establish a body envelope across a source aperture.',sourceSkinSha256=hashlib.sha256(data).hexdigest(),meshes=len(rows),sampleCount=len(rows)*32,systems={k:dict(v) for k,v in totals.items()},rows=rows,limitations=['A within result does not establish full volume containment.','No intersection or one thin cluster may be a real source aperture, inter-limb gap or silhouette edge.','Excess is projected depth, not nearest-surface 3D distance or clinical error.','Existing cross-source nerve registration is examined, not changed.','Render order, opacity and hover cannot cause these coordinate-only results.'])
(out/'skin-interior-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps({k:report[k] for k in ['meshes','sampleCount','systems']},indent=2));print('Largest sampled excesses:',[(p['id'],round(p['maxProjectedExcessMillimetres'],2)) for p in sorted(rows,key=lambda r:-r['maxProjectedExcessMillimetres'])[:12]])
