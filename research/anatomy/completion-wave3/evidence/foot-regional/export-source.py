import bpy,json,numpy as np,hashlib,re
from pathlib import Path
out=Path(__file__).parent
plan=json.loads((out/'candidate-plan.json').read_text(encoding='utf-8'))
source=Path(bpy.data.filepath)
assert hashlib.sha256(source.read_bytes()).hexdigest()==plan['sourceBlendSha256']
refs=json.loads((out/'reference-plan.json').read_text(encoding='utf-8'))['pairs']
names=sorted(set([r['sourceObject'] for r in plan['candidates']]+[r['source'] for r in refs]))
assert not any(re.search(r'\b(uterus|ovary|vagina|vulva|fallopian|mammary|kidney|cochlea|semicircular)\b',name.lower()) for name in names)
dg=bpy.context.evaluated_depsgraph_get();arrays={};records=[]
for name in names:
 obj=bpy.data.objects[name];ev=obj.evaluated_get(dg);mesh=ev.to_mesh();mesh.calc_loop_triangles()
 p=np.array([tuple(v.co) for v in mesh.vertices],dtype=np.float64);M=np.array(ev.matrix_world,dtype=np.float64);p=p@M[:3,:3].T+M[:3,3]
 f=np.array([tuple(t.vertices) for t in mesh.loop_triangles],dtype=np.int32).reshape((-1,3))
 # Preserve publisher-authored orientation; do not create contralateral copies.
 reflected=bool(np.linalg.det(M[:3,:3])<0)
 if reflected:f=f[:,[0,2,1]]
 if len(p)<3 or len(f)==0:
  assert name not in [r['source'] for r in refs],name
  records.append(dict(name=name,type=obj.type,sourceMatrix=M.tolist(),vertices=len(p),triangles=len(f),emptySurface=True))
  print('No evaluated surface:',name,flush=True);ev.to_mesh_clear();continue
 arrays[name+'__p']=p;arrays[name+'__f']=f
 records.append(dict(name=name,type=obj.type,sourceMatrix=M.tolist(),sourceAuthoredReflection=reflected,vertices=len(p),triangles=len(f),bounds=[p.min(0).tolist(),p.max(0).tolist()],positionsSha256=hashlib.sha256(p.tobytes()).hexdigest(),indicesSha256=hashlib.sha256(f.tobytes()).hexdigest(),modifiers=[dict(name=m.name,type=m.type,enabled=m.show_viewport) for m in obj.modifiers],materials=[dict(name=m.name,color=list(m.diffuse_color)) for m in obj.data.materials if m]))
 ev.to_mesh_clear()
np.savez_compressed(out/'source-geometry.npz',**arrays)
(out/'source-geometry.json').write_text(json.dumps(dict(source=str(source),sourceSha256=plan['sourceBlendSha256'],objects=records),indent=2),encoding='utf-8')
print('Fresh export',len(records),'objects; candidates',len(plan['candidates']),'references',len(refs),flush=True)
