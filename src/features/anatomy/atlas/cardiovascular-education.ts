import type {AnatomyNode} from './types';
export interface CardiovascularDetail {description:string; fields:[string,string][]; sources:{title:string;url:string}[]; representation?:string}
const PATHS={title:'OpenStax · Vías circulatorias',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways'};
const HEART={title:'NIH/NHLBI · Anatomía cardíaca',url:'https://www.nhlbi.nih.gov/health/heart/anatomy'};
const CORONARY={title:'OpenStax · Corazón y circulación coronaria',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/19-1-heart-anatomy'};
const SOURCE={title:'DBCLS · BodyParts3D',url:'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html'};
const REFERENCES:Record<string,[string,string]>={aorta:['Aorta','NBK538140'],abdomen:['Vasos de abdomen y pelvis','NBK560486'],arm:['Vasos del brazo','NBK507841'],forearm:['Arterias del antebrazo','NBK545155'],femoral:['Arteria femoral','NBK538262'],calf:['Anatomía de la pantorrilla','NBK459362'],saphenous:['Sistema safeno','NBK541045'],carotid:['Carótida interna','NBK556061'],jugular:['Yugular interna','NBK513258']};
// Editorial anatomy facts, not a geometric flow graph. Branches may be unmodeled.
// family | origin/outflow | course | territory | branches/tributaries | reference
const ARTERIAL=`
aorta|Ventrículo izquierdo|Ascenso, arco y descenso toracoabdominal|Circulación sistémica|Coronarias y ramas sistémicas|aorta
ascending-aorta|Ventrículo izquierdo|Hacia el arco aórtico|Salida sistémica|Coronarias derecha e izquierda|aorta
arch-of-aorta|Aorta ascendente|Curva hacia la izquierda y atrás|Cabeza, cuello y miembros superiores mediante ramas|Braquiocefálico, carótida común izquierda, subclavia izquierda|aorta
descending-thoracic-aorta|Arco aórtico|Mediastino posterior hasta el diafragma|Tórax|Intercostales y ramas viscerales|aorta
abdominal-aorta|Aorta torácica|Retroperitoneo hasta bifurcación ilíaca|Abdomen, pelvis y miembros inferiores|Celíaco, mesentéricas, renales e ilíacas|abdomen
pulmonary-trunk|Ventrículo derecho|Bifurcación hacia ambos pulmones|Circulación pulmonar|Arterias pulmonares|paths
pulmonary-artery|Tronco pulmonar|Hilio pulmonar correspondiente|Pulmón ipsilateral|Ramas lobares y segmentarias|paths
brachiocephalic-artery|Arco aórtico|Raíz derecha del cuello|Cabeza/cuello derechos y miembro superior derecho|Carótida común y subclavia derechas|paths
common-carotid-artery|Braquiocefálico a derecha; arco aórtico a izquierda|Ascenso cervical|Cabeza y cuello|Carótidas interna y externa|carotid
internal-carotid-artery|Carótida común|Cuello y canal carotídeo hacia el cráneo|Encéfalo anterior y órbita|Oftálmica, cerebrales anterior y media|carotid
vertebral-artery|Subclavia|Forámenes transversos cervicales hacia el cráneo|Circulación posterior encefálica|Ramas espinales/cerebelosas; unión basilar|paths
basilar-artery|Unión de ambas vertebrales|Cara ventral del puente|Tronco encefálico y circulación posterior|Pontinas, cerebelosas y cerebrales posteriores|paths
subclavian-artery|Braquiocefálico a derecha; arco aórtico a izquierda|Raíz del cuello, sobre primera costilla|Miembro superior y ramas cervicotorácicas|Vertebral, torácica interna; continuación axilar|arm
axillary-artery|Continuación de subclavia|Axila|Hombro y región axilar|Subescapular y circunflejas humerales|arm
brachial-artery|Continuación de axilar|Brazo hacia fosa cubital|Brazo y circulación distal|Braquial profunda, radial y cubital|arm
deep-brachial-artery|Braquial|Región posterior del brazo|Compartimento posterior|Colaterales del codo|arm
radial-artery|Braquial|Antebrazo lateral hacia mano|Antebrazo y mano|Recurrentes, carpianas y arco palmar profundo|forearm
ulnar-artery|Braquial|Antebrazo medial hacia palma|Antebrazo y mano|Interósea común y arco palmar superficial|forearm
internal-thoracic-artery|Subclavia|Pared torácica anterior interna|Pared torácica y epigastrio|Musculofrénica y epigástrica superior|paths
celiac-trunk|Aorta abdominal|Abdomen superior|Derivados del intestino anterior|Gástrica izquierda, hepática común y esplénica|abdomen
left-gastric-artery|Tronco celíaco|Curvatura menor gástrica|Estómago y esófago distal|Gástricas y esofágicas|abdomen
common-hepatic-artery|Tronco celíaco|Región hepatoduodenal|Hígado y territorio gastroduodenal|Hepática propia y gastroduodenal|abdomen
hepatic-artery-proper|Hepática común|Ligamento hepatoduodenal|Hígado|Hepáticas derecha e izquierda|abdomen
splenic-artery|Tronco celíaco|Borde superior pancreático hacia bazo|Bazo y ramas pancreáticas/gástricas|Pancreáticas, gástricas cortas y gastro-omental izquierda|abdomen
superior-mesenteric-artery|Aorta abdominal|Hacia mesenterio|Intestino medio|Yeyunales, ileales y cólicas|abdomen
inferior-mesenteric-artery|Aorta abdominal|Colon izquierdo y pelvis|Intestino posterior|Cólica izquierda, sigmoideas y rectal superior|abdomen
renal-artery|Aorta abdominal|Hacia hilio renal|Riñón ipsilateral|Segmentarias renales|abdomen
common-iliac-artery|Bifurcación aórtica|Hacia pelvis|Pelvis y miembro inferior|Ilíacas interna y externa|abdomen
internal-iliac-artery|Ilíaca común|Pelvis|Pelvis, periné y región glútea|Viscerales y parietales|abdomen
external-iliac-artery|Ilíaca común|Borde pélvico hacia ligamento inguinal|Miembro inferior y pared abdominal|Epigástrica inferior; continuación femoral|femoral
femoral-artery|Continuación de ilíaca externa|Triángulo femoral y conducto aductor|Muslo y circulación distal|Femoral profunda; continuación poplítea|femoral
popliteal-artery|Continuación de femoral|Detrás de rodilla|Rodilla y circulación distal|Geniculares y vías tibiales|calf
anterior-tibial-artery|Poplítea|Compartimento anterior de pierna|Pierna anterior y dorso del pie|Musculares; continuación dorsal del pie|calf
posterior-tibial-artery|Vía terminal de poplítea|Pierna posterior, detrás de maléolo medial|Pierna posterior y planta|Fibular y plantares|calf
trunk-of-right-coronary-artery|Aorta ascendente|Surco coronario derecho|Territorio miocárdico derecho, variable|Marginal derecha y ramas posteriores según dominancia|heart
trunk-of-left-coronary-artery|Aorta ascendente|Tronco corto hacia izquierda del corazón|Territorio miocárdico izquierdo|Interventricular anterior y circunfleja|heart
trunk-of-anterior-interventricular-branch-of-left-coronary-artery|Coronaria izquierda|Surco interventricular anterior|Miocardio anterior y septo anterior|Diagonales y septales|heart
circumflex-branch-of-left-coronary-artery|Coronaria izquierda|Surco coronario izquierdo|Miocardio lateral y posterior, variable|Marginales izquierdas|heart
`;
const VENOUS=`
superior-vena-cava|Aurícula derecha|Mediastino superior hacia corazón|Cabeza, cuello, miembros superiores y tórax|Braquiocefálicas y ácigos|paths
inferior-vena-cava|Aurícula derecha|Retroperitoneo derecho y diafragma|Territorios inferiores al diafragma|Ilíacas comunes, renales y hepáticas|abdomen
brachiocephalic-vein|Vena cava superior|Detrás de articulación esternoclavicular|Cabeza/cuello y miembro superior|Yugular interna y subclavia|jugular
internal-jugular-vein|Braquiocefálica|Vaina carotídea|Encéfalo y regiones profundas de cabeza/cuello|Senos durales y tributarias cervicales|jugular
subclavian-vein|Braquiocefálica|Primera costilla, anterior al escaleno anterior|Miembro superior|Continuación axilar|arm
axillary-vein|Subclavia|Axila|Miembro superior|Braquiales, basílica y cefálica|arm
medial-brachial-vein|Sistema axilar|Acompaña arteria braquial|Brazo y retorno profundo del antebrazo|Radiales y cubitales|arm
cephalic-vein|Axilar|Trayecto superficial lateral|Red superficial lateral del miembro superior|Tributarias superficiales y conexiones del codo|arm
basilic-vein|Sistema axilar junto con braquiales|Trayecto superficial medial; se profundiza en brazo|Red superficial medial del miembro superior|Tributarias superficiales antebraquiales|arm
radial-vein|Venas braquiales|Acompaña arteria radial|Retorno profundo lateral del antebrazo|Red profunda de mano y antebrazo|forearm
ulnar-vein|Venas braquiales|Acompaña arteria cubital|Retorno profundo medial del antebrazo|Red profunda de mano y antebrazo|forearm
median-antebrachial-vein|Red basílica o conexiones del codo, variable|Antebrazo anterior superficial|Retorno superficial del antebrazo|Red palmar y antebraquial|arm
azygos-vein|Vena cava superior|Mediastino posterior derecho|Pared torácica y mediastino|Intercostales y sistema hemiácigos|paths
hemiazygos-vein|Ácigos|Mediastino posterior izquierdo inferior|Pared torácica izquierda inferior|Intercostales inferiores|paths
accessory-hemiazygos-vein|Sistema ácigos|Mediastino posterior izquierdo superior|Pared torácica izquierda media/superior|Intercostales izquierdas|paths
right-hepatic-vein|Vena cava inferior|Desde parénquima hepático|Territorio hepático derecho|Tributarias segmentarias|abdomen
middle-hepatic-vein|Vena cava inferior, a veces tronco común|Región central hepática|Territorios hepáticos centrales|Tributarias segmentarias|abdomen
left-hepatic-vein|Vena cava inferior|Región izquierda hepática|Territorio hepático izquierdo|Tributarias segmentarias|abdomen
hepatic-portal-vein|Ramas intrahepáticas y sinusoides|Hacia hilio hepático|Vísceras digestivas, bazo y páncreas|Mesentérica superior y esplénica|abdomen
splenic-vein|Porta al unirse con mesentérica superior|Detrás del páncreas|Bazo, tributarias pancreáticas/gástricas|Esplénicas; suele recibir mesentérica inferior|abdomen
superior-mesenteric-vein|Porta al unirse con esplénica|Mesenterio hacia páncreas|Intestino medio|Yeyunales, ileales y cólicas|abdomen
inferior-mesenteric-vein|Habitualmente esplénica; variable|Abdomen izquierdo|Colon izquierdo y recto superior|Cólica izquierda, sigmoideas y rectal superior|abdomen
renal-vein|Vena cava inferior|Hilio renal hacia cava|Riñón ipsilateral|Renales y aportes extrarrenales variables|abdomen
common-iliac-vein|Vena cava inferior|Confluencia iliocava|Pelvis y miembro inferior|Ilíacas interna y externa|abdomen
internal-iliac-vein|Ilíaca común|Pelvis|Vísceras y paredes pélvicas|Viscerales y parietales|abdomen
external-iliac-vein|Ilíaca común|Desde ligamento inguinal por pelvis|Miembro inferior y pared abdominal inferior|Continuación femoral y tributarias abdominales|femoral
femoral-vein|Ilíaca externa|Conducto aductor y triángulo femoral|Miembro inferior|Poplítea, femoral profunda y safena magna|femoral
deep-femoral-vein|Femoral|Región profunda del muslo|Musculatura profunda del muslo|Perforantes y circunflejas|femoral
popliteal-vein|Femoral|Fosa poplítea|Pierna y rodilla|Venas profundas y safena menor|calf
great-saphenous-vein|Femoral|Superficial medial, pie a muslo|Red superficial medial del miembro inferior|Superficiales y comunicantes|saphenous
small-saphenous-vein|Habitualmente poplítea; variable|Superficial posterior de pierna|Red superficial posterolateral de pie y pierna|Tributarias superficiales|saphenous
anterior-tibial-vein|Poplítea mediante confluencias profundas|Junto a vasos anteriores de pierna|Compartimento anterior y dorso del pie|Tributarias profundas anteriores|calf
posterior-tibial-vein|Poplítea mediante confluencias profundas|Pierna posterior junto a arteria|Región posterior y planta del pie|Plantares y musculares|calf
superior-pulmonary-vein|Aurícula izquierda|Hilio pulmonar hacia corazón|Territorios pulmonares superiores|Intrapulmonares|paths
inferior-pulmonary-vein|Aurícula izquierda|Hilio pulmonar hacia corazón|Territorios pulmonares inferiores|Intrapulmonares|paths
coronary-sinus|Aurícula derecha|Surco coronario posterior|Gran parte del retorno miocárdico|Venas cardíacas, incluida magna|heart
great-cardiac-vein|Seno coronario|Surcos interventricular anterior y coronario izquierdo|Regiones anterior e izquierda del corazón|Tributarias cardíacas|heart
`;
const facts=(text:string)=>new Map(text.trim().split('\n').map(line=>{const [key,...fields]=line.split('|');return [key,fields];}));
const arteries=facts(ARTERIAL),veins=facts(VENOUS);
// Explicit curated references; never distance-derived vascular associations.
const CONTEXT:Record<string,string[]>={
 'brachial-artery':['humerus'],'deep-brachial-artery':['humerus'],'medial-brachial-vein':['humerus'],
 'axillary-artery':['humerus','scapula'],'axillary-vein':['humerus','scapula'],
 'radial-artery':['radius','ulna'],'ulnar-artery':['radius','ulna'],'radial-vein':['radius','ulna'],'ulnar-vein':['radius','ulna'],
 'cephalic-vein':['humerus','radius'],'basilic-vein':['humerus','ulna'],
 'femoral-artery':['hip','femur'],'femoral-vein':['hip','femur'],'deep-femoral-vein':['femur'],
 'great-saphenous-vein':['femur','tibia'],'small-saphenous-vein':['tibia','fibula'],
 'popliteal-artery':['femur','tibia'],'popliteal-vein':['femur','tibia'],
 'anterior-tibial-artery':['tibia','fibula'],'posterior-tibial-artery':['tibia','fibula'],
 'anterior-tibial-vein':['tibia','fibula'],'posterior-tibial-vein':['tibia','fibula'],
};
const BONES:Record<string,[string,string]>={humerus:['bp3d:FMA23130','bp3d:FMA23131'],radius:['bp3d:FMA23464','bp3d:FMA23465'],ulna:['bp3d:FMA23467','bp3d:FMA23468'],scapula:['bp3d:FMA13395','bp3d:FMA13396'],hip:['bp3d:FMA16586','bp3d:FMA16587'],femur:['bp3d:FMA24474','bp3d:FMA24475'],tibia:['bp3d:FMA24477','bp3d:FMA24478'],fibula:['bp3d:FMA24480','bp3d:FMA24481']};
export function getCardiovascularContextIds(node:AnatomyNode,byId:Map<string,AnatomyNode>):string[]{
 if(node.systemId!=='cardiovascular')return [];
 if(node.family?.includes('coronary')||node.family==='great-cardiac-vein')return byId.has('cardio:heart')?['cardio:heart']:[];
 if(node.vascularClass==='heart')return ['skeletal:region:thorax'].filter(id=>byId.has(id));
 if(node.side!=='right'&&node.side!=='left')return [];
 return (CONTEXT[node.family||'']||[]).map(key=>BONES[key][node.side==='right'?0:1]).filter(id=>byId.has(id));
}
export function resolveCardiovascularDetail(node:AnatomyNode):CardiovascularDetail|null {
 if(node.systemId!=='cardiovascular')return null;
 const family=node.family||'',fact=(node.vascularClass==='arterial'?arteries:veins).get(family);
 if(fact){const [origin,course,territory,branches,ref]=fact;const named=REFERENCES[ref];
  return {description:node.vascularClass==='arterial'?'Vaso que distribuye sangre desde el corazón, directamente o mediante sus ramas.':'Vaso de retorno hacia otra vena, el corazón o el sistema portal.',fields:node.vascularClass==='arterial'?[['Origen',origin],['Recorrido',course],['Territorio irrigado',territory],['Ramas principales',branches]]:[['Desembocadura',origin],['Recorrido',course],['Territorio drenado',territory],['Tributarias principales',branches]],sources:[PATHS,...(named?[{title:'NCBI / '+named[0],url:'https://www.ncbi.nlm.nih.gov/books/'+named[1]+'/'}]:ref==='heart'?[CORONARY]:[]),SOURCE],representation:'Anatomía general: algunas ramas citadas pueden no estar modeladas. La geometría conserva la cobertura de origen.'};
 }
 if(node.vascularClass==='heart')return {description:family.startsWith('cavity-')?'Espacio intracardíaco identificado. No representa una pared de tejido.':family.startsWith('wall-')?'Pared cardíaca identificada por la fuente; sin subdivisiones geométricas inventadas.':node.cardioType==='valva'?'Componente valvular identificado en BodyParts3D.':'El corazón impulsa sangre hacia las circulaciones pulmonar y sistémica.',fields:[['Localización','Mediastino, entre ambos pulmones.'],['Cámaras','Aurículas derecha e izquierda; ventrículos derecho e izquierdo.'],['Flujo general','Corazón derecho hacia pulmones; corazón izquierdo hacia aorta.'],['Válvulas','Tricúspide, pulmonar, mitral y aórtica favorecen el flujo unidireccional.'],['Irrigación','Arterias coronarias; retorno principalmente por seno coronario.']],sources:[HEART,SOURCE],representation:'Modelo corporal por paredes, cavidades y valvas disponibles. Pared ventricular sin separar lados; no hay septo independiente. Nombres de valvas semilunares conservados de la fuente, sin equipararlos automáticamente a cúspides coronarias. El corazón HRA permanece independiente.'};
 return {description:'Cobertura cardiovascular macroscópica disponible. Selecciona un vaso o componente cardíaco para ver su ficha.',fields:[['Colores','Rojo: arterias. Azul: venas. Rosado: corazón. Indican categoría, no oxigenación.'],['Cobertura','Red segmentada de origen, sin microvasculatura ni conexiones fabricadas.']],sources:[PATHS,SOURCE]};
}
