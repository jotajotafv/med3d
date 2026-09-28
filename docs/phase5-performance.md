# Fase 5: rendimiento

Medición sobre commit `a2fbbb43182480c06be92a4c7d74e3a71ed51829`, build final local, Chromium headless / ANGLE **SwiftShader**. Viewport 1366 × 768, DPR 1, HTTP loopback sin limitación artificial y respuestas no-store. Cargas secuenciales, no arranques fríos independientes. No se midió GPU física, móvil real, FPS sostenidos ni VRAM. Buffers = arrays geométricos CPU; tiempos de interacción incluyen automatización y render. Una observación por configuración, sin inferir percentiles.

| Configuración | GLB bytes | Mallas | Triángulos | Buffers bytes | Primera geometría ms | Disponible ms |
|---|---:|---:|---:|---:|---:|---:|
| A. Óseo | 3916940 | 205 | 512450 | 7609772 | 304.6 | 304.7 |
| B. Muscular | 9417864 | 182 | 885860 | 17295980 | 266.5 | 912.4 |
| C. Nervioso | 3815572 | 125 | 428266 | 7237668 | 244.9 | 244.9 |
| D. Cardiovascular | 5649280 | 162 | 685016 | 11301456 | 206.8 | 675.4 |
| E. Óseo + cardiovascular | 9566220 | 367 | 1197466 | 18911228 | 234.7 | 703 |
| F. Muscular + cardiovascular | 15067144 | 344 | 1570876 | 28597436 | 413.4 | 1327.1 |
| G. Cuatro sistemas | 22799656 | 674 | 2511592 | 43444876 | 267.2 | 1726.7 |

| Configuración | Búsqueda ms | Selección ms | Aislamiento ms | Despiece ms | Descarga ms | Recarga ms |
|---|---:|---:|---:|---:|---:|---:|
| A. Óseo | 26.0 | 252.0 | 71.6 | 1026.5 | 162.3 | 143.6 |
| B. Muscular | 22.6 | 364.8 | 421.2 | 2056.0 | 559.0 | 383.2 |
| C. Nervioso | 20.9 | 304.3 | 93.2 | 941.1 | 80.1 | 234.0 |
| D. Cardiovascular | 22.0 | 308.0 | 320.3 | 1121.3 | 236.8 | 298.9 |
| E. Óseo + cardiovascular | 25.4 | 489.4 | 643.4 | 1866.7 | 298.0 | 362.2 |
| F. Muscular + cardiovascular | 28.8 | 684.5 | 582.8 | 3311.0 | 608.5 | 793.5 |
| G. Cuatro sistemas | 27.4 | 943.5 | 1421.2 | 4934.7 | 1019.5 | 502.4 |

Se midió un módulo regional representativo por configuración; los siete módulos cardiovasculares se comprobaron individualmente durante la validación regional. En cada recarga los buffers volvieron al valor inicial. La búsqueda y selección conservan un propietario por estructura; no hubo merging, batching, LOD, BVH u OIT.

El despiece animado de varias capas en SwiftShader puede ser lento; el tiempo anterior corresponde a alcanzar la posición final, no sólo al manejo del control. La disponibilidad significa geometría cargada/decodificada, no aprobación de fluidez en hardware real. El atlas completó las siete configuraciones sin errores WebGL capturados ni pérdida de geometría.

Datos completos, renderer exacto y módulo elegido: [cardiovascular-performance.json](phase5/cardiovascular-performance.json). El build conserva la advertencia de Vite por un chunk superior a 500 kB; no se trató como fallo ni se ocultó.
