import json,numpy as np
from pathlib import Path
out=Path(__file__).parent;result={}
def read(name):return json.loads((out/name).read_text())
pelvis=read('hra-pelvis-geometry.json');cord=read('hra-spinal-geometry.json')
g=pelvis['VH_M_coccyx'];result['VH_M_coccyx__p']=np.array(g['vertices']);result['VH_M_coccyx__f']=np.array(g['faces'])
p=[];f=[]
for g in cord.values():f.extend((np.array(g['faces'])+len(p)).tolist());p.extend(g['vertices'])
result['VH_M_spinal_cord_all_segments__p']=np.array(p);result['VH_M_spinal_cord_all_segments__f']=np.array(f)
np.savez_compressed(out/'hra/source-geometry.npz',**result)
# Reuse the lossless QA writer without executing its export loops.
ns={};code=(out/'export-qa.py').read_text();exec('import json,struct,numpy as np\n'+code[code.index('def glb('):code.index('def transform(')],ns);glb=ns['glb']
reg=read('hra-registration.json')
for region in ['pelvis','spinal']:
 data=reg[region];refs=read('hra-'+region+'-references.json');parts=[];name='VH_M_coccyx' if region=='pelvis' else 'VH_M_spinal_cord_all_segments';candidate=dict(vertices=result[name+'__p'],faces=result[name+'__f'])
 for mode,M in [('global',np.array(data['globalSimilarity'])),('regional',np.array(data['matrix']))]:
  for key,g in {name:candidate,**refs}.items():
   points=np.asarray(g['vertices'])@M[:3,:3].T+M[:3,3];parts.append((mode+'_'+key,points,g['faces'],dict(mode=mode,role='candidate' if key==name else 'reference',label=key,gaps=['skeletal-coccyx' if region=='pelvis' else 'nervous-spinal-cord'])))
 glb(out/('qa-hra-'+region+'.glb'),parts)
print('HRA QA originals and cohorts exported',flush=True)
