# Fase 3B — trazabilidad de las fichas musculares

Revisión de fuentes: 21 de septiembre de 2026. Implementación: [muscle-education.ts](../src/features/anatomy/atlas/muscle-education.ts) y [MuscleInformation.tsx](../src/features/anatomy/atlas/MuscleInformation.tsx). Las ocho familias del piloto conservan sus textos e identificadores. Se añaden las trece familias aprobadas por la [auditoría](phase3b-audit.md).

Las fichas son síntesis originales breves de anatomía general, sin reproducir ilustraciones. Las fuentes educativas no miden fijaciones, inervación ni acción en el ejemplar BodyParts3D. Los rangos anatómicos elegidos sirven para describir y dar contexto; no representan máscaras de inserción ni certificación clínica.

## Fuentes y decisiones por familia

| Familia | Fijaciones elegidas y límite relevante | Fuentes utilizadas |
| --- | --- | --- |
| Pectoral mayor | Clavicular: mitad medial clavicular. Esternocostal: esternón y cartílagos superiores, con extensión variable. Abdominal: aponeurosis del oblicuo externo. Inserción común: labio lateral del surco humeral. | [University of Washington](https://rad.uw.edu/muscle-atlas/pectoralis-major), [Haładaj et al., estudio humano de sus tres porciones](https://pmc.ncbi.nlm.nih.gov/articles/PMC6466946/) |
| Pectoral menor | Costillas 3–5 → coracoides. Inervación resumida: pectoral medial, C8–T1. | [University of Washington](https://rad.uw.edu/muscle-atlas/pectoralis-minor), [Texas Tech, tabla muscular](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html) |
| Serrato anterior | Primeras ocho o nueve costillas → cara costal del borde medial escapular. Contexto conservador: costillas 1–8; no se afirma si este ejemplar alcanza la novena. | [University of Washington](https://rad.uw.edu/muscle-atlas/serratus-anterior), [OpenStax 11.5](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs) |
| Subclavio | Primera unión costocondral → cara inferior clavicular. Se identifica el nervio del subclavio sin asignar raíces con precisión innecesaria. | [Texas Tech](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html), [OpenStax 11.5](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs) |
| Oblicuo externo | Costillas 5–12 → cresta ilíaca, región púbica y línea alba/aponeurosis. Inervación de la ficha: T7–T11 y subcostal T12. | [NCBI: fascia de pared abdominal](https://www.ncbi.nlm.nih.gov/sites/books/NBK459392/), [NCBI: nervios de pared abdominal](https://www.ncbi.nlm.nih.gov/sites/books/NBK556034/), [OpenStax 11.4, relaciones entre capas](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax) |
| Trapecio | Conjunto: occipital, ligamento nucal, C7–T12 → clavícula/acromion/espina escapular. Porciones con origen e inserción propios, detalladas abajo. | [University of Washington](https://rad.uw.edu/muscle-atlas/trapezius), [Levien et al., descripción de las porciones](https://pmc.ncbi.nlm.nih.gov/articles/PMC12750476/), [Pediatric Neurology, descripción segmentaria](https://www.sciencedirect.com/science/article/abs/pii/S0887899410004479) |
| Romboides mayor | T2–T5 → borde medial escapular inferior a su espina. Nervio dorsal escapular, principalmente C5; UW también describe C4. | [University of Washington](https://rad.uw.edu/muscle-atlas/rhomboid-major-and-minor), [Texas Tech](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html) |
| Romboides menor | C7–T1 y ligamento nucal → raíz de la espina escapular. Misma cautela sobre raíces nerviosas. | [University of Washington](https://rad.uw.edu/muscle-atlas/rhomboid-major-and-minor), [Texas Tech](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html) |
| Iliocostal lumbar | Sacro, cresta ilíaca y fascia toracolumbar → costillas 5–12 y apófisis transversas L1–L4. Se distinguen fijaciones de fascículos torácicos/lumbares sin dividir la malla. | [Revisión anatómica, Journal of Yeungnam Medical Science](https://pmc.ncbi.nlm.nih.gov/articles/PMC9273134/), [NCBI: ramos posteriores](https://www.ncbi.nlm.nih.gov/sites/books/NBK537074/), [OpenStax 11.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back) |
| Iliocostal torácico | Costillas 7–12 → costillas 1–6 y apófisis transversa C7. Inervación por ramos posteriores, sin extrapolar raíces por la geometría. | [Life, revisión anatómica e imagen](https://pmc.ncbi.nlm.nih.gov/articles/PMC11051048/), [NCBI: ramos posteriores](https://www.ncbi.nlm.nih.gov/sites/books/NBK537074/), [OpenStax 11.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back) |
| Longísimo torácico | Aponeurosis con fijaciones lumbares, sacras e ilíacas → apófisis transversas torácicas/lumbares y costillas 2–12, siguiendo la síntesis de Elsevier. No se importa la inserción mastoidea del longísimo de la cabeza. | [Elsevier, Longissimus Thoracis](https://www.elsevier.com/resources/anatomy/muscular-system/muscles-of-back/longissimus-thoracis-muscle/21643), [Life](https://pmc.ncbi.nlm.nih.gov/articles/PMC11051048/), [OpenStax 11.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back) |
| Espinoso torácico | Apófisis espinosas T11–L2 → T2–T8, según la tabla de disección consultada. Nombre español coherente con el catálogo; latín *Musculus spinalis thoracis*. | [Disección torácica y lumbar, tabla 1](https://pmc.ncbi.nlm.nih.gov/articles/PMC12317433/), [NCBI: ramos posteriores](https://www.ncbi.nlm.nih.gov/sites/books/NBK537074/), [OpenStax 11.3](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-3-axial-muscles-of-the-head-neck-and-back), [IFAA/Fribourg TA98, A04.3.02.016](https://ifaa.unifr.ch/Public/TNAEntryPage/auto/TA98/ES/TAH1623%20A1F%20ES.htm) |
| Redondo mayor | Ángulo inferior escapular posterior → labio medial del surco humeral. Nervio subescapular inferior; no se fijan raíces discrepantes entre tablas. No integra el manguito rotador. | [University of Washington](https://rad.uw.edu/muscle-atlas/teres-major), [Texas Tech](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html), [OpenStax 11.5](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs) |

La agrupación de iliocostal, longísimo y espinoso como erectores de la columna está respaldada por OpenStax 11.3. No procede de convertir automáticamente relaciones `IS-A` de BP3D en `PART-OF`. Los niveles regionales concretos reciben fichas propias; no heredan indiscriminadamente las fijaciones craneales de otras divisiones.

## Porciones y contexto explícito

| Componente | FMA derecho / izquierdo | Huesos que muestra el contexto |
| --- | --- | --- |
| Pectoral clavicular | 34690 / 34691 | Clavícula y húmero del mismo lado |
| Pectoral esternocostal | 79979 / 79980 | Esternón y húmero del mismo lado |
| Pectoral abdominal | 45874 / 45875 | Húmero del mismo lado; la aponeurosis no tiene sustituto óseo |
| Trapecio descendente | 33586 / 33587 | Occipital y clavícula del mismo lado |
| Trapecio transverso | 33584 / 33585 | T1–T4 y escápula del mismo lado |
| Trapecio ascendente | 33581 / 33583 | T4–T12 y escápula del mismo lado |

El trapecio descendente se describe desde occipital/ligamento nucal a clavícula; el transverso desde T1–T4 a espina escapular/región acromial; el ascendente desde T4–T12 al extremo medial de la espina escapular. Se usan los rangos convencionales de Levien et al.; la descripción de Pediatric Neurology apoya la fijación acromial de fibras transversas y emplea límites vertebrales diferentes. No se presentan esas divisiones como límites exactos medidos en BP3D. La ficha del conjunto conserva C7–T12 y no impone que una partición bibliográfica agote todos los fascículos de otra descripción.

Los identificadores óseos están enumerados explícitamente en el código y cotejados con el catálogo conservado. Sólo se permiten huesos ipsilaterales y huesos de línea media revisados. No se buscan vecinos por distancia, no se usa el lado opuesto como reemplazo y los huesos ausentes se omiten. Cartílagos, aponeurosis, fascias y ligamentos permanecen textuales. La inserción común y la inervación de las porciones pectorales se identifican como resumen del músculo; las porciones del trapecio tienen además inserciones propias.

## Ambigüedades de las fuentes y decisiones conservadoras

- El texto vigente de UW sobre pectoral menor incluye una referencia aparente a una cabeza clavicular en la línea de inervación. No se copia; la descripción C8–T1 se contrasta con Texas Tech.
- NCBI sobre nervios abdominales menciona explícitamente aportes L1 inferiores incluso al oblicuo externo. No se deducen por vecindad con oblicuo interno/transverso. La ficha conserva el resumen convencional T7–T12 y omite ese detalle adicional, cuya extensión no se establece para este ejemplar.
- Las tablas generales pueden agrupar músculos o mezclar divisiones. OpenStax 11.4 se utiliza para relaciones entre capas, sin trasladar su fila combinada de oblicuos a fijaciones individuales. La ficha del longísimo torácico usa la entrada específica de Elsevier y la revisión anatómica de Life.
- Las raíces del redondo mayor difieren entre UW y Texas Tech; se conserva el nervio subescapular inferior sin combinar rangos. Para los erectores se evita asignar niveles nerviosos exactos sin correspondencia individual.
- Las referencias a oblicuo interno, recto, transverso o dorsal ancho describen relaciones o antecedentes; no añaden estas estructuras al inventario aprobado ni justifican sintetizar sus mallas.

Este documento acredita procedencia y decisiones editoriales. La comprobación de fichas, selección y contexto en el build final corresponde al informe de validación de Fase 3B.
