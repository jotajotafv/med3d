#!/usr/bin/env node
/** Meshopt compression + source-to-decoded validation for all 26 pilot OBJ.
 * No decimation. Validates each triangle (including orientation and duplicates),
 * every used source vertex, source/GLB names, FMA/FJ ownership, and global metres.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const out = path.resolve(option('--output', path.join(root, 'public/models/anatomy/muscular')));
const toolsDir = path.resolve(option('--tools-dir', path.join(root, '.cache/anatomy-tools')));
const sourceZip = path.resolve(option('--source', path.join(root, 'research/anatomy/muscular-pilot-originals.zip')));
const verifyOnly = args.includes('--verify-only');
const require = createRequire(path.join(toolsDir, 'package.json'));
const imp = async name => import(pathToFileURL(require.resolve(name)).href);
const [{ NodeIO, getBounds }, { ALL_EXTENSIONS, EXTMeshoptCompression, KHRMeshQuantization }, { reorder, quantize }, { MeshoptEncoder, MeshoptDecoder }] = await Promise.all([
  imp('@gltf-transform/core'), imp('@gltf-transform/extensions'), imp('@gltf-transform/functions'), imp('meshoptimizer'),
]);
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const catalog = JSON.parse(await fs.readFile(path.join(out, 'catalog.json'), 'utf8'));
const manifest = JSON.parse(await fs.readFile(path.join(out, 'source-manifest.json'), 'utf8'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
if (hash(await fs.readFile(sourceZip)) !== manifest.sourceZipSha256) throw Error('Source ZIP SHA-256 mismatch');

// Independent source parser: double-precision OBJ coordinates, no intermediate
// float32 GLB accepted as the reference. No network or extraction to disk here.
const originalParser = String.raw`
import hashlib,json,sys,zipfile
result={}
with zipfile.ZipFile(sys.argv[1]) as z:
 for filename in z.namelist():
  data=z.read(filename);positions=[];faces=[]
  for line in data.decode().splitlines():
   words=line.split()
   if not words:continue
   if words[0]=='v':
    x,y,zz=map(float,words[1:4]);positions.append([x/1000,zz/1000,-y/1000])
   elif words[0]=='f':
    if len(words)!=4:raise ValueError('Non-triangular original')
    idx=[int(w.split('/')[0]) for w in words[1:]]
    faces.append([i-1 if i>0 else len(positions)+i for i in idx])
  result[filename.rsplit('/',1)[-1][:-4]]=dict(positions=positions,faces=faces,sha256=hashlib.sha256(data).hexdigest())
print(json.dumps(result,separators=(',',':')))
`;
const parsed = spawnSync('python', ['-c', originalParser, sourceZip], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
if (parsed.status !== 0) throw Error(parsed.stderr || 'Could not read original OBJ references');
const originals = JSON.parse(parsed.stdout);
if (Object.keys(originals).length !== 26) throw Error('Expected exactly 26 original pilot elements');
const tolerance = 0.00005; // 0.05 mm numerical conversion tolerance, not clinical accuracy.

function canonicalTriangle(a, b, c) {
  // Cyclic permutations retain winding; a reversed triangle does not match.
  return [a + ',' + b + ',' + c, b + ',' + c + ',' + a, c + ',' + a + ',' + b].sort()[0];
}
function globalPosition(position, matrix) {
  const [x, y, z] = position;
  return [matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12],
    matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13],
    matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]];
}
function validateGeometry(node, reference) {
  const sourceKeys = new Map(), canonical = [], sourceMap = [];
  for (const position of reference.positions) {
    const key = position.join(',');
    if (!sourceKeys.has(key)) { sourceKeys.set(key, canonical.length); canonical.push(position); }
    sourceMap.push(sourceKeys.get(key));
  }
  const grid = new Map(), cell = p => p.map(x => Math.floor(x / tolerance));
  canonical.forEach((p, i) => { const key = cell(p).join(','); const bucket = grid.get(key) ?? []; bucket.push(i); grid.set(key, bucket); });
  const sourceFaces = new Map();
  for (const face of reference.faces) {
    const key = canonicalTriangle(...face.map(i => sourceMap[i]));
    sourceFaces.set(key, (sourceFaces.get(key) ?? 0) + 1);
  }
  const world = node.getWorldMatrix(), matched = new Set();
  let triangles = 0, vertices = 0, maxError = 0, squaredError = 0;
  for (const primitive of node.getMesh().listPrimitives()) {
    const position = primitive.getAttribute('POSITION'), indices = primitive.getIndices();
    if (!position || !indices || primitive.getMode() !== 4) throw Error('Expected indexed triangle geometry');
    const decodedMap = [];
    for (let index = 0; index < position.getCount(); index++) {
      const decoded = globalPosition(position.getElement(index, []), world), bin = cell(decoded);
      let nearest = -1, error = Infinity;
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        for (const candidate of grid.get([bin[0] + x, bin[1] + y, bin[2] + z].join(',')) ?? []) {
          const p = canonical[candidate], distance = Math.hypot(decoded[0] - p[0], decoded[1] - p[1], decoded[2] - p[2]);
          if (distance < error) { nearest = candidate; error = distance; }
        }
      }
      if (nearest < 0 || error > tolerance) throw Error(`Source position mismatch ${node.getName()} vertex ${index}: ${error} m`);
      decodedMap.push(nearest); matched.add(nearest); maxError = Math.max(maxError, error); squaredError += error * error; vertices++;
    }
    for (let index = 0; index < indices.getCount(); index += 3) {
      const key = canonicalTriangle(...[0, 1, 2].map(i => decodedMap[indices.getScalar(index + i)]));
      const remaining = sourceFaces.get(key) ?? 0;
      if (remaining < 1) throw Error(`Decoded triangle does not match source topology/winding: ${node.getName()} #${index / 3}`);
      sourceFaces.set(key, remaining - 1); triangles++;
    }
  }
  if ([...sourceFaces.values()].some(count => count !== 0)) throw Error('Original triangle lost: ' + node.getName());
  const usedSource = new Set(reference.faces.flat().map(i => sourceMap[i]));
  if ([...usedSource].some(i => !matched.has(i))) throw Error('Used original position lost: ' + node.getName());
  return { triangles, vertices, uniqueUsedSourcePositions: usedSource.size, maxPositionErrorMetres: maxError,
    rmsPositionErrorMetres: Math.sqrt(squaredError / vertices), triangleMultisetAndWindingPreserved: true };
}

const report = { pipeline: '@gltf-transform 4.5.0; meshoptimizer 1.2.0', positionBits: 32, positionQuantization: false, normalBits: 12,
  additionalDecimation: false, transform: manifest.transform, numericalToleranceMetres: tolerance,
  numericalToleranceScope: 'Maximum Euclidean source-to-decoded position error; not anatomical/clinical accuracy.',
  method: 'Original OBJ double coordinates transformed once; decoded GLB world positions nearest-matched within 0.05 mm; every oriented source triangle and duplicate occurrence matched, and every used source position retained.',
  sourceZipSha256: manifest.sourceZipSha256, modules: [], totalBytes: 0, totalTriangles: 0, totalMeshes: 0,
  totalVertices: 0, totalDecodedAccessorBytes: 0, maxPositionErrorMetres: 0, maxBoundsErrorMetres: 0 };
for (const asset of catalog.assets) {
  const file = path.join(out, path.basename(asset.path));
  const doc = await io.read(file);
  const compressed = doc.getRoot().listExtensionsUsed().some(e => e.extensionName === 'EXT_meshopt_compression');
  if (!verifyOnly) {
    if (compressed) throw Error('Run build-muscular-pilot.py first; do not repeatedly quantize output.');
    // Source positions can be much closer than a 16-bit grid interval. Retain
    // float32 POSITION losslessly under Meshopt; quantize only display normals.
    await doc.transform(reorder({ encoder: MeshoptEncoder, target: 'size' }),
      quantize({ pattern: /^NORMAL$/, patternTargets: /^NORMAL$/, quantizeNormal: 12 }));
    // glTF requires this declaration for normalized INT16 normals even when
    // positions remain FLOAT. Declare explicitly for the normal-only case.
    doc.createExtension(KHRMeshQuantization).setRequired(true);
    doc.createExtension(EXTMeshoptCompression).setRequired(true)
      .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
    await io.write(file, doc);
  } else if (!compressed) throw Error('Final pilot module must use Meshopt');
  const verified = await io.read(file);
  const meshNodes = verified.getRoot().listNodes().filter(n => n.getMesh());
  const expected = catalog.nodes.flatMap(n => n.assetIds.includes(asset.id) ? n.meshNames : []).sort();
  if (JSON.stringify(meshNodes.map(n => n.getName()).sort()) !== JSON.stringify(expected)) throw Error('Mesh ownership changed: ' + asset.id);
  const module = { id: asset.id, bytes: 0, sha256: '', meshes: meshNodes.length, triangles: 0, vertices: 0,
    materials: verified.getRoot().listMaterials().length, decodedAccessorBytes: 0,
    compression: verified.getRoot().listExtensionsUsed().map(e => e.extensionName).sort(),
    maxPositionErrorMetres: 0, maxBoundsErrorMetres: 0, elements: [] };
  for (const node of meshNodes) {
    const extras = node.getExtras(), owner = catalog.nodes.find(n => n.id === extras.anatomyId);
    const source = manifest.files.find(f => f.elementId === extras.sourceElement), original = originals[extras.sourceElement];
    if (!owner || !source || source.sourceId !== extras.sourceId || owner.sourceId !== extras.sourceId ||
      owner.id !== source.anatomyId || !owner.meshNames.includes(node.getName()) || original.sha256 !== source.sha256) throw Error('FMA/FJ identity changed');
    const geometric = validateGeometry(node, original);
    if (geometric.triangles !== source.triangles) throw Error('Triangle count changed: ' + extras.sourceElement);
    const bounds = getBounds(node);
    let boundsError = 0;
    for (let i = 0; i < 3; i++) boundsError = Math.max(boundsError,
      Math.abs(bounds.min[i] - owner.bounds[0][i]), Math.abs(bounds.max[i] - owner.bounds[1][i]));
    if (boundsError > tolerance) throw Error('Original anatomical bounds changed');
    module.elements.push({ elementId: extras.sourceElement, sourceId: extras.sourceId, anatomyId: owner.id,
      side: owner.side, ...geometric, maxBoundsErrorMetres: boundsError });
    module.triangles += geometric.triangles; module.vertices += geometric.vertices;
    module.maxPositionErrorMetres = Math.max(module.maxPositionErrorMetres, geometric.maxPositionErrorMetres);
    module.maxBoundsErrorMetres = Math.max(module.maxBoundsErrorMetres, boundsError);
  }
  const accessors = new Set(meshNodes.flatMap(n => n.getMesh().listPrimitives().flatMap(p => [...p.listAttributes(), p.getIndices()])));
  module.decodedAccessorBytes = [...accessors].reduce((sum, accessor) => sum + accessor.getArray().byteLength, 0);
  const data = await fs.readFile(file); module.bytes = data.byteLength; module.sha256 = hash(data);
  if (verifyOnly && (asset.bytes !== module.bytes || asset.sha256 !== module.sha256)) throw Error('Final asset checksum changed');
  asset.bytes = module.bytes; asset.sha256 = module.sha256;
  if (asset.meshCount !== module.meshes || asset.triangles !== module.triangles) throw Error('Asset coverage mismatch');
  report.modules.push(module); report.totalBytes += module.bytes; report.totalMeshes += module.meshes;
  report.totalTriangles += module.triangles; report.totalVertices += module.vertices;
  report.totalDecodedAccessorBytes += module.decodedAccessorBytes;
  report.maxPositionErrorMetres = Math.max(report.maxPositionErrorMetres, module.maxPositionErrorMetres);
  report.maxBoundsErrorMetres = Math.max(report.maxBoundsErrorMetres, module.maxBoundsErrorMetres);
}
if (report.totalMeshes !== 26 || catalog.nodes.filter(n => n.kind === 'structure').length !== 16 || catalog.coverage.structures !== 16) throw Error('Expected 16 muscles / 26 components');
if (!verifyOnly) {
  await fs.writeFile(path.join(out, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n');
  await fs.writeFile(path.join(out, 'validation.json'), JSON.stringify(report, null, 2) + '\n');
} else {
  const saved = JSON.parse(await fs.readFile(path.join(out, 'validation.json'), 'utf8'));
  if (JSON.stringify(saved) !== JSON.stringify(report)) throw Error('Saved numerical validation report differs from rechecked geometry');
}
console.log(JSON.stringify({ totalBytes: report.totalBytes, totalMeshes: report.totalMeshes, totalTriangles: report.totalTriangles,
  totalVertices: report.totalVertices, totalDecodedAccessorBytes: report.totalDecodedAccessorBytes,
  maxPositionErrorMetres: report.maxPositionErrorMetres, maxBoundsErrorMetres: report.maxBoundsErrorMetres,
  allOrientedSourceTrianglesPreserved: true, verifiedOnly: verifyOnly }, null, 2));
