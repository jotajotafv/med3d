export type EducationalMicroModule = {
  id: string; title: string; latin: string; parentIds: readonly string[];
  format: 'swc' | 'glb'; path: string; description: string; function: string;
  relations: string; limitation: string; frame: string;
  source: string; sourceUrl: string; attribution: string; license: string; licenseUrl: string;
  references: readonly {label: string; url: string}[];
};

/** Separate educational scenes. These entries are never body assets or a system. */
export const MICRO_MODULES: readonly EducationalMicroModule[] = [{
  id: 'neuromorpho:102401', title: 'Neurona cerebral', latin: 'Neuron',
  parentIds: ['nervous:cerebrum'], format: 'swc', path: 'models/anatomy/micro/neuron-102401.swc',
  description: 'Trazado tridimensional de una neurona humana reconstruida a partir de una preparación teñida con biocitina. La fuente identifica soma, axón y dendritas.',
  function: 'Permite estudiar la ramificación de las prolongaciones de una célula nerviosa y su relación con el soma.',
  relations: 'Vinculada al cerebro como contexto educativo. La muestra corresponde a un donante masculino de 30 años; no pertenece al donante del atlas corporal.',
  limitation: 'Reconstrucción parcial de una sola célula. Las líneas muestran trayectorias, no el grosor de las prolongaciones ni una superficie celular. No incluye sinapsis ni un microcircuito. La región específica no se asigna porque la ficha original contiene denominaciones regionales discordantes. No se corrigió la contracción del tejido.',
  frame: 'Coordenadas originales en micrómetros; vista independiente del cuerpo.',
  source: 'Allen Cell Types · NeuroMorpho.Org', sourceUrl: 'https://neuromorpho.org/neuron_info.jsp?neuron_name=H17-03-011-11-04-05_650978964_m',
  attribution: 'Allen Institute for Brain Science; NeuroMorpho.Org (RRID:SCR_002145), reconstrucción 102401. Visualización de los datos originales por MED3D.',
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  references: [
    {label: 'Koch y Jones (2016). Big Science, Team Science, and Open Science for Neuroscience', url: 'https://doi.org/10.1016/j.neuron.2016.10.019'},
    {label: 'Tecuatl, Ljungquist y Ascoli (2024). Publicación de NeuroMorpho.Org', url: 'https://doi.org/10.1096/fba.2024-00048'},
  ],
}, {
  id: 'hra:glomerulus-3d', title: 'Glomérulo renal', latin: 'Glomerulus renalis',
  parentIds: ['uri:FMA7204', 'uri:FMA7205'], format: 'glb', path: 'models/anatomy/micro/glomerulus.glb',
  description: 'Modelo educativo tridimensional de HRA que representa las arteriolas aferente y eferente, la red capilar y quince podocitos del glomérulo.',
  function: 'Permite explorar la organización espacial de los capilares y de las células que los recubren en esta unidad de filtración renal.',
  relations: 'Vinculado a ambos riñones como ejemplo de microanatomía. Es una misma escena educativa, independiente de la lateralidad y del donante del cuerpo.',
  limitation: 'Representación esquemática elaborada a partir de bibliografía y revisión experta; no es una segmentación de un donante. No representa una nefrona completa, sus túbulos ni todas las capas de la barrera de filtración. El tamaño en pantalla no expresa una medida histológica.',
  frame: 'Escala propia del modelo original; no se inserta ni se registra dentro del riñón corporal.',
  source: 'Human Reference Atlas · NIH 3D', sourceUrl: 'https://3d.nih.gov/entries/3DPX-023604',
  attribution: 'Heidi Schlehlein; dirección: Katy Börner; revisión: Sanjay Jain. HRA, 2026. Compresión sin pérdida geométrica para MED3D.',
  license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  references: [{label: 'Krstić (1991). Human Microscopic Anatomy — bibliografía del modelo', url: 'https://doi.org/10.1007/978-3-662-02676-2'}],
}];

export function microModulesFor(parentId: string) {
  return MICRO_MODULES.filter(module => module.parentIds.includes(parentId));
}
