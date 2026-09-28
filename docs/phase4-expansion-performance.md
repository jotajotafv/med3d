# Fase 4 expandida: rendimiento

Medición del commit `e8eb75f2eebc68f4a06c88324d8bebf945ab4aa6` con implementación limpia, posterior a la regresión global. [Resultados crudos](phase4-expansion/nervous-expansion-performance.json), seis configuraciones útiles, una ejecución secuencial. Fecha UTC conservada en el JSON.

Chrome headless, ANGLE **SwiftShader: WebGL por software**, viewport 1366 × 768, DPR 1, producción local por HTTP loopback sin limitación de red y respuestas `no-store`. No son arranques fríos independientes, GPU física ni móvil real. Los buffers son arrays CPU de geometría, no VRAM. Los tiempos de interacción incluyen automatización y renderizado; no son un benchmark estadístico ni percentiles.

| Configuración | Módulos | Bytes GLB | Mallas | Triángulos | Bytes buffers |
|---|---:|---:|---:|---:|---:|
| A-bone | 7 | 3916940 | 205 | 512450 | 7609772 |
| B-muscle | 18 | 9417864 | 182 | 885860 | 17295980 |
| C-expanded-nervous | 6 | 3815572 | 125 | 428266 | 7237668 |
| D-bone-nervous | 13 | 7732512 | 330 | 940716 | 14847440 |
| E-muscle-nervous | 24 | 13233436 | 307 | 1314126 | 24533648 |
| F-all | 31 | 17150376 | 512 | 1826576 | 32143420 |

Todos los tiempos siguientes están en **ms**.

| Configuración | Primera geometría | Disponibilidad completa | Búsqueda | Selección | Aislamiento | Despiece | Descarga | Recarga |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A-bone | 1218.80 | 1218.80 | 23.51 | 171.99 | 60.03 | 945.62 | 183.71 | 116.49 |
| B-muscle | 366.80 | 845.80 | 16.04 | 222.23 | 252.18 | 1754.93 | 377.59 | 367.40 |
| C-expanded-nervous | 222.60 | 222.60 | 18.03 | 239.11 | 49.45 | 913.38 | 59.50 | 178.67 |
| D-bone-nervous | 386.40 | 931.10 | 18.34 | 476.83 | 149.69 | 1065.02 | 271.33 | 274.10 |
| E-muscle-nervous | 306.20 | 816.60 | 16.68 | 415.85 | 354.94 | 2678.99 | 470.18 | 671.90 |
| F-all | 285.30 | 1269.20 | 19.26 | 644.00 | 891.66 | 3606.57 | 936.91 | 464.55 |

Descarga/recarga regional: `skeletal:leg-left` en A, `muscular:neck` en B y `nervous:lower-right` en C–F. Se comprobó que los buffers vuelven al valor previo. El despiece mide la interacción con el modo existente, no FPS sostenidos.

La expansión aislada añade 882 452 bytes GLB, 38 mallas, 110 592 triángulos y 1 757 184 bytes de arrays de geometría. El conjunto de tres sistemas queda en 17 150 376 bytes GLB y 32 143 420 bytes de buffers; disponibilidad completa observada 1 269.20 ms. El despiece tarda hasta 3 606.57 ms en software: se documenta la latencia, sin extrapolar fluidez a equipos físicos. No se añadió BVH, LOD, batching, merging u OIT; las operaciones siguen funcionales en las seis configuraciones.
