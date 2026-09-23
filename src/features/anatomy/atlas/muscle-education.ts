import type {AnatomyNode} from './types';
import {GAPS_EDUCATION, GAPS_COMPONENTS} from './gaps-education';
import {NECK_EDUCATION} from './neck-education';
import {LIMB_COMPONENTS, LIMB_EDUCATION, QUADRICEPS_MEMBERS} from './limb-education';

/** Curated anatomy, independent of mesh geometry. Reviewed 21 September 2026. */
export interface MuscleSource {title: string; url: string}
type BoneFamily = 'clavicle' | 'scapula' | 'humerus' | 'radius' | 'ulna' | 'hipbone';
export interface MuscleAttachment {
  label: string;
  /** Semantic association to the whole bone; never a surface annotation. */
  boneFamily?: BoneFamily;
  /** Reviewed exact IDs. Cartilage, fascia and ligaments have no bone surrogate. */
  boneIds?: Partial<Record<'right' | 'left' | 'midline', string[]>>;
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
  attachmentScope?: 'origin' | 'origin-and-insertion';
  innervationScope?: 'component';
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
const softAttachment = (label: string): MuscleAttachment => ({label});
const explicitAttachment = (label: string, boneIds: MuscleAttachment['boneIds']): MuscleAttachment => ({label, boneIds});
// Ordinal lists verified in the unchanged skeletal catalog; no name/distance lookup.
const ribs = {
  right: ['bp3d:FMA7857', 'bp3d:FMA7882', 'bp3d:FMA7909', 'bp3d:FMA7957', 'bp3d:FMA8066', 'bp3d:FMA8175', 'bp3d:FMA8229', 'bp3d:FMA8283', 'bp3d:FMA8364', 'bp3d:FMA8445', 'bp3d:FMA8531', 'bp3d:FMA8533'],
  left: ['bp3d:FMA7987', 'bp3d:FMA8012', 'bp3d:FMA8039', 'bp3d:FMA8148', 'bp3d:FMA8093', 'bp3d:FMA8202', 'bp3d:FMA8256', 'bp3d:FMA8310', 'bp3d:FMA8391', 'bp3d:FMA8472', 'bp3d:FMA8532', 'bp3d:FMA8534'],
};
const thoracicVertebrae = ['bp3d:FMA9165', 'bp3d:FMA9187', 'bp3d:FMA9209', 'bp3d:FMA9248', 'bp3d:FMA9922', 'bp3d:FMA9945', 'bp3d:FMA9968', 'bp3d:FMA9991', 'bp3d:FMA10014', 'bp3d:FMA10037', 'bp3d:FMA10059', 'bp3d:FMA10081'];
const lumbarVertebrae = ['bp3d:FMA13072', 'bp3d:FMA13073', 'bp3d:FMA13074', 'bp3d:FMA13075', 'bp3d:FMA13076'];
const C7 = 'bp3d:FMA12525', sacrum = 'bp3d:FMA16202', occipital = 'bp3d:FMA52735', sternum = 'bp3d:FMA7485';
const ribAttachment = (label: string, first: number, last: number): MuscleAttachment => explicitAttachment(label, {
  right: ribs.right.slice(first - 1, last), left: ribs.left.slice(first - 1, last),
});
const axialAttachment = (label: string, ...ids: string[]): MuscleAttachment => explicitAttachment(label, {midline: ids});
const universityTable: MuscleSource = {title: 'Texas Tech University Health Sciences Center · Tablas de anatomía muscular', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html'};
const abdomenLayers: MuscleSource = {title: 'OpenStax · Anatomy and Physiology 2e · 11.4 Pared abdominal y tórax', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax'};
const abdomenFascia: MuscleSource = {title: 'NCBI Bookshelf · StatPearls · Anterolateral Abdominal Wall Fascia', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK459392/'};
const abdomenNerves: MuscleSource = {title: 'NCBI Bookshelf · StatPearls · Anterolateral Abdominal Wall Nerves', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK556034/'};
const backGroups: MuscleSource = {title: 'OpenStax · Anatomy and Physiology 2e · 11.3 Musculatura de la espalda', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back'};
const paraspinalImaging: MuscleSource = {title: 'Life (2024) · Pictorial Essay on Ultrasound and Magnetic Resonance Imaging of Paraspinal Muscles', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11051048/'};
const iliocostalisReview: MuscleSource = {title: 'Journal of Yeungnam Medical Science (2022) · Revisión anatómica de la columna torácica y pared torácica', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9273134/'};
const backNerves: MuscleSource = {title: 'NCBI Bookshelf · StatPearls · Anatomy, Back, Muscles', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK537074/'};
const spinalisStudy: MuscleSource = {title: 'Thoracic and Lumbar Spine Dissection for Pediatric Deformity · Tabla de musculatura paravertebral', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12317433/'};
const pectoralParts: MuscleSource = {title: 'Haładaj et al. (2019) · Variaciones y porciones del pectoral mayor · BioMed Research International', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6466946/'};
const trapeziusParts: MuscleSource = {title: 'Levien et al. (2025) · Anatomía de las porciones del trapecio · Cureus', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12750476/'};
const trapeziusSegments: MuscleSource = {title: 'Pediatric Neurology (2011) · Anatomía segmentaria del trapecio', url: 'https://www.sciencedirect.com/science/article/abs/pii/S0887899410004479'};
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
  ...LIMB_EDUCATION,
  ...NECK_EDUCATION,
  ...GAPS_EDUCATION,
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
  pectoralismajor: {
    name: 'Pectoral mayor', latin: 'Musculus pectoralis major', region: 'Tórax', group: 'Musculatura pectoral',
    description: 'Músculo anterior en abanico. En este atlas se distinguen sus porciones clavicular, esternocostal y abdominal.',
    function: 'Conecta el tronco con el húmero y participa en los movimientos del brazo.',
    action: 'Aduce y rota medialmente el brazo; la porción clavicular contribuye a flexionarlo y la esternocostal a extenderlo desde flexión.',
    origins: [
      attachment('Porción clavicular: cara anterior de la mitad medial de la clavícula.', 'clavicle'),
      axialAttachment('Porción esternocostal: cara anterior del esternón y cartílagos costales superiores; la extensión costal varía.', sternum),
      softAttachment('Porción abdominal: aponeurosis del oblicuo externo.'),
    ],
    insertions: [attachment('Labio lateral del surco intertubercular del húmero.', 'humerus')],
    innervation: 'Nervios pectorales lateral y medial (C5–T1 para el conjunto del músculo).',
    relations: 'Cubre al pectoral menor; sus porciones confluyen hacia el húmero. Las aponeurosis y los cartílagos citados no son mallas óseas.',
    sources: [uw('pectoralis-major', 'Pectoralis Major'), pectoralParts],
  },
  pectoralisminor: {
    name: 'Pectoral menor', latin: 'Musculus pectoralis minor', region: 'Tórax', group: 'Musculatura pectoral',
    description: 'Músculo triangular situado profundo al pectoral mayor.',
    function: 'Ayuda a estabilizar la escápula contra la pared del tórax.',
    action: 'Tracciona la escápula hacia anterior e inferior.',
    origins: [ribAttachment('Costillas tercera a quinta, cerca de sus cartílagos.', 3, 5)],
    insertions: [attachment('Borde medial y cara superior de la apófisis coracoides de la escápula.', 'scapula')],
    innervation: 'Nervio pectoral medial (C8–T1).',
    relations: 'Une costillas y escápula; queda cubierto por el pectoral mayor.',
    sources: [uw('pectoralis-minor', 'Pectoralis Minor'), universityTable],
  },
  serratusanterior: {
    name: 'Serrato anterior', latin: 'Musculus serratus anterior', region: 'Tórax', group: 'Musculatura toracoescapular',
    description: 'Músculo de la pared lateral del tórax, con fascículos que alcanzan la cara costal de la escápula.',
    function: 'Mantiene el borde medial escapular próximo al tórax.',
    action: 'Protrae la escápula y contribuye a su rotación superior.',
    origins: [ribAttachment('Caras externas de las primeras ocho o nueve costillas; el contexto muestra las costillas 1–8.', 1, 8)],
    insertions: [attachment('Cara costal del borde medial de la escápula.', 'scapula')],
    innervation: 'Nervio torácico largo (C5–C7).',
    relations: 'Se interpone entre la escápula y la pared torácica; coopera con el trapecio en la rotación superior escapular.',
    sources: [uw('serratus-anterior', 'Serratus Anterior'), upperLimb],
  },
  subclavius: {
    name: 'Subclavio', latin: 'Musculus subclavius', region: 'Tórax', group: 'Musculatura pectoral',
    description: 'Músculo pequeño situado bajo la clavícula.',
    function: 'Contribuye a mantener estable la clavícula.',
    action: 'Desciende y lleva hacia anterior la clavícula.',
    origins: [ribAttachment('Primera costilla, en su unión con el cartílago costal.', 1, 1)],
    insertions: [attachment('Cara inferior de la clavícula.', 'clavicle')],
    innervation: 'Nervio del subclavio, procedente del tronco superior del plexo braquial.',
    relations: 'Forma una unión corta entre la primera costilla y la clavícula.',
    sources: [universityTable, upperLimb],
  },
  externaloblique: {
    name: 'Oblicuo externo', latin: 'Musculus obliquus externus abdominis', region: 'Abdomen', group: 'Pared abdominal anterolateral',
    description: 'Capa más superficial de los tres músculos planos de la pared abdominal lateral.',
    function: 'Sostiene el contenido abdominal y contribuye al control del tronco.',
    action: 'Comprime el abdomen y participa en la flexión, inclinación lateral y rotación del tronco.',
    origins: [ribAttachment('Caras externas de las costillas quinta a duodécima.', 5, 12)],
    insertions: [attachment('Mitad anterior de la cresta ilíaca y región púbica del hueso coxal.', 'hipbone'), softAttachment('Línea alba mediante su aponeurosis; el borde inferior forma el ligamento inguinal.')],
    innervation: 'Nervios toracoabdominales (T7–T11) y nervio subcostal (T12).',
    relations: 'Es superficial al oblicuo interno; su aponeurosis participa en la vaina del recto. Esas relaciones no implican que todos esos tejidos estén modelados.',
    sources: [abdomenLayers, abdomenFascia, abdomenNerves],
  },
  trapezius: {
    name: 'Trapecio', latin: 'Musculus trapezius', region: 'Espalda', group: 'Musculatura extrínseca de la espalda',
    description: 'Músculo superficial amplio, con fibras descendentes, transversas y ascendentes.',
    function: 'Estabiliza y orienta la cintura escapular.',
    action: 'Las fibras superiores elevan, las medias retraen y las inferiores descienden la escápula; superiores e inferiores cooperan en su rotación superior.',
    origins: [axialAttachment('Línea nucal superior y protuberancia occipital externa.', occipital), softAttachment('Ligamento nucal.'), axialAttachment('Apófisis espinosas de C7 a T12 y ligamentos asociados.', C7, ...thoracicVertebrae)],
    insertions: [attachment('Tercio lateral de la clavícula.', 'clavicle'), attachment('Acromion y espina de la escápula.', 'scapula')],
    innervation: 'Nervio accesorio (XI) para la función motora; aportes cervicales C3–C4 para sensibilidad y propiocepción.',
    relations: 'Cubre a los romboides. Los límites vertebrales entre porciones son convenciones descriptivas y no límites medidos en este ejemplar.',
    sources: [uw('trapezius', 'Trapezius'), trapeziusParts, trapeziusSegments],
  },
  rhomboidmajor: {
    name: 'Romboides mayor', latin: 'Musculus rhomboideus major', region: 'Espalda', group: 'Musculatura extrínseca de la espalda · romboides',
    description: 'Banda muscular que une la columna torácica con la escápula, bajo el trapecio.',
    function: 'Ayuda a fijar la escápula al tórax.',
    action: 'Retrae la escápula y contribuye a su rotación inferior.',
    origins: [axialAttachment('Apófisis espinosas de T2 a T5.', ...thoracicVertebrae.slice(1, 5))],
    insertions: [attachment('Borde medial escapular, por debajo de la raíz de la espina.', 'scapula')],
    innervation: 'Nervio dorsal de la escápula; principalmente C5, con aporte C4 descrito por la fuente.',
    relations: 'Se sitúa inferior al romboides menor y profundo al trapecio.',
    sources: [uw('rhomboid-major-and-minor', 'Rhomboid Major and Minor'), universityTable],
  },
  rhomboidminor: {
    name: 'Romboides menor', latin: 'Musculus rhomboideus minor', region: 'Espalda', group: 'Musculatura extrínseca de la espalda · romboides',
    description: 'Músculo corto entre la unión cervicotorácica y la escápula.',
    function: 'Colabora en la fijación escapular al tórax.',
    action: 'Retrae la escápula y contribuye a su rotación inferior.',
    origins: [axialAttachment('Apófisis espinosas de C7 y T1.', C7, thoracicVertebrae[0]), softAttachment('Porción inferior del ligamento nucal.')],
    insertions: [attachment('Borde medial escapular a la altura de la raíz de su espina.', 'scapula')],
    innervation: 'Nervio dorsal de la escápula; principalmente C5, con aporte C4 descrito por la fuente.',
    relations: 'Queda superior al romboides mayor y profundo al trapecio.',
    sources: [uw('rhomboid-major-and-minor', 'Rhomboid Major and Minor'), universityTable],
  },
  iliocostalislumborum: {
    name: 'Iliocostal lumbar', latin: 'Musculus iliocostalis lumborum', region: 'Espalda', group: 'Musculatura intrínseca · erectores espinales',
    description: 'División lumbar del iliocostal, en la columna lateral de los erectores espinales.',
    function: 'Contribuye al sostén postural de la columna.',
    action: 'Extiende la columna al actuar bilateralmente y la inclina hacia su lado al actuar unilateralmente.',
    origins: [attachment('Extremo medial de la cresta ilíaca.', 'hipbone'), axialAttachment('Cresta lateral del sacro.', sacrum), softAttachment('Fascia toracolumbar.')],
    insertions: [ribAttachment('Ángulos de las costillas quinta a duodécima, mediante sus fascículos torácicos.', 5, 12), axialAttachment('Apófisis transversas L1–L4, mediante sus fascículos lumbares.', ...lumbarVertebrae.slice(0, 4))],
    innervation: 'Ramos posteriores de los nervios espinales correspondientes.',
    relations: 'Se sitúa lateral al longísimo torácico; la ficha distingue sus fijaciones lumbares y torácicas sin subdividir artificialmente la malla.',
    sources: [iliocostalisReview, backGroups, backNerves],
  },
  iliocostalisthoracis: {
    name: 'Iliocostal torácico', latin: 'Musculus iliocostalis thoracis', region: 'Espalda', group: 'Musculatura intrínseca · erectores espinales',
    description: 'División torácica del iliocostal, situada lateral al longísimo.',
    function: 'Participa en el control postural del tronco.',
    action: 'Contribuye a la extensión bilateral y a la inclinación lateral ipsilateral de la columna.',
    origins: [ribAttachment('Ángulos de las seis costillas inferiores (7–12).', 7, 12)],
    insertions: [ribAttachment('Ángulos de las seis costillas superiores (1–6).', 1, 6), axialAttachment('Apófisis transversa de C7.', C7)],
    innervation: 'Ramos posteriores de los nervios espinales correspondientes.',
    relations: 'Pertenece a la columna lateral de los erectores espinales y conecta distintos niveles costales.',
    sources: [paraspinalImaging, backGroups, backNerves],
  },
  longissimusthoracis: {
    name: 'Longísimo torácico', latin: 'Musculus longissimus thoracis', region: 'Espalda', group: 'Musculatura intrínseca · erectores espinales',
    description: 'Componente amplio de la columna intermedia de los erectores espinales, con fascículos torácicos y lumbares.',
    function: 'Contribuye a sostener y controlar la columna.',
    action: 'Extiende el tronco e interviene en su inclinación lateral.',
    origins: [axialAttachment('Apófisis espinosas lumbares y cara dorsal del sacro, mediante su aponeurosis.', ...lumbarVertebrae, sacrum), attachment('Porción posterior de la cresta ilíaca.', 'hipbone'), softAttachment('Aponeurosis lumbar y ligamentos asociados.')],
    insertions: [axialAttachment('Apófisis transversas torácicas y lumbares.', ...thoracicVertebrae, ...lumbarVertebrae), ribAttachment('Costillas segunda a duodécima, según la descripción anatómica de referencia.', 2, 12)],
    innervation: 'Ramos posteriores de los nervios espinales torácicos y lumbares.',
    relations: 'Ocupa la región entre el iliocostal lateral y el espinal medial. Sus subdivisiones internas no se convierten en nuevas unidades del atlas.',
    sources: [{title: 'Elsevier · Complete Anatomy · Longissimus Thoracis Muscle', url: 'https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-back/longissimus-thoracis-muscle/21643'}, paraspinalImaging, backGroups],
  },
  spinalisthoracis: {
    name: 'Espinoso torácico', latin: 'Musculus spinalis thoracis', region: 'Espalda', group: 'Musculatura intrínseca · erectores espinales',
    description: 'Componente medial de los erectores espinales torácicos, próximo a las apófisis espinosas.',
    function: 'Participa en el sostén de la columna torácica.',
    action: 'Contribuye a la extensión y a la inclinación lateral del tronco.',
    origins: [axialAttachment('Apófisis espinosas T11–L2.', ...thoracicVertebrae.slice(10), ...lumbarVertebrae.slice(0, 2))],
    insertions: [axialAttachment('Apófisis espinosas T2–T8, según la referencia consultada.', ...thoracicVertebrae.slice(1, 8))],
    innervation: 'Ramos posteriores de los nervios espinales correspondientes.',
    relations: 'Se sitúa medial al longísimo torácico; el grupo erector incluye también al iliocostal.',
    sources: [spinalisStudy, backNerves, backGroups],
  },
  teresmajor: {
    name: 'Redondo mayor', latin: 'Musculus teres major', region: 'Espalda · transición escapular', group: 'Musculatura escapulohumeral',
    description: 'Músculo que conecta la región inferior de la escápula con el húmero.',
    function: 'Participa en el movimiento del brazo desde la escápula.',
    action: 'Aduce y rota medialmente el brazo; también contribuye a su extensión.',
    origins: [attachment('Cara posterior del ángulo inferior de la escápula.', 'scapula')],
    insertions: [attachment('Labio medial del surco intertubercular del húmero.', 'humerus')],
    innervation: 'Nervio subescapular inferior.',
    relations: 'Se sitúa inferior al redondo menor. No forma parte del manguito rotador.',
    sources: [uw('teres-major', 'Teres Major'), universityTable, upperLimb],
  },
};

export interface ComponentDetail {
  family: string;
  name: string;
  latin: string;
  originIndex: number;
  action?: string;
  origins?: MuscleAttachment[];
  insertions?: MuscleAttachment[];
  relations?: string;
  innervation?: string;
  sources?: MuscleSource[];
}
const deltoidClavicular: ComponentDetail = {family: 'deltoid', name: 'Porción clavicular', latin: 'Pars clavicularis musculi deltoidei', originIndex: 0, action: 'Contribuye a la flexión y a la rotación medial del brazo.'};
const deltoidAcromial: ComponentDetail = {family: 'deltoid', name: 'Porción acromial', latin: 'Pars acromialis musculi deltoidei', originIndex: 1, action: 'Contribuye a la abducción del brazo.'};
const deltoidSpinal: ComponentDetail = {family: 'deltoid', name: 'Porción espinal', latin: 'Pars spinalis musculi deltoidei', originIndex: 2, action: 'Contribuye a la extensión y a la rotación lateral del brazo.'};
const bicepsShort: ComponentDetail = {family: 'bicepsbrachii', name: 'Cabeza corta', latin: 'Caput breve musculi bicipitis brachii', originIndex: 0};
const bicepsLong: ComponentDetail = {family: 'bicepsbrachii', name: 'Cabeza larga', latin: 'Caput longum musculi bicipitis brachii', originIndex: 1};
const tricepsMedial: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza medial', latin: 'Caput mediale musculi tricipitis brachii', originIndex: 0, action: 'Contribuye a la extensión del antebrazo en el codo.'};
const tricepsLateral: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza lateral', latin: 'Caput laterale musculi tricipitis brachii', originIndex: 1, action: 'Contribuye a la extensión del antebrazo en el codo.'};
const tricepsLong: ComponentDetail = {family: 'tricepsbrachii', name: 'Cabeza larga', latin: 'Caput longum musculi tricipitis brachii', originIndex: 2};
const pectoralClavicular: ComponentDetail = {family: 'pectoralismajor', name: 'Porción clavicular', latin: 'Pars clavicularis musculi pectoralis majoris', originIndex: 0, action: 'Contribuye a flexionar, aducir y rotar medialmente el brazo.'};
const pectoralSternocostal: ComponentDetail = {family: 'pectoralismajor', name: 'Porción esternocostal', latin: 'Pars sternocostalis musculi pectoralis majoris', originIndex: 1, action: 'Contribuye a la aducción y rotación medial; ayuda a extender el brazo desde una posición flexionada.'};
const pectoralAbdominal: ComponentDetail = {family: 'pectoralismajor', name: 'Porción abdominal', latin: 'Pars abdominalis musculi pectoralis majoris', originIndex: 2, action: 'Participa en la acción conjunta de aducción y rotación medial del pectoral mayor.', relations: 'Su origen aponeurótico se conserva como texto. El contexto óseo muestra el húmero de inserción; no sustituye la aponeurosis por una costilla.'};
// Conventional subdivisions from the cited component reference. These are
// descriptions, not source-specimen attachment measurements or 3D masks.
const trapeziusDescending: ComponentDetail = {
  family: 'trapezius', name: 'Porción descendente', latin: 'Pars descendens musculi trapezii', originIndex: 0,
  origins: [axialAttachment('Protuberancia occipital externa y tercio medial de la línea nucal superior.', occipital), softAttachment('Ligamento nucal.')],
  insertions: [attachment('Tercio lateral de la clavícula.', 'clavicle')],
  action: 'Eleva la escápula y coopera con las fibras inferiores en su rotación superior.',
};
const trapeziusTransverse: ComponentDetail = {
  family: 'trapezius', name: 'Porción transversa', latin: 'Pars transversa musculi trapezii', originIndex: 2,
  origins: [axialAttachment('Apófisis espinosas T1–T4, según la subdivisión convencional de la referencia.', ...thoracicVertebrae.slice(0, 4))],
  insertions: [attachment('Espina de la escápula y región acromial.', 'scapula')],
  action: 'Retrae la escápula hacia la columna.',
};
const trapeziusAscending: ComponentDetail = {
  family: 'trapezius', name: 'Porción ascendente', latin: 'Pars ascendens musculi trapezii', originIndex: 2,
  origins: [axialAttachment('Apófisis espinosas T4–T12, según la subdivisión convencional de la referencia.', ...thoracicVertebrae.slice(3))],
  insertions: [attachment('Extremo medial de la espina de la escápula.', 'scapula')],
  action: 'Desciende la escápula y coopera con las fibras superiores en su rotación superior.',
};

/** Exact source IDs from docs/phase3-registration.md; no name matching. */
const components: Record<string, ComponentDetail> = {
  ...LIMB_COMPONENTS,
  ...GAPS_COMPONENTS,
  FMA34680: deltoidClavicular, FMA34681: deltoidClavicular,
  FMA34682: deltoidAcromial, FMA34683: deltoidAcromial,
  FMA34684: deltoidSpinal, FMA34685: deltoidSpinal,
  FMA37684: bicepsShort, FMA37685: bicepsShort,
  FMA37686: bicepsLong, FMA37687: bicepsLong,
  FMA37695: tricepsMedial, FMA37696: tricepsMedial,
  FMA37697: tricepsLateral, FMA37698: tricepsLateral,
  FMA37699: tricepsLong, FMA37700: tricepsLong,
  FMA34690: pectoralClavicular, FMA34691: pectoralClavicular,
  FMA79979: pectoralSternocostal, FMA79980: pectoralSternocostal,
  FMA45874: pectoralAbdominal, FMA45875: pectoralAbdominal,
  FMA33581: trapeziusAscending, FMA33583: trapeziusAscending,
  FMA33584: trapeziusTransverse, FMA33585: trapeziusTransverse,
  FMA33586: trapeziusDescending, FMA33587: trapeziusDescending,
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
    attachmentScope: component.insertions ? 'origin-and-insertion' : 'origin',
    description: `${component.name} del ${education.name.toLowerCase()}. Forma parte de ese músculo y no se contabiliza como otro músculo independiente.`,
    action: component.action || education.action,
    origins: component.origins || [education.origins[component.originIndex]],
    insertions: component.insertions || education.insertions,
    relations: component.relations || education.relations,
    innervation: component.innervation || education.innervation,
    innervationScope: component.innervation ? 'component' : undefined,
    sources: component.sources || education.sources,
  };
}

/** Existing skeletal IDs, verified in the preserved skeletal source catalog. */
export const MUSCLE_CONTEXT_BONE_IDS: Record<'right' | 'left', Record<BoneFamily, string>> = {
  right: {clavicle: 'bp3d:FMA13322', scapula: 'bp3d:FMA13395', humerus: 'bp3d:FMA23130', radius: 'bp3d:FMA23464', ulna: 'bp3d:FMA23467', hipbone: 'bp3d:FMA16586'},
  left: {clavicle: 'bp3d:FMA13323', scapula: 'bp3d:FMA13396', humerus: 'bp3d:FMA23131', radius: 'bp3d:FMA23465', ulna: 'bp3d:FMA23468', hipbone: 'bp3d:FMA16587'},
};

/**
 * Whole bones supported by this card's origin/insertion associations. A
 * component uses its own reviewed attachments, not those of its siblings.
 * Midline bones require an explicit ID; missing bones and non-bony attachments
 * are omitted without geometric, tissue-surrogate or contralateral fallback.
 */
export function getMuscleContextIds(node: AnatomyNode | undefined, byId: ReadonlyMap<string, AnatomyNode>): string[] {
  if (node?.systemId === 'muscular' && node.kind === 'division' && QUADRICEPS_MEMBERS[node.id]) {
    return [...new Set(QUADRICEPS_MEMBERS[node.id].flatMap(id => getMuscleContextIds(byId.get(id), byId)))];
  }
  const detail = resolveMuscleDetail(node);
  if (!detail || !node || (node.side !== 'right' && node.side !== 'left')) return [];
  const side = node.side;
  const ids = [...detail.origins, ...detail.insertions].flatMap(item => [
    ...(item.boneFamily ? [MUSCLE_CONTEXT_BONE_IDS[side][item.boneFamily]] : []),
    ...(item.boneIds?.[side] || []),
    ...(item.boneIds?.midline || []),
  ]);
  return [...new Set(ids)].filter(id => {
    const bone = byId.get(id);
    return bone?.systemId === 'skeletal' && (bone.side === side || bone.side === 'midline');
  });
}
