# Fase 9 · rendimiento

Mediciones del código `b6a21cafacaa993342b81a287a59ce95b8b21d4d`, build local de producción, HTTP loopback sin limitación y `no-store`, viewport 1366×768. Chrome headless / ANGLE **SwiftShader**; un proceso nuevo por configuración, ejecuciones secuenciales. Una muestra por caso: no son promedios, garantías, FPS, VRAM ni resultados de GPU física o móvil. Los tiempos incluyen automatización y algunos tiempos de estabilización del arnés. [JSON completo](phase9/performance-summary.json).

A: piel; B: piel + muscular; C: piel + óseo; D: piel + urinario/cardiovascular/nervioso; E: once sistemas; F: diez sistemas sin piel.

| Caso | GLB bytes | Mallas | Triángulos | Buffers CPU bytes | Primera geometría ms | Completo ms |
|---|---:|---:|---:|---:|---:|---:|
| A | 1631504 | 1 | 203382 | 4489924 | 207.0 | 207.0 |
| B | 11049368 | 183 | 1089242 | 21785904 | 302.9 | 551.3 |
| C | 5548444 | 206 | 715832 | 12099696 | 397.3 | 397.3 |
| D | 11191228 | 294 | 1326608 | 23196752 | 270.5 | 619.7 |
| E | 29094124 | 931 | 3145402 | 56481988 | 413.5 | 1756.4 |
| F | 27462620 | 930 | 2942020 | 51992064 | 396.0 | 2132.6 |

| Caso | Búsqueda ms | Selección ms | Aislar ms | Ocultar ms | Mostrar ms | Opacidad 25 % ms | Descargar ms | Recargar ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A | 25.3 | 121.8 | 29.1 | 29.7 | 54.9 | 447.9 | 39.7 | 76.3 |
| B | 23.7 | 190.6 | 104.0 | 236.8 | 280.6 | 1037.8 | 242.5 | 405.2 |
| C | 23.2 | 156.9 | 29.3 | 29.2 | 163.9 | 431.7 | 132.6 | 185.4 |
| D | 22.2 | 451.1 | 27.9 | 34.2 | 218.6 | 386.6 | 42.3 | 270.5 |
| E | 24.4 | 662.2 | 28.4 | 222.9 | 324.0 | 567.7 | 2378.8 | 1479.1 |
| F | 27.0 | 624.7 | 31.5 | 158.9 | 281.2 | 1576.8 | 289.6 | 1011.0 |

Incremento determinado por los activos: **+1631504 bytes GLB (+5.94 %), +1 malla, +203382 triángulos (+6.91 %) y +4489924 bytes de buffers CPU (+8.64 %)**. Los 4489924 bytes en Three.js difieren de los 4284990 bytes de accessors decodificados por la disposición de arrays/buffers en carga; no se equiparan a memoria de GPU.

E terminó en 1.756 s y F en 2.133 s. Que E haya sido más rápido en estas dos muestras **no demuestra una mejora de rendimiento por añadir piel**. La variabilidad de SwiftShader observada en Fase 8 sigue siendo una limitación. No se extrapolan estos datos a teléfonos o GPU física.

Se realizó una única medición final de despiece del atlas completo: Sistemas 70 %, 27.0 ms según el arnés hasta observar posiciones iguales a sus destinos; retorno a cero exacto. No mide FPS ni duración perceptual aislada de animación. La piel conserva destino cero. En todos los casos descarga/recarga devolvió el mismo número de bytes de buffers. En F se mide el módulo urinario (piel ausente); en A–E se mide el módulo de piel. Opacidad F corresponde a Urinario y no se interpreta como comparación directa de transparencia cutánea.

No se aplican decimación, BVH, LOD, batching, OIT, WebGPU ni una nueva arquitectura de streaming. El build conserva el aviso de chunk >500 kB. Fase 10 no se inicia. La descarga/recarga con todo el atlas resulta más lenta en software que con piel sola; queda medida sin reescribir el sistema.
