// Keep the original Fase 3A regression cohort explicit as the live catalog grows.
// This is a test view of the real source catalog, never a replacement asset.
import assert from 'node:assert/strict';

export const PILOT_ASSET_IDS = ['muscular:upper-right', 'muscular:upper-left'];
export const PILOT_FAMILIES = ['deltoid', 'bicepsbrachii', 'tricepsbrachii', 'brachialis', 'supraspinatus', 'infraspinatus', 'teresminor', 'subscapularis'];
export const PILOT_MODULE_QUERY = 'modules=' + PILOT_ASSET_IDS.join(',');

export function pilotCatalog(source) {
  const catalog = structuredClone(source), ids = new Set(PILOT_ASSET_IDS);
  catalog.assets = catalog.assets.filter(asset => ids.has(asset.id));
  assert.deepEqual(new Set(catalog.assets.map(asset => asset.id)), ids, 'Both original Fase 3A modules must remain available');
  catalog.nodes = catalog.nodes.filter(node => node.id === 'muscular' || node.assetIds.some(id => ids.has(id)));
  const nodes = new Set(catalog.nodes.map(node => node.id));
  for (const node of catalog.nodes) {
    node.assetIds = node.assetIds.filter(id => ids.has(id));
    node.children = node.children.filter(id => nodes.has(id));
    node.relatedIds = node.relatedIds.filter(id => nodes.has(id) || !id.startsWith('muscular:'));
  }
  const root = catalog.nodes.find(node => node.id === 'muscular');
  root.bounds = [0, 1].map(end => [0, 1, 2].map(axis => Math[end ? 'max' : 'min'](...catalog.assets.map(asset => asset.bounds[end][axis]))));
  catalog.coverage = {
    ...catalog.coverage,
    title: 'Sistema muscular · regresión del piloto de hombro y brazo',
    structures: catalog.nodes.filter(node => node.kind === 'structure').length,
    meshes: catalog.assets.reduce((sum, asset) => sum + asset.meshCount, 0),
    note: 'Cohorte original Fase 3A: 16 músculos, 26 mallas y 2 módulos; el catálogo público conserva todas las regiones disponibles.',
  };
  return catalog;
}
