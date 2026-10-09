import type { AnatomyNode } from '../../anatomy/atlas/types';

export const PILOT_SYSTEMS = ['skeletal', 'muscular', 'cardiovascular'] as const;
export type PilotSystem = typeof PILOT_SYSTEMS[number];
export const isPilotSystem = (value?: string): value is PilotSystem => PILOT_SYSTEMS.some(id => id === value);
export type AtlasState = {
  systemVisibility: Record<PilotSystem, boolean>;
  systemOpacity: Record<PilotSystem, number>;
  hiddenStructures: string[];
  isolatedStructure: string | null;
  selectedStructure: string | null;
  explodedAmount: number;
};
export const initialAtlasState = (): AtlasState => ({
  systemVisibility: { skeletal: true, muscular: false, cardiovascular: false },
  systemOpacity: { skeletal: 1, muscular: 1, cardiovascular: 1 },
  hiddenStructures: [], isolatedStructure: null, selectedStructure: null, explodedAmount: 0,
});
export type AtlasAction =
  | { type: 'system'; system: PilotSystem; enabled: boolean }
  | { type: 'opacity'; system: PilotSystem; value: number }
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
  return isPilotSystem(node.systemId) && state.systemVisibility[node.systemId]
    && !state.hiddenStructures.some(id => ancestors.has(id))
    && (!state.isolatedStructure || ancestors.has(state.isolatedStructure));
}
