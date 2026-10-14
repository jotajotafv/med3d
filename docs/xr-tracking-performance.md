# Perfilado de continuidad XR

Base: `4999c8d7fbb298d6faedcbf0287626720d2eb84f`. Rama: `phase-xr-tracking-performance`.

La campaña parte de **ENVIRONMENT_BLOCKED**. El perfilado inicial conserva el producto completo, los 92 módulos/1.240 mallas y todos los parámetros gestuales. Las variantes de delegate y los observadores se insertan exclusivamente en las respuestas del servidor de desarrollo dentro del harness.

## Método reproducible

- `scripts/xr/tracking-performance-browser-qa.mjs` reutiliza el vídeo sintético y los observadores de controladores de la aceptación anterior. MediaPipe recibe fotografías a través de `captureStream(0)`, `requestFrame`, `createImageBitmap`, el Worker, WASM y el modelo reales. Ninguna variante real inyecta landmarks ni modifica timestamps.
- Vídeo 640×480, producción máxima aproximada de 20 Hz, una imagen en vuelo. Desktop 1366×1000, DPR 1; móvil 390×1000 se registra por separado. Chromium completo usa el ejecutable local indicado en cada resultado.
- A mínimo; B Óseo base, 7 módulos/205 mallas; C Óseo completo, 9/207; D + Muscular, 42/505; E + Nervioso y ocular, 57/694; F ocho sistemas adicionales activados progresivamente hasta 11 sistemas y 92/1240; G Tegumentario OFF; H Tegumentario ON. OFF conserva los recursos cargados. Oculta las cuatro mallas del sistema, piel y cabello, conforme a la UI existente.
- Cada ventana dura al menos 15 s. Se mide la carga y después el estado estable. Una ventana WHILE_LOADING puede contener una cola de tiempo ya estable si la carga acaba antes de 15 s; los eventos delimitan la carga efectiva. G/H son cambios de visibilidad, sin recarga GLB.
- Para separar B de C, el harness retiene temporalmente las respuestas HTTP de los dos módulos adicionales óseos. También retiene la primera respuesta hasta que el tracking está iniciado. Esas esperas QA no son latencia de red real ni se presentan como tiempo de descarga del producto.
- Los toggles de carga invocan el handler del checkbox real sin eventos de puntero. Evita activar el enfriamiento manual que interrumpe deliberadamente el control de manos. La campaña gestual posterior utiliza sus entradas reales de manos y controles.
- Capturas y exportación JSON ocurren fuera de las ventanas críticas. Hay un segundo de separación antes de cada ventana. Perfiles CDP de CPU/GC se toman en un tramo diagnóstico separado.

## Qué se observa y qué no

La timeline utiliza el reloj monotónico de la página. Las marcas del Worker se convierten mediante la diferencia entre ambos `performance.timeOrigin`; los timestamps de entrada del producto permanecen intactos. Se registran vídeo, bitmaps, envío/recepción, entrada al Worker, inferencia, manos, estados del controlador, captura UI, RAF, descarga, parse GLB, preparación geométrica, publicación/presentación, picking, render, llamadas de shader y notificaciones de commit React.

La duración de `detectForVideo` es **tiempo de pared**, no CPU exclusiva: incluye esperas del driver y planificación. El wrapper de Meshopt mide la promesa de decode, incluida su espera; sus intervalos pueden solaparse y no deben sumarse como CPU. El render medido dentro de los callbacks de escena se acompaña de un wrapper de `gl.render` para incluir el trabajo previo de matrices. Las llamadas WebGL de compilación no miden por sí solas todo el trabajo asíncrono del driver. renderCpuMs es duración de pared de la llamada de render, no CPU exclusiva ni duración GPU obtenida con timer queries. RAF tampoco equivale a FPS de GPU.

Las interrupciones se clasifican con evidencia coincidente y conservan los solapamientos. `MEDIAPIPE_INFERENCE` identifica dónde transcurrió la mayor parte del tiempo, sin atribuirlo automáticamente al algoritmo, al sistema operativo o a CPU. Las pausas sin evidencia suficiente permanecen `UNKNOWN`. Se mantienen máximos y percentiles altos, así como silencio al inicio/final de la ventana; una mediana baja nunca convierte una pausa en PASS.

El contraste `DIAG_RENDER_OFF` suspende sólo las llamadas de render dentro del harness y mantiene residentes los 92 módulos. Sirve para aislar causalmente su coste; **no es una optimización de producto ni una prueba de aceptación**. Después se restaura el render y se repite la medición.

## Límites conservados

Watchdog 250 ms, grace 380 ms, dwell 1000 ms. No cambian confidencias, pinch, adquisición de target, smoothing, escalado, pan ni sensibilidad. La política actual es dos propietarios de sistema activos y un módulo en curso por propietario. No se ha introducido un scheduler ni cambiado el delegate de producción durante el perfilado inicial.


## Decisión

Se conserva **ENVIRONMENT_BLOCKED**. El escritorio headed con Intel UHD/D3D11 y MediaPipe CPU completó las 14 ventanas B–H y todos los gestos reales con 92 módulos; esa ejecución está aprobada. Una repetición independiente headed posterior no adquirió tracking estable en 12 s, aun con los 92 módulos ya cargados. La continuidad tampoco fue consistente en headless ni en 390 px, aun sin carga pendiente. No se ha demostrado que las diferencias restantes sean exclusivamente de un entorno móvil no representativo. Por tanto, no se eleva el conjunto a GLOBAL_ACCEPTED ni se marca el cierre anatómico final.

No se modificó producto. No hay un resultado «después de optimizar»: las comparaciones son entre entornos, delegates y contrastes diagnósticos sobre el mismo checkpoint. No se implementó scheduler, fallback GPU ni batching. Los informes históricos permanecen intactos.

## Causa observada y decisión de implementación

La mayor parte de muchas pausas transcurre dentro de la inferencia real, con contención adicional de render y algunos bloqueos de hilo principal. Hay un caso concreto al cargar Nervioso en CPU headless v2: una llamada de render de 306,4 ms coincide con 265,3 ms de retraso en entregar un resultado ya calculado. Eso identifica un bloqueo de recepción, pero no permite atribuir todo el coste a compilación de shaders.

Los fallos también aparecen en STEADY_STATE, cuando no quedan GLB que descargar, decodificar o publicar. En la repetición headless con framebuffer igualado hay una inferencia de 432,4 ms y un gap de 476,2 ms **11,9 segundos después** de suspender el render. No es sólo una inferencia que quedó en vuelo al cambiar de estado. La carga anatómica y el render son factores medibles, pero no explican por sí solos todos los picos.

El contraste con los 92 módulos residentes demuestra contención de render: en CPU headed la mediana de inferencia pasa de 80,1 a 41,1 ms al suspenderlo y vuelve a 86,2 ms al restaurarlo. En GPU headed pasa de 136,8 a 25,3 y vuelve a 139,8 ms. Es un diagnóstico deliberadamente artificial, nunca una solución propuesta ni una ventana de aceptación.

No hay evidencia suficiente para dar un scheduler por resuelto: mover la publicación no elimina las pausas posteriores a la carga. La concurrencia sigue siendo dos propietarios de sistema y un módulo en curso por propietario; no se cancela ni redescarga trabajo. La política durante gestos, fairness, cancelación, retry y cleanup permanecen sin cambios. No se añaden constantes de espera, yields o pools sin una mejora reproducible.

## CPU/GPU, render y entorno

La versión instalada permite GPU en el Worker con un OffscreenCanvas. Sólo el harness cambia la opción; el producto mantiene CPU y su ciclo de vida/error/cleanup original. El renderer real se registra tanto en la página como, cuando está disponible, en el Worker GPU. La opción de delegate está definida en la [API de MediaPipe](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/core/task_runner_options.d.ts).

GPU mejora el caso mínimo, pero no el recorrido completo: con piel, CPU headed entrega 140 muestras en 15 s e inferencia mediana de 80,1 ms; GPU headed entrega 92 y 136,8 ms. El gap máximo GPU de esa ventana es 193,9 ms, sin pérdida, pero no cumple la aserción histórica de al menos 100 muestras válidas. Esa aserción se conserva y se distingue del requisito de no superar 250 ms. No se introduce selección automática de GPU basada en el mínimo.

El entorno es Windows 10.0.26200, i7-13620H, 16 procesadores lógicos, aproximadamente 16 GB RAM, Chromium completo 149.0.7827.55 e Intel UHD mediante ANGLE/D3D11. Se ejecutó un navegador de QA a la vez. La memoria libre varió ampliamente durante la campaña; se conserva el muestreo del host sin atribuirle causalidad exclusiva. No se cambiaron prioridades, afinidad, plan de energía, drivers ni aplicaciones ajenas.

Headed y headless solicitan 1366×1000 y DPR 1. Se repitió headless sin ocultar scrollbars: ambos framebuffers del Atlas miden 1041×680. El headed registra DPR 1,0000000149 y un redondeo CSS de un píxel; la repetición descarta la diferencia inicial de ancho como explicación suficiente. No constituye un ensayo aleatorizado ni elimina efectos térmicos o del host.

SwiftShader sigue siendo sólo estrés: llegó a inferencias de 6.478,3 ms y un gap de 7.283 ms con Óseo base. Después disparó el timeout de Worker existente de 10 s y la cámara quedó no disponible. Se interrumpió el diagnóstico, se conservó el progreso parcial y no se presentaron sus ventanas posteriores como tracking activo. No es un fallo exigible del hardware objetivo.

La consulta nativa de QoS es de sólo lectura y ocurre después de medir. Distingue el renderer activo de un proceso renderer reservado e inactivo; ver un proceso reservado en prioridad idle no prueba que el renderer activo esté limitado. Algunas consultas de hilos no están disponibles y una consulta de procesos expiró. No se asignan pausas a OS_SCHEDULING/EcoQoS sin evidencia temporal. El permiso de lectura usado se corresponde con [GetThreadInformation](https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getthreadinformation).

## Observabilidad y costes

- createImageBitmap no acumuló una cola: máximo una imagen en vuelo. En CPU headed el máximo medido en la matriz es 1,3 ms y la cola de entrada al Worker 0,6 ms; en la repetición CPU headless, 21,4 y 9,4 ms. No explican por sí solos los gaps de cientos de milisegundos. La espera de entrega al hilo principal sí crece cuando éste se bloquea.
- captureStream(0) y requestFrame producen como máximo aproximadamente 20 imágenes/s. No se aumentó la frecuencia. Se registran currentTime, producción, envío, recepción, droppedVideoFrames y monotonía. No se inyectan landmarks en las ejecuciones reales; el fixture controlado se identifica expresamente.
- CPU headless v2: GLB parse máximo 54,0 ms, Meshopt asíncrono 41,9 ms, preparación geométrica 6,0 ms, presentation.add 1,8 ms y apply 17,9 ms. En otra repetición degradada, parse alcanzó 151,4 ms. No se suma el tiempo solapado de promesas como CPU exclusiva.
- Los observadores adicionales de scene.add real, bufferData y consultas de shader se comprobaron en una corrida B–E separada. No se atribuyen retroactivamente a las matrices previas.
- En CPU headed con 92 módulos y piel: 1.242 draw calls, render CPU p50/p95/p99/max 4,1/6,9/8,3/9,8 ms y RAF 7,0/14,2/21,0/34,7 ms. La diferencia respecto de las 1.240 mallas incluye las pasadas de superficies transparentes. Sin Tegumentario son 1.238 draw calls; se ocultan cuatro mallas, sin destruir los 92 módulos.
- Los buffers geométricos fuente suman 95.884.560 bytes; los GLB, 47.933.696 bytes. No es una estimación de toda la memoria GPU ni de la aplicación. No se redujo geometría.
- La lista de raycast se reconstruye al cambiar visibilidad/contenido, no cada frame; se reutiliza Raycaster. El picking y las actualizaciones de matriz se miden dentro de su operación. En CPU headed el picking máximo observado fue 32,1 ms. Las variantes de material y highlight se aplican al cambiar estado, no mediante un nuevo setState por frame.
- React registra cero commits en la ventana estable final CPU headed con 140 muestras. Durante carga hay commits de publicación, y durante pérdidas hay commits de estado; no son evidencia de un render React por cada frame de tracking.
- Los perfiles de CPU/GC son diagnósticos separados de 15 s. Los eventos MinorGC/MajorGC observables y las funciones muestreadas se incluyen en el JSON; no se atribuye un gap de aceptación a un GC capturado en otra ventana.

## Aceptación funcional y límites

La suite real de escritorio con los 92 módulos cargados pasó dwell de 1000 ms y rearm, scroll de sistemas, Tegumentario, slider, selección mediante raycast real, ficha y scroll hasta fuentes, cierre por dwell, rotación, pan arriba/abajo, escala, pan+escala, límites 0,55/1,8 y grace/reacquire. La selección que prepara la ficha se hace con click real; no se presenta como una nueva prueba de selección gestual. Las pausas intencionales de manos para rearmar, capturar o probar grace están marcadas y separadas de los intervalos críticos.

En esa suite, la mano estable inicial produjo 161 muestras/15 s, gap p50/p95/p99/max 90,6/113,3/124,7/129,3 ms e inferencia 80,1/102,1/114,0/117,5 ms. El peor gap dentro de los intervalos gestuales medidos fue 188,2 ms, sin pérdidas no intencionales. Los cortes deliberados del fixture no se presentan como regresiones.

En 390 px, la matriz real muestra un gap de 494,8 ms durante Nervioso, 308,7 ms con piel OFF y 243,9 ms con piel ON; esta última ventana tuvo sólo 71 muestras y tampoco cumple el mínimo histórico. La suite gestual real pasó dwell, pan arriba/abajo y rotación, pero quedó en reacquisición durante la prueba de pérdida secundaria dentro de escala. En ese intervalo el gap máximo era 77,5 ms: este fallo específico no es evidencia de latencia >250 ms. El fixture retiraba siempre la primera foto, que MediaPipe podía haber adquirido como primaria. Se corrigió sólo esa preparación de entrada: el observador identifica la primaria actual y conserva su foto, retirando la secundaria; se añadió una aserción de continuidad durante esa retirada/reentrada. No se modifica ningún landmark, timestamp ni estado del controlador. El intento original permanece en la evidencia. La matriz y la suite se conservan por separado. No se extrapola el resultado a una webcam física móvil.

El smoke acotado del Atlas principal pasó Óseo, Muscular, Nervioso, búsqueda, selección de una estructura añadida y OFF/ON sin nuevas descargas. XR pasó 11 sistemas/92 módulos/1.240 mallas, opacidad, selección/ficha, isolate/hide/restore, Despiece y cleanup de ruta. No se repitió la campaña anatómica completa.

## Límites de la evidencia y siguiente diagnóstico

Las mediciones proceden del servidor de desarrollo y del vídeo sintético existente, no de una webcam física. Los observadores añaden trabajo acotado y usan memoria; se evita el inspector anatómico pesado durante ventanas críticas. Los perfiles CDP y screenshots quedan fuera. No se afirma coste cero de QA ni una medición de energía/temperatura o CPU exclusiva del driver.

Las primeras corridas guardaban hashes al finalizar y usaban un ring de 20.000 registros para RAF: una parte inicial de la timeline cruda pudo quedar fuera, aunque las métricas de cada ventana se calcularon en vivo antes del recorte. Se conserva una copia del observador original cuyo SHA-256 coincide con CPU v2. Las siguientes corridas capturan hashes al inicio y amplían el límite a 60.000 registros. La clasificación final de interrupciones se recalcula conservando los resultados originales; un solapamiento largo de inferencia y long task permanece UNKNOWN en lugar de forzar una causa.

Para desbloquear falta reproducir continuidad en sesiones independientes de la configuración objetivo, correlacionar las pausas residuales con planificación/driver a nivel del sistema y repetir las ventanas críticas y móvil. Sólo si una causa concreta demuestra mejora end-to-end se justifica modificar producto. No se inicia una fase de batching/LOD ni se declara PRODUCT_PERFORMANCE_LIMIT a partir de un único modo de navegador que contradice la ejecución headed aprobada.

## Métricas de las ventanas

Tiempos en ms. Cada grupo contiene **p50 / p95 / p99 / máximo**, sin promediar ventanas. La tabla B–H corresponde a una ejecución completa CPU headed; A se ejecuta aislado en navegador independiente. Todas las variantes, transiciones y pausas clasificadas están en el JSON enlazado al final.

| Etapa | Ventana | Muestras válidas | Gap de recepción | Inferencia | RAF p95 | Entradas lost | Resultado |
|---|---|---:|---|---|---:|---:|---|
| B | carga | 220 | 66.1 / 86.8 / 99.0 / 113.5 | 59.9 / 80.3 / 93.7 / 94.0 | 7.1 | 0 | PASS |
| B | estable | 213 | 69.7 / 90.5 / 104.2 / 111.7 | 63.3 / 82.2 / 95.0 / 101.8 | 7.1 | 0 | PASS |
| C | carga | 221 | 64.2 / 93.2 / 118.6 / 146.1 | 58.5 / 87.6 / 113.3 / 136.5 | 7.1 | 0 | PASS |
| C | estable | 239 | 61.8 / 76.2 / 95.6 / 104.2 | 55.6 / 69.5 / 90.7 / 96.6 | 7.1 | 0 | PASS |
| D | carga | 145 | 97.9 / 156.5 / 176.2 / 191.7 | 91.9 / 148.3 / 166.1 / 185.9 | 20.9 | 0 | PASS |
| D | estable | 171 | 83.4 / 121.2 / 143.8 / 150.5 | 77.2 / 114.7 / 138.0 / 145.0 | 13.7 | 0 | PASS |
| E | carga | 128 | 112.3 / 204.5 / 218.7 / 237.1 | 103.5 / 194.8 / 208.7 / 226.6 | 14.1 | 0 | PASS |
| E | estable | 108 | 135.1 / 184.4 / 203.7 / 223.6 | 127.1 / 177.9 / 196.0 / 215.6 | 27.7 | 0 | PASS |
| F | carga | 150 | 96.0 / 131.1 / 153.9 / 160.8 | 77.3 / 121.1 / 134.4 / 150.3 | 20.6 | 0 | PASS |
| F | estable | 140 | 100.2 / 146.4 / 170.9 / 180.5 | 79.7 / 123.8 / 147.2 / 159.5 | 20.7 | 0 | PASS |
| G | visibilidad | 123 | 118.8 / 153.9 / 178.1 / 182.7 | 106.8 / 140.5 / 166.9 / 170.9 | 20.7 | 0 | PASS |
| G | estable | 125 | 115.2 / 161.8 / 185.9 / 193.4 | 104.1 / 148.9 / 174.8 / 183.6 | 20.6 | 0 | PASS |
| H | visibilidad | 132 | 109.9 / 152.8 / 175.9 / 182.2 | 84.7 / 124.8 / 150.5 / 158.0 | 20.8 | 0 | PASS |
| H | estable | 140 | 99.4 / 141.6 / 174.7 / 191.1 | 80.1 / 121.4 / 154.5 / 168.9 | 14.2 | 0 | PASS |

| Mínimo independiente A | Muestras | Gap de recepción | Inferencia | Resultado |
|---|---:|---|---|---|
| baseline-cpu-minimal | 102 | 145.6 / 177.2 / 183.7 / 265.4 | 141.4 / 173.1 / 180.8 / 257.5 | NOT_PASSED |
| baseline-gpu-minimal | 268 | 55.9 / 63.5 / 67.5 / 73.2 | 45.3 / 52.4 / 56.6 / 61.8 | PASS |
| matched-cpu-minimal-headed | 218 | 56.0 / 145.0 / 149.6 / 156.1 | 43.3 / 139.0 / 144.8 / 151.5 | PASS |
| matched-gpu-minimal-headed | 269 | 55.7 / 61.6 / 66.5 / 74.2 | 40.5 / 47.8 / 51.8 / 54.8 | PASS |
| matched-cpu-minimal-headless | 270 | 55.6 / 58.8 / 61.3 / 62.2 | 42.1 / 45.6 / 46.8 / 48.3 | PASS |
| matched-gpu-minimal-headless | 271 | 55.7 / 62.0 / 64.7 / 67.4 | 27.5 / 32.1 / 35.2 / 37.4 | PASS |
| repeat-cpu-minimal-headed | 270 | 55.7 / 58.4 / 68.1 / 81.3 | 42.2 / 46.9 / 54.1 / 66.8 | PASS |

La repetición mínima CPU headless pasó con 62,2 ms de gap máximo frente al primer intento de 265,4 ms. Esa variación sobre el mismo producto es parte del resultado; no se descarta el intento fallido.

En la corrida adicional B–E se observaron exactamente 57 incorporaciones de grupos a escena. scene.add máximo 0,1 ms; bufferData máximo 1,3 ms; consultas/compilación de shader medidas máximo 0,1 ms; parse máximo 16,1 ms; Meshopt máximo 13,0 ms. Son costes de llamadas observadas, no una medida completa de trabajo asíncrono del driver. Las ocho ventanas pasaron y el gap máximo fue 184,1 ms.

Carga CPU headed, desde activación: Muscular muestra primera geometría a 75,5 ms y completa a 722,5 ms; Nervioso a 142,8/575,4 ms. La repetición headless degradada registra 236,8/2.560,4 y 467,5/2.056,9 ms, respectivamente. La finalización F incluye la separación deliberada de 900 ms entre toggles; Óseo incluye las compuertas QA descritas y no sirve como latencia de arranque sin instrumentación. El JSON conserva firstGeometryAfterActionMs y allGeometryAfterActionMs cuando la timeline permite observarlos.

## Reproducción y artefactos

Usar Node y las dependencias instaladas, Playwright y Chromium completo. XR_PLAYWRIGHT_MODULE admite la ruta del módulo Playwright; XR_BROWSER_EXECUTABLE debe señalar el mismo binario para comparaciones. Arrancar Vite en 127.0.0.1:5173. Cada --run debe ser nuevo: el harness rechaza sobrescribir un resultado. Ejecutar un navegador a la vez y no compilar, capturar ni perfilar CPU durante ventanas críticas.

```text
node scripts/xr/gesture-acceptance-inputs.mjs
node scripts/xr/tracking-performance-browser-qa.mjs --scenario=minimal --delegate=CPU --headed=true --run=minimo-nuevo
node scripts/xr/tracking-performance-browser-qa.mjs --delegate=CPU --headed=true --run=matriz-cpu-nueva
node scripts/xr/tracking-performance-browser-qa.mjs --delegate=GPU --headed=true --run=matriz-gpu-nueva
node scripts/xr/tracking-performance-browser-qa.mjs --delegate=CPU --run=matriz-headless-nueva
node scripts/xr/tracking-performance-browser-qa.mjs --delegate=CPU --headed=true --width=390 --run=matriz-mobile-nueva
node scripts/xr/tracking-performance-browser-qa.mjs --graphics=swiftshader --run=diagnostico-software-nuevo
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=controlled --scenario=atlas --suite=gestures --all-modules=true --run=control-nuevo
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=atlas --suite=gestures --all-modules=true --headed=true --run=gestos-nuevo
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=atlas --suite=gestures --all-modules=true --headed=true --width=390 --run=mobile-nuevo
node scripts/anatomy/unified-system-loading-qa.mjs --tracking-smoke
```

--profile=true añade CPU/GC después de la matriz; --through=E limita explícitamente la observación de publicación a B–E. --section=ui ejecuta sólo sistemas/slider/ficha para diagnosticar lo pendiente tras un fallo anterior; un PASS de ese subconjunto no sustituye la suite completa. El modo real atraviesa Worker/WASM/modelo; el controlado es una prueba independiente de controladores. El perfilador final devuelve código 1 si la matriz no pasa; los primeros intentos sólo señalaban el fallo en JSON. La fuente de aceptación de cada ejecución es result.json.status y windows[].pass.

El [JSON compacto](../research/anatomy/completion-final/xr-tracking-performance.json) conserva entorno, resultados, percentiles, interrupciones resumidas, timings de módulos, hashes del harness/inputs/GLB y referencias SHA-256 a las timelines locales. Las traces y perfiles completos permanecen en .cache/xr-tracking-performance y no se versionan. El resumen se genera con scripts/xr/summarize-tracking-performance.mjs a partir de los resultados y manifiestos locales de esta campaña.

Capturas revisadas, tomadas fuera de los intervalos críticos, sólo como contexto visual:

1. [Óseo con tracking](../research/anatomy/completion-final/xr-tracking-performance-captures/01-skeletal-tracking.png).
2. [Múltiples sistemas](../research/anatomy/completion-final/xr-tracking-performance-captures/02-multiple-systems.png).
3. [92 módulos, Tegumentario OFF](../research/anatomy/completion-final/xr-tracking-performance-captures/03-92-skin-off.png).
4. [92 módulos, Tegumentario ON](../research/anatomy/completion-final/xr-tracking-performance-captures/04-92-skin-on.png).
5. [Scroll de ficha aprobado, fuentes/licencia visibles](../research/anatomy/completion-final/xr-tracking-performance-captures/05-approved-card-scroll.png).

El intento baseline-cpu-headless terminó por un selector obsoleto del harness y figura como HARNESS_OR_RUNTIME_ERROR; la matriz íntegra corregida es baseline-cpu-headless-v2. No se contabiliza ese error como fallo del producto. La interrupción de SwiftShader está rotulada INTERRUPTED_DIAGNOSTIC. Los percentiles del observador usan orden empírico floor(n × p), sin interpolación.

El subconjunto real de UI móvil pasó sistemas/Tegumentario/slider y grace de ficha, sin pérdidas y con gap máximo 138,4 ms, pero no alcanzó el final de una ficha más alta dentro del límite fijo de diez desplazamientos. La captura muestra avance real. El harness final deriva el máximo de intentos de la distancia restante y de la aserción existente de avanzar más de 10 px por gesto; mantiene esa aserción, el destino final, todos los parámetros de scroll y los checks de continuidad. Así la cota sigue siendo finita y proporcional al contenido. Se guardan los intentos y posiciones finales en scrollRuns. El intento anterior no se convierte retroactivamente en PASS.

La repetición gestures-real-primary-aware-full92 falló antes de ejecutar gestos, al no adquirir tracking estable durante el plazo existente de 12 s. En ese intento se registraron 44 inferencias, p50/p95/p99/max 249,4/291,0/567,8/567,8 ms, y gaps entre muestras válidas 273,2/315,8/325,8/325,8 ms. Estos son valores del intento completo, incluido arranque; no una ventana crítica aprobada de 15 s. La preparación de pérdida secundaria aún no había sido ejecutada. Este fallo headed se conserva junto a la suite completa headed anterior que sí pasó.

La última repetición móvil, gestures-real-mobile-primary-aware-full92, llegó a la ventana inicial real de 15 s pero produjo sólo 56 muestras válidas: gap p50/p95/p99/max 258,6/402,0/424,1/424,1 ms e inferencia 236,4/356,7/399,7/399,7 ms. Los gestos posteriores no se ejecutaron. No se declara verificada con MediaPipe real la corrección de preparación secundaria ni el recorrido extendido de ficha en esa repetición; la continuidad inicial ya incumple los criterios. El fixture controlado sí volvió a completar todos los gestos tras corregir la foto primaria.

## Validación y auditoría

- npm run test:xr: **193/193 PASS**, incluidos seis tests nuevos del observador: máximos/p99, silencio al borde, reloj Worker, UNKNOWN, observaciones de controlador obligatorias y causalidad ambigua.
- npm run typecheck: **PASS**.
- npm run build: **PASS**, 4 páginas estáticas y 15 redirects de compatibilidad. Permanece el aviso existente de chunks mayores de 500 kB.
- git diff --check: **PASS**; se vuelve a verificar el índice completo antes del commit.
- verify:anatomy: **no ejecutado**, conforme a la instrucción de no repetirlo cuando anatomía está intacta.

El diff contra la base no contiene cambios en src/, public/, package.json, package-lock.json ni vite.config.ts. El generador de evidencia verifica los SHA-256 de los 92 GLB contra sus catálogos aprobados y el total de 1.240 mallas. Se conservan catálogos, owners, IDs, geometría, fuentes, educación, microanatomía, thresholds, gestos y la UI sin toggles de ampliación. Los cambios versionados se limitan al harness, observadores/tests QA, el smoke acotado, este documento, JSON compacto y cinco capturas. No se crean commits de producto, resolución global ni cierre anatómico. No push, merge, deploy, tag ni release.

La comprobación dirigida final de UI controlada a 390 px pasó scroll de sistemas, Tegumentario/slider, selección real para abrir ficha, grace/rearme del scroll, llegada a fuentes/licencia y cierre por dwell con la nueva cota finita de intentos. Es aceptación controlada del harness/UI; no sustituye la campaña MediaPipe real móvil bloqueada.

En los dos perfiles CDP separados, CPU headless v2 registró 7 MinorGC, p50/p95/p99/max 5,417/7,355/7,355/7,355 ms; GPU headless registró 13 eventos MinorGC/MajorGC, 2,528/76,627/76,627/76,627 ms. No se encontró evidencia suficiente para justificar pools ni atribuirles las interrupciones de otra ventana. El muestreo principal muestra trabajo de binding/setup/render de Three.js y tiempo idle/program; no equivale a CPU exclusiva del Worker.

En la matriz CPU headed, medido desde cada acción QA hasta el render con toda la geometría de esa etapa: B 231,2 ms, C 102,1 ms, D 841,1 ms, E 607,5 ms y F 7.004,9 ms. F incluye la separación deliberada de toggles; estos valores no son un before/after de producto. Las marcas desde el handler del sistema tienen otro origen y por eso no son idénticas a los timings desde la acción Playwright.
