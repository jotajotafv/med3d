#!/usr/bin/env python3
"""Extract/build only six audited native ocular surfaces; historical assets are untouched."""
from pathlib import Path
import argparse,hashlib,json,re,struct,urllib.request,zipfile,zlib
ROOT=Path(__file__).resolve().parents[2];research=ROOT/'research/anatomy';out=ROOT/'public/models/anatomy/ocular';out.mkdir(exist_ok=True)
P=argparse.ArgumentParser();P.add_argument('--fetch',action='store_true');A=P.parse_args()
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
def union(bounds):return [[min(b[0][i] for b in bounds) for i in range(3)],[max(b[1][i] for b in bounds) for i in range(3)]]
selection_path=research/'ocular-selection.json';source_path=research/'ocular-originals.zip';lock_path=research/'ocular-source-lock.json'
assert sha(selection_path.read_bytes())=='7eb7ad1a95eb89410426c6d7de7a772bb6138fb3f5245b929d1338e12cb46fcc'
selection=json.loads(selection_path.read_text(encoding='utf8'));approved={u['elementId']:u for u in selection['approved']};assert len(approved)==6
if A.fetch:
 assert not source_path.exists(),'Preserve existing originals'
 requests=[];files=[];originals={};url=selection['sourceArchive']
 def getrange(start,end):
  req=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}','Accept-Encoding':'identity'})
  with urllib.request.urlopen(req,timeout=90) as res:
   assert res.status==206 and res.headers.get('Content-Range')==f'bytes {start}-{end}/142903898';data=res.read(end-start+2)
  assert len(data)==end-start+1;requests.append(dict(start=start,end=end,bytes=len(data)));return data
 for fid,u in approved.items():
  entry=u['archiveEntry'];h=struct.unpack('<4s5H3L2H',getrange(entry['offset'],entry['offset']+29));assert h[0]==b'PK\x03\x04' and h[3]==8
  start=entry['offset']+30+h[9]+h[10];data=zlib.decompress(getrange(start,start+entry['compressedBytes']-1),-15)
  assert len(data)==entry['bytes'] and f'{zlib.crc32(data):08x}'==entry['crc32']
  headers={k:re.search(r'# '+k+r'\s*:\s*(.+)',data.decode()).group(1) for k in ['File ID','Concept ID','Representation ID','Compatibility version']}
  assert headers=={'File ID':fid,'Concept ID':u['sourceId'],'Representation ID':u['representationId'],'Compatibility version':'4.0'},headers
  originals[fid+'.obj']=data;files.append(dict(path=fid+'.obj',elementId=fid,sourceId=u['sourceId'],representationId=u['representationId'],sourceVersion='4.0',bytes=len(data),sha256=sha(data)))
 with zipfile.ZipFile(source_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  for name,data in originals.items():
   info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));info.external_attr=0o100644<<16;z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 write_json(lock_path,dict(sourceArchive=url,selectionSha256=sha(selection_path.read_bytes()),sourceZipSha256=sha(source_path.read_bytes()),sourceZipBytes=source_path.stat().st_size,requests=requests,files=files))
lock=json.loads(lock_path.read_text(encoding='utf8'));assert sha(source_path.read_bytes())==lock['sourceZipSha256'] and sha(selection_path.read_bytes())==lock['selectionSha256']
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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D native ocular components'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Componentes oculares · material de visualización',pbrMetallicRoughness=dict(
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



skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'));nodes=[];manifestFiles=[];g=GLB()
with zipfile.ZipFile(source_path) as z:
 assert set(z.namelist())=={fid+'.obj' for fid in approved}
 for fid,u in approved.items():
  data=z.read(fid+'.obj');f=next(f for f in lock['files'] if f['elementId']==fid);assert sha(data)==f['sha256'];parsed=parse_obj(data);bounds=parsed[3]
  assert (sum(b[0] for b in bounds)<0)==(u['side']=='right'),'Source lateral position'
  node=dict(id=u['id'],name=u['name'],anatomicalName=u['name'],latin=u['latin'],sourceId=u['sourceId'],aliases=[u['sourceName'],u['sourceId'],fid,'ojo','globo ocular','órbita'],systemId='nervous',regionId='nervous:ocular',explosionRegionId='head-neck',parentId=u['parentId'],children=[],kind='component',family=u['family'],ocularClass=u['family'],neuralType='componente ocular',assetIds=['nervous:ocular'],meshNames=[f"bp3d_{u['sourceId']}_{fid}"],relatedIds=[],side=u['side'],bounds=bounds)
  g.mesh(node,fid,parsed);nodes.append(node)
  rawpositions=[list(map(float,l.split()[1:4])) for l in data.decode().splitlines() if l.startswith('v ')]
  manifestFiles.append(dict(**f,anatomyId=node['id'],ownerSourceId=u['sourceId'],side=u['side'],family=u['family'],moduleId='nervous:ocular',sourceType='componente ocular',triangles=len(parsed[2])//3,faces=len(parsed[2])//3,sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=bounds,sourceBoundsMillimetres=union([[p,p] for p in rawpositions])))
for u in selection['parents']:
 children=[n for n in nodes if n.get('parentId')==u['id']]
 nodes.append(dict(id=u['id'],name=u['name'],anatomicalName=u['name'],latin=u['latin'],sourceId=u['sourceId'],aliases=[u['sourceName'],'globo ocular '+('derecho' if u['side']=='right' else 'izquierdo'),'eye','eyeball','órbita',u['sourceId']],systemId='nervous',regionId='nervous:ocular',explosionRegionId='head-neck',parentId='nervous:ocular',children=[n['id'] for n in children],kind='structure',family='eyeball',ocularClass='eyeball',neuralType='órgano sensorial · cobertura parcial',assetIds=['nervous:ocular'],meshNames=[],relatedIds=['bp3d:FMA50875' if u['side']=='right' else 'bp3d:FMA50878'],side=u['side'],bounds=union([n['bounds'] for n in children])))
bounds=union([n['bounds'] for n in nodes]);nodes.insert(0,dict(id='nervous:ocular',name='Ojos · cobertura disponible',anatomicalName='Ojos · cobertura disponible',latin='Bulbi oculi',aliases=['ojo','ocular','órbita','visión','órganos de los sentidos'],systemId='nervous',regionId='nervous:ocular',explosionRegionId='head-neck',children=[u['id'] for u in selection['parents']],kind='region',ocularClass='eyeball',neuralType='región ocular',assetIds=['nervous:ocular'],meshNames=[],relatedIds=[],bounds=bounds))
target=out/'ocular.glb';g.write(target)
prov=dict(skeleton['provenance'][0]);prov.update(id='bodyparts3d-4.0-ocular',version='4.0 OBJ99',modifications=['Seis componentes bilaterales de dos globos oculares parciales: córnea, esclerótica e iris.','Transformación (x,y,z) → (x,z,-y)/1000, sin registro adicional, desplazamiento, deformación ni decimación.','Posiciones Float32, Meshopt y cuantización sólo de normales.','Materiales esquemáticos; no simulación óptica ni color de iris representativo del individuo.'])
asset=dict(id='nervous:ocular',path='models/anatomy/ocular/ocular.glb',systemId='nervous',regionId='nervous:ocular',frameId=skeleton['frame']['id'],bytes=target.stat().st_size,sha256=sha(target.read_bytes()),meshCount=6,triangles=sum(f['triangles'] for f in manifestFiles),bounds=bounds,provenanceId=prov['id'])
catalog=dict(schemaVersion=1,id='med3d-ocular-extension',frame=skeleton['frame'],nodes=nodes,assets=[asset],provenance=[prov],coverage=dict(title='Cobertura ocular parcial disponible',structures=2,meshes=6,note='Dos globos oculares parciales: córnea, esclerótica e iris. Agrupados editorialmente con las vías sensoriales, sin un sistema adicional.',limitations=['No se representa el globo ocular completo ni sus capas internas, cristalino o humores.','La córnea usa transparencia esquemática para mostrar el iris; no constituye simulación óptica.','No se añaden músculos extraoculares ni se corrigen las aperturas de la piel.']))
write_json(out/'catalog.json',catalog)
write_json(out/'ocular-source-manifest.json',dict(sourceZip='research/anatomy/ocular-originals.zip',sourceZipSha256=lock['sourceZipSha256'],selectionSha256=lock['selectionSha256'],sourceLock='research/anatomy/ocular-source-lock.json',transform=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],additionalRegistration='none; native BP3D 4.0 frame',files=manifestFiles))
(out/'LICENSE.txt').write_text(prov['attribution']+'\n'+prov['licenseUrl']+'\nSource: '+prov['originalUrl']+'\n'+'\n'.join(prov['modifications'])+'\n',encoding='utf8',newline='\n')
print(json.dumps(dict(meshes=6,triangles=asset['triangles'],bounds=bounds,sourceZipSha256=lock['sourceZipSha256']),indent=2))
