> **Estado vigente — integración:** la autorización posterior permite terminar con cobertura parcial. Se conserva debajo la investigación y sus pausas como historial; las sustituye la decisión de [entrega](phase4-delivery.md). BP3D 4.0 en el cuerpo; HRA independiente.

# Fase 4 — preauditoría y decisión pendiente

Estado: **detenida antes de extraer o integrar geometría**. No es un cierre de Fase 4. Fecha: 27 septiembre 2026. Rama `phase4-nervous-system`, base `3373a06bed350c7af13f26dd1c461448c0650885`.

## Hallazgo que requiere decisión

La tabla PART-OF asigna a médula espinal `FMA7647` sólo `FJ1737`. El mismo FJ corresponde en IS-A a `FMA78497`, conducto central de la médula. La relación PART-OF conducto→médula no convierte el conducto en todo el órgano. No hay evidencia suficiente para presentar ese elemento como tejido medular completo.

Las búsquedas en las dos tablas no identifican los cuatro plexos, los cinco nervios principales de miembro superior ni los siete de miembro inferior solicitados. Hay encéfalo, cerebelo, regiones del tronco y un conjunto craneal principalmente orbitario. Esa cobertura no permite cumplir el alcance corporal deseado sin una decisión importante. No se descargó otra fuente ni se buscó hacer un ajuste visual.

## Método y alcance

Se leyeron las seis tablas ya preservadas y el directorio de 2.234 entradas de OBJ99; no se procesaron los OBJ históricos. IS-A: 2.905 conceptos; PART-OF: 1.368. Las búsquedas y uniones exactas se conservan en [preaudit.json](phase4/preaudit.json). Las ausencias nominales son específicas de estas tablas 4.0, no una afirmación sobre todo BodyParts3D.

APROBADO para integración: **0**, porque aún no se validó geometría y la fase se detiene en la auditoría. Los candidatos con identidad presente quedan APLAZADOS por alcance; esto no los declara inválidos. DESCARTADO se refiere a la sustitución conducto→médula, no a la identidad original del conducto. Las filas siguientes son prioridades auditadas, no un inventario definitivo de estructuras independientes; existen agregados solapados.

| Nombre / latín | FMA / FJ | Tipo · división · región | Lado / padre | Archivo(s) / bytes OBJ | Decisión y motivo |
|---|---|---|---|---|---|
| Encéfalo / Encephalon | FMA50801 / 59 FJ: ver JSON | órgano compuesto · SNC · cabeza | no especificado / sin curar | 59 OBJ: ver JSON / 21659135 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Cerebelo / Cerebellum | FMA67944 / FJ1781, FJ1830 | región · SNC · cabeza | no especificado / sin curar | FJ1781.obj, FJ1830.obj / 3178305 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Tronco encefálico / Truncus encephali | FMA79876 / FJ1738, FJ1762, FJ1769, FJ1770, FJ1775, FJ1779, FJ1810, FJ1817, FJ1822, FJ1826, FJ1831 | región compuesta · SNC · cabeza | no especificado / sin curar | 11 OBJ: ver JSON / 3222243 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Mesencéfalo / Mesencephalon | FMA61993 / FJ1770, FJ1817 | región · SNC · cabeza | no especificado / sin curar | FJ1770.obj, FJ1817.obj / 929107 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Puente / Pons | FMA67943 / FJ1775, FJ1822 | región · SNC · cabeza | no especificado / sin curar | FJ1775.obj, FJ1822.obj / 1424933 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Bulbo raquídeo / Medulla oblongata | FMA62004 / FJ1769, FJ1831 | región · SNC · cabeza | no especificado / sin curar | FJ1769.obj, FJ1831.obj / 793523 | APLAZADO: Identidad y FJ presentes; candidato a revisión geométrica. Integración suspendida por decisión de alcance, no por ausencia. Los compuestos no se contarían además de sus componentes. |
| Médula espinal / Medulla spinalis | FMA7647 / FJ1737 | órgano · SNC · columna | no especificado / sin curar | FJ1737.obj / 46908 | APLAZADO: La única unión es FJ1737, compartida con FMA78497 (conducto central). No se demuestra geometría de médula completa. |
| Conducto central usado como médula completa / Canalis centralis | FMA78497 / FJ1737 | cavidad/conducto · SNC · columna | no especificado / FMA7647 en PART-OF | FJ1737.obj / 46908 | DESCARTADO: Se descarta esta sustitución semántica: un conducto no acredita el tejido de la médula. No se descarta la identidad original del conducto. |
| I Olfatorio / Nervus olfactorius | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| II Óptico / Nervus opticus | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Nervio Óptico identificado por lado: FMA50875→FJ1364,FJ1819; FMA50878→FJ1313,FJ1772. Desglose pendiente; no se clasifica automáticamente como nervio periférico ordinario. |
| III Oculomotor / Nervus oculomotorius | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sólo ramas superior/inferior identificadas por lado; no acredita nervio oculomotor completo. |
| IV Troclear / Nervus trochlearis | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Troclear derecho FMA50881→FJ1381 e izquierdo FMA50882→FJ1330 identificados; sin validación geométrica aún. |
| V Trigémino / Nervus trigeminus | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Rama oftálmica y ramas orbitarias presentes; no acredita V completo, V2 ni V3. |
| VI Abducens / Nervus abducens | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| VII Facial / Nervus facialis | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| VIII Vestibulococlear / Nervus vestibulocochlearis | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| IX Glosofaríngeo / Nervus glossopharyngeus | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| X Vago / Nervus vagus | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| XI Accesorio / Nervus accessorius | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| XII Hipogloso / Nervus hypoglossus | sin asignar /  | nervio craneal o familia · pares craneales · cabeza | par bilateral por auditar / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en ninguna de las dos tablas consultadas; no equivale a ausencia en todas las versiones de BP3D. |
| Plexo cervical / Plexus cervicalis | sin asignar /  | plexo · SNP · cuello | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Plexo braquial / Plexus brachialis | sin asignar /  | plexo · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Plexo lumbar / Plexus lumbalis | sin asignar /  | plexo · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Plexo sacro / Plexus sacralis | sin asignar /  | plexo · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Axilar / Nervus axillaris | sin asignar /  | nervio · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Musculocutáneo / Nervus musculocutaneus | sin asignar /  | nervio · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Mediano / Nervus medianus | sin asignar /  | nervio · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Ulnar / cubital / Nervus ulnaris | sin asignar /  | nervio · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Radial / Nervus radialis | sin asignar /  | nervio · SNP · miembro superior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Femoral / Nervus femoralis | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Obturador / Nervus obturatorius | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Ciático / Nervus ischiadicus | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Tibial / Nervus tibialis | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Fibular común / Nervus fibularis communis | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Fibular superficial / Nervus fibularis superficialis | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Fibular profundo / Nervus fibularis profundus | sin asignar /  | nervio · SNP · miembro inferior | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Nervios glúteos / Nervi glutei | sin asignar /  | nervio · SNP · pelvis | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Nervios espinales / Nervi spinales | sin asignar /  | nervio · SNP · columna | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |
| Raíces espinales / Radices nervorum spinalium | sin asignar /  | raíz · SNP · columna | no especificado / sin curar | ninguno identificado / 0 | APLAZADO: Sin identificación nominal en las tablas IS-A y PART-OF 4.0 consultadas. No se asignan FMA, FJ ni geometría supuesta. |

Todas las filas se refieren al sistema nervioso y fuente BodyParts3D 4.0 OBJ99 / DBCLS. Latín editorial; no es un campo proporcionado por las tablas inglesas. Los bytes son tamaños originales del directorio ZIP, no GLB ni geometría extraída. No se convierten relaciones IS-A en padres anatómicos.

## Opciones antes de continuar

1. **Cobertura parcial con BP3D 4.0:** integrar encéfalo/cerebelo/tronco y los nervios craneales identificables tras validación; dejar médula completa, plexos y nervios de extremidades pendientes. Mantener HRA independiente. Requiere aceptar el alcance reducido.
2. **Investigar una cobertura corporal mayor:** comparar primero otras versiones documentadas de BP3D y después fuentes abiertas. Auditar licencias, procedencia, coordenadas y posibles correspondencias; no integrar ni registrar otra fuente sin una propuesta verificable. No se garantiza que exista un registro viable.

No se propone introducir el encéfalo HRA en el cráneo por normalización de bounds: su transformación actual sólo sirve para navegación. [Fuentes y encéfalo existente](phase4-sources.md).

La aplicación, modelos y rutas no se modificaron. No se ejecutaron pruebas globales, commits, push, merge ni bundle de cierre: la fase sigue pendiente.


## Resolución de integración

**87 elementos APROBADOS**, con cabecera FMA/FJ/BP y versión 4.0 confirmadas: **79 unidades seleccionables (30 estructuras y 49 componentes)**. Son 46 claves de ficha, equivalentes a 43 familias anatómicas; II, IV y ganglio ciliar conservan claves separadas por lado.

**6 elementos DESCARTADOS** como tejido nervioso: FJ1730, FJ1731, FJ1738, FJ1767, FJ1814 (espacios ventriculares) y FJ1737 (conducto central, nunca médula completa). **1 elemento APLAZADO:** FJ1795, glándula pineal, fuera de esta entrega. Además hay **29 filas de cobertura aplazada**: pares/territorios ausentes, médula, plexos, raíces y extremidades; III y V completos permanecen pendientes. Son filas de alcance, no 29 mallas ni un conteo de nervios individuales.

FJ4426 de 4.3 no resolvió identidad primaria y marco común suficientes. No se repiten los endpoints fallidos conservados en la investigación. HRA medular tiene una licencia utilizable, pero faltan correspondencias vertebrales BP3D–HRA verificadas: no se fuerza registro ni se inventa un error. La alternativa queda pendiente y se continúa con BP3D 4.0.

Organización curada: encéfalo → cerebro/diencéfalo/tronco/cerebelo; colículos dentro del mesencéfalo y túber cinéreo dentro del hipotálamo. Giros y zonas son componentes, no órganos adicionales. II se sitúa en SNC. III sólo tiene ramas; V sólo V1 y ramas. No se transforma IS-A automáticamente en PART-OF. Las piezas con el mismo FMA sin lado explícito se agrupan en una sola unidad: `midline` indica unidad no lateralizada, no vértices necesariamente sagitales.

[Selección completa](../research/anatomy/nervous-selection.json), [OBJ originales](../research/anatomy/nervous-originals.zip), [bloqueo de fuente](../research/anatomy/nervous-source-lock.json). Todos pertenecen a cabeza y al marco BP3D 4.0. Motivo común de aprobación: identidad y geometría verificadas. La columna padre expresa agrupación curada; las dos relaciones especiales están descritas arriba.

| Nombre | FMA | FJ | Lado | Entidad | Padre | Módulo | Decisión |
|---|---|---|---|---|---|---|---|
| Giro angular · izquierdo | FMA72670 | FJ1732 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro angular · derecho | FMA72669 | FJ1733 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro del cíngulo · izquierdo | FMA72718 | FJ1739 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro del cíngulo · derecho | FMA72717 | FJ1740 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal inferior · izquierdo | FMA72658 | FJ1744 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal inferior · derecho | FMA72657 | FJ1745 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro temporal inferior · izquierdo | FMA72688 | FJ1746 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro temporal inferior · derecho | FMA72687 | FJ1747 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Ínsula · izquierdo | FMA72978 | FJ1748 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Ínsula · derecho | FMA72977 | FJ1749 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Cápsula interna · izquierdo | FMA72907 | FJ1750 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Cápsula interna · derecho | FMA72906 | FJ1751 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Sustancia blanca cerebral · izquierdo | FMA260794 | FJ1758 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Sustancia blanca cerebral · derecho | FMA260791 | FJ1806 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Hipocampo · izquierdo | FMA72714 | FJ1759 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Hipocampo · derecho | FMA72713 | FJ1807 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Hipotálamo | FMA62008 | FJ1760 | midline | componente encefálico | diencephalon | nervous:cns | APROBADO |
| Hipotálamo | FMA62008 | FJ1808 | midline | componente encefálico | diencephalon | nervous:cns | APROBADO |
| Habénula | FMA62032 | FJ1743 | midline | componente encefálico | diencephalon | nervous:cns | APROBADO |
| Túber cinéreo | FMA62327 | FJ1780 | midline | componente encefálico | diencephalon | nervous:cns | APROBADO |
| Túber cinéreo | FMA62327 | FJ1828 | midline | componente encefálico | diencephalon | nervous:cns | APROBADO |
| Colículo inferior · izquierdo | FMA73435 | FJ1762 | left | componente encefálico | brainstem | nervous:cns | APROBADO |
| Colículo inferior · derecho | FMA73434 | FJ1810 | right | componente encefálico | brainstem | nervous:cns | APROBADO |
| Colículo superior · izquierdo | FMA73423 | FJ1779 | left | componente encefálico | brainstem | nervous:cns | APROBADO |
| Colículo superior · derecho | FMA73422 | FJ1826 | right | componente encefálico | brainstem | nervous:cns | APROBADO |
| Bulbo raquídeo | FMA62004 | FJ1769 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Bulbo raquídeo | FMA62004 | FJ1831 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Mesencéfalo | FMA61993 | FJ1770 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Mesencéfalo | FMA61993 | FJ1817 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Puente | FMA67943 | FJ1775 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Puente | FMA67943 | FJ1822 | midline | componente encefálico | brainstem | nervous:cns | APROBADO |
| Cerebelo | FMA67944 | FJ1781 | midline | componente encefálico | brain | nervous:cns | APROBADO |
| Cerebelo | FMA67944 | FJ1830 | midline | componente encefálico | brain | nervous:cns | APROBADO |
| Giro fusiforme · izquierdo | FMA72690 | FJ1783 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro fusiforme · derecho | FMA72689 | FJ1784 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro parahipocampal · izquierdo | FMA72706 | FJ1785 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro parahipocampal · derecho | FMA72705 | FJ1786 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal medio · izquierdo | FMA72656 | FJ1787 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal medio · derecho | FMA72655 | FJ1788 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro temporal medio · izquierdo | FMA72686 | FJ1789 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro temporal medio · derecho | FMA72685 | FJ1790 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Lóbulo occipital · izquierdo | FMA72976 | FJ1791 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Lóbulo occipital · derecho | FMA72975 | FJ1792 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro poscentral · izquierdo | FMA72666 | FJ1797 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro poscentral · derecho | FMA72665 | FJ1798 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro precentral · izquierdo | FMA72662 | FJ1800 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro precentral · derecho | FMA72661 | FJ1801 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal superior · izquierdo | FMA72654 | FJ1833 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro frontal superior · derecho | FMA72653 | FJ1834 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Lobulillo parietal superior · izquierdo | FMA72672 | FJ1835 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Lobulillo parietal superior · derecho | FMA72671 | FJ1836 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro supramarginal · izquierdo | FMA72668 | FJ1841 | left | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Giro supramarginal · derecho | FMA72667 | FJ1842 | right | componente encefálico | cerebrum | nervous:cns | APROBADO |
| Nervio óptico derecho | FMA50875 | FJ1364 | right | nervio | optic | nervous:cns | APROBADO |
| Nervio óptico derecho | FMA50875 | FJ1819 | right | nervio | optic | nervous:cns | APROBADO |
| Nervio óptico izquierdo | FMA50878 | FJ1313 | left | nervio | optic | nervous:cns | APROBADO |
| Nervio óptico izquierdo | FMA50878 | FJ1772 | left | nervio | optic | nervous:cns | APROBADO |
| Nervio troclear derecho | FMA50881 | FJ1381 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio troclear izquierdo | FMA50882 | FJ1330 | left | nervio | cranial | nervous:cranial | APROBADO |
| Rama inferior del nervio oculomotor · izquierdo | FMA52577 | FJ1293 | left | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Rama inferior del nervio oculomotor · derecho | FMA52576 | FJ1344 | right | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Rama superior del nervio oculomotor · izquierdo | FMA52575 | FJ1321 | left | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Rama superior del nervio oculomotor · derecho | FMA52574 | FJ1372 | right | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Nervio oftálmico · izquierdo | FMA52623 | FJ1312 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio oftálmico · derecho | FMA52622 | FJ1363 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio frontal · izquierdo | FMA52640 | FJ1290 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio frontal · derecho | FMA52639 | FJ1341 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio lagrimal · izquierdo | FMA52630 | FJ1300 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio lagrimal · derecho | FMA52629 | FJ1351 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio nasociliar · izquierdo | FMA52670 | FJ1310 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio nasociliar · derecho | FMA52669 | FJ1361 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio supraorbitario · izquierdo | FMA52657 | FJ1325 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio supraorbitario · derecho | FMA52656 | FJ1376 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio supratroclear · izquierdo | FMA52644 | FJ1326 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio supratroclear · derecho | FMA52643 | FJ1377 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio etmoidal anterior · izquierdo | FMA52677 | FJ1283 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio etmoidal anterior · derecho | FMA52676 | FJ1333 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio etmoidal posterior · izquierdo | FMA52716 | FJ1315 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio etmoidal posterior · derecho | FMA52715 | FJ1366 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio infratroclear · izquierdo | FMA52699 | FJ1296 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio infratroclear · derecho | FMA52698 | FJ1347 | right | nervio | cranial | nervous:cranial | APROBADO |
| Nervio ciliar largo · izquierdo | FMA82735 | FJ1318 | left | nervio | cranial | nervous:cranial | APROBADO |
| Nervio ciliar largo · derecho | FMA82734 | FJ1369 | right | nervio | cranial | nervous:cranial | APROBADO |
| Rama comunicante nasociliar con el ganglio ciliar · izquierdo | FMA52674 | FJ1311 | left | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Rama comunicante nasociliar con el ganglio ciliar · derecho | FMA52673 | FJ1362 | right | rama nerviosa | cranial | nervous:cranial | APROBADO |
| Ganglio ciliar derecho | FMA53549 | FJ1339 | right | ganglio | cranial | nervous:cranial | APROBADO |
| Ganglio ciliar izquierdo | FMA53550 | FJ1288 | left | ganglio | cranial | nervous:cranial | APROBADO |
