import fs from 'node:fs/promises';import {execFileSync} from 'node:child_process';import ts from 'typescript';import assert from 'node:assert/strict';
const path='src/features/anatomy/atlas/AtlasScene.tsx',source=execFileSync('git',['show','bd4756ff6c0a84427e2c0326c4e89815e690a5f1:'+path],{encoding:'utf8'});
const key=source.slice(source.indexOf('const materialKey ='),source.indexOf('function useMaterials'));
const start=source.indexOf('    const hiddenIds = new Set(hidden);'),end=source.indexOf('    invalidate();',start);
const body=source.slice(start,end);
const code=ts.transpileModule(key+'\nfunction run({THREE,parts,hidden,isolated,contextIds,opacityBySystem,materials,selected,hovered,skinAllowsRaycast}){'+body+'}\n',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const {run,materialKey}=new Function(code+'\nreturn {run,materialKey};')();
const after=ts.transpileModule((await fs.readFile('src/features/anatomy/atlas/highlight-controller.ts','utf8')).replace('export function','function'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const create=new Function(after+'\nreturn createHighlightController;')();
const systems=['skeletal','muscular','nervous','cardiovascular','respiratory','digestive','urinary','endocrine','lymphatic','reproductive','integumentary'];const cats=await Promise.all(systems.map(s=>fs.readFile('public/models/anatomy/'+s+'/catalog.json','utf8').then(JSON.parse)));const byId=new Map(cats.flatMap(c=>c.nodes).map(n=>[n.id,n]));
const parts=cats.flatMap(c=>c.nodes).flatMap(node=>node.meshNames.map(()=>{const ancestors=new Set();let current=node;while(current){ancestors.add(current.id);current=byId.get(current.parentId);}return {node,ancestors,mesh:{visible:true,material:null}};}));
const materials=new Map(parts.map(({node:n})=>[materialKey(n.systemId,n.family,n.vascularClass,n.respiratoryClass,n.digestiveClass),{systemId:n.systemId,base:{},selected:{},hover:{}}]));
const variant=p=>materials.get(materialKey(p.node.systemId,p.node.family,p.node.vascularClass,p.node.respiratoryClass,p.node.digestiveClass));
const options={THREE:{Mesh:{prototype:{raycast(){}}}},parts,hidden:[],isolated:null,contextIds:[],opacityBySystem:{},materials,selected:null,hovered:null,skinAllowsRaycast:(opacity,interior)=>!interior||opacity>=.999};
let writes=0;const update=create(parts,(part,key)=>{part.mesh.material=variant(part)[key];writes++;});update(null,null);
const ids=parts.map(p=>p.node.id);const iterations=2000;
function time(fn){const start=performance.now();for(let i=0;i<iterations;i++)fn(ids[(i*7)%ids.length]);return performance.now()-start;}
time(id=>run({...options,hovered:id}));time(id=>update(null,id));const samples=[];
for(let round=0;round<7;round++){
 const before=time(id=>run({...options,hovered:id}));writes=0;const after=time(id=>update(null,id));samples.push({beforeMs:before,afterMs:after,materialUpdatesBefore:parts.length*iterations,materialUpdatesAfter:writes});
}
const referenceParts=parts.map(p=>({...p,mesh:{...p.mesh}}));
for(const selected of [null,'muscular','nervous:cranial','bp3d:FMA50875'])for(const hovered of [null,ids[0],ids[200]]){
 run({...options,parts:referenceParts,selected,hovered});const expected=referenceParts.map(p=>p.mesh.material);update(selected,hovered);assert.deepEqual(parts.map(p=>p.mesh.material),expected);
}
const median=key=>samples.map(s=>s[key]).sort((a,b)=>a-b)[3];const report={scope:'CPU-only replay of 2000 hover changes over the 931-mesh Phase 9 catalog; exact old effect extracted from Git vs actual new highlight controller. Does not measure GPU, event latency, VRAM or FPS.',baselineCommit:'bd4756ff6c0a84427e2c0326c4e89815e690a5f1',parts:parts.length,iterations,rounds:7,medianBeforeMs:median('beforeMs'),medianAfterMs:median('afterMs'),samples};
await fs.writeFile('.cache/phase10/highlight-profile.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
