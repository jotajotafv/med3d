#!/usr/bin/env python3
"""Read selected public OpenEar ZIP headers; never modify or register geometry.

Only prints coordinate/segmentation metadata and a DICOM tag allowlist.
Downloads byte ranges, not the full multi-GB tomography archives.
Run with Python 3 (pydicom optional): python openear_headers.py ZETA EPSILON
"""
import io
import hashlib
import json
import re
import sys
import urllib.request
import zipfile

RECORD = 'https://zenodo.org/api/records/1473724'


class RangeFile(io.RawIOBase):
    def __init__(self, url, size):
        self.url, self.size, self.pos = url, size, 0
        self.cache = []
        self.transferred = 0

    def seek(self, offset, whence=0):
        self.pos = offset + (0 if whence == 0 else self.pos if whence == 1 else self.size)
        return self.pos

    def tell(self):
        return self.pos

    def read(self, n=-1):
        n = self.size - self.pos if n < 0 else min(n, self.size - self.pos)
        if n <= 0:
            return b''
        start, end = self.pos, self.pos + n
        for a, b, data in self.cache:
            if a <= start and end <= b:
                self.pos = end
                return data[start-a:end-a]
        fetch_end = min(self.size, max(end, start + 65536))
        req = urllib.request.Request(self.url, headers={'Range': f'bytes={start}-{fetch_end-1}'})
        with urllib.request.urlopen(req, timeout=40) as response:
            if response.status != 206:
                raise RuntimeError('Server ignored Range request; full archive download refused')
            if not response.headers.get('Content-Range', '').startswith(f'bytes {start}-'):
                raise RuntimeError('Unexpected Content-Range')
            data = response.read(fetch_end-start+1)
        if len(data) != fetch_end-start:
            raise RuntimeError('Unexpected byte-range length')
        self.transferred += len(data)
        self.cache.append((start, fetch_end, data))
        self.pos = end
        return data[:n]


def inspect(specimen, files):
    item = next(f for f in files if f['key'] == specimen+'.zip')
    url = f'https://zenodo.org/records/1473724/files/{specimen}.zip'
    remote = RangeFile(url, item['size'])
    with zipfile.ZipFile(remote) as archive:
        infos = archive.infolist()
        result = {'specimen': specimen, 'url': url, 'archiveChecksum': item['checksum'],
                  'headers': [], 'transforms': [], 'dicomSpatialMetadata': []}
        folders = sorted({info.filename.rsplit('/', 1)[0] for info in infos if '/' in info.filename})
        result['sideLabelledFolders'] = [p for p in folders if re.search(r'links|rechts|left|right', p, re.I)]
        selected = [i for i in infos if i.filename.lower().endswith('.nrrd') and
                    ('06_' in i.filename or '05_' in i.filename)]
        for info in selected:
            with archive.open(info) as member:
                prefix = member.read(16384)
            boundary = prefix.find(b'\n\n')
            if boundary < 0:
                raise RuntimeError('NRRD header too large')
            header = prefix[:boundary].decode('utf-8')
            # Exclude file paths and other non-spatial free-form fields.
            lines = [line for line in header.splitlines() if
                     re.match(r'^(NRRD|type:|dimension:|space:|sizes:|space directions:|space origin:|space units:|measurement frame:|Segment\d+_(Name|LabelValue|Extent|Layer):)', line)]
            result['headers'].append({'member': info.filename, 'lines': lines})
        result['transforms'] = [{'member': i.filename, 'bytes': i.file_size, 'crc32': f'{i.CRC:08x}'}
                                for i in infos if i.filename.lower().endswith(('.h5', '.tfm', '.mrml', '.fcsv'))]
        try:
            import h5py
        except ImportError:
            result['transformNote'] = 'h5py not installed; transform values not inspected'
        else:
            for transform in result['transforms']:
                if not transform['member'].lower().endswith('.h5'):
                    continue
                data = archive.read(transform['member'])
                transform['sha256'] = hashlib.sha256(data).hexdigest()
                transform['itkDatasets'] = {}
                with h5py.File(io.BytesIO(data), 'r') as h5:
                    def capture(name, obj):
                        if isinstance(obj, h5py.Dataset) and name.startswith('TransformGroup/'):
                            values = obj[()].tolist()
                            transform['itkDatasets'][name] = [v.decode() if isinstance(v, bytes) else v for v in values] if isinstance(values, list) else str(values)
                    h5.visititems(capture)
        try:
            import pydicom
        except ImportError:
            result['dicomNote'] = 'pydicom not installed; DICOM tags were not inspected'
        else:
            dicoms = [i for i in infos if i.filename.lower().endswith('.dcm')]
            if not dicoms:
                dicoms = [i for i in infos if '01_CBCT' in i.filename and not i.is_dir() and i.file_size > 1024]
            first_per_folder = {}
            for item in dicoms:
                first_per_folder.setdefault(item.filename.rsplit('/', 1)[0], item)
            for dicom in list(first_per_folder.values())[:4]:
                with archive.open(dicom) as member:
                    prefix = member.read(65536)
                dataset = pydicom.dcmread(io.BytesIO(prefix), stop_before_pixels=True, force=True)
                allow = ['Laterality', 'ImageLaterality', 'ImageOrientationPatient', 'ImagePositionPatient',
                         'PixelSpacing', 'SliceThickness', 'AnatomicalOrientationType', 'PatientOrientation']
                result['dicomSpatialMetadata'].append({'member': dicom.filename,
                    'tags': {k: str(dataset.get(k, 'NOT PRESENT')) for k in allow}})
        result['transferredBytes'] = remote.transferred
        return result


if __name__ == '__main__':
    with urllib.request.urlopen(RECORD, timeout=40) as response:
        record = json.load(response)
    for specimen in sys.argv[1:] or ['ZETA', 'EPSILON']:
        print(json.dumps(inspect(specimen, record['files']), ensure_ascii=False), flush=True)
