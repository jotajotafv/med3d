# Fase 6 — auditoría respiratoria

Base: `d7f76fab25677b30952f057dfe900ee719dbac63`; rama `phase6-respiratory`. Se revisaron primero el explorador pulmonar existente, sus metadatos/GLB, y las tablas IS-A/PART-OF de BodyParts3D 4.0. Después se consultó el manifiesto oficial 4.3. No se descargó masivamente la base.

**68 candidatos/filas: 49 APROBADOS, 6 DESCARTADOS, 13 APLAZADOS.** Los aprobados son identidades fuente, no 49 órganos completos. Dan 128 mallas: 110 OBJ99 de 4.0 y 18 piezas pulmonares de 4.3. [Tabla completa de 13 campos](phase6/audit.csv), [selección reproducible](../research/anatomy/respiratory-selection.json).

| Cobertura aprobada | Identidades fuente | Mallas |
|---|---:|---:|
| Cartílagos laríngeos, incluida epiglotis | 9 | 9 |
| Tráquea y dos bronquios principales | 3 | 3 |
| Árboles bronquiales segmentarios | 20 | 98 |
| Parénquima segmentario | 17 | 18 |

Los dos pulmones y sus cinco lóbulos son agrupaciones de parénquima real: no hay otra superficie superpuesta ni cortes artificiales. Dos FJ apicoposteriores izquierdos comparten FMA27368. FJ6602/FJ6611 llevan `7.8` en el nombre original y FMA anterior basal: se conserva esa identidad sin inventar una parte medial separada. Los árboles bronquiales izquierdo apical y posterior siguen diferenciados como en 4.0, aunque el parénquima 4.3 los agrupa.

IS-A identifica conceptos; no se convirtió en jerarquía PART-OF. Los cinco grupos bronquiales lobares son editoriales; no se cuentan como cinco bronquios lobares modelados. El árbol apical izquierdo se ubica expresamente en el lóbulo superior, corrigiendo la omisión de ese subconjunto en un grupo PART-OF de 4.0. La laringe FMA55097 se identifica con [IFAA](https://ifaa.unifr.ch/Public/EntryPage/TA98%20Tree/Entity%20TA98%20EN/06.2.01.001%20Entity%20TA98%20EN.htm), pero se rotula «cartílagos disponibles».

La superficie pulmonar no existe en los OBJ99 4.0 auditados: sus grupos pulmonares reunían vasos y bronquios. Se utilizó únicamente el suplemento oficial 4.3 de parénquima. FJ2440 se descarta como representación alternativa de cricoides; FJ2769 conserva la revisión laríngea 120625. FJ6588 sólo controla el marco entre revisiones, nunca se añade como segunda tráquea.

Pendientes: cavidad nasal, tres regiones faríngeas/faringe completa, laringe completa, carina independiente, troncos lobares aislados, ambas pleuras, hilio/raíz como tejido adicional y microanatomía. El diafragma FMA13295/FJ3131 es identificable: se evaluó y se mantiene como relación educativa muscular para conservar el catálogo muscular en esta fase. No se duplica bajo Respiratorio. Tampoco se duplican corazón ni vasos pulmonares. Las ausencias secundarias no impidieron continuar.
