# Fase 3B — auditoría previa y decisión de inventario

Base: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. Revisión de metadatos: 21 de septiembre de 2026.

**Decisión: 13 familias bilaterales, 26 músculos y 34 elementos originales.** Esta selección se fija antes de extraer o convertir OBJ. Se amplía el torso anterior, el oblicuo externo y la espalda con transición escapular; no se afirma cobertura completa del torso.

Se volvieron a leer las seis tablas oficiales de BP3D 4.0. Las cinco ya auditadas en Fase 3A conservan sus SHA-256; se añade la tabla real PART-OF de relaciones. El directorio ZIP de 170.025 bytes coincide con el hash fijado y contiene los 34 seleccionados. Esta auditoría no extrae geometría ni procesa descartados.

La [selección estructurada](../research/anatomy/torso-selection.json) conserva cada FMA/FJ, representación BP, clasificación IS-A, ascendencia, lateralidad explícita, padre editorial, módulo, tamaños y CRC declarados. Los [metadatos originales](../research/anatomy/torso-metadata.zip) permiten reproducir la decisión sin red:

```sh
python scripts/anatomy/audit-torso-inventory.py
```

`--fetch` verifica y vuelve a obtener sólo las seis tablas y el directorio mediante Range exacto; nunca descarga OBJ ni el ZIP completo.

## Conjunto aprobado

| Nombre | FMA | FJ | Lado | Tipo fuente | Padre propuesto | Región | Módulo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Pectoral mayor, porción clavicular | FMA34690 | FJ1447 | right | head of muscle organ | `med3d:muscle:pectoralismajor:right` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral mayor, porción clavicular | FMA34691 | FJ1447M | left | head of muscle organ | `med3d:muscle:pectoralismajor:left` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral mayor, porción esternocostal | FMA79979 | FJ1464 | right | zone of muscle organ | `med3d:muscle:pectoralismajor:right` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral mayor, porción esternocostal | FMA79980 | FJ1464M | left | zone of muscle organ | `med3d:muscle:pectoralismajor:left` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral mayor, porción abdominal | FMA45874 | FJ1446 | right | zone of muscle organ | `med3d:muscle:pectoralismajor:right` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral mayor, porción abdominal | FMA45875 | FJ1446M | left | zone of muscle organ | `med3d:muscle:pectoralismajor:left` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral menor | FMA13375 | FJ1456 | right | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Pectoral menor | FMA13376 | FJ1456M | left | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Serrato anterior | FMA13398 | FJ1459 | right | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Serrato anterior | FMA13399 | FJ1459M | left | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Subclavio | FMA13412 | FJ1460 | right | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Subclavio | FMA13411 | FJ1460M | left | muscle organ | `muscular:region:thorax-anterior` | Tórax anterior | `muscular:thorax-anterior` |
| Oblicuo externo | FMA13336 | FJ1452 | right | muscle organ | `muscular:region:abdomen` | Abdomen | `muscular:abdomen` |
| Oblicuo externo | FMA13337 | FJ1452M | left | muscle organ | `muscular:region:abdomen` | Abdomen | `muscular:abdomen` |
| Trapecio, porción ascendente | FMA33581 | FJ1520 | right | organ zone | `med3d:muscle:trapezius:right` | Espalda | `muscular:back` |
| Trapecio, porción ascendente | FMA33583 | FJ1520M | left | organ zone | `med3d:muscle:trapezius:left` | Espalda | `muscular:back` |
| Trapecio, porción transversa | FMA33584 | FJ1554 | right | zone of muscle organ | `med3d:muscle:trapezius:right` | Espalda | `muscular:back` |
| Trapecio, porción transversa | FMA33585 | FJ1554M | left | zone of muscle organ | `med3d:muscle:trapezius:left` | Espalda | `muscular:back` |
| Trapecio, porción descendente | FMA33586 | FJ1521 | right | organ zone | `med3d:muscle:trapezius:right` | Espalda | `muscular:back` |
| Trapecio, porción descendente | FMA33587 | FJ1521M | left | organ zone | `med3d:muscle:trapezius:left` | Espalda | `muscular:back` |
| Romboides mayor | FMA13381 | FJ1536 | right | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |
| Romboides mayor | FMA13382 | FJ1536M | left | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |
| Romboides menor | FMA13383 | FJ1537 | right | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |
| Romboides menor | FMA13384 | FJ1537M | left | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |
| Iliocostal lumbar | FMA22740 | FJ1527 | right | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Iliocostal lumbar | FMA22741 | FJ1527M | left | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Iliocostal torácico | FMA22742 | FJ1528 | right | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Iliocostal torácico | FMA22743 | FJ1528M | left | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Longísimo torácico | FMA22751 | FJ1535 | right | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Longísimo torácico | FMA22753 | FJ1535M | left | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Espinoso torácico | FMA22779 | FJ1544 | right | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Espinoso torácico | FMA22780 | FJ1544M | left | muscle organ | `muscular:group:back:erectors` | Espalda | `muscular:back` |
| Redondo mayor | FMA32551 | FJ1507 | right | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |
| Redondo mayor | FMA32552 | FJ1507M | left | muscle organ | `muscular:group:back:scapular` | Espalda | `muscular:back` |

## Tamaños declarados y módulos previstos

| Módulo | Músculos | Mallas | Bytes OBJ declarados | Bytes comprimidos upstream |
| --- | ---: | ---: | ---: | ---: |
| `muscular-torso-anterior.glb` | 8 | 12 | 10437232 | 3035200 |
| `muscular-abdomen.glb` | 2 | 2 | 16558975 | 4753478 |
| `muscular-torso-posterior.glb` | 16 | 20 | 12403916 | 3860467 |

Estos tamaños proceden del directorio, no son métricas de GLB ni memoria GPU. El oblicuo externo es la pareja más pesada y justifica un módulo abdominal liberable independiente; se conservará la geometría y se medirá el resultado.

## Identidad, agrupación y límites

Los padres editoriales de pectoral mayor y trapecio reúnen sus porciones publicadas, sin contar cada porción como un músculo. El pectoral clavicular está clasificado como `head of muscle organ`, aunque su nombre fuente dice `part`; se conservan ambos datos. PART-OF reconoce pectoral mayor derecho/izquierdo (FMA13373/FMA13374), pero omite la porción clavicular. No se presenta ese export incompleto como prueba de ausencia de la porción.

Las porciones ascendente y descendente del trapecio pertenecen directamente a `organ zone`, fuera de las tres ramas que produjeron los 403 candidatos de Fase 3A. Por eso esta auditoría recorre el inventario nominal completo. No se cambia la documentación histórica de aquella consulta ni se toma su unión como inventario muscular exhaustivo.

Las subdivisiones iliocostal lumbar/torácica, longísimo torácico y espinoso torácico sustentan un grupo editorial parcial de erectores espinales. Los romboides y el redondo mayor permiten estudiar la transición escapular sin duplicar el manguito rotador de Fase 3A. «Espalda» es una región de navegación; el redondo mayor no se clasifica como músculo intrínseco espinal. Estas agrupaciones se apoyan en [OpenStax sobre pared abdominal/tórax](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-4-axial-muscles-of-the-abdominal-wall-and-thorax) y [cintura escapular/miembro superior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs), además de la identidad explícita de las porciones.

## Candidatos encontrados y descartados

Se revisaron 84 FJ únicos dentro de la búsqueda declarada: 34 aprobados y 50 descartados en 41 filas conceptuales. Los conceptos antecesores agregados no se vuelven a contar. No es un censo de toda la musculatura humana.

| Concepto fuente | FMA | FJ | Motivo de descarte |
| --- | --- | --- | --- |
| diaphragm | FMA13295 | FJ3131 | Presente e identificable; aplazado por alcance: esta entrega se limita a paredes del torso y transición escapular. |
| external intercostal muscle | FMA9756 | FJ1451, FJ1451M | Un FMA por clase y dos FJ; no identifica espacios costales ni lateralidad por concepto. No se presentará cada FJ como un músculo intercostal individual. |
| innermost intercostal muscle | FMA9758 | FJ1454, FJ1454M | Un FMA por clase y dos FJ; no identifica espacios costales ni lateralidad por concepto. No se presentará cada FJ como un músculo intercostal individual. |
| internal intercostal muscle | FMA9757 | FJ1455, FJ1455M | Un FMA por clase y dos FJ; no identifica espacios costales ni lateralidad por concepto. No se presentará cada FJ como un músculo intercostal individual. |
| lateral lumbar intertransversarius | FMA22850 | FJ1547, FJ1547M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| left cervical rotator | FMA81753 | FJ1524M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left iliocostalis cervicis | FMA22745 | FJ1526M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left interspinalis thoracis | FMA22891 | FJ1551M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| left levator scapulae | FMA32541 | FJ1532M | Identificable, aplazado para contener la extensión cervical; la transición escapular usa romboides y redondo mayor. |
| left longissimus capitis | FMA22756 | FJ1533M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left longissimus cervicis | FMA22758 | FJ1534M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left lumbar rotator | FMA23090 | FJ1522M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| left semispinalis capitis | FMA22877 | FJ1538M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left semispinalis cervicis | FMA22875 | FJ1539M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| left semispinalis thoracis | FMA22873 | FJ1540M | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| left serratus posterior inferior | FMA13406 | FJ1541M | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| left serratus posterior superior | FMA13404 | FJ1542M | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| left transversus thoracis | FMA9762 | FJ1461M | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| linea alba | FMA11336 | FJ1448 | Estructura aponeurótica clasificada como unión anatómica, no un músculo; no se añade como unidad muscular. |
| medial lumbar intertransversarius | FMA22851 | FJ1548, FJ1548M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| right cervical rotator | FMA81752 | FJ1524 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right iliocostalis cervicis | FMA22744 | FJ1526 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right interspinalis thoracis | FMA22890 | FJ1551 | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| right levator scapulae | FMA32540 | FJ1532 | Identificable, aplazado para contener la extensión cervical; la transición escapular usa romboides y redondo mayor. |
| right longissimus capitis | FMA22754 | FJ1533 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right longissimus cervicis | FMA22757 | FJ1534 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right lumbar rotator | FMA23089 | FJ1522 | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| right semispinalis capitis | FMA22876 | FJ1538 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right semispinalis cervicis | FMA22874 | FJ1539 | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| right semispinalis thoracis | FMA22872 | FJ1540 | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| right serratus posterior inferior | FMA13405 | FJ1541 | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| right serratus posterior superior | FMA13403 | FJ1542 | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| right transversus thoracis | FMA9761 | FJ1461 | Identificable, aplazado para mantener un conjunto acotado; la espalda profunda ya incluye cuatro subdivisiones verificadas de erectores. |
| set of anterior cervical intertransversarii | FMA71442 | FJ1549, FJ1549M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| set of left levatores costarum breves | FMA74078 | FJ1462M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| set of left levatores costarum longi | FMA74076 | FJ1463M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| set of posterior cervical intertransversarii | FMA71443 | FJ1553, FJ1553M | Cuello/cabeza fuera del alcance de Fase 3B; se conservan sólo las subdivisiones torácicas/lumbares aprobadas. |
| set of right levatores costarum breves | FMA74077 | FJ1462 | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| set of right levatores costarum longi | FMA74075 | FJ1463 | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |
| spinalis — elements without narrower represented concept | FMA77179 | FJ1543, FJ1543M | FJ1543/FJ1543M no tienen una subdivisión nominal más específica representada; no se adivina región, lateralidad o identidad por el número de archivo. |
| thoracic rotator | FMA23083 | FJ1525, FJ1525M | Conjunto/representación segmentaria sin desglose vertebral o costal completo verificable; requiere una curación específica posterior. |

## Ausencias comprobadas en este export

No se identificaron conceptos/bindings de recto abdominal, oblicuo interno, transverso abdominal, dorsal ancho, cuadrado lumbar, piramidal o multífido en las tablas inglesas IS-A/PART-OF inspeccionadas. Se buscaron también los fragmentos `abdom`, `obliq`, `transvers`, `latiss`, `rectus`, `quadratus`, `pyramid` y `multif`, conservando los resultados en JSON. Esto limita la cobertura de abdomen a oblicuo externo; no se completan los huecos con otra fuente ni con geometría fabricada.

La ausencia se refiere a este export 4.0 y sus tablas, no a toda versión de BP3D. Los FJ vecinos 1453M/1457M/1458M corresponden al elevador del ano; no son músculos abdominales mal nombrados. No se importan por proximidad numérica de sus archivos.

La siguiente etapa comprobará las cabeceras originales y hashes, vértices/caras/triángulos, bounds, transformación compartida y GLB decodificado. Esta decisión por metadatos no valida registro anatómico, contacto con huesos ni precisión clínica.
