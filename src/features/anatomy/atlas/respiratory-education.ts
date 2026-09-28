import type {AnatomyNode} from './types';
export interface RespiratoryDetail {description:string; fields:[string,string][]; sources:{title:string;url:string}[]; representation:string}
const AIRWAY={title:'OpenStax · Estructuras respiratorias',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-1-organs-and-structures-of-the-respiratory-system'};
const LUNGS={title:'OpenStax · Pulmones',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/22-2-the-lungs'};
const BRONCHI={title:'NCBI Bookshelf · Árbol traqueobronquial',url:'https://www.ncbi.nlm.nih.gov/books/NBK556044/'};
const BREATHING={title:'NIH/NHLBI · Respiración y diafragma',url:'https://www.nhlbi.nih.gov/health/lungs/body-controls-breathing'};
const SOURCE={title:'DBCLS · BodyParts3D',url:'https://lifesciencedb.jp/bp3d/'};
const CARTILAGE:Record<string,string>={
 FMA9615:'Anillo cartilaginoso situado entre el tiroides y la tráquea.',
 FMA55099:'Gran cartílago anterior que protege las estructuras laríngeas.',
 FMA55130:'Cartílago elástico que participa en la protección de la entrada laríngea durante la deglución.',
 FMA55113:'Cartílago par que interviene en la posición de los pliegues vocales.',
 FMA55114:'Cartílago par que interviene en la posición de los pliegues vocales.',
 FMA55115:'Pequeño cartílago asociado al vértice del aritenoides.',
 FMA55116:'Pequeño cartílago asociado al vértice del aritenoides.',
 FMA55117:'Pequeño soporte cartilaginoso del pliegue ariepiglótico.',
 FMA55118:'Pequeño soporte cartilaginoso del pliegue ariepiglótico.',
};
export function resolveRespiratoryDetail(node:AnatomyNode):RespiratoryDetail|undefined {
 if(node.systemId!=='respiratory')return undefined;
 const category=node.respiratoryClass,side=node.side==='right'?'Derecho':node.side==='left'?'Izquierdo':'Línea media o conjunto';
 const fields:[string,string][]=[['Tipo',node.respiratoryType||'Grupo anatómico'],['Lado',side]];
 let description='Conjunto de las estructuras respiratorias incorporadas al atlas.',representation='Cobertura macroscópica disponible; no representa fisiología ni parámetros clínicos del modelo.',sources=[AIRWAY,SOURCE];
 if(category==='cartilage'){
  description=CARTILAGE[node.sourceId||'']||'Representación de los cartílagos laríngeos disponibles.';
  fields.push(['Región','Cuello'],['Función','Sostén y protección de la vía aérea laríngea.'],['Continuidad','Faringe → laringe → tráquea.'],['Relaciones','Hioides, cartílagos vecinos y región cervical.']);
  representation='Se muestran cartílagos identificados; no una laringe completa con mucosa, músculos y pliegues vocales.';
 }else if(['lung','lobe','parenchyma'].includes(category||'')){
  description=category==='lung'?'Órgano torácico de la respiración, representado mediante su parénquima disponible.':category==='lobe'?'División lobar formada por los componentes de parénquima identificados en la fuente.':'Componente de parénquima correspondiente al segmento indicado por BodyParts3D.';
  const division=node.side==='right'?'Pulmón derecho: lóbulos superior, medio e inferior.':'Pulmón izquierdo: lóbulos superior e inferior; língula en el superior.';
  fields.push(['Región','Tórax'],['Función','El intercambio gaseoso tiene lugar en los alvéolos, no modelados aquí.'],['Divisiones',node.side?division:'Tres lóbulos derechos y dos izquierdos.'],['Continuidad','Bronquios principales → lobares → segmentarios → vías menores.'],['Relaciones','Pared costal, mediastino y base diafragmática.'],['Hilio','Región de paso de bronquios y vasos; se estudia mediante el contexto disponible.'],['Ventilación','El diafragma es un músculo que contribuye a aumentar el volumen torácico durante la inspiración. Aquí se explica como relación; su geometría sigue pendiente.']);
  representation='Parénquima segmentado original, agrupado sin cortes artificiales. Las piezas basales 7.8 conservan el FMA anterior basal de la fuente; no se inventa una división medial. Pleuras y alvéolos no están segmentados.';sources=[LUNGS,BREATHING,SOURCE];
 }else if(category==='trachea'||category==='main-bronchus'||category==='bronchial-tree'){
  description=category==='trachea'?'Vía aérea que continúa la laringe y desciende hasta la bifurcación bronquial.':category==='main-bronchus'?'Vía aérea principal hacia el pulmón del lado indicado.':'Conjunto de ramas bronquiales que distribuyen aire hacia el territorio indicado.';
  fields.push(['Región',category==='trachea'?'Cuello y mediastino superior':'Tórax'],['Función','Conducción del aire.'],['Continuidad',category==='trachea'?'Laringe → tráquea → bronquios principales.':'Bronquio principal → bronquios lobares → árboles segmentarios.'],['Relaciones',category==='trachea'?'Columna cervical y torácica por detrás; esófago posterior, no incluido aquí.':'Hilio, parénquima y vasos pulmonares del lado correspondiente.'],['Ramificación','Los grupos lobares reúnen árboles segmentarios; no equivalen a nuevos troncos lobares aislados.']);
  if(category==='main-bronchus')fields.push(['Comparación',node.side==='right'?'El bronquio derecho suele ser más vertical, corto y ancho.':'El bronquio izquierdo sigue un trayecto más horizontal bajo el arco aórtico.']);
  representation='Ramas originales conservadas. La carina no tiene una malla independiente; las discontinuidades de segmentación no se rellenan con tubos fabricados.';sources=[BRONCHI,SOURCE];
 }else fields.push(['Cobertura','Laringe cartilaginosa, tráquea, árboles bronquiales y parénquima de ambos pulmones.'],['Pendiente','Cavidad nasal, faringe, pleuras y microanatomía alveolar.']);
 return {description,fields,sources,representation};
}

// Curated anatomical identities only. No nearest-neighbour or distance inference.
const PULMONARY:Record<'right'|'left',string[]>={
 right:['resp:FMA68418','bp3d:FMA50872','bp3d:FMA49914','bp3d:FMA49911'],
 left:['resp:FMA7396','bp3d:FMA50873','bp3d:FMA49916','bp3d:FMA49913'],
};
export function getRespiratoryContextIds(node:AnatomyNode,byId:Map<string,AnatomyNode>):string[]{
 if(node.systemId!=='respiratory')return [];
 const category=node.respiratoryClass;
 const ids=category==='cartilage'?['bp3d:FMA52749','skeletal:group:spine:cervicalvertebrae','resp:FMA7394']:
 category==='trachea'?['skeletal:group:spine:cervicalvertebrae','skeletal:group:spine:thoracicvertebrae','resp:larynx','resp:FMA68418','resp:FMA7396']:
 node.side&&node.side!=='midline'?['skeletal:region:thorax','cardio:heart',...PULMONARY[node.side],...(['main-bronchus','bronchial-tree'].includes(category||'')?['resp:lung:'+node.side]:[])]:[];
 return [...new Set(ids)].filter(id=>id!==node.id&&byId.has(id));
}
