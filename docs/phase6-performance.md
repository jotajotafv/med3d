# Fase 6 — rendimiento

Código final `d45999063b9c290c233f94f9f9a94c601288d32b`. Chromium headless, **ANGLE SwiftShader**, 1366 × 768, DPR 1, HTTP loopback no-store sin limitación artificial. Ocho cargas secuenciales, una observación por configuración; no arranques fríos independientes ni percentiles. No se midieron GPU física, móvil real, FPS sostenidos ni VRAM. Buffers = arrays geométricos CPU; los tiempos de interacción incluyen automatización/render y el despiece incluye alcanzar la posición final.

| Configuración | GLB bytes | Mallas | Triángulos | Buffers bytes | Primera geometría ms | Disponible ms |
|---|---:|---:|---:|---:|---:|---:|
| A. Óseo | 3916940 | 205 | 512450 | 7609772 | 312.6 | 312.6 |
| B. Muscular | 9417864 | 182 | 885860 | 17295980 | 191.3 | 621.4 |
| C. Nervioso | 3815572 | 125 | 428266 | 7237668 | 320.0 | 625.9 |
| D. Cardiovascular | 5649280 | 162 | 685016 | 11301456 | 274.9 | 811.3 |
| E. Respiratorio | 2330012 | 128 | 212484 | 4225064 | 204.7 | 204.7 |
| F. Respiratorio + óseo | 6246952 | 333 | 724934 | 11834836 | 183.2 | 317.2 |
| G. Respiratorio + cardiovascular | 7979292 | 290 | 897500 | 15526520 | 310.4 | 1095.5 |
| H. Cinco sistemas | 25129668 | 802 | 2724076 | 47669940 | 278.7 | 1808.8 |

| Configuración | Búsqueda ms | Selección ms | Aislamiento ms | Despiece ms | Descarga ms | Recarga ms |
|---|---:|---:|---:|---:|---:|---:|
| A. Óseo | 26.3 | 267.0 | 75.5 | 972.0 | 126.7 | 168.5 |
| B. Muscular | 18.6 | 319.6 | 318.8 | 1849.7 | 389.3 | 489.1 |
| C. Nervioso | 18.0 | 212.4 | 68.7 | 947.3 | 68.1 | 200.8 |
| D. Cardiovascular | 18.2 | 355.3 | 269.3 | 1121.3 | 256.3 | 277.5 |
| E. Respiratorio | 23.7 | 108.5 | 173.0 | 1101.7 | 331.0 | 329.3 |
| F. Respiratorio + óseo | 22.0 | 436.8 | 324.7 | 1658.4 | 645.2 | 603.4 |
| G. Respiratorio + cardiovascular | 27.3 | 441.4 | 473.1 | 1569.4 | 468.0 | 365.6 |
| H. Cinco sistemas | 21.1 | 969.6 | 1595.1 | 3782.1 | 1519.4 | 1565.6 |


Los tres módulos respiratorios se probaron individualmente en la suite regional. Aquí se midió un módulo representativo por configuración; su identidad y renderer exacto figuran en [datos completos](phase6/performance/respiratory-performance.json). En cada descarga/recarga los buffers retornaron al valor inicial. No hubo errores JavaScript ni respuestas HTTP de error capturadas.

El conjunto final suma 41 módulos, 802 mallas y 2.724.076 triángulos. Los accessors comprimidos/decodificados del informe geométrico respiratorio ocupan 3.930.048 bytes; el renderer informa 4.225.064 bytes de arrays, contabilidades distintas y explícitas. No se afirma que equivalgan a VRAM.

El despiece y las combinaciones de transparencia de varias capas pueden ser lentos con renderizado por software. La disponibilidad de geometría no certifica fluidez de hardware real. No se introdujeron BVH, LOD, batching, merging ni OIT: las configuraciones se completaron conservando geometría y recuperación de módulos. Persiste la advertencia de tamaño de chunk de Vite ya registrada.
