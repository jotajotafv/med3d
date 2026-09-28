# Fase 5: auditoría cardiovascular

Selección acotada BP3D 4.0: **141 filas, 134 APROBADO, 1 DESCARTADO y 6 APLAZADO**. Las filas pendientes incluyen familias no identificadas y una fila de alcance para ramas secundarias/microvasculatura; no equivalen a un conteo exhaustivo de todos los vasos ausentes.

El [inventario reproducible](../research/anatomy/cardiovascular-selection.json) y la [tabla de revisión](phase5/audit-table.md) registran nombres español/latín, FMA/FJ, fuente, categoría, entidad, lado, padre editorial, módulo, cobertura, decisión y motivo. `audit-cardiovascular.py` usa únicamente metadatos cardiovasculares seleccionados y el directorio central fijado. No transforma relaciones IS-A en PART-OF.

| Cobertura aprobada | Alcance |
|---|---|
| Corazón | 18 conceptos fuente: paredes auriculares derecha/izquierda y pared ventricular conjunta; cuatro cavidades; once valvas. Cuatro grupos valvulares y un corazón corporal editorial. |
| Grandes vasos | Aorta por cuatro segmentos, tronco pulmonar, arterias pulmonares, cuatro venas pulmonares, cavas superior/inferior y braquiocefálicas. |
| Coronarias | Troncos coronarios derecho/izquierdo, tronco interventricular anterior y rama circunfleja, seno coronario y vena cardíaca magna. No se afirma árbol coronario completo. |
| Arterias cabeza/cuello | Carótidas comunes e internas y vertebrales bilaterales. |
| Arterias miembro superior | Subclavias, axilares, braquiales, braquiales profundas, radiales y cubitales bilaterales. |
| Arterias tronco/pelvis | Aorta torácica y abdominal, troncos braquiocefálico/celíaco, ramas digestivas principales seleccionadas, mesentéricas, renales e ilíacas. |
| Arterias miembro inferior | Ilíacas externas, femorales, poplíteas y tibiales anteriores/posteriores bilaterales. |
| Venas cabeza/cuello/brazos | Yugulares internas, subclavias, axilares, braquiales mediales, cefálicas, basílicas, radiales, cubitales y medianas del antebrazo. |
| Venas centrales/abdominales | Cavas, braquiocefálicas, ácigos/hemiácigos/accesoria, hepáticas, porta, esplénica, mesentéricas, renales e ilíacas. |
| Venas miembro inferior | Femoral, femoral profunda, poplítea, safenas magna/menor y tibiales principales bilaterales. |

Las 134 unidades fuente corresponden a **56 arteriales, 60 venosas y 18 cardíacas**, en 92 familias. El catálogo distingue **110 estructuras y 30 componentes**: 108 estructuras fuente más corazón y aorta editoriales; 26 componentes fuente más cuatro válvulas editoriales. No se cuentan cámaras/valvas como corazones completos. Una estructura puede poseer varios OBJ originales, sin fusionarlos ni duplicar propietarios.

## Exclusiones

- **DESCARTADO:** aorta descendente genérica FMA3784/FJ3427, representación alternativa solapada con segmentos torácico/abdominal. La [inspección selectiva](phase5/aorta-candidate-check.json) conserva cabecera, hash y bounds. No se afirma que sea una geometría idéntica: se excluye la doble representación anatómica.
- **APLAZADO:** carótidas externas, yugulares externas, troncos arteriales femorales profundos y arterias fibulares: sin identidad geométrica inequívoca en los conceptos seleccionados ISA. Las ramas agrupadas bajo femoral profunda en PART-OF no se promovieron al tronco principal.
- **APLAZADO:** septo interventricular separado; no se corta la pared ventricular.
- **APLAZADO:** ramas secundarias y microvasculatura fuera del alcance macroscópico.

Estas decisiones describen la selección, no prueban ausencia absoluta en toda versión de cada fuente. HRA se conserva independiente y Z-Anatomy queda como alternativa auditada a nivel de metadatos, sin mezclar frames para rellenar vacíos.

## Módulos

| Módulo | Mallas | Triángulos | Bytes GLB |
|---|---:|---:|---:|
| `cardio:head-neck` | 10 | 6.210 | 68.156 |
| `cardio:heart` | 29 | 116.702 | 1.047.128 |
| `cardio:lower-left` | 17 | 149.124 | 1.150.400 |
| `cardio:lower-right` | 14 | 148.524 | 1.140.020 |
| `cardio:trunk` | 64 | 93.700 | 927.548 |
| `cardio:upper-left` | 14 | 86.072 | 663.612 |
| `cardio:upper-right` | 14 | 84.684 | 652.416 |
| **Total** | **162** | **685.016** | **5.649.280** |

La distribución usa siete módulos regionales de tamaño acotado. Arterias y venas comparten la descarga regional y se ocultan con subcapas independientes; corazón/coronarias comparten un módulo. Esto evita un archivo por vaso y mantiene selección individual. La distinta cantidad de piezas izquierda/derecha conserva la partición original, sin fabricar simetría.

El catálogo corporal final contiene **805 nodos, 521 estructuras, 674 mallas y 38 módulos**. Los nodos restantes son componentes o jerarquía; no se equiparan a estructuras completas. Los tres catálogos históricos y sus assets se conservan sin cambios.
