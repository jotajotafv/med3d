# Fase 4 — rendimiento final

Chromium headless, ANGLE **SwiftShader (software)**, 1366×768, escala 1, HTTP local sin throttling y respuestas no-store. Una medición por configuración final, secuencial: no es un ensayo de arranques fríos independientes ni una afirmación sobre GPU física o móvil. Buffers = arrays de geometría CPU, no VRAM total. Tiempos de interacción incluyen automatización y respuesta del renderer, no son benchmarks de FPS.

| Configuración | Bytes GLB | Mallas | Triángulos | Buffers B | Primera geometría ms | Disponible ms |
|---|---:|---:|---:|---:|---:|---:|
| Óseo | 3916940 | 205 | 512450 | 7609772 | 410.5 | 410.5 |
| Muscular | 9417864 | 182 | 885860 | 17295980 | 390.9 | 907.5 |
| Nervioso | 2933120 | 87 | 317674 | 5480484 | 202.0 | 202.1 |
| Óseo + muscular | 13334804 | 387 | 1398310 | 24905752 | 218.3 | 935.1 |
| Tres sistemas | 16267924 | 474 | 1715984 | 30386236 | 303.5 | 1117.6 |

| Configuración | Búsqueda ms | Selección ms | Aislamiento ms | Despiece asentado ms | Descarga módulo ms | Recarga módulo ms |
|---|---:|---:|---:|---:|---:|---:|
| Óseo | 26.6 | 287.5 | 64.4 | 948.0 | 143.6 | 146.1 |
| Muscular | 17.3 | 244.3 | 289.1 | 1784.0 | 382.8 | 479.0 |
| Nervioso | 16.6 | 134.0 | 216.8 | 1904.0 | 678.4 | 307.8 |
| Óseo + muscular | 27.5 | 685.7 | 683.8 | 3220.5 | 1056.8 | 933.9 |
| Tres sistemas | 20.9 | 509.2 | 555.5 | 3219.3 | 1047.9 | 630.5 |

Tras cada recarga se recupera el mismo total de buffers. La suite funcional también apaga/enciende cada sistema conservando los restantes y recupera un módulo craneal fallido. No se detectó un problema que justificara BVH, LOD, merging, batching u OIT. El aviso de Vite sobre chunks >500 kB permanece; no se reescribió la arquitectura histórica.

[Datos finales completos](phase4/nervous-performance.json). La medición exploratoria anterior se repitió únicamente tras la corrección de entrada regional, para registrar la versión final.
