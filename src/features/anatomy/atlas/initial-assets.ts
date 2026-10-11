import type {AnatomyCatalog, SystemId} from './types';

/** Explicit module links may opt in; the regular first load keeps additions off. */
export function initialAtlasAssets(catalog: AnatomyCatalog, systems: string[], modules?: string[], system?: SystemId): string[] {
  return catalog.assets.filter(asset =>
    (system ? asset.systemId===system : systems.includes(asset.systemId)) &&
    (modules?.includes(asset.id) || (asset.defaultEnabled!==false && (asset.systemId==='skeletal'||!modules)))
  ).map(asset=>asset.id);
}
