import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;root=out.parents[3]
exec((out/'export-qa.py').read_text().split("glb(out/'qa-target.glb'")[0])
soft=json.loads((out/'target-soft.json').read_text())
glb(out/'qa-soft.glb',[(k,v['vertices'],v['faces'],dict(label=v['name'],ownerId=k)) for k,v in soft.items() if v['system']=='muscular' and np.min(np.array(v['vertices'])[:,1])<.1])
rows=[]
for c in plan['candidates']:
 name=c['sourceObject']
 if not any(s in name for s in ['Flexor retinaculum','Extensor digitorum brevis','Dorsal interossei']):continue
 side=name[-1];p=source[name+'__p'];M=np.array(reg['regions'][c['region']]['matrix']);q=transform(p,M);interfaces=[]
 for r in refs:
  if not r['source'].endswith('.'+side):continue
  s=r['source']
  if not (s.startswith(('Tibia.','Calcaneus.')) or ('Proximal phalanx' in s)):continue
  st=BVHTree.FromPolygons(source[s+'__p'].tolist(),source[s+'__f'].tolist(),all_triangles=True)
  tt=BVHTree.FromPolygons(bp[r['target']]['vertices'],bp[r['target']]['faces'],all_triangles=True)
  ds=np.array([st.find_nearest(Vector(v))[3]*1000 for v in p]);dt=np.array([tt.find_nearest(Vector(v))[3]*1000 for v in q])
  near=np.argsort(ds)[:max(3,int(len(ds)*.01))]
  interfaces.append(dict(sourceBone=s,target=r['target'],sourceMinimumMm=float(ds.min()),targetMinimumMm=float(dt.min()),sourceClosestOnePercentTargetMedianMm=float(np.median(dt[near])),sourceClosestOnePercentTargetMaxMm=float(dt[near].max())))
 rows.append(dict(sourceObject=name,interfaces=interfaces))
print(json.dumps(rows,indent=2))
(out/'attachment-screen.json').write_text(json.dumps(dict(method='Source candidate vertices nearest to homologous attachment bone surfaces. Track the same closest one percent after regional transform. Whole surfaces are coarse attachment controls, not confirmed entheses. No geometry changes.',results=rows),indent=2))
