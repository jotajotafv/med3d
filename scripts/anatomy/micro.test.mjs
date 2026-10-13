import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseSwc, swcSegments} from '../../src/features/anatomy/micro/swc.ts';
import {MICRO_MODULES, microModulesFor} from '../../src/features/anatomy/micro/registry.ts';

test('Original neuronal tracing: exact source bytes, every edge, radii, bounds and no body registration', async () => {
  const bytes = await readFile('public/models/anatomy/micro/neuron-102401.swc');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '7413e4f2be7bfa75e2c46492348a851f8496ee15ba0790cb0273cdc6104357c5');
  const points = parseSwc(bytes.toString()), edges = swcSegments(points);
  assert.equal(points.length, 17990); assert.equal(edges.length, 17989);
  assert.deepEqual(points[0], {id:1,type:1,x:1156.6641,y:664.3345,z:26.04,radius:6.7782,parent:-1});
  assert.ok(edges.every(edge => edge.to.parent === edge.from.id));
  assert.ok(points.every(point => point.radius > 0));
});
test('Reject malformed, duplicate, disconnected and cyclic SWC instead of inventing missing geometry', () => {
  const root='1 1 0 0 0 1 -1\n';
  for (const invalid of ['', root+'2 2 NaN 0 0 1 1', root+'2 2 0 0 0 -1 1', root+root, root+'2 2 0 0 0 1 99', root+'2 2 1 0 0 1 3\n3 2 2 0 0 1 2']) assert.throws(() => parseSwc(invalid));
});
test('SWC parent order is independent of file order; retain coordinates without normalization', () => {
  const points=parseSwc('2 2 12 35 8 .4 1\n1 1 10 30 5 2 -1');
  assert.deepEqual(swcSegments(points)[0], {from:points[1],to:points[0]});
});
test('Micro modules link only to existing parents and remain outside the eleven body systems', async () => {
  const catalogs=await Promise.all(['nervous','urinary'].map(async system => JSON.parse(await readFile('public/models/anatomy/'+system+'/catalog.json','utf8'))));
  const ids=new Set(catalogs.flatMap(catalog=>catalog.nodes.map(node=>node.id)));
  for (const module of MICRO_MODULES) {
    assert.ok(module.parentIds.every(id=>ids.has(id))); assert.ok(module.parentIds.every(id=>microModulesFor(id).includes(module)));
    assert.ok(!ids.has(module.id)); await readFile('public/'+module.path);
    for (const field of ['description','function','relations','limitation','source','license','attribution']) assert.ok(module[field]);
  }
  assert.deepEqual(microModulesFor('unknown'), []);
});
