#!/usr/bin/env python3
"""Append only the audited Phase 3C OBJ cohort to the preserved Phase 3A/3B catalog.

Exact HTTP ranges, pinned metadata/directory, original per-side files. No fitting,
mirroring, per-mesh normalization or simplification. Run the limbs optimizer next.
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
P.add_argument('--source', type=Path, default=ROOT/'research/anatomy/muscular-limbs-originals.zip')
P.add_argument('--output', type=Path, default=ROOT/'public/models/anatomy/muscular')
A = P.parse_args()
selection_path = ROOT/'research/anatomy/limbs-selection.json'
SELECTED_SHA = '67b6b1fc3a525d22c0ee8bef6a317eee0fcf65bf6581580519d86adf73f1228c'
if hashlib.sha256(selection_path.read_bytes()).hexdigest() != SELECTED_SHA:
    raise ValueError('Approved audit changed; review required before any extraction or output')
selection = json.loads(selection_path.read_text(encoding='utf-8'))
approved = {r['elementId']: r for r in selection['approved']}
assert len(approved) == len(selection['approved']) == 54, 'Only the explicitly audited 54 elements may be processed'
source_lock = A.source.with_name('muscular-limbs-source-lock.json')

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
        extraction='Exact HTTP Range, only the 54 approved limbs elements; original bytes preserved',
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


LATIN = dict(gluteusmaximus='gluteus maximus', gluteusmedius='gluteus medius', gluteusminimus='gluteus minimus',
    tensorfasciaelatae='tensor fasciae latae', rectusfemoris='rectus femoris', vastuslateralis='vastus lateralis',
    vastusmedialis='vastus medialis', vastusintermedius='vastus intermedius', sartorius='sartorius',
    adductorlongus='adductor longus', gracilis='gracilis', bicepsfemoris='biceps femoris',
    semitendinosus='semitendinosus', semimembranosus='semimembranosus', tibialisanterior='tibialis anterior',
    fibularislongus='fibularis longus', fibularisbrevis='fibularis brevis', gastrocnemius='gastrocnemius',
    soleus='soleus', tibialisposterior='tibialis posterior', flexorcarpiradialis='flexor carpi radialis',
    pronatorteres='pronator teres', extensorcarpiradialislongus='extensor carpi radialis longus', supinator='supinator')
REGIONS = {'gluteal':'Región glútea', 'thigh':'Muslo', 'leg':'Pierna', 'forearm':'Antebrazo'}
PARTS = {'long':'Cabeza larga', 'short':'Cabeza corta', 'medial':'Cabeza medial', 'lateral':'Cabeza lateral',
         'humeral':'Cabeza humeral', 'ulnar':'Cabeza ulnar'}
QUADRICEPS = {'rectusfemoris', 'vastuslateralis', 'vastusmedialis', 'vastusintermedius'}
PROVENANCE = 'bodyparts3d-4.0-muscular-limbs'
catalog = json.loads((A.output/'catalog.json').read_text(encoding='utf-8'))
preserved_assets = {a['id'] for a in catalog['assets'] if a['provenanceId'] != PROVENANCE}
assert preserved_assets == {'muscular:upper-right','muscular:upper-left','muscular:thorax-anterior','muscular:abdomen','muscular:back'}
catalog['assets'] = [a for a in catalog['assets'] if a['id'] in preserved_assets]
catalog['nodes'] = [n for n in catalog['nodes'] if any(a in preserved_assets for a in n['assetIds'])]
old_ids = {n['id'] for n in catalog['nodes']}
for n in catalog['nodes']:
    n['children'] = [c for c in n['children'] if c in old_ids]
    n['assetIds'] = [a for a in n['assetIds'] if a in preserved_assets]
nodes = catalog['nodes']; byid = {n['id']:n for n in nodes}; meshes = []
assert sum(n['kind']=='structure' for n in nodes)==42

def node(id, name, kind, parent, region, **values):
    assert id not in byid, 'Existing identity may not be replaced: '+id
    n = dict(id=id, name=name, anatomicalName=name, aliases=[], systemId='muscular', regionId=region,
        parentId=parent, children=[], kind=kind, assetIds=[], meshNames=[], relatedIds=[parent], **values)
    nodes.append(n); byid[id]=n; byid[parent]['children'].append(id)
    return n

for side in ['right','left']:
    adj = 'derecho' if side=='right' else 'izquierdo'
    upper = 'muscular:region:arm-'+side
    byid[upper]['name'] = byid[upper]['anatomicalName'] = 'Miembro superior '+adj
    lower = 'muscular:region:leg-'+side
    node(lower, 'Miembro inferior '+adj, 'region', 'muscular', lower, side=side, explosionRegionId='lower-limb-'+side)
    for region in REGIONS:
        rid = upper+':forearm' if region=='forearm' else lower+':'+region
        block = ('upper-limb-' if region=='forearm' else 'lower-limb-')+side
        label = REGIONS[region]+(' derecha' if region in ['gluteal','leg'] and side=='right' else ' izquierda' if region in ['gluteal','leg'] else ' '+adj)
        node(rid,label,'region',upper if region=='forearm' else lower,rid,side=side,explosionRegionId=block)
        if region=='gluteal':continue
        compartments = ['anterior','medial','posterior'] if region=='thigh' else ['anterior','lateral','posterior'] if region=='leg' else ['anterior','posterior']
        for compartment in compartments:
            node(rid+':'+compartment,'Compartimento '+compartment,'division',rid,rid,side=side,explosionRegionId=block)
        if region=='thigh':
            q=node('muscular:group:quadriceps:'+side,'Cuádriceps '+adj,'division',rid+':anterior',rid,
                side=side,explosionRegionId=block)
            q['aliases']=['Cuadriceps femoris','Quadriceps femoris','Grupo cuádriceps','Cuatro músculos extensores de la rodilla']

for r in approved.values():
    family,side,rid,aid = r['family'],r['side'],r['regionId'],r['moduleId']
    label = r['name'].split(', ')[0]; latin = 'Musculus '+LATIN[family]
    adj = 'derecho' if side=='right' else 'izquierdo'
    block = ('upper-limb-' if r['region']=='forearm' else 'lower-limb-')+side
    component = r['component']
    parent = rid if r['region']=='gluteal' else rid+':'+r['compartment']
    if family in QUADRICEPS:parent='muscular:group:quadriceps:'+side
    if component:
        whole=r['structureId']
        if whole not in byid:
            n=node(whole,label+' '+adj,'structure',parent,rid,family=family,side=side,latin=latin,explosionRegionId=block)
            n['aliases']=[latin,family]
        parent=whole
    assert parent==r['proposedParentId']
    name=f'{PARTS[component]} del {label.lower()} {adj}' if component else label+' '+adj
    n=node('bp3d:'+r['sourceId'],name,'component' if component else 'structure',parent,rid,
        sourceId=r['sourceId'],family=family,side=side,explosionRegionId=block)
    n['aliases']=[r['en'],r['sourceId'],r['elementId'],latin,family]
    if family.startswith('fibularis'):n['aliases']+=['Peroneo '+('largo' if family=='fibularislongus' else 'corto')+' '+adj]
    if family=='gracilis':n['aliases'].append('Recto interno '+adj)
    if family in QUADRICEPS:n['aliases']+=['Cuádriceps','Quadriceps femoris']
    if not component:n['latin']=latin
    n['assetIds']=[aid];n['meshNames']=[f"bp3d_{r['sourceId']}_{r['elementId']}"]
    parsed=parse_obj(originals[r['elementId']]);n['bounds']=parsed[3];meshes.append((n,r['elementId'],parsed))

def aggregate(id):
    n=byid[id]
    if n['children']:
        for child in n['children']:aggregate(child)
        n['bounds']=union([byid[c]['bounds'] for c in n['children']])
        n['assetIds']=sorted({a for c in n['children'] for a in byid[c]['assetIds']})
aggregate('muscular')
for n,_,_ in meshes:
    whole=byid[n['parentId']] if n['kind']=='component' else n
    opposite=next((c for c in nodes if c.get('family')==whole['family'] and c['kind']=='structure' and c.get('side')!=whole['side']),None)
    if opposite and opposite['id'] not in whole['relatedIds']:whole['relatedIds'].append(opposite['id'])
assets=[]
for module in selection['modules']:
    aid,rid,filename=module['id'],module['regionId'],module['filename']
    chosen=[m for m in meshes if aid in m[0]['assetIds']];g=GLB()
    g.g['asset']['generator']='MED3D BP3D limbs · same geometry operations as Phase 3A/3B'
    for n,fid,parsed in chosen:g.mesh(n,fid,parsed)
    path=A.output/filename;g.write(path)
    assets.append(dict(id=aid,path='models/anatomy/muscular/'+filename,systemId='muscular',regionId=rid,
        frameId='bodyparts3d-4.0-male',bytes=path.stat().st_size,sha256=sha(path.read_bytes()),meshCount=len(chosen),
        triangles=sum(len(p[2])//3 for _,_,p in chosen),bounds=union([n['bounds'] for n,_,_ in chosen]),provenanceId=PROVENANCE))
sourcefiles=[]
for n,fid,parsed in meshes:
    r=next(r for r in lock['files'] if r['elementId']==fid)
    positions=[list(map(float,l.split()[1:4])) for l in originals[fid].decode().splitlines() if l.startswith('v ')]
    sourcefiles.append(dict(**r,anatomyId=n['id'],family=n['family'],moduleId=n['assetIds'][0],
        sourceType=approved[fid]['sourceType'],isaType=approved[fid]['isaType'],triangles=len(parsed[2])//3,faces=len(parsed[2])//3,
        sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3],
        sourceBoundsMillimetres=union([[p,p] for p in positions]),headerCompatibilityVersion='4.0',headerLegacyLicense='CC BY-SA 2.1 Japan'))
provenance=dict(catalog['provenance'][0]);provenance['id']=PROVENANCE
provenance['modifications']=[
    'Selected only 54 audited original elements representing 48 bilateral muscles in 24 families; six heads per side remain components of three muscles.',
    'Quadriceps is an editorial group of four named muscles per side. Source zone classification retained in manifest; no automatic IS-A to PART-OF conversion.',
    'Every original triangle, FMA/FJ and side identity retained; no fitting, normalization, mirroring, synthesis, deformation or simplification.',
    'Shared transform (x,y,z) to (x,z,-y)/1000; float32 positions; Meshopt and 12-bit display normals as Phase 3A/3B.',
    'Current CC BY 4.0 publisher declaration; original legacy license headers preserved. No clinical validation.']
catalog['provenance']=[p for p in catalog['provenance'] if p['id']!=PROVENANCE]+[provenance]
catalog['assets']+=assets
catalog['coverage']=dict(title='Sistema muscular · torso y extremidades',structures=90,meshes=114,
    note='90 músculos bilaterales representados por 114 mallas: 16 de hombro/brazo, 26 del torso y 48 de glúteos, muslo, pierna y antebrazo. Cabezas y grupos no se cuentan como músculos adicionales.',
    limitations=list(dict.fromkeys([*catalog['coverage']['limitations'],
        'Extremidades con cobertura parcial: se han seleccionado 24 familias; mano y pie intrínsecos siguen pendientes.',
        'Cuádriceps es un grupo de cuatro músculos; se conserva la clasificación BP3D de sus elementos como zonas en la procedencia.'])))
assert sum(n['kind']=='structure' for n in nodes)==90 and len(meshes)==54
assert len({n['id'] for n in nodes})==len(nodes)
write_json(A.output/'catalog.json',catalog)
write_json(A.output/'limbs-source-manifest.json',dict(sourceArchive=URL,sourceVersion='4.0 OBJ99',
    sourceLicenseDeclaration='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',sourceZip='research/anatomy/muscular-limbs-originals.zip',
    sourceZipSha256=lock['sourceZipSha256'],sourceLock='research/anatomy/muscular-limbs-source-lock.json',selectionSha256=lock['selectionSha256'],
    transform=TRANSFORM,additionalRegistration='none',files=sorted(sourcefiles,key=lambda r:r['elementId'])))
print(json.dumps(dict(structures=48,meshes=54,triangles=sum(a['triangles'] for a in assets),uncompressedGLBBytes=sum(a['bytes'] for a in assets)),indent=2))
