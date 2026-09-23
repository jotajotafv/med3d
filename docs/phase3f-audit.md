# Fase 3F · Auditoría residual de cobertura muscular

Base: `0841ad7942755905886d86e799c2e510473d6649`. Rama local: `phase3f-muscle-gaps`. Sólo cara/masticación, intrínsecos de mano y pie. Historial: [3DE](phase3de-delivery.md); no se repite la auditoría de torso, brazos, muslos, piernas o cuello.

## Método y unidad de conteo

Se reutilizan las seis tablas y el directorio ZIP conservados en `research/anatomy/torso-metadata.zip`. Se consultan conceptos nominales y terminales regionales de ISA y la tabla PART-OF. El script `scripts/anatomy/audit-muscle-gaps.py` reproduce la selección sin extraer OBJ. La ascendencia ISA se conserva como tipo, nunca se convierte automáticamente en relación de pertenencia.

97 filas de auditoría: 74 conceptos terminales con geometría referenciada y 23 objetivos sin identificación nominal. Los objetivos ausentes cuentan como APLAZADOS, no como geometría encontrada. Las categorías no terminales se usan para localizar candidatos, no se vuelven a contar como músculos.

| Región | Filas | Conceptos encontrados | Objetivos sin ID | Aprobados | Descartados | Aplazados |
|---|---:|---:|---:|---:|---:|---:|
| Cara/masticación | 34 | 14 | 20 | 0 | 14 | 20 |
| Mano | 25 | 24 | 1 | 14 | 0 | 11 |
| Pie | 38 | 36 | 2 | 34 | 0 | 4 |
| Total | 97 | 74 | 23 | 48 | 14 | 35 |

Los 48 elementos aprobados representan 42 músculos por lado identificado: 12 de mano y 30 de pie, en 21 familias. Doce mallas son cabezas de seis músculos; no se suman como músculos independientes. La aprobación para extracción quedó condicionada a comprobar las cabeceras y la geometría; ambas comprobaciones se completaron antes de la entrega.

## Decisiones

- **A**: nombre/FMA/FJ/lado inequívocos, sin duplicación; cabeceras y geometría verificadas.
- **O**: músculo orbital; fuera de masticación/expresión facial pedidas. No se reutiliza su posición para inventar una etiqueta facial.
- **F**: flexor corto del pulgar: FJ de músculo y de cabeza superficial coexistentes, sin alcance PART-OF resuelto; no se presume que el músculo sea la cabeza profunda.
- **G**: conjunto agregado de mano sin identidades individuales; requiere curación de cobertura grupal. No equivale a ausencia de geometría ni a un solo músculo.
- **V**: oponente del quinto dedo del pie: presente nominalmente, fuera de prioridades; queda pendiente revisar su independencia respecto al flexor corto.
- **N**: objetivo sin identificación nominal en ambas tablas consultadas; no se asigna un FMA/FJ inventado.

No se extrajeron ni procesaron OBJ descartados o aplazados. Los tendones largos de músculos extrínsecos de antebrazo/pierna y las fascias/aponeurosis no se reclasifican como intrínsecos. Ejemplos excluidos del ámbito: extensor largo del hallux FMA22546/22547 y extensor corto del pulgar FMA38519/38520. No se contabilizan como nuevos candidatos intrínsecos.

## Tabla por candidato

D/I = lado derecho/izquierdo leído del nombre fuente. Se conserva FJ original incluso cuando el sufijo no sigue un patrón lateral. En los aprobados, los padres de cabezas se crean como nodos editoriales explícitos, sin FMA de músculo inventado.

| Región | Nombre | FMA | FJ | Lado | Tipo | Padre muscular posible | BP3D | Decisión | Motivo |
|---|---|---|---|---|---|---|---|---|---|
| Mano | right abductor pollicis brevis | FMA37386 | FJ1483 | D | músculo | — | BP4855 | APROBADO | A |
| Mano | left abductor pollicis brevis | FMA37387 | FJ1483M | I | músculo | — | BP8706 | APROBADO | A |
| Mano | right opponens pollicis | FMA37390 | FJ1501 | D | músculo | — | BP4853 | APROBADO | A |
| Mano | left opponens pollicis | FMA37391 | FJ1501M | I | músculo | — | BP8596 | APROBADO | A |
| Mano | abductor digiti minimi of right hand | FMA37396 | FJ1466 | D | músculo | — | BP7569 | APROBADO | A |
| Mano | abductor digiti minimi of left hand | FMA37397 | FJ1466M | I | músculo | — | BP8737 | APROBADO | A |
| Mano | flexor digiti minimi brevis of right hand | FMA37398 | FJ1470 | D | músculo | — | BP4858 | APROBADO | A |
| Mano | flexor digiti minimi brevis of left hand | FMA37399 | FJ1470M | I | músculo | — | BP8516 | APROBADO | A |
| Mano | opponens digiti minimi of right hand | FMA37400 | FJ1482 | D | músculo | — | BP4860 | APROBADO | A |
| Mano | opponens digiti minimi of left hand | FMA37401 | FJ1482M | I | músculo | — | BP8204 | APROBADO | A |
| Mano | oblique head of right adductor pollicis | FMA46121 | FJ1481 | D | cabeza | Aductor del pulgar D | BP5560 | APROBADO | A |
| Mano | oblique head of left adductor pollicis | FMA46122 | FJ1481M | I | cabeza | Aductor del pulgar I | BP8248 | APROBADO | A |
| Mano | transverse head of right adductor pollicis | FMA46123 | FJ1515 | D | cabeza | Aductor del pulgar D | BP5543 | APROBADO | A |
| Mano | transverse head of left adductor pollicis | FMA46124 | FJ1515M | I | cabeza | Aductor del pulgar I | BP8885 | APROBADO | A |
| Pie | right abductor hallucis | FMA37459 | FJ1400 | D | músculo | — | BP5054 | APROBADO | A |
| Pie | left abductor hallucis | FMA37460 | FJ1400M | I | músculo | — | BP9193 | APROBADO | A |
| Pie | right flexor digitorum brevis | FMA37461 | FJ1413 | D | músculo | — | BP5048 | APROBADO | A |
| Pie | left flexor digitorum brevis | FMA37462 | FJ1413M | I | músculo | — | BP9215 | APROBADO | A |
| Pie | abductor digiti minimi of right foot | FMA37463 | FJ1390 | D | músculo | — | BP5056 | APROBADO | A |
| Pie | abductor digiti minimi of left foot | FMA37464 | FJ1390M | I | músculo | — | BP9182 | APROBADO | A |
| Pie | right flexor accessorius | FMA37465 | FJ1412 | D | músculo | — | BP5052 | APROBADO | A |
| Pie | left flexor accessorius | FMA37466 | FJ1412M | I | músculo | — | BP8992 | APROBADO | A |
| Pie | flexor digiti minimi brevis of right foot | FMA37471 | FJ1391 | D | músculo | — | BP5050 | APROBADO | A |
| Pie | flexor digiti minimi brevis of left foot | FMA37472 | FJ1391M | I | músculo | — | BP8065 | APROBADO | A |
| Pie | right extensor hallucis brevis | FMA51144 | FJ1407 | D | músculo | — | BP5059 | APROBADO | A |
| Pie | left extensor hallucis brevis | FMA51145 | FJ1407M | I | músculo | — | BP8118 | APROBADO | A |
| Pie | first lumbrical of right foot | FMA37717 | FJ1383 | D | músculo | — | BP5044 | APROBADO | A |
| Pie | first lumbrical of left foot | FMA37718 | FJ1383M | I | músculo | — | BP9161 | APROBADO | A |
| Pie | second lumbrical of right foot | FMA37719 | FJ1385 | D | músculo | — | BP5040 | APROBADO | A |
| Pie | second lumbrical of left foot | FMA37720 | FJ1385M | I | músculo | — | BP8179 | APROBADO | A |
| Pie | third lumbrical of right foot | FMA37485 | FJ1387 | D | músculo | — | BP5038 | APROBADO | A |
| Pie | third lumbrical of left foot | FMA37486 | FJ1387M | I | músculo | — | BP8902 | APROBADO | A |
| Pie | fourth lumbrical of right foot | FMA37483 | FJ1389 | D | músculo | — | BP5042 | APROBADO | A |
| Pie | fourth lumbrical of left foot | FMA37484 | FJ1389M | I | músculo | — | BP8943 | APROBADO | A |
| Pie | first plantar interosseous of right foot | FMA37745 | FJ1384 | D | músculo | — | BP5035 | APROBADO | A |
| Pie | first plantar interosseous of left foot | FMA37746 | FJ1384M | I | músculo | — | BP9251 | APROBADO | A |
| Pie | second plantar interosseous of right foot | FMA37743 | FJ1386 | D | músculo | — | BP5033 | APROBADO | A |
| Pie | second plantar interosseous of left foot | FMA37744 | FJ1386M | I | músculo | — | BP8916 | APROBADO | A |
| Pie | third plantar interosseous of right foot | FMA37741 | FJ1388 | D | músculo | — | BP5031 | APROBADO | A |
| Pie | third plantar interosseous of left foot | FMA37742 | FJ1388M | I | músculo | — | BP9175 | APROBADO | A |
| Pie | medial head of right flexor hallucis brevis | FMA45971 | FJ1396 | D | cabeza | Flexor corto del dedo gordo D | BP5546 | APROBADO | A |
| Pie | medial head of left flexor hallucis brevis | FMA45972 | FJ1396M | I | cabeza | Flexor corto del dedo gordo I | BP8945 | APROBADO | A |
| Pie | lateral head of right flexor hallucis brevis | FMA45973 | FJ1393 | D | cabeza | Flexor corto del dedo gordo D | BP5548 | APROBADO | A |
| Pie | lateral head of left flexor hallucis brevis | FMA45974 | FJ1393M | I | cabeza | Flexor corto del dedo gordo I | BP8361 | APROBADO | A |
| Pie | oblique head of right adductor hallucis | FMA46018 | FJ1398 | D | cabeza | Aductor del dedo gordo D | BP5578 | APROBADO | A |
| Pie | oblique head of left adductor hallucis | FMA46019 | FJ1398M | I | cabeza | Aductor del dedo gordo I | BP8542 | APROBADO | A |
| Pie | transverse head of right adductor hallucis | FMA46020 | FJ1445 | D | cabeza | Aductor del dedo gordo D | BP5580 | APROBADO | A |
| Pie | transverse head of left adductor hallucis | FMA46021 | FJ1445M | I | cabeza | Aductor del dedo gordo I | BP8394 | APROBADO | A |
| Cara | right superior rectus | FMA49044 | FJ1374 | D | músculo | — | BP4929 | DESCARTADO | O |
| Cara | left superior rectus | FMA49045 | FJ1323 | I | músculo | — | BP4930 | DESCARTADO | O |
| Cara | right inferior rectus | FMA49046 | FJ1346 | D | músculo | — | BP4944 | DESCARTADO | O |
| Cara | left inferior rectus | FMA49047 | FJ1295 | I | músculo | — | BP4945 | DESCARTADO | O |
| Cara | right levator palpebrae superioris | FMA49048 | FJ1357 | D | músculo | — | BP4938 | DESCARTADO | O |
| Cara | left levator palpebrae superioris | FMA49049 | FJ1306 | I | músculo | — | BP4939 | DESCARTADO | O |
| Cara | right inferior oblique | FMA49050 | FJ1345 | D | músculo | — | BP4947 | DESCARTADO | O |
| Cara | left inferior oblique | FMA49051 | FJ1294 | I | músculo | — | BP4948 | DESCARTADO | O |
| Cara | right superior oblique | FMA49052 | FJ1373 | D | músculo | — | BP4932 | DESCARTADO | O |
| Cara | left superior oblique | FMA49053 | FJ1322 | I | músculo | — | BP4933 | DESCARTADO | O |
| Cara | right lateral rectus | FMA49054 | FJ1355 | D | músculo | — | BP4941 | DESCARTADO | O |
| Cara | left lateral rectus | FMA49055 | FJ1304 | I | músculo | — | BP4942 | DESCARTADO | O |
| Cara | right medial rectus | FMA49056 | FJ1359 | D | músculo | — | BP4936 | DESCARTADO | O |
| Cara | left medial rectus | FMA49057 | FJ1308 | I | músculo | — | BP4935 | DESCARTADO | O |
| Mano | right flexor pollicis brevis | FMA37388 | FJ1469M | D | músculo | Flexor corto del pulgar; relación de alcance pendiente | BP8958 | APLAZADO | F |
| Mano | left flexor pollicis brevis | FMA37389 | FJ1469 | I | músculo | Flexor corto del pulgar; relación de alcance pendiente | BP7575 | APLAZADO | F |
| Mano | superficial head of right flexor pollicis brevis | FMA65198 | FJ1514 | D | cabeza | Flexor corto del pulgar; relación de alcance pendiente | BP5556 | APLAZADO | F |
| Mano | superficial head of left flexor pollicis brevis | FMA65199 | FJ1514M | I | cabeza | Flexor corto del pulgar; relación de alcance pendiente | BP8722 | APLAZADO | F |
| Mano | set of lumbricals of right hand | FMA42398 | FJ1510 | D | grupo | — | BP6633 | APLAZADO | G |
| Mano | set of lumbricals of left hand | FMA42399 | FJ1510M | I | grupo | — | BP8053 | APLAZADO | G |
| Mano | set of palmar interossei of right hand | FMA42402 | FJ1511 | D | grupo | — | BP6631 | APLAZADO | G |
| Mano | set of palmar interossei of left hand | FMA42403 | FJ1511M | I | grupo | — | BP8246 | APLAZADO | G |
| Mano | set of dorsal interossei of right hand | FMA42404 | FJ1509 | D | grupo | — | BP6629 | APLAZADO | G |
| Mano | set of dorsal interossei of left hand | FMA42405 | FJ1509M | I | grupo | — | BP8036 | APLAZADO | G |
| Pie | opponens digiti minimi of right foot | FMA86034 | FJ1399 | D | músculo | — | BP5046 | APLAZADO | V |
| Pie | opponens digiti minimi of left foot | FMA86035 | FJ1399M | I | músculo | — | BP9018 | APLAZADO | V |
| Cara | Masetero | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Temporal | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Pterigoideo medial | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Pterigoideo lateral | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Orbicular del ojo | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Orbicular de la boca | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Buccinador | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Cigomático mayor | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Cigomático menor | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Frontal | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Occipital | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Elevador del labio superior | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Elevador del ángulo de la boca | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Depresor del ángulo de la boca | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Depresor del labio inferior | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Mentoniano | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Risorio | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Nasal | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Corrugador superciliar | — | — | — | sin ID | — | — | APLAZADO | N |
| Cara | Prócer | — | — | — | sin ID | — | — | APLAZADO | N |
| Mano | Palmar corto | — | — | — | sin ID | — | — | APLAZADO | N |
| Pie | Extensor corto de los dedos | — | — | — | sin ID | — | — | APLAZADO | N |
| Pie | Interóseos dorsales del pie | — | — | — | sin ID | — | — | APLAZADO | N |

## Lectura regional y límites

**Cara:** el padre fuente `FMA46751` («muscle of face») reúne 14 músculos orbitales laterales; sus hijos no identifican los 20 objetivos faciales/masticatorios de esta auditoría. «Temporal» se buscó también como `temporal muscle`; «mentalis» con límite de palabra, excluyendo la falsa coincidencia «taenia omentalis». No se crea `muscular:head`, ni se generan imágenes de músculos faciales inexistentes en la selección. El platisma ya integrado conserva su identidad cervical.

**Mano:** se añaden abductor corto y oponente del pulgar, aductor del pulgar (dos cabezas), abductor, flexor corto y oponente del meñique. Los conjuntos de lumbricales e interóseos sí tienen FJ agregados; no se afirma que BP3D carezca de ellos. FPB sigue pendiente junto a palmar corto.

**Pie:** se añaden abductor del hallux, flexor corto de los dedos, abductor y flexor corto del quinto dedo, cuadrado plantar (alias fuente «flexor accessorius»), extensor corto del hallux, cuatro lumbricales, tres interóseos plantares, flexor corto del hallux y aductor del hallux (ambos con dos cabezas). EDB e interóseos dorsales no aparecen con identificación nominal propia en estas tablas; oponente del quinto dedo se aplaza.

## Registro geométrico

Fuente única: BodyParts3D 4.0 OBJ99 / DBCLS. Marco `bodyparts3d-4.0-male`; transformación exacta `(x,y,z) → (x,z,-y)/1000`. Cada lado procede de su OBJ publicado, incluso si la fuente es simétrica; MED3D no refleja el lado contrario. No hay ajuste, recentrado, escala individual, deformación ni simplificación.

Los originales están en `research/anatomy/muscular-muscle-gaps-originals.zip`; el lock y `public/models/anatomy/muscular/muscle-gaps-source-manifest.json` conservan hashes, tamaños, FMA/FJ/BP, lateralidad, vértices, triángulos y bounds antes/después de la transformación. Se descargaron rangos exactos, no el ZIP corporal completo.

Float32 + Meshopt; normales de visualización a 12 bits. Todos los triángulos orientados y su multiplicidad se compararon con OBJ originales, conservando cada posición usada. Error máximo de posición: `3.356697191289336e-8 m`, por debajo de `0.00005 m`; tolerancia numérica, no precisión anatómica o clínica. Los pies del marco fuente tienen Y negativa: se conserva, contrastada con calcáneo y metatarsianos, sin corregir su colocación.

Limitación observada en revisión: la cabeza transversa del aductor del hallux queda separada de la falange de contexto. La asociación es semántica; no demuestra continuidad tendinosa o inserción geométrica. No se ajustó su posición para aparentarla.

## Educación y contexto

21 familias nuevas y 12 fichas de cabeza específicas; las 55 familias anteriores se conservan. Las fuentes están enlazadas en cada ficha: [UW](https://rad.uw.edu/muscle-atlas/abductor-pollicis-brevis), [TTUHSC](https://anatomy.ttuhscep.edu/anatomytables/muscles_alpha.html), [tabla de pie](https://anatomy.ttuhscep.edu/schemes/leg_tables.html) y [NCBI](https://www.ncbi.nlm.nih.gov/sites/books/NBK539705/). Textos breves originales; no se redistribuyen ilustraciones.

Los IDs óseos se curaron en el catálogo existente. Lumbricales: fijaciones tendinosas, sin sustitutos óseos. Cuadrado plantar: sólo calcáneo en contexto; la inserción sigue siendo tendón. Cabeza transversa del aductor del hallux: fijación capsuloligamentosa en texto, sin inventar un metatarsiano de origen. Sesamoideos mencionados en texto, sin crear geometría nueva.

## Posibles fuentes para una decisión futura

- [Z-Anatomy, proyecto respaldado por SPI](https://www.spi-inc.org/projects/z-anatomy/): candidato a investigar por región y procedencia; no se presupone que complete los vacíos ni que sus modificaciones compartan exactamente este marco.
- [SPL Head and Neck Atlas / Open Anatomy](https://www.openanatomy.org/atlas-pages/atlas-spl-head-and-neck.html): atlas basado en CT MANIX con modelos etiquetados de cabeza/cuello. Requeriría comprobar la lista muscular, lateralidad, licencia aplicable y registro; no es prueba de cobertura facial completa.

No se descargó ni integró geometría de esas fuentes. Cualquier futura combinación requiere una decisión aparte.
