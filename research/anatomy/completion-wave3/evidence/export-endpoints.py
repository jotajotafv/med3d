import bpy,json,numpy as np
from pathlib import Path
out=Path(__file__).parent;plan=json.loads((out/'candidate-plan.json').read_text());rows=[]
for c in plan['candidates']:
 obj=bpy.data.objects[c['sourceObject']]
 if obj.type!='CURVE':continue
 M=np.array(obj.matrix_world);ends=[]
 for spline in obj.data.splines:
  points=spline.bezier_points if spline.type=='BEZIER' else spline.points
  if spline.use_cyclic_u or not len(points):continue
  for p in [points[0],points[-1]]:
   q=np.array(tuple(p.co)[:3]);ends.append((M[:3,:3]@q+M[:3,3]).tolist())
 rows.append(dict(sourceObject=obj.name,region=c['region'],endpoints=ends,splines=len(obj.data.splines)))
(out/'source-endpoints.json').write_text(json.dumps(rows,indent=2),encoding='utf8')
print('Authored curve endpoints',len(rows),flush=True)
