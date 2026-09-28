#!/usr/bin/env python3
"""Build only the explicitly audited digestive cohort; historical assets are never rebuilt.

Exact HTTP ranges, pinned metadata/directory, original per-side files. No fitting,
mirroring, per-mesh normalization or simplification. Run optimize-digestive.mjs next.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import hashlib
import json
import re
import struct
import urllib.request
import zipfile
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
URL = 'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip'
ARCHIVE_BYTES = 142903898
CD_OFFSET, CD_BYTES = 142733851, 170025
CD_SHA = 'edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
TRANSFORM = [[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]
P = argparse.ArgumentParser(description=__doc__)
P.add_argument('--fetch', action='store_true')
P.add_argument('--source', type=Path, default=ROOT/'research/anatomy/digestive-originals.zip')
P.add_argument('--output', type=Path, default=ROOT/'public/models/anatomy/digestive')
A = P.parse_args()
selection_path = ROOT/'research/anatomy/digestive-selection.json'
SELECTED_SHA = 'a3567e4b9fb349205df7f298ee78b0c1a2cb1e27d755b76b5f5d578efa7ec0e6'
if hashlib.sha256(selection_path.read_bytes()).hexdigest() != SELECTED_SHA:
    raise ValueError('Approved audit changed; review required before any extraction or output')
selection = json.loads(selection_path.read_text(encoding='utf-8'))
approved = {r['elementId']: r for r in selection['approved']}
assert len(approved) == len(selection['approved']) == 96, 'Only the explicitly audited 96 elements may be processed'
source_lock = A.source.with_name('digestive-source-lock.json')

def sha(data): return hashlib.sha256(data).hexdigest()
def write_json(path, value): path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
def union(bounds):
    return [[min(b[0][i] for b in bounds) for i in range(3)], [max(b[1][i] for b in bounds) for i in range(3)]]

if A.fetch:
    transferred = []
    def fetch_range(start, end):
        req = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity'})
        with urllib.request.urlopen(req, timeout=90) as response:
            if response.status != 206 or response.headers.get('Content-Range') != f'bytes {start}-{end}/{ARCHIVE_BYTES}':
                raise ValueError('Server did not honor exact Range; refusing full ZIP')
            data = response.read(end-start+2)
        if len(data) != end-start+1: raise ValueError('Range size mismatch')
        transferred.append({'range': f'{start}-{end}', 'bytes': len(data)})
        return data
    directory = fetch_range(CD_OFFSET, CD_OFFSET+CD_BYTES-1)
    if sha(directory) != CD_SHA: raise ValueError('Pinned upstream ZIP directory changed')
    entries, offset = {}, 0
    while offset < len(directory):
        h = struct.unpack_from('<4s6H3L5H2L', directory, offset)
        if h[0] != b'PK\x01\x02': raise ValueError('Invalid central directory')
        name = directory[offset+46:offset+46+h[10]].decode()
        entries[Path(name).stem] = dict(path=name, method=h[4], crc=h[7], compressed=h[8], bytes=h[9], offset=h[16])
        offset += 46+h[10]+h[11]+h[12]
    assert len(entries) == 2234
    def extract(fid):
        e = entries[fid]
        audited = approved[fid]['archiveEntry']
        if (e['path'],e['bytes'],e['compressed'],f"{e['crc']:08x}") != (audited['path'],audited['bytes'],audited['compressedBytes'],audited['crc32']):
            raise ValueError('Audited directory entry changed: '+fid)
        cached=ROOT/'.cache/phase7/native'/(fid+'.obj')
        if cached.exists():
            data=cached.read_bytes()
            if len(data)==e['bytes'] and zlib.crc32(data)==e['crc']:return fid,data
        h = struct.unpack('<4s5H3L2H', fetch_range(e['offset'],e['offset']+29))
        if h[0] != b'PK\x03\x04' or h[3] != 8 or e['method'] != 8: raise ValueError('Unexpected ZIP member')
        start = e['offset']+30+h[9]+h[10]
        data = zlib.decompress(fetch_range(start,start+e['compressed']-1),-15)
        if len(data) != e['bytes'] or zlib.crc32(data) != e['crc']: raise ValueError('Size/CRC mismatch: '+fid)
        return fid,data
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        originals = dict(pool.map(extract, sorted(approved)))
    A.source.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(A.source,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for fid,data in sorted(originals.items()):
            info=zipfile.ZipInfo(entries[fid]['path'],date_time=(1980,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    write_json(source_lock,dict(source=URL,archiveBytes=ARCHIVE_BYTES,fullArchiveHashRecomputed=False,
        centralDirectorySha256=CD_SHA,selectionSha256=sha(selection_path.read_bytes()),
        extraction='Exact HTTP Range, only the 96 approved digestive elements; original bytes preserved',
        transferredBytes=sum(r['bytes'] for r in transferred),requests=sorted(transferred,key=lambda r:r['range']),
        sourceZipSha256=sha(A.source.read_bytes()),sourceZipBytes=A.source.stat().st_size,
        files=[dict(elementId=fid,sourceId=approved[fid]['sourceId'],side=approved[fid]['side'],
                    representationId=re.search(r'# Representation ID\s*:\s*(.+)',data.decode()).group(1),nativeConceptId=re.search(r'# Concept ID\s*:\s*(.+)',data.decode()).group(1),path=entries[fid]['path'],
                    bytes=len(data),sha256=sha(data),crc32=f'{zlib.crc32(data):08x}',compressedBytesUpstream=entries[fid]['compressed'])
               for fid,data in sorted(originals.items())]))

lock=json.loads(source_lock.read_text(encoding='utf-8'))
if sha(selection_path.read_bytes()) != lock['selectionSha256']: raise ValueError('Audited selection changed')
if sha(A.source.read_bytes()) != lock['sourceZipSha256']: raise ValueError('Local source ZIP checksum mismatch')
with zipfile.ZipFile(A.source) as z:
    if set(z.namelist()) != {r['path'] for r in lock['files']}: raise ValueError('Unapproved source members')
    originals={r['elementId']:z.read(r['path']) for r in lock['files']}
assert set(originals)==set(approved)
for r in lock['files']:
    data=originals[r['elementId']]
    if sha(data)!=r['sha256']: raise ValueError('Original checksum mismatch')
    headers={k:re.search(r'# '+k+r'\s*:\s*(.+)',data.decode()).group(1) for k in ['Compatibility version','File ID','Representation ID','Concept ID']}
    if headers != {'Compatibility version':'4.0','File ID':r['elementId'],'Representation ID':r['representationId'],'Concept ID':r['nativeConceptId']}:
        raise ValueError('Original version/FMA/FJ/representation mismatch: '+r['elementId'])
    if r['nativeConceptId'] not in approved[r['elementId']]['sourceConceptCandidates']: raise ValueError('Native concept not in pinned element mapping')

# The geometry writer and parser below are the same validated operations as 3A.
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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D digestive'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Digestivo · material de visualización',pbrMetallicRoughness=dict(
                baseColorFactor=[.68,.43,.38,1],metallicFactor=0,roughnessFactor=.8),doubleSided=False)])
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

A.output.mkdir(parents=True,exist_ok=True)
skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'))
nodes=[];byid={};meshes=[]
def node(id,name,kind,parent=None,**values):
 n=dict(id=id,name=name,anatomicalName=name,aliases=[],systemId='digestive',regionId=id,children=[],kind=kind,assetIds=[],meshNames=[],relatedIds=[])
 n.update(values)
 if parent:n['parentId']=parent;byid[parent]['children'].append(id)
 assert id not in byid
 nodes.append(n);byid[id]=n;return n
node('digestive','Sistema digestivo','system',latin='Systema digestorium',aliases=['digestivo','digestive','gastrointestinal','alimentary system'],digestiveType='sistema')
node('dig:upper','Tracto digestivo superior disponible','region','digestive',latin='Tractus digestorius superior',digestiveType='región',family='upper')
node('dig:oral','Región oral disponible','region','dig:upper',latin='Regio oralis',digestiveType='región',family='oral',aliases=['boca','mouth','oral'])
node('dig:salivary','Glándulas salivales disponibles','division','dig:oral',latin='Glandulae salivariae',digestiveType='grupo de glándulas',family='salivary')
node('dig:small','Intestino delgado','division','digestive',sourceId='FMA7200',latin='Intestinum tenue',digestiveType='grupo de segmentos',family='small',aliases=['FMA7200','small intestine'])
for cid,name,latin,family in [('FMA7207','Yeyuno','Jejunum','jejunum'),('FMA7208','Íleon','Ileum','ileum')]:node('dig:'+cid,name,'structure','dig:small',sourceId=cid,latin=latin,digestiveType='segmento intestinal',digestiveClass='tract',family=family,regionId='dig:small',explosionRegionId='dig-small',aliases=[cid,name,latin])
node('dig:large','Intestino grueso disponible','division','digestive',sourceId='FMA7201',latin='Intestinum crassum',digestiveType='grupo de segmentos',family='large',aliases=['FMA7201','intestino grueso','large intestine'])
node('dig:colon','Colon disponible','division','dig:large',latin='Colon',digestiveType='grupo de segmentos',family='colon',aliases=['colon'])
node('dig:accessory','Órganos accesorios abdominales','division','digestive',latin='Organa digestoria accessoria',digestiveType='grupo editorial',family='accessory')
node('dig:ducts','Vías secretoras disponibles','division','dig:accessory',latin='Ductus digestorii',digestiveType='grupo editorial',family='ducts')
node('dig:biliary','Vías biliares disponibles','division','dig:ducts',latin='Ductus biliferi',digestiveType='grupo de conductos',family='biliary',aliases=['biliary tree','árbol biliar','bile ducts'])
for u in selection['units']:
 module=u['moduleId'].split(':')[1]
 region={'upper':'dig:upper','stomach-accessory':'dig:accessory','small-intestine':'dig:small','large-intestine':'dig:large'}[module]
 if u['category']=='stomach':region=u['id']  # Shared GLB is not anatomical membership in accessory organs.
 exp={'upper':'dig-upper','stomach-accessory':'dig-accessory','small-intestine':'dig-small','large-intestine':'dig-large'}[module]
 klass='liver' if u['category']=='liver' else 'biliary' if u['category'] in ['biliary','gallbladder'] else 'gland' if u['category'] in ['pancreas','salivary','pancreatic-duct'] else 'tract'
 aliases=[u['id'],u['english'],u['sourceId'],*u['elements']]
 if u['category']=='stomach':aliases+=['estomago','stomach','ventriculus']
 if u['category']=='liver':aliases+=['liver','higado']
 if u['category']=='gallbladder':aliases+=['vesicula','gall bladder','vesica fellea']
 n=node(u['id'],u['name'],u['kind'],u['parent'],sourceId=u['sourceId'],latin=u['latin'],aliases=aliases,side=u['side'],family=u['category'],digestiveClass=klass,digestiveType=u['entityType'],regionId=region,explosionRegionId=exp)
 n['assetIds']=[u['moduleId']]
 for fid in u['elements']:
  parsed=parse_obj(originals[fid]);n['meshNames'].append('bp3d_'+approved[fid]['sourceId']+'_'+fid);meshes.append((n,fid,parsed))
  # Native mesh FMA remains searchable even when several pieces form one liver.
  n['aliases']=list(dict.fromkeys(n['aliases']+[approved[fid]['sourceId']]))
  n['bounds']=union([n['bounds'],parsed[3]]) if n.get('bounds') else parsed[3]
  for axis in range(3):
   assert parsed[3][0][axis]>=skeleton['frame']['bounds'][0][axis]-.03,(fid,'outside fixed frame')
   assert parsed[3][1][axis]<=skeleton['frame']['bounds'][1][axis]+.03,(fid,'outside fixed frame')
def aggregate(id):
 n=byid[id]
 for c in n['children']:aggregate(c)
 if n['children']:
  n['bounds']=union(([n['bounds']] if n.get('bounds') else [])+[byid[c]['bounds'] for c in n['children']])
  n['assetIds']=sorted(set(n['assetIds'])|{a for c in n['children'] for a in byid[c]['assetIds']})
aggregate('digestive')
assets=[]
for module in selection['modules']:
 aid,filename=module['id'],module['filename'];g=GLB();chosen=[m for m in meshes if aid in m[0]['assetIds']]
 for n,fid,parsed in chosen:g.mesh(n,fid,parsed)
 path=A.output/filename;g.write(path)
 assets.append(dict(id=aid,path='models/anatomy/digestive/'+filename,systemId='digestive',regionId={'upper':'dig:upper','stomach-accessory':'dig:accessory','small-intestine':'dig:small','large-intestine':'dig:large'}[filename[:-4]],frameId=skeleton['frame']['id'],bytes=path.stat().st_size,sha256=sha(path.read_bytes()),meshCount=len(chosen),triangles=sum(len(p[2])//3 for _,_,p in chosen),bounds=union([p[3] for _,_,p in chosen]),provenanceId='bodyparts3d-4.0-digestive'))
sourcefiles=[]
for n,fid,parsed in meshes:
 r=next(r for r in lock['files'] if r['elementId']==fid)
 positions=[list(map(float,l.split()[1:4])) for l in originals[fid].decode().splitlines() if l.startswith('v ')]
 sourcefiles.append(dict(**r,anatomyId=n['id'],ownerSourceId=n['sourceId'],family=n['family'],moduleId=n['assetIds'][0],sourceType=approved[fid]['entityType'],triangles=len(parsed[2])//3,faces=len(parsed[2])//3,sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3],sourceBoundsMillimetres=union([[p,p] for p in positions]),headerCompatibilityVersion='4.0'))
provenance=dict(skeleton['provenance'][0]);provenance['id']='bodyparts3d-4.0-digestive'
provenance['modifications']=['Selección digestiva curada. Originales OBJ, FMA/FJ, lateralidad y hashes preservados.','Transformación común (x,y,z) -> (x,z,-y)/1000. Float32 y Meshopt sin decimación adicional ni deformación.','Hígado agregado con ocho piezas sin afirmar segmentación I–VIII. Las porciones intestinales agrupan sus piezas fuente; no nuevos órganos por cada asa.']
structures=sum(n['kind']=='structure' for n in nodes);components=sum(n['kind']=='component' for n in nodes)
catalog=dict(schemaVersion=1,id='med3d-digestive',frame=skeleton['frame'],nodes=nodes,assets=assets,provenance=[provenance],coverage=dict(title='Cobertura digestiva macroscópica disponible',structures=structures,meshes=len(meshes),note=f'{structures} unidades anatómicas de nivel estructural, {components} componentes y cuatro módulos: región oral disponible, esófago, estómago, intestinos y órganos accesorios.',limitations=['Cavidad oral y faringe completas pendientes; no se fabrica conexión hasta el esófago.','Unión ileocecal identificada, sin ciego completo separado. Colon sigmoide y canal anal sin segmentación independiente fiable.','Parótidas, colédoco separado, hilio y microanatomía no integrados.','Hígado agregado sin exponer la segmentación hepática inconsistente de la fuente. Páncreas y estómago sin cortes artificiales.','Discontinuidades y superficies originales conservadas; las fichas distinguen continuidad anatómica y cobertura geométrica. Sin validación clínica.']))
write_json(A.output/'catalog.json',catalog)
write_json(A.output/'digestive-source-manifest.json',dict(sourceArchive=URL,sourceVersion='4.0 OBJ99',sourceLicenseDeclarations=['https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html'],sourceZip='research/anatomy/digestive-originals.zip',sourceZipSha256=lock['sourceZipSha256'],sourceLock='research/anatomy/digestive-source-lock.json',selectionSha256=lock['selectionSha256'],transform=TRANSFORM,additionalRegistration='none; all integrated originals belong to BodyParts3D 4.0 in the established body frame',files=sorted(sourcefiles,key=lambda r:r['elementId'])))
(A.output/'LICENSE.txt').write_text('BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.\nOfficial declaration: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html\nLicense: https://creativecommons.org/licenses/by/4.0/\nVersion: 4.0 OBJ99. Native OBJ headers retain the historical CC BY-SA 2.1 Japan notice; current official archive declaration applies.\nModifications: selected digestive structures; common (x,y,z)->(x,z,-y)/1000 transform; OBJ to GLB, Float32 positions and Meshopt compression. No anatomical deformation or fabricated connections.\nOriginal hashes and ownership: digestive-source-manifest.json. No clinical validation.\n',encoding='utf8',newline='\n')
print(json.dumps(dict(structures=structures,components=components,meshes=len(meshes),triangles=sum(a['triangles'] for a in assets),uncompressedGLBBytes=sum(a['bytes'] for a in assets)),indent=2))
