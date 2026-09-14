#!/usr/bin/env python3
"""Convert verified BodyParts3D 4.0 OBJ99 bones to modular GLBs + typed catalog.
No synthesis, mirroring, independent recentering, decimation, joining or flattening.
Standard library only. Follow with optimize-skeleton.mjs for Meshopt compression.
"""
from __future__ import annotations
import argparse, collections, csv, hashlib, json, re, struct
from pathlib import Path

P = argparse.ArgumentParser()
P.add_argument('--source', type=Path, required=True, help='Extracted verified dataset subset')
P.add_argument('--output', type=Path, default=Path('public/models/anatomy/skeletal'))
A = P.parse_args()
A.output.mkdir(parents=True, exist_ok=True)

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def find(name):
    found=list(A.source.rglob(name))
    if len(found)!=1: raise ValueError(f'Expected one {name}, got {found}')
    return found[0]
def rows(name): return list(csv.DictReader(find(name).open(encoding='utf-8-sig'), delimiter='\t'))
# Pin exact input hashes so an upstream revision never silently becomes new anatomy.
lock=json.loads((Path(__file__).parent/'source-lock.json').read_text())
for item in lock['files']:
    pp=find(item['elementId']+'.obj')
    if sha(pp)!=item['sha256']:raise ValueError('Source checksum mismatch: '+str(pp))
for item in lock['metadata']:
    pp=find(item['file'])
    if sha(pp)!=item['sha256']:raise ValueError('Metadata checksum mismatch: '+str(pp))
isa=rows('isa_element_parts.txt'); part=rows('partof_element_parts.txt')
byconcept=collections.defaultdict(list)
for row in isa: byconcept[row['concept id']].append(row)
bonefiles={r['element file id'] for r in byconcept['FMA5018']}
# A one-element FMA concept is only used if it refers to a bone and the most specific name.
singletons={}
for cid, rr in byconcept.items():
    if len(rr)==1 and rr[0]['element file id'] in bonefiles:
        r=rr[0]; old=singletons.get(r['element file id'])
        if old is None or len(r['name'])>len(old['name']): singletons[r['element file id']]=r
assert len(singletons)==197, f'Unexpected source coverage: {len(singletons)} singletons'

ORD={w:i for i,w in enumerate(['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'],1)}
TERMS={
'clavicle':('Clavícula','clavicle','Clavicula'),'scapula':('Escápula','scapula','Scapula'),
'humerus':('Húmero','humerus','Humerus'),'radius':('Radio','radius','Radius'),'ulna':('Cúbito','ulna','Ulna'),
'hip bone':('Hueso coxal','hipbone','Os coxae'),'femur':('Fémur','femur','Os femoris'),
'tibia':('Tibia','tibia','Tibia'),'fibula':('Peroné','fibula','Fibula'),'patella':('Rótula','patella','Patella'),
'scaphoid':('Escafoides','carpals','Os scaphoideum'),'lunate':('Semilunar','carpals','Os lunatum'),
'triquetral':('Piramidal','carpals','Os triquetrum'),'pisiform':('Pisiforme','carpals','Os pisiforme'),
'trapezium':('Trapecio','carpals','Os trapezium'),'trapezoid':('Trapezoide','carpals','Os trapezoideum'),
'capitate':('Hueso grande','carpals','Os capitatum'),'hamate':('Ganchoso','carpals','Os hamatum'),
'talus':('Astrágalo','tarsals','Os tali'),'calcaneus':('Calcáneo','tarsals','Calcaneus'),
'medial cuneiform bone':('Cuneiforme medial','tarsals','Os cuneiforme mediale'),
'intermediate cuneiform bone':('Cuneiforme intermedio','tarsals','Os cuneiforme intermedium'),
'lateral cuneiform bone':('Cuneiforme lateral','tarsals','Os cuneiforme laterale'),
'cuboid bone':('Cuboides','tarsals','Os cuboideum'),
'frontal bone':('Frontal','frontal','Os frontale'),'occipital bone':('Occipital','occipital','Os occipitale'),
'sphenoid bone':('Esfenoides','sphenoid','Os sphenoideum'),'temporal bone':('Temporal','temporal','Os temporale'),
'ethmoid':('Etmoides','ethmoid','Os ethmoideum'),'mandible':('Mandíbula','mandible','Mandibula'),
'parietal bone':('Parietal','parietal','Os parietale'),'zygomatic bone':('Cigomático','zygomatic','Os zygomaticum'),
'lacrimal bone':('Lagrimal','lacrimal','Os lacrimale'),'nasal bone':('Nasal','nasal','Os nasale'),
'maxilla':('Maxilar','maxilla','Maxilla'),'palatine bone':('Palatino','palatine','Os palatinum'),
'inferior nasal concha':('Cornete nasal inferior','inferiornasalconcha','Concha nasalis inferior'),
'vomer':('Vómer','vomer','Vomer'),'sacrum':('Sacro','sacrum','Os sacrum'),
'atlas':('Atlas · C1','cervicalvertebrae','Atlas'),'axis':('Axis · C2','cervicalvertebrae','Axis'),
}
# Latin is a term alias, not a fabricated full lateralized translation.
FEMININE={'Clavícula','Escápula','Tibia','Rótula','Mandíbula','Falange'}
DIGITS={'thumb':'pulgar','index finger':'índice','middle finger':'medio','ring finger':'anular','little finger':'meñique'}

def term(en):
    side='left' if re.search(r'\bleft\b',en) else 'right' if re.search(r'\bright\b',en) else 'midline'
    base=re.sub(r'\b(left|right)\s+', '',en).strip()
    alias=[]; latin=None
    if base in TERMS: name,family,latin=TERMS[base]
    elif (m:=re.fullmatch(r'(\w+) rib',base)):
        name=f'Costilla {ORD[m[1]]}'; family='ribs'; latin='Costa'
    elif (m:=re.fullmatch(r'(\w+) (cervical|thoracic|lumbar) vertebra',base)):
        prefix={'cervical':'C','thoracic':'T','lumbar':'L'}[m[2]]
        name=f'Vértebra {dict(cervical="cervical",thoracic="torácica",lumbar="lumbar")[m[2]]} · {prefix}{ORD[m[1]]}'
        family=m[2]+'vertebrae'; latin={'cervical':'Vertebra cervicalis','thoracic':'Vertebra thoracica','lumbar':'Vertebra lumbalis'}[m[2]]
        alias.append(prefix+str(ORD[m[1]]))
    elif (m:=re.fullmatch(r'(\w+) (metacarpal|metatarsal) bone',base)):
        name=f'{"Metacarpiano" if m[2]=="metacarpal" else "Metatarsiano"} {ORD[m[1]]}'
        family='metacarpals' if m[2]=='metacarpal' else 'metatarsals'; latin='Os metacarpale' if m[2]=='metacarpal' else 'Os metatarsale'
    elif (m:=re.fullmatch(r'(proximal|middle|distal) phalanx of (.+)',base)):
        loc, digit=m.groups(); adjective={'proximal':'proximal','middle':'media','distal':'distal'}[loc]
        if digit in DIGITS:
            name=f'Falange {adjective} del {DIGITS[digit]}'; family='handphalanges'
        else:
            toe=digit.replace(' toe',''); num={'big':1,'second':2,'third':3,'fourth':4,'little':5}[toe]
            name=f'Falange {adjective} del dedo {num} del pie'; family='toephalanges'
        latin={'proximal':'Phalanx proximalis','middle':'Phalanx media','distal':'Phalanx distalis'}[loc]
    elif base=='navicular bone of foot': name,family,latin='Navicular del pie','tarsals','Os naviculare'
    else: raise ValueError(f'Unmapped original source name: {en}')
    if side!='midline':
        if family in ('handphalanges','toephalanges'):
            name += ' izquierdo' if side=='left' else ' derecho'
        else:
            female=next((name.startswith(s) for s in FEMININE if name.startswith(s)),False) or family=='ribs'
            name += (' izquierda' if female else ' izquierdo') if side=='left' else (' derecha' if female else ' derecho')
    if family=='ulna': alias+=['ulna', 'ulna izquierda' if side=='left' else 'ulna derecha']
    if family=='fibula': alias+=['fíbula', 'fíbula izquierda' if side=='left' else 'fíbula derecha']
    if family=='patella': alias+=['patela']
    if family=='scapula': alias+=['omóplato']
    return name,family,latin,side,alias

REGIONS={
'skull':('Cráneo y hueso hioides','axial'), 'spine':('Columna vertebral','axial'),
'thorax':('Caja torácica','axial'), 'arm-left':('Miembro superior izquierdo','appendicular'),
'arm-right':('Miembro superior derecho','appendicular'),'leg-left':('Miembro inferior izquierdo','appendicular'),
'leg-right':('Miembro inferior derecho','appendicular')}
SKULL={'frontal','parietal','temporal','occipital','sphenoid','ethmoid','mandible','maxilla','zygomatic','nasal','lacrimal','palatine','vomer','inferiornasalconcha','hyoid'}
ARM={'clavicle','scapula','humerus','radius','ulna','carpals','metacarpals','handphalanges'}
SPINE={'cervicalvertebrae','thoracicvertebrae','lumbarvertebrae','sacrum'}

def region(fam,side):
    if fam in SKULL:return 'skull'
    if fam in SPINE:return 'spine'
    if fam in {'ribs','sternum'}:return 'thorax'
    if side not in {'left','right'}:raise ValueError(f'Need side: {fam}')
    return ('arm-' if fam in ARM else 'leg-')+side

def bounds_union(bounds):
    return [[round(min(b[0][i] for b in bounds),7) for i in range(3)], [round(max(b[1][i] for b in bounds),7) for i in range(3)]]

nodes=[]; nodebyid={}
def node(id,name,kind,parent=None,region_id='skeletal',**kw):
    n=dict(id=id,name=name,anatomicalName=name,aliases=[],systemId='skeletal',regionId=region_id,
           children=[],kind=kind,assetIds=[],meshNames=[],relatedIds=[])
    if parent: n['parentId']=parent; n['relatedIds']=[parent]
    n.update(kw); nodes.append(n); nodebyid[id]=n
    if parent: nodebyid[parent]['children'].append(id)
    return n
node('skeletal','Sistema óseo','system',sourceId='FMA23881',aliases=['esqueleto','skeletal system','skeleton'])
node('skeletal:axial','Esqueleto axial','division','skeletal')
node('skeletal:appendicular','Esqueleto apendicular','division','skeletal')
for rid,(name,division) in REGIONS.items():
    node('skeletal:region:'+rid,name,'region','skeletal:'+division,region_id='skeletal:region:'+rid)
GROUPS={
'skull': [('neurocranium','Neurocráneo'),('face','Esqueleto facial'),('hyoid','Hueso hioides')],
'spine': [('cervicalvertebrae','Columna cervical'),('thoracicvertebrae','Columna torácica'),('lumbarvertebrae','Columna lumbar'),('sacrum','Sacro')],
}
for side in ('left','right'):
    GROUPS['arm-'+side]=[('girdle','Cintura escapular'),('arm','Brazo'),('forearm','Antebrazo'),('carpals','Carpo'),('metacarpals','Metacarpo'),('handphalanges','Falanges de la mano')]
    GROUPS['leg-'+side]=[('girdle','Cintura pélvica'),('thigh','Muslo'),('knee','Rodilla'),('leg','Pierna'),('tarsals','Tarso'),('metatarsals','Metatarso'),('toephalanges','Falanges del pie'),('sesamoid','Sesamoideos del pie')]
for rid,groups in GROUPS.items():
    for gid,name in groups:
        # Hyoid and sacrum are themselves structures; avoid a redundant one-child group.
        if gid in {'hyoid','sacrum'}:continue
        node(f'skeletal:group:{rid}:{gid}',name,'region',f'skeletal:region:{rid}',region_id=f'skeletal:region:{rid}')
def parent_for(fam,rid):
    group=None
    if rid=='skull':
        if fam in {'frontal','parietal','temporal','occipital','sphenoid','ethmoid'}:group='neurocranium'
        elif fam!='hyoid':group='face'
    elif fam in SPINE and fam!='sacrum':group=fam
    elif fam in {'clavicle','scapula','hipbone'}:group='girdle'
    elif fam=='humerus':group='arm'
    elif fam in {'radius','ulna'}:group='forearm'
    elif fam=='femur':group='thigh'
    elif fam=='patella':group='knee'
    elif fam in {'tibia','fibula'}:group='leg'
    elif fam in {'carpals','metacarpals','handphalanges','tarsals','metatarsals','toephalanges','sesamoid'}:group=fam
    return f'skeletal:group:{rid}:{group}' if group else f'skeletal:region:{rid}'

mesh_entries=[]
def add_mesh(n,fid,sourceconcept):
    rid=n['regionId'].split(':')[-1]; aid='skeletal:'+rid
    meshname='bp3d_'+sourceconcept+'_'+fid
    n['meshNames'].append(meshname); n['assetIds']=[aid]
    mesh_entries.append(dict(node=n,fid=fid,meshName=meshname,assetId=aid,sourceConcept=sourceconcept))

for fid,r in sorted(singletons.items(), key=lambda x:(int(x[1]['concept id'][3:]))):
    en=r['name'];name,fam,latin,side,aliases=term(en);rid=region(fam,side);cid=r['concept id']
    n=node('bp3d:'+cid,name,'structure',parent_for(fam,rid),region_id='skeletal:region:'+rid,
           sourceId=cid,aliases=[en,cid,fid,*aliases,latin],family=fam,side=side)
    # A generic Latin noun remains an alias, to avoid presenting it as an exact lateralized term.
    if side=='midline':n['latin']=latin
    if fam=='ulna':n['anatomicalName']=name.replace('Cúbito','Ulna')
    if fam=='fibula':n['anatomicalName']=name.replace('Peroné','Fíbula')
    add_mesh(n,fid,cid)

# FJ2772 and FJ3201 duplicate the exact same hyoid vertices/normals/faces.
# Keep FJ3201 once; retain both source hashes and verify equality before conversion.
h=node('bp3d:FMA52749','Hueso hioides','structure','skeletal:region:skull',region_id='skeletal:region:skull',
       sourceId='FMA52749',aliases=['hyoid','hyoid bone','hioides','Os hyoideum','FJ2772','FJ3201'],latin='Os hyoideum',family='hyoid',side='midline')
def geometry_lines(p):return [s.strip() for s in p.read_text().splitlines() if s.startswith(('v ','vn ','f '))]
assert geometry_lines(find('FJ2772.obj'))==geometry_lines(find('FJ3201.obj')), 'Hyoid duplicate changed; inspect instead of deduplicating'
add_mesh(h,'FJ3201','FMA52749')
# Four accessory sesamoids have two shared FMA concepts; element IDs identify individual geometry.
for side,concept,fids in [('left','FMA45098',['FJ3266','FJ3270']),('right','FMA45097',['FJ3372','FJ3376'])]:
    for fid in fids:
        rid='leg-'+side;name='Sesamoideo del pie '+('izquierdo' if side=='left' else 'derecho')+' · '+fid
        n=node(f'bp3d:{concept}:{fid}',name,'structure',parent_for('sesamoid',rid),region_id='skeletal:region:'+rid,
               sourceId=concept,aliases=[concept,fid,'sesamoid bone of '+side+' foot'],family='sesamoid',side=side)
        add_mesh(n,fid,concept)
# Sternum is a single bone represented by three independently identified components.
s=node('bp3d:FMA7485','Esternón','structure','skeletal:region:thorax',region_id='skeletal:region:thorax',
       sourceId='FMA7485',aliases=['sternum','Sternum'],latin='Sternum',family='sternum',side='midline')
for cid,fid,name,en,latin in [('FMA7486','FJ3290','Manubrio','manubrium','Manubrium sterni'),('FMA7487','FJ3178','Cuerpo del esternón','body of sternum','Corpus sterni'),('FMA7488','FJ3153','Apófisis xifoides','xiphoid process','Processus xiphoideus')]:
    n=node('bp3d:'+cid,name,'component',s['id'],region_id=s['regionId'],sourceId=cid,
           aliases=[en,cid,fid,latin],latin=latin,family='sternum',side='midline')
    add_mesh(n,fid,cid)
assert len(mesh_entries)==205
assert len({e['fid'] for e in mesh_entries})==205

# Relation scope is deliberately limited to hierarchy and unambiguous bilateral homologues.
english_to_node={n['aliases'][0]:n for n in nodes if n.get('sourceId') and n.get('aliases') and n['kind']=='structure'}
for en,n in english_to_node.items():
    other=re.sub(r'\bleft\b','right',en) if 'left' in en else re.sub(r'\bright\b','left',en)
    if other!=en and other in english_to_node:n['relatedIds'].append(english_to_node[other]['id'])


def parse_obj(path):
    pos=[];norm=[];faces=[]
    for line in path.open():
        words=line.split()
        if not words:continue
        if words[0]=='v':
            x,y,z=map(float,words[1:4]);pos.append((x*.001,z*.001,-y*.001))
        elif words[0]=='vn':
            x,y,z=map(float,words[1:4]);norm.append((x,z,-y))
        elif words[0]=='f':
            if len(words)!=4:raise ValueError(f'Non-triangle in {path}: {line}')
            faces.append(words[1:])
    if not pos or not faces:raise ValueError(f'Empty geometry {path}')
    vertices=[];normals=[];indices=[];seen={}
    for face in faces:
        for token in face:
            parts=token.split('/');vi=int(parts[0]);vi=vi-1 if vi>0 else len(pos)+vi
            ni=int(parts[2]) if len(parts)>2 and parts[2] else None
            if ni is None:raise ValueError(f'No normal in source {path}')
            ni=ni-1 if ni>0 else len(norm)+ni
            key=(vi,ni)
            if key not in seen:
                seen[key]=len(vertices);vertices.append(pos[vi]);normals.append(norm[ni])
            indices.append(seen[key])
    bounds=[[min(p[i] for p in vertices) for i in range(3)],[max(p[i] for p in vertices) for i in range(3)]]
    return vertices,normals,indices,bounds

class GLB:
    def __init__(self):
        self.bin=bytearray(); self.g=dict(asset={'version':'2.0','generator':'MED3D BodyParts3D pipeline'},
            scene=0,scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[{'name':'Hueso · material de visualización','pbrMetallicRoughness':{'baseColorFactor':[0.86,0.82,0.70,1], 'metallicFactor':0, 'roughnessFactor':0.8},'doubleSided':False}])
    def accessor(self,data,ctype,atype,count,bounds=None,target=None):
        while len(self.bin)%4:self.bin.append(0)
        offset=len(self.bin);self.bin.extend(data)
        vi=len(self.g['bufferViews']);view=dict(buffer=0,byteOffset=offset,byteLength=len(data))
        if target:view['target']=target
        self.g['bufferViews'].append(view)
        ac=dict(bufferView=vi,componentType=ctype,count=count,type=atype)
        if bounds:ac['min'],ac['max']=bounds
        self.g['accessors'].append(ac);return len(self.g['accessors'])-1
    def mesh(self,e,parsed):
        v,n,i,b=parsed
        pi=self.accessor(struct.pack('<'+'f'*len(v)*3,*(c for p in v for c in p)),5126,'VEC3',len(v),b,34962)
        ni=self.accessor(struct.pack('<'+'f'*len(n)*3,*(c for p in n for c in p)),5126,'VEC3',len(n),None,34962)
        short=len(v)<65536;ii=self.accessor(struct.pack('<'+('H' if short else 'I')*len(i),*i),5123 if short else 5125,'SCALAR',len(i),None,34963)
        mi=len(self.g['meshes']);self.g['meshes'].append({'name':e['meshName'],'primitives':[{'attributes':{'POSITION':pi,'NORMAL':ni},'indices':ii,'material':0}]})
        self.g['nodes'].append({'name':e['meshName'],'mesh':mi,'extras':{'sourceId':e['sourceConcept'],'sourceElement':e['fid'],'anatomyId':e['node']['id']}})
        self.g['scenes'][0]['nodes'].append(len(self.g['nodes'])-1)
    def write(self,path):
        while len(self.bin)%4:self.bin.append(0)
        self.g['buffers']=[{'byteLength':len(self.bin)}]
        js=json.dumps(self.g,separators=(',',':'),ensure_ascii=False).encode();js+=b' '*((-len(js))%4)
        total=12+8+len(js)+8+len(self.bin)
        path.write_bytes(struct.pack('<III',0x46546c67,2,total)+struct.pack('<II',len(js),0x4E4F534A)+js+struct.pack('<II',len(self.bin),0x004E4942)+self.bin)

asset_entries=collections.defaultdict(list);sourcefiles=[]
for e in mesh_entries:
    source=find(e['fid']+'.obj');parsed=parse_obj(source);e['node']['bounds']=parsed[3]
    e['parsed']=parsed;asset_entries[e['assetId']].append(e)
    sourcefiles.append(dict(elementId=e['fid'],sourceId=e['sourceConcept'],sha256=sha(source),bytes=source.stat().st_size,
                            triangles=len(parsed[2])//3,vertices=len(parsed[0]),boundsMetres=parsed[3]))
assets=[]
for aid,entries in sorted(asset_entries.items()):
    rid=aid.split(':')[-1];g=GLB()
    for e in entries:g.mesh(e,e['parsed'])
    outfile=A.output/(rid+'.glb');g.write(outfile)
    assets.append(dict(id=aid,path='models/anatomy/skeletal/'+rid+'.glb',systemId='skeletal',regionId='skeletal:region:'+rid,
                       frameId='bodyparts3d-4.0-male',bytes=outfile.stat().st_size,sha256=sha(outfile),meshCount=len(entries),
                       triangles=sum(len(e['parsed'][2])//3 for e in entries),bounds=bounds_union([e['node']['bounds'] for e in entries]),provenanceId='bodyparts3d-4.0'))
# Aggregate only spatial bounds and module dependencies; never duplicate leaf mesh ownership.
for n in reversed(nodes):
    if n['children']:
        ch=[nodebyid[id] for id in n['children']]
        if all('bounds' in c for c in ch):n['bounds']=bounds_union([c['bounds'] for c in ch])
        n['assetIds']=sorted(set(a for c in ch for a in c['assetIds']))
# Parents precede leaves but some structures were appended later; explicit recursion covers all.
def aggregate(id):
    n=nodebyid[id]
    if n['children']:
        for ch in n['children']:aggregate(ch)
        cc=[nodebyid[ch] for ch in n['children']]
        n['bounds']=bounds_union([c['bounds'] for c in cc]);n['assetIds']=sorted(set(a for c in cc for a in c['assetIds']))
aggregate('skeletal')
# Natural alphabetic labels avoid source-ID ordering in the tree.
def natural_name(id):return [int(x) if x.isdigit() else x.casefold() for x in re.split(r'(\d+)',nodebyid[id]['name'])]
for n in nodes:n['children'].sort(key=natural_name)
provenance=dict(id='bodyparts3d-4.0',source='BodyParts3D / Anatomography',author='Database Center for Life Science (DBCLS), Japan',
    license='CC BY 4.0',licenseUrl='https://creativecommons.org/licenses/by/4.0/',version='4.0 · OBJ99 (2013 archive; current license declaration)',
    originalUrl='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip',
    attribution='BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.',
    modifications=['Selected 206 source elements: 199 standard adult bones (sternum in 3 elements), plus 4 accessory foot sesamoids. Removed only FJ2772, an exact geometry duplicate of the hyoid FJ3201: 205 distinct output meshes.',
        'Converted OBJ99 to GLB 2.0; retained all triangles of distinct source geometry and individual element IDs; removed only the exactly duplicated hyoid surface. No additional decimation, mirroring, synthesis, joining or flattening.',
        'One shared right-handed coordinate transform for every element: (x,y,z) source mm → (x,z,-y) metres. No per-element or per-region recentering.',
        'Assigned a neutral untextured display material; translated source labels to Spanish; retained English/FMA/source aliases.',
        'Grouped into seven spatial modules; anatomical identity remains at individual bone/component level.',
        'Applied the current official CC BY 4.0 license declaration updated 2025-02-27; the older OBJ comment headers still mention legacy CC BY-SA 2.1 Japan.',
        'Meshopt compression and quantization are performed by optimize-skeleton.mjs; output hashes in this catalog are final-file hashes.'])
cat=dict(schemaVersion=1,id='med3d-skeletal-bodyparts3d-4.0',frame=dict(id='bodyparts3d-4.0-male',units='metres',up='Y',bounds=nodebyid['skeletal']['bounds'],
    note='OBJ99 source millimetres; source superior Z becomes Y-up; (x,y,z)→(x,z,-y)/1000. One common original frame, with no bone-wise or module-wise centering. HRA organ assets are separate frames and must not be overlaid without validated registration.'),
    nodes=nodes,assets=assets,provenance=[provenance],coverage=dict(title='Sistema óseo · BodyParts3D',structures=203,meshes=205,
    note='199 huesos del recuento adulto habitual, más 4 sesamoideos accesorios del pie. El esternón conserva 3 componentes originales. Se retiró una copia exactamente duplicada del hioides. No existe un cóccix separable identificado.',
    limitations=['Pendientes 7 huesos del recuento adulto habitual: cóccix identificable por separado y 6 huesecillos del oído (martillo, yunque y estribo de ambos lados).',
    '205 mallas no equivalen a 205 huesos: el esternón tiene 3 componentes; se incluyen 4 sesamoideos accesorios. El hioides duplicado en la fuente se muestra una sola vez.',
    'Modelo de referencia masculino adulto; no representa variación individual ni un esqueleto pediátrico.',
    'La fuente OBJ99 tiene resolución reducida; no permite interpretar microanatomía ni planificar procedimientos.',
    'Fichas educativas y relaciones articulares se incorporan sólo con referencias verificadas.']))
(A.output/'catalog.json').write_text(json.dumps(cat,ensure_ascii=False,indent=2)+'\n')
manifest=dict(sourceArchive=provenance['originalUrl'],sourceArchiveSha256='40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e',sourceLicenseDeclaration='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',sourceLicenseUpdated='2025-02-27',sourceVersion='4.0 OBJ99',transform=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]],files=sorted(sourcefiles,key=lambda s:s['elementId']),deduplicated=[dict(elementId='FJ2772',sha256=sha(find('FJ2772.obj')),keptElementId='FJ3201',reason='Identical ordered v/vn/f lines verified before import')],metadata=[])
for name in ['isa_element_parts.txt','partof_element_parts.txt','isa_parts_list_e.txt','partof_parts_list_e.txt','isa_inclusion_relation_list.txt','partof_inclusion_relation_list.txt']:
    pp=find(name);manifest['metadata'].append(dict(file=name,sha256=sha(pp),bytes=pp.stat().st_size,url=next(x['url'] for x in lock['metadata'] if x['file']==name)))
(A.output/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(meshes=len(mesh_entries),structures=203,standardAdultBones=199,triangles=sum(a['triangles'] for a in assets),uncompressedGLBBytes=sum(a['bytes'] for a in assets),bounds=cat['frame']['bounds'],modules=[{'id':a['id'],'meshes':a['meshCount'],'bytes':a['bytes']} for a in assets]),indent=2))
