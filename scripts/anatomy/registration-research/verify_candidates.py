#!/usr/bin/env python3
"""Record unmodified source matrices and check PLY/segmentation frame consistency.

This is NOT body registration. Bounds are used only to reject wrong units/axes
against the same source segmentation, never to place a bone into BodyParts3D.
Requires numpy; source_dir is the retained phase-2 bone-gap-research directory.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import struct
import numpy as np


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def ply_positions(path):
    data = path.read_bytes()
    offset = data.index(b'end_header\n') + len(b'end_header\n')
    header = data[:offset].decode()
    assert 'format binary_little_endian 1.0' in header
    properties = header.split('element vertex ')[1].split('element face')[0]
    assert re.findall(r'property (\w+) (\w+)', properties) == [('float', 'x'), ('float', 'y'), ('float', 'z')]
    count = int(re.search(r'element vertex (\d+)', header)[1])
    return np.frombuffer(data, '<f4', count=count*3, offset=offset).reshape((-1, 3))


def main(source, output):
    identity = np.eye(4).tolist()
    evidence = [json.loads(line) for line in Path(__file__).with_name('openear-headers-2026-09-14.jsonl').read_text().splitlines()]
    report = {'date': '2026-09-14', 'method': 'read-only source matrices and same-source segmentation extents; no anatomical registration',
              'matricesConvention': 'row-major storage; column vectors; metres for glTF',
              'publicAssetsModified': False, 'bodyRegistration': None, 'specimens': []}
    for record in evidence:
        header = next(x for x in record['headers'] if x['member'].startswith('06_'))['lines']
        origin = np.array([float(x) for x in next(x for x in header if x.startswith('space origin:')).split('(')[1].split(')')[0].split(',')])
        ijk_to_ras = np.eye(4)
        ijk_to_ras[:3, :3] *= .125
        ijk_to_ras[:3, 3] = origin
        specimen = {'id': record['specimen'], 'originalObjectMatrix': identity, 'sourceUnits': 'millimetres',
                    'sourceFrame': 'RAS segmentation coordinate frame; specimen pose is not body pose',
                    'segmentationIJKToRASmm': ijk_to_ras.tolist(),
                    'rasToLps': [[-1,0,0,0],[0,-1,0,0],[0,0,1,0],[0,0,0,1]],
                    'unitsAndBasisConversionOnly': [[-.001,0,0,0],[0,0,.001,0],[0,.001,0,0],[0,0,0,1]],
                    'conversionApplied': False, 'finalBodyMatrix': None, 'bodyScale': None,
                    'bodyRotation': None, 'bodyTranslation': None, 'bones': []}
        for path in sorted(source.glob('openear-'+record['specimen'].lower()+'-*.ply')):
            bone = next(name for name in ['Malleus', 'Incus', 'Stapes'] if name in path.name)
            segment_number = re.match(r'Segment(\d+)_', next(line for line in header if line.endswith('_Name:='+bone))).group(1)
            extent = np.array([int(x) for x in next(line for line in header if line.startswith('Segment'+segment_number+'_Extent:=')).split(':=')[1].split()]).reshape(3, 2).T
            segment_bounds = origin + extent * .125
            positions = ply_positions(path)
            mesh_bounds = np.stack([positions.min(0), positions.max(0)])
            error = np.abs(mesh_bounds-segment_bounds).max()
            flipped = positions * [-1, -1, 1]
            flipped_bounds = np.stack([flipped.min(0), flipped.max(0)])
            wrong_error = np.abs(flipped_bounds-segment_bounds).max()
            # Report both measurements without turning an arbitrary threshold into
            # an anatomical acceptance test. Authors smoothed/optimized the PLYs.
            specimen['bones'].append({'file': path.name, 'sha256': sha(path), 'vertices': len(positions),
                'segment': int(segment_number), 'plyBoundsMm': mesh_bounds.tolist(),
                'segmentationVoxelCentreBoundsMm': segment_bounds.tolist(),
                'maxSameSourceBoundEndpointDifferenceMm': float(error),
                'sameSourceBoundEndpointDifferenceVoxels': float(error/.125),
                'ifMistakenlyTreatingPlyAsLpsDifferenceMm': float(wrong_error)})
        report['specimens'].append(specimen)
    pelvis = source/'hra-pelvis-male-v1.3.glb'
    data = pelvis.read_bytes()
    length = struct.unpack_from('<I', data, 12)[0]
    gltf = json.loads(data[20:20+length])
    nodes = gltf['nodes']
    assert nodes[0]['name'] == 'VH_M_pelvis'
    coccyx = next(node for node in nodes if node['name'] == 'VH_M_coccyx')
    for node in [nodes[0], coccyx]:
        assert not set(node).intersection(['matrix','scale','rotation','translation'])
    position_index = gltf['meshes'][coccyx['mesh']]['primitives'][0]['attributes']['POSITION']
    accessor = gltf['accessors'][position_index]
    report['coccyx'] = {'originalFile': pelvis.name, 'bytes':len(data), 'sha256':sha(pelvis),
        'source': 'https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/assets/3d-vh-m-pelvis.glb',
        'version':'v1.3', 'license':'CC BY 4.0', 'originalNode':'VH_M_coccyx',
        'originalLocalMatrix':identity, 'originalParentMatrix':identity, 'originalWorldMatrix':identity,
        'gltfUnitsAndBasisConversion':identity, 'originalScale':[1,1,1], 'originalRotationQuaternion':[0,0,0,1],
        'originalTranslation':[0,0,0], 'units':'metres', 'upAxis':'Y', 'vertices':accessor['count'],
        'boundsMetres':[accessor['min'],accessor['max']], 'conversionApplied':False,
        'finalBodyMatrix':None,'bodyScale':None,'bodyRotation':None,'bodyTranslation':None,
        'matchingAnatomicalLandmarkPairs':[], 'modifications':[]}
    output.write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({'checkedSpecimens':len(report['specimens']), 'checkedPLY':6, 'coccyxVertices':accessor['count'],
                      'bodyRegistration':None, 'output':str(output)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('source_dir', type=Path)
    parser.add_argument('output', type=Path)
    args = parser.parse_args()
    main(args.source_dir, args.output)
