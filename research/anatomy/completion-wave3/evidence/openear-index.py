import sys,json,zipfile,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'scripts/anatomy/registration-research'))
from openear_headers import RangeFile
out=Path(__file__).parent/'other-sources'
record=json.loads((root/'.cache/anatomy-completion/openear-record-rechecked.json').read_text(encoding='utf-8'))
assert record['metadata']['license']['id']=='cc-by-4.0'
results=[]
for specimen in ['ZETA','EPSILON']:
 item=next(f for f in record['files'] if f['key']==specimen+'.zip')
 remote=RangeFile('https://zenodo.org/records/1473724/files/'+specimen+'.zip',item['size'])
 with zipfile.ZipFile(remote) as archive:
  rows=[dict(name=i.filename,bytes=i.file_size,compressedBytes=i.compress_size,crc32=format(i.CRC,'08x')) for i in archive.infolist() if i.filename.lower().endswith('.ply')]
  names=[i.filename for i in archive.infolist()]
  result=dict(specimen=specimen,archiveBytes=item['size'],archiveDeclaredChecksum=item['checksum'],files=rows,sideLabels=[n for n in names if any(t in n.lower() for t in ['rechts','links','right','left'])][:12],transferredBytes=remote.transferred)
  results.append(result);print(json.dumps(result),flush=True)
(out/'openear-fresh-index.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
