import json,numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent;soft=json.loads((out/'target-soft.json').read_text());reg=json.loads((out/'registration.json').read_text());reg['regions'].update(json.loads((out/'neural-continuity/registration.json').read_text())['regions']);ends=json.loads((out/'source-endpoints.json').read_text());geo=np.load(out/'source-geometry.npz');trees={};results=[]
for n,g in soft.items():trees[n]=BVHTree.FromPolygons(g['vertices'],g['faces'],all_triangles=True)
def distances(name,targets,why):
 e=next(e for e in ends if e['sourceObject']==name);M=np.array(reg['regions'][e['region']]['matrix']);p=np.array(e['endpoints'])@M[:3,:3].T+M[:3,3];rows=[]
 for target in targets:
  t=trees[target];d=[t.find_nearest(Vector(q))[3]*1000 for q in p];rows.append(dict(target=target,name=soft[target]['name'],endpointDistancesMm=d,minimumEndpointSurfaceDistanceMm=min(d)))
 results.append(dict(sourceObject=name,reason=why,endpoints=p.tolist(),targets=rows))
for side in ['l','r']:
 distances('Radial nerve.'+side,['zanatomy:posterior-cord-of-brachial-plexus-'+side,'zanatomy:dorsal-digital-branches-of-radial-nerve-'+side],'Proximal posterior cord and distal available radial branches in current atlas; endpoint distances are surface gaps, not axonal continuity proof.')
 distances('Submandibular duct.'+side,['dig:FMA59803' if side=='l' else 'dig:FMA59802','dig:FMA54640'],'Original duct endpoints versus own gland and available tongue; a tongue surface is not a validated duct papilla landmark.')
 for prefix in ['Superior','Middle','Inferior']:
  name=prefix+' trunk of brachial plexus.'+side;target='zanatomy:'+prefix.lower()+'-trunk-of-brachial-plexus-'+side
  for e in ends:
   if prefix.lower()+' trunk' in e['sourceObject'].lower() and e['sourceObject'].endswith('.'+side):distances(e['sourceObject'],[target,'zanatomy:posterior-cord-of-brachial-plexus-'+side],'Division endpoints versus homologous current trunk and posterior cord; medial/lateral cords remain absent.')
 distances('Saphenous nerve.'+side,['zanatomy:femoral-nerve-'+side],'Proximal parent nerve continuity.')
 distances('Medial plantar nerve.'+side,['zanatomy:tibial-nerve-'+side],'Proximal parent nerve continuity.')
 distances('Lateral plantar nerve.'+side,['zanatomy:tibial-nerve-'+side],'Proximal parent nerve continuity.')
distances('Bile duct',['dig:FMA14668','dig:FMA14539','dig:FMA7206'],'Common hepatic/cystic ducts and duodenum; surface distance does not validate luminal continuity.')
hr=json.loads((out/'hra-registration.json').read_text());pelvis=json.loads((out/'hra-pelvis-geometry.json').read_text());bp=json.loads((out.parents[2]/'.cache/phase4-expansion/bp-reference.json').read_text());M=np.array(hr['pelvis']['matrix']);p=np.array(pelvis['VH_M_coccyx']['vertices']);q=p@M[:3,:3].T+M[:3,3];t=BVHTree.FromPolygons(bp['bp3d:FMA16202']['vertices'],bp['bp3d:FMA16202']['faces'],all_triangles=True);s=BVHTree.FromPolygons(pelvis['VH_M_sacrum']['vertices'],pelvis['VH_M_sacrum']['faces'],all_triangles=True)
results.append(dict(sourceObject='VH_M_coccyx',method='All original coccyx vertices to original source sacrum versus registered target sacrum; minimum distance, not joint registration.',sourceMinimumDistanceMm=min(s.find_nearest(Vector(a))[3] for a in p)*1000,targetMinimumDistanceMm=min(t.find_nearest(Vector(a))[3] for a in q)*1000))
(out/'continuity-neural-alternative.json').write_text(json.dumps(dict(method='Fresh authored spline endpoints transformed once by cohort matrix; nearest original target surface in millimetres. No endpoint editing or bridge geometry.',results=results),indent=2),encoding='utf8')
for r in results:print(r['sourceObject'],[(v['name'],round(v['minimumEndpointSurfaceDistanceMm'],2)) for v in r.get('targets',[])] or [r.get('sourceMinimumDistanceMm'),r.get('targetMinimumDistanceMm')],flush=True)
