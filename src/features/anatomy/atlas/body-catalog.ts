import { createCatalogIndex } from './catalog-index';
import type { AnatomyCatalog, AnatomyNode, AssetProvenance } from './types';

export const BODY_ROOT_ID = 'body';

/** Compose registered sources without changing their IDs or source files.
 * The skeletal whole-body frame remains the fixed viewer reference even when
 * only a single muscular module is enabled. This is not a registration solver.
 */
export function composeBodyCatalog(skeletal: AnatomyCatalog, muscular?: AnatomyCatalog): AnatomyCatalog {
  const catalogs = muscular ? [skeletal, muscular] : [skeletal];
  const reference = skeletal.frame;
  if (reference.units !== 'metres' || reference.up !== 'Y') throw new Error('El cuerpo requiere el marco común en metros con eje superior Y.');
  const provenance = new Map<string, AssetProvenance>();
  for (const catalog of catalogs) {
    createCatalogIndex(catalog);
    if (catalog.schemaVersion !== 1 || catalog.frame.id !== reference.id || catalog.frame.units !== reference.units || catalog.frame.up !== reference.up) {
      throw new Error('Los catálogos no comparten un marco anatómico registrado.');
    }
    if (catalog.nodes.some(node => node.kind === 'body' || node.id === BODY_ROOT_ID)) throw new Error('La composición requiere catálogos fuente sin otra raíz corporal.');
    for (const item of catalog.provenance) {
      const previous = provenance.get(item.id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(item)) throw new Error(`La procedencia ${item.id} tiene definiciones diferentes.`);
      provenance.set(item.id, item);
    }
    for (const asset of catalog.assets) {
      if (asset.frameId !== reference.id) throw new Error(`El módulo ${asset.id} no comparte el marco anatómico corporal.`);
      if (!catalog.provenance.some(item => item.id === asset.provenanceId)) throw new Error(`Falta la procedencia de ${asset.id}.`);
    }
  }
  const roots = catalogs.flatMap(catalog => catalog.nodes.filter(node => !node.parentId).map(node => node.id));
  const nodes = catalogs.flatMap(catalog => catalog.nodes.map(node => {
    // The pilot crosses shoulder, elbow and forearm attachments. Move the whole
    // upper limb as one regional block rather than pulling layers off joints.
    const upperSide = node.systemId === 'muscular'
      ? /(?:^|:)arm-(right|left)(?::|$)/.exec(node.regionId)?.[1]
      : /^skeletal:region:arm-(right|left)$/.exec(node.regionId)?.[1];
    return {
      ...node,
      aliases: [...node.aliases], children: [...node.children], assetIds: [...node.assetIds],
      meshNames: [...node.meshNames], relatedIds: [...node.relatedIds],
      ...(!node.parentId ? { parentId: BODY_ROOT_ID } : {}),
      ...(upperSide ? { explosionRegionId: `upper-limb-${upperSide}` } : {}),
    };
  }));
  const assets = catalogs.flatMap(catalog => catalog.assets);
  const root: AnatomyNode = {
    id: BODY_ROOT_ID, name: 'Cuerpo humano', anatomicalName: 'Cuerpo humano',
    aliases: ['cuerpo', 'human body'], regionId: BODY_ROOT_ID, kind: 'body',
    children: roots, assetIds: assets.map(asset => asset.id), meshNames: [], relatedIds: [],
    bounds: structuredClone(reference.bounds),
  };
  const result: AnatomyCatalog = {
    schemaVersion: 1, id: 'med3d-body-phase3a', frame: structuredClone(reference),
    nodes: [root, ...nodes], assets, provenance: [...provenance.values()],
    coverage: {
      title: muscular ? 'Sistema óseo y piloto muscular bilateral de hombro y brazo' : skeletal.coverage.title,
      structures: catalogs.reduce((sum, catalog) => sum + catalog.coverage.structures, 0),
      meshes: catalogs.reduce((sum, catalog) => sum + catalog.coverage.meshes, 0),
      note: catalogs.map(catalog => catalog.coverage.note).join(' '),
      limitations: [...new Set(catalogs.flatMap(catalog => catalog.coverage.limitations))],
    },
  };
  createCatalogIndex(result);
  return result;
}
