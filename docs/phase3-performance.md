# Fase 3A — rendimiento del piloto

Código probado: **`8c2a9cdd67a482459de106dfc87843502c1c0643`**, [CI final 35554899964 aprobado](https://github.com/jotajotafv/med3d/actions/runs/35554899964). El [registro de compilación](phase3/results/build.json) identifica Node v22.23.2 y Linux. Las cifras siguientes pertenecen a esta ejecución.

## Geometría verificada antes del navegador

Las pruebas cargan los nueve GLB reales mediante el mismo loader de la aplicación y comprueban sus recursos decodificados. Los módulos óseos conservan sus hashes originales.

| Configuración | Módulos | Bytes GLB | Mallas | Triángulos | Bytes de geometría del gestor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Óseo | 7 | 3.916.940 | 205 | 512.450 | 7.609.772 |
| Muscular piloto | 2 | 539.932 | 26 | 39.604 | 932.764 |
| Conjunto | 9 | 4.456.872 | 231 | 552.054 | 8.542.536 |

Los bytes de geometría suman los `ArrayBuffer` únicos de atributos e índices de `BufferGeometry` tras decodificar, incluida su capacidad asignada; los buffers compartidos se cuentan una sola vez. Las transformaciones permanecen en los objetos 3D y no se hornean en esos vértices. No representan VRAM ni heap total. El informe de conversión registra por separado 863.250 bytes de accessors musculares, una métrica distinta del tamaño de los buffers asignados por el loader. Los vértices de formato tampoco equivalen al número de músculos.

La concurrencia sigue limitada a dos cargas. Las pruebas verifican descarga regional, conservación del otro sistema, reintento explícito tras error y cuatro ciclos de carga/descarga sin crecimiento de buffers. No se introduce una caché de geometría oculta, BVH, LOD ni batching.

## Medición en navegador

El flujo `anatomy-visual-validation.yml` ejecuta `pilot-qa.mjs --performance` sobre la compilación de producción, en configuraciones ósea, muscular y combinada. Registra llamadas de dibujo, primera geometría, carga completa, recursos HTTP, cambio de capas, aislamiento, búsqueda, primera respuesta del despiece y memoria del navegador.

El [informe final del piloto](phase3/results/pilot-performance.json) terminó correctamente. Se hizo **una sola corrida**, en orden **óseo → muscular → combinado**, dentro de la misma sesión de navegador; no son promedios ni tres mediciones independientes de arranque en frío. Las navegaciones posteriores pueden beneficiarse del estado previo del runtime. Por ello, que la carga combinada registrada sea más corta que la primera carga ósea no demuestra una ventaja inherente de cargar más anatomía.

| Medición | Sólo óseo | Sólo muscular | Conjunto |
| --- | ---: | ---: | ---: |
| Llamadas de dibujo iniciales, opacidad 100 % | 205 | 26 | 231 |
| Primera geometría, ms | 244,4 | 154,8 | 233,8 |
| Conjunto solicitado listo, ms | 1.494,8 | 154,9 | 233,9 |
| Búsqueda, ms | 41,3 | 34,9 | 52,9 |
| Aislamiento, ms | 611,1 | 156,6 | 1.050,0 |
| Primera respuesta del despiece, ms | 313,0 | 69,1 | 410,6 |
| Descargar capa, ms | 279,0 | 422,0 | 2.207,6 |
| Reactivar capa, ms | 519,4 | 285,6 | 897,5 |

En óseo se aísla un fémur; en muscular y combinado, el bíceps derecho. El despiece medido es de estructuras en las dos primeras configuraciones y de sistemas en la combinada. Descargar capa se refiere al sistema óseo en la primera configuración y al muscular en las otras dos; el caso combinado conserva los siete módulos óseos. Estas acciones tienen distinto alcance y no son comparaciones de coste idéntico.

Al descargar todo el sistema de una configuración única, el gestor vuelve a cero bytes de geometría. Al quitar únicamente el músculo del conjunto conserva 7.609.772 bytes óseos; al reactivarlo vuelve a 8.542.536, sin incremento acumulado. Las llamadas de dibujo de la tabla son las del estado inicial; algunos snapshots `isolated` y `afterReload` del informe se toman durante la actualización de métricas o del encuadre y no deben interpretarse como recuentos finales estables de esos estados.

| Memoria de sesión tras las operaciones | Sólo óseo | Sólo muscular | Conjunto |
| --- | ---: | ---: | ---: |
| Heap JavaScript usado, bytes | 15.720.048 | 22.359.516 | 15.112.284 |
| Heap JavaScript total asignado, bytes | 31.571.968 | 45.056.000 | 19.742.720 |
| Documentos registrados por CDP | 1 | 3 | 1 |

Estas muestras reflejan la sesión completa y un recolector de basura no forzado. El heap puede bajar en la tercera configuración aunque aumente la geometría; no permite atribuir esas diferencias exclusivamente a cada modelo ni demostrar una fuga. La comprobación de recursos controlados se basa en los buffers del gestor y en los ciclos de descarga y recarga.

La [medición ósea de regresión](phase3/results/performance-qa.json), ejecutada nuevamente sobre este SHA, registra 259,6 ms hasta la primera geometría y 1.581,3 ms hasta el conjunto listo. Su breve muestra de interacción en software obtuvo aproximadamente 2,38 FPS al orbitar y 1,52 FPS en despiece. Estos valores describen ese ensayo óseo; no se reutilizan como FPS medidos del piloto muscular o combinado.

Definiciones: la primera geometría y el conjunto listo son marcas del primer render correspondiente desde la creación del gestor. Los tiempos de interacción incluyen automatización, eventos y actualización de la interfaz; la primera respuesta del despiece no es el tiempo hasta finalizar la animación. Se sirvió la compilación de producción por HTTP local sin limitación artificial de red y con respuestas `no-store`; el coste del servidor local y el estado previo del runtime no representan redes móviles.

El navegador de CI usa ANGLE SwiftShader, rasterización por software. No se ha ensayado una GPU física, temperatura del dispositivo, batería ni memoria móvil. No se extrapolan FPS de software a equipos de usuario. La aceptación de rendimiento en hardware físico queda abierta.

El piloto queda medido y sus recursos permanecen acotados en este entorno. Las latencias observadas, incluida la descarga muscular de unos 2,21 s en el conjunto, deben conservarse al comunicar el resultado; no justifican prometer fluidez en hardware real ni introducir optimizaciones no medidas durante esta fase. Los límites visuales, incluido el solape de vientres del bíceps con despiece al 100 % y la transparencia por objetos, se documentan en la [validación](phase3-validation.md) y en la [revisión visual](phase3/results/visual-review.md).
