#!/usr/bin/env python3
"""Build only the approved native BP3D skin. No historical assets are rebuilt."""
from pathlib import Path
import argparse,hashlib,json,re,struct,urllib.request,zipfile,zlib
ROOT=Path(__file__).resolve().parents[2]
P=argparse.ArgumentParser(description=__doc__);P.add_argument('--fetch',action='store_true');A=P.parse_args()
research=ROOT/'research/anatomy';out=ROOT/'public/models/anatomy/integumentary';out.mkdir(exist_ok=True)
selection_path=research/'integumentary-selection.json';source_path=research/'integumentary-originals.zip';lock_path=research/'integumentary-source-lock.json'
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
def union(bounds):return [[min(b[0][i] for b in bounds) for i in range(3)],[max(b[1][i] for b in bounds) for i in range(3)]]
assert sha(selection_path.read_bytes())=='39416375b68a0e2737c20a4a6f817d34ccc25fef74f931851d05c3bfa14fd919','Pinned audit changed'
selection=json.loads(selection_path.read_text(encoding='utf8'));approved={u['elementId']:u for u in selection['approved']};assert set(approved)=={'FJ2810'}
u=approved['FJ2810'];url=selection['sourceArchive'];entry=u['archiveEntry']
if A.fetch:
 requests=[]
 def getrange(start,end):
  req=urllib.request.Request(url,headers={'Range':f'bytes={start}-{end}','Accept-Encoding':'identity'})
  with urllib.request.urlopen(req,timeout=90) as res:
   assert res.status==206 and res.headers.get('Content-Range')==f'bytes {start}-{end}/142903898';data=res.read(end-start+2)
  assert len(data)==end-start+1;requests.append(dict(start=start,end=end,bytes=len(data)));return data
 h=struct.unpack('<4s5H3L2H',getrange(entry['offset'],entry['offset']+29));assert h[0]==b'PK\x03\x04' and h[3]==8
 start=entry['offset']+30+h[9]+h[10];data=zlib.decompress(getrange(start,start+entry['compressedBytes']-1),-15)
 assert len(data)==entry['bytes'] and f'{zlib.crc32(data):08x}'==entry['crc32']
 headers={k:re.search(r'# '+k+r'\s*:\s*(.+)',data.decode()).group(1) for k in ['File ID','Concept ID','Representation ID','Compatibility version']}
 assert headers=={'File ID':'FJ2810','Concept ID':'FMA7163','Representation ID':'BP9115','Compatibility version':'4.0'},headers
 with zipfile.ZipFile(source_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
  info=zipfile.ZipInfo('FJ2810.obj',date_time=(1980,1,1,0,0,0));info.external_attr=0o100644<<16;z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 write_json(lock_path,dict(sourceArchive=url,selectionSha256=sha(selection_path.read_bytes()),sourceZipSha256=sha(source_path.read_bytes()),sourceZipBytes=source_path.stat().st_size,requests=requests,files=[dict(path='FJ2810.obj',elementId='FJ2810',sourceId='FMA7163',representationId='BP9115',sourceVersion='4.0',bytes=len(data),sha256=sha(data))]))
lock=json.loads(lock_path.read_text(encoding='utf8'));assert sha(source_path.read_bytes())==lock['sourceZipSha256'] and sha(selection_path.read_bytes())==lock['selectionSha256']
with zipfile.ZipFile(source_path) as z:
 assert z.namelist()==['FJ2810.obj'];data=z.read('FJ2810.obj')
assert sha(data)==lock['files'][0]['sha256']
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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D native skin'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Piel · material neutro de visualización',pbrMetallicRoughness=dict(
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


skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'))
parsed=parse_obj(data);bounds=parsed[3]
skin=dict(id=u['id'],name=u['name'],anatomicalName=u['name'],latin='Cutis',sourceId='FMA7163',aliases=['piel','skin','integument','superficie corporal','envoltura corporal','FMA7163','FJ2810','BP9115'],systemId='integumentary',regionId='integumentary',parentId='integumentary',children=[],kind='structure',family='skin',integumentaryType='superficie corporal externa',assetIds=['integumentary:skin'],meshNames=['bp3d_FMA7163_FJ2810'],relatedIds=[],side='midline',bounds=bounds)
system=dict(id='integumentary',name='Sistema tegumentario',anatomicalName='Sistema tegumentario',latin='Integumentum commune',aliases=['sistema tegumentario','piel','skin','integument','integumentary system'],systemId='integumentary',regionId='integumentary',children=[skin['id']],kind='system',assetIds=skin['assetIds'],meshNames=[],relatedIds=[],bounds=bounds)
g=GLB();g.mesh(skin,'FJ2810',parsed);target=out/'skin.glb';g.write(target)
prov=dict(skeleton['provenance'][0]);prov.update(id='bodyparts3d-4.0-integumentary',version='4.0 OBJ99',modifications=['Pieza única FMA7163/FJ2810; todos los triángulos originales conservados.','Transformación (x,y,z) → (x,z,-y)/1000, sin ajuste, recorte, deformación ni decimación adicional.','Posiciones Float32; compresión Meshopt y cuantización sólo de normales.','Material neutro sin textura ni identificación de etnia. No se representan capas histológicas.'])
asset=dict(id='integumentary:skin',path='models/anatomy/integumentary/skin.glb',systemId='integumentary',regionId='integumentary',frameId=skeleton['frame']['id'],bytes=target.stat().st_size,sha256=sha(target.read_bytes()),meshCount=1,triangles=len(parsed[2])//3,bounds=bounds,provenanceId=prov['id'])
catalog=dict(schemaVersion=1,id='med3d-integumentary',frame=skeleton['frame'],nodes=[system,skin],assets=[asset],provenance=[prov],coverage=dict(title='Superficie corporal tegumentaria disponible',structures=1,meshes=1,note='Piel: una superficie corporal nativa, una unidad y una malla. Sin particiones regionales inventadas.',limitations=['Superficie externa del cuerpo masculino de referencia, no representación universal de cuerpos o fenotipos.','No representa grosor clínico ni capas histológicas separadas de epidermis, dermis o hipodermis.','Subcutáneo y uñas pendientes; pelo no integrado. No hay regiones cutáneas independientes para aislar.','Se conservan costuras, orificios y posibles penetraciones del modelo fuente. No constituye validación clínica.','La pieza fuente contiene dos superficies principales y pequeños fragmentos geométricos; no se etiquetan como capas histológicas ni regiones anatómicas.']))
write_json(out/'catalog.json',catalog)
positions=[list(map(float,l.split()[1:4])) for l in data.decode().splitlines() if l.startswith('v ')]
manifest=dict(sourceZip='research/anatomy/integumentary-originals.zip',sourceZipSha256=lock['sourceZipSha256'],selectionSha256=lock['selectionSha256'],sourceLock='research/anatomy/integumentary-source-lock.json',transform=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],additionalRegistration='none; native BP3D 4.0 frame',files=[dict(**lock['files'][0],anatomyId=skin['id'],ownerSourceId='FMA7163',side='midline',family='skin',moduleId=asset['id'],sourceType=skin['integumentaryType'],triangles=asset['triangles'],faces=asset['triangles'],sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=bounds,sourceBoundsMillimetres=union([[p,p] for p in positions]))])
write_json(out/'integumentary-source-manifest.json',manifest)
(out/'LICENSE.txt').write_text(prov['attribution']+'\n'+prov['licenseUrl']+'\nSource: '+prov['originalUrl']+'\nVersion: '+prov['version']+'\n'+'\n'.join(prov['modifications'])+'\nOriginal hashes: integumentary-source-manifest.json\n',encoding='utf8',newline='\n')
print(json.dumps(dict(meshes=1,triangles=asset['triangles'],sourcePositions=parsed[4],bounds=bounds,referenceBounds=skeleton['frame']['bounds'],sourceZipSha256=lock['sourceZipSha256']),indent=2))
