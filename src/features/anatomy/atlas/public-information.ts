// Presentation-only summaries. Original educational records and technical provenance remain intact.
// Exact matches keep unrelated anatomical descriptions unchanged. null omits an internal-only field.
const summaries = new Map<string, string | null>([
  ["BodyParts3D / Anatomography","BodyParts3D / DBCLS"],
  ["Z-Anatomy · selección periférica","Z-Anatomy"],
  ["Cubre al pectoral menor; sus porciones confluyen hacia el húmero. Las aponeurosis y los cartílagos citados no son mallas óseas.","Cubre al pectoral menor; sus porciones confluyen hacia el húmero."],
  ["Es superficial al oblicuo interno; su aponeurosis participa en la vaina del recto. Esas relaciones no implican que todos esos tejidos estén modelados.","Es superficial al oblicuo interno; su aponeurosis participa en la vaina del recto."],
  ["Se sitúa lateral al longísimo torácico; la ficha distingue sus fijaciones lumbares y torácicas sin subdividir artificialmente la malla.","Se sitúa lateral al longísimo torácico."],
  ["La ficha resume el patrón descrito por UW; las expansiones no están anotadas como superficies en las mallas.","Las zonas de fijación se describen en la ficha; no están señaladas sobre el modelo."],
  ["Organización regional encefálica; no se representan tractos ni conexiones sinápticas.","Organización regional del encéfalo."],
  ["Las relaciones del árbol expresan organización anatómica. El contexto óseo muestra referencias craneales, sin afirmar conexiones funcionales por proximidad.","El contexto muestra las referencias óseas del cráneo."],
  ["Estructura de la región orbitaria identificada por la fuente; el trayecto geométrico puede ser parcial.","Estructura de la región orbitaria. Su representación puede ser parcial."],
  ["Referencias óseas curadas de la órbita. No se deduce inervación a partir de la distancia al modelo. Las vías y territorios descritos pueden no estar modelados.","El contexto muestra las referencias óseas de la órbita."],
  ["Cobertura geométrica parcial: troncos y fascículo posterior. Faltan raíces, divisiones y otros fascículos.","Representación parcial del plexo braquial mediante troncos y fascículo posterior."],
  ["Se muestran ramas identificadas del plexo; no una reconstrucción completa de la red proximal.","Representación parcial del plexo mediante algunas de sus ramas."],
  ["La ficha y el árbol distinguen componentes del plexo y nervios de sus ramas.","Componentes del plexo y nervios de sus ramas."],
  ["Las ramas disponibles no demuestran continuidad de toda la red. Médula, raíces espinales y ciático permanecen pendientes.","La representación del plexo es parcial y no muestra toda su continuidad."],
  ["Sólo ramas digitales dorsales disponibles; el tronco radial no está integrado.","Esta ficha corresponde a las ramas digitales dorsales del nervio radial."],
  ["La distribución sensitiva general no se deduce del grosor ni de la extensión de la malla.","El territorio sensitivo descrito es una referencia anatómica general."],
  ["Trayecto disponible de un nervio periférico; sus territorios y ramas pueden superar la geometría representada.","Nervio periférico representado de forma parcial."],
  ["Muslo anterior y, por el safeno, pierna medial. El safeno no está integrado.","Muslo anterior y, por el safeno, pierna medial."],
  ["El contexto reúne referencias óseas y, cuando se indican, músculos diana curados. No se infiere inervación por distancia ni se modelan inserciones nerviosas.","El contexto reúne huesos relacionados y, cuando se indican, músculos inervados."],
  ["Pared cardíaca identificada por la fuente; sin subdivisiones geométricas inventadas.","Pared cardíaca."],
  ["Red segmentada de origen, sin microvasculatura ni conexiones fabricadas.",null],
  ["División lobar formada por los componentes de parénquima identificados en la fuente.","División del pulmón en lóbulos."],
  ["Componente de parénquima correspondiente al segmento indicado por BodyParts3D.","Parénquima del segmento pulmonar indicado."],
  ["El intercambio gaseoso tiene lugar en los alvéolos, no modelados aquí.","El intercambio gaseoso tiene lugar en los alvéolos."],
  ["El diafragma es un músculo que contribuye a aumentar el volumen torácico durante la inspiración. Aquí se explica como relación; su geometría sigue pendiente.","El diafragma contribuye a aumentar el volumen torácico durante la inspiración."],
  ["Columna cervical y torácica por detrás; esófago posterior, no incluido aquí.","Columna cervical y torácica por detrás; esófago posterior."],
  ["Los grupos lobares reúnen árboles segmentarios; no equivalen a nuevos troncos lobares aislados.",null],
  ["Cavidad nasal, faringe, pleuras y microanatomía alveolar.",null],
  ["Una estructura continua, sin separar esfínteres.",null],
  ["Una unidad fuente; sin cortes artificiales.",null],
  ["Una pequeña pieza fuente de unión.",null],
  ["Una estructura fuente.",null],
  ["Una unidad fuente.",null],
  ["Parénquima agregado de ocho piezas originales.",null],
  ["Representación fuente del conducto disponible.",null],
  ["Las fichas describen la continuidad anatómica; las ausencias geométricas no se rellenan.",null],
  ["Los vasos y otras estructuras de contexto conservan su sistema original.",null],
  ["Abdomen y pelvis; no se fragmenta en el despiece regional.","Abdomen y pelvis."],
  ["Producción de testosterona; único propietario en Reproductor.","Producción de testosterona."],
  ["Bazo y timo disponibles; ganglios, amígdalas y conductos pendientes.","Bazo y timo."],
  ["Cobertura masculina parcial; atlas femenino futuro con marco propio.","Representación parcial del sistema reproductor masculino."],
  ["Glándulas disponibles; páncreas digestivo y testículos reproductores se relacionan sin duplicarlos.","Glándulas endocrinas y su relación con el páncreas y los testículos."],
  ["Representación fuente del tejido cavernoso del pene.","Tejido cavernoso del pene."],
  ["La piel forma la cubierta externa del cuerpo. En este atlas se representa su superficie macroscópica mediante una única pieza del cuerpo masculino de referencia.","La piel forma la cubierta externa del cuerpo."],
  ["Actúa como barrera protectora y participa en la sensibilidad y la regulación de la temperatura. Estas funciones dependen de tejidos y anexos que esta superficie no distingue.","Actúa como barrera protectora y participa en la sensibilidad y la regulación de la temperatura."],
  ["Cabeza, cuello, tronco y extremidades dentro de la misma superficie corporal.","Cabeza, cuello, tronco y extremidades."],
  ["Cubre las regiones musculares y óseas. El contexto muestra referencias superficiales curadas, sin afirmar contacto exacto ni medir grosor cutáneo.","Cubre las regiones musculares y óseas."],
  ["Sólo superficie externa. Epidermis, dermis y tejido subcutáneo no son capas separadas en esta geometría.","Se muestra la superficie externa, sin distinguir las capas de la piel."],
  ["Una malla nativa sin divisiones regionales seleccionables. No incluye uñas ni pelo como piezas independientes; no representa todos los cuerpos, edades o fenotipos.",null],
  ["Cobertura parcial de los globos oculares: córnea, esclerótica e iris. Se agrupa con las vías sensoriales para facilitar su estudio; no constituye un sistema corporal adicional.","Representación parcial del globo ocular: córnea, esclerótica e iris."],
  ["La córnea forma la porción anterior transparente de la cubierta del globo ocular. El material translúcido del atlas permite reconocer el iris y no simula la óptica del ojo.","La córnea forma la porción anterior transparente de la cubierta del globo ocular."],
  ["La esclerótica forma la cubierta fibrosa externa que rodea gran parte del globo ocular. Se conserva su geometría fuente, sin inflarla ni ajustarla a los párpados.","La esclerótica forma la cubierta fibrosa externa que rodea gran parte del globo ocular."],
  ["El iris rodea la abertura pupilar y participa en la regulación de la luz que entra al ojo. Su color en el atlas es esquemático y no identifica el color ocular del individuo.","El iris rodea la abertura pupilar y participa en la regulación de la luz que entra al ojo."],
  ["Cámaras, válvulas, tabique y músculos papilares, en 14 piezas independientes.","Explora las cámaras, válvulas, tabique y músculos papilares del corazón."],
  ["Lóbulos, segmentos broncopulmonares y árbol bronquial, en 58 piezas independientes.","Explora los lóbulos, segmentos broncopulmonares y árbol bronquial."],
  ["Hemisferios y estructuras corticales y profundas del modelo Allen, en 283 piezas independientes.","Explora los hemisferios y las estructuras corticales y profundas del encéfalo."]
]);

export function publicText(text: string): string | null {
  return summaries.has(text) ? summaries.get(text)! : text;
}

export function publicFields(fields: readonly (readonly string[])[]): [string, string][] {
  return fields.flatMap(([label, value]) => {
    const summary = publicText(value);
    return summary === null ? [] : [[label, summary] as [string, string]];
  });
}
