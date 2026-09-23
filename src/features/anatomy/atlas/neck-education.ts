import type {MuscleAttachment, MuscleEducation, MuscleSource} from './muscle-education';

/** Curated from the cited educational sources; never inferred from mesh proximity. */
const ncbi = (id: string, title: string): MuscleSource => ({title: 'NCBI Bookshelf · ' + title, url: 'https://www.ncbi.nlm.nih.gov/books/' + id + '/'});
const table: MuscleSource = {title: 'Texas Tech University Health Sciences Center · Muscles of the head and neck', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html'};
export const CERVICAL_BONE_IDS = ['bp3d:FMA12519', 'bp3d:FMA12520', 'bp3d:FMA12521', 'bp3d:FMA12522', 'bp3d:FMA12523', 'bp3d:FMA12524', 'bp3d:FMA12525'];
const axial = (label: string, ...ids: string[]): MuscleAttachment => ({label, boneIds: {midline: ids}});
const paired = (label: string, right: string, left: string): MuscleAttachment => ({label, boneIds: {right: [right], left: [left]}});
const cervical = (label: string, first: number, last: number) => axial(label, ...CERVICAL_BONE_IDS.slice(first - 1, last));
const soft = (label: string): MuscleAttachment => ({label});
const occipital = 'bp3d:FMA52735', mandible = 'bp3d:FMA52748', hyoid = 'bp3d:FMA52749', sternum = 'bp3d:FMA7485';
const temporal = (label: string) => paired(label, 'bp3d:FMA52738', 'bp3d:FMA52739');
const clavicle = (label: string) => paired(label, 'bp3d:FMA13322', 'bp3d:FMA13323');
const rib1 = () => paired('Primera costilla.', 'bp3d:FMA7857', 'bp3d:FMA7987');
const rib2 = () => paired('Segunda costilla.', 'bp3d:FMA7882', 'bp3d:FMA8012');
const scaleneSource = ncbi('NBK519058', 'Scalenus Muscle');
const scaleneCommon = {region: 'Cuello', group: 'Cuello lateral', function: 'Coopera en el movimiento cervical y la inspiración.', innervation: 'Ramos anteriores de nervios espinales cervicales.', sources: [table, scaleneSource]};

/** Original Spanish summaries of general anatomy. No attachment masks or clinical certification. */
export const NECK_EDUCATION: Record<string, MuscleEducation> = {
  sternocleidomastoid: {
    name: 'Esternocleidomastoideo', latin: 'Musculus sternocleidomastoideus', region: 'Cuello', group: 'Cuello superficial',
    description: 'Músculo cervical que une esternón y clavícula con el cráneo.', function: 'Orienta la cabeza y colabora en la postura cervical.',
    action: 'Unilateral: inclinación ipsilateral y rotación contralateral. Bilateral: flexión cervical; el efecto sobre la cabeza depende de la postura.',
    origins: [axial('Manubrio del esternón.', sternum), clavicle('Extremo medial de la clavícula.')],
    insertions: [temporal('Apófisis mastoides del temporal.'), axial('Línea nucal superior del occipital.', occipital)],
    innervation: 'Nervio accesorio (XI), motor; plexo cervical, propiocepción.',
    relations: 'Delimita los triángulos anterior y posterior del cuello. Su geometría es una unidad por lado, sin cabezas separadas.',
    sources: [ncbi('NBK532881', 'Sternocleidomastoid Muscle')],
  },
  platysma: {
    name: 'Platisma', latin: 'Musculus platysma', region: 'Cuello', group: 'Cuello superficial · expresión facial',
    description: 'Lámina superficial que se extiende del tórax superior a la mandíbula y tejidos de la cara inferior.',
    function: 'Participa en la expresión facial y la tensión de la piel cervical.', action: 'Tensa la piel del cuello y contribuye a descender la mandíbula y los tejidos de la cara inferior.',
    origins: [soft('Fascia superficial que recubre las regiones pectoral y deltoidea.')],
    insertions: [axial('Porción anterior de la mandíbula.', mandible), soft('Piel y tejidos blandos de la cara inferior y comisura labial.')],
    innervation: 'Principalmente ramo cervical del nervio facial (VII).',
    relations: 'Superficial al esternocleidomastoideo. Las fijaciones fasciales y cutáneas no se sustituyen por huesos en el contexto.',
    sources: [ncbi('NBK545294', 'Platysma')],
  },
  scalenusanterior: {
    ...scaleneCommon, name: 'Escaleno anterior', latin: 'Musculus scalenus anterior',
    description: 'Músculo lateral entre vértebras cervicales y primera costilla.', action: 'Inclina el cuello y eleva la primera costilla.',
    origins: [cervical('Tubérculos anteriores de las apófisis transversas C3–C6.', 3, 6)], insertions: [rib1()],
    relations: 'El plexo braquial pasa entre los escalenos anterior y medio.',
  },
  scalenusmedius: {
    ...scaleneCommon, name: 'Escaleno medio', latin: 'Musculus scalenus medius',
    description: 'Músculo lateral situado detrás del escaleno anterior.', action: 'Inclina el cuello y eleva la primera costilla.',
    origins: [cervical('Tubérculos posteriores de las apófisis transversas C2–C7, según la referencia universitaria.', 2, 7)], insertions: [rib1()],
    relations: 'Forma el límite posterior del espacio interescalénico.',
  },
  scalenusposterior: {
    ...scaleneCommon, name: 'Escaleno posterior', latin: 'Musculus scalenus posterior',
    description: 'Músculo lateral que alcanza la segunda costilla.', action: 'Inclina el cuello y eleva la segunda costilla.',
    origins: [cervical('Tubérculos posteriores de las apófisis transversas C5–C7, según la referencia universitaria.', 5, 7)], insertions: [rib2()],
    relations: 'Las fijaciones pueden variar; los niveles citados no son landmarks medidos en este ejemplar.',
  },
  longuscapitis: {
    name: 'Largo de la cabeza', latin: 'Musculus longus capitis', region: 'Cuello', group: 'Prevertebrales',
    description: 'Músculo profundo anterior a la columna cervical.', function: 'Contribuye al control anterior de la cabeza.', action: 'Flexiona cabeza y cuello.',
    origins: [cervical('Tubérculos anteriores de las apófisis transversas C3–C6.', 3, 6)], insertions: [axial('Porción basilar del occipital.', occipital)],
    innervation: 'Ramos anteriores cervicales C1–C4.', relations: 'Se estudia con Aislar o Mostrar contexto cuando queda cubierto por capas anteriores.',
    sources: [table, ncbi('NBK541093', 'Occipital Bone, Artery, Vein, and Nerve')],
  },
  spleniuscapitis: {
    name: 'Esplenio de la cabeza', latin: 'Musculus splenius capitis', region: 'Cuello', group: 'Cuello posterior',
    description: 'Músculo posterior entre la región cervicotorácica y el cráneo.', function: 'Colabora en la orientación posterior de la cabeza.',
    action: 'Bilateral: extensión. Unilateral: rotación hacia el mismo lado.',
    origins: [axial('Apófisis espinosas C7–T3; la referencia describe extensión variable a T4.', 'bp3d:FMA12525', 'bp3d:FMA9165', 'bp3d:FMA9187', 'bp3d:FMA9209'), soft('Ligamentos posteriores asociados; T4 no se presupone en el contexto de este ejemplar.')],
    insertions: [temporal('Apófisis mastoides.'), axial('Tercio lateral de la línea nucal superior.', occipital)],
    innervation: 'Ramos posteriores de nervios cervicales.',
    relations: 'Profundo al trapecio; se conserva entero aunque cruza la unión cervicotorácica.',
    sources: [ncbi('NBK537074', 'Back, Muscles')],
  },
  sternohyoid: {
    name: 'Esternohioideo', latin: 'Musculus sternohyoideus', region: 'Cuello', group: 'Infrahioideos',
    description: 'Músculo infrahioideo alargado de la parte anterior del cuello.', function: 'Estabiliza la posición del hioides.', action: 'Desciende el hioides tras su elevación.',
    origins: [axial('Cara posterior del manubrio.', sternum), clavicle('Extremo esternal de la clavícula.')],
    insertions: [axial('Borde inferior del cuerpo del hioides.', hyoid)],
    innervation: 'Asa cervical (C1–C3).', relations: 'Cubre otros músculos infrahioideos que pueden quedar fuera de esta selección.',
    sources: [ncbi('NBK547693', 'Sternohyoid Muscle'), table],
  },
  mylohyoid: {
    name: 'Milohioideo', latin: 'Musculus mylohyoideus', region: 'Cuello', group: 'Suprahioideos',
    description: 'Músculo par que contribuye al suelo muscular de la boca.', function: 'Sostiene y eleva el suelo oral durante la deglución.',
    action: 'Eleva el hioides con mandíbula fija; ayuda a descender la mandíbula cuando el hioides está estabilizado.',
    origins: [axial('Línea milohioidea de la mandíbula.', mandible)], insertions: [axial('Cuerpo del hioides.', hyoid), soft('Rafe milohioideo medio.')],
    innervation: 'Nervio milohioideo, rama del alveolar inferior procedente de V3.',
    relations: 'Los lados se reúnen en el rafe medio, que no se representa como un hueso.',
    sources: [ncbi('NBK545293', 'Mylohyoid Muscle')],
  },
  geniohyoid: {
    name: 'Genihioideo', latin: 'Musculus geniohyoideus', region: 'Cuello', group: 'Suprahioideos',
    description: 'Músculo estrecho superior al milohioideo.', function: 'Coopera en la movilidad del hioides durante la deglución.',
    action: 'Lleva el hioides hacia delante y arriba; con éste fijo ayuda a descender la mandíbula.',
    origins: [axial('Espina mentoniana inferior de la mandíbula.', mandible)], insertions: [axial('Cuerpo del hioides.', hyoid)],
    innervation: 'Fibras C1 que acompañan al nervio hipogloso; no son fibras motoras propias del XII.',
    relations: 'Se conserva como músculo bilateral independiente del milohioideo.',
    sources: [ncbi('NBK539726', 'Hyoid Bone'), table],
  },
};
