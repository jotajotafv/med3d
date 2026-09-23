# Fase 3B — rendimiento local medido

Código: `5c6b6e32aca61ebee8ae14f418a5c32c2eaf686a`. Fecha UTC del informe: `2026-09-23T17:57:09.786Z`. [Datos originales](phase3b/results/torso-performance.json), [comando y fechas](phase3b/results/commands.json) y [build](phase3b/results/build-identity.json).

Se midieron cuatro configuraciones en el mismo build local, secuencialmente y sin otras suites de navegador concurrentes. Chrome headless 153.0.8010.54, Playwright 1.62.1, viewport 1366×768, escala de píxel 1 y ANGLE SwiftShader. Son una pasada por configuración en HTTP loopback sin limitación de red y respuestas no-store. No son promedios de arranques fríos independientes ni mediciones de GPU física, teléfono, batería o temperatura. La inicialización previa del runtime puede favorecer las configuraciones posteriores.

## Volumen y buffers

| Configuración | Módulos | Mallas | Triángulos | GLB bytes | Buffers de geometría bytes | Draw calls iniciales |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| A · Sólo óseo | 7 | 205 | 512.450 | 3.916.940 | 7.609.772 | 205 |
| B · Muscular Fase 3A | 2 | 26 | 39.604 | 539.932 | 932.764 | 26 |
| C · Muscular ampliado | 5 | 60 | 563.480 | 5.746.076 | 10.749.620 | 60 |
| D · Óseo + muscular ampliado | 12 | 265 | 1.075.930 | 9.663.016 | 18.359.392 | 265 |

El incremento C−B es exactamente el torso: 34 mallas, 523.876 triángulos y 5.206.144 bytes GLB. La fase conserva la resolución fuente aprobada y permite liberar tórax anterior, abdomen y espalda por separado. Los buffers son arrays CPU decodificados propiedad del gestor; no son VRAM ni memoria total del navegador. Los accessors originales decodificados del torso suman 9.149.496 bytes, mientras que sus geometrías cargadas por Three.js suman 9.816.856 bytes.

## Tiempos observados

Todos los valores siguientes están en milisegundos. Primera geometría y disponibilidad completa proceden de marcas del atlas desde su inicio de carga; no equivalen a tiempo desde navegación ni a todas las métricas web de experiencia. Búsqueda/aislamiento/despiece/descarga/recarga incluyen automatización y reconocimiento del estado React/Three.js.

| Configuración | Primera geometría | Completo | Búsqueda | Aislar | Primera respuesta despiece |
| --- | ---: | ---: | ---: | ---: | ---: |
| A · Sólo óseo | 371,30 | 371,30 | 26,81 | 71,81 | 37,31 |
| B · Muscular Fase 3A | 164,40 | 164,40 | 25,29 | 70,70 | 43,29 |
| C · Muscular ampliado | 304,40 | 304,50 | 20,13 | 385,72 | 93,03 |
| D · Óseo + muscular ampliado | 320,40 | 788,70 | 20,70 | 610,29 | 293,41 |

| Configuración | Descargar región | Recargar región | Descargar sistema | Recargar sistema |
| --- | ---: | ---: | ---: | ---: |
| A · Sólo óseo | 205,31 | 142,62 | 84,44 | 148,95 |
| B · Muscular Fase 3A | 127,69 | 141,12 | 164,60 | 70,47 |
| C · Muscular ampliado | 752,78 | 807,77 | 481,13 | 255,02 |
| D · Óseo + muscular ampliado | 1435,24 | 622,14 | 735,08 | 658,09 |

Las regiones medidas son pierna izquierda en A, módulo muscular derecho del piloto en B y tórax anterior en C/D. Se descarga el sistema óseo en A y muscular en B/C/D; D conserva el esqueleto. Aislamiento usa fémur izquierdo en A, bíceps derecho en B y pectoral mayor derecho en C/D. No son cargas anatómicas equivalentes; la tabla permite evaluar las configuraciones declaradas sin presentar sus diferencias como un benchmark controlado por tamaño.

## Liberación y memoria

| Configuración | Buffers tras descargar región | Tras descargar sistema | Tras recargar sistema | JS heap usado al final (bytes) |
| --- | ---: | ---: | ---: | ---: |
| A · Sólo óseo | 7.243.788 | 0 | 7.609.772 | 12.442.816 |
| B · Muscular Fase 3A | 466.212 | 0 | 932.764 | 27.211.756 |
| C · Muscular ampliado | 8.126.108 | 0 | 10.749.620 | 14.040.372 |
| D · Óseo + muscular ampliado | 15.735.880 | 7.609.772 | 18.359.392 | 18.607.840 |

Los buffers regresan exactamente al tamaño inicial tras cada recarga. Descargar el único sistema activo deja cero buffers del atlas; en D quedan los 7.609.772 bytes óseos. La suite funcional añade tres ciclos y cancelaciones rápidas; el gestor prueba liberación única de recursos retenidos/abortados. El heap CDP es una muestra final sin GC forzada, no un máximo ni una medición de fuga. Los contadores del renderer incluyen geometrías auxiliares y pueden conservar estadísticas de un frame anterior en instantáneas intermedias; para liberación se usan los buffers y propietarios, no sólo draw calls.

## Interpretación

La ampliación tiene un coste visible en triángulos, transferencia y respuesta de acciones sobre el conjunto. El abdomen concentra 223.652 triángulos en dos mallas y se mantiene como módulo independiente. Las cifras no justifican por sí solas simplificar geometría ni introducir BVH, LOD, fusión de meshes u OIT; ninguna de esas técnicas se añadió.

La revisión local permite evaluar esta fase con sus limitaciones, pero no establece un umbral de fluidez en dispositivos físicos. La prueba responsive verifica disposición/interacción por viewport; no reemplaza una sesión en teléfono o tablet real. El detalle por recursos, marcas, draw calls, memoria CDP y renderer detectado permanece en el JSON original.
