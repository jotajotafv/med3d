"""Blender 5.1, factory startup and --disable-autoexec: reproduce retained native data.
No downloads, scripts embedded in the atlas, source edits or catalog writes.
"""
import bpy,json,zipfile,hashlib,numpy as np
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];CACHE=ROOT/'.cache/phase4-expansion'
selection=json.loads((ROOT/'research/anatomy/nervous-expansion-selection.json').read_text(encoding='utf-8'))
lock=json.loads((ROOT/'research/anatomy/nervous-expansion-source-lock.json').read_text(encoding='utf-8'))
with zipfile.ZipFile(ROOT/'research/anatomy/nervous-expansion-originals.zip') as archive:
 data=archive.read('selected-originals.blend');assert hashlib.sha256(data).hexdigest()==lock['nativeSubsetSha256']
 references=json.loads(archive.read('world-geometry.json'));native=CACHE/'verify-selected-originals.blend';native.write_bytes(data)
with bpy.data.libraries.load(str(native),link=False) as (src,dst):dst.objects=src.objects
for obj in dst.objects:
 if obj: bpy.context.scene.collection.objects.link(obj)
bpy.context.view_layer.update();dg=bpy.context.evaluated_depsgraph_get();rows=[]
for row in selection['candidates']:
 if row['decision']!='APROBADO':continue
 obj=bpy.data.objects[row['sourceObject']];ev=obj.evaluated_get(dg);mesh=ev.to_mesh();mesh.calc_loop_triangles()
 M=np.array(ev.matrix_world,dtype=np.float64);p=np.array([tuple(v.co) for v in mesh.vertices],dtype=np.float64)@M[:3,:3].T+M[:3,3];f=np.array([tuple(t.vertices) for t in mesh.loop_triangles],dtype=np.int32)
 if np.linalg.det(M[:3,:3])<0:f=f[:,[0,2,1]]
 reference=references[row['id']];assert np.array_equal(f,reference['faces']),row['id']
 error=float(np.max(np.linalg.norm(p-np.array(reference['positions']),axis=1)));assert error<1e-7,(row['id'],error)
 rows.append(dict(id=row['id'],vertices=len(p),triangles=len(f),maxNativePositionErrorMetres=error,sourceTrianglesIdentical=True));ev.to_mesh_clear()
(CACHE/'native-reproduction.json').write_text(json.dumps(dict(success=True,objects=len(rows),maxNativePositionErrorMetres=max(r['maxNativePositionErrorMetres'] for r in rows),elements=rows),indent=2),encoding='utf-8')
print('Native retained geometry reproduced',len(rows),'objects; max error',max(r['maxNativePositionErrorMetres'] for r in rows))
