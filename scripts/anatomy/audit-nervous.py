#!/usr/bin/env python3
"""Scoped BP3D 4.0 selection. Explicit concepts, not inferred IS-A -> PART-OF."""
import csv,json,hashlib,io,zipfile,struct
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with zipfile.ZipFile(ROOT/'research/anatomy/torso-metadata.zip') as z:
 def read(name):return z.read(next(n for n in z.namelist() if n==name or n.endswith('/'+name)))
 rows=list(csv.DictReader(io.StringIO(read('isa_element_parts.txt').decode()),delimiter='\t'))
 names={r['concept id']:r for r in csv.DictReader(io.StringIO(read('isa_parts_list_e.txt').decode()),delimiter='\t')}
 data=read('isa_BP3D_4.0_obj_99.central-directory.bin')
assert hashlib.sha256(data).hexdigest()=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
directory={};offset=0
while offset<len(data):
 h=struct.unpack_from('<4s6H3L5H2L',data,offset);assert h[0]==b'PK\x01\x02'
 filename=data[offset+46:offset+46+h[10]].decode()
 directory[Path(filename).stem]=dict(path=filename,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4])
 offset+=46+h[10]+h[11]+h[12]
# FMA family : Spanish, Latin, scope, curated anatomical parent.
families={
'FMA61898':('Giro angular','Gyrus angularis','component','cerebrum'),
'FMA62434':('Giro del cíngulo','Gyrus cinguli','component','cerebrum'),
'FMA61860':('Giro frontal inferior','Gyrus frontalis inferior','component','cerebrum'),
'FMA61907':('Giro temporal inferior','Gyrus temporalis inferior','component','cerebrum'),
'FMA67329':('Ínsula','Insula','component','cerebrum'),
'FMA61950':('Cápsula interna','Capsula interna','component','cerebrum'),
'FMA241998':('Sustancia blanca cerebral','Substantia alba cerebri','component','cerebrum'),
'FMA62493':('Hipocampo','Hippocampus','component','cerebrum'),
'FMA62008':('Hipotálamo','Hypothalamus','component','diencephalon'),
'FMA62032':('Habénula','Habenula','component','diencephalon'),
'FMA62327':('Túber cinéreo','Tuber cinereum','component','diencephalon'),
'FMA62404':('Colículo inferior','Colliculus inferior','component','brainstem'),
'FMA62403':('Colículo superior','Colliculus superior','component','brainstem'),
'FMA62004':('Bulbo raquídeo','Medulla oblongata','structure','brainstem'),
'FMA61993':('Mesencéfalo','Mesencephalon','structure','brainstem'),
'FMA67943':('Puente','Pons','structure','brainstem'),
'FMA67944':('Cerebelo','Cerebellum','structure','brain'),
'FMA61908':('Giro fusiforme','Gyrus fusiformis','component','cerebrum'),
'FMA61918':('Giro parahipocampal','Gyrus parahippocampalis','component','cerebrum'),
'FMA61859':('Giro frontal medio','Gyrus frontalis medius','component','cerebrum'),
'FMA61906':('Giro temporal medio','Gyrus temporalis medius','component','cerebrum'),
'FMA67325':('Lóbulo occipital','Lobus occipitalis','component','cerebrum'),
'FMA61896':('Giro poscentral','Gyrus postcentralis','component','cerebrum'),
'FMA61894':('Giro precentral','Gyrus precentralis','component','cerebrum'),
'FMA61857':('Giro frontal superior','Gyrus frontalis superior','component','cerebrum'),
'FMA61899':('Lobulillo parietal superior','Lobulus parietalis superior','component','cerebrum'),
'FMA61897':('Giro supramarginal','Gyrus supramarginalis','component','cerebrum'),
'FMA50875':('Nervio óptico derecho','Nervus opticus dexter','structure','optic'),
'FMA50878':('Nervio óptico izquierdo','Nervus opticus sinister','structure','optic'),
'FMA50881':('Nervio troclear derecho','Nervus trochlearis dexter','structure','cranial'),
'FMA50882':('Nervio troclear izquierdo','Nervus trochlearis sinister','structure','cranial'),
'FMA52573':('Rama inferior del nervio oculomotor','Ramus inferior nervi oculomotorii','component','cranial'),
'FMA52572':('Rama superior del nervio oculomotor','Ramus superior nervi oculomotorii','component','cranial'),
'FMA52621':('Nervio oftálmico','Nervus ophthalmicus','structure','cranial'),
'FMA52638':('Nervio frontal','Nervus frontalis','structure','cranial'),
'FMA52628':('Nervio lagrimal','Nervus lacrimalis','structure','cranial'),
'FMA52668':('Nervio nasociliar','Nervus nasociliaris','structure','cranial'),
'FMA52655':('Nervio supraorbitario','Nervus supraorbitalis','structure','cranial'),
'FMA52642':('Nervio supratroclear','Nervus supratrochlearis','structure','cranial'),
'FMA52675':('Nervio etmoidal anterior','Nervus ethmoidalis anterior','structure','cranial'),
'FMA52714':('Nervio etmoidal posterior','Nervus ethmoidalis posterior','structure','cranial'),
'FMA52693':('Nervio infratroclear','Nervus infratrochlearis','structure','cranial'),
'FMA52691':('Nervio ciliar largo','Nervus ciliaris longus','structure','cranial'),
'FMA52672':('Rama comunicante nasociliar con el ganglio ciliar','Ramus communicans cum ganglio ciliari','component','cranial'),
'FMA53549':('Ganglio ciliar derecho','Ganglion ciliare dextrum','structure','cranial'),
'FMA53550':('Ganglio ciliar izquierdo','Ganglion ciliare sinistrum','structure','cranial'),
}
counts={f:sum(r['concept id']==f for r in rows) for f in names}
approved=[]
for family,(es,latin,kind,parent) in families.items():
 for r in [r for r in rows if r['concept id']==family]:
  fj=r['element file id']
  choices=[x for x in rows if x['element file id']==fj and ('left' in x['name'] or 'right' in x['name'])]
  leaf=min(choices,key=lambda x:counts[x['concept id']]) if choices else r
  fma=leaf['concept id'];en=leaf['name'];side='left' if 'left' in en else 'right' if 'right' in en else 'midline'
  explicit=family in ['FMA50875','FMA50878','FMA50881','FMA50882','FMA53549','FMA53550']
  title=es if explicit or side=='midline' else es+(' · izquierdo' if side=='left' else ' · derecho')
  approved.append(dict(elementId=fj,sourceId=fma,representationId=names[fma]['representation id'],name=title,latin=latin,en=en,
   side=side,family=family,kind=kind,entityType='componente encefálico' if parent not in ['cranial','optic'] else 'ganglio' if 'Ganglio' in es else 'rama nerviosa' if kind=='component' else 'nervio',
   parent=parent,moduleId='nervous:cranial' if parent=='cranial' else 'nervous:cns',structureId='bp3d:'+fma,
   decision='APROBADO',reason='Identidad explícita en metadatos 4.0; geometría y cabecera se verificarán sin ajuste espacial.',archiveEntry=directory[fj]))
assert len({r['elementId'] for r in approved})==len(approved)
excluded=[dict(elementId=fj,decision='DESCARTADO',reason='Espacio ventricular o conducto: no sustituye tejido nervioso.') for fj in ['FJ1730','FJ1731','FJ1738','FJ1767','FJ1814','FJ1737']]
excluded.append(dict(elementId='FJ1795',decision='APLAZADO',reason='Glándula pineal: se conserva fuera del alcance nervioso de esta entrega.'))
prior=json.loads((ROOT/'docs/phase4/preaudit.json').read_text(encoding='utf-8'))
pending=[dict(name=r['name'],decision='APLAZADO',reason='No existe geometría 4.0 inequívoca en la investigación conservada.') for r in prior['rows'][8:] if r['name'] not in ['II Óptico','III Oculomotor','IV Troclear','V Trigémino']]
pending += [dict(name='Médula espinal / FJ4426 / HRA',decision='APLAZADO',reason='FJ4426 no resuelve identidad primaria y marco 4.3; HRA carece de correspondencias vertebrales verificadas con BP3D. No se fuerza registro.'),dict(name='III y V completos',decision='APLAZADO',reason='Sólo ramas orbitarias aprobadas; no se reconstruyen los troncos ausentes.')]
result=dict(source='BodyParts3D 4.0 OBJ99 / DBCLS',transform='(x,y,z) -> (x,z,-y)/1000',approved=approved,excluded=excluded,pending=pending,
 modules=[dict(id='nervous:cns',filename='cns.glb'),dict(id='nervous:cranial',filename='cranial.glb')])
(ROOT/'research/anatomy/nervous-selection.json').write_bytes((json.dumps(result,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
print(json.dumps(dict(approvedMeshes=len(approved),units=len({r['structureId'] for r in approved}),families=len(families),excluded=len(excluded),pending=len(pending))))
