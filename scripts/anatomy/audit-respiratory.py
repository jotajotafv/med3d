#!/usr/bin/env python3
"""Scoped respiratory identities. Editorial parents are curated, never inferred from IS-A."""
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
for r in rows:by_concept[r['concept id']].append(r['element file id']);by_element[r['element file id']].append(r['concept id'])
units=[]
def add(cid,name,latin,category,parent,side='midline',elements=None,version='4.0',kind='component',note='Identidad explícita de fuente; geometría original sin modificación anatómica.'):
 elements=elements or by_concept[cid]
 assert elements,(cid,name)
 units.append(dict(id='resp:'+cid,sourceId=cid,name=name,latin=latin,english=names.get(cid,{}).get('en',name),category=category,region='head-neck' if category=='cartilage' else 'thorax',side=side,parent=parent,kind=kind,entityType={'cartilage':'cartílago','trachea':'vía aérea','main-bronchus':'bronquio principal','bronchial-tree':'árbol bronquial segmentario','parenchyma':'parénquima segmentario'}[category],elements=elements,sourceVersion=version,moduleId='respiratory:'+('larynx' if category=='cartilage' else 'lungs' if category=='parenchyma' else 'airway'),decision='APROBADO',reason=note))
for line in '''
9615|Cartílago cricoides|Cartilago cricoidea|midline|2769
55099|Cartílago tiroides|Cartilago thyroidea|midline|2808
55130|Epiglotis|Epiglottis|midline|2770
55113|Cartílago aritenoides derecho|Cartilago arytenoidea dextra|right|2792
55114|Cartílago aritenoides izquierdo|Cartilago arytenoidea sinistra|left|2775
55115|Cartílago corniculado derecho|Cartilago corniculata dextra|right|2793
55116|Cartílago corniculado izquierdo|Cartilago corniculata sinistra|left|2776
55117|Cartílago cuneiforme derecho|Cartilago cuneiformis dextra|right|2795
55118|Cartílago cuneiforme izquierdo|Cartilago cuneiformis sinistra|left|2773
'''.strip().splitlines():
 cid,name,latin,side,fj=line.split('|');add('FMA'+cid,name,latin,'cartilage','resp:larynx',side,['FJ'+fj])
add('FMA7394','Tráquea','Trachea','trachea','resp:lower',kind='structure')
add('FMA68418','Bronquio principal derecho · porción disponible','Bronchus principalis dexter','main-bronchus','resp:bronchi','right',kind='structure',note='La fuente nativa dice right main bronchus proper; FMA7395 se conserva sólo como alias del bronquio principal derecho.')
add('FMA7396','Bronquio principal izquierdo','Bronchus principalis sinister','main-bronchus','resp:bronchi','left',kind='structure')
for line in '''
68211|apical derecho|apicalis dexter|right-upper
68212|anterior derecho|anterior dexter|right-upper
68213|posterior derecho|posterior dexter|right-upper
68214|medial derecho|medialis dexter|right-middle
68215|lateral derecho|lateralis dexter|right-middle
68216|superior derecho|superior dexter|right-lower
68218|basal medial derecho|basalis medialis dexter|right-lower
68321|basal anterior derecho|basalis anterior dexter|right-lower
68220|basal lateral derecho|basalis lateralis dexter|right-lower
68221|basal posterior derecho|basalis posterior dexter|right-lower
68222|anterior izquierdo|anterior sinister|left-upper
68223|apical izquierdo|apicalis sinister|left-upper
68225|posterior izquierdo|posterior sinister|left-upper
68226|lingular superior|lingularis superior|left-upper
68227|lingular inferior|lingularis inferior|left-upper
68228|superior izquierdo|superior sinister|left-lower
68230|basal medial izquierdo|basalis medialis sinister|left-lower
68231|basal anterior izquierdo|basalis anterior sinister|left-lower
68232|basal lateral izquierdo|basalis lateralis sinister|left-lower
68233|basal posterior izquierdo|basalis posterior sinister|left-lower
'''.strip().splitlines():
 cid,name,latin,lobe=line.split('|');add('FMA'+cid,'Árbol bronquial '+name,'Arbor bronchialis '+latin,'bronchial-tree','resp:bronchi:'+lobe,lobe.split('-')[0],note='Árbol segmentario compuesto por ramas fuente; cada FJ es componente geométrico, no un bronquio adicional. Agrupación lobar editorial explícita.')
for line in '''
27368|apicoposterior izquierdo|apicoposterioris sinistri|left-upper|6595,6597
27374|anterior izquierdo|anterioris sinistri|left-upper|6598
27375|lingular superior|lingularis superioris|left-upper|6599
27376|lingular inferior|lingularis inferioris|left-upper|6600
27386|superior izquierdo|superioris sinistri|left-lower|6601
27392|basal anterior izquierdo|basalis anterioris sinistri|left-lower|6602
27390|basal lateral izquierdo|basalis lateralis sinistri|left-lower|6603
27394|basal posterior izquierdo|basalis posterioris sinistri|left-lower|6596
27369|apical derecho|apicalis dextri|right-upper|6604
27371|posterior derecho|posterioris dextri|right-upper|6606
27373|anterior derecho|anterioris dextri|right-upper|6607
27452|lateral derecho|lateralis dextri|right-middle|6608
27448|medial derecho|medialis dextri|right-middle|6609
27385|superior derecho|superioris dextri|right-lower|6610
27391|basal anterior derecho|basalis anterioris dextri|right-lower|6611
27389|basal lateral derecho|basalis lateralis dextri|right-lower|6612
27393|basal posterior derecho|basalis posterioris dextri|right-lower|6605
'''.strip().splitlines():
 cid,name,latin,lobe,fjs=line.split('|');add('FMA'+cid,'Parénquima del segmento '+name,'Parenchyma segmenti bronchopulmonalis '+latin,'parenchyma','resp:lobe:'+lobe,lobe.split('-')[0],['FJ'+v for v in fjs.split(',')],'4.3',note='Parénquima identificado en manifiesto oficial 4.3; agrupación pulmonar/lobar curada sin cortar ni duplicar geometría. FJ6602 y FJ6611 rotulados 7.8 en el archivo fuente conservan su FMA anterior basal, sin inventar una subdivisión medial.')

with zipfile.ZipFile(ROOT/'research/anatomy/respiratory-metadata.zip') as z:
 active43=set(__import__('re').findall(r'FJ\d+',z.read('FMA2Obj43.txt').decode()))
 native43=json.loads(z.read('selected43.json'))
approved=[]
for u in units:
 for fid in u['elements']:
  row=dict(elementId=fid,sourceId=u['sourceId'],unitId=u['id'],side=u['side'],entityType=u['entityType'],sourceVersion=u['sourceVersion'])
  if u['sourceVersion']=='4.0':row.update(archiveEntry=entries[fid],sourceConceptCandidates=by_element[fid])
  else:
   assert fid in active43 and native43[fid]['sourceId']==u['sourceId']
   row.update(sourceConceptCandidates=[u['sourceId']],officialMetadata=native43[fid])
  approved.append(row)
assert len(approved)==len({r['elementId'] for r in approved})==128
pending=[]
for name,latin,decision,reason in [
 ('Cavidad nasal','Cavitas nasi','APLAZADO','Sin espacio/mucosa nasal inequívocos en los paquetes auditados; huesos y cartílagos nasales no equivalen a cavidad.'),
 ('Nasofaringe','Pars nasalis pharyngis','APLAZADO','Sin geometría independiente identificada.'),
 ('Orofaringe','Pars oralis pharyngis','APLAZADO','Sin geometría independiente identificada.'),
 ('Laringofaringe','Pars laryngea pharyngis','APLAZADO','El grupo FMA55053 de 4.0 sólo remite a epiglotis; no representa la región completa.'),
 ('Faringe completa','Pharynx','APLAZADO','No se equiparan músculos faríngeos aislados ni epiglotis con un órgano faríngeo completo.'),
 ('Laringe completa','Larynx','APLAZADO','Se integran sus nueve cartílagos disponibles; mucosa, músculos y pliegues vocales no se afirman completos.'),
 ('Carina independiente','Carina tracheae','APLAZADO','La bifurcación se observa en continuidad de tráquea y principales; no existe una malla carinal aislada aprobada.'),
 ('Bronquios lobares aislados','Bronchi lobares','APLAZADO','Se agrupan árboles segmentarios según lóbulo; no se fabrica un tronco lobar independiente.'),
 ('Pleura visceral','Pleura visceralis','APLAZADO','Sin lámina pleural independiente inequívoca.'),
 ('Pleura parietal','Pleura parietalis','APLAZADO','Sin lámina pleural independiente inequívoca.'),
 ('Hilio y raíz como tejido independiente','Hilum et radix pulmonis','APLAZADO','Región de continuidad explicada en fichas/contexto; no se fabrica una malla adicional.'),
 ('Bronquiolos y alvéolos','Bronchioli et alveoli pulmonis','APLAZADO','Fuera de cobertura macroscópica; sin geometría alveolar aprobada.'),
 ('Diafragma','Diaphragma','APLAZADO','FMA13295/FJ3131 fiable y aún no integrado; se mantiene como relación educativa muscular. Se prioriza el cierre respiratorio y la conservación del catálogo muscular, sin duplicarlo en Respiratorio.'),
 ('Vasos pulmonares','Vasa pulmonalia','DESCARTADO','Ya pertenecen a Cardiovascular; reutilizar sus IDs mediante contexto.'),
 ('Corazón','Cor','DESCARTADO','Ya integrado; sólo contexto mediastínico.'),
 ('Pulmones HRA en atlas corporal','Pulmones','DESCARTADO','Explorador detallado conservado independiente; su marco no se fuerza sobre BP3D.'),
 ('Cricoides alternativo FJ2440','Cartilago cricoidea','DESCARTADO','Misma identidad FMA9615 que FJ2769; elegir la revisión laríngea 120625 y evitar dos representaciones de un cartílago.'),
 ('Tráquea 4.3 FJ6588','Trachea','DESCARTADO','Control espacial de la revisión pulmonar 20140325; no se integra otra tráquea encima de FJ2541.'),
 ('Músculos laríngeos/faríngeos','Musculi laryngis et pharyngis','DESCARTADO','Sin ampliación muscular general en esta fase.'),
]:pending.append(dict(name=name,latin=latin,sourceId='FMA13295' if name=='Diafragma' else '',elements=['FJ3131'] if name=='Diafragma' else [],sourceVersion='4.0/4.3/HRA según candidato',category='auditoría de cobertura',region='cabeza/cuello/tórax',side='no aplicable',parent='',entityType='candidato no integrado',decision=decision,reason=reason))
result=dict(schemaVersion=1,source='DBCLS BodyParts3D 4.0 OBJ99 + 4.3 parénquima pulmonar oficial',hierarchy='Padres anatómicos/editoriales curados; IS-A sólo identifica conceptos. No se convierte IS-A en PART-OF.',units=units,pending=pending,approved=approved,modules=[dict(id='respiratory:'+k,filename=k+'.glb') for k in ['larynx','airway','lungs']],counts=dict(approvedUnits=len(units),approvedMeshes=len(approved),discarded=sum(p['decision']=='DESCARTADO' for p in pending),deferred=sum(p['decision']=='APLAZADO' for p in pending)))
(ROOT/'research/anatomy/respiratory-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(result['counts']))
