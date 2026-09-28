#!/usr/bin/env python3
"""Scoped, curated BP3D cardiovascular concepts; IS-A never supplies anatomical parents."""
from pathlib import Path
import csv, io, json, zipfile, struct, hashlib, collections
ROOT=Path(__file__).resolve().parents[2]
with zipfile.ZipFile(ROOT/'research/anatomy/torso-metadata.zip') as z:
 def read(n): return z.read(next(p for p in z.namelist() if p==n or p.endswith('/'+n)))
 rows=list(csv.DictReader(io.StringIO(read('isa_element_parts.txt').decode()),delimiter='\t'))
 names={r['concept id']:r for r in csv.DictReader(io.StringIO(read('isa_parts_list_e.txt').decode()),delimiter='\t')}
 directory_bytes=read('isa_BP3D_4.0_obj_99.central-directory.bin')
assert hashlib.sha256(directory_bytes).hexdigest()=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
entries={};offset=0
while offset<len(directory_bytes):
 h=struct.unpack_from('<4s6H3L5H2L',directory_bytes,offset);assert h[0]==b'PK\x01\x02'
 name=directory_bytes[offset+46:offset+46+h[10]].decode()
 entries[Path(name).stem]=dict(path=name,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4])
 offset+=46+h[10]+h[11]+h[12]
by_name={r['en']:cid for cid,r in names.items()}
by_concept=collections.defaultdict(list);by_element=collections.defaultdict(list)
for r in rows: by_concept[r['concept id']].append(r['element file id']);by_element[r['element file id']].append(r['concept id'])
# Explicit anatomical scope; bilateral concepts resolve only to named left/right
# identities, not arbitrary descendants. Missing concepts remain in the audit.
# English | Spanish | Latin | vascular class | display region
SPEC='''
ascending aorta|Aorta ascendente|Aorta ascendens|arterial|trunk
arch of aorta|Arco aórtico|Arcus aortae|arterial|trunk
descending thoracic aorta|Aorta torácica descendente|Aorta thoracica descendens|arterial|trunk
abdominal aorta|Aorta abdominal|Aorta abdominalis|arterial|trunk
pulmonary trunk|Tronco pulmonar|Truncus pulmonalis|arterial|trunk
pulmonary artery|Arteria pulmonar|Arteria pulmonalis|arterial|trunk
brachiocephalic artery|Tronco braquiocefálico|Truncus brachiocephalicus|arterial|trunk
common carotid artery|Arteria carótida común|Arteria carotis communis|arterial|head-neck
internal carotid artery|Arteria carótida interna|Arteria carotis interna|arterial|head-neck
external carotid artery|Arteria carótida externa|Arteria carotis externa|arterial|head-neck
vertebral artery|Arteria vertebral|Arteria vertebralis|arterial|head-neck
basilar artery|Arteria basilar|Arteria basilaris|arterial|head-neck
subclavian artery|Arteria subclavia|Arteria subclavia|arterial|upper
axillary artery|Arteria axilar|Arteria axillaris|arterial|upper
brachial artery|Arteria braquial|Arteria brachialis|arterial|upper
deep brachial artery|Arteria braquial profunda|Arteria profunda brachii|arterial|upper
radial artery|Arteria radial|Arteria radialis|arterial|upper
ulnar artery|Arteria cubital|Arteria ulnaris|arterial|upper
internal thoracic artery|Arteria torácica interna|Arteria thoracica interna|arterial|trunk
celiac trunk|Tronco celíaco|Truncus coeliacus|arterial|trunk
left gastric artery|Arteria gástrica izquierda|Arteria gastrica sinistra|arterial|trunk
common hepatic artery|Arteria hepática común|Arteria hepatica communis|arterial|trunk
hepatic artery proper|Arteria hepática propia|Arteria hepatica propria|arterial|trunk
splenic artery|Arteria esplénica|Arteria splenica|arterial|trunk
superior mesenteric artery|Arteria mesentérica superior|Arteria mesenterica superior|arterial|trunk
inferior mesenteric artery|Arteria mesentérica inferior|Arteria mesenterica inferior|arterial|trunk
renal artery|Arteria renal|Arteria renalis|arterial|trunk
common iliac artery|Arteria ilíaca común|Arteria iliaca communis|arterial|trunk
internal iliac artery|Arteria ilíaca interna|Arteria iliaca interna|arterial|trunk
external iliac artery|Arteria ilíaca externa|Arteria iliaca externa|arterial|lower
femoral artery|Arteria femoral|Arteria femoralis|arterial|lower
deep femoral artery|Arteria femoral profunda|Arteria profunda femoris|arterial|lower
popliteal artery|Arteria poplítea|Arteria poplitea|arterial|lower
anterior tibial artery|Arteria tibial anterior|Arteria tibialis anterior|arterial|lower
posterior tibial artery|Arteria tibial posterior|Arteria tibialis posterior|arterial|lower
fibular artery|Arteria fibular|Arteria fibularis|arterial|lower
superior vena cava|Vena cava superior|Vena cava superior|venous|trunk
inferior vena cava|Vena cava inferior|Vena cava inferior|venous|trunk
brachiocephalic vein|Vena braquiocefálica|Vena brachiocephalica|venous|trunk
internal jugular vein|Vena yugular interna|Vena jugularis interna|venous|head-neck
external jugular vein|Vena yugular externa|Vena jugularis externa|venous|head-neck
subclavian vein|Vena subclavia|Vena subclavia|venous|upper
axillary vein|Vena axilar|Vena axillaris|venous|upper
medial brachial vein|Vena braquial medial|Vena brachialis medialis|venous|upper
cephalic vein|Vena cefálica|Vena cephalica|venous|upper
basilic vein|Vena basílica|Vena basilica|venous|upper
radial vein|Vena radial|Vena radialis|venous|upper
ulnar vein|Vena cubital|Vena ulnaris|venous|upper
median antebrachial vein|Vena mediana del antebrazo|Vena mediana antebrachii|venous|upper
azygos vein|Vena ácigos|Vena azygos|venous|trunk
hemiazygos vein|Vena hemiácigos|Vena hemiazygos|venous|trunk
accessory hemiazygos vein|Vena hemiácigos accesoria|Vena hemiazygos accessoria|venous|trunk
right hepatic vein|Vena hepática derecha|Vena hepatica dextra|venous|trunk
middle hepatic vein|Vena hepática media|Vena hepatica intermedia|venous|trunk
left hepatic vein|Vena hepática izquierda|Vena hepatica sinistra|venous|trunk
hepatic portal vein|Vena porta hepática|Vena portae hepatis|venous|trunk
splenic vein|Vena esplénica|Vena splenica|venous|trunk
superior mesenteric vein|Vena mesentérica superior|Vena mesenterica superior|venous|trunk
inferior mesenteric vein|Vena mesentérica inferior|Vena mesenterica inferior|venous|trunk
renal vein|Vena renal|Vena renalis|venous|trunk
common iliac vein|Vena ilíaca común|Vena iliaca communis|venous|trunk
internal iliac vein|Vena ilíaca interna|Vena iliaca interna|venous|trunk
external iliac vein|Vena ilíaca externa|Vena iliaca externa|venous|lower
femoral vein|Vena femoral|Vena femoralis|venous|lower
deep femoral vein|Vena femoral profunda|Vena profunda femoris|venous|lower
popliteal vein|Vena poplítea|Vena poplitea|venous|lower
great saphenous vein|Vena safena magna|Vena saphena magna|venous|lower
small saphenous vein|Vena safena menor|Vena saphena parva|venous|lower
anterior tibial vein|Vena tibial anterior|Vena tibialis anterior|venous|lower
posterior tibial vein|Vena tibial posterior|Vena tibialis posterior|venous|lower
superior pulmonary vein|Vena pulmonar superior|Vena pulmonalis superior|venous|trunk
inferior pulmonary vein|Vena pulmonar inferior|Vena pulmonalis inferior|venous|trunk
trunk of right coronary artery|Tronco de la coronaria derecha|Truncus arteriae coronariae dextrae|arterial|coronary
trunk of left coronary artery|Tronco de la coronaria izquierda|Truncus arteriae coronariae sinistrae|arterial|coronary
trunk of anterior interventricular branch of left coronary artery|Tronco de la interventricular anterior|Ramus interventricularis anterior|arterial|coronary
circumflex branch of left coronary artery|Rama circunfleja de la coronaria izquierda|Ramus circumflexus|arterial|coronary
coronary sinus|Seno coronario|Sinus coronarius|venous|coronary
great cardiac vein|Vena cardíaca magna|Vena cardiaca magna|venous|coronary
wall of right atrium|Pared de la aurícula derecha|Paries atrii dextri|heart|heart
wall of left atrium|Pared de la aurícula izquierda|Paries atrii sinistri|heart|heart
wall of ventricle|Pared ventricular disponible|Paries ventriculi|heart|heart
cavity of right atrium|Cavidad de la aurícula derecha|Cavitas atrii dextri|heart|heart
cavity of left atrium|Cavidad de la aurícula izquierda|Cavitas atrii sinistri|heart|heart
cavity of right ventricle|Cavidad del ventrículo derecho|Cavitas ventriculi dextri|heart|heart
cavity of left ventricle|Cavidad del ventrículo izquierdo|Cavitas ventriculi sinistri|heart|heart
anterior leaflet of tricuspid valve|Valva anterior de la tricúspide|Cuspis anterior valvae atrioventricularis dextrae|heart|tricuspid
posterior leaflet of tricuspid valve|Valva posterior de la tricúspide|Cuspis posterior valvae atrioventricularis dextrae|heart|tricuspid
septal leaflet of tricuspid valve|Valva septal de la tricúspide|Cuspis septalis valvae atrioventricularis dextrae|heart|tricuspid
anterior leaflet of mitral valve|Valva anterior de la mitral|Cuspis anterior valvae atrioventricularis sinistrae|heart|mitral
posterior leaflet of mitral valve|Valva posterior de la mitral|Cuspis posterior valvae atrioventricularis sinistrae|heart|mitral
left anterior cusp of pulmonary valve|Valva anterior izquierda de la pulmonar (fuente)|Valvula semilunaris|heart|pulmonary-valve
right anterior cusp of pulmonary valve|Valva anterior derecha de la pulmonar (fuente)|Valvula semilunaris|heart|pulmonary-valve
posterior cusp of pulmonary valve|Valva posterior de la pulmonar (fuente)|Valvula semilunaris|heart|pulmonary-valve
right posterior cusp of aortic valve|Valva posterior derecha de la aórtica (fuente)|Valvula semilunaris|heart|aortic-valve
anterior cusp of aortic valve|Valva anterior de la aórtica (fuente)|Valvula semilunaris|heart|aortic-valve
left posterior cusp of aortic valve|Valva posterior izquierda de la aórtica (fuente)|Valvula semilunaris|heart|aortic-valve
'''
units=[];approved=[];seen={}
for line in SPEC.strip().splitlines():
 en,es,latin,category,region=line.split('|'); family=en.replace(' ','-')
 bilateral=all(side+' '+en in by_name for side in ['right','left'])
 concepts=[(by_name[side+' '+en],side) for side in ['right','left']] if bilateral else [(by_name.get(en),'right' if en.startswith('right ') or 'right coronary' in en else 'left' if en.startswith('left ') or 'left coronary' in en else 'midline')]
 for cid,side in concepts:
  if en.startswith(('wall of right ','cavity of right ')):side='right'
  if en.startswith(('wall of left ','cavity of left ')):side='left'
  label=es+(' '+('derecha' if side=='right' else 'izquierda') if bilateral else '')
  regional=region+'-'+side if region in ['upper','lower'] else 'trunk' if region=='coronary' else region
  module='cardio:heart' if category=='heart' or region=='coronary' else 'cardio:'+regional
  kind='component' if category=='heart' or 'aorta' in en or en.startswith('trunk of ') or region=='coronary' and 'branch' in en else 'structure'
  parent='cardio:heart' if category=='heart' else 'cardio:aorta' if 'aorta' in en else 'cardio:'+category+':'+regional
  if category=='heart' and region not in ['heart']:parent='cardio:'+region
  u=dict(id='bp3d:'+cid if cid else 'pending:'+family,name=label,latin=latin,english=names[cid]['en'] if cid else en,sourceId=cid,source='BodyParts3D 4.0 OBJ99 / DBCLS',category=category,entityType='espacio cardíaco' if en.startswith('cavity ') else 'pared cardíaca' if en.startswith('wall ') else 'valva' if category=='heart' else 'segmento arterial' if 'aorta' in en or en.startswith('trunk of ') else 'rama coronaria' if region=='coronary' and 'branch' in en else 'arteria' if category=='arterial' else 'vena',side=side,parent=parent,region='heart' if category=='heart' else regional,moduleId=module,family=family,kind=kind,elements=by_concept[cid] if cid else [],decision='APROBADO' if cid else 'APLAZADO',reason='Concepto explícito y elementos identificados en ISA; pertenencia editorial curada. Verificación de cabeceras y geometría obligatoria.' if cid else 'No se identifica un tronco inequívoco en los metadatos ISA 4.0; no se sustituyen ramas PART-OF por el vaso completo.')
  units.append(u)
  for fj in u['elements']:
   assert fj not in seen,(fj,seen.get(fj),cid)
   seen[fj]=cid
   approved.append(dict(elementId=fj,structureId=u['id'],sourceId=cid,name=label,side=side,moduleId=module,family=family,kind=kind,entityType=u['entityType'],decision='APROBADO',sourceConceptCandidates=by_element[fj],archiveEntry=entries[fj]))
units.extend([
 dict(name='Septo interventricular independiente',decision='APLAZADO',reason='Sin identidad geométrica separada inequívoca; no se corta la pared ventricular.'),
 dict(name='Aorta descendente FMA3784 / FJ3427',sourceId='FMA3784',elements=['FJ3427'],decision='DESCARTADO',reason='Representación alternativa descendente: extensión vertical 0.946779–1.28191 m, solapada con los segmentos torácico/abdominal integrados. No añadir doble representación. Inspección selectiva de cabecera y bounds; SHA-256 386a80f191338beee23e83c33800ba17d4990123b41c648b9919764578505f7a.'),
 dict(name='Ramas vasculares secundarias y microvasculatura',decision='APLAZADO',reason='Fuera de esta selección macroscópica acotada; no se procesó todo el archivo.'),
])
result=dict(source='BodyParts3D 4.0 OBJ99 / DBCLS',transform='(x,y,z) -> (x,z,-y)/1000',units=units,approved=approved,modules=[dict(id=m,filename=m.split(':')[1]+'.glb') for m in sorted({r['moduleId'] for r in approved})],semantics='Explicit curated display hierarchy; ISA set membership is provenance, never converted to PART-OF. One named vessel can own several original meshes. Cardiac cavities are spaces, not myocardium.')
(ROOT/'research/anatomy/cardiovascular-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(dict(units=sum(u['decision']=='APROBADO' for u in units),meshes=len(approved),modules=len(result['modules']),pending=sum(u['decision']=='APLAZADO' for u in units),compressedBytes=sum(r['archiveEntry']['compressedBytes'] for r in approved)),indent=2))
