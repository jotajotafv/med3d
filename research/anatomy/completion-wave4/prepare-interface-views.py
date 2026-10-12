import json, numpy as np
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
out=Path(__file__).parent
read=lambda p:json.loads(p.read_text(encoding='utf8'))
write=lambda p,x:p.write_text(json.dumps(x,separators=(',',':'),ensure_ascii=False)+'\n',encoding='utf8')
soft=read(out/'target-soft.json');bp=read(Path('.cache/phase4-expansion/bp-reference.json'))
bones={r['id']:{**bp[r['id']],**r} for r in read(out/'target-bones.json')}
native=np.load(out/'native/source-geometry.npz');z=np.load(out/'source-geometry.npz');reg=read(out/'registration.json')
plan={r['sourceObject']:r for r in read(out/'native/candidate-plan.json')['candidates']}
cases=[];metrics=[]
def geometry(name,arr,m=None):
 p=arr[name+'__p'];f=arr[name+'__f']
 if m is not None:p=p@np.array(m)[:3,:3].T+np.array(m)[:3,3]
 return dict(name=name,vertices=p.tolist(),faces=f.tolist())
def add(name,sources,targets,direction=[0,0,1],note=''):
 cases.append(dict(name=name,sources=sources,targets=targets,direction=direction,note=note))
def compare(source,target):
 p=np.array(source['vertices']);t=BVHTree.FromPolygons(target['vertices'],target['faces'],all_triangles=True)
 ds=np.array([t.find_nearest(Vector(q))[3]*1000 for q in p])
 return dict(source=source['name'],target=target['name'],samples=len(p),distanceMm=dict(min=float(ds.min()),median=float(np.median(ds)),p95=float(np.quantile(ds,.95)),max=float(ds.max())))
for side,fjs,parent in [('left',['FJ2214','FJ2241','FJ2259'],'bp3d:FMA22798'),('right',['FJ2266','FJ2293','FJ2311'],'bp3d:FMA22797')]:
 ss=[geometry(n,native) for n in fjs];ts=[soft[parent]]
 p=np.concatenate([np.array(s['vertices']) for s in ss]);lo=p.min(0)-.01;hi=p.max(0)+.01
 for k,g in bones.items():
  a=np.array(g['vertices'])
  if np.all(a.max(0)>=lo) and np.all(a.min(0)<=hi):ts.append(g)
 for s in ss:metrics.append(compare(s,soft[parent]))
 add('native-forearm-'+side,ss,ts,note='Originales BP3D; cyan: candidatos; rojo: arteria cubital; huesos sin transformar.')
ss=[geometry(n,native) for n in ['FJ2049','FJ2052']];ts=[soft[n] for n in ['uri:FMA7205','bp3d:FMA14753','uri:FMA9705'] if n in soft]
add('native-renal-left',ss,ts,direction=[0,0,1],note='Candidatos segmentarios izquierdos; contexto renal original.')
for s in ss:metrics.append(compare(s,soft['bp3d:FMA14753']))
for n,region,targets in [('pituitary','craniofacial',['endo:FMA13889']),('nails-foot','foot_l',['integ:FMA7163']),('nails-hand','upper',['integ:FMA7163'])]:
 names={'pituitary':['Adenohypophysis','Neurohypophysis'],'nails-foot':['Nail plate (foot).l'],'nails-hand':['Nail plate.l']}[n]
 ss=[geometry(k,z,reg['regions'][region]['matrix']) for k in names];ts=[soft[k] for k in targets]
 if n=='pituitary':ts += [g for k,g in bones.items() if 'esfeno' in g.get('name','').lower()]
 add('z-'+n,ss,ts,direction=[1,0,0] if n=='pituitary' else [0,1,1],note='Un registro regional común; sin ajuste individual. Fuente cyan; destino blanco/rojo.')
v=np.load(out/'visceral/source-geometry.npz');vr=read(out/'visceral/registration.json')['pelvic-source']['matrix']
ss=[geometry(n,v,vr) for n in ['Ejaculatory duct.l','Ejaculatory duct.r']]
ts=[soft[k] for k in ['rep:FMA9600','uri:FMA19667','rep:FMA19387','rep:FMA19388'] if k in soft]
add('z-ejaculatory-visceral',ss,ts,direction=[1,0,0],note='Registro común visceral; próstata, uretra y vesículas originales.')
for s in ss:
 for t in ts:metrics.append(compare(s,t))
hr=read(out/'hra-registration.json')
for asset,region,target in [('kidney-male-left','abdominopelvic','uri:FMA7205'),('kidney-male-right','abdominopelvic','uri:FMA7204'),('large-intestine-male','colon','dig:FMA14544')]:
 gs=read(out/'hra'/asset/'geometry.json');m=np.array(hr[region]['matrix']);ss=[]
 for name,g in gs.items():
  p=np.array(g['vertices'])@m[:3,:3].T+m[:3,3];ss.append(dict(name=name,vertices=p.tolist(),faces=g['faces']))
 ts=[soft[target]] if region=='abdominopelvic' else [soft[k] for k in ['dig:FMA14545','dig:FMA14547','dig:FMA14544']]
 add('hra-'+asset,ss,ts,note='Registro común '+region+'; superficies originales de ambos donantes, sin deformación.')
 for s in ss:metrics.append(compare(s,soft[target]))
write(out/'interface-views.json',cases);write(out/'continuity-metrics.json',metrics)
print('Prepared',len(cases),'views',len(metrics),'surface continuity measures',flush=True)
