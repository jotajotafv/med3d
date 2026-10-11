import json,numpy as np,zipfile,hashlib
from pathlib import Path
out=Path(__file__).parent;root=out.parents[2];foot=out/'foot-regional';geo=np.load(foot/'source-geometry.npz');meta=json.loads((foot/'source-geometry.json').read_text())
names=[n+'.'+s for n in ['Extensor digitorum brevis','Dorsal interossei muscles of foot'] for s in ['l','r']]
originals={n:dict(positions=geo[n+'__p'].tolist(),faces=geo[n+'__f'].tolist(),metadata=next(o for o in meta['objects'] if o['name']==n)) for n in names}
research=root/'research/anatomy';target=research/'completion-wave3-originals.zip'
assert not target.exists(),'Do not overwrite pinned originals'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as z:
 z.writestr('world-geometry.json',json.dumps(originals,separators=(',',':')))
 z.write(root/'.cache/anatomy-completion/z-license-rechecked.txt','upstream-license.txt')
 z.write(foot/'registration.json','registration.json')
 z.write(out/'registration.json','global-registration.json')
print(hashlib.sha256(target.read_bytes()).hexdigest())
