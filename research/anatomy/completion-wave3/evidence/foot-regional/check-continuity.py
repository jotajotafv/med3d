import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;reg=json.loads((out/'registration.json').read_text());ends=json.loads((out.parent/'source-endpoints.json').read_text());soft=json.loads((out/'target-soft.json').read_text());rows=[]
for side in ['l','r']:
 g=soft['zanatomy:tibial-nerve-'+side];tree=BVHTree.FromPolygons(g['vertices'],g['faces'],all_triangles=True);M=np.array(reg['regions']['foot_'+side]['matrix'])
 for kind in ['Medial','Lateral']:
  name=kind+' plantar nerve.'+side;e=next(e for e in ends if e['sourceObject']==name);p=np.array(e['endpoints'])@M[:3,:3].T+M[:3,3];distances=[tree.find_nearest(Vector(q))[3]*1000 for q in p];rows.append(dict(sourceObject=name,target='zanatomy:tibial-nerve-'+side,endpoints=p.tolist(),endpointSurfaceDistancesMm=distances,minimumEndpointSurfaceDistanceMm=min(distances)))
print(json.dumps(rows,indent=2),flush=True)
(out/'continuity.json').write_text(json.dumps(dict(method='Whole-foot rigid cohort; authored plantar nerve endpoints to unchanged tibial nerve surface. No endpoint adjustment or bridge.',results=rows),indent=2),encoding='utf8')
