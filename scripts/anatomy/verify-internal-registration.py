"""Verify only the new cohort and the two cervical compatibility controls."""
from pathlib import Path
import json,hashlib,zipfile,re
r=Path(__file__).resolve().parents[2];out=r/'public/models/anatomy/internal'
manifest=json.loads((out/'internal-source-manifest.json').read_text(encoding='utf8'))
frame=json.loads((r/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'))['frame']
assert manifest['transform']==[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]
with zipfile.ZipFile(r/manifest['sourceZip']) as z:
 for f in manifest['files']:
  data=z.read(f['path']);assert hashlib.sha256(data).hexdigest()==f['sha256']
  for key,value in [('File ID',f['elementId']),('Concept ID',f['sourceId']),('Compatibility version',f['sourceVersion'])]:assert re.search(r'# '+key+r'\s*:\s*(.+)',data.decode()).group(1)==value
  for axis in range(3):assert f['boundsMetres'][0][axis]>=frame['bounds'][0][axis]-.03 and f['boundsMetres'][1][axis]<=frame['bounds'][1][axis]+.03
  if f['side'] in ['left','right']:
   x=(f['boundsMetres'][0][0]+f['boundsMetres'][1][0])/2;assert x<0 if f['side']=='right' else x>0
with zipfile.ZipFile(r/'research/anatomy/internal-metadata.zip') as z,zipfile.ZipFile(r/'research/anatomy/respiratory-originals.zip') as historical:
 for control in manifest['frameControls']:
  fid=control['elementId'];new=z.read('controls43/'+fid+'.obj');old=historical.read(next(n for n in historical.namelist() if n.endswith('/'+fid+'.obj') or n==fid+'.obj'))
  assert hashlib.sha256(new).hexdigest()==control['source43Sha256'] and hashlib.sha256(old).hexdigest()==control['source40Sha256']
  records=lambda data:[line for line in data.decode().splitlines() if line.startswith(('v ','vn ','f '))]
  assert records(new)==records(old)
report=dict(frame=frame['id'],transform=manifest['transform'],originals=32,bp40=25,bp43=7,allHeadersAndHashesVerified=True,withinBodyFrame=True,lateralCentroidsVerified=True,cervicalControls=manifest['frameControls'],additionalRegistration='none',method='Native 4.0 coordinates; seven 4.3 cervical additions with two exactly identical nearby geometric controls (positions, normals and faces). No fitting, scaling per organ or manual translation.',limitations=['Compatibility checks establish use of the same native coordinate frame, not clinical validation.','No registration from this cervical check is extrapolated to HRA or Z-Anatomy.','Source seams, overlaps, open boundaries and anatomical variability are retained.'])
(out/'internal-registration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(report,ensure_ascii=False))
