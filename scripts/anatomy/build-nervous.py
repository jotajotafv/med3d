#!/usr/bin/env python3
"""Build only the explicitly audited nervous cohort; historical assets are never rebuilt.

Exact HTTP ranges, pinned metadata/directory, original per-side files. No fitting,
mirroring, per-mesh normalization or simplification. Run optimize-nervous.mjs next.
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
P.add_argument('--source', type=Path, default=ROOT/'research/anatomy/nervous-originals.zip')
P.add_argument('--output', type=Path, default=ROOT/'public/models/anatomy/nervous')
A = P.parse_args()
selection_path = ROOT/'research/anatomy/nervous-selection.json'
SELECTED_SHA = '1845bc3d4f0fbe6206f14e4760b2a1ac166b3cf356765ed3d147d0b6de64a6b7'
if hashlib.sha256(selection_path.read_bytes()).hexdigest() != SELECTED_SHA:
    raise ValueError('Approved audit changed; review required before any extraction or output')
selection = json.loads(selection_path.read_text(encoding='utf-8'))
approved = {r['elementId']: r for r in selection['approved']}
assert len(approved) == len(selection['approved']) == 87, 'Only the explicitly audited 87 elements may be processed'
source_lock = A.source.with_name('nervous-source-lock.json')

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
        extraction='Exact HTTP Range, only the 87 approved nervous elements; original bytes preserved',
        transferredBytes=sum(r['bytes'] for r in transferred),requests=sorted(transferred,key=lambda r:r['range']),
        sourceZipSha256=sha(A.source.read_bytes()),sourceZipBytes=A.source.stat().st_size,
        files=[dict(elementId=fid,sourceId=approved[fid]['sourceId'],side=approved[fid]['side'],
                    representationId=approved[fid]['representationId'],path=entries[fid]['path'],
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
    if headers != {'Compatibility version':'4.0','File ID':r['elementId'],'Representation ID':r['representationId'],'Concept ID':r['sourceId']}:
        raise ValueError('Original version/FMA/FJ/representation mismatch: '+r['elementId'])

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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D nervous'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Nervioso · material de visualización',pbrMetallicRoughness=dict(
                baseColorFactor=[.72,.55,.23,1],metallicFactor=0,roughnessFactor=.8),doubleSided=False)])
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
        mesh_index=len(self.g['meshes']);name=f"bp3d_{node['sourceId']}_{fid}"
        self.g['meshes'].append(dict(name=name,primitives=[dict(attributes={'POSITION':pi,'NORMAL':ni},indices=ii,material=0)]))
        self.g['nodes'].append(dict(name=name,mesh=mesh_index,extras=dict(sourceId=node['sourceId'],sourceElement=fid,anatomyId=node['id'])))
        self.g['scenes'][0]['nodes'].append(len(self.g['nodes'])-1)
    def write(self, path):
        while len(self.binary)%4:self.binary.append(0)
        self.g['buffers']=[{'byteLength':len(self.binary)}]
        js=json.dumps(self.g,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4)
        total=12+8+len(js)+8+len(self.binary)
        path.write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+
                         struct.pack('<II',len(self.binary),0x004E4942)+self.binary)



PROVENANCE='bodyparts3d-4.0-nervous'
A.output.mkdir(parents=True,exist_ok=True)
skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf-8'))
nodes=[];byid={};meshes=[]
def node(id,name,kind,parent=None,**values):
 n=dict(id=id,name=name,anatomicalName=name,aliases=[],systemId='nervous',regionId=id if kind=='region' else parent or id,explosionRegionId='head-neck',children=[],kind=kind,assetIds=[],meshNames=[],relatedIds=[],**values)
 if parent:n['parentId']=parent;byid[parent]['children'].append(id);n['relatedIds']=[parent]
 nodes.append(n);byid[id]=n;return n
node('nervous','Sistema nervioso','system',latin='Systema nervosum')
node('nervous:cns','Sistema nervioso central','division','nervous',latin='Systema nervosum centrale')['aliases']=['SNC','CNS']
node('nervous:brain','Encéfalo','region','nervous:cns',sourceId='FMA50801',latin='Encephalon')['aliases']=['Brain','encéfalo corporal','FMA50801']
node('nervous:cerebrum','Cerebro · regiones disponibles','region','nervous:brain',latin='Cerebrum')
node('nervous:diencephalon','Diencéfalo · regiones disponibles','region','nervous:brain',latin='Diencephalon')
node('nervous:brainstem','Tronco encefálico','region','nervous:brain',sourceId='FMA79876',latin='Truncus encephali')['aliases']=['Brainstem','FMA79876']
node('nervous:optic','Vía óptica · nervios ópticos','region','nervous:cns',latin='Nervi optici')['aliases']=['II','segundo par craneal']
node('nervous:pns','Sistema nervioso periférico','division','nervous',latin='Systema nervosum periphericum')['aliases']=['SNP','PNS']
node('nervous:cranial','Nervios craneales · cobertura orbitaria','region','nervous:pns',latin='Nervi craniales')['aliases']=['III','IV','V1','órbita','trigémino','oculomotor']
for r in approved.values():
 id=r['structureId'];fid=r['elementId'];parsed=parse_obj(originals[fid])
 if id not in byid:
  n=node(id,r['name'],r['kind'],'nervous:'+r['parent'],sourceId=r['sourceId'],family=r['family'],latin=r['latin'],side=r['side'],neuralType=r['entityType'])
  n['aliases']=[r['en'],r['sourceId'],r['family']]
  n['assetIds']=[r['moduleId']];n['bounds']=parsed[3]
 else:n=byid[id];n['bounds']=union([n['bounds'],parsed[3]])
 n['aliases'].append(fid);n['meshNames'].append(f"bp3d_{r['sourceId']}_{fid}");meshes.append((n,fid,parsed))
 for axis in range(3):
  assert parsed[3][0][axis]>=skeleton['frame']['bounds'][0][axis]-.03
  assert parsed[3][1][axis]<=skeleton['frame']['bounds'][1][axis]+.03
# Curated anatomical membership, not class-inheritance conversion. Colliculi are parts of midbrain.
for n in nodes:
 if n.get('family') in ['FMA62403','FMA62404']:
  byid[n['parentId']]['children'].remove(n['id']);n['parentId']='bp3d:FMA61993';byid[n['parentId']]['children'].append(n['id']);n['relatedIds']=[n['parentId']]
 if n.get('family')=='FMA62327':
  byid[n['parentId']]['children'].remove(n['id']);n['parentId']='bp3d:FMA62008';byid[n['parentId']]['children'].append(n['id']);n['relatedIds']=[n['parentId']]
def aggregate(id):
 n=byid[id]
 for child in n['children']:aggregate(child)
 if n['children']:
  bounds=([n['bounds']] if n.get('bounds') else [])+[byid[c]['bounds'] for c in n['children']]
  n['bounds']=union(bounds);n['assetIds']=sorted(set(n['assetIds'])|{a for c in n['children'] for a in byid[c]['assetIds']})
aggregate('nervous')
assets=[]
for module in selection['modules']:
 aid,filename=module['id'],module['filename'];g=GLB();chosen=[m for m in meshes if aid in m[0]['assetIds']]
 for n,fid,parsed in chosen:g.mesh(n,fid,parsed)
 path=A.output/filename;g.write(path)
 assets.append(dict(id=aid,path='models/anatomy/nervous/'+filename,systemId='nervous',regionId=aid,frameId=skeleton['frame']['id'],bytes=path.stat().st_size,sha256=sha(path.read_bytes()),meshCount=len(chosen),triangles=sum(len(p[2])//3 for _,_,p in chosen),bounds=union([p[3] for _,_,p in chosen]),provenanceId=PROVENANCE))
sourcefiles=[]
for n,fid,parsed in meshes:
 r=next(r for r in lock['files'] if r['elementId']==fid)
 positions=[list(map(float,l.split()[1:4])) for l in originals[fid].decode().splitlines() if l.startswith('v ')]
 sourcefiles.append(dict(**r,anatomyId=n['id'],family=n['family'],moduleId=n['assetIds'][0],sourceType=approved[fid]['entityType'],triangles=len(parsed[2])//3,faces=len(parsed[2])//3,sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3],sourceBoundsMillimetres=union([[p,p] for p in positions]),headerCompatibilityVersion='4.0',headerLegacyLicense='CC BY-SA 2.1 Japan'))
provenance=dict(skeleton['provenance'][0]);provenance['id']=PROVENANCE
provenance['modifications']=['Scoped nervous cohort; original FMA/FJ and source OBJ retained.','Shared transform (x,y,z) to (x,z,-y)/1000; Float32 positions; Meshopt; normal quantization only. No decimation, mirroring or per-piece fitting.','Brain regions are components, not additional whole brains. Orbital branches do not imply complete cranial nerves.','Publisher CC BY 4.0 declaration supersedes preserved legacy headers. No clinical certification.']
structures=sum(n['kind']=='structure' for n in nodes);components=sum(n['kind']=='component' for n in nodes)
catalog=dict(schemaVersion=1,id='med3d-nervous',frame=skeleton['frame'],nodes=nodes,assets=assets,provenance=[provenance],coverage=dict(title='Cobertura nerviosa disponible',structures=structures,meshes=len(meshes),note=f'{structures} estructuras nerviosas y {components} componentes identificados; encéfalo regional y cobertura orbitaria. Los componentes no son órganos adicionales.',limitations=['Sin médula espinal, raíces, plexos ni nervios de extremidades registrados.','Encéfalo y nervios craneales parciales: no se reconstruyen estructuras ausentes.','II se presenta en SNC; III sólo mediante ramas; V sólo división oftálmica y ramas.','El encéfalo HRA permanece como explorador independiente, sin superposición corporal.']))
write_json(A.output/'catalog.json',catalog)
write_json(A.output/'nervous-source-manifest.json',dict(sourceArchive=URL,sourceVersion='4.0 OBJ99',sourceLicenseDeclaration='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',sourceZip='research/anatomy/nervous-originals.zip',sourceZipSha256=lock['sourceZipSha256'],sourceLock='research/anatomy/nervous-source-lock.json',selectionSha256=lock['selectionSha256'],transform=TRANSFORM,additionalRegistration='none',files=sorted(sourcefiles,key=lambda r:r['elementId'])))
print(json.dumps(dict(structures=structures,components=components,meshes=len(meshes),triangles=sum(a['triangles'] for a in assets),uncompressedGLBBytes=sum(a['bytes'] for a in assets)),indent=2))
