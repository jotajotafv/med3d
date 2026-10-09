import type { AnatomyNode } from '../../anatomy/atlas/types';

import { XR_ATLAS_SYSTEMS, isXrAtlasSystem, type XrAtlasSystem } from './systems';

export type AtlasState = {
  systemVisibility: Record<XrAtlasSystem, boolean>;
  systemOpacity: Record<XrAtlasSystem, number>;
  hiddenStructures: string[];
  isolatedStructure: string | null;
  selectedStructure: string | null;
  explodedAmount: number;
};
export const initialAtlasState = (): AtlasState => ({
  systemVisibility: Object.fromEntries(XR_ATLAS_SYSTEMS.map(system => [system.id, system.defaultVisible])) as Record<XrAtlasSystem, boolean>,
  systemOpacity: Object.fromEntries(XR_ATLAS_SYSTEMS.map(system => [system.id, 1])) as Record<XrAtlasSystem, number>,
  hiddenStructures: [], isolatedStructure: null, selectedStructure: null, explodedAmount: 0,
});
export type AtlasAction =
  | { type: 'system'; system: XrAtlasSystem; enabled: boolean }
  | { type: 'opacity'; system: XrAtlasSystem; value: number }
  | { type: 'select'; id: string | null }
  | { type: 'hide' | 'isolate'; id: string }
  | { type: 'restoreHidden' | 'exitIsolation' | 'resetView' | 'restoreAtlas' }
  | { type: 'explode'; value: number };
/** Layers stay independent: isolation is a reversible filter, not rewritten visibility. */
export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case 'system': return { ...state, systemVisibility: { ...state.systemVisibility, [action.system]: action.enabled }, selectedStructure: null };
    case 'opacity': return Number.isFinite(action.value) ? { ...state, systemOpacity: { ...state.systemOpacity, [action.system]: Math.max(.1, Math.min(1, action.value)) } } : state;
    case 'select': return { ...state, selectedStructure: action.id };
    case 'hide': return { ...state, hiddenStructures: [...new Set([...state.hiddenStructures, action.id])], selectedStructure: null,
      isolatedStructure: state.isolatedStructure === action.id ? null : state.isolatedStructure };
    case 'isolate': return { ...state, isolatedStructure: action.id };
    case 'exitIsolation': return { ...state, isolatedStructure: null };
    case 'restoreHidden': return { ...state, hiddenStructures: [] };
    case 'resetView': return { ...state, explodedAmount: 0 };
    case 'restoreAtlas': return { ...initialAtlasState(), explodedAmount: state.explodedAmount };
    case 'explode': return Number.isFinite(action.value) ? { ...state, explodedAmount: Math.max(0, Math.min(1, action.value)) } : state;
  }
}
export function atlasPartVisible(state: AtlasState, node: AnatomyNode, ancestors: ReadonlySet<string>): boolean {
  return isXrAtlasSystem(node.systemId) && state.systemVisibility[node.systemId]
    && !state.hiddenStructures.some(id => ancestors.has(id))
    && (!state.isolatedStructure || ancestors.has(state.isolatedStructure));
}
