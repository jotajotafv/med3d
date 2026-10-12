from pathlib import Path
import json,numpy as np
root=Path.cwd();out=root/'.cache/anatomy-completion/wave4/native';out.mkdir(exist_ok=True)
records=json.loads((out.parent/'bp40-originals.json').read_text(encoding='utf8'))['candidates'];arr={};plan=[]
for r in records:
 fid=r['elementId'];text=(root/r['path']).read_text();p=[];f=[]
 for line in text.splitlines():
  w=line.split()
  if not w:continue
  if w[0]=='v':x,y,z=map(float,w[1:4]);p.append([x/1000,z/1000,-y/1000])
  elif w[0]=='f':
   face=[int(t.split('/')[0]) for t in w[1:]];assert len(face)==3 and min(face)>0
   f.append([i-1 for i in face])
 p=np.asarray(p,dtype=np.float64);f=np.asarray(f,dtype=np.int32)
 arr[fid+'__p']=p;arr[fid+'__f']=f
 name=r['headers']['English name'];gaps=['cardio-secondary']
 if 'renal artery' in name.lower():gaps+=['urinary-vessels']
 if any(w in name.lower() for w in ['coronary','ventricular branch','conus','cardiac','septal branch','diagonal branch']):gaps+=['cardio-coronary']
 if fid in ['FJ2057','FJ2063']:gaps+=['cardio-profunda']
 if fid in ['FJ2629','FJ2630']:gaps=['digestive-regions']
 if fid in ['FJ3396','FJ3398']:gaps=['digestive-mesentery','digestive-peritoneum']
 plan.append(dict(sourceObject=fid,name=name,sourceId=r['headers']['Concept ID'],gaps=gaps,region='native',sideMedianX=float(np.median(p[:,0])),headerMatchesMetadata=any(x['sourceId']==r['headers']['Concept ID'] for x in r['nominalRows'])))
np.savez_compressed(out/'source-geometry.npz',**arr)
(out/'candidate-plan.json').write_text(json.dumps(dict(candidates=plan),indent=2)+'\n',encoding='utf8',newline='\n')
(out/'registration.json').write_text(json.dumps(dict(regions={'native':{'matrix':np.eye(4).tolist()}},method='Original BP3D 4.0 frame; fixed (x,y,z) -> (x,z,-y)/1000 before identity matrix. No fitted registration.'),indent=2)+'\n',encoding='utf8',newline='\n')
(out/'target-bones.json').write_bytes((out.parent/'target-bones.json').read_bytes())
for file in ['check-registration.py','check-soft.py']:
 s=(out.parent/file).read_text(encoding='utf8').replace('root=out.parents[2]','root=Path.cwd()').replace("out/'target-soft.json'","out.parent/'target-soft.json'")
 (out/file).write_text(s,encoding='utf8',newline='\n')
print('Prepared',len(plan),'native originals',flush=True)
