// Evidence-only continuation: captures 01–22 already exist from the frozen code.
// The initial capture sequence deselected the target before attempting Enfocar.
// Re-select Digestivo before capture 23; retain all assertions and original results.
import assert from 'node:assert/strict';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd(),folder=path.join(root,'docs/phase7/captures');
const first=JSON.parse(await readFile(path.join(folder,'digestive-captures.json'),'utf8'));
assert.equal(first.success,false);assert.equal(first.captures.length,22);
assert.match(first.error,/Inspección/);
await copyFile(path.join(folder,'digestive-captures.json'),path.join(root,'docs/phase7/initial-captures.json'));
let source=await readFile(path.join(root,'scripts/anatomy/digestive-qa.mjs'),'utf8');
source=source.replace("'./browser-qa.mjs'",JSON.stringify(pathToFileURL(path.join(root,'scripts/anatomy/browser-qa.mjs')).href));
const start=source.indexOf('async function captures(){');
const tail=source.indexOf(" await explode('structures',100);await action('Enfocar');",start);
assert.ok(start>0&&tail>start);
source=source.slice(0,start)+"async function captures(){\n await goto('digestive');await chooseId('digestive');\n"+source.slice(tail);
process.argv.push('--captures');process.env.QA_OUTPUT_DIR='docs/phase7/captures';
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const last=JSON.parse(await readFile(path.join(folder,'digestive-captures.json'),'utf8'));
assert.equal(last.success,true);assert.equal(last.captures.length,8);
assert.equal(last.codeCommit,first.codeCommit);assert.equal(last.implementationDirty,false);
await writeFile(path.join(root,'docs/phase7/captures-continuation.json'),JSON.stringify(last,null,2)+'\n');
const merged={...last,captures:[...first.captures,...last.captures],completion:'Two runs: original 01–22, selection-corrected continuation 23–30. No product changes or assertions removed.',constituentReports:['../initial-captures.json','../captures-continuation.json'],initialAutomationFailure:first.error};
assert.equal(new Set(merged.captures.map(x=>x.file)).size,30);
await writeFile(path.join(folder,'digestive-captures.json'),JSON.stringify(merged,null,2)+'\n');
console.log('COMPLETE: 30 captures, with original automation failure preserved.');
