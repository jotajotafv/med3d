import type {ComponentDetail, MuscleAttachment, MuscleEducation, MuscleSource} from './muscle-education';

/** Reviewed group membership; the group is not an additional muscle. */
export const QUADRICEPS_MEMBERS: Record<string, string[]> = {
  'muscular:group:quadriceps:right': ['bp3d:FMA38928', 'bp3d:FMA38930', 'bp3d:FMA38932', 'bp3d:FMA38934'],
  'muscular:group:quadriceps:left': ['bp3d:FMA38929', 'bp3d:FMA38931', 'bp3d:FMA38933', 'bp3d:FMA38935'],
};

/** Exact IDs checked against the preserved skeletal catalog, 23 September 2026.
 * They identify whole bones, never inferred attachment masks or nearest meshes.
 */
export const LIMB_BONES = {
  hip: ['FMA16586', 'FMA16587'], femur: ['FMA24474', 'FMA24475'],
  patella: ['FMA24486', 'FMA24487'], tibia: ['FMA24477', 'FMA24478'], fibula: ['FMA24480', 'FMA24481'],
  calcaneus: ['FMA24497', 'FMA24498'], navicular: ['FMA24500', 'FMA24501'],
  medialCuneiform: ['FMA24521', 'FMA24522'], intermediateCuneiform: ['FMA24523', 'FMA24524'],
  mt1: ['FMA24507', 'FMA24508'], mt2: ['FMA24509', 'FMA24510'], mt3: ['FMA24511', 'FMA24512'],
  mt4: ['FMA24513', 'FMA24514'], mt5: ['FMA24515', 'FMA24516'],
  humerus: ['FMA23130', 'FMA23131'], ulna: ['FMA23467', 'FMA23468'], radius: ['FMA23464', 'FMA23465'],
  mc2: ['FMA24466', 'FMA24467'],
} as const;
const bone = (label: string, ...keys: (keyof typeof LIMB_BONES)[]): MuscleAttachment => ({label, boneIds: {
  right: keys.map(key => 'bp3d:' + LIMB_BONES[key][0]), left: keys.map(key => 'bp3d:' + LIMB_BONES[key][1]),
}});
const soft = (label: string): MuscleAttachment => ({label});
const uw = (slug: string): MuscleSource => ({title: 'University of Washington · Muscle Atlas · ' + slug.replaceAll('-', ' '), url: 'https://rad.uw.edu/muscle-atlas/' + slug});
const lower: MuscleSource = {title: 'OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior', url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs'};
const patellarInsertion = [bone('Patela mediante el tendón del cuádriceps; continuidad hasta la tuberosidad tibial mediante el ligamento patelar.', 'patella', 'tibia')];
const calcanealInsertion = [bone('Cara posterior del calcáneo mediante el tendón calcáneo (de Aquiles).', 'calcaneus')];
const bicepsOrigins = [bone('Cabeza larga: tuberosidad isquiática, compartiendo un tendón proximal con el semitendinoso.', 'hip'), bone('Cabeza corta: labio lateral de la línea áspera y línea supracondílea lateral del fémur.', 'femur')];
const gastrocnemiusOrigins = [bone('Cabeza medial: cara posterior no articular del cóndilo medial del fémur.', 'femur'), bone('Cabeza lateral: superficie lateral del cóndilo lateral del fémur.', 'femur')];
const pronatorOrigins = [bone('Cabeza humeral: epicóndilo medial del húmero.', 'humerus'), bone('Cabeza ulnar: apófisis coronoides de la ulna.', 'ulna')];

export const LIMB_EDUCATION: Record<string, MuscleEducation> = {
  gluteusmaximus: {
    name: 'Glúteo mayor', latin: 'Musculus gluteus maximus', region: 'Región glútea', group: 'Grupo glúteo',
    description: 'Músculo extensor de la cadera con fijaciones óseas y fasciales.',
    function: 'Contribuye a impulsar el muslo hacia atrás.', action: 'Extiende y ayuda a rotar lateralmente la cadera.',
    origins: [bone('Ilion posterior y cresta ilíaca posterior.', 'hip'), {label: 'Cara posterior del sacro.', boneIds: {midline: ['bp3d:FMA16202']}}, soft('Cóccix y ligamento sacrotuberoso. El cóccix aún no está disponible en el atlas.')],
    insertions: [bone('Tuberosidad glútea del fémur.', 'femur'), soft('Tracto iliotibial de la fascia lata.')],
    innervation: 'Nervio glúteo inferior.', relations: 'Sus fijaciones incluyen el tracto iliotibial; esta fascia no se sustituye por un hueso en el contexto.',
    sources: [uw('gluteus-maximus')],
  },
  gluteusmedius: {
    name: 'Glúteo medio', latin: 'Musculus gluteus medius', region: 'Región glútea', group: 'Grupo glúteo',
    description: 'Músculo que conecta el ilion con el trocánter mayor.', function: 'Participa en la separación del muslo y el control de la cadera.',
    action: 'Abduce el muslo; sus fibras anteriores ayudan a la rotación medial y las posteriores a la lateral.',
    origins: [bone('Cara externa del ilion, inferior a la cresta ilíaca.', 'hip')],
    insertions: [bone('Superficies lateral y superior del trocánter mayor del fémur.', 'femur')],
    innervation: 'Nervio glúteo superior.', relations: 'Comparte con el glúteo menor una inserción trocantérica, en superficies diferentes.', sources: [uw('gluteus-medius'), uw('gluteus-minimus')],
  },
  gluteusminimus: {
    name: 'Glúteo menor', latin: 'Musculus gluteus minimus', region: 'Región glútea', group: 'Grupo glúteo',
    description: 'Músculo glúteo que se fija en la cara anterior del trocánter mayor.', function: 'Colabora en el control del movimiento de la cadera.',
    action: 'Abduce y rota medialmente el muslo.', origins: [bone('Ilion entre las líneas glúteas anterior e inferior.', 'hip')],
    insertions: [bone('Cara anterior del trocánter mayor del fémur.', 'femur')], innervation: 'Nervio glúteo superior.',
    relations: 'Su fijación trocantérica anterior es distinta de la lateral del glúteo medio.', sources: [uw('gluteus-minimus'), uw('gluteus-medius')],
  },
  tensorfasciaelatae: {
    name: 'Tensor de la fascia lata', latin: 'Musculus tensor fasciae latae', region: 'Región glútea y muslo lateral', group: 'Grupo glúteo',
    description: 'Músculo que transmite tensión al tracto iliotibial.', function: 'Ayuda a estabilizar la cadera y la rodilla mediante la fascia.',
    action: 'Tensa el tracto iliotibial; ayuda a flexionar y abducir el muslo.',
    origins: [bone('Espina ilíaca anterosuperior y labio externo de la cresta ilíaca anterior.', 'hip'), soft('Fascia lata.')],
    insertions: [soft('Tracto iliotibial. No se presenta como una inserción ósea directa.')], innervation: 'Nervio glúteo superior.',
    relations: 'Su acción sobre la rodilla se transmite por el tracto iliotibial.', sources: [uw('tensor-fascia-lata'), lower],
  },
  rectusfemoris: {
    name: 'Recto femoral', latin: 'Musculus rectus femoris', region: 'Muslo', group: 'Compartimento anterior · grupo cuádriceps',
    description: 'Uno de los cuatro músculos del cuádriceps; cruza la cadera y la rodilla.', function: 'Participa en la extensión de la rodilla.',
    action: 'Extiende la rodilla y ayuda a flexionar la cadera.',
    origins: [bone('Espina ilíaca anteroinferior y región supraacetabular.', 'hip')], insertions: patellarInsertion,
    innervation: 'Nervio femoral.', relations: 'Comparte el aparato extensor con los tres vastos. El grupo cuádriceps no añade un quinto músculo.', sources: [uw('rectus-femoris'), lower],
  },
  vastuslateralis: {
    name: 'Vasto lateral', latin: 'Musculus vastus lateralis', region: 'Muslo', group: 'Compartimento anterior · grupo cuádriceps',
    description: 'Componente muscular lateral del cuádriceps.', function: 'Contribuye al aparato extensor de la rodilla.', action: 'Extiende la rodilla.',
    origins: [bone('Región proximal del fémur, trocánter mayor y labio lateral de la línea áspera.', 'femur')], insertions: patellarInsertion,
    innervation: 'Nervio femoral.', relations: 'Sus fibras llegan a la región lateral de la patela mediante el tendón y retináculo patelares.', sources: [uw('vastus-lateralis'), lower],
  },
  vastusmedialis: {
    name: 'Vasto medial', latin: 'Musculus vastus medialis', region: 'Muslo', group: 'Compartimento anterior · grupo cuádriceps',
    description: 'Componente muscular medial del cuádriceps.', function: 'Contribuye al aparato extensor de la rodilla.', action: 'Extiende la rodilla.',
    origins: [bone('Porción inferior de la línea intertrocantérica, línea espiral y labio medial de la línea áspera del fémur.', 'femur')], insertions: patellarInsertion,
    innervation: 'Nervio femoral.', relations: 'Su tendón y retináculo alcanzan el borde medial de la patela.', sources: [uw('vastus-medialis'), lower],
  },
  vastusintermedius: {
    name: 'Vasto intermedio', latin: 'Musculus vastus intermedius', region: 'Muslo', group: 'Compartimento anterior · grupo cuádriceps',
    description: 'Músculo del cuádriceps situado profundo al recto femoral.', function: 'Contribuye al aparato extensor de la rodilla.', action: 'Extiende la rodilla.',
    origins: [bone('Dos tercios proximales de las caras anterior y lateral del fémur.', 'femur')], insertions: patellarInsertion,
    innervation: 'Nervio femoral.', relations: 'Se dispone entre los vastos medial y lateral y profundo al recto femoral.', sources: [uw('vastus-intermedius'), lower],
  },
  sartorius: {
    name: 'Sartorio', latin: 'Musculus sartorius', region: 'Muslo', group: 'Compartimento anterior',
    description: 'Músculo largo que conecta el ilion con la tibia medial.', function: 'Coordina movimientos de cadera y rodilla.',
    action: 'Flexiona y rota lateralmente la cadera; flexiona la rodilla.', origins: [bone('Espina ilíaca anterosuperior.', 'hip')],
    insertions: [bone('Superficie medial proximal de la tibia, cerca de la tuberosidad tibial.', 'tibia')], innervation: 'Nervio femoral.',
    relations: 'Cruza dos articulaciones; se conserva íntegro al desplazar el miembro por regiones.', sources: [uw('sartorius')],
  },
  adductorlongus: {
    name: 'Aductor largo', latin: 'Musculus adductor longus', region: 'Muslo', group: 'Compartimento medial',
    description: 'Músculo aductor que conecta el pubis con la diáfisis femoral.', function: 'Acerca el muslo a la línea media.',
    action: 'Aduce y ayuda a flexionar el muslo.', origins: [bone('Cara anterior del cuerpo del pubis, lateral a la sínfisis.', 'hip')],
    insertions: [bone('Tercio medio de la línea áspera del fémur.', 'femur')], innervation: 'División anterior del nervio obturador.',
    relations: 'Su inserción se relaciona con las de otros aductores y con el origen del vasto medial.', sources: [uw('adductor-longus')],
  },
  gracilis: {
    name: 'Grácil', latin: 'Musculus gracilis', region: 'Muslo', group: 'Compartimento medial',
    description: 'También llamado recto interno; alcanza la tibia desde la región púbica.', function: 'Participa en movimientos de cadera y rodilla.',
    action: 'Aduce el muslo, flexiona la rodilla y ayuda a rotar medialmente la tibia.',
    origins: [bone('Rama inferior del pubis y rama isquiática adyacente.', 'hip')], insertions: [bone('Cara medial proximal de la tibia.', 'tibia')],
    innervation: 'División anterior del nervio obturador.', relations: 'Se inserta por detrás del sartorio en la tibia medial.', sources: [uw('gracilis')],
  },
  bicepsfemoris: {
    name: 'Bíceps femoral', latin: 'Musculus biceps femoris', region: 'Muslo', group: 'Compartimento posterior',
    description: 'Músculo de dos cabezas, larga y corta, con origen e inervación diferentes.', function: 'Participa en el movimiento posterior del miembro inferior.',
    action: 'Flexiona la rodilla y rota lateralmente la tibia; sólo la cabeza larga extiende la cadera.', origins: bicepsOrigins,
    insertions: [bone('Principalmente cabeza de la fíbula; también expansiones al cóndilo tibial lateral.', 'fibula', 'tibia'), soft('Expansiones al ligamento colateral fibular.')],
    innervation: 'Cabeza larga: división tibial del ciático. Cabeza corta: división fibular común del ciático.',
    relations: 'La cabeza corta nace en el fémur y no cruza la cadera. La larga comparte origen tendinoso con el semitendinoso.', sources: [uw('biceps-femoris-long-head'), uw('biceps-femoris-short-head')],
  },
  semitendinosus: {
    name: 'Semitendinoso', latin: 'Musculus semitendinosus', region: 'Muslo', group: 'Compartimento posterior · isquiotibiales',
    description: 'Músculo posterior entre la tuberosidad isquiática y la tibia medial.', function: 'Participa en movimientos de cadera y rodilla.',
    action: 'Extiende la cadera, flexiona la rodilla y rota medialmente la tibia con la rodilla flexionada.',
    origins: [bone('Tuberosidad isquiática, mediante un tendón común con la cabeza larga del bíceps femoral.', 'hip')],
    insertions: [bone('Cara medial proximal de la tibia.', 'tibia')], innervation: 'División tibial del nervio ciático.',
    relations: 'Comparte el origen proximal con la cabeza larga del bíceps femoral.', sources: [uw('semitendinosus')],
  },
  semimembranosus: {
    name: 'Semimembranoso', latin: 'Musculus semimembranosus', region: 'Muslo', group: 'Compartimento posterior · isquiotibiales',
    description: 'Músculo posterior con inserción en el cóndilo tibial medial.', function: 'Participa en movimientos de cadera y rodilla.',
    action: 'Extiende la cadera, flexiona la rodilla y rota medialmente la tibia con la rodilla flexionada.',
    origins: [bone('Cuadrante superolateral de la tuberosidad isquiática.', 'hip')], insertions: [bone('Cara posterior del cóndilo medial de la tibia.', 'tibia')],
    innervation: 'División tibial del nervio ciático.', relations: 'Su fijación tibial es posterior y proximal respecto a la del semitendinoso.', sources: [uw('semimembranosus'), uw('semitendinosus')],
  },
  tibialisanterior: {
    name: 'Tibial anterior', latin: 'Musculus tibialis anterior', region: 'Pierna', group: 'Compartimento anterior',
    description: 'Músculo anterior que alcanza el borde medial del pie.', function: 'Eleva el antepié durante la dorsiflexión.', action: 'Dorsiflexiona el tobillo e invierte el pie.',
    origins: [bone('Cóndilo lateral y porción proximal de la cara lateral de la tibia.', 'tibia'), soft('Membrana interósea y fascia de la pierna.')],
    insertions: [bone('Cuneiforme medial y base del primer metatarsiano.', 'medialCuneiform', 'mt1')], innervation: 'Nervio fibular profundo (peroneo profundo).',
    relations: 'El contexto incluye la tibia y sus fijaciones óseas mediales del pie.', sources: [uw('tibialis-anterior')],
  },
  fibularislongus: {
    name: 'Fibular largo', latin: 'Musculus fibularis longus', region: 'Pierna', group: 'Compartimento lateral',
    description: 'También llamado peroneo largo; alcanza la región plantar medial del pie.', function: 'Contribuye al soporte del arco transverso.',
    action: 'Evierte el pie y ayuda a la flexión plantar del tobillo.', origins: [bone('Cabeza y porción proximal de la superficie lateral de la fíbula.', 'fibula')],
    insertions: [bone('Cuneiforme medial y base del primer metatarsiano por su superficie plantar.', 'medialCuneiform', 'mt1')],
    innervation: 'Principalmente nervio fibular superficial (peroneo superficial).', relations: 'Comparte el compartimento lateral con el fibular corto, pero tiene una inserción diferente.', sources: [uw('peroneus-longus'), uw('peroneus-brevis')],
  },
  fibularisbrevis: {
    name: 'Fibular corto', latin: 'Musculus fibularis brevis', region: 'Pierna', group: 'Compartimento lateral',
    description: 'También llamado peroneo corto; termina en el quinto metatarsiano.', function: 'Participa en el control lateral del pie.',
    action: 'Evierte el pie y ayuda a la flexión plantar del tobillo.', origins: [bone('Dos tercios distales de la cara lateral de la fíbula.', 'fibula')],
    insertions: [bone('Tuberosidad de la base del quinto metatarsiano.', 'mt5')], innervation: 'Nervio fibular superficial (peroneo superficial).',
    relations: 'Su inserción lateral en el pie difiere de la inserción plantar medial del fibular largo.', sources: [uw('peroneus-brevis'), uw('peroneus-longus')],
  },
  gastrocnemius: {
    name: 'Gastrocnemio', latin: 'Musculus gastrocnemius', region: 'Pierna', group: 'Compartimento posterior superficial',
    description: 'Músculo de la pantorrilla formado por cabezas medial y lateral.', function: 'Participa en la propulsión mediante el tendón calcáneo.',
    action: 'Flexiona plantarmente el tobillo y ayuda a flexionar la rodilla.', origins: gastrocnemiusOrigins, insertions: calcanealInsertion,
    innervation: 'Nervio tibial.', relations: 'Su aponeurosis se une con el tendón del sóleo; ambas cabezas forman un solo músculo.', sources: [uw('gastrocnemius'), lower],
  },
  soleus: {
    name: 'Sóleo', latin: 'Musculus soleus', region: 'Pierna', group: 'Compartimento posterior superficial',
    description: 'Músculo de la pantorrilla profundo al gastrocnemio.', function: 'Participa en el apoyo y la propulsión del cuerpo.',
    action: 'Flexiona plantarmente el tobillo.', origins: [bone('Cara posterior proximal de la fíbula y borde medial de la tibia.', 'fibula', 'tibia'), soft('Arco tendinoso entre sus fijaciones óseas.')],
    insertions: calcanealInsertion, innervation: 'Nervio tibial.', relations: 'Se une con la aponeurosis del gastrocnemio para formar el tendón calcáneo.', sources: [uw('soleus'), lower],
  },
  tibialisposterior: {
    name: 'Tibial posterior', latin: 'Musculus tibialis posterior', region: 'Pierna', group: 'Compartimento posterior profundo',
    description: 'Músculo posterior profundo con varias expansiones tendinosas en el pie.', function: 'Controla la inversión del pie.',
    action: 'Invierte y aduce el pie; ayuda a la flexión plantar del tobillo.',
    origins: [bone('Superficies posteriores proximales de la tibia y la fíbula.', 'tibia', 'fibula'), soft('Membrana interósea y tabiques fasciales.')],
    insertions: [bone('Tuberosidad del navicular; expansiones al cuneiforme intermedio y bases de los metatarsianos 2–4, según la descripción de UW.', 'navicular', 'intermediateCuneiform', 'mt2', 'mt3', 'mt4'), soft('La extensión al cuneiforme medial es variable; no se presupone en este espécimen.')],
    innervation: 'Nervio tibial.', relations: 'La ficha resume el patrón descrito por UW; las expansiones no están anotadas como superficies en las mallas.', sources: [uw('tibialis-posterior')],
  },
  flexorcarpiradialis: {
    name: 'Flexor radial del carpo', latin: 'Musculus flexor carpi radialis', region: 'Antebrazo', group: 'Compartimento anterior',
    description: 'Músculo flexor de la muñeca con inserción en el segundo metacarpiano.', function: 'Controla la flexión y desviación radial de la mano.',
    action: 'Flexiona y abduce la mano en la muñeca.', origins: [bone('Epicóndilo medial del húmero.', 'humerus')],
    insertions: [bone('Base del segundo metacarpiano.', 'mc2')], innervation: 'Nervio mediano.',
    relations: 'Une el origen humeral medial con la base del segundo metacarpiano.', sources: [uw('flexor-carpi-radialis')],
  },
  pronatorteres: {
    name: 'Pronador redondo', latin: 'Musculus pronator teres', region: 'Antebrazo', group: 'Compartimento anterior',
    description: 'Músculo pronador con cabezas humeral y ulnar.', function: 'Orienta la palma mediante la rotación del radio.',
    action: 'Prona el antebrazo y ayuda a flexionarlo en el codo.', origins: pronatorOrigins,
    insertions: [bone('Porción media de la cara lateral del radio.', 'radius')], innervation: 'Nervio mediano.',
    relations: 'Las dos cabezas tienen orígenes diferentes y una inserción radial compartida.', sources: [uw('pronator-teres')],
  },
  extensorcarpiradialislongus: {
    name: 'Extensor radial largo del carpo', latin: 'Musculus extensor carpi radialis longus', region: 'Antebrazo', group: 'Compartimento posterior',
    description: 'Músculo extensor que une el húmero lateral con la mano.', function: 'Controla la extensión y desviación radial de la muñeca.',
    action: 'Extiende y abduce la mano en la muñeca.', origins: [bone('Cresta supracondílea lateral del húmero.', 'humerus')],
    insertions: [bone('Base del segundo metacarpiano.', 'mc2')], innervation: 'Nervio radial.',
    relations: 'Se fija en el mismo metacarpiano que el flexor radial, con acción extensora.', sources: [uw('extensor-carpi-radialis-longus'), uw('flexor-carpi-radialis')],
  },
  supinator: {
    name: 'Supinador', latin: 'Musculus supinator', region: 'Antebrazo', group: 'Compartimento posterior profundo',
    description: 'Músculo que se fija alrededor de la porción proximal del radio.', function: 'Orienta la palma hacia anterior en posición anatómica.',
    action: 'Supina el antebrazo.', origins: [bone('Epicóndilo lateral del húmero y cresta/fosa del supinador en la ulna.', 'humerus', 'ulna'), soft('Ligamentos colateral radial y anular.')],
    insertions: [bone('Caras lateral, posterior y anterior del tercio proximal del radio.', 'radius')], innervation: 'Rama profunda del nervio radial.',
    relations: 'Su inserción abarca varias caras del radio proximal; los ligamentos de origen se conservan sólo como texto.', sources: [uw('supinator')],
  },
};

const bicepsLong: ComponentDetail = {family: 'bicepsfemoris', name: 'Cabeza larga', latin: 'Caput longum musculi bicipitis femoris', originIndex: 0,
  action: 'Flexiona la rodilla, rota lateralmente la tibia y extiende la cadera.', innervation: 'División tibial del nervio ciático.',
  sources: [uw('biceps-femoris-long-head')]};
const bicepsShort: ComponentDetail = {family: 'bicepsfemoris', name: 'Cabeza corta', latin: 'Caput breve musculi bicipitis femoris', originIndex: 1,
  action: 'Flexiona la rodilla y rota lateralmente la tibia; no extiende la cadera.', innervation: 'División fibular común del nervio ciático.',
  relations: 'Nace en el fémur y no cruza la articulación de la cadera.', sources: [uw('biceps-femoris-short-head')]};
const gastroMedial: ComponentDetail = {family: 'gastrocnemius', name: 'Cabeza medial', latin: 'Caput mediale musculi gastrocnemii', originIndex: 0};
const gastroLateral: ComponentDetail = {family: 'gastrocnemius', name: 'Cabeza lateral', latin: 'Caput laterale musculi gastrocnemii', originIndex: 1};
const pronatorHumeral: ComponentDetail = {family: 'pronatorteres', name: 'Cabeza humeral', latin: 'Caput humerale musculi pronatoris teretis', originIndex: 0};
const pronatorUlnar: ComponentDetail = {family: 'pronatorteres', name: 'Cabeza ulnar', latin: 'Caput ulnare musculi pronatoris teretis', originIndex: 1};
export const LIMB_COMPONENTS: Record<string, ComponentDetail> = {
  FMA45888: bicepsLong, FMA45889: bicepsLong, FMA45891: bicepsShort, FMA45892: bicepsShort,
  FMA45957: gastroMedial, FMA45958: gastroMedial, FMA45960: gastroLateral, FMA45961: gastroLateral,
  FMA38560: pronatorHumeral, FMA38561: pronatorHumeral, FMA38562: pronatorUlnar, FMA38563: pronatorUlnar,
};
