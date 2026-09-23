# Fase 3DE — auditoría regional previa

Base: `5ba794438287a16b6482c6a63d3d2b6ca8ee6542`. Fuente: BP3D 4.0 OBJ99 / DBCLS. Metadatos preservados de 3B, sin extraer OBJ durante esta decisión.

Selección: **10 familias bilaterales, 20 músculos y 20 mallas en un módulo cervical**. Se conserva el cuello superficial, lateral, prevertebral, posterior y los grupos supra/infrahioideos con cobertura verificada.

Conceptos candidatos: 60; aprobados 20; descartados 7; aplazados 33. Además, 14 familias solicitadas sin identificación nominal se registran aparte, sin inventar FMA/FJ.

Las tablas de esta versión no identifican masetero, temporal, pterigoideos ni los músculos faciales consultados. No se crea una región Cabeza vacía ni se usa otra fuente para rellenarla. La expresión facial del platisma se estudia desde su región cervical.

[Selección y criterios reproducibles](../research/anatomy/head-neck-selection.json). `python scripts/anatomy/audit-head-neck-inventory.py` reproduce esta decisión sin red ni OBJ. [Antecedentes 3C](phase3c-delivery.md).

| Nombre | FMA | FJ | Lado | Tipo | Músculo padre | Región | Módulo | Decisión | Motivo |
|---|---|---|---|---|---|---|---|---|---|
| Esternocleidomastoideo | FMA13408 | FJ1595 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Esternocleidomastoideo | FMA13409 | FJ1573 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Platisma | FMA45739 | FJ1587 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Platisma | FMA45740 | FJ1558 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno anterior | FMA13392 | FJ1592 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno anterior | FMA13393 | FJ1570 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno medio | FMA13390 | FJ1593 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno medio | FMA13391 | FJ1571 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno posterior | FMA13388 | FJ1594 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Escaleno posterior | FMA13389 | FJ1572 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Largo de la cabeza | FMA46309 | FJ1582 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Largo de la cabeza | FMA46310 | FJ1561 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Esplenio de la cabeza | FMA22728 | FJ1545 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Esplenio de la cabeza | FMA22729 | FJ1545M | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Esternohioideo | FMA13346 | FJ1596 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Esternohioideo | FMA13347 | FJ1574 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Milohioideo | FMA46321 | FJ1583 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Milohioideo | FMA46322 | FJ1562 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Genihioideo | FMA46326 | FJ1580 | right | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| Genihioideo | FMA46327 | FJ1559 | left | muscle organ | No aplica: músculo | neck | muscular:neck | APROBADO | Músculo con identidad y lateralidad explícitas, un FJ propio por lado y sin duplicación histórica. |
| inferior oblique part of left longus colli | FMA46288 | FJ1557 | left | zone of muscle organ | Por curar | neck | No asignado | APLAZADO | Zonas de un músculo, con desglose terminal lateral asimétrico en esta tabla; requiere curación adicional, sin reflejar ni inventar el lado faltante. |
| left digastric | FMA46293 | FJ1555, FJ1560, FJ1578 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Varios FJ por músculo; desglose de vientres/componentes pendiente. No se transforma cada FJ en un músculo. |
| left lateral thyrohyoid ligament | FMA55141 | FJ2779 | left | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| left levator scapulae | FMA32541 | FJ1532M | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left obliquus capitis inferior | FMA32537 | FJ1563 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left obliquus capitis superior | FMA32535 | FJ1564 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left omohyoid | FMA13349 | FJ1565 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left rectus capitis anterior | FMA46314 | FJ1566 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left rectus capitis lateralis | FMA46318 | FJ1569 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left rectus capitis posterior major | FMA32531 | FJ1567 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left rectus capitis posterior minor | FMA32533 | FJ1568 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left semispinalis capitis | FMA22877 | FJ1538M | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left semispinalis cervicis | FMA22875 | FJ1539M | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left splenius cervicis | FMA22727 | FJ1546M | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left sternothyroid | FMA13351 | FJ1575 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left stylohyoid | FMA45827 | FJ1576 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left stylohyoid ligament | FMA72311 | FJ2763 | left | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| left thyrohyoid | FMA13353 | FJ1577 | left | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| left thyrohyoid membrane | FMA55134 | FJ2786 | left | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| median thyrohyoid ligament | FMA55138 | FJ2790 | unspecified | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| right digastric | FMA46292 | FJ1556, FJ1579 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Varios FJ por músculo; desglose de vientres/componentes pendiente. No se transforma cada FJ en un músculo. |
| right lateral thyrohyoid ligament | FMA55140 | FJ2797 | right | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| right levator scapulae | FMA32540 | FJ1532 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right obliquus capitis inferior | FMA32536 | FJ1584 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right obliquus capitis superior | FMA32534 | FJ1585 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right omohyoid | FMA13348 | FJ1586 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right rectus capitis anterior | FMA46313 | FJ1588 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right rectus capitis lateralis | FMA46317 | FJ1591 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right rectus capitis posterior major | FMA32530 | FJ1589 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right rectus capitis posterior minor | FMA32532 | FJ1590 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right semispinalis capitis | FMA22876 | FJ1538 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right semispinalis cervicis | FMA22874 | FJ1539 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right splenius cervicis | FMA22726 | FJ1546 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right sternothyroid | FMA13350 | FJ1597 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right stylohyoid | FMA45826 | FJ1598 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right stylohyoid ligament | FMA72309 | FJ2764 | right | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| right thyrohyoid | FMA13352 | FJ1599 | right | muscle organ | No aplica: músculo | neck | No asignado | APLAZADO | Identificable, aplazado para limitar esta cohorte a diez familias cervicales; no se afirma ausencia ni ambigüedad. |
| right thyrohyoid membrane | FMA55133 | FJ2804 | right | set/group or other anatomical entity | No aplica | neck | No asignado | DESCARTADO | Membrana o ligamento: no es una unidad muscular y no se integra. |
| superior oblique part of left longus colli | FMA46284 | FJ1600 | left | zone of muscle organ | Por curar | neck | No asignado | APLAZADO | Zonas de un músculo, con desglose terminal lateral asimétrico en esta tabla; requiere curación adicional, sin reflejar ni inventar el lado faltante. |
| vertical intermediate part of left longus colli | FMA46286 | FJ1601 | left | zone of muscle organ | Por curar | neck | No asignado | APLAZADO | Zonas de un músculo, con desglose terminal lateral asimétrico en esta tabla; requiere curación adicional, sin reflejar ni inventar el lado faltante. |

## Consultas sin identificación nominal

| Familia | Decisión | Motivo |
|---|---|---|
| Masetero | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Temporal | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Pterigoideo medial | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Pterigoideo lateral | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Orbicular de los ojos | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Orbicular de la boca | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Buccinador | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Cigomático mayor | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Cigomático menor | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Occipitofrontal | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Risorio | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Nasal | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Prócer | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |
| Corrugador superciliar | APLAZADO | Sin identificación nominal en las dos tablas BP3D 4.0 consultadas; no se asignan FMA/FJ ni geometría supuesta. |

En esta decisión previa, la integración quedó condicionada a comprobar cabeceras originales, conservación geométrica y coincidencia espacial. Ninguna aprobación nominal equivale a certificación clínica.

La decisión previa se conserva como registro. Las comprobaciones posteriores de cabeceras y conservación están completadas en [registro](phase3de-registration.md) y [validación](phase3de-validation.md).

Las tres zonas aplazadas nombran al largo del cuello izquierdo en la propia fuente. «Por curar» deja pendiente la identidad y relación del músculo padre; no convierte la ascendencia IS-A en PART-OF ni publica componentes asimétricos.

La comprobación nominal complementaria de variantes «temporal muscle», mastication, orbicular, buccinator y músculos facial/frontal/zigomático sólo devuelve los conceptos generales `FMA9616` (muscle of head) y `FMA46751` (muscle of face) en IS-A. Esas categorías no identifican un músculo concreto aprobable; no aportan cobertura facial por sí mismas.
