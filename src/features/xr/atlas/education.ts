import { BONE_EDUCATION, BONE_TERMS } from '../../anatomy/atlas/bone-education';
import { resolveBoneDetail } from '../../anatomy/atlas/bone-details';
import { resolveMuscleDetail } from '../../anatomy/atlas/muscle-education';
import { resolveCardiovascularDetail } from '../../anatomy/atlas/cardiovascular-education';
import { publicFields, publicText } from '../../anatomy/atlas/public-information';
import { SYSTEMS } from '../../anatomy/atlas/catalog-index';
import type { AnatomyCatalog, AnatomyNode } from '../../anatomy/atlas/types';

/** Presentation adapter only. No copied lessons or inferred anatomical relationships. */
export function atlasEducation(node: AnatomyNode, catalog: AnatomyCatalog) {
  let fields: [string, string][] = [], sources: { title: string; url: string }[] = [], scope: string | undefined;
  let latin = node.latin;
  if (node.systemId === 'skeletal') {
    const bone = resolveBoneDetail(node), family = BONE_EDUCATION[node.family || ''];
    const detail = bone || family;
    latin ||= BONE_TERMS[node.family || '']?.latin;
    if (detail) {
      fields = [['Descripción', detail.description], ['Función', detail.function], ['Relaciones anatómicas', detail.relations]];
      sources = bone ? bone.sources : family ? [family.source] : [];
      if (!bone && family) scope = `Ficha de familia ósea · ${BONE_TERMS[node.family || '']?.name || node.name}`;
    }
  } else if (node.systemId === 'muscular') {
    const detail = resolveMuscleDetail(node);
    if (detail) {
      latin ||= detail.latin;
      fields = [['Descripción', detail.description], ['Función', detail.function], ['Relaciones anatómicas', detail.relations]];
      sources = detail.sources;
      if (detail.scope === 'component') scope = `Componente de ${detail.muscleName}. Función general del músculo.`;
    }
  } else if (node.systemId === 'cardiovascular') {
    const detail = resolveCardiovascularDetail(node);
    if (detail) { fields = [['Descripción', detail.description], ...detail.fields]; sources = detail.sources; }
  }
  const provenanceIds = new Set(catalog.assets.filter(asset => node.assetIds.includes(asset.id)).map(asset => asset.provenanceId));
  return { name: node.name, latin, system: SYSTEMS.find(system => system.id === node.systemId)?.name,
    region: catalog.nodes.find(region => region.id === node.regionId)?.name,
    fields: publicFields(fields).filter(([, value]) => !!value), sources, scope,
    provenance: catalog.provenance.filter(source => provenanceIds.has(source.id)).map(source => ({ ...source, source: publicText(source.source) || source.source })),
  };
}
