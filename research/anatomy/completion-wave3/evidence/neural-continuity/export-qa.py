import json,numpy as np
from pathlib import Path
out=Path(__file__).parent;parent=out.parent;root=out.parents[3]
exec((out/'qa-writer.py').read_text())
reg=json.loads((out/'registration.json').read_text());plan=json.loads((out/'candidate-plan.json').read_text());approved=json.loads((out/'provisional-selection.json').read_text())['names'];source=np.load(out/'source-geometry.npz');allSource=np.load(parent/'source-geometry.npz');bp=json.loads((root/'.cache/phase4-expansion/bp-reference.json').read_text());soft=json.loads((parent/'target-soft.json').read_text());bones=json.loads((out/'target-bones.json').read_text());boneReg=json.loads((parent/'registration.json').read_text())
parts=[(b['id'].replace(':','_'),bp[b['id']]['vertices'],bp[b['id']]['faces'],dict(boneId=b['id'],label=b['name'])) for b in bones]
for n,g in soft.items():
 if g['system']=='nervous' and n.startswith('zanatomy:'):parts.append((n,g['vertices'],g['faces'],dict(boneId=n,label=g['name'],neuralControl=True)))
glb(out/'qa-target.glb',parts)
for region,data in reg['regions'].items():
 parts=[]
 for mode,M in [('global',np.array(reg['globalSimilarity']['matrix'])),('regional',np.array(data['matrix']))]:
  for c in plan['candidates']:
   name=c['sourceObject']
   if c['region']!=region or name not in approved:continue
   p=source[name+'__p']@M[:3,:3].T+M[:3,3];parts.append((mode+'_'+name,p,source[name+'__f'],dict(role='candidate',mode=mode,label=name,gaps=c['gaps'])))
  for r in data['landmarks']:
   name=r['source'];p=source[name+'__p']@M[:3,:3].T+M[:3,3];parts.append((mode+'_'+name,p,source[name+'__f'],dict(role='reference',mode=mode,label=name)))
  for r in boneReg['regions'][region]['landmarks']:
   name=r['source'];p=allSource[name+'__p']@M[:3,:3].T+M[:3,3];parts.append((mode+'_bone_'+name,p,allSource[name+'__f'],dict(role='reference',mode=mode,label=name)))
 glb(out/('qa-'+region+'.glb'),parts)
print('Peripheral candidate QA',len(approved),flush=True)
