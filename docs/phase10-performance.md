# Fase 10 · rendimiento antes/después

Build de producción servido en HTTP loopback sin limitación, respuestas `no-store`, viewport 1366×768. Chrome headless / ANGLE **SwiftShader**; un proceso nuevo por caso, ejecuciones secuenciales. Una muestra por configuración: los tiempos incluyen automatización y estabilización; no son promedios estadísticos ni resultados de GPU física o móvil. Buffers son arrays CPU de geometría, no VRAM. [Datos completos](phase10/performance-summary.json).

Antes: build de Fase 9, base `bd4756f`; el informe declara archivos de auditoría/arnés sin commit, pero aún se servía la aplicación previa sin integración ocular ni optimización. Después: código `9c778713cf37e3736850daaeba21108a62c443f6`. No se comparan ejecuciones de aplicación diferentes bajo un mismo rótulo de build.

A: diez sistemas sin piel. B/C: los once sistemas, piel inicialmente al 100 %. D: once sistemas y piel al 25 % antes de elegir. H: piel + muscular. E (selección/aislamiento) y G (búsqueda/foco) se miden en todos; F (despiece de Sistemas 70 %) en B. Las capturas finales cubren también Regiones y Estructuras.

| Caso / versión | Bytes GLB | Mallas | Triángulos | Buffers bytes | Primera geometría ms | Completo ms |
|---|---:|---:|---:|---:|---:|---:|
| A antes | 27462620 | 930 | 2942020 | 51992064 | 265.5 | 2645.9 |
| A después | 28164276 | 936 | 3036790 | 53567064 | 336.1 | 2512.3 |
| B antes | 29094124 | 931 | 3145402 | 56481988 | 410.3 | 2902.3 |
| B después | 29795780 | 937 | 3240172 | 58056988 | 305.3 | 2986.6 |
| D antes | 29094124 | 931 | 3145402 | 56481988 | 394.7 | 1992.2 |
| D después | 29795780 | 937 | 3240172 | 58056988 | 319.6 | 1535.1 |
| H antes | 11049368 | 183 | 1089242 | 21785904 | 1123.7 | 1123.8 |
| H después | 11049368 | 183 | 1089242 | 21785904 | 1070.2 | 1070.2 |

| Caso / versión | Buscar ms | Elegir ms | Foco restante ms | Aislar ms | Ocultar ms | Mostrar ms | Control 25 % ms | Descargar ms | Recargar ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A antes | 22.1 | 1346.7 | 1936.9 | 28.3 | 109.5 | 252.0 | 975.9 | 267.7 | 955.2 |
| A después | 21.3 | 632.4 | 2631.4 | 29.7 | 104.8 | 259.2 | 526.6 | 301.9 | 458.5 |
| B antes | 22.1 | 763.1 | 3061.7 | 31.9 | 211.0 | 312.7 | 566.6 | 786.6 | 2104.4 |
| B después | 30.1 | 799.8 | 1907.4 | 32.4 | 270.1 | 345.5 | 568.1 | 1650.7 | 1474.4 |
| D antes | 18.1 | 666.6 | 2046.2 | 559.6 | 303.5 | 346.3 | 595.7 | 305.4 | 530.5 |
| D después | 15.6 | 563.9 | 1319.9 | 1147.6 | 294.5 | 341.7 | 576.3 | 634.3 | 500.4 |
| H antes | 23.9 | 341.8 | 1831.5 | 182.8 | 87.9 | 250.8 | 501.4 | 243.3 | 355.2 |
| H después | 22.8 | 311.4 | 1628.5 | 262.2 | 194.8 | 310.1 | 551.9 | 479.3 | 369.0 |

El tiempo de foco comienza después de que se observa la selección; no es la duración independiente de toda la cámara. B/H ahora revelan el interior automáticamente a 25 %, mientras antes mantenían piel opaca; su comparación incluye ese cambio de comportamiento. A y D son comparaciones funcionales más próximas, aunque A/D después incluyen las seis mallas oculares. En D el control 25 % vuelve al valor ya activo en ambas versiones; en B/H después también puede ser una operación idempotente por el revelado automático. No se presenta esa cifra como coste puro de un cambio real de transparencia. Los cambios reales y sus flags se verificaron en la prueba regional a cinco opacidades.

Despiece Sistemas 70 % en B: **1088,1 ms antes → 1648,6 ms después**. Se verifica primero que existe un destino no nulo, después que todas las piezas alcanzaron su destino y finalmente retorno exacto a cero. La operación no ha mejorado en esta muestra; se conserva el dato. No es FPS. Los otros dos modos se validaron funcional y visualmente, sin atribuirles este tiempo.

Módulo descargado/recargado: Urinario en A, piel en B/D/H. En todos los casos se recuperó exactamente la misma cantidad de buffers inicial. La muestra B registró descarga 786,6→1650,7 ms y recarga 2104,4→1474,4 ms; D registró aislamiento 559,6→1147,6 ms. No se ocultan estos resultados más lentos. No se ha establecido con una muestra que constituyan una regresión sostenida; tampoco se afirma que todas las interacciones mejoren.

El contador `idleDraws` del arnés sólo observa el segundo inmediatamente posterior a la recarga: D final dio 178 y H previo 91; el resto cero. No espera explícitamente el fin de todas las transiciones, por lo que no acredita consumo en reposo ni permite diagnosticar una fuga. No se utiliza para deducir FPS o ahorro energético.

El incremento exacto por cobertura ocular es **701656 bytes GLB, 6 mallas, 94770 triángulos y 1575000 bytes de buffers**. La combinación H mantiene los mismos activos antes/después. La optimización demostrada es el trabajo CPU de hover: mediana **413,6→1,9 ms por 2000 cambios**, siete rondas sobre el mismo catálogo; [método y límites](phase10-optimization.md). No equivale a acelerar el render por ese factor.

Las cargas finales completas fueron 2,512 s sin piel, 2,987 s con once sistemas, 1,535 s en el caso D y 1,070 s en H. La diferencia B/D no demuestra que la transparencia acelere la carga: se aplica después de cargar, y las muestras fluctúan. Atlas usable en este entorno de prueba, con retardos de software que siguen siendo perceptibles. Sin promesas sobre teléfonos reales. Se conserva el aviso de build de chunk >500 kB; no se incorporan BVH/LOD/OIT ni reescritura de streaming.
