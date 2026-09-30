#!/usr/bin/env python3
"""Build the pinned internal organ cohort only; no historical assets are rebuilt.
Run --fetch once, then optimize-internal.mjs. Original hashes and source versions
are checked independently. The same tested OBJ/GLB writer preserves geometry.
"""
from pathlib import Path
import argparse,concurrent.futures,hashlib,json,re,struct,urllib.request,urllib.parse,http.cookiejar,zipfile,zlib
ROOT=Path(__file__).resolve().parents[2]
URL='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip'
TRANSFORM=[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]
P=argparse.ArgumentParser(description=__doc__);P.add_argument('--fetch',action='store_true');A=P.parse_args()
research=ROOT/'research/anatomy';out=ROOT/'public/models/anatomy/internal';out.mkdir(exist_ok=True)
selection_path=research/'internal-selection.json';source_path=research/'internal-originals.zip';lock_path=research/'internal-source-lock.json'
def sha(data):return hashlib.sha256(data).hexdigest()
def write_json(path,value):path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
def union(bounds):return [[min(b[0][i] for b in bounds) for i in range(3)],[max(b[1][i] for b in bounds) for i in range(3)]]
assert sha(selection_path.read_bytes())=='022c884c635d0f5ee980feb4c8392b435a4b1e1edf24de062e555ce3289cca6e','Pinned selection changed'
selection=json.loads(selection_path.read_text(encoding='utf8'));approved={a['elementId']:a for a in selection['approved']};assert len(approved)==32
if A.fetch:
 with zipfile.ZipFile(research/'torso-metadata.zip') as z:cd=z.read('isa_BP3D_4.0_obj_99.central-directory.bin')
 assert sha(cd)=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
 entries={};offset=0
 while offset<len(cd):
  h=struct.unpack_from('<4s6H3L5H2L',cd,offset);name=cd[offset+46:offset+46+h[10]].decode();entries[Path(name).stem]=dict(path=name,crc=h[7],compressed=h[8],bytes=h[9],offset=h[16]);offset+=46+h[10]+h[11]+h[12]
 requests=[]
 def getrange(start,end):
  req=urllib.request.Request(URL,headers={'Range':f'bytes={start}-{end}','Accept-Encoding':'identity'})
  with urllib.request.urlopen(req,timeout=90) as res:
   assert res.status==206 and res.headers.get('Content-Range')==f'bytes {start}-{end}/142903898';data=res.read(end-start+2)
  assert len(data)==end-start+1;requests.append(dict(start=start,end=end,bytes=len(data)));return data
 def fetch40(fid):
  e=entries[fid];audit=approved[fid]['archiveEntry'];assert (e['bytes'],e['compressed'],f"{e['crc']:08x}")==(audit['bytes'],audit['compressedBytes'],audit['crc32'])
  h=struct.unpack('<4s5H3L2H',getrange(e['offset'],e['offset']+29));assert h[0]==b'PK\x03\x04' and h[3]==8
  start=e['offset']+30+h[9]+h[10];data=zlib.decompress(getrange(start,start+e['compressed']-1),-15)
  assert len(data)==e['bytes'] and zlib.crc32(data)==e['crc'];return fid,data
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:originals=dict(pool.map(fetch40,[fid for fid,a in approved.items() if a['sourceVersion']=='4.0']))
 # Only seven approved cervical elements and two unchanged frame controls.
 ids=[fid for fid,a in approved.items() if a['sourceVersion']=='4.3']+['FJ2808','FJ2541']
 cache=ROOT/'.cache/phase8';cache.mkdir(parents=True,exist_ok=True);download=cache/'official-internal43.zip'
 if not download.exists():
  op=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()));op.addheaders=[('User-Agent','Mozilla/5.0'),('Referer','https://lifesciencedb.jp/bp3d/?lng=en')]
  with op.open('https://lifesciencedb.jp/bp3d/?lng=en',timeout=60) as res:res.read()
  with op.open('https://lifesciencedb.jp/bp3d/download.cgi',urllib.parse.urlencode(dict(ids=json.dumps(ids),filename='med3d-internal43-audit',type='art_file',all_downloads=1)).encode(),timeout=180) as res:download.write_bytes(res.read())
 controls=[];control_bytes={}
 with zipfile.ZipFile(download) as z,zipfile.ZipFile(research/'respiratory-originals.zip') as historic:
  for name in z.namelist():
   if not name.endswith('.obj'):continue
   data=z.read(name);fid=re.search(r'# File ID\s*:\s*(.+)',data.decode()).group(1);assert fid in ids
   if fid in approved:originals[fid]=data
   else:
    other=historic.read(next(n for n in historic.namelist() if n.endswith('/'+fid+'.obj') or n==fid+'.obj'))
    geom=lambda b:[l for l in b.decode().splitlines() if l.startswith(('v ','vn ','f '))]
    assert geom(data)==geom(other),'4.3 frame control mismatch: stop before integration'
    controls.append(dict(elementId=fid,geometryRecordsIdentical=True,source40Sha256=sha(other),source43Sha256=sha(data),recordCount=len(geom(data))));control_bytes[fid]=data
 assert set(originals)==set(approved) and len(controls)==2
 def writezip(path,files):
  with zipfile.ZipFile(path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
   for name,data in sorted(files.items()):
    info=zipfile.ZipInfo(name,date_time=(1980,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
 writezip(source_path,{fid+'.obj':data for fid,data in originals.items()})
 metadata={'controls43/'+fid+'.obj':data for fid,data in control_bytes.items()}
 metadata['frame-controls.json']=json.dumps(controls,indent=2).encode()
 with zipfile.ZipFile(research/'respiratory-metadata.zip') as historical_metadata:metadata['FMA2Obj43.txt']=historical_metadata.read('FMA2Obj43.txt')
 metadata['candidate-rows43.json']=json.dumps([a for a in selection['approved'] if a['sourceVersion']=='4.3'],indent=2).encode()
 writezip(research/'internal-metadata.zip',metadata)
 files=[]
 for fid,data in sorted(originals.items()):
  h={k:re.search(r'# '+k+r'\s*:\s*(.+)',data.decode()).group(1) for k in ['File ID','Concept ID','Representation ID','Compatibility version']}
  assert h['File ID']==fid and h['Concept ID']==approved[fid]['sourceId'] and h['Compatibility version']==approved[fid]['sourceVersion']
  files.append(dict(elementId=fid,sourceId=h['Concept ID'],representationId=h['Representation ID'],sourceVersion=h['Compatibility version'],path=fid+'.obj',bytes=len(data),sha256=sha(data),side=approved[fid]['side']))
 write_json(lock_path,dict(sourceArchive40=URL,sourceDownload43='https://lifesciencedb.jp/bp3d/download.cgi',selectionSha256=sha(selection_path.read_bytes()),sourceZipSha256=sha(source_path.read_bytes()),sourceZipBytes=source_path.stat().st_size,metadataSha256=sha((research/'internal-metadata.zip').read_bytes()),frameControls=controls,requests40=sorted(requests,key=lambda x:x['start']),extraction='25 approved 4.0 OBJ via exact HTTP ranges; 7 approved 4.3 OBJ. Two 4.3 frame controls remain metadata only.',files=files))
lock=json.loads(lock_path.read_text(encoding='utf8'));assert sha(selection_path.read_bytes())==lock['selectionSha256'] and sha(source_path.read_bytes())==lock['sourceZipSha256']
with zipfile.ZipFile(source_path) as z:
 assert set(z.namelist())=={f['path'] for f in lock['files']};originals={f['elementId']:z.read(f['path']) for f in lock['files']}
for f in lock['files']:
 data=originals[f['elementId']];assert sha(data)==f['sha256']
 for key,value in [('File ID',f['elementId']),('Concept ID',f['sourceId']),('Representation ID',f['representationId']),('Compatibility version',f['sourceVersion'])]:assert re.search(r'# '+key+r'\s*:\s*(.+)',data.decode()).group(1)==value
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
        self.g = dict(asset={'version':'2.0','generator':'MED3D BP3D internal systems'},scene=0,
            scenes=[{'nodes':[]}],nodes=[],meshes=[],buffers=[],bufferViews=[],accessors=[],
            materials=[dict(name='Órganos · material de visualización',pbrMetallicRoughness=dict(
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


skeleton=json.loads((ROOT/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'))
systems={'urinary':('uri','Sistema urinario','Systema urinarium'),'endocrine':('endo','Sistema endocrino','Systema endocrinum'),'lymphatic':('lym','Sistema linfático / inmunitario','Systema lymphoideum'),'reproductive':('rep','Sistema reproductor masculino','Systema genitale masculinum')}
regions={'head':('Cabeza','Caput'),'neck':('Cuello','Collum'),'thorax':('Tórax','Thorax'),'abdomen':('Abdomen','Abdomen'),'abdomen-pelvis':('Abdomen y pelvis','Abdomen et pelvis'),'pelvis':('Pelvis y región perineal','Pelvis et perineum')}
limits={
 'urinary':['Riñones completos como superficies externas; corteza, médula, pelvis renal y cálices sin piezas separadas.','Uretra de la fuente masculina; no se fabrican conexiones ni se duplican órganos bajo Reproductor.'],
 'endocrine':['Tiroides y paratiroides proceden de 4.3, con controles cervicales idénticos al marco 4.0.','Hipófisis, pineal y suprarrenales sin microanatomía. Islotes pancreáticos no modelados. Páncreas y testículos conservan sus propietarios originales.'],
 'lymphatic':['Cobertura limitada a bazo y dos lóbulos del timo. No hay ganglios, amígdalas ni vasos o conductos linfáticos integrados.','El tamaño y la forma tímicos son los del cuerpo fuente; no representan todas las edades.'],
 'reproductive':['Cobertura masculina parcial; sin conductos eyaculadores, glándulas bulbouretrales ni escroto separado.','Pene representado por componentes fuente, sin envolvente completa ni lateralidad inventada para el cuerpo cavernoso. Uretra única bajo Urinario.','Reproductor femenino pendiente de un atlas femenino con marco documentado propio. No se mezcla con el cuerpo masculino.']}
allnodes=[];allassets=[];provenances=[];sourcefiles=[]
for system,(prefix,title,latin) in systems.items():
 nodes=[];byid={};meshes=[];dest=ROOT/'public/models/anatomy'/system;dest.mkdir(exist_ok=True)
 def node(id,name,kind,parent=None,**values):
  n=dict(id=id,name=name,anatomicalName=name,aliases=[],systemId=system,regionId=id,children=[],kind=kind,assetIds=[],meshNames=[],relatedIds=[]);n.update(values)
  if parent:n['parentId']=parent;byid[parent]['children'].append(id)
  assert id not in byid;nodes.append(n);byid[id]=n;return n
 node(system,title,'system',latin=latin,aliases=[system,latin,title],internalType='sistema')
 selected=[u for u in selection['units'] if u['systemId']==system]
 for reg in dict.fromkeys(u['region'] for u in selected):node(prefix+':'+reg,regions[reg][0],'region',system,latin=regions[reg][1],internalType='región')
 if system=='endocrine':node('endo:thyroid','Glándula tiroides','structure','endo:neck',latin='Glandula thyroidea',aliases=['tiroides','thyroid gland'],family='thyroid',internalType='glándula',regionId='endo:neck',explosionRegionId='head-neck',side='midline')
 if system=='lymphatic':node('lym:FMA9607','Timo','structure','lym:thorax',sourceId='FMA9607',latin='Thymus',aliases=['timo','thymus','FMA9607'],family='thymus',internalType='órgano linfoide',regionId='lym:thorax',explosionRegionId='thorax',side='midline')
 if system=='reproductive':node('rep:penis','Pene · componentes disponibles','structure','rep:pelvis',latin='Penis',aliases=['pene','penis','componentes del pene'],family='penis',internalType='órgano de cobertura parcial',regionId='rep:pelvis',explosionRegionId='pelvis',side='midline')
 for u in selected:
  n=node(u['id'],u['name'],u['kind'],u['parent'],sourceId=u['sourceId'],latin=u['latin'],aliases=[u['english'],u['sourceId'],*u['elements']],side=u['side'],family=u['category'],internalType=u['entityType'],regionId=prefix+':'+u['region'],explosionRegionId='head-neck' if u['region'] in ['head','neck'] else 'abdomen-pelvis' if u['category'] in ['kidney','ureter'] else u['region']);n['assetIds']=[u['moduleId']]
  for fid in u['elements']:
   parsed=parse_obj(originals[fid]);n['meshNames'].append('bp3d_'+approved[fid]['sourceId']+'_'+fid);n['bounds']=parsed[3];meshes.append((n,fid,parsed))
   for axis in range(3):assert parsed[3][0][axis]>=skeleton['frame']['bounds'][0][axis]-.03 and parsed[3][1][axis]<=skeleton['frame']['bounds'][1][axis]+.03,(fid,'outside fixed frame')
 def aggregate(id):
  n=byid[id]
  for c in n['children']:aggregate(c)
  if n['children']:n['bounds']=union([byid[c]['bounds'] for c in n['children']]);n['assetIds']=sorted({a for c in n['children'] for a in byid[c]['assetIds']})
 aggregate(system);assets=[];provs=[]
 for version in dict.fromkeys(u['sourceVersion'] for u in selected):
  prov=dict(skeleton['provenance'][0]);prov['id']='bodyparts3d-'+version+'-'+system;prov['version']=version+' OBJ';prov['modifications']=['Selección macroscópica curada; originales e identidades preservados.','Transformación común (x,y,z) → (x,z,-y)/1000. Sin ajuste, deformación, reflejo ni decimación adicional.','Posiciones Float32; Meshopt y cuantización exclusiva de normales.']
  if version=='4.3':prov.update(license='CC BY-SA 2.1 Japan',licenseUrl='https://creativecommons.org/licenses/by-sa/2.1/jp/',originalUrl='https://lifesciencedb.jp/bp3d/',attribution='BodyParts3D, © The Database Center for Life Science, CC BY-SA 2.1 Japan');prov['modifications'].append('Dos controles cervicales tienen los mismos vértices, normales y caras que 4.0; no se aplica registro adicional.')
  provs.append(prov)
 for module in [m for m in selection['modules'] if m['systemId']==system]:
  aid=module['id'];g=GLB();chosen=[m for m in meshes if aid in m[0]['assetIds']]
  for n,fid,parsed in chosen:g.mesh(n,fid,parsed)
  path=dest/module['filename'];g.write(path);assets.append(dict(id=aid,path='models/anatomy/'+system+'/'+module['filename'],systemId=system,regionId='endo:neck' if aid.endswith('43') else system,frameId=skeleton['frame']['id'],bytes=path.stat().st_size,sha256=sha(path.read_bytes()),meshCount=len(chosen),triangles=sum(len(p[2])//3 for _,_,p in chosen),bounds=union([p[3] for _,_,p in chosen]),provenanceId='bodyparts3d-'+module['sourceVersion']+'-'+system))
 for n,fid,parsed in meshes:
  f=next(f for f in lock['files'] if f['elementId']==fid);positions=[list(map(float,l.split()[1:4])) for l in originals[fid].decode().splitlines() if l.startswith('v ')]
  sourcefiles.append(dict(**f,anatomyId=n['id'],ownerSourceId=n['sourceId'],family=n['family'],moduleId=n['assetIds'][0],sourceType=n['internalType'],triangles=len(parsed[2])//3,faces=len(parsed[2])//3,sourcePositionCount=parsed[4],vertices=len(parsed[0]),boundsMetres=parsed[3],sourceBoundsMillimetres=union([[p,p] for p in positions])))
 structures=sum(n['kind']=='structure' for n in nodes);components=sum(n['kind']=='component' for n in nodes)
 catalog=dict(schemaVersion=1,id='med3d-'+system,frame=skeleton['frame'],nodes=nodes,assets=assets,provenance=provs,coverage=dict(title=title+' · cobertura disponible',structures=structures,meshes=len(meshes),note=f'{title}: {structures} unidades anatómicas, {components} componentes y {len(meshes)} mallas fuente.',limitations=limits[system]+['Geometría educativa del cuerpo fuente; no constituye validación clínica.']))
 write_json(dest/'catalog.json',catalog);allnodes+=nodes;allassets+=assets;provenances+=provs
 (dest/'LICENSE.txt').write_text('\n\n'.join(p['attribution']+'\n'+p['licenseUrl']+'\nFuente '+p['originalUrl']+'\nVersión '+p['version']+'\n'+' '.join(p['modifications']) for p in provs)+'\n\nIdentidades y hashes: ../internal/internal-source-manifest.json.\n',encoding='utf8',newline='\n')
 print(system,structures,'structures',components,'components',len(meshes),'meshes')
write_json(out/'cohort.json',dict(schemaVersion=1,id='internal-validation-only',frame=skeleton['frame'],nodes=allnodes,assets=allassets,provenance=provenances,coverage=dict(title='Índice técnico de validación; la interfaz usa cuatro catálogos separados',structures=sum(n['kind']=='structure' for n in allnodes),meshes=len(sourcefiles),note='',limitations=[])))
write_json(out/'internal-source-manifest.json',dict(sourceZip='research/anatomy/internal-originals.zip',sourceZipSha256=lock['sourceZipSha256'],selectionSha256=lock['selectionSha256'],sourceLock='research/anatomy/internal-source-lock.json',transform=TRANSFORM,additionalRegistration='none; 4.0 native frame and 4.3 cervical controls with identical geometry records',frameControls=lock['frameControls'],files=sorted(sourcefiles,key=lambda f:f['elementId'])))
