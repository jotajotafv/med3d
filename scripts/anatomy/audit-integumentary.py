#!/usr/bin/env python3
"""Bounded metadata-only integumentary audit. Does not extract any geometry."""
from pathlib import Path
import csv,io,json,re,struct,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2]
research=ROOT/'research/anatomy'
pattern=re.compile(r'skin|integument|epidermis|dermis|subcutaneous|adipose|nail|hair|superficial fascia',re.I)
with zipfile.ZipFile(research/'torso-metadata.zip') as z:
 raw={name:z.read(name) for name in z.namelist()}
 cd=raw['isa_BP3D_4.0_obj_99.central-directory.bin']
 assert hashlib.sha256(cd).hexdigest()=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
 tables={k:list(csv.DictReader(io.StringIO(v.decode()),delimiter='\t')) for k,v in raw.items() if k.endswith('.txt')}
offset=0;directory={}
while offset<len(cd):
 h=struct.unpack_from('<4s6H3L5H2L',cd,offset);name=cd[offset+46:offset+46+h[10]].decode()
 directory[Path(name).stem]=dict(path=name,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4]);offset+=46+h[10]+h[11]+h[12]
rows=[]
for prefix in ['isa','partof']:
 for row in tables[prefix+'_parts_list_e.txt']:
  if not pattern.search(row['en']):continue
  ids=sorted({b['element file id'] for b in tables[prefix+'_element_parts.txt'] if b['concept id']==row['concept id']})
  rows.append(dict(table=prefix,**row,elementIds=ids))
skin=next(r for r in rows if r['table']=='isa' and r['concept id']=='FMA7163');assert skin['elementIds']==['FJ2810']
with zipfile.ZipFile(research/'respiratory-metadata.zip') as z:
 metadata43=z.read('FMA2Obj43.txt').decode();matches43=[l for l in metadata43.splitlines() if any(cid in l.split('\t') for cid in {r['concept id'] for r in rows})]
approved=[dict(id='integ:FMA7163',name='Piel · superficie corporal',latin='Cutis',english='skin',sourceId='FMA7163',elementId='FJ2810',sourceVersion='4.0',representationId=skin['representation id'],systemId='integumentary',entityType='superficie corporal externa',side='midline',region='cuerpo completo',parent='integumentary',moduleId='integumentary:skin',file='FJ2810.obj',decision='APROBADO',reason='Identidad explícita y una única pieza nativa del mismo marco corporal. Aprobación de extracción; integración condicionada a verificar cabecera, conservación y envoltura.',archiveEntry=directory['FJ2810'])]
other=[]
for r in rows:
 if r['concept id']=='FMA7163':continue
 other.append(dict(name=r['en'],latin=None,sourceId=r['concept id'],elementIds=r['elementIds'],source='BodyParts3D 4.0',type='concepto fuente; no se equipara una clasificación a capa histológica',region='según concepto fuente',side='sin asignación nueva',parent=None,file=[fid+'.obj' for fid in r['elementIds']],decision='DESCARTADO',reason='Agregado que reutiliza piel/pelo: no duplicar mallas.' if r['concept id'] in ['FMA72979','FMA74657','FMA70593','FMA71012','FMA53667','FMA54250'] else 'Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología.'))
pending=[dict(name=n,latin=lat,sourceId=None,elementIds=[],source='BodyParts3D 4.0/4.3: metadatos disponibles',type=typ,region='cuerpo',side='no aplica',parent='integumentary',file=None,decision='APLAZADO',reason=reason) for n,lat,typ,reason in [
 ('Tejido subcutáneo','Tela subcutanea','tejido','No se identifica una capa subcutánea corporal independiente y fiable. No se infla la piel.'),
 ('Epidermis y dermis separadas',None,'capas histológicas','El agregado subdivision of epidermis sólo indexa anexos; no equivale a dos capas geométricas de piel.'),
 ('Uñas', 'Ungues','anexos','Sin identidad nominal de uña en las tablas de nombres examinadas; no se fabrica geometría.'),
 ('Regiones cutáneas separadas',None,'regiones','FMA7163 corresponde a FJ2810, una única pieza. Se conserva; no se recorta para fabricar identidades regionales.')]]
data=dict(schemaVersion=1,baseCommit='5839a7423cd1b0dfab4f79837661147f71b6aab8',phase=9,source='DBCLS BodyParts3D 4.0 OBJ99',sourceArchive='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip',frame='bodyparts3d-4.0-male',transform='(x,y,z) -> (x,z,-y)/1000',geometryExtractedDuringAudit=False,approved=approved,other=other,pending=pending,discovery=dict(pattern=pattern.pattern,rows40=rows,mappingRows43=matches43,scope43='Identity mapping only: FMA2Obj43 has no anatomical names. No unverified claim of complete 4.3 absence.'),alternatives=[dict(source='Existing HRA VH_M_Skin.glb',decision='DESCARTADO',reason='Visible Human frame differs from BP3D; existing presentation asset is not registered to this atlas. Native BP3D skin has priority.'),dict(source='Z-Anatomy',decision='APLAZADO',reason='Existing Phase 4 registration is regional/per-nerve, not a body-envelope validation. Not extracted while native skin is available.')],counts=dict(approved=1,discardedMetadataRows=len(other),pending=4))
(research/'integumentary-selection.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(dict(counts=data['counts'],skin=approved[0],mappingRows43=matches43,selectionSha256=hashlib.sha256((research/'integumentary-selection.json').read_bytes()).hexdigest()),ensure_ascii=False,indent=2))
