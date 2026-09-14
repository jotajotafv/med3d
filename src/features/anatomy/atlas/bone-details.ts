import type { AnatomyNode } from './types';

/** Curated descriptions of named bones, not measurements of this specimen. */
export interface BoneDetail {
  classification: string;
  description: string;
  function: string;
  articulations: Array<{ label: string; family?: string }>;
  parts: string[];
  relations: string;
  additional?: string;
  sources: Array<{ title: string; url: string }>;
  scope: 'bone';
}

const nlm = (id: string, title: string) => ({
  title: `NCBI Bookshelf · StatPearls · ${title}`,
  url: `https://www.ncbi.nlm.nih.gov/books/${id}/`,
});
const classification = {
  title: 'OpenStax · Anatomy and Physiology 2e · 6.2 Bone Classification',
  url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/6-2-bone-classification',
};
const cervical = nlm('NBK459200', 'Anatomy, Back, Cervical Vertebrae');
const pelvis = nlm('NBK545204', 'Anatomy, Bony Pelvis and Lower Limb: Pelvis Bones');
const card = (detail: Omit<BoneDetail, 'scope'>): BoneDetail => ({ ...detail, scope: 'bone' });

/**
 * Most keys are catalog families naming ONE bone type; C1/C2 use source IDs.
 * Articulations are editorial facts. Never infer or extend them from bounds,
 * nearby meshes, relatedIds, or membership in a tree group.
 */
export const BONE_DETAILS: Record<string, BoneDetail> = {
  femur: card({
    classification: 'Hueso largo',
    description: 'Único hueso del muslo. Su cabeza redondeada se orienta hacia el acetábulo; el extremo inferior presenta dos cóndilos.',
    function: 'Transmite el peso desde la cadera hacia la rodilla y actúa como palanca durante la marcha.',
    articulations: [{ label: 'Coxal · acetábulo', family: 'hipbone' }, { label: 'Tibia', family: 'tibia' }, { label: 'Rótula', family: 'patella' }],
    parts: ['Cabeza y cuello', 'Trocánteres mayor y menor', 'Diáfisis y línea áspera', 'Cóndilos y superficie patelar'],
    relations: 'Los trocánteres y la línea áspera ofrecen anclaje a músculos de la cadera y del muslo. Los meniscos se interponen entre fémur y tibia.',
    sources: [nlm('NBK532982', 'Anatomy, Bony Pelvis and Lower Limb: Femur'), classification],
  }),
  tibia: card({
    classification: 'Hueso largo',
    description: 'Hueso medial y más robusto de la pierna. Su extremo proximal forma la meseta tibial y el distal, el maléolo medial.',
    function: 'Recibe la carga del fémur y la transmite hacia el pie; participa en rodilla y tobillo.',
    articulations: [{ label: 'Fémur', family: 'femur' }, { label: 'Peroné · unión proximal y sindesmosis distal', family: 'fibula' }, { label: 'Astrágalo' }],
    parts: ['Cóndilos y eminencia intercondílea', 'Tuberosidad tibial', 'Diáfisis y borde anterior', 'Maléolo medial'],
    relations: 'El ligamento patelar se fija en la tuberosidad tibial. La membrana interósea une la diáfisis al peroné.',
    sources: [nlm('NBK526053', 'Anatomy, Bony Pelvis and Lower Limb: Tibia'), classification],
  }),
  fibula: card({
    classification: 'Hueso largo',
    description: 'Hueso delgado situado en el lado lateral de la pierna. Su extremo inferior desciende para formar el maléolo lateral.',
    function: 'Contribuye a estabilizar el tobillo y proporciona fijación a músculos y ligamentos de la pierna.',
    articulations: [{ label: 'Tibia · unión proximal y sindesmosis distal', family: 'tibia' }, { label: 'Astrágalo' }],
    parts: ['Cabeza', 'Cuello', 'Diáfisis', 'Maléolo lateral'],
    relations: 'El nervio fibular común pasa junto al cuello. La membrana interósea la conecta con la tibia.',
    additional: 'No se articula con el fémur ni forma parte de la articulación tibiofemoral.',
    sources: [nlm('NBK470591', 'Anatomy, Bony Pelvis and Lower Limb: Fibula'), classification],
  }),
  patella: card({
    classification: 'Hueso sesamoideo',
    description: 'Rótula situada delante de la rodilla, incluida en el tendón del cuádriceps. Su cara posterior tiene superficies articulares.',
    function: 'Aumenta la ventaja mecánica del cuádriceps al extender la rodilla y protege su superficie anterior.',
    articulations: [{ label: 'Fémur · superficie patelar', family: 'femur' }],
    parts: ['Base superior', 'Vértice inferior', 'Cara anterior', 'Cara articular posterior'],
    relations: 'El tendón del cuádriceps llega a su base; el ligamento patelar continúa desde la rótula hasta la tuberosidad tibial.',
    additional: 'La unión con la tibia es ligamentosa: no existe una articulación ósea directa entre ambas.',
    sources: [nlm('NBK519534', 'Anatomy, Bony Pelvis and Lower Limb, Knee Patella'), { title: 'FIPAT · Terminologia Anatomica Humana · Rótula', url: 'https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/EN/TAH1131%20Unit%20EN.htm' }],
  }),
  humerus: card({
    classification: 'Hueso largo',
    description: 'Hueso del brazo, entre hombro y codo. Presenta una cabeza proximal y un extremo distal adaptado al radio y al cúbito.',
    function: 'Permite transmitir fuerzas y proporciona palancas para los movimientos del hombro y del codo.',
    articulations: [{ label: 'Escápula · cavidad glenoidea', family: 'scapula' }, { label: 'Radio', family: 'radius' }, { label: 'Cúbito', family: 'ulna' }],
    parts: ['Cabeza y cuellos', 'Tubérculos mayor y menor', 'Diáfisis y tuberosidad deltoidea', 'Capítulo, tróclea y epicóndilos'],
    relations: 'El nervio radial recorre un surco posterior de la diáfisis. El deltoides se inserta en la tuberosidad deltoidea.',
    sources: [nlm('NBK534821', 'Anatomy, Shoulder and Upper Limb, Humerus'), classification],
  }),
  radius: card({
    classification: 'Hueso largo',
    description: 'Hueso del antebrazo situado del lado del pulgar en posición anatómica. Su extremo distal es más ancho que la cabeza proximal.',
    function: 'Gira respecto al cúbito durante pronación y supinación y participa en la movilidad de la muñeca.',
    articulations: [{ label: 'Húmero · capítulo', family: 'humerus' }, { label: 'Cúbito · extremos proximal y distal', family: 'ulna' }, { label: 'Escafoides' }, { label: 'Semilunar' }],
    parts: ['Cabeza y cuello', 'Tuberosidad radial', 'Diáfisis', 'Apófisis estiloides e incisura cubital'],
    relations: 'El bíceps braquial se fija en la tuberosidad radial. El ligamento anular rodea la cabeza del radio.',
    sources: [nlm('NBK544512', 'Anatomy, Shoulder and Upper Limb, Forearm Radius'), classification],
  }),
  ulna: card({
    classification: 'Hueso largo',
    description: 'Cúbito o ulna: hueso medial del antebrazo en posición anatómica. Su extremo proximal forma la prominencia posterior del codo.',
    function: 'Aporta estabilidad al codo y, junto al radio, permite los movimientos de giro del antebrazo.',
    articulations: [{ label: 'Húmero · tróclea', family: 'humerus' }, { label: 'Radio · extremos proximal y distal', family: 'radius' }],
    parts: ['Olécranon y apófisis coronoides', 'Incisuras troclear y radial', 'Diáfisis', 'Cabeza y apófisis estiloides'],
    relations: 'El tríceps se fija en el olécranon. Un disco articular separa el extremo distal del carpo.',
    additional: 'No se articula directamente con los huesos del carpo.',
    sources: [nlm('NBK547749', 'Anatomy, Shoulder and Upper Limb, Forearm Ulna'), { title: 'OpenStax · Anatomy and Physiology 2e · 8.2 Bones of the Upper Limb', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb' }, classification],
  }),
  scapula: card({
    classification: 'Hueso plano',
    description: 'Escápula u omóplato: hueso triangular situado sobre la pared posterior del tórax. La cavidad glenoidea se orienta lateralmente.',
    function: 'Ofrece anclaje muscular y una base móvil para orientar el brazo durante los movimientos del hombro.',
    articulations: [{ label: 'Húmero · cabeza', family: 'humerus' }, { label: 'Clavícula · extremo acromial', family: 'clavicle' }],
    parts: ['Espina y acromion', 'Apófisis coracoides', 'Cavidad glenoidea', 'Fosas supraespinosa, infraespinosa y subescapular'],
    relations: 'La espina separa las fosas supraespinosa e infraespinosa. La cara costal se desliza sobre músculos de la pared torácica.',
    additional: 'Su relación con las costillas es funcional; no constituye una articulación ósea directa.',
    sources: [nlm('NBK538319', 'Anatomy, Thorax, Scapula'), classification],
  }),
  clavicle: card({
    classification: 'Hueso largo',
    description: 'Hueso curvado en forma de S, situado horizontalmente en la parte anterior y superior del tórax.',
    function: 'Mantiene el hombro separado del tórax y transmite fuerzas del miembro superior hacia el esqueleto axial.',
    articulations: [{ label: 'Esternón · manubrio', family: 'sternum' }, { label: 'Escápula · acromion', family: 'scapula' }],
    parts: ['Extremo esternal', 'Cuerpo', 'Extremo acromial', 'Tubérculo conoideo y línea trapezoidea'],
    relations: 'Los vasos subclavios y el plexo braquial discurren por detrás e inferiormente. Los ligamentos coracoclaviculares la unen a la apófisis coracoides.',
    sources: [nlm('NBK525990', 'Anatomy, Shoulder and Upper Limb, Clavicle')],
  }),
  hipbone: card({
    classification: 'Hueso irregular',
    description: 'Coxal formado por la unión de ilion, isquion y pubis. Sus tres porciones convergen en el acetábulo.',
    function: 'Transmite cargas entre columna y miembro inferior y participa en la protección de las vísceras pélvicas.',
    articulations: [{ label: 'Sacro', family: 'sacrum' }, { label: 'Fémur · cabeza', family: 'femur' }, { label: 'Coxal opuesto · sínfisis púbica', family: 'hipbone' }],
    parts: ['Ilion y cresta ilíaca', 'Isquion y tuberosidad isquiática', 'Pubis', 'Acetábulo y agujero obturador'],
    relations: 'La tuberosidad isquiática recibe carga al sentarse. La superficie auricular del ilion participa en la articulación sacroilíaca.',
    sources: [pelvis, { title: 'FIPAT · Terminologia Anatomica Humana · Coxal', url: 'https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/EN/TAH1029%20Unit%20EN.htm' }],
  }),
  sacrum: card({
    classification: 'Hueso irregular',
    description: 'Hueso triangular resultante de la fusión habitual de cinco vértebras sacras, situado entre ambos coxales.',
    function: 'Transmite peso desde la columna a la pelvis y forma parte de su pared posterior.',
    articulations: [{ label: 'Quinta vértebra lumbar · L5' }, { label: 'Coxales · superficies auriculares', family: 'hipbone' }, { label: 'Cóccix', family: 'coccyx' }],
    parts: ['Base y promontorio', 'Alas', 'Conducto y agujeros sacros', 'Crestas sacras y vértice'],
    relations: 'El conducto sacro continúa el vertebral. Los agujeros sacros permiten el paso de ramos nerviosos.',
    sources: [pelvis, classification],
  }),
  sternum: card({
    classification: 'Hueso plano',
    description: 'Hueso situado en la línea media anterior del tórax. Reúne manubrio, cuerpo y apófisis xifoides.',
    function: 'Completa la pared anterior de la caja torácica y contribuye a proteger el mediastino.',
    articulations: [{ label: 'Clavículas · extremos esternales', family: 'clavicle' }, { label: 'Cartílagos costales 1–7' }],
    parts: ['Manubrio', 'Cuerpo', 'Apófisis xifoides', 'Ángulo esternal'],
    relations: 'El ángulo esternal corresponde a la unión entre manubrio y cuerpo y orienta la identificación del segundo cartílago costal.',
    additional: 'Las costillas se conectan al esternón mediante cartílagos costales; no contactan directamente con él.',
    sources: [nlm('NBK541141', 'Anatomy, Thorax, Sternum'), classification],
  }),
  frontal: card({
    classification: 'Hueso plano',
    description: 'Hueso anterior del neurocráneo que forma la frente y buena parte del techo de las órbitas.',
    function: 'Protege los lóbulos frontales y contribuye a las paredes de las cavidades orbitarias.',
    articulations: [{ label: 'Parietales · sutura coronal', family: 'parietal' }, { label: 'Esfenoides y etmoides' }, { label: 'Nasales, maxilares, lagrimales y cigomáticos' }],
    parts: ['Escama frontal', 'Porciones orbitarias', 'Porción nasal', 'Bordes supraorbitarios'],
    relations: 'El borde supraorbitario presenta una escotadura o agujero para vasos y nervio supraorbitarios. En su espesor pueden encontrarse los senos frontales.',
    sources: [nlm('NBK535424', 'Anatomy, Head and Neck: Frontal Bone'), classification],
  }),
  parietal: card({
    classification: 'Hueso plano',
    description: 'Hueso par que forma gran parte del techo y de la pared superolateral del cráneo.',
    function: 'Protege el encéfalo y contribuye a la continuidad de la bóveda craneal.',
    articulations: [{ label: 'Parietal opuesto · sutura sagital', family: 'parietal' }, { label: 'Frontal · sutura coronal', family: 'frontal' }, { label: 'Occipital · sutura lambdoidea', family: 'occipital' }, { label: 'Temporal y esfenoides' }],
    parts: ['Cara externa e interna', 'Bordes frontal, sagital, occipital y escamoso'],
    relations: 'Su ángulo anteroinferior participa en el pterion, donde se encuentran frontal, parietal, temporal y ala mayor del esfenoides.',
    sources: [nlm('NBK499834', 'Anatomy, Head and Neck, Skull'), { title: 'FIPAT · Terminologia Anatomica Humana · Parietal', url: 'https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/LAEN/TAH403%20Unit%20EN.htm' }, classification],
  }),
  temporal: card({
    classification: 'Hueso plano del cráneo · clasificación FIPAT',
    description: 'Hueso par de la pared lateral y la base del cráneo, con una porción petrosa densa que aloja el oído interno.',
    function: 'Protege estructuras de audición y equilibrio y participa en la articulación de la mandíbula.',
    articulations: [{ label: 'Mandíbula', family: 'mandible' }, { label: 'Parietal, occipital, esfenoides y cigomático' }],
    parts: ['Porciones escamosa, petrosa, mastoidea y timpánica', 'Apófisis cigomática y estiloides', 'Fosa mandibular'],
    relations: 'Su apófisis cigomática integra el arco cigomático. La porción petrosa contiene la cóclea, el vestíbulo y los conductos semicirculares.',
    sources: [nlm('NBK535391', 'Temporal Fracture · anatomía del temporal'), { title: 'FIPAT · Terminologia Anatomica Humana · Temporal', url: 'https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/LAEN/TAH544%20Unit%20EN.htm' }],
  }),
  occipital: card({
    classification: 'Hueso plano',
    description: 'Hueso posterior e inferior del cráneo que rodea el agujero magno y participa en la fosa craneal posterior.',
    function: 'Protege el encéfalo posterior y conecta el cráneo con la primera vértebra cervical.',
    articulations: [{ label: 'Atlas · C1' }, { label: 'Parietales y temporales' }, { label: 'Esfenoides · unión en la base craneal' }],
    parts: ['Escama', 'Porción basilar', 'Porciones laterales y cóndilos', 'Agujero magno y líneas nucales'],
    relations: 'El agujero magno comunica las cavidades craneal y vertebral. Los cóndilos se apoyan en las superficies articulares superiores del atlas.',
    sources: [nlm('NBK541093', 'Anatomy, Head and Neck, Occipital Bone, Artery, Vein, and Nerve')],
  }),
  mandible: card({
    classification: 'Hueso irregular',
    description: 'Hueso móvil de la mandíbula inferior, compuesto por un cuerpo curvo y dos ramas ascendentes.',
    function: 'Sostiene los dientes inferiores y permite movimientos necesarios para masticar y hablar.',
    articulations: [{ label: 'Temporales · articulaciones temporomandibulares', family: 'temporal' }],
    parts: ['Cuerpo y porción alveolar', 'Ramas y ángulos', 'Apófisis coronoides', 'Apófisis condilares'],
    relations: 'El nervio alveolar inferior recorre el conducto mandibular. El músculo temporal se inserta en la apófisis coronoides.',
    additional: 'Un disco articular se interpone entre cada cóndilo mandibular y el temporal. El contacto entre dientes superiores e inferiores es oclusión dental.',
    sources: [nlm('NBK532292', 'Anatomy, Head and Neck, Mandible'), classification],
  }),
  maxilla: card({
    classification: 'Hueso irregular',
    description: 'Hueso par del maxilar superior. Participa en el suelo orbitario, la pared nasal lateral y el paladar duro.',
    function: 'Sostiene los dientes superiores y contribuye a separar las cavidades oral y nasal.',
    articulations: [{ label: 'Maxilar opuesto', family: 'maxilla' }, { label: 'Frontal y nasal' }, { label: 'Cigomático y palatino' }],
    parts: ['Cuerpo y seno maxilar', 'Apófisis frontal y cigomática', 'Apófisis palatina', 'Apófisis alveolar'],
    relations: 'El conducto infraorbitario recorre el suelo de la órbita. El seno maxilar ocupa el cuerpo del hueso.',
    sources: [nlm('NBK538527', 'Anatomy, Head and Neck, Maxilla'), classification],
  }),
  FMA12519: card({
    classification: 'Hueso irregular · vértebra cervical C1',
    description: 'Atlas: primera vértebra cervical, con forma de anillo y sin cuerpo vertebral ni apófisis espinosa.',
    function: 'Sostiene el cráneo y participa en la flexión y extensión de la cabeza y en su rotación junto al axis.',
    articulations: [{ label: 'Occipital · cóndilos', family: 'occipital' }, { label: 'Axis · C2' }],
    parts: ['Arco anterior', 'Arco posterior', 'Masas laterales', 'Apófisis transversas'],
    relations: 'El diente del axis queda detrás del arco anterior; el ligamento transverso lo mantiene en relación con el atlas.',
    sources: [cervical, classification],
  }),
  FMA12520: card({
    classification: 'Hueso irregular · vértebra cervical C2',
    description: 'Axis: segunda vértebra cervical, caracterizada por un diente que asciende desde su cuerpo hacia el anillo del atlas.',
    function: 'Proporciona el pivote que permite girar la cabeza y el atlas respecto al resto de la columna.',
    articulations: [{ label: 'Atlas · C1' }, { label: 'Tercera vértebra cervical · C3' }],
    parts: ['Cuerpo y diente', 'Arco vertebral', 'Superficies articulares', 'Apófisis espinosa'],
    relations: 'El diente se relaciona anteriormente con el arco anterior del atlas y posteriormente con su ligamento transverso.',
    sources: [cervical, classification],
  }),
};

/** Whole-bone cards must not masquerade as component or group descriptions. */
export function resolveBoneDetail(node: Pick<AnatomyNode, 'kind' | 'sourceId' | 'family'>): BoneDetail | undefined {
  if (node.kind !== 'structure') return undefined;
  return (node.sourceId ? BONE_DETAILS[node.sourceId] : undefined)
    ?? (node.family ? BONE_DETAILS[node.family] : undefined);
}
