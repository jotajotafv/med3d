#!/usr/bin/env python3
"""Build only the approved 26-element BP3D 4.0 muscular pilot.

First run: --fetch downloads exact ZIP ranges, validates its pinned directory,
CRC32, sizes and previously inspected hashes, and preserves untouched OBJ bytes
in a deterministic source ZIP. Subsequent builds use that local ZIP and its lock.
No synthesized geometry, mirroring, centering, simplification or anatomy fitting.
Follow with optimize-muscular-pilot.mjs, which checks every decoded triangle.
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
P.add_argument('--fetch', action='store_true', help='Fetch only the 26 approved original ZIP members')
P.add_argument('--source', type=Path, default=ROOT/'research/anatomy/muscular-pilot-originals.zip')
P.add_argument('--output', type=Path, default=ROOT/'public/models/anatomy/muscular')
A = P.parse_args()
audit = json.loads((ROOT/'docs/phase3/research/source-audit.json').read_text())
pairs = audit['metadata_audit']['pilot']['component_pairs']
approved = {r['element_file_ids'][0]: {**r, 'component': pair['component'], 'side': side}
            for pair in pairs for side in ('right','left') for r in [pair[side]]}
assert len(approved) == 26 and all(len(r['element_file_ids']) == 1 for r in approved.values())
directory_lock = {r['id']: r for r in audit['candidate_archive_sizes']['pilot']['entries']}
source_lock = A.source.with_name('muscular-pilot-source-lock.json')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')

if A.fetch:
    transferred = []
    def fetch_range(start, end):
        req = urllib.request.Request(URL, headers={'Range': f'bytes={start}-{end}', 'Accept-Encoding': 'identity'})
        with urllib.request.urlopen(req, timeout=60) as response:
            expected = f'bytes {start}-{end}/{ARCHIVE_BYTES}'
            if response.status != 206 or response.headers.get('Content-Range') != expected:
                raise ValueError('Server did not honor exact Range; refusing whole archive download')
            data = response.read(end-start+2)
        if len(data) != end-start+1:
            raise ValueError('Range size mismatch')
        transferred.append({'range': f'{start}-{end}', 'bytes': len(data)})
        return data
    directory = fetch_range(CD_OFFSET, CD_OFFSET+CD_BYTES-1)
    if sha(directory) != CD_SHA:
        raise ValueError('Pinned upstream ZIP directory changed')
    entries, offset = {}, 0
    while offset < len(directory):
        header = struct.unpack_from('<4s6H3L5H2L', directory, offset)
        if header[0] != b'PK\x01\x02':
            raise ValueError('Invalid ZIP directory header')
        name = directory[offset+46:offset+46+header[10]].decode()
        entries[Path(name).stem] = dict(path=name, method=header[4], crc=header[7], compressed=header[8],
                                      bytes=header[9], offset=header[16])
        offset += 46+header[10]+header[11]+header[12]
    assert len(entries) == 2234
    def extract(fid):
        entry, locked = entries[fid], directory_lock[fid]
        if (entry['path'], entry['bytes'], entry['compressed'], f"{entry['crc']:08x}") != (
                locked['path'], locked['bytes'], locked['compressed_bytes'], locked['crc32']):
            raise ValueError('Directory lock mismatch: '+fid)
        header = struct.unpack('<4s5H3L2H', fetch_range(entry['offset'], entry['offset']+29))
        if header[0] != b'PK\x03\x04' or header[3] != 8 or entry['method'] != 8:
            raise ValueError('Unexpected ZIP compression/header: '+fid)
        start = entry['offset']+30+header[9]+header[10]
        original = zlib.decompress(fetch_range(start, start+entry['compressed']-1), -15)
        if len(original) != entry['bytes'] or zlib.crc32(original) != entry['crc']:
            raise ValueError('Original size/CRC mismatch: '+fid)
        prior = next((r for r in audit['pilot_source_sample']['models'] if r['id'] == fid), None)
        if prior and sha(original) != prior['sha256']:
            raise ValueError('Previously inspected SHA-256 changed: '+fid)
        return fid, original
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        originals = dict(pool.map(extract, sorted(approved)))
    A.source.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(A.source, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for fid, data in sorted(originals.items()):
            info = zipfile.ZipInfo(directory_lock[fid]['path'], date_time=(1980,1,1,0,0,0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    write_json(source_lock, dict(source=URL, archiveBytes=ARCHIVE_BYTES,
        historicalFullArchiveSha256=audit['historical_archive_sha256']['value'],
        fullArchiveHashRecomputed=False, centralDirectorySha256=CD_SHA,
        extraction='Exact HTTP Range, 26 approved members only; local source ZIP preserves their original bytes',
        transferredBytes=sum(r['bytes'] for r in transferred), requests=sorted(transferred, key=lambda r:r['range']),
        sourceZipSha256=sha(A.source.read_bytes()), sourceZipBytes=A.source.stat().st_size,
        files=[dict(elementId=fid, sourceId=approved[fid]['concept id'], side=approved[fid]['side'],
                    representationId=approved[fid]['representation id'], path=directory_lock[fid]['path'],
                    bytes=len(data), sha256=sha(data), crc32=f'{zlib.crc32(data):08x}',
                    compressedBytesUpstream=directory_lock[fid]['compressed_bytes'])
               for fid,data in sorted(originals.items())]))

lock = json.loads(source_lock.read_text())
if sha(A.source.read_bytes()) != lock['sourceZipSha256']:
    raise ValueError('Local source ZIP checksum mismatch')
with zipfile.ZipFile(A.source) as z:
    if set(z.namelist()) != {r['path'] for r in lock['files']}:
        raise ValueError('Source ZIP has missing or unapproved members')
    originals = {r['elementId']: z.read(r['path']) for r in lock['files']}
for r in lock['files']:
    if sha(originals[r['elementId']]) != r['sha256']:
        raise ValueError('Original SHA-256 mismatch: '+r['elementId'])
    headers = {key: re.search(r'# '+key+r'\s*:\s*(.+)', originals[r['elementId']].decode()).group(1)
               for key in ['Compatibility version','File ID','Representation ID','Concept ID']}
    if headers != {'Compatibility version':'4.0','File ID':r['elementId'],
                   'Representation ID':r['representationId'],'Concept ID':r['sourceId']}:
        raise ValueError('Original compatibility/FMA/FJ/representation header mismatch')
assert set(originals) == set(approved)

TERMS = {
    'deltoid': ('Deltoides', 'Musculus deltoideus', 'shoulder'),
    'bicepsbrachii': ('Bíceps braquial', 'Musculus biceps brachii', 'arm'),
    'tricepsbrachii': ('Tríceps braquial', 'Musculus triceps brachii', 'arm'),
    'brachialis': ('Braquial', 'Musculus brachialis', 'arm'),
    'supraspinatus': ('Supraespinoso', 'Musculus supraspinatus', 'shoulder'),
    'infraspinatus': ('Infraespinoso', 'Musculus infraspinatus', 'shoulder'),
    'teresminor': ('Redondo menor', 'Musculus teres minor', 'shoulder'),
    'subscapularis': ('Subescapular', 'Musculus subscapularis', 'shoulder'),
}
PARTS = {
    'deltoid_clavicular': ('deltoid', 'Porción clavicular'),
    'deltoid_acromial': ('deltoid', 'Porción acromial'),
    'deltoid_spinal': ('deltoid', 'Porción espinal'),
    'biceps_short_head': ('bicepsbrachii', 'Cabeza corta'),
    'biceps_long_head': ('bicepsbrachii', 'Cabeza larga'),
    'triceps_medial_head': ('tricepsbrachii', 'Cabeza medial'),
    'triceps_lateral_head': ('tricepsbrachii', 'Cabeza lateral'),
    'triceps_long_head': ('tricepsbrachii', 'Cabeza larga'),
}

def union(bounds):
    return [[min(b[0][i] for b in bounds) for i in range(3)], [max(b[1][i] for b in bounds) for i in range(3)]]

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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D muscular pilot'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Músculo · material de visualización',pbrMetallicRoughness=dict(
                baseColorFactor=[.55,.18,.17,1],metallicFactor=0,roughnessFactor=.8),doubleSided=False)])
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
        mesh_index=len(self.g['meshes']);name=node['meshNames'][0]
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

nodes, byid, meshes = [], {}, []
def node(id, name, kind, parent=None, region='muscular', **values):
    n=dict(id=id,name=name,anatomicalName=name,aliases=[],systemId='muscular',regionId=region,
           children=[],kind=kind,assetIds=[],meshNames=[],relatedIds=[])
    if parent:n['parentId']=parent;n['relatedIds']=[parent]
    n.update(values);nodes.append(n);byid[id]=n
    if parent:byid[parent]['children'].append(id)
    return n

node('muscular','Sistema muscular · piloto','system',aliases=['músculos','musculatura','muscular system'])
for side in ('right','left'):
    adjective='derecho' if side=='right' else 'izquierdo'
    rid='muscular:region:arm-'+side
    node(rid,'Hombro y brazo '+adjective,'region','muscular',region=rid,side=side)
    for group,label in [('shoulder','Hombro'),('arm','Brazo')]:
        gid=f'muscular:group:arm-{side}:{group}'
        node(gid,label+' '+adjective,'region',rid,region=rid,side=side,explosionRegionId=group+'-'+side)
    for compartment,label in [('anterior','Compartimento anterior'),('posterior','Compartimento posterior')]:
        node(f'muscular:group:arm-{side}:arm:{compartment}',label,'division',f'muscular:group:arm-{side}:arm',
             region=rid,side=side,explosionRegionId='arm-'+side)
    for family in ('deltoid','bicepsbrachii','tricepsbrachii'):
        label,latin,group=TERMS[family]
        parent=f'muscular:group:arm-{side}:{group}'
        if group=='arm':parent+=':posterior' if family=='tricepsbrachii' else ':anterior'
        node(f'med3d:muscle:{family}:{side}',label+' '+adjective,'structure',parent,
             region=rid,family=family,side=side,latin=latin,aliases=[family,latin],explosionRegionId=group+'-'+side)
    for pair in pairs:
        r=pair[side];fid=r['element_file_ids'][0];cid=r['concept id'];part=PARTS.get(pair['component'])
        family,part_label=part if part else (pair['component'].replace('_',''),None)
        label,latin,group=TERMS[family]
        parent=f'med3d:muscle:{family}:{side}' if part else f'muscular:group:arm-{side}:{group}'
        if not part and group=='arm':parent+=':anterior'
        name=f'{part_label} del {label.lower()} {adjective}' if part else label+' '+adjective
        n=node('bp3d:'+cid,name,'component' if part else 'structure',parent,region=rid,
               sourceId=cid,family=family,side=side,aliases=[r['en'],cid,fid,latin],
               explosionRegionId=group+'-'+side)
        if not part:n['latin']=latin
        n['assetIds']=['muscular:upper-'+side];n['meshNames']=[f'bp3d_{cid}_{fid}']
        parsed=parse_obj(originals[fid]);n['bounds']=parsed[3]
        meshes.append((n,fid,parsed))

def aggregate(id):
    n=byid[id]
    if n['children']:
        for child in n['children']:aggregate(child)
        n['bounds']=union([byid[c]['bounds'] for c in n['children']])
        n['assetIds']=sorted({aid for c in n['children'] for aid in byid[c]['assetIds']})
aggregate('muscular')
for n in nodes:
    if n.get('family') and n['kind']=='structure':
        counterpart=next((c for c in nodes if c.get('family')==n['family'] and c['kind']=='structure' and c.get('side')!=n['side']),None)
        if counterpart:n['relatedIds'].append(counterpart['id'])

A.output.mkdir(parents=True,exist_ok=True)
assets, sourcefiles = [], []
for side in ('right','left'):
    selected=[e for e in meshes if e[0]['side']==side];g=GLB()
    for n,fid,parsed in selected:g.mesh(n,fid,parsed)
    filename='muscular-upper-'+side+'.glb';path=A.output/filename;g.write(path)
    assets.append(dict(id='muscular:upper-'+side,path='models/anatomy/muscular/'+filename,systemId='muscular',
        regionId='muscular:region:arm-'+side,frameId='bodyparts3d-4.0-male',bytes=path.stat().st_size,sha256=sha(path.read_bytes()),
        meshCount=len(selected),triangles=sum(len(p[2])//3 for _,_,p in selected),
        bounds=union([n['bounds'] for n,_,_ in selected]),provenanceId='bodyparts3d-4.0-muscular-pilot'))
for n,fid,parsed in meshes:
    r=next(r for r in lock['files'] if r['elementId']==fid)
    sourcefiles.append(dict(**r,anatomyId=n['id'],family=n['family'],triangles=len(parsed[2])//3,
        sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3],
        headerCompatibilityVersion='4.0',headerLegacyLicense='CC BY-SA 2.1 Japan'))
provenance=dict(id='bodyparts3d-4.0-muscular-pilot',source='BodyParts3D / Anatomography',
    author='Database Center for Life Science (DBCLS), Japan',license='CC BY 4.0',
    licenseUrl='https://creativecommons.org/licenses/by/4.0/',version='4.0 · OBJ99 (2013 archive; current license declaration)',
    originalUrl=URL,attribution='BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    modifications=[
        'Selected only 26 original elements for 16 bilateral shoulder/arm muscles; preserved heads and deltoid portions as components under editorial muscle parents.',
        'Every source triangle and individual FMA/FJ identity retained. No decimation, mirroring, synthesis, per-mesh centering, custom registration or joining.',
        'Shared transform (x,y,z) source millimetres to (x,z,-y) metres, identical to the skeleton.',
        'Spanish labels and regional grouping are curated navigation. Composite parent IDs use the editorial med3d namespace, not invented FMA identifiers.',
        'Assigned untextured red display material; Meshopt preserves float32 positions and quantizes normals to 12 bits; decoded geometry is checked against all source triangles.',
        'Current publisher CC BY 4.0 declaration updated 2025-02-27; original OBJ legacy CC BY-SA 2.1 Japan headers remain in the preserved source ZIP.'])
skeletal=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text())
catalog=dict(schemaVersion=1,id='med3d-muscular-pilot-bodyparts3d-4.0',frame=dict(skeletal['frame']),
    nodes=nodes,assets=assets,provenance=[provenance],coverage=dict(title='Sistema muscular · piloto de hombro y brazo',
    structures=16,meshes=26,note='8 músculos por lado, 16 unidades musculares. Deltoides: 3 porciones; bíceps: 2 cabezas; tríceps: 3 cabezas. No es musculatura corporal completa.',
    limitations=['Sólo hombro y brazo bilateral; no incluye todos los músculos de estas regiones ni del cuerpo.',
        'Atlas masculino adulto modelado; no representa variación individual ni acredita precisión clínica.',
        'Origen e inserción son relaciones educativas textuales; no hay superficies de inserción anotadas.',
        'Se conserva el marco BP3D compartido; la identidad de fuente no sustituye revisión anatómica.']))
assert sum(n['kind']=='structure' for n in nodes)==16 and len(meshes)==26
write_json(A.output/'catalog.json',catalog)
write_json(A.output/'source-manifest.json',dict(sourceArchive=URL,sourceVersion='4.0 OBJ99',
    sourceLicenseDeclaration='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',sourceLicenseUpdated='2025-02-27',
    sourceZip='research/anatomy/muscular-pilot-originals.zip',sourceZipSha256=lock['sourceZipSha256'],
    sourceLock='research/anatomy/muscular-pilot-source-lock.json',sourceAuditSha256=sha((ROOT/'docs/phase3/research/source-audit.json').read_bytes()),
    transform=TRANSFORM,additionalRegistration='none',files=sorted(sourcefiles,key=lambda r:r['elementId'])))
print(json.dumps(dict(structures=16,meshes=26,triangles=sum(a['triangles'] for a in assets),
    originalObjBytes=sum(r['bytes'] for r in sourcefiles),uncompressedGLBBytes=sum(a['bytes'] for a in assets)),indent=2))
