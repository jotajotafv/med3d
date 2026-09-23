# Fase 3C — rendimiento medido

Código probado: `eb84c2d206b0bda73bfa5112d9f7943ab3985126`. Medición: 2026-09-23T20:31:46.796Z. [Informe íntegro](phase3c/results/performance/limbs-performance.json).

Chrome 153.0.8010.54, Windows, ANGLE SwiftShader (WebGL por software), viewport 1366 × 768 y escala 1. Compilación de producción servida por HTTP local sin limitación de ancho de banda y respuestas no-store. Configuraciones secuenciales: no son cinco arranques fríos independientes. No se ejecutaron otros navegadores de QA en paralelo con esta medición.

## Configuraciones y carga

| Configuración | Módulos | GLB bytes | Mallas | Triángulos | Buffers de geometría bytes | Draw calls | Primera geometría ms | Carga completa ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A · Óseo | 7 | 3916940 | 205 | 512450 | 7609772 | 205 | 1151.8 | 1151.9 |
| B · Muscular 3A | 2 | 539932 | 26 | 39604 | 932764 | 26 | 229.2 | 229.4 |
| C · Muscular 3A + 3B | 5 | 5746076 | 60 | 563480 | 10749620 | 60 | 224.9 | 376.3 |
| D · Muscular disponible 3C | 13 | 7719432 | 114 | 743436 | 14301016 | 114 | 235.3 | 573.6 |
| E · Óseo + muscular disponible | 20 | 11636372 | 319 | 1255886 | 21910788 | 319 | 229.7 | 1000.3 |

## Interacción y ciclo de vida

| Configuración | Búsqueda ms | Aislar ms | Primera respuesta del despiece ms | Descargar región ms | Recargar región ms | Descargar sistema ms | Recargar sistema ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| A · Óseo | 47.4 | 561.9 | 162.8 | 418.8 | 306.5 | 147.4 | 871.6 |
| B · Muscular 3A | 35.2 | 67.2 | 248.4 | 160.5 | 197.8 | 92.5 | 71.9 |
| C · Muscular 3A + 3B | 21.1 | 239.6 | 113.4 | 1930.6 | 993.1 | 453.9 | 170.2 |
| D · Muscular disponible 3C | 22.8 | 275.4 | 63.9 | 284.0 | 487.0 | 297.2 | 324.4 |
| E · Óseo + muscular disponible | 21.5 | 723.4 | 156.7 | 318.9 | 645.1 | 333.8 | 410.2 |

Los tiempos de interacción incluyen automatización, eventos DOM y confirmación de React; no equivalen a latencia humana pura ni FPS. «Primera respuesta del despiece» no es tiempo de finalización de la animación. Las marcas completas por módulo y recursos HTTP están en el JSON.

Regiones ejercitadas: fémur/miembro inferior izquierdo en A, hombro/brazo derecho en B, tórax anterior en C y muslo derecho en D/E. Las pruebas funcionales adicionales descargan y recargan cada uno de los ocho módulos nuevos.

En las cinco configuraciones, los buffers tras recargar regiones y sistemas recuperan exactamente el valor inicial. Cuando se desactiva el único sistema activo, los buffers de geometría bajan a cero. En E, desactivar muscular conserva el esqueleto. Los ensayos funcionales también verifican tres ciclos de descarga/recarga, cambios rápidos con cancelación y recuperación de un fallo de red mediante reintento explícito.

## Decisión de optimización y límites

La columna principal de draw calls corresponde a la escena inicial de cada configuración. Los contadores guardados inmediatamente después de otras acciones son instantáneas asíncronas: pueden corresponder a un fotograma anterior o variar con el encuadre. No se interpretan como recuentos estabilizados por acción; las aserciones de visibilidad consultan las mallas reales por separado.

La ampliación añade 1.973.356 bytes GLB, 54 mallas, 179.956 triángulos y 3.551.396 bytes de buffers de geometría en Three.js. Los accessors GLB nuevos suman 3.304.230 bytes; la diferencia corresponde a la representación decodificada utilizada por el cargador, no a una medida de VRAM.

Se mantiene Meshopt, carga regional y selección individual. Estas pruebas no muestran crecimiento de memoria después de recargar ni un fallo funcional que justifique introducir BVH, LOD, merging, batching u OIT. No se aplicaron esas optimizaciones. La valoración de transparencia se documenta por captura en la [revisión visual](phase3c-visual-review.md).

Los buffers contabilizados son arrays de geometría propiedad del cargador. Las métricas JSHeap son del navegador y fluctúan con su recolector; ninguna de ellas mide toda la memoria gráfica del dispositivo. Draw calls son las observadas en la escena medida; el total de geometrías del renderer también incluye objetos auxiliares.

No hay certificación de rendimiento en GPU física, móvil real, red móvil, batería ni temperatura. Las anchuras responsive sólo validan CSS e interacción en Chrome de escritorio. El aviso preexistente de Vite sobre el chunk compartido de OrbitControls (~920 kB minificado) permanece; el build termina correctamente y no se realizó una reestructuración del sitio para silenciarlo.
