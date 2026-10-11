#!/usr/bin/env python3
"""Build only reviewed native additions. Never alters historical GLBs.
Usage: python scripts/anatomy/build-completion.py wave1 [--install]
Build requires pinned originals and selection. Optimize/validate BEFORE --install.
"""
from pathlib import Path
import argparse,copy,hashlib,json,struct,zipfile
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('wave');p.add_argument('--install',action='store_true');A=p.parse_args()
assert A.wave in ['wave1','wave2']
research=ROOT/'research/anatomy';out=ROOT/'.cache/anatomy-completion'/A.wave
out.mkdir(parents=True,exist_ok=True)
selection_path=research/f'completion-{A.wave}-selection.json'
source_path=research/f'completion-{A.wave}-originals.zip'
lock_path=research/f'completion-{A.wave}-source-lock.json'
sha=lambda data:hashlib.sha256(data).hexdigest()
def read(path):return json.loads(path.read_text(encoding='utf8'))
def write(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
def union(bounds):return [[min(b[0][i] for b in bounds) for i in range(3)],[max(b[1][i] for b in bounds) for i in range(3)]]
selection=read(selection_path);lock=read(lock_path)
assert sha(selection_path.read_bytes())==lock['selectionSha256']
assert sha(source_path.read_bytes())==lock['sourceZipSha256']
approved={f['elementId']:f for f in lock['files']}
def parse_obj(data):
    positions, normals, faces = [], [], []
    for line in data.decode().splitlines():
        w = line.split()
        if not w: continue
        if w[0] == 'v':
            x,y,z = map(float,w[1:4]); positions.append((x*.001,z*.001,-y*.001))
        elif w[0] == 'vn':
            x,y,z = map(float,w[1:4]); normals.append((x,z,-y))
        elif w[0] == 'f':
            if len(w) != 4: raise ValueError('Source is not triangular')
            faces.append(w[1:])
    vertices, vertex_normals, indices, seen = [], [], [], {}
    for face in faces:
        for token in face:
            parts = token.split('/')
            if len(parts) < 3 or not parts[2]: raise ValueError('Missing original normal')
            vi,ni = int(parts[0]),int(parts[2])
            vi = vi-1 if vi>0 else len(positions)+vi
            ni = ni-1 if ni>0 else len(normals)+ni
            key = (vi,ni)
            if key not in seen:
                seen[key] = len(vertices); vertices.append(positions[vi]); vertex_normals.append(normals[ni])
            indices.append(seen[key])
    assert vertices and indices
    return vertices,vertex_normals,indices,union([[p,p] for p in vertices]),len(positions)

class GLB:
    def __init__(self):
        self.binary = bytearray()
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D native anatomical completion'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Material esquemático',pbrMetallicRoughness=dict(
                baseColorFactor=[.72,.64,.58,1],metallicFactor=0,roughnessFactor=.8),doubleSided=False)])
    def accessor(self, values, component, kind, count, bounds=None, target=None):
        while len(self.binary)%4:self.binary.append(0)
        view=dict(buffer=0,byteOffset=len(self.binary),byteLength=len(values))
        if target:view['target']=target
        index=len(self.g['bufferViews']);self.g['bufferViews'].append(view);self.binary.extend(values)
        accessor=dict(bufferView=index,componentType=component,count=count,type=kind)
        if bounds:accessor['min'],accessor['max']=bounds
        self.g['accessors'].append(accessor);return len(self.g['accessors'])-1
    def mesh(self, node, fid, parsed):
        vertices,normals,indices,bounds,_=parsed
        pi=self.accessor(struct.pack('<'+'f'*len(vertices)*3,*(c for p in vertices for c in p)),5126,'VEC3',len(vertices),bounds,34962)
        ni=self.accessor(struct.pack('<'+'f'*len(normals)*3,*(c for p in normals for c in p)),5126,'VEC3',len(normals),target=34962)
        short=len(vertices)<65536
        ii=self.accessor(struct.pack('<'+('H' if short else 'I')*len(indices),*indices),5123 if short else 5125,'SCALAR',len(indices),target=34963)
        mesh_index=len(self.g['meshes']);name=f"bp3d_{approved[fid]['sourceId']}_{fid}"
        self.g['meshes'].append(dict(name=name,primitives=[dict(attributes={'POSITION':pi,'NORMAL':ni},indices=ii,material=0)]))
        self.g['nodes'].append(dict(name=name,mesh=mesh_index,extras=dict(sourceId=approved[fid]['sourceId'],sourceElement=fid,anatomyId=node['id'])))
        self.g['scenes'][0]['nodes'].append(len(self.g['nodes'])-1)
    def write(self, path):
        while len(self.binary)%4:self.binary.append(0)
        self.g['buffers']=[{'byteLength':len(self.binary)}]
        js=json.dumps(self.g,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4)
        total=12+8+len(js)+8+len(self.binary)
        path.write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+
                         struct.pack('<II',len(self.binary),0x004E4942)+self.binary)




if A.install:
 catalog=read(out/'catalog.json');validation=read(out/'completion-validation.json');gltf=read(out/'gltf-validation.json')
 assert len(validation['modules'])==len(catalog['assets'])==len(gltf['modules'])
 for asset in catalog['assets']:
  assert sha((ROOT/'public'/asset['path']).read_bytes())==asset['sha256']
 for destination in selection['catalogs']:
  path=ROOT/f'public/models/anatomy/{destination}/catalog.json';base=read(path)
  nodes=[n for n in catalog['nodes'] if n['id'] in selection['catalogs'][destination]]
  assets=[a for a in catalog['assets'] if a['id'] in {i for n in nodes for i in n['assetIds']}]
  ids={n['id'] for n in nodes};assert not ids.intersection(n['id'] for n in base['nodes']),'Already installed; verify existing cohort instead of rebuilding'
  assert not {a['id'] for a in assets}.intersection(a['id'] for a in base['assets'])
  base['nodes'].extend(nodes);base['assets'].extend(assets)
  lessons={n['educationId'] for n in nodes if n.get('educationId')}
  base.setdefault('education',{}).update({key:catalog['education'][key] for key in lessons})
  if assets:base['provenance'].append(catalog['provenance'][0])
  byid={n['id']:n for n in base['nodes']}
  for node in nodes:
   parent=byid[node['parentId']]
   if node['id'] not in parent['children']:parent['children'].append(node['id'])
  affected=set(ids)
  for nid in ids:
   parent=byid[nid]
   while parent.get('parentId'):
    affected.add(parent['parentId']);parent=byid[parent['parentId']]
  def aggregate(n):
   if n['id'] not in affected or not n['children']:return
   for child in n['children']:aggregate(byid[child])
   children=[byid[i] for i in n['children']]
   n['assetIds']=list(dict.fromkeys(n['assetIds']+[a for c in children for a in c['assetIds']]))
   n['bounds']=union([c['bounds'] for c in children if c.get('bounds')]+([n['bounds']] if n.get('bounds') else []))
  for n in base['nodes']:
   if not n.get('parentId'):aggregate(n)
  base['coverage']['structures']=sum(n['kind']=='structure' for n in base['nodes'])
  base['coverage']['meshes']=sum(a['meshCount'] for a in base['assets'])
  base['coverage']['limitations'].append(selection['coverageNote'])
  if destination=='ocular':
   base['coverage']['note']='Globos oculares parciales y estructuras orbitarias disponibles. Cobertura macroscópica, sin simulación óptica ni histología.'
   base['coverage']['limitations']=[s for s in base['coverage']['limitations'] if not s.startswith(('No se representa el globo','No se añaden músculos'))]
   base['coverage']['limitations'].append('Persisten estructuras oculares ausentes; no se representan capas celulares ni dinámica ocular.')
  write(path,base)
 print('Installed reviewed optional cohort '+A.wave)
 raise SystemExit
skeleton=read(ROOT/'public/models/anatomy/skeletal/catalog.json')
prov=copy.deepcopy(skeleton['provenance'][0]);prov.update(id='bodyparts3d-4.0-completion-'+A.wave,version='4.0 OBJ99',modifications=[selection['coverageNote'],'One native transform (x,y,z) -> (x,z,-y)/1000. No individual registration, centering, deformation, mirroring or simplification.','Float32 positions; Meshopt lossless position compression; display normals quantized to 12 bits.','Current official CC BY 4.0 declaration; original historical headers preserved in source ZIP.'])
nodes=copy.deepcopy(selection['nodes']);files=[];assets=[]
with zipfile.ZipFile(source_path) as z:
 assert set(z.namelist())=={f+'.obj' for f in approved}
 for module in selection['modules']:
  g=GLB();module_files=[]
  for node in [n for n in nodes if module['id'] in n['assetIds'] and n.get('sourceElements')]:
   bounds=[];node['meshNames']=[]
   for fid in node.pop('sourceElements'):
    f=approved[fid];data=z.read(fid+'.obj');assert sha(data)==f['sha256']
    parsed=parse_obj(data);bounds.append(parsed[3]);g.mesh(node,fid,parsed)
    node['meshNames'].append(f"bp3d_{f['sourceId']}_{fid}")
    entry=dict(**f,anatomyId=node['id'],ownerSourceId=node['sourceId'],side=node.get('side'),family=node['family'],moduleId=module['id'],triangles=len(parsed[2])//3,sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3])
    module_files.append(entry);files.append(entry)
   node['bounds']=union(bounds)
  target=ROOT/'public'/module['path'];target.parent.mkdir(parents=True,exist_ok=True);assert not target.exists(),'Do not overwrite final GLB; use verify-only'
  g.write(target)
  assets.append(dict(**module,frameId=skeleton['frame']['id'],defaultEnabled=False,bytes=target.stat().st_size,sha256=sha(target.read_bytes()),meshCount=len(module_files),triangles=sum(f['triangles'] for f in module_files),bounds=union([f['boundsMetres'] for f in module_files]),provenanceId=prov['id']))
byid={n['id']:n for n in nodes}
for node in nodes:
 if not node.get('bounds'):
  descendants=[n for n in nodes if n.get('parentId')==node['id']]
  node['children']=[n['id'] for n in descendants];node['bounds']=union([n['bounds'] for n in descendants])
catalog=dict(schemaVersion=1,id='completion-'+A.wave,frame=skeleton['frame'],nodes=nodes,assets=assets,education=selection['education'],provenance=[prov],coverage=dict(title='Ampliación anatómica opcional',structures=sum(n['kind']=='structure' for n in nodes),meshes=len(files),note=selection['coverageNote'],limitations=[]))
write(out/'catalog.json',catalog)
write(out/'completion-source-manifest.json',dict(sourceZip=str(source_path.relative_to(ROOT)).replace('\\','/'),sourceZipSha256=lock['sourceZipSha256'],selectionSha256=lock['selectionSha256'],sourceLock=str(lock_path.relative_to(ROOT)).replace('\\','/'),transform=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],additionalRegistration='none; native BP3D 4.0 frame',files=files))
print(json.dumps(dict(wave=A.wave,modules=len(assets),meshes=len(files),triangles=sum(a['triangles'] for a in assets))))
