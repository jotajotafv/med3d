export interface EducationNote { region:string; description:string; function:string; relations:string[]; source:string }
const anatomy='https://www.nhlbi.nih.gov/health/heart/anatomy';
const flow='https://www.nhlbi.nih.gov/health/heart/blood-flow';
const respiratory='https://www.nhlbi.nih.gov/health/lungs/respiratory-system';
const h=(description:string,fn:string,relations:string[],source=flow):EducationNote=>({region:'Tórax',description,function:fn,relations,source});
const l=(description:string,fn:string,relations:string[]):EducationNote=>({region:'Tórax',description,function:fn,relations,source:respiratory});
export const EDUCATION:Record<string,EducationNote>={
 VH_M_heart:h('Órgano muscular con cuatro cavidades.','Bombea sangre hacia los pulmones y el cuerpo.',['VH_M_cardiac_chamber','VH_M_heart_valve'],anatomy),
 VH_M_cardiac_chamber:h('Dos aurículas y dos ventrículos.','Las aurículas reciben sangre; los ventrículos la impulsan.',['VH_M_left_cardiac_atrium','VH_M_right_cardiac_atrium','VH_M_heart_left_ventricle','VH_M_heart_right_ventricle'],anatomy),
 VH_M_heart_valve:h('Cuatro válvulas cardíacas.','Mantienen el sentido del flujo sanguíneo.',['VH_M_mitral_valve','VH_M_tricuspid_valve','VH_M_aortic_valve','VH_M_pulmonary_valve']),
 VH_M_left_cardiac_atrium:h('Cavidad superior izquierda.','Recibe sangre oxigenada de los pulmones.',['VH_M_mitral_valve','VH_M_heart_left_ventricle']),
 VH_M_right_cardiac_atrium:h('Cavidad superior derecha.','Recibe sangre procedente del cuerpo.',['VH_M_tricuspid_valve','VH_M_heart_right_ventricle']),
 VH_M_heart_left_ventricle:h('Cavidad inferior izquierda.','Impulsa sangre a la aorta y al cuerpo.',['VH_M_mitral_valve','VH_M_aortic_valve','VH_M_interventricular_septum']),
 VH_M_heart_right_ventricle:h('Cavidad inferior derecha.','Impulsa sangre hacia los pulmones.',['VH_M_tricuspid_valve','VH_M_pulmonary_valve','VH_M_interventricular_septum']),
 VH_M_mitral_valve:h('Entre aurícula y ventrículo izquierdos.','Limita el retorno hacia la aurícula.',['VH_M_left_cardiac_atrium','VH_M_heart_left_ventricle']),
 VH_M_tricuspid_valve:h('Entre aurícula y ventrículo derechos.','Limita el retorno hacia la aurícula.',['VH_M_right_cardiac_atrium','VH_M_heart_right_ventricle']),
 VH_M_aortic_valve:h('Entre ventrículo izquierdo y aorta.','Limita el retorno al ventrículo.',['VH_M_heart_left_ventricle']),
 VH_M_pulmonary_valve:h('Entre ventrículo derecho y arteria pulmonar.','Limita el retorno al ventrículo.',['VH_M_heart_right_ventricle']),
 VH_M_interventricular_septum:h('Pared entre los ventrículos.','Separa las cavidades ventriculares derecha e izquierda.',['VH_M_heart_left_ventricle','VH_M_heart_right_ventricle'],anatomy),
 VH_M_respiratory_system:l('Pulmones y vías respiratorias.','Conduce aire y permite el intercambio gaseoso.',['VH_M_lungs','VH_M_tracheobronchial_tree']),
 VH_M_lungs:l('Órganos situados a ambos lados del corazón.','Intercambian oxígeno y dióxido de carbono.',['VH_M_lungs_L','VH_M_lungs_R']),
 VH_M_lungs_L:l('Pulmón formado por dos lóbulos.','Participa en el intercambio gaseoso.',['VH_M_lungs_L_upper_lobe','VH_M_lungs_L_lower_lobe']),
 VH_M_lungs_R:l('Pulmón formado por tres lóbulos.','Participa en el intercambio gaseoso.',['VH_M_lungs_R_upper_lobe','VH_M_lungs_R_middle_lobe','VH_M_lungs_R_lower_lobe']),
 VH_M_lungs_L_upper_lobe:l('División superior del pulmón izquierdo.','Participa en el intercambio gaseoso pulmonar.',['VH_M_lungs_L','VH_M_lungs_L_lower_lobe']),
 VH_M_lungs_L_lower_lobe:l('División inferior del pulmón izquierdo.','Participa en el intercambio gaseoso pulmonar.',['VH_M_lungs_L','VH_M_lungs_L_upper_lobe']),
 VH_M_lungs_R_upper_lobe:l('División superior del pulmón derecho.','Participa en el intercambio gaseoso pulmonar.',['VH_M_lungs_R','VH_M_lungs_R_middle_lobe']),
 VH_M_lungs_R_middle_lobe:l('División media del pulmón derecho.','Participa en el intercambio gaseoso pulmonar.',['VH_M_lungs_R_upper_lobe','VH_M_lungs_R_lower_lobe']),
 VH_M_lungs_R_lower_lobe:l('División inferior del pulmón derecho.','Participa en el intercambio gaseoso pulmonar.',['VH_M_lungs_R','VH_M_lungs_R_middle_lobe']),
 VH_M_tracheobronchial_tree:l('Bronquios y sus ramificaciones.','Transportan aire hacia el interior pulmonar.',['VH_M_bronchi_L','VH_M_bronchi_R']),
 VH_M_bronchi:l('Vías que se ramifican dentro del pulmón.','Conducen aire.',['VH_M_bronchi_L','VH_M_bronchi_R'])
};

