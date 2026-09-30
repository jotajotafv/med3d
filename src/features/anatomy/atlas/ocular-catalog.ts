import type {AnatomyCatalog} from './types';

/** Append a bounded sensory-organ extension without rewriting historical sources. */
export function withOcularCoverage(nervous: AnatomyCatalog, ocular: AnatomyCatalog): AnatomyCatalog {
  if (nervous.frame.id !== ocular.frame.id || ocular.frame.units !== 'metres' || ocular.frame.up !== 'Y') throw new Error('La cobertura ocular no comparte el marco corporal.');
  const root = nervous.nodes.find(node => node.id === 'nervous');
  if (!root || ocular.nodes.filter(node => !node.parentId).length !== 1 || ocular.nodes[0]?.id !== 'nervous:ocular') throw new Error('La extensión ocular requiere una única región sensorial.');
  const ids = new Set(nervous.nodes.map(node => node.id));
  if (ocular.nodes.some(node => ids.has(node.id) || node.systemId !== 'nervous') || ocular.assets.some(asset => nervous.assets.some(old => old.id === asset.id))) throw new Error('La extensión ocular duplica identidades o sistemas.');
  return {...nervous,
    nodes: [...nervous.nodes.map(node => node.id === root.id ? {...node, children: [...node.children,'nervous:ocular'], assetIds: [...node.assetIds,...ocular.assets.map(asset=>asset.id)]} : node), ...ocular.nodes.map(node => node.id === 'nervous:ocular' ? {...node,parentId:'nervous'} : node)],
    assets: [...nervous.assets,...ocular.assets], provenance: [...nervous.provenance,...ocular.provenance],
    coverage: {...nervous.coverage,structures:nervous.coverage.structures+ocular.coverage.structures,meshes:nervous.coverage.meshes+ocular.coverage.meshes,note:nervous.coverage.note+' '+ocular.coverage.note,limitations:[...nervous.coverage.limitations,...ocular.coverage.limitations]},
  };
}
