"""Read pinned BP3D metadata; acquire only requested official OBJ byte ranges.
No production files or source geometry are changed by this research step.
"""
from pathlib import Path
import concurrent.futures,datetime,hashlib,json,re,struct,time,urllib.request,zipfile,zlib,subprocess,tempfile
ROOT=Path.cwd()
OUT=ROOT/'.cache/anatomy-completion/wave4';OUT.mkdir(parents=True,exist_ok=True)
URL='https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip'
TOTAL=142903898
sha=lambda b:hashlib.sha256(b).hexdigest()
audit=json.loads((ROOT/'docs/anatomical-gaps-audit.json').read_text(encoding='utf8'))
inventory=json.loads((OUT/'bp40-inventory.json').read_text(encoding='utf8'))
candidates={}
for family,block in inventory.items():
 for fid in block['unused']:
  candidates.setdefault(fid,dict(elementId=fid,families=[],nominalRows=[]))
  candidates[fid]['families'].append(family)
  candidates[fid]['nominalRows'].extend([r for r in block['rows'] if r['elementId']==fid])
cached={}
for folder in [ROOT/'.cache/anatomy-completion/wave1',ROOT/'.cache/anatomy-completion/wave2',ROOT/'.cache/bodyparts3d-4.0',ROOT/'.cache/phase5-cardiovascular',ROOT/'.cache/phase7-digestive']:
 if folder.exists():
  for p in folder.rglob('FJ*.obj'):cached.setdefault(p.stem,p)
with zipfile.ZipFile(ROOT/'research/anatomy/torso-metadata.zip') as z:
 bins=[n for n in z.namelist() if n.endswith('.bin')]
 assert len(bins)==1,bins
 directory=z.read(bins[0])
assert sha(directory)=='edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b'
entries={};offset=0
while offset<len(directory):
 h=struct.unpack_from('<4s6H3L5H2L',directory,offset);assert h[0]==b'PK\x01\x02'
 name=directory[offset+46:offset+46+h[10]].decode()
 entries[Path(name).stem]=dict(path=name,method=h[4],crc=h[7],compressedBytes=h[8],bytes=h[9],offset=h[16])
 offset+=46+h[10]+h[11]+h[12]
license_url='https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html'
license_data=urllib.request.urlopen(license_url,timeout=45).read()
assert b'Attribution 4.0' in license_data
(OUT/'bp40-license.html').write_bytes(license_data)
(OUT/'originals').mkdir(exist_ok=True)
def fetch_range(start,end):
 with tempfile.NamedTemporaryFile(dir=OUT,suffix='.headers',delete=False) as t: hp=Path(t.name)
 try:
  call=subprocess.run(['curl.exe','--fail','--silent','--show-error','--connect-timeout','10','--max-time','60','--retry','2','--range',f'{start}-{end}','--header','Accept-Encoding: identity','--dump-header',str(hp),URL],capture_output=True,check=True)
  headers=hp.read_text().lower();data=call.stdout
  assert f'content-range: bytes {start}-{end}/{TOTAL}' in headers,headers
  assert len(data)==end-start+1
  return data
 finally:hp.unlink(missing_ok=True)

def extract(item):
 fid,c=item;e=entries[fid];p=OUT/'originals'/f'{fid}.obj';ranges=[]
 if not p.exists() and fid in cached:p.write_bytes(cached[fid].read_bytes())
 if p.exists():data=p.read_bytes()
 else:
  end=e['offset']+30+len(e['path'].encode())+e['compressedBytes']-1
  packed=fetch_range(e['offset'],end)
  h=struct.unpack('<4s5H3L2H',packed[:30]);assert h[0]==b'PK\x03\x04' and h[3]==8 and e['method']==8 and h[10]==0
  assert packed[30:30+h[9]].decode()==e['path']
  data=zlib.decompress(packed[30+h[9]:],-15)
  ranges=[[e['offset'],end]]
  assert len(data)==e['bytes'] and zlib.crc32(data)==e['crc']
  p.write_bytes(data)
 assert len(data)==e['bytes'] and zlib.crc32(data)==e['crc']
 text=data.decode();headers=dict(re.findall(r'^# ([^:\r\n]+?)[ \t]*:[ \t]*(.*?)[ \t\r]*$',text,re.M))
 assert headers.get('File ID')==fid, (fid,headers)
 positions=[tuple(map(float,l.split()[1:4])) for l in text.splitlines() if l.startswith('v ')]
 faces=[l for l in text.splitlines() if l.startswith('f ')]
 assert positions and faces and all(len(l.split())==4 for l in faces)
 bounds=[[fn(p[i] for p in positions) for i in range(3)] for fn in [min,max]]
 return dict(**c,headers=headers,path=str(p.relative_to(ROOT)).replace('\\','/'),sourceUrl=URL,sourceVersion='4.0 OBJ99',license='CC BY 4.0',sha256=sha(data),bytes=len(data),sourcePositionCount=len(positions),triangles=len(faces),sourceBoundsMillimetres=bounds,archiveEntry=e,requests=ranges)
results=[];failures=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
 pending={pool.submit(extract,item):item[0] for item in sorted(candidates.items())}
 for future in concurrent.futures.as_completed(pending):
  fid=pending[future]
  try:results.append(future.result())
  except Exception as e:failures.append(dict(elementId=fid,error=str(e)))
  if (len(results)+len(failures))%50==0:print(len(results),'checked,',len(failures),'failures',flush=True)
(OUT/'bp40-originals.json').write_text(json.dumps(dict(url=URL,licenseUrl=license_url,licenseSha256=sha(license_data),candidates=sorted(results,key=lambda r:r['elementId']),failures=failures),indent=2),encoding='utf8',newline='\n')
print('DONE',len(results),'checked,',len(failures),'failures',flush=True)
