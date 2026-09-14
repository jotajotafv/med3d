#!/usr/bin/env python3
"""Fetch only official pinned BodyParts3D source data; safely extract selected OBJ files."""
import argparse, hashlib, json, shutil, urllib.request, zipfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--cache',type=Path,default=Path('.cache/bodyparts3d-4.0'));a=p.parse_args()
a.cache.mkdir(parents=True,exist_ok=True)
lock=json.loads((Path(__file__).parent/'source-lock.json').read_text())
def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for c in iter(lambda:f.read(1024*1024),b''):h.update(c)
    return h.hexdigest()
def get(url,path,expected):
    if path.exists() and sha(path)==expected:return
    temp=path.with_suffix(path.suffix+'.part')
    request=urllib.request.Request(url,headers={'User-Agent':'MED3D scientific asset import'})
    with urllib.request.urlopen(request,timeout=120) as r,temp.open('wb') as w:shutil.copyfileobj(r,w)
    if sha(temp)!=expected:
        temp.unlink();raise ValueError('Upstream checksum changed; review before importing: '+url)
    temp.replace(path)
archive=a.cache/'isa_BP3D_4.0_obj_99.zip'
get(lock['sourceArchive'],archive,lock['sourceArchiveSha256'])
output=a.cache/'source';output.mkdir(exist_ok=True)
with zipfile.ZipFile(archive) as z:
    bybasename={}
    for entry in z.infolist():
        if entry.is_dir():continue
        bybasename.setdefault(Path(entry.filename).name,[]).append(entry)
    for item in lock['files']:
        name=item['elementId']+'.obj';matches=bybasename.get(name,[])
        if len(matches)!=1:raise ValueError('Unexpected source archive members for '+name)
        dest=output/name
        if not dest.exists() or sha(dest)!=item['sha256']:
            with z.open(matches[0]) as r,dest.open('wb') as w:shutil.copyfileobj(r,w)
        if sha(dest)!=item['sha256']:raise ValueError('Element checksum mismatch '+name)
for item in lock['metadata']:
    get(item['url'],output/item['file'],item['sha256'])
print(output.resolve())
