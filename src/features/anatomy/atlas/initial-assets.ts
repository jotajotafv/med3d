import type {AnatomyAsset, AnatomyCatalog, SystemId} from './types';

/** Historical modules first; catalog flags are retained only as queue priority. */
export function prioritizeAtlasAssets(assets: readonly AnatomyAsset[]): AnatomyAsset[] {
  return [...assets.filter(asset => asset.defaultEnabled !== false), ...assets.filter(asset => asset.defaultEnabled === false)];
}

/** A system includes every approved module. Explicit regional links remain narrow. */
export function initialAtlasAssets(catalog: AnatomyCatalog, systems: string[], modules?: string[], system?: SystemId): string[] {
  return prioritizeAtlasAssets(catalog.assets.filter(asset =>
    (system ? asset.systemId === system : systems.includes(asset.systemId)) &&
    (system || !modules || modules.includes(asset.id) || (asset.systemId === 'skeletal' && asset.defaultEnabled !== false))
  )).map(asset => asset.id);
}
