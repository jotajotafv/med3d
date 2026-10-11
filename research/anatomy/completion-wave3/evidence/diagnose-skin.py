import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
p=Path('.cache/anatomy-completion/wave3/target-soft.json');soft=json.loads(p.read_text());s=soft['integ:FMA7163'];v=np.array(s['vertices']);print('Skin bounds',v.min(0),v.max(0),'verts',len(v),'faces',len(s['faces']))
tree=BVHTree.FromPolygons(s['vertices'],s['faces'],all_triangles=True)
for q in [[0,1,.1],[0,1.5,.12],[.03,1.46,.14]]:
 for eps in [5e-7,1e-5]:
  counts=[]
  for dr in [(1,.173,.367),(.291,1,.419),(.137,.233,1)]:
   d=Vector(dr).normalized();start=Vector(q);hits=[]
   for _ in range(40):
    h=tree.ray_cast(start,d,3.)
    if h[0] is None:break
    hits.append([h[2],h[3],list(h[0])]);start=h[0]+d*eps
   counts.append(hits)
  print(q,eps,counts)
