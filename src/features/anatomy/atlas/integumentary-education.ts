import type {AnatomyNode} from './types';

// Curated references for the whole-body surface, not inferred contact points.
export const SKIN_CONTEXT_IDS = [
  'bp3d:FMA52734', 'bp3d:FMA52748', 'bp3d:FMA7485',
  'med3d:muscle:pectoralismajor:right', 'med3d:muscle:pectoralismajor:left',
  'med3d:muscle:deltoid:right', 'med3d:muscle:deltoid:left',
  'bp3d:FMA22328', 'bp3d:FMA22329', 'bp3d:FMA38928', 'bp3d:FMA38929',
];
export function getIntegumentaryContextIds(node: AnatomyNode, byId: ReadonlyMap<string, AnatomyNode>): string[] {
  return node.systemId === 'integumentary' ? SKIN_CONTEXT_IDS.filter(id => byId.has(id)) : [];
}

export const SKIN_EDUCATION = {
  description: 'La piel forma la cubierta externa del cuerpo. En este atlas se representa su superficie macroscópica mediante una única pieza del cuerpo masculino de referencia.',
  fields: [
    ['Función general', 'Actúa como barrera protectora y participa en la sensibilidad y la regulación de la temperatura. Estas funciones dependen de tejidos y anexos que esta superficie no distingue.'],
    ['Región', 'Cabeza, cuello, tronco y extremidades dentro de la misma superficie corporal.'],
    ['Relaciones', 'Cubre las regiones musculares y óseas. El contexto muestra referencias superficiales curadas, sin afirmar contacto exacto ni medir grosor cutáneo.'],
    ['Capas representadas', 'Sólo superficie externa. Epidermis, dermis y tejido subcutáneo no son capas separadas en esta geometría.'],
    ['Límites del modelo', 'Una malla nativa sin divisiones regionales seleccionables. No incluye uñas ni pelo como piezas independientes; no representa todos los cuerpos, edades o fenotipos.'],
  ],
  sources: [
    {title: 'BodyParts3D / DBCLS · procedencia de la superficie', url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'},
    {title: 'OpenStax · capas de la piel', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin'},
    {title: 'OpenStax · funciones del sistema tegumentario', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/5-3-functions-of-the-integumentary-system'},
  ],
};
