# Fase 10 · optimización prudente

El efecto histórico de `AtlasScene.Models` recorría todas las mallas para visibilidad, opacidad, raycast y material cuando cambiaba hover o selección. Se separaron esas responsabilidades: conjuntos visibles memoizados, efecto de opacidad/material, efecto de visibilidad/raycast y un controlador incremental de resaltado. Los mapas de propietarios y ancestros se construyen una vez; sólo se actualizan propietarios del hover anterior/nuevo y descendientes de la selección que cambió. Se omiten estados idénticos y se reutilizan variantes de material.

## Medición del trabajo reducido

El [perfil reproducible](../scripts/anatomy/profile-atlas-highlighting.mjs) extrae de Git el efecto exacto de la base `bd4756f` y lo compara con el controlador real nuevo sobre las mismas 931 mallas históricas. 2000 cambios de hover, calentamiento y siete rondas. Se comprueba además identidad de materiales y precedencia de selección de ancestros. [Datos crudos](phase10/highlight-profile.json).

| Mediana por 2000 cambios | Antes | Después |
|---|---:|---:|
| Tiempo CPU | 413,6311 ms | 1,9215 ms |
| Asignaciones de material | 1862000 | 7990 |

Hay propietarios con varias mallas; por eso no son exactamente dos asignaciones por evento. Esta reducción mide el trabajo de la rutina en CPU; **no es una mejora de FPS ni latencia GPU de ese factor**. El perfil usa objetos instrumentados y no incluye React, WebGL ni composición de pantalla.

Las [mediciones de navegador](phase10-performance.md) registran tanto mejoras como operaciones más lentas; son una muestra por configuración con SwiftShader. No justifican afirmar una aceleración universal. El módulo ocular añade 701656 bytes y seis mallas, y el revelado automático cambia parte de la interacción con piel inicialmente opaca.

Se conserva el renderer, concurrencia, carga regional y liberación históricos. No se reoptimiza ningún GLB existente ni se añaden BVH, LOD, OIT, batching, merging, WebGPU o una nueva arquitectura. El despiece mantiene su algoritmo; sólo se integra la agrupación ocular coherente.

Reproducción local: `node scripts/anatomy/profile-atlas-highlighting.mjs`; `atlas-integration-qa.mjs --performance` con `QA_PERF_CASE=A|B|D|H`, `QA_OUTPUT_DIR`, `QA_PLAYWRIGHT_MODULE` y `QA_BROWSER_EXECUTABLE`. Servir el build correspondiente mediante `QA_SERVE_DIR`; un proceso Chrome nuevo por configuración, sin concurrencia de navegadores. Los informes crudos identifican commit, entorno y estado del árbol.
