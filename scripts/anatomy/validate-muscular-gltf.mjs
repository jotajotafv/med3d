// Validate final compressed assets and the independently decoded representation.
// The validator does not implement Meshopt itself; decoding closes that gap.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const require=createRequire(path.join(root,'.cache/anatomy-tools/package.json'));
const load=async name=>import(pathToFileURL(require.resolve(name)));
const [{NodeIO},{ALL_EXTENSIONS},{MeshoptDecoder},validator]=await Promise.all([
  load('@gltf-transform/core'),load('@gltf-transform/extensions'),load('meshoptimizer'),load('gltf-validator'),
]);
await MeshoptDecoder.ready;
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
const catalog=JSON.parse(await readFile(path.join(root,'public/models/anatomy/muscular/catalog.json'),'utf8'));
const selectedAsset=process.argv.includes('--asset')?process.argv[process.argv.indexOf('--asset')+1]:undefined;
if(selectedAsset)assert.ok(catalog.assets.some(asset=>asset.id===selectedAsset),'Requested real module exists');
const result={validator:validator.version(),modules:[]};
for(const asset of catalog.assets.filter(asset=>!selectedAsset||asset.id===selectedAsset)){
  const bytes=await readFile(path.join(root,'public',asset.path));
  const raw=await validator.validateBytes(new Uint8Array(bytes),{uri:path.basename(asset.path)});
  const document=await io.readBinary(bytes);
  document.getRoot().listExtensionsUsed().filter(extension=>extension.extensionName==='EXT_meshopt_compression').forEach(extension=>extension.dispose());
  const decodedBytes=await io.writeBinary(document);
  const decoded=await validator.validateBytes(decodedBytes,{uri:'decoded-'+path.basename(asset.path)});
  result.modules.push({id:asset.id,sha256:asset.sha256,raw:raw.issues,decoded:decoded.issues});
  assert.equal(raw.issues.numErrors,0,asset.id+' compressed errors');
  assert.equal(raw.issues.numWarnings,0,asset.id+' compressed warnings');
  assert.equal(decoded.issues.numErrors,0,asset.id+' decoded errors');
  assert.equal(decoded.issues.numWarnings,0,asset.id+' decoded warnings');
}
const output=path.resolve(process.env.QA_OUTPUT_DIR||path.join(root,'.cache/phase3b'));
await mkdir(output,{recursive:true});
await writeFile(path.join(output,'gltf-validation.json'),JSON.stringify(result,null,2)+'\n');
console.log('All '+result.modules.length+' final muscular GLBs: zero errors and warnings, compressed and decoded.');
