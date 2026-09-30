import type {AnatomyNode, SystemId} from './types';

export const INTERNAL_SYSTEMS: SystemId[] = ['urinary','endocrine','lymphatic','reproductive'];
const BASE='https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const source=(chapter:string,title:string)=>({title:'OpenStax · '+title,url:BASE+chapter});
const KIDNEY=source('25-3-gross-anatomy-of-the-kidney','Riñón');
const URINE=source('25-2-gross-anatomy-of-urine-transport','Transporte urinario');
const LYMPH=source('21-1-anatomy-of-the-lymphatic-and-immune-systems','Órganos linfoides');
const MALE={title:'OpenStax · Anatomía reproductora masculina',url:'https://openstax.org/books/anatomy-and-physiology/pages/27-1-anatomy-and-physiology-of-the-male-reproductive-system'};
const BP3D={title:'DBCLS · BodyParts3D, fuente geométrica',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'};
interface FamilyDetail {description:string;function:string;relations:string;representation:string;source:typeof BP3D;special?:[string,string]}
const details:Record<string,FamilyDetail>={
 kidney:{description:'Órgano retroperitoneal par.',function:'Filtración de la sangre y regulación del medio interno mediante la formación de orina.',relations:'Vasos renales, uréter y suprarrenal del mismo lado.',representation:'Superficie renal externa. Corteza, médula, pelvis y cálices no tienen geometrías independientes.',source:KIDNEY},
 ureter:{description:'Conducto entre pelvis renal y vejiga.',function:'Propulsión de la orina por peristaltismo.',relations:'Riñón correspondiente y vejiga.',representation:'Trayecto original completo de la pieza, sin fabricar continuidad en sus extremos.',source:URINE,special:['Recorrido','Abdomen y pelvis; no se fragmenta en el despiece regional.']},
 bladder:{description:'Reservorio muscular pélvico para la orina.',function:'Almacenamiento y expulsión durante la micción.',relations:'Recibe ambos uréteres; continúa con la uretra. La próstata se encuentra inferiormente.',representation:'Forma del cuerpo fuente, sin simular llenado ni individualizar el detrusor.',source:URINE},
 urethra:{description:'Vía de salida urinaria del cuerpo masculino de referencia.',function:'Conduce orina; en el varón también participa en la salida del semen.',relations:'Vejiga, próstata y cuerpo esponjoso.',representation:'Un único propietario en Urinario. Se relaciona con Reproductor sin duplicación ni cortes artificiales.',source:URINE},
 adrenal:{description:'Glándula endocrina situada sobre el riñón correspondiente.',function:'Producción de hormonas de la corteza y de la médula suprarrenal.',relations:'Polo superior del riñón del mismo lado.',representation:'Envolvente completa; corteza y médula no son piezas separadas.',source:source('17-6-the-adrenal-glands','Suprarrenales'),special:['Secreción','Cortisol y aldosterona en la corteza; catecolaminas en la médula.']},
 pituitary:{description:'Glándula en la región de la silla turca, relacionada con el hipotálamo.',function:'Integra señales hipotalámicas y regulación hormonal.',relations:'Hipotálamo y esfenoides.',representation:'Una pieza; no se separan adenohipófisis y neurohipófisis.',source:source('17-3-the-pituitary-gland-and-hypothalamus','Hipófisis e hipotálamo'),special:['Organización','Lóbulos anterior y posterior con funciones diferentes; la neurohipófisis libera hormonas sintetizadas en el hipotálamo.']},
 pineal:{description:'Pequeña glándula asociada al epitálamo.',function:'Secreción de melatonina y participación en los ritmos circadianos.',relations:'Región posterior del diencéfalo.',representation:'Una pieza macroscópica, sin microanatomía.',source:source('17-7-the-pineal-gland','Glándula pineal')},
 thyroid:{description:'Glándula cervical con dos lóbulos unidos por un istmo.',function:'Regulación metabólica mediante hormonas tiroideas.',relations:'Laringe, tráquea y paratiroides posteriores.',representation:'Dos lóbulos e istmo identificados en 4.3. El padre agrupa las tres piezas sin una malla duplicada.',source:source('17-4-the-thyroid-gland','Tiroides'),special:['Secreción','T3 y T4; las células parafoliculares producen calcitonina.']},
 parathyroid:{description:'Pequeña glándula próxima a la cara posterior de la tiroides.',function:'Regulación de la concentración de calcio.',relations:'Lóbulo tiroideo del lado correspondiente.',representation:'Cuatro glándulas identificadas; número y posición pueden variar entre personas.',source:source('17-5-the-parathyroid-glands','Paratiroides'),special:['Secreción','Hormona paratiroidea (PTH).']},
 spleen:{description:'Órgano linfoide abdominal relacionado con la sangre.',function:'Vigilancia inmunitaria y retirada de células sanguíneas envejecidas.',relations:'Estómago, páncreas, riñón izquierdo y vasos esplénicos.',representation:'Envolvente externa, sin pulpas ni vascularización duplicada. No equivale a una red linfática completa.',source:LYMPH,special:['Tipo funcional','Órgano linfoide secundario.']},
 thymus:{description:'Órgano linfoide del mediastino anterior.',function:'Participa en la maduración de linfocitos T.',relations:'Posterior al esternón; anterior a estructuras mediastínicas.',representation:'Dos lóbulos nativos bajo un único órgano. La forma corresponde al cuerpo fuente; no se simula involución con la edad.',source:LYMPH,special:['Tipo funcional','Órgano linfoide primario.']},
 testis:{description:'Gónada masculina par.',function:'Producción de espermatozoides y andrógenos.',relations:'Epidídimo ipsilateral.',representation:'Un órgano por lado, sin duplicarlo en Endocrino ni modelar túbulos seminíferos.',source:MALE,special:['Función endocrina','Producción de testosterona; único propietario en Reproductor.']},
 epididymis:{description:'Conducto asociado al testículo.',function:'Maduración y almacenamiento de espermatozoides.',relations:'Testículo y conducto deferente ipsilaterales.',representation:'Una pieza por lado, sin segmentar cabeza, cuerpo y cola.',source:MALE},
 deferent:{description:'Conducto de transporte espermático.',function:'Conduce espermatozoides desde el epidídimo.',relations:'Epidídimo y región posterior de la vejiga.',representation:'No se prolonga para fabricar conductos eyaculadores ausentes.',source:MALE},
 seminal:{description:'Glándula accesoria par.',function:'Aporta secreción al semen.',relations:'Posterior a la vejiga y superior a la próstata.',representation:'Una glándula por lado; conductos de salida no se inventan.',source:MALE},
 prostate:{description:'Glándula accesoria inferior a la vejiga.',function:'Aporta secreción al semen.',relations:'Rodea la uretra prostática.',representation:'Órgano completo de la fuente; sin zonas ni conductos eyaculadores independientes.',source:MALE},
 penis:{description:'Órgano externo masculino.',function:'Participa en la función sexual y el paso uretral.',relations:'Tejido eréctil y uretra.',representation:'Sólo tres componentes disponibles; no representa una envolvente completa.',source:MALE},
 glans:{description:'Extremo distal del cuerpo esponjoso.',function:'Participa en la sensibilidad genital.',relations:'Cuerpo esponjoso y salida uretral.',representation:'Componente nativo; no se fusiona ni duplica su superficie.',source:MALE},
 spongiosum:{description:'Tejido eréctil que rodea la uretra esponjosa.',function:'Participa en la función eréctil.',relations:'Uretra y glande.',representation:'Componente original independiente de la uretra urinaria.',source:MALE},
 cavernosum:{description:'Representación fuente del tejido cavernoso del pene.',function:'Participa en la erección.',relations:'Cuerpo esponjoso.',representation:'Una sola pieza fuente sin asignación lateral. No se refleja ni divide para fabricar un segundo cuerpo.',source:MALE},
};
const systemNames:Record<string,string>={urinary:'Urinario',endocrine:'Endocrino',lymphatic:'Linfático / inmunitario',reproductive:'Reproductor masculino'};
const regionNames:Record<string,string>={head:'Cabeza',neck:'Cuello',thorax:'Tórax',abdomen:'Abdomen','abdomen-pelvis':'Abdomen y pelvis',pelvis:'Pelvis y región perineal'};
export function resolveInternalDetail(node:AnatomyNode){
 if(!node.systemId||!INTERNAL_SYSTEMS.includes(node.systemId))return undefined;
 const d=details[node.family||''];
 const fields:[string,string][]=[['Sistema',systemNames[node.systemId]],['Tipo',node.internalType||'Grupo anatómico'],['Región',regionNames[node.regionId.split(':').at(-1)||'']||'Cuerpo humano']];
 if(d){fields.push(['Función',d.function],['Relaciones',d.relations]);if(d.special)fields.push(d.special);}
 else fields.push(['Organización',node.systemId==='lymphatic'?'Bazo y timo disponibles; ganglios, amígdalas y conductos pendientes.':node.systemId==='reproductive'?'Cobertura masculina parcial; atlas femenino futuro con marco propio.':node.systemId==='endocrine'?'Glándulas disponibles; páncreas digestivo y testículos reproductores se relacionan sin duplicarlos.':'Riñones, uréteres, vejiga y uretra disponibles.']);
 return {description:d?.description||'Agrupación de órganos y componentes realmente incorporados al atlas.',fields,sources:[...(d?[d.source]:[]),BP3D],representation:d?.representation||'La cobertura es parcial. Las relaciones describen anatomía y no conexiones geométricas fabricadas.'};
}
// Explicit reviewed source IDs: never infer anatomy from spatial proximity.
export const INTERNAL_CONTEXT:Record<string,string[]>={
 'uri:FMA7204':['bp3d:FMA14752','bp3d:FMA14335','uri:FMA15571','endo:FMA15629'],
 'uri:FMA7205':['bp3d:FMA14753','bp3d:FMA14336','uri:FMA15572','endo:FMA15630'],
 'uri:FMA15571':['uri:FMA7204','uri:FMA15900'],'uri:FMA15572':['uri:FMA7205','uri:FMA15900'],
 'uri:FMA15900':['uri:FMA15571','uri:FMA15572','uri:FMA19667','rep:FMA9600'],
 'uri:FMA19667':['uri:FMA15900','rep:FMA9600','rep:FMA19617'],
 'endo:FMA15629':['uri:FMA7204'],'endo:FMA15630':['uri:FMA7205'],
 'endo:FMA13889':['bp3d:FMA62008','bp3d:FMA52736'],'endo:FMA62033':['nervous:diencephalon'],
 'endo:thyroid':['resp:larynx','resp:FMA7394','endo:FMA55560','endo:FMA55561','endo:FMA55562','endo:FMA55563'],
 endocrine:['dig:FMA7198','rep:FMA7211','rep:FMA7212'],
 'lym:FMA7196':['dig:FMA7148','dig:FMA7198','uri:FMA7205','bp3d:FMA14773','bp3d:FMA14331'],
 'lym:FMA9607':['bp3d:FMA7485','resp:FMA7394'],
 'rep:FMA7211':['rep:FMA18256'],'rep:FMA7212':['rep:FMA18257'],
 'rep:FMA18256':['rep:FMA7211','rep:FMA19235'],'rep:FMA18257':['rep:FMA7212','rep:FMA19236'],
 'rep:FMA19235':['rep:FMA18256','rep:FMA19387','uri:FMA15900'],'rep:FMA19236':['rep:FMA18257','rep:FMA19388','uri:FMA15900'],
 'rep:FMA19387':['uri:FMA15900','rep:FMA9600'],'rep:FMA19388':['uri:FMA15900','rep:FMA9600'],
 'rep:FMA9600':['uri:FMA15900','uri:FMA19667','dig:FMA14544'],'rep:penis':['uri:FMA19667'],
};
export function getInternalContextIds(node:AnatomyNode,byId:Map<string,AnatomyNode>):string[]{
 const targets=INTERNAL_CONTEXT[node.id]||INTERNAL_CONTEXT[node.parentId||'']||
  (node.family==='parathyroid'?['endo:thyroid','resp:FMA7394']:[]);
 return [...new Set(targets)].filter(id=>id!==node.id&&byId.has(id));
}
