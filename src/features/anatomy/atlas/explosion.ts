import type { AnatomyCatalog, AnatomyNode, Bounds, ExplodeLevel, SystemId, Vec3 } from './types';

export interface ExplosionOffsets { systems: Vec3; regions: Vec3; structures: Vec3 }
const ZERO: Vec3 = [0, 0, 0];
const centre = (bounds: Bounds): Vec3 => bounds[0].map((value, axis) => (value + bounds[1][axis]) / 2) as Vec3;
const extent = (bounds: Bounds) => Math.max(...bounds[1].map((value, axis) => value - bounds[0][axis]));
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
function offset(from: Vec3, to: Vec3, multiplier: number, maximum: number): Vec3 {
  const vector = from.map((value, axis) => (value - to[axis]) * multiplier) as Vec3;
  const length = Math.hypot(...vector);
  return length > maximum && length > 0 ? vector.map(value => value * maximum / length) as Vec3 : vector;
}
function union(bounds: Bounds[]): Bounds | undefined {
  if (!bounds.length) return undefined;
  return [
    [0, 1, 2].map(axis => Math.min(...bounds.map(box => box[0][axis]))) as Vec3,
    [0, 1, 2].map(axis => Math.max(...bounds.map(box => box[1][axis]))) as Vec3,
  ];
}

/** Presentation offsets only: they never enter the source registration matrix.
 * Systems use ordered lateral slots so coincident centres still separate.
 * Regions use shared anatomical bounds across layers, and structures add a
 * bounded offset around their parent. Regional/structure views intentionally
 * omit system offsets to preserve muscle–bone relationships.
 * Offsets are in source-frame metres; the viewer normalises exactly once.
 */
export function createExplosionOffsets(catalog: AnatomyCatalog, activeSystems: ReadonlySet<SystemId>): Map<string, ExplosionOffsets> {
  const nodes = new Map(catalog.nodes.map(node => [node.id, node]));
  const assets = new Map(catalog.assets.map(asset => [asset.id, asset]));
  const boundsCache = new Map<string, Bounds | undefined>();
  function nodeBounds(node: AnatomyNode, visiting = new Set<string>()): Bounds | undefined {
    if (node.bounds) return node.bounds;
    if (boundsCache.has(node.id)) return boundsCache.get(node.id);
    if (visiting.has(node.id)) return undefined;
    visiting.add(node.id);
    const boxes = node.children.flatMap(id => {
      const child = nodes.get(id), box = child && nodeBounds(child, visiting);
      return box ? [box] : [];
    });
    const result = union(boxes.length ? boxes : node.assetIds.flatMap(id => assets.get(id)?.bounds ? [assets.get(id)!.bounds] : []));
    visiting.delete(node.id); boundsCache.set(node.id, result);
    return result;
  }
  const bodyCenter = centre(catalog.frame.bounds), height = Math.max(extent(catalog.frame.bounds), .001);
  const systemBounds = new Map<SystemId, Bounds>();
  activeSystems.forEach(system => {
    const bounds = union(catalog.assets.filter(asset => asset.systemId === system).map(asset => asset.bounds));
    if (bounds) systemBounds.set(system, bounds);
  });
  const roleOrder: SystemId[] = ['skeletal', 'muscular', 'integumentary', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive'];
  const orderedSystems = roleOrder.filter(system => systemBounds.has(system));
  const systemOffsets = new Map<SystemId, Vec3>(orderedSystems.map((system, index) => [system,
    orderedSystems.length > 1 ? [(index / (orderedSystems.length - 1) * 2 - 1) * height * .16, 0, 0] : [...ZERO],
  ]));
  const sharedRegions = new Map<string, Bounds>();
  for (const node of catalog.nodes) {
    if (!node.explosionRegionId) continue;
    const box = nodeBounds(node);
    if (!box) continue;
    const previous = sharedRegions.get(node.explosionRegionId);
    sharedRegions.set(node.explosionRegionId, previous ? union([previous, box])! : box);
  }
  const result = new Map<string, ExplosionOffsets>();
  catalog.nodes.forEach(node => {
    if (node.kind === 'body') {
      result.set(node.id, { systems: [...ZERO], regions: [...ZERO], structures: [...ZERO] });
      return;
    }
    const ownBounds = nodeBounds(node);
    const region = nodes.get(node.regionId), regionBox = (node.explosionRegionId && sharedRegions.get(node.explosionRegionId)) || (region && nodeBounds(region));
    const parent = node.parentId && nodes.get(node.parentId), parentBox = parent && nodeBounds(parent);
    const systemOffset = (node.systemId && systemOffsets.get(node.systemId)) || ZERO;
    const regionOffset = regionBox ? offset(centre(regionBox), bodyCenter, .28, height * .18) : ZERO;
    // A component is separated around its immediate parent's anatomical centroid.
    // Coincident centres stay together rather than receiving invented directions.
    const localOffset = ownBounds && (parentBox || regionBox)
      ? offset(centre(ownBounds), centre((parentBox || regionBox)!), 1.35, Math.min(height * .115, extent((parentBox || regionBox)!) * .7))
      : ZERO;
    result.set(node.id, { systems: [...systemOffset], regions: [...regionOffset], structures: add(regionOffset, localOffset) });
  });
  return result;
}

export function explosionTarget(offsets: ExplosionOffsets | undefined, level: ExplodeLevel, amount: number): Vec3 {
  const factor = Number.isFinite(amount) ? Math.max(0, Math.min(1, amount)) : 0;
  if (!offsets || factor === 0) return [0, 0, 0];
  return offsets[level].map(value => value * factor) as Vec3;
}
