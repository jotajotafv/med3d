/**
 * Short, source-checked orientation cards. These describe a bone FAMILY, not
 * every landmark or every mesh assigned to it. Keep scope visible in the UI.
 * Bibliography and editorial limits: docs/phase2-bone-information.md.
 */
export interface BoneEducation {
  description: string;
  function: string;
  relations: string;
  source: { title: string; url: string };
  scope: 'family';
}

export interface BoneTerms {
  name: string;
  latin?: string;
  aliases: string[];
}

const openstax = (section: string, title: string) => ({
  title: `OpenStax · Anatomía y fisiología 2e · ${title}`,
  url: `https://openstax.org/books/anatomy-and-physiology-2e/pages/${section}`,
});

const skull = openstax('7-2-the-skull', '7.2 Cráneo');
const spine = openstax('7-3-the-vertebral-column', '7.3 Columna vertebral');
const thorax = openstax('7-4-the-thoracic-cage', '7.4 Caja torácica');
const shoulder = openstax('8-1-the-pectoral-girdle', '8.1 Cintura escapular');
const upper = openstax('8-2-bones-of-the-upper-limb', '8.2 Miembro superior');
const pelvis = openstax('8-3-the-pelvic-girdle-and-pelvis', '8.3 Pelvis');
const lower = openstax('8-4-bones-of-the-lower-limb', '8.4 Miembro inferior');
const hearing = {
  title: 'NIH / NIDCD · How Do We Hear?',
  url: 'https://www.nidcd.nih.gov/health/how-do-we-hear',
};

const card = (
  description: string,
  fn: string,
  relations: string,
  source: BoneEducation['source'],
): BoneEducation => ({ description, function: fn, relations, source, scope: 'family' });

/** Text relations are curated. They must not be inferred from mesh proximity. */
export const BONE_EDUCATION: Record<string, BoneEducation> = {
  frontal: card('Zona anterior craneal.', 'Protección encefálica.', 'Forma el techo orbitario.', skull),
  parietal: card('Techo y lados craneales.', 'Protección encefálica.', 'Limita con frontal, temporal y occipital.', skull),
  temporal: card('Bajo el parietal.', 'Aloja estructuras auditivas.', 'Se articula con mandíbula.', skull),
  occipital: card('Parte posterior craneal.', 'Protección encefálica.', 'Se articula con atlas.', skull),
  sphenoid: card('Base central craneal.', 'Soporte craneal.', 'Aloja la hipófisis.', skull),
  ethmoid: card('Entre órbitas.', 'Sostén nasal.', 'Participa en tabique y paredes orbitarias.', skull),
  mandible: card('Mandíbula inferior móvil.', 'Sostiene dientes inferiores.', 'Se articula con temporales.', skull),
  maxilla: card('Hueso facial par.', 'Sostiene dientes superiores.', 'Forma parte del paladar y órbita.', skull),
  zygomatic: card('Pómulo.', 'Sostén facial.', 'Participa en órbita y arco cigomático.', skull),
  nasal: card('Puente nasal.', 'Sostiene cartílagos nasales.', 'Se une al nasal opuesto.', skull),
  lacrimal: card('Pared orbitaria medial.', 'Contribuye al drenaje lagrimal.', 'Junto al conducto nasolagrimal.', skull),
  palatine: card('Paladar posterior.', 'Separa cavidades oral y nasal.', 'Se une al palatino opuesto.', skull),
  vomer: card('Tabique nasal posteroinferior.', 'Separa cavidades nasales.', 'Completa el tabique con etmoides.', skull),
  inferiornasalconcha: card('Cornete independiente inferior.', 'Favorece el acondicionamiento del aire.', 'Proyecta desde la pared nasal lateral.', skull),
  auditoryossicles: card(
    'Martillo, yunque y estribo del oído medio.',
    'Transmiten y amplifican vibraciones sonoras.',
    'Conducen la vibración del tímpano hacia el oído interno.',
    hearing,
  ),
  hyoid: card('Hueso cervical.', 'Sostiene la lengua.', 'Sin articulaciones con otros huesos.', skull),
  cervicalvertebrae: card(
    'Siete vértebras del cuello, C1–C7; atlas y axis son especializados.',
    'Sostienen la cabeza y permiten movilidad cervical.',
    'C1 se articula con el occipital y C2; el canal protege la médula.',
    spine,
  ),
  thoracicvertebrae: card(
    'Doce vértebras torácicas, T1–T12.',
    'Sostienen el tronco y protegen el contenido del canal vertebral.',
    'Presentan articulaciones con las costillas.',
    spine,
  ),
  lumbarvertebrae: card(
    'Cinco vértebras lumbares, L1–L5, de cuerpos voluminosos.',
    'Soportan gran parte del peso del tronco.',
    'Los discos separan cuerpos adyacentes; L5 se une al sacro.',
    spine,
  ),
  sacrum: card(
    'Hueso de cinco vértebras fusionadas.',
    'Participa en el soporte del peso corporal.',
    'Se articula con L5, ambos iliones y el cóccix.',
    spine,
  ),
  coccyx: card(
    'Extremo inferior de la columna, formado por vértebras fusionadas.',
    'Puede recibir parte del peso al sentarse.',
    'Se articula con el extremo inferior del sacro.',
    spine,
  ),
  ribs: card(
    'Doce pares de huesos curvos de la caja torácica.',
    'Contribuyen a proteger corazón y pulmones.',
    'Se articulan con vértebras torácicas; 1–7 conectan al esternón por cartílago propio, 8–10 indirectamente y 11–12 no se unen al esternón.',
    thorax,
  ),
  sternum: card(
    'Hueso anterior del tórax: manubrio, cuerpo y proceso xifoides.',
    'Completa el soporte anterior de la caja torácica.',
    'Se relaciona con clavículas y cartílagos costales.',
    thorax,
  ),
  clavicle: card(
    'Hueso curvo anterior de la cintura escapular.',
    'Sostiene la escápula y transmite fuerzas al esqueleto axial.',
    'Se articula con el manubrio y el acromion de la escápula.',
    shoulder,
  ),
  scapula: card(
    'Hueso triangular posterior del hombro.',
    'Ancla músculos que intervienen en movimientos del miembro superior.',
    'Se articula con clavícula y húmero; no con las costillas.',
    shoulder,
  ),
  humerus: card('Hueso del brazo.', 'Ofrece inserciones musculares para el movimiento.', 'Se articula con escápula, radio y cúbito.', upper),
  radius: card('Hueso lateral del antebrazo, del lado del pulgar.', 'Participa en codo y muñeca.', 'Se articula con húmero, cúbito, escafoides y semilunar.', upper),
  ulna: card('Hueso medial del antebrazo.', 'Participa en el codo.', 'Se articula con húmero y radio; no directamente con el carpo.', upper),
  carpals: card('Ocho huesos de la muñeca en dos filas.', 'Permiten movimientos de la muñeca.', 'La fila distal se articula con metacarpianos.', upper),
  metacarpals: card('Cinco huesos de la palma.', 'Contribuyen al soporte y prensión de la mano.', 'Entre carpo y falanges proximales.', upper),
  handphalanges: card('Huesos de los dedos de la mano.', 'Forman el soporte óseo digital.', 'Las proximales se articulan con metacarpianos; las falanges adyacentes se unen entre sí.', upper),
  hipbone: card(
    'Hueso coxal formado por ilion, isquion y pubis fusionados en el adulto.',
    'Transfiere cargas hacia el miembro inferior.',
    'Se une al sacro, al fémur y al coxal opuesto mediante la sínfisis púbica.',
    pelvis,
  ),
  ilium: card('Porción superior del coxal.', 'Participa en la transmisión de cargas.', 'Se articula con el sacro y converge con isquion y pubis en el acetábulo.', pelvis),
  ischium: card('Porción posteroinferior del coxal.', 'Su tuberosidad soporta peso al sentarse.', 'Converge con ilion y pubis en el acetábulo.', pelvis),
  pubis: card('Porción anterior del coxal.', 'Participa en el anillo pélvico.', 'Se une al pubis opuesto mediante la sínfisis púbica.', pelvis),
  femur: card('Hueso del muslo.', 'Sostén y anclaje muscular.', 'Se articula con coxal, tibia y rótula.', lower),
  patella: card('Hueso sesamoideo del tendón del cuádriceps.', 'Mejora la acción mecánica del cuádriceps.', 'Se articula con el fémur, no con la tibia.', lower),
  tibia: card('Hueso medial de la pierna.', 'Principal soporte de peso en la pierna.', 'Se articula con fémur, peroné y astrágalo.', lower),
  fibula: card('Hueso lateral de la pierna.', 'Ofrece inserciones musculares.', 'Se articula con tibia y astrágalo.', lower),
  tarsals: card('Siete huesos del tarso.', 'Participan en soporte y arcos del pie.', 'El astrágalo se articula con tibia y peroné; el calcáneo forma el talón.', lower),
  metatarsals: card('Cinco huesos del metatarso.', 'Contribuyen a los arcos del pie.', 'Entre tarso y falanges proximales.', lower),
  toephalanges: card('Huesos de los dedos del pie.', 'Forman el soporte óseo digital.', 'Las proximales se articulan con metatarsianos.', lower),
  sesamoid: card('Hueso incorporado en un tendón.', 'Reduce el roce del tendón sobre el hueso.', 'Se encuentra junto a una articulación; esta ficha no identifica un tendón concreto.', lower),
};

/** Family labels, not a replacement for each source asset's anatomical ID. */
export const BONE_TERMS: Record<string, BoneTerms> = {
  frontal: { name: 'Frontal', latin: 'Os frontale', aliases: ['hueso frontal', 'frontal bone'] },
  parietal: { name: 'Parietal', latin: 'Os parietale', aliases: ['hueso parietal', 'parietal bone'] },
  temporal: { name: 'Temporal', latin: 'Os temporale', aliases: ['hueso temporal', 'temporal bone'] },
  occipital: { name: 'Occipital', latin: 'Os occipitale', aliases: ['hueso occipital', 'occipital bone'] },
  sphenoid: { name: 'Esfenoides', latin: 'Os sphenoideum', aliases: ['hueso esfenoides', 'os sphenoidale', 'sphenoid bone'] },
  ethmoid: { name: 'Etmoides', latin: 'Os ethmoideum', aliases: ['hueso etmoides', 'os ethmoidale', 'ethmoid bone'] },
  mandible: { name: 'Mandíbula', latin: 'Mandibula', aliases: ['maxilar inferior', 'mandible', 'lower jaw'] },
  maxilla: { name: 'Maxilar', latin: 'Maxilla', aliases: ['maxilar superior', 'upper jaw'] },
  zygomatic: { name: 'Cigomático', latin: 'Os zygomaticum', aliases: ['malar', 'pómulo', 'zygomatic bone'] },
  nasal: { name: 'Nasal', latin: 'Os nasale', aliases: ['hueso nasal', 'huesos propios de la nariz', 'nasal bone'] },
  lacrimal: { name: 'Lagrimal', latin: 'Os lacrimale', aliases: ['lacrimal', 'unguis', 'lacrimal bone'] },
  palatine: { name: 'Palatino', latin: 'Os palatinum', aliases: ['hueso palatino', 'palatine bone'] },
  vomer: { name: 'Vómer', latin: 'Vomer', aliases: ['hueso vómer'] },
  inferiornasalconcha: { name: 'Concha nasal inferior', latin: 'Concha nasalis inferior', aliases: ['cornete inferior', 'cornete nasal inferior', 'inferior nasal concha', 'inferior turbinate'] },
  auditoryossicles: { name: 'Huesecillos del oído', latin: 'Ossicula auditus', aliases: ['osículos auditivos', 'auditory ossicles'] },
  hyoid: { name: 'Hioides', latin: 'Os hyoideum', aliases: ['hueso hioides', 'hyoid bone'] },
  cervicalvertebrae: { name: 'Vértebras cervicales', latin: 'Vertebrae cervicales', aliases: ['columna cervical', 'cervical vertebrae'] },
  thoracicvertebrae: { name: 'Vértebras torácicas', latin: 'Vertebrae thoracicae', aliases: ['vértebras dorsales', 'columna dorsal', 'thoracic vertebrae'] },
  lumbarvertebrae: { name: 'Vértebras lumbares', latin: 'Vertebrae lumbales', aliases: ['columna lumbar', 'lumbar vertebrae'] },
  sacrum: { name: 'Sacro', latin: 'Os sacrum', aliases: ['hueso sacro', 'sacrum'] },
  coccyx: { name: 'Cóccix', latin: 'Os coccygis', aliases: ['coxis', 'coccyx'] },
  ribs: { name: 'Costillas', latin: 'Costae', aliases: ['costilla', 'arcos costales', 'rib', 'ribs'] },
  sternum: { name: 'Esternón', latin: 'Sternum', aliases: ['hueso esternal'] },
  clavicle: { name: 'Clavícula', latin: 'Clavicula', aliases: ['clavicle', 'collarbone'] },
  scapula: { name: 'Escápula', latin: 'Scapula', aliases: ['omóplato', 'shoulder blade'] },
  humerus: { name: 'Húmero', latin: 'Humerus', aliases: ['hueso del brazo'] },
  radius: { name: 'Radio', latin: 'Radius', aliases: ['hueso radial'] },
  ulna: { name: 'Cúbito', latin: 'Ulna', aliases: ['ulna', 'hueso cubital'] },
  carpals: { name: 'Huesos del carpo', latin: 'Ossa carpi', aliases: ['carpo', 'carpianos', 'carpal bones'] },
  metacarpals: { name: 'Metacarpianos', latin: 'Ossa metacarpi', aliases: ['metacarpo', 'metacarpiano', 'metacarpals', 'metacarpal bones'] },
  handphalanges: { name: 'Falanges de la mano', latin: 'Phalanges manus', aliases: ['falange de la mano', 'huesos de los dedos de la mano', 'hand phalanges'] },
  hipbone: { name: 'Coxal', latin: 'Os coxae', aliases: ['hueso coxal', 'hueso de la cadera', 'hip bone', 'coxal bone', 'innominate bone'] },
  ilium: { name: 'Ilion', latin: 'Os ilium', aliases: ['ilíaco', 'iliaco', 'ilium'] },
  ischium: { name: 'Isquion', latin: 'Os ischii', aliases: ['ischium', 'hueso isquiático'] },
  pubis: { name: 'Pubis', latin: 'Os pubis', aliases: ['hueso púbico', 'pubic bone'] },
  femur: { name: 'Fémur', latin: 'Os femoris', aliases: ['femur', 'hueso del muslo', 'thigh bone'] },
  patella: { name: 'Rótula', latin: 'Patella', aliases: ['patela', 'kneecap'] },
  tibia: { name: 'Tibia', latin: 'Tibia', aliases: ['espinilla', 'shin bone'] },
  fibula: { name: 'Peroné', latin: 'Fibula', aliases: ['fíbula', 'fibula'] },
  tarsals: { name: 'Huesos del tarso', latin: 'Ossa tarsi', aliases: ['tarso', 'tarsianos', 'tarsal bones'] },
  metatarsals: { name: 'Metatarsianos', latin: 'Ossa metatarsi', aliases: ['metatarso', 'metatarsiano', 'metatarsals', 'metatarsal bones'] },
  toephalanges: { name: 'Falanges del pie', latin: 'Phalanges pedis', aliases: ['falange del pie', 'huesos de los dedos del pie', 'toe phalanges', 'foot phalanges'] },
  sesamoid: { name: 'Hueso sesamoideo', latin: 'Os sesamoideum', aliases: ['sesamoideo', 'sesamoid bone'] },
};
