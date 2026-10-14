import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {atlasTestCompiler} from './atlas-test-compiler.mjs';
const out=path.resolve('.cache/unified-system-tests'),compile=atlasTestCompiler(out);
await compile('features/xr/atlas/assets.ts');
const load=p=>import(pathToFileURL(path.join(out,p+'.mjs')));
const {initialAtlasAssets,prioritizeAtlasAssets}=await load('features/anatomy/atlas/initial-assets');
const {AtlasAssetManager}=await load('features/anatomy/atlas/asset-manager');
const {XrAtlasAssets}=await load('features/xr/atlas/assets');
const catalog=JSON.parse(await readFile('public/models/anatomy/skeletal/catalog.json','utf8'));
const base=catalog.assets.find(a=>a.defaultEnabled!==false),extra=catalog.assets.find(a=>a.defaultEnabled===false);
// Two-module fixture only; production catalogs are read-only.
const small={...catalog,assets:[extra,base],nodes:catalog.nodes.map(node=>({...node,assetIds:node.assetIds.filter(id=>[base.id,extra.id].includes(id))}))};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const settle=async()=>{for(let i=0;i<10;i++)await tick();};
test('system activation includes all approved modules, base first; regional links remain explicit',()=>{
  assert.deepEqual(initialAtlasAssets(small,['skeletal']),[base.id,extra.id]);
  assert.deepEqual(initialAtlasAssets(small,[]),[]);
  assert.deepEqual(initialAtlasAssets(small,[],[], 'skeletal'),[base.id,extra.id]);
  assert.deepEqual(prioritizeAtlasAssets(small.assets),[base,extra]);
  assert.deepEqual(small.assets,[extra,base],'does not mutate catalog');
});
test('base renders while addition is pending; OFF hides, ON reuses, failed additions retry and cleanup is exact',async()=>{
  const calls=[],freed=[],finish=new Map();
  const manager=new AtlasAssetManager(small,asset=>new Promise((resolve,reject)=>{
    calls.push(asset.id);finish.set(asset.id,{resolve:()=>resolve({asset,parts:[],dispose:()=>freed.push(asset.id)}),reject});
  }),1,true);
  manager.setDesired(prioritizeAtlasAssets(small.assets).map(a=>a.id));assert.deepEqual(calls,[base.id]);
  finish.get(base.id).resolve();await settle();
  const ready=manager.snapshot().resources[0];
  assert.equal(ready.asset.id,base.id);assert.equal(manager.snapshot().statuses.find(s=>s.id===extra.id).state,'loading');
  finish.get(extra.id).reject(Error('simulated error'));await settle();
  assert.equal(manager.snapshot().resources[0],ready);assert.equal(manager.snapshot().statuses.find(s=>s.id===extra.id).state,'error');
  manager.retry();finish.get(extra.id).resolve();await settle();
  const resources=manager.snapshot().resources;
  manager.setDesired([]);assert.deepEqual(manager.snapshot().resources,[]);assert.deepEqual(freed,[]);
  manager.setDesired(prioritizeAtlasAssets(small.assets).map(a=>a.id));assert.deepEqual(manager.snapshot().resources,resources);assert.deepEqual(calls,[base.id,extra.id,extra.id]);
  manager.dispose();manager.dispose();assert.deepEqual(freed,[base.id,extra.id]);
});
test('XR one toggle loads base then additions automatically and OFF cancels queued additions, preserving ready resources',async()=>{
  const calls=[],finish=new Map(),freed=[];
  const owner=new XrAtlasAssets(async()=>small,c=>new AtlasAssetManager(c,asset=>new Promise(resolve=>{
    calls.push(asset.id);finish.set(asset.id,()=>resolve({asset,parts:[],dispose:()=>freed.push(asset.id)}));
  }),1));
  await owner.ensure('skeletal');assert.deepEqual(calls,[base.id]);
  owner.disable('skeletal');finish.get(base.id)();await settle();
  assert.deepEqual(calls,[base.id]);assert.equal(owner.snapshot().systems.skeletal.pending,false);
  const resource=owner.snapshot().resources[0];
  await owner.ensure('skeletal');assert.deepEqual(calls,[base.id,extra.id]);assert.equal(owner.snapshot().resources[0],resource);
  finish.get(extra.id)();await settle();const resources=owner.snapshot().resources;
  owner.disable('skeletal');await owner.ensure('skeletal');await settle();
  assert.equal(owner.snapshot().resources,resources);assert.deepEqual(calls,[base.id,extra.id]);
  owner.dispose();assert.deepEqual(freed,[base.id,extra.id]);
});
test('XR OFF during catalog loading never starts geometry; reactivation resumes lazily',async()=>{
  let resolveCatalog;const calls=[];
  const owner=new XrAtlasAssets(()=>new Promise(resolve=>resolveCatalog=resolve),c=>new AtlasAssetManager(c,async asset=>{
    calls.push(asset.id);return {asset,parts:[],dispose(){}};
  },1));
  const started=owner.ensure('skeletal');owner.disable('skeletal');resolveCatalog(small);await started;await settle();
  assert.deepEqual(calls,[]);await owner.ensure('skeletal');await settle();assert.deepEqual(calls,[base.id,extra.id]);owner.dispose();
});
test('public XR has one toggle per system and no expansion state or control; scrolling stays registered',async()=>{
  const ui=await readFile('src/features/xr/atlas/XrAtlasExperience.tsx','utf8');
  assert.doesNotMatch(ui,/Ampliación anatómica|optionalSystems|type: 'optional'/);
  assert.equal((ui.match(/type="checkbox"/g)||[]).length,1);
  assert.match(ui,/system \+ '-toggle'/);assert.match(ui,/systems-scroll/);assert.match(ui,/data-xr-hand-kind="scroll-region"/);
});

test('XR can reactivate after a catalog failure without retaining the old error', async()=>{
  let attempts=0;
  const owner=new XrAtlasAssets(async()=>{if(++attempts===1)throw Error('catalog unavailable');return small;}, c=>new AtlasAssetManager(c,async asset=>({asset,parts:[],dispose(){}}),1));
  await owner.ensure('skeletal');assert.ok(owner.snapshot().systems.skeletal.error);
  owner.disable('skeletal');await owner.ensure('skeletal');await settle();
  assert.equal(owner.snapshot().systems.skeletal.error,undefined);assert.equal(owner.snapshot().resources.length,2);owner.dispose();
});
