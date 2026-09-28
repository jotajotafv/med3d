import type {AnatomyNode} from './types';
export interface DigestiveDetail {description:string; fields:[string,string][]; sources:{title:string;url:string}[]; representation:string}
const BASE='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const OVERVIEW={title:'OpenStax · Organización digestiva',url:BASE+'23-1-overview-of-the-digestive-system'};
const UPPER={title:'OpenStax · Boca, faringe y esófago',url:BASE+'23-3-the-mouth-pharynx-and-esophagus'};
const STOMACH={title:'OpenStax · Estómago',url:BASE+'23-4-the-stomach'};
const INTESTINE={title:'OpenStax · Intestinos',url:BASE+'23-5-the-small-and-large-intestines'};
const ACCESSORY={title:'OpenStax · Hígado, páncreas y vesícula',url:BASE+'23-6-accessory-organs-in-digestion-the-liver-pancreas-and-gallbladder'};
const SOURCE={title:'DBCLS · BodyParts3D',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'};
const details:Record<string,{description:string;function:string;continuity:string;relations:string;parts:string;representation:string;source:typeof OVERVIEW}>={
 esophagus:{description:'Tubo muscular que conduce el bolo hacia el estómago.',function:'Transporte mediante peristaltismo.',continuity:'Faringe → esófago → estómago.',relations:'Posterior a la tráquea; recorre el mediastino y atraviesa el diafragma.',parts:'Una estructura continua, sin separar esfínteres.',representation:'La faringe no está representada como órgano completo. No se ha fabricado la unión superior.',source:UPPER},
 tongue:{description:'Estructura muscular oral que participa en la preparación del bolo.',function:'Manipulación del alimento, deglución y gusto.',continuity:'Boca → orofaringe durante la deglución.',relations:'Mandíbula, hioides y glándulas del suelo de la boca.',parts:'Representación externa; músculos intrínsecos no individualizados.',representation:'Una sola estructura oral, sin duplicación en Muscular. No representa toda la cavidad oral.',source:UPPER},
 salivary:{description:'Glándula mayor que vierte su secreción hacia la boca.',function:'La saliva humedece el alimento y facilita su procesamiento.',continuity:'Secreción glandular → cavidad oral.',relations:'Región submandibular o suelo de la boca, según la glándula.',parts:'Glándulas submandibulares y sublinguales de ambos lados.',representation:'Parótidas y conductos salivales independientes pendientes.',source:UPPER},
 stomach:{description:'Órgano dilatado entre el esófago y el duodeno.',function:'Almacenamiento transitorio, mezcla y digestión inicial de proteínas.',continuity:'Esófago → estómago → duodeno.',relations:'Hígado, páncreas y diafragma.',parts:'Cardias, fundus, cuerpo y región pilórica son referencias anatómicas.',representation:'Una malla fuente; esas regiones no se presentan como piezas separadas.',source:STOMACH},
 duodenum:{description:'Primer segmento del intestino delgado.',function:'Recibe quimo y secreciones biliares y pancreáticas.',continuity:'Estómago → duodeno → yeyuno.',relations:'Rodea la cabeza pancreática.',parts:'Una unidad fuente; sin cortes artificiales.',representation:'Los contactos se conservan tal como fueron segmentados; no se fabrican conductos ni conexiones.',source:INTESTINE},
 jejunum:{description:'Segmento del intestino delgado situado entre duodeno e íleon.',function:'Digestión y absorción de nutrientes.',continuity:'Duodeno → yeyuno → íleon.',relations:'Asas abdominales y mesenterio.',parts:'Porciones proximal, media y distal identificadas en la fuente.',representation:'Las múltiples piezas de cada porción no son órganos distintos. En el despiece permanecen con su segmento.',source:INTESTINE},
 ileum:{description:'Segmento distal del intestino delgado.',function:'Continúa la absorción antes del paso al intestino grueso.',continuity:'Yeyuno → íleon → unión ileocecal.',relations:'Asas abdominales y región ileocecal.',parts:'Porciones proximal, media y distal.',representation:'Unión ileocecal representada aparte según la identidad original; no equivale a un ciego completo.',source:INTESTINE},
 ileocecal:{description:'Región de transición entre íleon y ciego.',function:'Paso del contenido hacia el intestino grueso.',continuity:'Íleon → unión ileocecal → ciego.',relations:'Región inferior derecha del abdomen.',parts:'Una pequeña pieza fuente de unión.',representation:'La pieza se identifica como unión ileocecal. El ciego completo sigue pendiente; no se renombra esta pieza como órgano entero.',source:INTESTINE},
 colon:{description:'Porción del intestino grueso que rodea parte de las asas delgadas.',function:'Absorción de agua y electrolitos; formación y transporte de las heces.',continuity:'Ciego → colon ascendente → transverso → descendente → sigmoide → recto.',relations:'Pared abdominal y asas intestinales.',parts:'Ascendente, transverso y descendente disponibles.',representation:'Sin sigmoide independiente. No se corta ni prolonga ninguna pieza para completar la continuidad.',source:INTESTINE},
 rectum:{description:'Porción pélvica terminal del intestino grueso, antes del canal anal.',function:'Almacenamiento temporal de las heces.',continuity:'Colon sigmoide → recto → canal anal.',relations:'Sacro y pelvis.',parts:'Una estructura fuente.',representation:'El sigmoide y el canal anal no tienen mallas independientes aprobadas.',source:INTESTINE},
 appendix:{description:'Prolongación estrecha asociada al ciego.',function:'Contiene tejido linfoide asociado al intestino.',continuity:'Conexión anatómica con el ciego.',relations:'Región ileocecal.',parts:'Una unidad fuente.',representation:'Se conserva su posición; el ciego completo no está representado por una pieza independiente.',source:INTESTINE},
 liver:{description:'Órgano abdominal que produce bilis y participa en el procesamiento metabólico.',function:'Producción de bilis y procesamiento de sustancias absorbidas.',continuity:'Bilis → vías hepáticas → vía biliar extrahepática.',relations:'Vesícula, estómago, diafragma y vasos hepáticos.',parts:'Parénquima agregado de ocho piezas originales.',representation:'No se expone segmentación I–VIII: las etiquetas de dos piezas no permiten una asignación segmentaria inequívoca. Los vasos se muestran mediante contexto.',source:ACCESSORY},
 gallbladder:{description:'Reservorio biliar situado junto a la cara inferior del hígado.',function:'Almacena y concentra la bilis.',continuity:'Vesícula ↔ conducto cístico; salida hacia la vía biliar.',relations:'Hígado y conductos biliares.',parts:'Una estructura fuente.',representation:'No se fabrica la continuidad hacia un colédoco independiente pendiente.',source:ACCESSORY},
 pancreas:{description:'Glándula relacionada con el duodeno y situada detrás del estómago.',function:'Secreción digestiva de enzimas y bicarbonato; también tiene función endocrina.',continuity:'Secreción exocrina → conducto pancreático → duodeno.',relations:'Estómago, duodeno y vasos regionales.',parts:'Cabeza, cuello, cuerpo y cola como referencias educativas.',representation:'Una envolvente pancreática, sin duplicar el parénquima alternativo ni fabricar regiones separadas.',source:ACCESSORY},
 biliary:{description:'Conducto o componente del sistema de transporte de la bilis.',function:'Conducción de bilis.',continuity:'Conductos intrahepáticos → hepáticos derecho e izquierdo → hepático común; relación con el cístico.',relations:'Hígado y vesícula.',parts:'Conductos principales y tributarias identificadas.',representation:'Cobertura parcial; colédoco independiente y conexiones no identificadas permanecen pendientes.',source:ACCESSORY},
 'pancreatic-duct':{description:'Vía de salida de la secreción exocrina pancreática.',function:'Conducción de secreciones digestivas.',continuity:'Páncreas → duodeno.',relations:'Parénquima pancreático y región duodenal.',parts:'Representación fuente del conducto disponible.',representation:'No se superpone una segunda representación del árbol ni se fabrican uniones.',source:ACCESSORY},
};
export function resolveDigestiveDetail(node:AnatomyNode):DigestiveDetail|undefined {
 if(node.systemId!=='digestive')return undefined;
 const d=details[node.family||''];
 const region=node.regionId==='dig:upper'||['upper','oral','salivary','tongue'].includes(node.family||'')?'Región oral, cuello y tórax':node.regionId==='dig:large'||['large','colon','rectum'].includes(node.family||'')?'Abdomen y pelvis':'Abdomen';
 const fields:[string,string][]=[['Sistema','Digestivo'],['Tipo',node.digestiveType||'Grupo anatómico'],['Región',node.kind==='system'?'Cuerpo humano':region]];
 if(d){
  fields.push(['Función',d.function],['Continuidad anatómica',d.continuity],['Partes',d.parts],['Relaciones',d.relations]);
  if(node.family==='liver')fields.push(['Aporte vascular','Arteria hepática y vena porta; drenaje por venas hepáticas.']);
  return {description:d.description,fields,sources:[d.source,SOURCE],representation:d.representation};
 }
 fields.push(['Organización','Tracto superior disponible, estómago, intestinos y órganos accesorios.'],['Continuidad','Las fichas describen la continuidad anatómica; las ausencias geométricas no se rellenan.'],['Relaciones','Los vasos y otras estructuras de contexto conservan su sistema original.']);
 return {description:'Agrupación de la cobertura digestiva macroscópica integrada.',fields,sources:[OVERVIEW,SOURCE],representation:'Cobertura parcial y trazable. No representa microanatomía ni una validación clínica.'};
}
// Explicit curated IDs only. The absence of a nerve/vascular ID never creates one.
export function getDigestiveContextIds(node:AnatomyNode,byId:Map<string,AnatomyNode>):string[]{
 if(node.systemId!=='digestive')return [];
 const family=node.family||'';
 const targets:Record<string,string[]>={
  esophagus:['dig:FMA7148','resp:FMA7394','resp:larynx','skeletal:group:spine:thoracicvertebrae'],
  tongue:['dig:salivary','bp3d:FMA52749','bp3d:FMA52748'],salivary:['dig:FMA54640','bp3d:FMA52748','bp3d:FMA52749'],
  stomach:['dig:FMA7131','dig:FMA7206','dig:FMA7197','dig:FMA7198','bp3d:FMA14812','bp3d:FMA14768'],
  duodenum:['dig:FMA7148','dig:FMA7207','dig:FMA7198','dig:FMA10419'],
  jejunum:['dig:FMA7206','dig:FMA7208'],
  ileum:['dig:FMA7207','dig:FMA11338'],
  ileocecal:['dig:FMA7208','dig:FMA14545','dig:FMA14542'],
  appendix:['dig:FMA11338','dig:FMA14545'],
  colon:['dig:FMA11338','dig:FMA14544'],
  rectum:['dig:FMA14547','bp3d:FMA16202','bp3d:FMA16586','bp3d:FMA16587'],
  liver:['dig:FMA7202','dig:biliary','bp3d:FMA14772','bp3d:FMA50735','bp3d:FMA14338','bp3d:FMA14340','bp3d:FMA14339'],
  gallbladder:['dig:FMA7197','dig:FMA14539','dig:FMA14668'],
  pancreas:['dig:FMA7148','dig:FMA7206','dig:FMA10419'],
  'pancreatic-duct':['dig:FMA7198','dig:FMA7206'],
  biliary:['dig:FMA7197','dig:FMA7202','dig:FMA7206'],
  small:['dig:FMA7148','dig:large'],large:['dig:small'],
 };
 return [...new Set(targets[family]||[])].filter(id=>id!==node.id&&byId.has(id));
}
