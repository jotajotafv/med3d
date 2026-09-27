import type {AnatomyNode} from './types';
export interface NerveDetail {
  description: string; function: string; course: string; territory: string;
  modality: string; relations: string; sources: {title:string;url:string}[];
}
const CNS = {title:'OpenStax · Sistema nervioso central',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system'};
const ASSOCIATION = {title:'Purves et al. · Cortezas de asociación',url:'https://www.ncbi.nlm.nih.gov/books/NBK10952/'};
const ORBIT = {title:'Anatomy of the Orbit · revisión anatómica',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7561454/'};
const MOTOR = {title:'Cranial Nerves III, IV, and VI · anatomía funcional',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC2801485/'};
const SOURCE = {title:'DBCLS · BodyParts3D, identificación de las piezas',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'};
// Concise editorial summaries. Model geometry never establishes neural function.
const central: Record<string,[string,string]> = {
 FMA61898:['Corteza parietal de asociación.','Integración multimodal, lenguaje y cognición.'],
 FMA62434:['Corteza de la cara medial cerebral.','Participa en redes de emoción, atención y conducta.'],
 FMA61860:['Región inferior de la corteza frontal.','Participa en redes de lenguaje y control cognitivo.'],
 FMA61907:['Región inferior de la corteza temporal.','Procesamiento visual de alto nivel.'],
 FMA67329:['Corteza profunda en el surco lateral.','Integración de señales corporales internas y sensoriales.'],
 FMA61950:['Sustancia blanca profunda.','Conduce fibras de proyección entre corteza y estructuras subcorticales.'],
 FMA241998:['Sustancia blanca del hemisferio.','Conecta regiones mediante haces de axones.'],
 FMA62493:['Estructura temporal medial.','Contribuye a la formación de memoria.'],
 FMA62008:['Componente del diencéfalo.','Regula funciones homeostáticas, autónomas y endocrinas.'],
 FMA62032:['Región epitalámica.','Participa en circuitos que relacionan estados internos y conducta.'],
 FMA62327:['Zona basal del hipotálamo.','Forma parte de la organización hipotalámica; no es un nervio.'],
 FMA62404:['Relieve dorsal del mesencéfalo.','Relevo e integración auditiva.'],
 FMA62403:['Relieve dorsal del mesencéfalo.','Orientación ante estímulos y coordinación de movimientos oculares.'],
 FMA62004:['Porción caudal del tronco encefálico.','Integra funciones autónomas y vías ascendentes y descendentes.'],
 FMA61993:['Porción rostral del tronco encefálico.','Integra vías motoras, sensoriales y oculomotoras.'],
 FMA67943:['Porción del tronco entre mesencéfalo y bulbo.','Conecta circuitos encefálicos, incluidos los cerebelosos.'],
 FMA67944:['Región encefálica posterior al tronco.','Coordina el movimiento y el aprendizaje motor.'],
 FMA61908:['Región cortical occipitotemporal inferior.','Participa en reconocimiento visual.'],
 FMA61918:['Corteza temporal medial contigua al hipocampo.','Participa en memoria y procesamiento contextual.'],
 FMA61859:['Región media de la corteza frontal.','Participa en redes de planificación y control.'],
 FMA61906:['Región lateral de la corteza temporal.','Participa en redes de asociación y procesamiento semántico.'],
 FMA67325:['Lóbulo posterior del cerebro.','Procesamiento visual.'],
 FMA61896:['Corteza posterior al surco central.','Procesamiento somatosensorial primario.'],
 FMA61894:['Corteza anterior al surco central.','Control motor voluntario.'],
 FMA61857:['Región superior de la corteza frontal.','Participa en redes de control y planificación.'],
 FMA61899:['Región parietal superior.','Integración somatosensorial y espacial.'],
 FMA61897:['Región parietal inferior junto al surco lateral.','Participa en redes multimodales y del lenguaje.'],
};
// [modality, territory, general course]. These are text references, never attachment geometry.
const orbital: Record<string,[string,string,string]> = {
 FMA50875:['Sensitivo especial','Visión desde la retina','Órbita y canal óptico hacia el quiasma.'],
 FMA50878:['Sensitivo especial','Visión desde la retina','Órbita y canal óptico hacia el quiasma.'],
 FMA50881:['Motor somático','Músculo oblicuo superior','Desde el mesencéfalo hacia la órbita por la fisura orbitaria superior.'],
 FMA50882:['Motor somático','Músculo oblicuo superior','Desde el mesencéfalo hacia la órbita por la fisura orbitaria superior.'],
 FMA52572:['Motor somático','Recto superior y elevador del párpado superior','División superior del III en la órbita.'],
 FMA52573:['Motor somático y parasimpático','Rectos medial e inferior, oblicuo inferior; vía hacia el ganglio ciliar','División inferior del III en la órbita.'],
 FMA52621:['Sensitivo','Órbita y territorios de V1','Desde el trigémino hacia la fisura orbitaria superior.'],
 FMA52638:['Sensitivo','Frente y párpado superior','Rama de V1 por el techo orbitario.'],
 FMA52628:['Sensitivo; transporta fibras autónomas','Glándula lagrimal y párpado lateral','Rama lateral de V1 en la órbita.'],
 FMA52668:['Sensitivo; vía de fibras autónomas','Globo ocular y región nasal','Rama de V1 que cruza la órbita hacia medial.'],
 FMA52655:['Sensitivo','Frente y cuero cabelludo anterior','Del frontal al borde supraorbitario.'],
 FMA52642:['Sensitivo','Frente medial','Del frontal hacia la región superior de la tróclea.'],
 FMA52675:['Sensitivo','Región etmoidal y nasal anterior','Rama del nasociliar por el conducto etmoidal anterior.'],
 FMA52714:['Sensitivo','Región etmoidal posterior','Rama del nasociliar por el conducto etmoidal posterior.'],
 FMA52693:['Sensitivo','Canto medial y región nasal adyacente','Rama terminal del nasociliar bajo la tróclea.'],
 FMA52691:['Sensitivo y simpático','Globo ocular','Del nasociliar hacia el globo, sin relevo en el ganglio ciliar.'],
 FMA52672:['Comunicación sensitiva','Conexión nasociliar–ganglio ciliar','Rama comunicante; no equivale al ganglio ni a toda la vía autónoma.'],
 FMA53549:['Ganglio parasimpático','Acomodación y constricción pupilar','Relevo orbitario de fibras del III; salida por nervios ciliares cortos.'],
 FMA53550:['Ganglio parasimpático','Acomodación y constricción pupilar','Relevo orbitario de fibras del III; salida por nervios ciliares cortos.'],
};
export function resolveNerveDetail(node:AnatomyNode):NerveDetail|null {
 if(node.systemId!=='nervous'||!node.family)return null;
 const c=central[node.family],o=orbital[node.family];
 if(c)return {description:c[0],function:c[1],course:'Organización regional encefálica; no se representan tractos ni conexiones sinápticas.',territory:'Sistema nervioso central',modality:'Tejido central: la clasificación motor/sensitivo/mixto de un nervio periférico no se aplica.',relations:'Las relaciones del árbol expresan organización anatómica. El contexto óseo muestra referencias craneales, sin afirmar conexiones funcionales por proximidad.',sources:[CNS,ASSOCIATION,SOURCE]};
 if(o)return {description:node.neuralType==='ganglio'?'Ganglio autónomo orbitario identificado por la fuente.':'Estructura de la región orbitaria identificada por la fuente; el trayecto geométrico puede ser parcial.',function:o[0].startsWith('Motor')?'Conducción eferente hacia los efectores indicados.':o[0].startsWith('Ganglio')?'Relevo parasimpático ocular.':'Conducción de las modalidades indicadas.',course:o[2],territory:o[1],modality:o[0],relations:'Referencias óseas curadas de la órbita. No se deduce inervación a partir de la distancia al modelo. Las vías y territorios descritos pueden no estar modelados.',sources:[ORBIT,MOTOR,SOURCE]};
 return null;
}
// Explicit curated IDs: frontal, occipital, sphenoid. No nearest-neighbour inference.
export function getNerveContextIds(node:AnatomyNode,byId:Map<string,AnatomyNode>):string[] {
 if(node.systemId!=='nervous')return [];
 const ids=node.assetIds.includes('nervous:cranial')||node.family==='FMA50875'||node.family==='FMA50878'
  ?['bp3d:FMA52736','bp3d:FMA52734']:['bp3d:FMA52735','bp3d:FMA52736'];
 return ids.filter(id=>byId.get(id)?.systemId==='skeletal');
}
