"""Audit the common native 4.0 frame; no fitting or clinical accuracy claim."""
from pathlib import Path
import zipfile,json,hashlib,re
root=Path(__file__).resolve().parents[2]
out=root/'public/models/anatomy/digestive'
manifest=json.loads((out/'digestive-source-manifest.json').read_text(encoding='utf8'))
catalog=json.loads((out/'catalog.json').read_text(encoding='utf8'))
skeletal=json.loads((root/'public/models/anatomy/skeletal/catalog.json').read_text(encoding='utf8'))
assert catalog['frame']==skeletal['frame']
assert manifest['transform']==[[.001,0,0,0],[0,0,.001,0],[0,-.001,0,0],[0,0,0,1]]
with zipfile.ZipFile(root/manifest['sourceZip']) as z:
 for f in manifest['files']:
  b=z.read(f['path']);assert hashlib.sha256(b).hexdigest()==f['sha256']
  header={k:re.search(r'# '+k+r'\s*:\s*(.+)',b.decode()).group(1) for k in ['Compatibility version','File ID','Concept ID']}
  assert header=={'Compatibility version':'4.0','File ID':f['elementId'],'Concept ID':f['sourceId']}
  for i in range(3):assert f['boundsMetres'][0][i]>=skeletal['frame']['bounds'][0][i]-.03 and f['boundsMetres'][1][i]<=skeletal['frame']['bounds'][1][i]+.03
salivary=[n for n in catalog['nodes'] if n.get('family')=='salivary' and n['meshNames']]
assert len(salivary)==4
assert all(n['bounds'][1][0]<0 if n['side']=='right' else n['bounds'][0][0]>0 for n in salivary)
report=dict(frame=catalog['frame']['id'],sourceVersion='4.0 OBJ99 for every integrated original',sourceMeshes=len(manifest['files']),transform=manifest['transform'],additionalRegistration='none',nativeCoordinatesPreserved=True,allNativeIdentitiesVerified=True,withinExistingFrameBounds=True,pairedSalivaryLateralityVerified=True,method='Same native source release and the previously established body transform, verified per original header/hash. No source fitting, translation or per-piece scale.',limitations=['Source segmentation can have seams, gaps and overlaps; the geometry is not retouched to close them.','The common frame is not clinical accuracy or a proof of every anatomical boundary.','4.3 was investigated but not integrated: its downloaded liver identities retained the VII/VIII ambiguity.'])
(out/'digestive-registration.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8',newline='\n')
print(json.dumps(report,ensure_ascii=False))
