#!/usr/bin/env python3
"""Bounded 3F audit using preserved BP3D 4.0 tables, without extracting any OBJ.

Explicit nominal candidates only. APROBADO authorizes extraction; integration is
conditional on matching original headers and source-frame geometric validation.
No IS-A edge is interpreted automatically as PART-OF.
"""
import collections,csv,io,json,re,struct,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
with zipfile.ZipFile(ROOT/'research/anatomy/torso-metadata.zip') as z:
 raw={n:z.read(n) for n in z.namelist()}
def table(n):return list(csv.DictReader(io.StringIO(raw[n].decode()),delimiter='\t'))
parts={r['concept id']:r for r in table('isa_parts_list_e.txt')}
parents={r['child id']:r for r in table('isa_inclusion_relation_list.txt')}
nonterminal={r['parent id'] for r in parents.values()}
bindings=collections.defaultdict(list)
for r in table('isa_element_parts.txt'):bindings[r['concept id']].append(r['element file id'])
def ancestry(cid):
 result=[]
 while cid in parents:
  p=parents[cid];result.append(dict(id=p['parent id'],name=p['parent name']));cid=p['parent id']
 return result
def typ(cid):
 ids={r['id'] for r in ancestry(cid)}|{cid}
 for k,v in [('FMA85453','head of muscle organ'),('FMA10474','zone of muscle organ'),('FMA5022','muscle organ')]:
  if k in ids:return v
 return 'set of organs'
cd=raw['isa_BP3D_4.0_obj_99.central-directory.bin'];directory={};offset=0
while offset<len(cd):
 h=struct.unpack_from('<4s6H3L5H2L',cd,offset);assert h[0]==b'PK\x01\x02'
 p=cd[offset+46:offset+46+h[10]].decode()
 directory[Path(p).stem]=dict(path=p,bytes=h[9],compressedBytes=h[8],crc32=f'{h[7]:08x}',offset=h[16],method=h[4]);offset+=46+h[10]+h[11]+h[12]
# Curated bilateral concept pairs. Parent muscles for heads are editorial IDs;
# their relation follows the explicitly named head, not the IS-A supertype.
PAIRS=[
 ('hand','abductorpollicisbrevis','Abductor corto del pulgar','abductor pollicis brevis',37386,37387,None),
 ('hand','opponenspollicis','Oponente del pulgar','opponens pollicis',37390,37391,None),
 ('hand','abductordigitiminimihand','Abductor del meñique de la mano','abductor digiti minimi manus',37396,37397,None),
 ('hand','flexordigitiminimibrevishand','Flexor corto del meñique de la mano','flexor digiti minimi brevis manus',37398,37399,None),
 ('hand','opponensdigitiminimihand','Oponente del meñique de la mano','opponens digiti minimi manus',37400,37401,None),
 ('hand','adductorpollicis','Aductor del pulgar','adductor pollicis',46121,46122,'oblique'),
 ('hand','adductorpollicis','Aductor del pulgar','adductor pollicis',46123,46124,'transverse'),
 ('foot','abductorhallucis','Abductor del dedo gordo','abductor hallucis',37459,37460,None),
 ('foot','flexordigitorumbrevis','Flexor corto de los dedos del pie','flexor digitorum brevis',37461,37462,None),
 ('foot','abductordigitiminimifoot','Abductor del quinto dedo del pie','abductor digiti minimi pedis',37463,37464,None),
 ('foot','quadratusplantae','Cuadrado plantar','quadratus plantae',37465,37466,None),
 ('foot','flexordigitiminimibrevisfoot','Flexor corto del quinto dedo del pie','flexor digiti minimi brevis pedis',37471,37472,None),
 ('foot','extensorhallucisbrevis','Extensor corto del dedo gordo','extensor hallucis brevis',51144,51145,None),
 ('foot','lumbricalfirstfoot','Primer lumbrical del pie','lumbricalis primus pedis',37717,37718,None),
 ('foot','lumbricalsecondfoot','Segundo lumbrical del pie','lumbricalis secundus pedis',37719,37720,None),
 ('foot','lumbricalthirdfoot','Tercer lumbrical del pie','lumbricalis tertius pedis',37485,37486,None),
 ('foot','lumbricalfourthfoot','Cuarto lumbrical del pie','lumbricalis quartus pedis',37483,37484,None),
 ('foot','plantarinterosseousfirst','Primer interóseo plantar','interosseus plantaris primus',37745,37746,None),
 ('foot','plantarinterosseoussecond','Segundo interóseo plantar','interosseus plantaris secundus',37743,37744,None),
 ('foot','plantarinterosseousthird','Tercer interóseo plantar','interosseus plantaris tertius',37741,37742,None),
 ('foot','flexorhallucisbrevis','Flexor corto del dedo gordo','flexor hallucis brevis',45971,45972,'medial'),
 ('foot','flexorhallucisbrevis','Flexor corto del dedo gordo','flexor hallucis brevis',45973,45974,'lateral'),
 ('foot','adductorhallucis','Aductor del dedo gordo','adductor hallucis',46018,46019,'oblique'),
 ('foot','adductorhallucis','Aductor del dedo gordo','adductor hallucis',46020,46021,'transverse'),
]
moduleids={f'muscular:{region}-{side}' for region in ['hand','foot'] for side in ['right','left']}
old=json.loads((ROOT/'public/models/anatomy/muscular/catalog.json').read_text(encoding='utf-8'))
oldowners=[n for n in old['nodes'] if n['meshNames'] and not set(n['assetIds'])&moduleids]
oldids={n.get('sourceId') for n in oldowners};oldfj={a for n in oldowners for a in n['aliases'] if re.fullmatch(r'FJ\d+M?',a)}
def row(cid,region):
 p=parts[cid];side='right' if 'right' in p['en'] else 'left' if 'left' in p['en'] else 'unspecified'
 return dict(region=region,name=p['en'],en=p['en'],sourceId=cid,elementIds=bindings[cid],representationId=p['representation id'],side=side,isaType=typ(cid),isaAncestry=ancestry(cid),muscleParent=None)
approved=[]
for region,family,label,latin,r,l,component in PAIRS:
 for side,number in [('right',r),('left',l)]:
  cid='FMA'+str(number);a=row(cid,region);assert a['side']==side and len(a['elementIds'])==1
  fid=a['elementIds'][0];assert cid not in oldids and fid not in oldfj and fid in directory
  assert a['isaType']==('head of muscle organ' if component else 'muscle organ'),a
  rid=f"muscular:region:{'arm' if region=='hand' else 'leg'}-{side}:{region}"
  whole=f'muscular:muscle:{family}:{side}' if component else 'bp3d:'+cid
  a.update(name=label,latin='Musculus '+latin,family=family,component=component,elementId=fid,
   sourceType='head' if component else 'muscle',structureId=whole,regionId=rid,moduleId=f'muscular:{region}-{side}',
   moduleFile=f'muscular-{region}-{side}.glb',proposedParentId=whole if component else rid,
   muscleParent=whole if component else 'No aplica: músculo',archiveEntry=directory[fid],decision='APROBADO',
   reason='Identidad nominal, lado y FJ propios. Cabezas conservadas como componentes; integración condicionada a cabecera y geometría originales.')
  approved.append(a)
other=[]
for cid,p in parts.items():
 if cid not in nonterminal and any(a['id']=='FMA46751' for a in ancestry(cid)):
  a=row(cid,'face');a.update(decision='DESCARTADO',reason='Músculo orbital; no representa masticación ni expresión facial solicitada. No se renombra por posición.');other.append(a)
for cid in ['FMA37388','FMA37389','FMA65198','FMA65199','FMA42398','FMA42399','FMA42402','FMA42403','FMA42404','FMA42405','FMA86034','FMA86035']:
 a=row(cid,'foot' if cid in ['FMA86034','FMA86035'] else 'hand')
 reason='Conjunto agregado con un FJ, sin identidades individuales. Requiere curación de cobertura grupal; no se etiqueta como un músculo individual.'
 if 'pollicis' in a['en']:
  reason='Coexisten FJ del músculo completo y de una cabeza superficial sin relación PART-OF que aclare el alcance; no se presume que el FJ completo sea la cabeza profunda. Lados leídos del nombre, nunca del sufijo M.'
  a['muscleParent']='Flexor corto del pulgar; relación de alcance pendiente'
 if a['region']=='foot':reason='Oponente del quinto dedo del pie: representación nominal presente, variante fuera de las familias prioritarias; pendiente revisar independencia anatómica respecto al flexor corto. No se afirma ausencia.'
 a.update(decision='APLAZADO',reason=reason);other.append(a)
face=[('Masetero',r'\bmasseter'),('Temporal',r'\btemporalis\b|temporal muscle|muscle.*temporal'),('Pterigoideo medial',r'medial pterygoid'),('Pterigoideo lateral',r'lateral pterygoid'),('Orbicular del ojo',r'orbicularis oculi'),('Orbicular de la boca',r'orbicularis oris'),('Buccinador',r'buccinator'),('Cigomático mayor',r'zygomaticus major'),('Cigomático menor',r'zygomaticus minor'),('Frontal',r'frontalis|occipitofrontal'),('Occipital',r'occipitalis|occipital belly'),('Elevador del labio superior',r'levator labii'),('Elevador del ángulo de la boca',r'levator anguli'),('Depresor del ángulo de la boca',r'depressor anguli'),('Depresor del labio inferior',r'depressor labii'),('Mentoniano',r'\bmentalis\b'),('Risorio',r'risorius'),('Nasal',r'\bnasalis\b'),('Corrugador superciliar',r'corrugator'),('Prócer',r'procerus')]
missing=[]
for region,label,pattern in [('face',a,b) for a,b in face]+[('hand','Palmar corto',r'palmaris brevis'),('foot','Extensor corto de los dedos',r'extensor digitorum brevis'),('foot','Interóseos dorsales del pie',r'dorsal interosse.*foot|interosse.*dorsal.*foot')]:
 hits=[dict(table=pref,**r) for pref in ['isa','partof'] for r in table(pref+'_parts_list_e.txt') if re.search(pattern,r['en'],re.I)]
 assert not hits,(label,hits)
 missing.append(dict(region=region,name=label,pattern=pattern,sourceId=None,elementId=None,side='No identificada',isaType='Sin concepto nominal identificado',muscleParent=None,representationId=None,decision='APLAZADO',reason='Sin coincidencia nominal en ambas tablas 4.0; no se inventan FMA/FJ ni geometría.'))
allrows=approved+other+missing
counts=dict(candidates={r:sum(a['region']==r for a in allrows) for r in ['face','hand','foot']},decisions=dict(collections.Counter(a['decision'] for a in allrows)),families=len({a['family'] for a in approved}),structures=len({a['structureId'] for a in approved}),meshes=len(approved),modules=4,missingRequestedFamilies=len(missing))
assert counts['decisions']=={'APROBADO':48,'DESCARTADO':14,'APLAZADO':35},counts
result=dict(source=dict(metadata='research/anatomy/torso-metadata.zip',version='4.0 OBJ99',geometryExtractedDuringAudit=False,scope='Face/mastication, intrinsic hand and foot only; pinned metadata reused without historical re-audit'),counts=counts,approved=approved,other=other,missingRequestedFamilies=missing,modules=[dict(id=f'muscular:{r}-{s}',filename=f'muscular-{r}-{s}.glb',regionId=f"muscular:region:{'arm' if r=='hand' else 'leg'}-{s}:{r}") for r in ['hand','foot'] for s in ['right','left']])
(ROOT/'research/anatomy/muscle-gaps-selection.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8',newline='\n')
print(json.dumps(counts,ensure_ascii=False,indent=2))
