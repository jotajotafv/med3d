# Fase 2.1: rendimiento medido y método

Fecha de medición: 14 de septiembre de 2026, 16:44:44 UTC. Compilación ensayada: `8ae335643da56108c6be40243131769c1f15c285`. Ejecución de GitHub Actions: [34869930444](https://github.com/jotajotafv/med3d/actions/runs/34869930444), completada correctamente en Linux con Node `v22.23.2`.

Fuentes de los resultados: [performance-qa.json](phase2.1/results/performance-qa.json), [browser-qa.json](phase2.1/results/browser-qa.json) y [build.json](phase2.1/results/build.json). Las tablas redondean duraciones a una décima de milisegundo y FPS a dos decimales; los JSON conservan las muestras originales. Las pruebas usan una compilación de producción servida por HTTP local, no la latencia de GitHub Pages.

## Resultados

| Medida | Resultado de la prueba de rendimiento, 1366 × 768 |
| --- | --- |
| Primera geometría desde el inicio del gestor | 222,9 ms |
| Sistema completo desde el inicio del gestor | 222,9 ms |
| Primera geometría y sistema completo desde el inicio de navegación | 974,7 ms |
| GLB incorporados | 7 módulos; 3.916.940 bytes de contenido; 3.919.040 bytes de transferencia HTTP según Resource Timing |
| Geometría cargada | 205 mallas; 512.450 triángulos |
| Llamadas de dibujo con el esqueleto completo | 205 |
| Buffers geométricos decodificados | 7.609.772 bytes |
| Liberar la región del miembro inferior izquierdo | 1.860,6 ms |
| Buscar tibia izquierda y recargar su región | 1.355,9 ms |
| Liberar todos los módulos | 1.512,9 ms |
| Recargar todos los módulos | 1.222,3 ms |

Los tiempos de primera geometría y sistema completo coinciden en la prueba de rendimiento: los siete módulos estaban disponibles al producirse el primer render registrado. La ejecución funcional independiente, a 1440 × 900, registró **239,0 ms** hasta primera geometría y **1.558,0 ms** hasta sistema completo desde el gestor; desde navegación, **977,9 ms** y **2.296,9 ms**, respectivamente. Esta variación entre dos ejecuciones impide presentar el valor más bajo como una garantía de carga. No se añadieron las pausas de estabilización de capturas a estos tiempos.

| Interacción continua en SwiftShader | FPS | Frames observados | Tiempo entre primer y último frame | Intervalo mediano | Intervalo p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Rotación | 2,43 | 7 | 2.466,6 ms | 350,0 ms | 700,0 ms |
| Exploded View | 1,91 | 6 | 2.616,5 ms | 366,7 ms | 766,7 ms |

Estos resultados muestran una interacción lenta en el renderer de software disponible. Las muestras de 7 y 6 frames son cortas y sus percentiles son descriptivos, no estimaciones estadísticas de hardware objetivo. **No se ha demostrado fluidez en desktop, portátil, móvil ni tablet físicos.** El renderer detectado fue `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`. No se atribuye este resultado exclusivamente a draw calls ni se propone una reestructuración compleja sin medición en GPU física.

| Consulta | Evento de entrada hasta resultado en el DOM |
| --- | ---: |
| `femur` | 3,1 ms |
| `FÍBULA IZQUIERDA` | 1,5 ms |
| `os femoris` | 1,5 ms |
| `escafoides` | 2,1 ms |

| Estado | Bytes de buffers geométricos | Geometrías de Three.js | Heap JavaScript usado |
| --- | ---: | ---: | ---: |
| Sistema completo inicial | 7.609.772 | 209 | 11.398.576 bytes |
| Sistema completamente descargado | 0 | 4 | 13.048.948 bytes |
| Sistema recargado | 7.609.772 | 209 | 13.926.156 bytes |

Las cuatro geometrías y cuatro texturas que permanecen tras descargar el sistema pertenecen al visor, incluido el indicador de ejes; no son huesos retenidos. La recarga restituye exactamente el volumen de buffers anatómicos inicial. El heap JavaScript no volvió a su valor inicial en esta muestra sin GC forzado; no se afirma que toda la memoria del navegador quede liberada ni que una sola recarga descarte cualquier fuga futura. La liberación explícita de geometría sí quedó verificada.

## Resultado funcional y recuperación de errores

**26 comprobaciones funcionales aprobadas**, sin errores JavaScript no controlados ni respuestas HTTP inesperadas fallidas. Se verificaron carga, reposo sin dibujos WebGL adicionales, búsqueda con acentos/sinónimos/latín, árbol virtual y teclado, seis vistas, zoom y pan con cambio de píxeles, fichas y texto educativo de 14 px, selección/raycast, aislamiento, ocultación/revelado, opacidad, ambos niveles públicos de despiece, memoria, carga bajo demanda, cuatro tamaños responsive y los tres órganos anteriores.

El árbol expandido mantuvo 19 filas renderizadas para un catálogo de 249 nodos en la muestra comprobada. La regresión móvil confirmó que el canvas comienza debajo de los botones de acciones, además de comprobar ausencia de desbordamiento horizontal.

La prueba de recuperación mantuvo fallida la descarga de la columna hasta accionar **Reintentar regiones pendientes**. Antes de reintentar había una solicitud fallida y seis módulos sanos retenidos: **180 mallas, 442.364 triángulos y 6.528.632 bytes de buffers**. El reintento hizo una segunda solicitud, recuperó las 205 mallas y retiró el aviso. La prueba utiliza una sola página y conserva el estado previo en `recoveryBefore`; la regresión del gestor verifica además que reafirmar las capas deseadas no provoca un reintento automático.

## Ejecución

```sh
npm ci
npm run build
node scripts/anatomy/browser-qa.mjs
node scripts/anatomy/performance-qa.mjs
node scripts/anatomy/visual-qa.mjs
```

Se requiere Playwright y Chromium. `QA_PLAYWRIGHT_MODULE` permite indicar la instalación de Playwright; `QA_BROWSER_EXECUTABLE`, un Chromium disponible; `QA_OUTPUT_DIR`, el destino de resultados. El servidor HTTP y el navegador se mantienen en el mismo proceso para evitar depender de conectividad entre sesiones aisladas. Los archivos se sirven con `Cache-Control: no-store`. Las esperas tienen límites; la búsqueda falla a los cinco segundos si no aparece el resultado y los scripts conservan un JSON de evidencia parcial ante un fallo.

## Qué se mide

| Medida | Método y alcance |
| --- | --- |
| Primera geometría | Marca en `scene.onAfterRender`, después del primer render con recursos anatómicos. Duración desde la creación del gestor de assets, no desde la navegación. |
| Sistema completo | Marca después del primer render con todos los módulos solicitados inicialmente. No incorpora pausas artificiales para estabilizar capturas. |
| Transferencia de modelos | Resource Timing: duración, bytes de cuerpo codificado y bytes transferidos de cada GLB. HTTP local sin compresión adicional ni limitación de ancho de banda. |
| Rotación | Tres segundos de arrastre automatizado continuo; se registran timestamps distintos de `requestAnimationFrame` que realmente emiten dibujos WebGL. |
| Exploded View | Transición solicitada progresivamente de 0 a 100 % durante tres segundos; mismo muestreo de frames realmente dibujados. |
| FPS e intervalos | Número de intervalos dividido por tiempo entre primer y último frame. Se registran mediana y percentil 95 del intervalo. |
| Búsqueda | Evento de entrada hasta la mutación DOM que incorpora el resultado esperado; no incluye transporte de Playwright ni tiempo humano de escritura. |
| Cambio de región | Clic para descargar una región y confirmación de su retirada en las métricas. Después, búsqueda que solicita nuevamente la región hasta su carga. |
| Descarga y recarga completas | Acciones públicas de capas hasta actualización de las métricas; incluyen interacción automatizada, carga y confirmación React. |
| Memoria geométrica | Bytes de buffers decodificados propiedad del gestor y número de geometrías reportadas por Three.js. No son una medida directa de VRAM. |
| Memoria JavaScript | `JSHeapUsedSize` y `JSHeapTotalSize` del protocolo de Chromium. No se fuerza GC: una subida temporal del heap no demuestra por sí sola una fuga. |
| Llamadas y triángulos | Contadores del renderer y del catálogo. Las geometrías descargadas pueden seguir en memoria mientras otra estructura esté aislada; ocultación y descarga son operaciones diferentes. |

El script comprueba que descargar el sistema deja cero bytes de geometría propiedad del gestor y que una recarga devuelve el mismo volumen de buffers, sin crecimiento acumulado. Las pruebas funcionales verifican además liberación de geometrías del renderer, renderizado detenido en reposo, búsqueda, árbol virtual, controles, recuperación de errores y compatibilidad con órganos previos.

## Perfiles y límites

El perfil de medición disponible es Chromium sin interfaz, ANGLE SwiftShader, DPR 1 y viewport 1366 × 768. Las capturas responsive adicionales usan 1440 × 900, 1050 × 844, 900 × 1000 y 390 × 844. Son tamaños de viewport; no emulan una GPU física, RAM disponible, temperatura, pantalla táctil o conexión móvil.

No se ha medido un desktop, portátil con GPU integrada, móvil de gama media ni tablet físicos. Los resultados SwiftShader deben conservar esa etiqueta y no extrapolarse. El runtime local carece de `/proc`; los binarios Chromium 133 y 153 pudieron responder `--version`, pero abortaron antes de abrir una página. La ejecución descrita se realizó en GitHub Actions.

La revisión visual de los PNG es una comprobación separada. El script visual usa la preferencia soportada `prefers-reduced-motion: reduce` para obtener poses finales reproducibles sin fotografiar una transición incompleta en SwiftShader. **Las pruebas funcionales y de rendimiento mantienen la animación normal.** Esta preferencia figura en el manifiesto de capturas; no modifica los assets ni las posiciones finales. Generar una captura no significa haberla inspeccionado ni haber aprobado proporciones anatómicas. Los hallazgos visuales y la inspección se registran en [el informe de validación](phase2.1-validation.md).

## Estrategias futuras si aparece un problema medido

Con aproximadamente una llamada por hueso, la selección individual sigue siendo sencilla y los costes actuales son observables. Antes de cambiar esta arquitectura, medir el mismo recorrido de cámara en hardware objetivo. Si aparece un límite real:

- Batching o merging selectivo de partes no seleccionables, conservando un mapa verificable de IDs para las estructuras identificables.
- Instancing sólo para geometrías realmente compartidas; no convertir huesos de distinta forma o lateralidad en copias por conveniencia.
- BVH para reducir coste de raycasting en meshes complejos; no elimina llamadas de dibujo.
- LOD validado contra la geometría anatómica original, con especial cuidado en carpo, tarso, superficies articulares y estructuras pequeñas.
- Mantener carga por módulos y ownership explícito de buffers antes de introducir cachés globales.

La evidencia anterior corresponde exclusivamente al commit identificado al inicio. Un cambio posterior de aplicación, renderer, assets o configuración de medición exige identificar qué resultados deben repetirse.
