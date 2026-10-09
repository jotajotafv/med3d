import { SYSTEMS } from '../../anatomy/atlas/catalog-index';
import { composeBodyCatalog } from '../../anatomy/atlas/body-catalog';
import { withOcularCoverage } from '../../anatomy/atlas/ocular-catalog';
import type { AnatomyCatalog, AnatomyNode, SystemId } from '../../anatomy/atlas/types';

export const XR_ATLAS_SYSTEM_IDS = ['skeletal', 'muscular', 'nervous', 'cardiovascular', 'respiratory',
  'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary'] as const satisfies readonly SystemId[];
export type XrAtlasSystem = typeof XR_ATLAS_SYSTEM_IDS[number];
export const isXrAtlasSystem = (value?: string): value is XrAtlasSystem => XR_ATLAS_SYSTEM_IDS.some(id => id === value);

// Presentation tones match AtlasScene. Anatomical identities and lessons remain in its catalogs/resolvers.
const colors: Record<XrAtlasSystem, string> = {
  skeletal: '#d7c6a1', muscular: '#b67070', nervous: '#cbb05b', cardiovascular: '#ba7770',
  respiratory: '#caa1a1', digestive: '#c49f8c', urinary: '#af8175', endocrine: '#bba287',
  lymphatic: '#94b29a', reproductive: '#b9969a', integumentary: '#cdb3a0',
};
const ocularColors: Record<string, string> = { cornea: '#b2ced0', sclera: '#dbd7c9', iris: '#6b8183' };
const categories: Partial<Record<XrAtlasSystem, (node: AnatomyNode) => string>> = {
  cardiovascular: node => ({ arterial: '#b5635e', venous: '#648fab', heart: '#a96d78' }[node.vascularClass || 'heart']),
  nervous: node => ocularColors[node.family || ''] || colors.nervous,
  respiratory: node => node.respiratoryClass === 'parenchyma' ? '#bd9fa6' : node.respiratoryClass === 'cartilage' ? '#a9b9b7' : '#729dab',
  digestive: node => ({ tract: '#b47d72', liver: '#875952', biliary: '#819274', gland: '#bfaa82' }[node.digestiveClass || 'tract']),
};
export const XR_ATLAS_SYSTEMS = XR_ATLAS_SYSTEM_IDS.map(id => ({
  id, name: SYSTEMS.find(system => system.id === id)!.name,
  label: SYSTEMS.find(system => system.id === id)!.name.replace(/^Sistema /, '').replace(/^./, letter => letter.toUpperCase()),
  defaultVisible: id === 'skeletal',
  catalogPaths: (id === 'nervous' ? ['nervous', 'ocular'] : [id]).map(folder => `models/anatomy/${folder}/catalog.json`),
  color: categories[id] || (() => colors[id]),
}));
export const xrSystem = (id: XrAtlasSystem) => XR_ATLAS_SYSTEMS.find(system => system.id === id)!;

/** Same ocular composition as the main Atlas, fetched only when Nervioso is requested. */
export async function loadXrCatalog(system: XrAtlasSystem, signal: AbortSignal): Promise<AnatomyCatalog> {
  const catalogs: AnatomyCatalog[] = [];
  for (const path of xrSystem(system).catalogPaths) {
    const response = await fetch(import.meta.env.BASE_URL + path, { signal });
    if (!response.ok) throw new Error('No se pudo cargar el catálogo del sistema.');
    catalogs.push(await response.json());
  }
  return catalogs.length === 2 ? withOcularCoverage(catalogs[0], catalogs[1]) : catalogs[0];
}

export function composeXrCatalog(catalogs: Partial<Record<XrAtlasSystem, AnatomyCatalog>>) {
  return catalogs.skeletal ? composeBodyCatalog(catalogs.skeletal, catalogs.muscular, catalogs.nervous,
    catalogs.cardiovascular, catalogs.respiratory, catalogs.digestive,
    ...(['urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary'] as const)
      .flatMap(id => catalogs[id] ? [catalogs[id]!] : [])) : null;
}
