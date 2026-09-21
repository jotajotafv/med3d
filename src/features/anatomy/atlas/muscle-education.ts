import type {AnatomyNode} from './types';

/** Curated anatomy, independent of mesh geometry. Reviewed 21 September 2026. */
export interface MuscleSource {title: string; url: string}
type BoneFamily = 'clavicle' | 'scapula' | 'humerus' | 'radius' | 'ulna';
export interface MuscleAttachment {
  label: string;
  /** Semantic association to the whole bone; never a surface annotation. */
  boneFamily: BoneFamily;
}
export interface MuscleEducation {
  name: string;
  latin: string;
  region: string;
  group: string;
  description: string;
  function: string;
  action: string;
  origins: MuscleAttachment[];
  insertions: MuscleAttachment[];
  innervation: string;
  relations: string;
  sources: MuscleSource[];
}
export interface MuscleDetail extends MuscleEducation {
  scope: 'muscle' | 'component';
  muscleName: string;
  componentName?: string;
}

const uw = (slug: string, title: string): MuscleSource => ({
  title: `University of Washington · Muscle Atlas · ${title}`,
  url: `https://rad.uw.edu/muscle-atlas/${slug}`,
});
const upperLimb: MuscleSource = {
  title: 'OpenStax · Anatomy and Physiology 2e · 11.5 Miembro superior',
  url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs',
};
const radialStudy: MuscleSource = {
  title: 'Sawyer et al. (2020) · Distribución del nervio radial · Diagnostics',
  url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7345276/',
};
const attachment = (label: string, boneFamily: BoneFamily): MuscleAttachment => ({label, boneFamily});
const deltoidOrigins = [
  attachment('Porción clavicular: tercio lateral de la clavícula.', 'clavicle'),
  attachment('Porción acromial: acromion de la escápula.', 'scapula'),
  attachment('Porción espinal: espina de la escápula.', 'scapula'),
];
const bicepsOrigins = [
  attachment('Cabeza corta: apófisis coracoides de la escápula.', 'scapula'),
  attachment('Cabeza larga: tubérculo supraglenoideo de la escápula.', 'scapula'),
];
const tricepsOrigins = [
  attachment('Cabeza medial: cara posterior del húmero, por debajo del surco radial.', 'humerus'),
  attachment('Cabeza lateral: cara posterior del húmero, por encima del surco radial.', 'humerus'),
  attachment('Cabeza larga: tubérculo infraglenoideo de la escápula.', 'scapula'),
];
const cuffGroup = 'Hombro · manguito rotador';
const cuffFunction = 'Contribuye a mantener la cabeza humeral estable en la cavidad glenoidea.';

/**
 * Original concise Spanish summaries. Sources describe general anatomy, not
 * a measured attachment, innervation or action of this BodyParts3D specimen.
 * No source illustrations are redistributed.
 */
export const MUSCLE_EDUCATION: Record<string, MuscleEducation> = {
  deltoid: {
    name: 'Deltoides', latin: 'Musculus deltoideus', region: 'Hombro', group: 'Musculatura del hombro',
    description: 'Músculo superficial que da forma al hombro. Sus porciones clavicular, acromial y espinal forman una unidad muscular.',
    function: 'Eleva y orienta el brazo mediante la acción conjunta de sus porciones.',
    action: 'Acromial: abducción. Clavicular: flexión y rotación medial. Espinal: extensión y rotación lateral del brazo.',
    origins: deltoidOrigins,
    insertions: [attachment('Tuberosidad deltoidea del húmero.', 'humerus')],
    innervation: 'Nervio axilar (C5–C6).',
    relations: 'Se fija en clavícula, escápula y húmero; actúa sobre la articulación del hombro.',
    sources: [uw('deltoid', 'Deltoid'), upperLimb],
  },
  bicepsbrachii: {
    name: 'Bíceps braquial', latin: 'Musculus biceps brachii', region: 'Brazo', group: 'Compartimento anterior del brazo',
    description: 'Músculo de dos cabezas, larga y corta, situado superficial al braquial.',
    function: 'Participa en la flexión del codo y en la orientación de la palma.',
    action: 'Supina el antebrazo y flexiona el codo; también contribuye a la flexión del hombro.',
    origins: bicepsOrigins,
    insertions: [attachment('Tuberosidad del radio; la aponeurosis bicipital continúa hacia la fascia del antebrazo.', 'radius')],
    innervation: 'Nervio musculocutáneo (C5–C6).',
    relations: 'Cruza hombro y codo. Ambas cabezas parten de la escápula y llegan al radio; el braquial queda profundo.',
    sources: [uw('biceps-brachii', 'Biceps Brachii'), upperLimb],
  },
  tricepsbrachii: {
    name: 'Tríceps braquial', latin: 'Musculus triceps brachii', region: 'Brazo', group: 'Compartimento posterior del brazo',
    description: 'Músculo posterior del brazo formado por cabezas medial, lateral y larga.',
    function: 'Proporciona la acción extensora principal del codo.',
    action: 'Extiende el antebrazo; la cabeza larga también contribuye a estabilizar el húmero durante la abducción.',
    origins: tricepsOrigins,
    insertions: [attachment('Olécranon del cúbito y continuidad con la fascia del antebrazo.', 'ulna')],
    innervation: 'Nervio radial (C6–C8), según la descripción anatómica habitual.',
    relations: 'Las cabezas medial y lateral parten del húmero; la larga parte de la escápula. Las tres transmiten fuerza al cúbito.',
    sources: [uw('triceps-brachii', 'Triceps Brachii'), upperLimb],
  },
  brachialis: {
    name: 'Braquial', latin: 'Musculus brachialis', region: 'Brazo', group: 'Compartimento anterior del brazo',
    description: 'Músculo flexor situado profundo al bíceps braquial.',
    function: 'Aporta fuerza a la flexión del codo.',
    action: 'Flexiona el antebrazo tanto en pronación como en supinación.',
    origins: [attachment('Mitad distal de la cara anterior del húmero.', 'humerus')],
    insertions: [attachment('Apófisis coronoides y tuberosidad del cúbito.', 'ulna')],
    innervation: 'Principalmente nervio musculocutáneo (C5–C6); existe una contribución radial variable.',
    relations: 'Une el húmero al cúbito y permanece profundo al bíceps; su fijación distal no es radial.',
    sources: [uw('brachialis', 'Brachialis'), upperLimb, radialStudy],
  },
  supraspinatus: {
    name: 'Supraespinoso', latin: 'Musculus supraspinatus', region: 'Hombro', group: cuffGroup,
    description: 'Músculo de la fosa situada por encima de la espina escapular.',
    function: cuffFunction,
    action: 'Inicia y ayuda a mantener la abducción del brazo junto con el deltoides.',
    origins: [attachment('Fosa supraespinosa de la escápula.', 'scapula')],
    insertions: [attachment('Faceta superior del tubérculo mayor del húmero.', 'humerus')],
    innervation: 'Nervio supraescapular (C4–C6 en la fuente consultada).',
    relations: 'Su tendón integra el manguito rotador junto con infraespinoso, redondo menor y subescapular.',
    sources: [uw('supraspinatus', 'Supraspinatus'), upperLimb],
  },
  infraspinatus: {
    name: 'Infraespinoso', latin: 'Musculus infraspinatus', region: 'Hombro', group: cuffGroup,
    description: 'Músculo de la cara posterior escapular, por debajo de su espina.',
    function: cuffFunction,
    action: 'Rota lateralmente el brazo.',
    origins: [attachment('Fosa infraespinosa de la escápula.', 'scapula')],
    insertions: [attachment('Faceta media del tubérculo mayor del húmero.', 'humerus')],
    innervation: 'Nervio supraescapular (C5–C6).',
    relations: 'Su tendón une escápula y húmero como parte del manguito rotador.',
    sources: [uw('infraspinatus', 'Infraspinatus'), upperLimb],
  },
  teresminor: {
    name: 'Redondo menor', latin: 'Musculus teres minor', region: 'Hombro', group: cuffGroup,
    description: 'Músculo que parte del borde lateral de la escápula y llega al húmero.',
    function: cuffFunction,
    action: 'Rota lateralmente el brazo.',
    origins: [attachment('Porción superior del borde lateral de la escápula.', 'scapula')],
    insertions: [attachment('Faceta inferior del tubérculo mayor del húmero.', 'humerus')],
    innervation: 'Nervio axilar (C5–C6).',
    relations: 'Forma parte del manguito rotador; colabora con el infraespinoso en la rotación lateral.',
    sources: [uw('teres-minor', 'Teres Minor'), upperLimb],
  },
  subscapularis: {
    name: 'Subescapular', latin: 'Musculus subscapularis', region: 'Hombro', group: cuffGroup,
    description: 'Músculo profundo que ocupa la fosa de la cara anterior de la escápula.',
    function: cuffFunction,
    action: 'Rota medialmente el brazo y contribuye a su aducción.',
    origins: [attachment('Fosa subescapular de la escápula.', 'scapula')],
    insertions: [attachment('Tubérculo menor del húmero.', 'humerus')],
    innervation: 'Nervios subescapulares superior e inferior (C5–C7 en la fuente consultada).',
    relations: 'Forma el componente anterior del manguito rotador; su fijación humeral es en el tubérculo menor.',
    sources: [uw('subscapularis', 'Subscapularis'), upperLimb],
  },
};

interface ComponentDetail {
  family: string;
  name: string;
  latin: string;
  originIndex: number;
  action?: string;
}
const deltoidClavicular: ComponentDetail = {family: 'deltoid', name: 'Porción clavicular', latin: 'Pars clavicularis musculi deltoidei', originIndex: 0, action: 'Contribuye a la flexión y a la rotación medial del brazo.'};
const deltoidAcromial: ComponentDetail = {family: 'deltoid', name: 'Porción acromial', latin: 'Pars acromialis musculi deltoidei', originIndex: 1, action: 'Contribuye a la abducción del brazo.'};
const deltoidSpinal: ComponentDetail = {family: 'deltoid', name: 'Porción espinal', latin: 'Pars spinalis musculi deltoidei', originIndex: 2, action: 'Contribuye a la extensión y a la rotación lateral del brazo.'};
const bicepsShort: ComponentDetail = {family: 'bicepsbrachii', name: 'Cabeza corta', latin: 'Caput breve musculi bicipitis brachii', originIndex: 0};
const bicepsLong: ComponentDetail = {family: 'bicepsbrachii', name: 'Cabeza larga', latin: 'Caput longum musculi bicipitis brachii', originIndex: 1};
const tricepsMedial: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza medial', latin: 'Caput mediale musculi tricipitis brachii', originIndex: 0, action: 'Contribuye a la extensión del antebrazo en el codo.'};
const tricepsLateral: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza lateral', latin: 'Caput laterale musculi tricipitis brachii', originIndex: 1, action: 'Contribuye a la extensión del antebrazo en el codo.'};
const tricepsLong: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza larga', latin: 'Caput longum musculi tricipitis brachii', originIndex: 2};

/** Exact source IDs from docs/phase3-registration.md; no name matching. */
const components: Record<string, ComponentDetail> = {
  FMA34680: deltoidClavicular, FMA34681: deltoidClavicular,
  FMA34682: deltoidAcromial, FMA34683: deltoidAcromial,
  FMA34684: deltoidSpinal, FMA34685: deltoidSpinal,
  FMA37684: bicepsShort, FMA37685: bicepsShort,
  FMA37686: bicepsLong, FMA37687: bicepsLong,
  FMA37695: tricepsMedial, FMA37696: tricepsMedial,
  FMA37697: tricepsLateral, FMA37698: tricepsLateral,
  FMA37699: tricepsLong, FMA37700: tricepsLong,
};
const indivisibleMuscles: Record<string, string> = {
  FMA37668: 'brachialis', FMA37669: 'brachialis',
  FMA32544: 'supraspinatus', FMA32545: 'supraspinatus',
  FMA32547: 'infraspinatus', FMA32548: 'infraspinatus',
  FMA32553: 'teresminor', FMA32554: 'teresminor',
  FMA13414: 'subscapularis', FMA13415: 'subscapularis',
};
const familyKey = (family?: string) => (family || '').toLowerCase().replace(/[^a-z]/g, '');

export function resolveMuscleDetail(node?: AnatomyNode): MuscleDetail | undefined {
  if (!node || node.systemId !== 'muscular' || !['structure', 'component'].includes(node.kind)) return;
  const sourceId = node.sourceId || node.id.replace(/^bp3d:/, '');
  const component = components[sourceId];
  // Unknown components need their own reviewed card, never a whole-muscle fallback.
  if (node.kind === 'component' && !component) return;
  const family = component?.family || indivisibleMuscles[sourceId] || familyKey(node.family);
  const education = MUSCLE_EDUCATION[family];
  if (!education) return;
  if (!component) return {...education, name: node.name, latin: node.latin || education.latin, scope: 'muscle', muscleName: education.name};
  return {
    ...education,
    name: node.name,
    latin: component.latin,
    muscleName: education.name,
    componentName: component.name,
    scope: 'component',
    description: `${component.name} del ${education.name.toLowerCase()}. Forma parte de ese músculo y no se contabiliza como otro músculo independiente.`,
    action: component.action || education.action,
    origins: [education.origins[component.originIndex]],
  };
}

/** Existing skeletal IDs, verified in the preserved skeletal source catalog. */
export const MUSCLE_CONTEXT_BONE_IDS: Record<'right' | 'left', Record<BoneFamily, string>> = {
  right: {clavicle: 'bp3d:FMA13322', scapula: 'bp3d:FMA13395', humerus: 'bp3d:FMA23130', radius: 'bp3d:FMA23464', ulna: 'bp3d:FMA23467'},
  left: {clavicle: 'bp3d:FMA13323', scapula: 'bp3d:FMA13396', humerus: 'bp3d:FMA23131', radius: 'bp3d:FMA23465', ulna: 'bp3d:FMA23468'},
};

/**
 * Whole bones supported by this card's origin/insertion associations. A
 * component uses its own origin, not the origins of its sibling components.
 * Missing catalog bones are omitted; no geometric or contralateral fallback.
 */
export function getMuscleContextIds(node: AnatomyNode | undefined, byId: ReadonlyMap<string, AnatomyNode>): string[] {
  const detail = resolveMuscleDetail(node);
  if (!detail || !node || (node.side !== 'right' && node.side !== 'left')) return [];
  const ids = [...detail.origins, ...detail.insertions].map(item => MUSCLE_CONTEXT_BONE_IDS[node.side as 'right' | 'left'][item.boneFamily]);
  return [...new Set(ids)].filter(id => {
    const bone = byId.get(id);
    return bone?.systemId === 'skeletal' && bone.side === node.side;
  });
}
