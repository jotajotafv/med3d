#!/usr/bin/env python3
"""Bounded BP3D ocular audit, using existing nominal and PART-OF metadata only."""
from pathlib import Path
import csv,io,json,struct,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2];research=ROOT/'research/anatomy'
with zipfile.ZipFile(research/'torso-metadata.zip') as z:
 tables={n:list(csv.DictReader(io.StringIO(z.read(n).decode()),delimiter='\t')) for n in z.namelist() if n.endswith('.txt')};cd=z.read('isa_BP3D_4.0_obj_99.central-directory.bin')
assert hashlib.sha256(cd).hexdigest()=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
offset=0;directory={}
while offset<len(cd):
 h=struct.unpack_from('<4s6H3L5H2L',cd,offset);name=cd[offset+46:offset+46+h[10]].decode();directory[Path(name).stem]=dict(path=name,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4]);offset+=46+h[10]+h[11]+h[12]
approved=[];parents=[]
for side,es,lat,pid in [('right','derecho','dexter','FMA12514'),('left','izquierdo','sinister','FMA12515')]:
 parent=next(row for row in tables['partof_parts_list_e.txt'] if row['concept id']==pid)
 parentElements=sorted({row['element file id'] for row in tables['partof_element_parts.txt'] if row['concept id']==pid})
 parents.append(dict(id='ocular:'+pid,sourceId=pid,name='Ojo '+es+' · cobertura parcial',latin='Bulbus oculi '+lat,side=side,sourceName=parent['en'],sourceRepresentation=parent['representation id'],sourceElements=parentElements,decision='APROBADO',reason='Agrupación de globo ocular con componentes nominales; no se afirma un ojo completo.'))
 ids=['FMA58239','FMA58271','FMA58236'] if side=='right' else ['FMA58240','FMA58272','FMA58237']
 for fid,family,name,latin in zip(ids,['cornea','sclera','iris'],['Córnea','Esclerótica','Iris'],['Cornea','Sclera','Iris']):
  row=next(row for row in tables['isa_parts_list_e.txt'] if row['concept id']==fid)
  elements=sorted({row['element file id'] for row in tables['isa_element_parts.txt'] if row['concept id']==fid});assert len(elements)==1 and elements[0] in parentElements
  partof=sorted({row['element file id'] for row in tables['partof_element_parts.txt'] if row['concept id']==fid});assert elements==partof
  approved.append(dict(id='ocular:'+fid,name=name+' '+('derecha' if side=='right' else 'izquierda') if family!='iris' else name+' '+es,latin=latin,sourceId=fid,elementId=elements[0],representationId=row['representation id'],sourceVersion='4.0',sourceName=row['en'],side=side,family=family,parentId='ocular:'+pid,region='órbita '+es,systemId='nervous',moduleId='nervous:ocular',entityType='componente del globo ocular',decision='APROBADO',reason='Identidad nominal bilateral y pertenencia PART-OF al globo ocular verificadas; registro nativo sujeto a conservación geométrica.',archiveEntry=directory[elements[0]]))
pending=[dict(name=n,decision='APLAZADO',reason=reason) for n,reason in [('Retina y componentes internos del globo','No son necesarios para resolver la identificación superficial; ampliación ocular completa fuera del alcance.'),('Musculatura extraocular y otros anexos','No se duplica la región con una expansión orbital completa.'),('Modelo ocular HRA independiente','No hay un explorador ocular registrado en el proyecto; los modelos existentes son corazón, pulmones, encéfalo y piel de presentación.')]]
data=dict(schemaVersion=1,baseCommit='bd4756ff6c0a84427e2c0326c4e89815e690a5f1',source='DBCLS BodyParts3D 4.0 OBJ99',sourceArchive='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip',frame='bodyparts3d-4.0-male',transform='(x,y,z) -> (x,z,-y)/1000',geometryExtractedDuringAudit=False,parents=parents,approved=approved,pending=pending,counts=dict(anatomicalUnits=2,approvedSourceComponents=6,pendingGroups=3),scope='Ocular coverage grouped editorially with sensory pathways in nervous system; no twelfth system. No inference from IS-A to PART-OF.')
p=research/'ocular-selection.json';p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n');print(json.dumps(dict(counts=data['counts'],selectionSha256=hashlib.sha256(p.read_bytes()).hexdigest(),components=[(a['sourceId'],a['elementId']) for a in approved])))
