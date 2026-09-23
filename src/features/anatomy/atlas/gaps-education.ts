import type {MuscleAttachment, MuscleEducation, MuscleSource, ComponentDetail} from './muscle-education';

// Concise original summaries checked against the linked teaching references.
// Associations name whole curated bones, never measured attachment coordinates.
const uw = (slug: string): MuscleSource => ({title: 'University of Washington · Muscle Atlas', url: `https://rad.uw.edu/muscle-atlas/${slug}`});
const alpha: MuscleSource = {title: 'TTUHSC · Tabla de músculos', url: 'https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html'};
const foot: MuscleSource = {title: 'TTUHSC · Pierna y pie', url: 'https://anatomy.ttuhscep.edu/schemes/leg_tables.html'};
const ncbi: MuscleSource = {title: 'NCBI Bookshelf · Foot Muscles', url: 'https://www.ncbi.nlm.nih.gov/sites/books/NBK539705/'};
const soft = (label: string): MuscleAttachment => ({label});
const bone = (label: string, right: number[], left: number[]): MuscleAttachment => ({label, boneIds: {right: right.map(n => `bp3d:FMA${n}`), left: left.map(n => `bp3d:FMA${n}`)}});
const thumb = (label: string) => bone(label, [24450], [65470]);
const littleHand = (label: string) => bone(label, [24454], [66791]);
const heel = (label: string) => bone(label, [24497], [24498]);
const hallux = (label: string) => bone(label, [43253], [43254]);
const littleFoot = (label: string) => bone(label, [32640], [32641]);
const metacarpal = (label: string, digits: number[]) => bone(label, digits.map(d => [24464,24466,24468,24470,24472][d-1]), digits.map(d => [24465,24467,24469,24471,24473][d-1]));
const metatarsal = (label: string, digits: number[]) => bone(label, digits.map(d => [24507,24509,24511,24513,24515][d-1]), digits.map(d => [24508,24510,24512,24514,24516][d-1]));
const toeProximal = (label: string, digit: number) => bone(label, [[43253,32634,32636,32638,32640][digit-1]], [[43254,32635,32637,32639,32641][digit-1]]);
const retinaculum = soft('Retináculo flexor.');
const hamate = bone('Gancho del ganchoso.', [24448], [24449]);
const thenarOrigin = bone('Tubérculos del escafoides y trapecio.', [24435,24443], [24436,24444]);
const fhbOrigin = bone('Cuboides y cuneiforme lateral.', [24528,24525], [24529,24526]);
const fhbMedial = hallux('Base de la falange proximal del hallux, lado medial, mediante sesamoideo.');
const fhbLateral = hallux('Base de la falange proximal del hallux, lado lateral, mediante sesamoideo.');
const adductorHandOblique = bone('Cabeza oblicua: grande y bases de metacarpianos 2 y 3.', [24446,24466,24468], [24447,24467,24469]);
const adductorHandTransverse = metacarpal('Cabeza transversa: diáfisis del tercer metacarpiano.', [3]);
const adductorFootOblique = metatarsal('Cabeza oblicua: bases de metatarsianos 2–4.', [2,3,4]);
const adductorFootTransverse = soft('Cabeza transversa: cápsulas y ligamentos metatarsofalángicos de los dedos 3–5.');

// NAMES is an explicit reviewed list, independent of renderer geometry.
const names: Record<string, [string, string]> = {
 "abductorpollicisbrevis": [
  "Abductor corto del pulgar",
  "Musculus abductor pollicis brevis"
 ],
 "opponenspollicis": [
  "Oponente del pulgar",
  "Musculus opponens pollicis"
 ],
 "abductordigitiminimihand": [
  "Abductor del meñique de la mano",
  "Musculus abductor digiti minimi manus"
 ],
 "flexordigitiminimibrevishand": [
  "Flexor corto del meñique de la mano",
  "Musculus flexor digiti minimi brevis manus"
 ],
 "opponensdigitiminimihand": [
  "Oponente del meñique de la mano",
  "Musculus opponens digiti minimi manus"
 ],
 "adductorpollicis": [
  "Aductor del pulgar",
  "Musculus adductor pollicis"
 ],
 "abductorhallucis": [
  "Abductor del dedo gordo",
  "Musculus abductor hallucis"
 ],
 "flexordigitorumbrevis": [
  "Flexor corto de los dedos del pie",
  "Musculus flexor digitorum brevis"
 ],
 "abductordigitiminimifoot": [
  "Abductor del quinto dedo del pie",
  "Musculus abductor digiti minimi pedis"
 ],
 "quadratusplantae": [
  "Cuadrado plantar",
  "Musculus quadratus plantae"
 ],
 "flexordigitiminimibrevisfoot": [
  "Flexor corto del quinto dedo del pie",
  "Musculus flexor digiti minimi brevis pedis"
 ],
 "extensorhallucisbrevis": [
  "Extensor corto del dedo gordo",
  "Musculus extensor hallucis brevis"
 ],
 "lumbricalfirstfoot": [
  "Primer lumbrical del pie",
  "Musculus lumbricalis primus pedis"
 ],
 "lumbricalsecondfoot": [
  "Segundo lumbrical del pie",
  "Musculus lumbricalis secundus pedis"
 ],
 "lumbricalthirdfoot": [
  "Tercer lumbrical del pie",
  "Musculus lumbricalis tertius pedis"
 ],
 "lumbricalfourthfoot": [
  "Cuarto lumbrical del pie",
  "Musculus lumbricalis quartus pedis"
 ],
 "plantarinterosseousfirst": [
  "Primer interóseo plantar",
  "Musculus interosseus plantaris primus"
 ],
 "plantarinterosseoussecond": [
  "Segundo interóseo plantar",
  "Musculus interosseus plantaris secundus"
 ],
 "plantarinterosseousthird": [
  "Tercer interóseo plantar",
  "Musculus interosseus plantaris tertius"
 ],
 "flexorhallucisbrevis": [
  "Flexor corto del dedo gordo",
  "Musculus flexor hallucis brevis"
 ],
 "adductorhallucis": [
  "Aductor del dedo gordo",
  "Musculus adductor hallucis"
 ]
};
function card(key: string, region: string, group: string, origins: MuscleAttachment[], insertions: MuscleAttachment[], action: string, innervation: string, relations: string, sources: MuscleSource[]): MuscleEducation {
 const [name, latin] = names[key];
 return {name, latin, region, group, description: `${name}: músculo intrínseco de ${region.toLowerCase()}.`, function: 'Participa en el control local de los dedos.', action, origins, insertions, innervation, relations, sources};
}
export const GAPS_EDUCATION: Record<string, MuscleEducation> = {
 abductorpollicisbrevis: card('abductorpollicisbrevis','Mano','Tenar',[thenarOrigin,retinaculum],[thumb('Base de la falange proximal del pulgar, lado radial.')],'Abduce el pulgar y ayuda a oponerlo.','Ramo recurrente del mediano (C8–T1).','Se estudia con los otros músculos tenares.',[uw('abductor-pollicis-brevis')]),
 opponenspollicis: card('opponenspollicis','Mano','Tenar',[thenarOrigin,retinaculum],[metacarpal('Borde lateral del primer metacarpiano.',[1])],'Rota y desplaza el primer metacarpiano para oponer el pulgar.','Ramo recurrente del mediano (C8–T1).','Actúa sobre el metacarpiano; no se le atribuye inserción falángica.',[uw('opponens-pollicis')]),
 abductordigitiminimihand: card('abductordigitiminimihand','Mano','Hipotenar',[bone('Pisiforme.',[24441],[24442])],[littleHand('Base de la falange proximal del meñique, lado ulnar.')],'Abduce el quinto dedo.','Ramo profundo del ulnar (C8–T1).','Pertenece al compartimento hipotenar.',[uw('abductor-digiti-minimi')]),
 flexordigitiminimibrevishand: card('flexordigitiminimibrevishand','Mano','Hipotenar',[hamate,retinaculum],[littleHand('Base de la falange proximal del meñique, lado ulnar.')],'Flexiona la articulación metacarpofalángica del quinto dedo.','Ramo profundo del ulnar (C8–T1).','Comparte región con abductor y oponente del meñique.',[uw('flexor-digiti-minimi-brevis')]),
 opponensdigitiminimihand: card('opponensdigitiminimihand','Mano','Hipotenar',[hamate,retinaculum],[metacarpal('Borde medial del quinto metacarpiano.',[5])],'Desplaza y rota el quinto metacarpiano en la oposición.','Ramo profundo del ulnar (C8–T1).','Su inserción metacarpiana se distingue de la de los otros hipotenares.',[uw('opponens-digiti-minimi')]),
 adductorpollicis: card('adductorpollicis','Mano','Aductor',[adductorHandOblique,adductorHandTransverse],[thumb('Base de la falange proximal del pulgar, lado ulnar.')],'Aduce el pulgar.','Ramo profundo del ulnar (C8–T1).','Cabezas oblicua y transversa conservadas bajo un solo músculo por lado.',[uw('adductor-pollicis'),alpha]),
 abductorhallucis: card('abductorhallucis','Pie','Plantar superficial',[heel('Tuberosidad calcánea medial.')],[hallux('Base de la falange proximal del hallux, lado medial.')],'Abduce y flexiona el hallux.','Nervio plantar medial.','Borde medial de la planta.',[foot]),
 flexordigitorumbrevis: card('flexordigitorumbrevis','Pie','Plantar superficial',[heel('Tuberosidad calcánea.'),soft('Aponeurosis plantar y tabiques.')],[bone('Bases de falanges medias de dedos 2–5.',[32642,32644,32646,230986],[32643,32645,32647,230988])],'Flexiona los dedos 2–5.','Nervio plantar medial.','Sus tendones permiten el paso del flexor largo.',[foot]),
 abductordigitiminimifoot: card('abductordigitiminimifoot','Pie','Plantar superficial',[heel('Tuberosidad calcánea.')],[littleFoot('Base de falange proximal del quinto dedo, lado lateral.')],'Abduce y flexiona el quinto dedo.','Nervio plantar lateral.','Borde lateral de la planta.',[alpha]),
 quadratusplantae: card('quadratusplantae','Pie','Plantar profunda',[heel('Superficie plantar del calcáneo.'),soft('Ligamento plantar largo.')],[soft('Tendón del flexor largo de los dedos.')],'Ayuda al flexor largo a flexionar los dedos.','Nervio plantar lateral.','Su inserción tendinosa no se sustituye por una falange.',[alpha]),
 flexordigitiminimibrevisfoot: card('flexordigitiminimibrevisfoot','Pie','Plantar profunda',[metatarsal('Base del quinto metatarsiano.',[5])],[littleFoot('Base de la falange proximal del quinto dedo.')],'Flexiona la articulación metatarsofalángica del quinto dedo.','Nervio plantar lateral.','Distinto del flexor corto homónimo de la mano.',[alpha]),
 extensorhallucisbrevis: card('extensorhallucisbrevis','Pie','Dorso',[heel('Superficie dorsal del calcáneo.')],[hallux('Base dorsal de la falange proximal del hallux.')],'Extiende el hallux.','Nervio fibular profundo.','Relacionado con el extensor corto de los dedos, que no se añade sin identidad propia.',[ncbi]),
 flexorhallucisbrevis: card('flexorhallucisbrevis','Pie','Plantar profunda',[fhbOrigin],[fhbMedial,fhbLateral],'Flexiona el hallux.','Nervio plantar medial; puede existir aporte plantar lateral a la cabeza lateral.','Los sesamoideos se describen en texto, sin inventar geometría.',[ncbi,foot]),
 adductorhallucis: card('adductorhallucis','Pie','Plantar profunda',[adductorFootOblique,adductorFootTransverse],[hallux('Base de la falange proximal del hallux, lado lateral.')],'Aduce el hallux.','Ramo profundo del plantar lateral.','La cabeza transversa tiene fijaciones capsuloligamentosas.',[ncbi]),
};
// Named/numbered source muscles remain distinct. Soft-tissue attachments have
// no bone-context surrogate; the lumbricals intentionally return no bone IDs.
const ordinals = ['first','second','third','fourth'];
for (let i=0;i<4;i++) {
 const key=`lumbrical${ordinals[i]}foot`, digit=i+2;
 GAPS_EDUCATION[key]=card(key,'Pie','Lumbricales',[soft('Tendones del flexor largo de los dedos.')],[soft(`Expansión extensora medial del dedo ${digit}.`)],`Flexiona la metatarsofalángica y extiende las interfalángicas del dedo ${digit}.`,i===0?'Nervio plantar medial.':'Nervio plantar lateral.','Inserciones tendinosas; sin asociación ósea directa.',[ncbi]);
}
for (let i=0;i<3;i++) {
 const key=`plantarinterosseous${ordinals[i]}`, digit=i+3;
 GAPS_EDUCATION[key]=card(key,'Pie','Interóseos plantares',[metatarsal(`Cara medial del metatarsiano ${digit}.`,[digit])],[toeProximal(`Base de la falange proximal del dedo ${digit}.`,digit),soft('Expansión extensora correspondiente.')],`Aduce el dedo ${digit}; flexiona su metatarsofalángica y ayuda a extender las interfalángicas.`,'Ramo profundo del plantar lateral.','Aducción respecto al eje del segundo dedo.',[foot]);
}
const adductor = (family: string, name: string, latin: string, originIndex: number): ComponentDetail => ({family,name,latin,originIndex});
const hpOblique=adductor('adductorpollicis','Cabeza oblicua','Caput obliquum musculi adductoris pollicis',0);
const hpTransverse=adductor('adductorpollicis','Cabeza transversa','Caput transversum musculi adductoris pollicis',1);
const fpOblique=adductor('adductorhallucis','Cabeza oblicua','Caput obliquum musculi adductoris hallucis',0);
const fpTransverse=adductor('adductorhallucis','Cabeza transversa','Caput transversum musculi adductoris hallucis',1);
const fhMedial: ComponentDetail={family:'flexorhallucisbrevis',name:'Cabeza medial',latin:'Caput mediale musculi flexoris hallucis brevis',originIndex:0,insertions:[fhbMedial],innervation:'Nervio plantar medial.'};
const fhLateral: ComponentDetail={family:'flexorhallucisbrevis',name:'Cabeza lateral',latin:'Caput laterale musculi flexoris hallucis brevis',originIndex:0,insertions:[fhbLateral]};
export const GAPS_COMPONENTS: Record<string,ComponentDetail> = {
 FMA46121:hpOblique,FMA46122:hpOblique,FMA46123:hpTransverse,FMA46124:hpTransverse,
 FMA46018:fpOblique,FMA46019:fpOblique,FMA46020:fpTransverse,FMA46021:fpTransverse,
 FMA45971:fhMedial,FMA45972:fhMedial,FMA45973:fhLateral,FMA45974:fhLateral,
};
