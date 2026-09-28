// Re-capture only four views displaying the corrected stomach region label.
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd(),folder=path.join(root,'docs/phase7/captures');
const previous=JSON.parse(await readFile(path.join(folder,'digestive-captures.json'),'utf8'));
assert.equal(previous.success,true);assert.equal(previous.captures.length,30);
await copyFile(path.join(folder,'digestive-captures.json'),path.join(root,'docs/phase7/pre-label-captures.json'));
let source=await readFile(path.join(root,'scripts/anatomy/digestive-qa.mjs'),'utf8');
source=source.replace("'./browser-qa.mjs'",JSON.stringify(pathToFileURL(path.join(root,'scripts/anatomy/browser-qa.mjs')).href));
const start=source.indexOf('async function captures(){'),end=source.indexOf('\ntry{await withinQaDeadline',start);
assert.ok(start>0&&end>start);
source=source.slice(0,start)+`async function captures(){
 await goto('digestive');await chooseId('dig:FMA7148');await h.view('anterior');
 assert.ok(!(await page.locator('.atlas-detail-content').innerText()).includes('Órganos accesorios abdominales'));
 await shot('18-estomago-seleccionado');await action('Aislar');await shot('19-estomago-aislado');await action('Ver conjunto');
 await structures();await page.getByRole('textbox',{name:'Buscar estructura anatómica'}).fill('estomago');await shot('24-busqueda-global');
 await clearSearch();await page.getByRole('button',{name:'Árbol anatómico',exact:true}).click();await shot('25-arbol-global');
 check('Stomach is an organ of the digestive tract with its own region label; selection, isolation, search and tree');
}
`+source.slice(end);
process.argv.push('--captures');process.env.QA_OUTPUT_DIR='.cache/phase7/revised-captures';
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const current=JSON.parse(await readFile(path.join(root,'.cache/phase7/revised-captures/digestive-captures.json'),'utf8'));
assert.equal(current.success,true);assert.equal(current.captures.length,4);assert.equal(current.implementationDirty,false);
await writeFile(path.join(root,'docs/phase7/label-correction-browser.json'),JSON.stringify(current,null,2)+'\n');
const archive=path.join(root,'docs/phase7/pre-label-review');await mkdir(archive,{recursive:true});
for(const c of current.captures){await copyFile(path.join(folder,c.file),path.join(archive,c.file));await copyFile(path.join(root,'.cache/phase7/revised-captures',c.file),path.join(folder,c.file));}
const revised=new Map(current.captures.map(c=>[c.file,c]));
const captures=previous.captures.map(c=>({...revised.get(c.file)||c,observedCodeCommit:revised.has(c.file)?current.codeCommit:previous.codeCommit}));
const merged={...previous,codeCommit:current.codeCommit,captures,sourceCodeCommits:[previous.codeCommit,current.codeCommit],completion:'30 reviewed final views: 26 unaffected views from pre-label code; four stomach-label views re-captured after targeted correction.',constituentReports:[...previous.constituentReports,'../label-correction-browser.json'],labelCorrection:'Only stomach region metadata and capture orchestration changed; no geometry or rendering changes.'};
await writeFile(path.join(folder,'digestive-captures.json'),JSON.stringify(merged,null,2)+'\n');
console.log('COMPLETE: four corrected views, 30 final captures with per-image commit provenance.');
