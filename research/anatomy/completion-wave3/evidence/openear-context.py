import sys,json,zipfile,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[3]
sys.path.insert(0,str(root/'scripts/anatomy/registration-research'))
from openear_headers import RangeFile
out=Path(__file__).parent/'other-sources'
record=json.loads((root/'.cache/anatomy-completion/openear-record-rechecked.json').read_text(encoding='utf-8'))
assert record['metadata']['license']['id']=='cc-by-4.0'
report=[]
for specimen in ['ZETA','EPSILON']:
 item=next(f for f in record['files'] if f['key']==specimen+'.zip')
 url='https://zenodo.org/records/1473724/files/'+specimen+'.zip'
 remote=RangeFile(url,item['size'])
 with zipfile.ZipFile(remote) as archive:
  infos=[i for i in archive.infolist() if i.filename.lower().endswith('.ply') and any(s in i.filename.lower() for s in ['bone.ply','tympanic membrane','tympanic_membrane','external auditory','external_auditory','scala'])]
  for info in infos:
   path=out/(specimen.lower()+'-'+Path(info.filename).name)
   try:
    data=archive.read(info)
    assert len(data)==info.file_size
    path.write_bytes(data)
    row=dict(specimen=specimen,url=url,member=info.filename,file=path.name,bytes=len(data),crc32=format(info.CRC,'08x'),sha256=hashlib.sha256(data).hexdigest(),license='CC BY 4.0',version='Zenodo 1473724 v2',purpose='Unmodified specimen context for laterality and temporal-bone registration research; no product approval')
    report.append(row);print('Fetched',path.name,len(data),flush=True)
   except Exception as error:
    report.append(dict(specimen=specimen,member=info.filename,error=str(error)));print('Unavailable',specimen,info.filename,str(error),flush=True)
   (out/'openear-context-lock.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
 print('Transfer bytes',specimen,remote.transferred,flush=True)
