#!/usr/bin/env python3
"""Scoped digestive selection. Curated PART-OF parents; no automatic IS-A conversion."""
from pathlib import Path
import csv,io,json,zipfile,struct,hashlib,collections
ROOT=Path(__file__).resolve().parents[2]
with zipfile.ZipFile(ROOT/'research/anatomy/torso-metadata.zip') as z:
 def read(n):return z.read(n)
 names={r['concept id']:r['en'] for r in csv.DictReader(io.StringIO(read('isa_parts_list_e.txt').decode()),delimiter='\t')}
 elements=collections.defaultdict(list);inverse=collections.defaultdict(list)
 for r in csv.DictReader(io.StringIO(read('isa_element_parts.txt').decode()),delimiter='\t'):
  elements[r['concept id']].append(r['element file id']);inverse[r['element file id']].append(r['concept id'])
 partof=collections.defaultdict(list)
 for r in csv.DictReader(io.StringIO(read('partof_element_parts.txt').decode()),delimiter='\t'):partof[r['concept id']].append(r['element file id'])
 directory=read('isa_BP3D_4.0_obj_99.central-directory.bin')
assert hashlib.sha256(directory).hexdigest()=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
entries={};offset=0
while offset<len(directory):
 h=struct.unpack_from('<4s6H3L5H2L',directory,offset);assert h[0]==b'PK\x01\x02'
 name=directory[offset+46:offset+46+h[10]].decode()
 entries[Path(name).stem]=dict(path=name,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4]);offset+=46+h[10]+h[11]+h[12]
units=[]
def add(cid,name,latin,category,parent,module,kind='structure',entity='órgano',side='midline',fjs=None,note='Identidad explícita de la fuente; posición y geometría originales conservadas.'):
 cid='FMA'+str(cid);fjs=fjs or elements[cid];assert fjs,(cid,name)
 units.append(dict(id='dig:'+cid,sourceId=cid,name=name,latin=latin,english=names.get(cid,name),category=category,region={'upper':'cabeza, cuello y tórax','stomach-accessory':'abdomen superior','small-intestine':'abdomen','large-intestine':'abdomen y pelvis'}[module],side=side,parent=parent,kind=kind,entityType=entity,elements=fjs,sourceVersion='4.0',moduleId='digestive:'+module,decision='APROBADO',reason=note))
add(7131,'Esófago','Oesophagus','esophagus','dig:upper','upper')
add(54640,'Lengua · estructura oral','Lingua','tongue','dig:oral','upper',entity='estructura oral muscular',note='FJ2761 no existe en Muscular ni otro catálogo histórico. Una sola representación oral, sin crear músculos nuevos ni duplicar geometría; no equivale a una cavidad oral completa.')
for cid,name,latin,side in [(59802,'Glándula submandibular derecha','Glandula submandibularis dextra','right'),(59803,'Glándula submandibular izquierda','Glandula submandibularis sinistra','left'),(59804,'Glándula sublingual derecha','Glandula sublingualis dextra','right'),(59805,'Glándula sublingual izquierda','Glandula sublingualis sinistra','left')]:add(cid,name,latin,'salivary','dig:salivary','upper',entity='glándula',side=side)
add(7148,'Estómago','Gaster','stomach','digestive','stomach-accessory')
add(7206,'Duodeno','Duodenum','duodenum','dig:small','small-intestine',entity='segmento intestinal')
for cid,name,latin,parent,family in [(16981,'Porción proximal del yeyuno','Pars proximalis jejuni','dig:FMA7207','jejunum'),(16982,'Porción media del yeyuno','Pars media jejuni','dig:FMA7207','jejunum'),(16983,'Porción distal del yeyuno','Pars distalis jejuni','dig:FMA7207','jejunum'),(14964,'Porción proximal del íleon','Pars proximalis ilei','dig:FMA7208','ileum'),(14965,'Porción media del íleon','Pars media ilei','dig:FMA7208','ileum'),(14966,'Porción distal del íleon','Pars distalis ilei','dig:FMA7208','ileum')]:
 add(cid,name,latin,family,parent,'small-intestine',kind='component',entity='porción intestinal',note='Varias piezas originales bajo una porción fuente; cada asa no se convierte en órgano. PART-OF confirma pertenencia al yeyuno o íleon.')
add(11338,'Unión ileocecal','Junctio ileocaecalis','ileocecal','dig:small','small-intestine',kind='component',entity='unión anatómica',fjs=['FJ2599'],note='Cabecera OBJ 4.0 FMA11338: Ileocecal junction. La tabla PART-OF lo incluye tanto en ciego como en íleon; no se presenta como ciego completo. La lista 4.3 lo reclasifica como íleon distal, sin sustituir la identidad nativa utilizada.')
for cid,name,latin,family,parent in [(14542,'Apéndice vermiforme','Appendix vermiformis','appendix','dig:large'),(14545,'Colon ascendente','Colon ascendens','colon','dig:colon'),(14546,'Colon transverso','Colon transversum','colon','dig:colon'),(14547,'Colon descendente','Colon descendens','colon','dig:colon'),(14544,'Recto','Rectum','rectum','dig:large')]:add(cid,name,latin,family,parent,'large-intestine',entity='segmento intestinal' if family!='appendix' else 'órgano')
liver=['FJ2816',*['FJ'+str(v) for v in range(2818,2825)]]
assert set(liver)<=set(partof['FMA7197'])
add(7197,'Hígado','Hepar','liver','dig:accessory','stomach-accessory',fjs=liver,note='Ocho piezas de parénquima agrupadas como hígado por PART-OF. No se exponen segmentos hepáticos: FJ2823/FJ2824 comparten FMA15746 en los OBJ, pero la tabla 4.3 llama VII a FJ2823; la descarga 4.3 conserva la contradicción. Se preservan identidades nativas por archivo, sin inventar segmentación ni incluir FJ2409 superpuesto.')
add(7202,'Vesícula biliar','Vesica biliaris','gallbladder','dig:accessory','stomach-accessory')
add(7198,'Páncreas','Pancreas','pancreas','dig:accessory','stomach-accessory',fjs=['FJ1895'],note='Única envolvente pancreática. FJ2629 representa el mismo parénquima con bounds casi idénticos y se descarta para evitar superposición; sin subdivisiones artificiales.')
add(10419,'Conducto pancreático disponible','Ductus pancreaticus','pancreatic-duct','dig:ducts','stomach-accessory',entity='conducto',fjs=['FJ1896'],note='Conducto de la misma revisión que FJ1895; FJ2630 es una representación alternativa del árbol, no se superpone.')
for cid,name,latin,side in [(14539,'Conducto cístico','Ductus cysticus','midline'),(14668,'Conducto hepático común','Ductus hepaticus communis','midline'),(14669,'Conducto hepático derecho','Ductus hepaticus dexter','right'),(14670,'Conducto hepático izquierdo','Ductus hepaticus sinister','left')]:add(cid,name,latin,'biliary','dig:biliary','stomach-accessory',entity='conducto',side=side)
for cid,name,latin,side in [(71867,'Tributaria anterosuperior biliar derecha','Ramus anterosuperior dexter','right'),(71868,'Tributaria anteroinferior biliar derecha','Ramus anteroinferior dexter','right'),(71869,'Tributaria posterosuperior biliar derecha','Ramus posterosuperior dexter','right'),(71870,'Tributaria posteroinferior biliar derecha','Ramus posteroinferior dexter','right'),(71885,'Tributaria medial superior biliar izquierda','Ramus medialis superior sinister','left'),(71886,'Tributaria medial inferior biliar izquierda','Ramus medialis inferior sinister','left'),(71887,'Tributaria lateral superior biliar izquierda','Ramus lateralis superior sinister','left'),(71888,'Tributaria lateral inferior biliar izquierda','Ramus lateralis inferior sinister','left'),(71889,'Tributaria biliar del lóbulo caudado','Ramus lobi caudati','midline'),(76903,'Conducto izquierdo del lóbulo caudado','Ductus sinister lobi caudati','left')]:add(cid,name,latin,'biliary','dig:biliary','stomach-accessory',kind='component',entity='componente de conducto',side=side)
native_liver=dict(zip(liver,['FMA13365','FMA15739','FMA15741','FMA15742','FMA15743','FMA15744','FMA15746','FMA15746']))
approved=[]
for u in units:
 for fid in u['elements']:
  native=native_liver[fid] if u['sourceId']=='FMA7197' else u['sourceId']
  approved.append(dict(elementId=fid,sourceId=native,unitId=u['id'],ownerSourceId=u['sourceId'],side=u['side'],entityType=u['entityType'],sourceVersion='4.0',archiveEntry=entries[fid],sourceConceptCandidates=sorted(set(inverse[fid]+[native])),identityBasis='Cabecera original + pertenencia PART-OF hepática' if fid in liver else 'Cabecera original + selección FMA/FJ curada'))
assert len(approved)==len({r['elementId'] for r in approved})
historical={mesh.rsplit('_',1)[-1] for p in (ROOT/'public/models/anatomy').glob('*/catalog.json') if p.parent.name!='digestive' for n in json.loads(p.read_text(encoding='utf8'))['nodes'] for mesh in n['meshNames']}
assert not historical&{r['elementId'] for r in approved}
pending=[]
for name,latin,decision,reason,fjs in [
 ('Cavidad oral completa','Cavitas oris','APLAZADO','La cobertura oral aprobada es lengua y cuatro glándulas; no se equipara a una cavidad/mucosa completa.',[]),
 ('Faringe','Pharynx','APLAZADO','4.0/4.3 no proporcionan un órgano faríngeo completo inequívoco; músculos o epiglotis no equivalen a su pared. No se fabrica conexión oral-esófago.',[]),
 ('Parótidas','Glandulae parotideae','APLAZADO','FJ4645/FJ4648 aparecen sin FMA/representación válida y fuera del manifiesto activo 4.3; no se integran por nombre de archivo.', ['FJ4645','FJ4648']),
 ('Ciego completo','Caecum','APLAZADO','La tabla PART-OF apunta sólo a FJ2599, cuya cabecera identifica unión ileocecal. No equivale a ciego separado.', ['FJ2599']),
 ('Colon sigmoide separado','Colon sigmoideum','APLAZADO','No hay identidad/malla independiente aprobada en 4.0/4.3; no se corta el colon descendente ni el recto.',[]),
 ('Canal anal separado','Canalis analis','APLAZADO','Sin geometría independiente fiable seleccionada; no extender el recto artificialmente.',[]),
 ('Regiones gástricas separadas','Partes gastris','APLAZADO','Cardias, fundus, cuerpo, antro y píloro son referencias educativas, no mallas independientes de FJ2564.', ['FJ2564']),
 ('Regiones pancreáticas separadas','Partes pancreatis','APLAZADO','Cabeza, cuello, cuerpo y cola sin cortes fuente inequívocos; no subdividir la envolvente.', ['FJ1895']),
 ('Colédoco separado','Ductus choledochus','APLAZADO','No reinterpretar el conducto hepático común ni construir continuidad biliar ausente.',[]),
 ('Hilio hepático separado','Porta hepatis','APLAZADO','Referencia regional sin geometría independiente; contexto vascular explícito.',[]),
 ('Segmentación hepática I–VIII expuesta','Segmenta hepatis','APLAZADO','Contradicción FMA/etiqueta de FJ2823 entre tabla y descarga oficial también en 4.3; conservar hígado agregado y trazabilidad nativa.', ['FJ2823','FJ2824']),
 ('Glándulas menores y microanatomía','Glandulae salivariae minores','APLAZADO','Fuera del objetivo macroscópico; no se persiguen subdivisiones microscópicas.',[]),
 ('Parénquima pancreático alternativo','Parenchyma pancreatis','DESCARTADO','FJ2629 solapa la envolvente FJ1895; sólo se incorpora esta última.', ['FJ2629']),
 ('Árbol pancreático alternativo','Arbor ductalis pancreatis','DESCARTADO','FJ2630 solapa el conducto aprobado FJ1896; evitar dos representaciones.', ['FJ2630']),
 ('Pieza hepática antigua FJ2409','Parenchyma hepatis','DESCARTADO','Revisión antigua cuyo territorio coincide con FJ2822; además cambia VII/VI entre metadatos. No duplicar.', ['FJ2409']),
 ('Hígado 4.3 como sustituto','Hepar','DESCARTADO','Descarga oficial no resuelve la contradicción VII/VIII; posiciones hepáticas de control iguales. 4.0 conserva cobertura equivalente sin mezclar licencias.', liver),
 ('Bazo','Lien','DESCARTADO','Pertenece a linfático/inmunitario; no iniciar su integración ni duplicarlo en Digestivo.',[]),
 ('Vasos digestivos','Vasa digestoria','DESCARTADO','Reutilizar Cardiovascular mediante relaciones, sin duplicar vasos.',[]),
 ('Nervios autonómicos','Nervi autonomici','DESCARTADO','No añadir ni duplicar nervios; contexto únicamente cuando existan IDs curados.',[]),
 ('Músculos faríngeos y tenias aisladas','Musculi pharyngis et taeniae coli','DESCARTADO','No ampliar Muscular ni fragmentar la pared intestinal en esta fase.', ['FJ2568','FJ2569','FJ2570']),
 ('Mesenterios','Mesenteria','APLAZADO','Identidades disponibles, pero no necesarias para la continuidad visceral prioritaria; se documentan sin añadir láminas oclusivas.', ['FJ3396','FJ3397','FJ3398']),
]:pending.append(dict(name=name,latin=latin,sourceId='',elements=fjs,sourceVersion='4.0/4.3 según candidato',category='auditoría de cobertura',region='digestiva',side='no aplicable',parent='',entityType='candidato no integrado',decision=decision,reason=reason))
result=dict(schemaVersion=1,source='DBCLS BodyParts3D 4.0 OBJ99',hierarchy='Padres curados; PART-OF explícito para hígado y porciones intestinales. IS-A no se convierte en PART-OF.',units=units,pending=pending,approved=approved,modules=[dict(id='digestive:'+k,filename=k+'.glb') for k in ['upper','stomach-accessory','small-intestine','large-intestine']],counts=dict(approvedUnits=len(units),approvedMeshes=len(approved),discarded=sum(p['decision']=='DESCARTADO' for p in pending),deferred=sum(p['decision']=='APLAZADO' for p in pending)))
(ROOT/'research/anatomy/digestive-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(result['counts']))
