import type {AnatomyCatalog, AnatomyNode, SystemId} from './types';

export const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function createCatalogIndex(catalog: AnatomyCatalog) {
  const byId = new Map(catalog.nodes.map(node => [node.id, node]));
  if (byId.size !== catalog.nodes.length) throw new Error('El catálogo contiene identificadores repetidos.');
  const assetIds = new Set(catalog.assets.map(asset => asset.id));
  if (assetIds.size !== catalog.assets.length) throw new Error('El catálogo contiene módulos repetidos.');
  for (const node of catalog.nodes) {
    if (new Set(node.children).size !== node.children.length || node.children.some(id => !byId.has(id) || byId.get(id)?.parentId !== node.id)) throw new Error('Los componentes de un grupo no concuerdan con la jerarquía.');
    if (node.parentId && !byId.get(node.parentId)?.children.includes(node.id)) throw new Error('Falta una relación de pertenencia anatómica.');
    if (node.assetIds.some(id => !assetIds.has(id))) throw new Error('Una estructura hace referencia a un módulo inexistente.');
  }
  const ancestors = new Map<string, string[]>();
  for (const node of catalog.nodes) {
    const path: string[] = []; let current: AnatomyNode | undefined = node;
    while (current) {
      if (path.includes(current.id)) throw new Error('La jerarquía anatómica contiene un ciclo.');
      path.push(current.id);
      if (current.parentId && !byId.has(current.parentId)) throw new Error('Falta un grupo del catálogo anatómico.');
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    ancestors.set(node.id, path.reverse());
  }
  const search = catalog.nodes.map(node => ({node, text: normalizeSearch([node.name, node.anatomicalName, node.latin, node.sourceId, ...node.aliases].filter(Boolean).join(' '))}));
  const inside = (id: string, parent: string) => ancestors.get(id)?.includes(parent) || false;
  return {byId, ancestors, inside,
    find(query: string) {
      const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
      return terms.length ? search.filter(item => terms.every(term => item.text.includes(term))).map(item => item.node).sort((a, b) => Number(!normalizeSearch(a.name).startsWith(terms.join(' '))) - Number(!normalizeSearch(b.name).startsWith(terms.join(' ')))) : [];
    },
    reveal(hidden: string[], id: string) { return hidden.filter(item => !inside(id, item) && !inside(item, id)); },
    assetIdsFor(id: string) {
      const direct = byId.get(id)?.assetIds || [];
      return [...new Set([...direct, ...catalog.nodes.filter(node => inside(node.id, id)).flatMap(node => node.assetIds)])];
    },
  };
}
export type CatalogIndex = ReturnType<typeof createCatalogIndex>;
export interface TreeRow {node: AnatomyNode; depth: number; siblingIndex: number; siblingCount: number}
export function flattenTree(catalog: AnatomyCatalog, index: CatalogIndex, expanded: Set<string>): TreeRow[] {
  const rows: TreeRow[] = [];
  const visit = (ids: string[], depth: number) => ids.forEach((id, siblingIndex) => {
    const node = index.byId.get(id); if (!node) return;
    rows.push({node, depth, siblingIndex, siblingCount: ids.length});
    if (expanded.has(id)) visit(node.children, depth + 1);
  });
  visit(catalog.nodes.filter(node => !node.parentId).map(node => node.id), 0);
  return rows;
}
export const SYSTEMS: Array<{id: SystemId; name: string; branches: string}> = [
  {id:'skeletal',name:'Sistema óseo',branches:'Esqueleto axial · esqueleto apendicular'},
  {id:'integumentary',name:'Sistema tegumentario',branches:'Piel · anexos cutáneos'},
  {id:'muscular',name:'Sistema muscular',branches:'Cabeza y cuello · tronco · miembros'},
  {id:'nervous',name:'Sistema nervioso',branches:'Central · periférico · autónomo'},
  {id:'cardiovascular',name:'Sistema cardiovascular',branches:'Corazón · arterias · venas'},
  {id:'respiratory',name:'Sistema respiratorio',branches:'Vías respiratorias · pulmones'},
  {id:'digestive',name:'Sistema digestivo',branches:'Tubo digestivo · órganos accesorios'},
  {id:'urinary',name:'Sistema urinario',branches:'Riñones · uréteres · vejiga · uretra'},
  {id:'endocrine',name:'Sistema endocrino',branches:'Glándulas · componentes endocrinos'},
  {id:'lymphatic',name:'Sistema linfático',branches:'Vasos · ganglios · órganos linfáticos'},
  {id:'reproductive',name:'Sistema reproductor',branches:'Órganos masculinos · órganos femeninos'},
];
