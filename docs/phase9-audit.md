# Fase 9 · auditoría acotada

Base: `5839a7423cd1b0dfab4f79837661147f71b6aab8`. Se reutilizan los metadatos conservados en Fases 3 y 6; no se reextrae el cuerpo ni se reconstruyen activos históricos. [Selección reproducible](../research/anatomy/integumentary-selection.json) y [script](../scripts/anatomy/audit-integumentary.py).

Resultado: **1 aprobado, 11 filas descartadas y 4 coberturas aplazadas**. Las filas ISA/PART-OF repetidas no son once estructuras distintas. Las alternativas de fuente se registran aparte. Se extrajo únicamente `FJ2810.obj`, después de fijar la selección.

| Nombre / latín | FMA / FJ | Fuente | Tipo | Región / lado | Padre | Archivo | Decisión / motivo |
|---|---|---|---|---|---|---|---|
| Piel / Cutis | FMA7163 / FJ2810 / BP9115 | BP3D 4.0 OBJ99 | Superficie externa | Cuerpo completo, bilateral; etiqueta técnica midline | Tegumentario | FJ2810.obj | APROBADO: identidad explícita y marco nativo; conservación y envoltura verificadas |
| hair / — | FMA53667 / FJ2813, FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2813.obj, FJ2815.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| hair of head / — | FMA54241 / FJ2813 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2813.obj | DESCARTADO: Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología. |
| hair of trunk / — | FMA54250 / FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2815.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| pubic hair / — | FMA54319 / FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2815.obj | DESCARTADO: Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología. |
| subdivision of epidermis / — | FMA70593 / FJ2813, FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2813.obj, FJ2815.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| set of facial hairs / — | FMA70741 / FJ2812 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2812.obj | DESCARTADO: Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología. |
| set of hairs / — | FMA70752 / FJ2812 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2812.obj | DESCARTADO: Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología. |
| skin appendage / — | FMA71012 / FJ2813, FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2813.obj, FJ2815.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| pubic hair / — | FMA54319 / FJ2815 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2815.obj | DESCARTADO: Pelo nominal disponible, fuera de la prioridad de envoltura; no se añade cobertura cosmética ni se infiere histología. |
| integumentary system / — | FMA72979 / FJ2810 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2810.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| integument / — | FMA74657 / FJ2810 | BP3D 4.0 | Concepto fuente o agregado | Según concepto; sin lado nuevo | No inferido | FJ2810.obj | DESCARTADO: Agregado que reutiliza piel/pelo: no duplicar mallas. |
| Tejido subcutáneo / Tela subcutanea | Sin ID aprobado | Metadatos BP3D examinados | tejido | Cuerpo / no asignado | Tegumentario editorial | — | APLAZADO: No se identifica una capa subcutánea corporal independiente y fiable. No se infla la piel. |
| Epidermis y dermis separadas / — | Sin ID aprobado | Metadatos BP3D examinados | capas histológicas | Cuerpo / no asignado | Tegumentario editorial | — | APLAZADO: El agregado subdivision of epidermis sólo indexa anexos; no equivale a dos capas geométricas de piel. |
| Uñas / Ungues | Sin ID aprobado | Metadatos BP3D examinados | anexos | Cuerpo / no asignado | Tegumentario editorial | — | APLAZADO: Sin identidad nominal de uña en las tablas de nombres examinadas; no se fabrica geometría. |
| Regiones cutáneas separadas / — | Sin ID aprobado | Metadatos BP3D examinados | regiones | Cuerpo / no asignado | Tegumentario editorial | — | APLAZADO: FMA7163 corresponde a FJ2810, una única pieza. Se conserva; no se recorta para fabricar identidades regionales. |

`hair`, `hair of head`, `pubic hair` y conjuntos de pelo sí tienen correspondencias nominales. No se integran por su escaso valor para esta envoltura; no se declara que el pelo esté ausente de BP3D. `subdivision of epidermis` indexa anexos y no acredita una capa epidérmica independiente. No se convierte IS-A automáticamente en PART-OF.

La tabla 4.3 `FMA2Obj43.txt` conserva FMA7163 → FJ2810 y las correspondencias examinadas de pelo, pero no contiene nombres anatómicos. La revisión de 4.3 es de identidad, no una prueba exhaustiva de ausencia de uñas/subcutáneo. La fuente 4.0 ya satisface el objetivo y evita mezclar marcos. [Comparación de fuentes](phase9-sources.md).

La unidad fuente no se recorta en cabeza, manos o pies. El catálogo tiene una estructura, cero componentes anatómicos y cero regiones cutáneas seleccionables. Sus componentes conexos geométricos no se convierten en entidades anatómicas. Se puede enfocar una zona, pero aislar una región cutánea independiente queda pendiente.
