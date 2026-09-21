# Fase 3A — rendimiento del piloto

## Geometría verificada antes del navegador

Las pruebas cargan los nueve GLB reales mediante el mismo loader de la aplicación y comprueban sus recursos decodificados. Los módulos óseos conservan sus hashes originales.

| Configuración | Módulos | Bytes GLB | Mallas | Triángulos | Bytes de geometría del gestor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Óseo | 7 | 3.916.940 | 205 | 512.450 | 7.609.772 |
| Muscular piloto | 2 | 539.932 | 26 | 39.604 | 932.764 |
| Conjunto | 9 | 4.456.872 | 231 | 552.054 | 8.542.536 |

Los bytes de geometría miden arrays de posiciones, normales e índices propiedad del gestor tras aplicar las transformaciones del nodo. No representan VRAM ni heap total. El informe de conversión registra por separado 863.250 bytes de accessors musculares antes de las conversiones internas del loader. Los vértices de formato tampoco equivalen al número de músculos.

La concurrencia sigue limitada a dos cargas. Las pruebas verifican descarga regional, conservación del otro sistema, reintento explícito tras error y cuatro ciclos de carga/descarga sin crecimiento de buffers. No se introduce una caché de geometría oculta, BVH, LOD ni batching.

## Medición en navegador

El flujo `anatomy-visual-validation.yml` ejecuta `pilot-qa.mjs --performance` sobre la compilación de producción, en configuraciones ósea, muscular y combinada. Registra llamadas de dibujo, primera geometría, carga completa, recursos HTTP, cambio de capas, aislamiento, búsqueda, primera respuesta del despiece y memoria del navegador.

Estado: pendiente de anexar la ejecución y sus resultados. Los datos históricos de Fase 2.1 no se reutilizan como mediciones del piloto.

Definiciones: la primera geometría y el conjunto listo son marcas del primer render correspondiente desde la creación del gestor. Los tiempos de interacción incluyen automatización, eventos y actualización de la interfaz; la primera respuesta del despiece no es el tiempo hasta finalizar la animación. El servidor local HTTP y los recursos en caché no representan redes móviles.

El navegador de CI usa ANGLE SwiftShader, rasterización por software. No se ha ensayado una GPU física, temperatura del dispositivo, batería ni memoria móvil. No se extrapolan FPS de software a equipos de usuario. La aceptación de rendimiento en hardware físico queda abierta.
