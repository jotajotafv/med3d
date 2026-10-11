import json,numpy as np,shutil,runpy
from pathlib import Path
out=Path(__file__).parent;dest=out/'foot-supplemental';dest.mkdir(exist_ok=True)
plan=json.loads((out/'articular/candidate-plan.json').read_text());rows=[{**c,'region':'foot_'+c['sourceObject'][-1]} for c in plan['candidates'] if 'metatarsophalangeal' in c['sourceObject']]
(dest/'candidate-plan.json').write_text(json.dumps({**plan,'candidates':rows},indent=2))
z=np.load(out/'articular/source-geometry.npz');np.savez_compressed(dest/'source-geometry.npz',**{k:z[k] for c in rows for k in [c['sourceObject']+'__p',c['sourceObject']+'__f']})
for f in ['registration.json','target-bones.json']:shutil.copyfile(out/'foot-regional'/f,dest/f)
shutil.copyfile(out/'foot-regional/check-registration.py',dest/'check-registration.py');runpy.run_path(str(dest/'check-registration.py'))
