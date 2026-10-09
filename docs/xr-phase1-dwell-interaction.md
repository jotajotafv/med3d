# XR 1.5.2 — Dwell interaction

Base: `da30a4274cfe348a64edeaddfd05f84c4564c38d`, rama `phase-xr-experience`.

La prueba física del usuario confirmó que el índice y la estabilización de XR 1.5.1 funcionaban mejor, pero cerrar índice y pulgar desplazaba el puntero antes de seleccionar. Esta iteración separa las intenciones: **apuntar para seleccionar o activar controles; pinch para manipular**. Los informes anteriores conservan la historia de las calibraciones anteriores.

## Arquitectura y tiempo

`dwell.ts` contiene un controlador puro, compartido por `HandInteraction` y `HandUiRouter`. Recibe el objetivo estable y el timestamp monotónico de la inferencia. Sus estados son `idle`, `dwelling`, `paused`, `fired` y `sliderCaptured`. Devuelve una acción sólo cuando se cumplen **1000 ms** desde la adquisición del objetivo estable. A 999 ms no activa. No hay temporizadores por botón ni por estructura.

Se conserva la cadena de XR 1.5.1: índice filtrado → limitador de saltos → continuidad de mano primaria → recuperación con mano abierta → hit test del dominio → `TargetStability` → dwell. El umbral de adquisición anatómica sigue en 150 ms y el de UI en 120 ms; estos tiempos preceden a los 1000 ms de activación. No se reinicia por uno o dos hits raw diferentes mientras el objetivo estable sigue siendo el mismo. El radio de adherencia sigue en 18 px; el hit slop de controles sigue en 10 px y el margen vertical de sliders en 8 px.

El hook escribe atributos y una variable CSS en el cursor existente una vez por inferencia. Un anillo cónico fino cyan interpola visualmente los cambios mediante CSS. No añade RAF, raycasts por frame ni estado React de progreso. `prefers-reduced-motion` elimina la interpolación y el pulso. El anillo es decorativo, `aria-hidden`; la selección sigue usando el anuncio accesible existente, sin anuncios de porcentajes o de hover.

## Cancelación, pérdida y rearme

Cambiar el objetivo estable, alejarse realmente, iniciar pinch o entrada manual, ocultar/deshabilitar el control, cambiar de modo o desmontar interrumpe el dwell. Los timestamps duplicados, atrasados o inválidos no avanzan el controlador ni aplazan el watchdog.

La pérdida conserva la seguridad de XR 1.5.1 y atenúa el cursor. **No hay raycast, avance, activación ni actualización de slider durante la pérdida.** Un dwell pendiente puede conservar su progreso si la mano regresa cerca dentro de `DWELL_GRACE_RESUME_MS = 225`. Se mide desde la última muestra fiable hasta el primer regreso fiable, no hasta el final del settle. Debe superar de nuevo los 150 ms de mano abierta y la adquisición del mismo objetivo estable. Esos intervalos tampoco suman progreso; el primer resultado que lo recupera no dispara una acción. Regreso lejano, pérdida más larga, otro objetivo o mano cerrada reinician el progreso. Una desaparición libera inmediatamente el slider, incluso durante grace.

La activación queda enclavada antes de invocar el callback. Mantenerse 3–5 segundos sobre el objetivo no repite la acción, incluso si el callback restablece la vista. Cancelar, perder tracking o hacer pinch tampoco rearma por sí solo un objetivo ya ejecutado. Hace falta otro objetivo estable o vacío estable y volver a entrar. El vacío puede rearmar, pero **nunca deselecciona por dwell**. Escape, cerrar ficha y los mecanismos manuales conservan la deselección.

## Anatomía, Heart y UI

El raycast, el mapping por ID, `selectedStructure`, los materiales de resaltado y las fichas existentes se reutilizan sin duplicarlos. Heart conserva sus **14 meshes seleccionables, 9 lecciones y 5 registros parciales**. Atlas conserva **32 módulos y 549 meshes** de los tres sistemas del piloto. No se crean subdivisiones, geometrías, IDs ni textos educativos.

Botones y toggles registrados utilizan el mismo dwell de 1000 ms. Se invocan las acciones existentes de Aislar, Ocultar, Restaurar conjunto/estructuras, Cerrar ficha, Restablecer vista, Restaurar atlas, capas y panel de sistemas. Los inputs siguen siendo nativos. La UI, los textos inertes y las superposiciones bloquean la anatomía posterior; no hay raycast anatómico mientras la UI posee el puntero. Los controles ocultos, deshabilitados o cubiertos no activan.

La captura de sliders comienza después del dwell completo. Desde la siguiente inferencia fiable, la X filtrada se mapea al rectángulo DOM actual y a `min`, `max` y `step` reales, sin pinch. Opacidad usa el input **10–100** y `systemOpacity`; Despiece usa **0–100** y `explodedAmount`. El aro fijo y el indicador horizontal muestran captura. No se duplica estado ni cambia el algoritmo de explosión.

Salir por arriba o abajo más de **60 px** del rectángulo del slider durante **300 ms continuos** libera la captura. Volver a la banda reinicia ese plazo. Mientras está fuera se congela el valor para que el movimiento de salida no lo altere. Pérdida, pinch de cualquiera de las manos, entrada manual, control oculto/deshabilitado, cambio de superficie durante captura o teardown liberan inmediatamente. Se consume un estado abierto de todas las manos para reanclar antes de volver a anatomía. La segunda mano no escala durante captura.

Pinch sobre UI cancela y bloquea el paso al cuerpo hasta abrir las manos. Pinch iniciado sobre anatomía conserva su dominio mientras se manipula. Se mantienen movimiento `.040`, hold `550 ms`, sensibilidad, EMA y límites de escala **0.55–1.80**. El pinch corto ya no selecciona ni deselecciona. Mouse, touch y teclado conservan su respuesta inmediata y prioridad sobre manos.

## Interfaz, accesibilidad y diagnóstico

Se actualizan las guías de Atlas y Heart y el estado de preparación de rotación. Se reutilizan fichas, headings, botones de cierre, foco, anuncios y bottom sheet responsive. No se añaden mensajes técnicos al producto.

El panel de desarrollo exige `import.meta.env.DEV` y `?xrDebug=1`. Añade estado, tiempo, porcentaje de dwell y slider capturado a los datos derivados de estabilidad. Sigue limitado a actualizaciones de diagnóstico, sin historial, almacenamiento ni telemetría; no aparece en producción aunque se añada la query.

## Pruebas y evidencia

`scripts/xr/dwell.test.mjs` prueba límites de tiempo, latch/rearme, dominios, stale results, pausa/recuperación, cancelación, jitter, sliders y prioridad. Las pruebas existentes de interacción, UI, estabilidad y GLB reales evolucionan sus expectativas de selección de pinch a dwell; conservan las comprobaciones de manipulación, materiales, datos y controles manuales.

`scripts/xr/dwell-browser-qa.mjs` utiliza DOM, inputs, GLB, raycasts, tarjetas y controladores reales. Sólo cámara y landmarks son sintéticos, identificados en la evidencia. Observa las clases de desarrollo sin sustituir sus decisiones. Incluye un borde entre dos meshes reales con hits raw alternantes y objetivo estable persistente, activación única, acciones de ficha, capas, captura/salida, pérdida/recuperación, manipulación, Heart, mobile, teclado, touch, cleanup y oclusión/hit slop del registro.

Evidencia local ignorada por Git: `.cache/xr-dwell/`. Capturas: progreso 25/50%, selección, ficha, toggle, slider capturado, Despiece, grace, Heart y mobile. Las pruebas anteriores que describen selección por pinch son evidencia histórica de su iteración; el escenario de aceptación gestual actual es `dwell-browser-qa.mjs`.

Resultados finales:

- `npm run test:xr`: **145/145**, sin fallos ni pruebas omitidas.
- `npm run typecheck`: correcto.
- `npm run verify:anatomy`: correcto, ejecutado **una sola vez** al final de esta iteración.
- `npm run build`: correcto, con el aviso preexistente del chunk Meshopt superior a 500 kB. Se usó el adaptador Rollup WASM local ya existente del entorno, sin modificar dependencias.
- `git diff --check`: correcto.
- QA de dwell: **17 grupos de resultados**, incluidos los 16 escenarios solicitados, jitter entre meshes reales, oclusión DOM y comprobación del build de producción. Sin errores JavaScript.
- QA manual de producción: **3 grupos**, click/tap A→B, rotación/escala, Escape, cierre/foco, restauración exacta, canvas conservado, GLB único y cámara con MediaPipe real sobre vídeo sintético.
- Regresión de Home, Anatomía, About, Corazón, Pulmones y Encéfalo: **6/6**, sin errores JavaScript/HTTP ni desbordamiento horizontal. Persisten los avisos previos de `THREE.Clock` en el Atlas/exploradores.
- Diez capturas del recorrido revisadas y una adicional de mobile en producción (`11-mobile-produccion.png`), sin panel debug aunque se solicite mediante query.

Para ejecutar el recorrido se requieren desarrollo y build servido localmente (por defecto puertos 5173 y 5184). Se admiten `XR_QA_DEV_ORIGIN` y `XR_QA_ORIGIN`. Comando: `node scripts/xr/dwell-browser-qa.mjs <módulo-playwright> <ejecutable-browser>`.

## Coste y red

No se modifica MediaPipe, su frecuencia, el worker, el modelo ni la carga de recursos. La UI no añade consultas anatómicas; la anatomía se consulta por inferencia cuando corresponde. El progreso del anillo sólo interpola CSS.

Comparación orientativa del callback del worker en Chrome local, build de producción, tres ventanas de 3 s. El benchmark nuevo apunta a **Restablecer vista** en ambas revisiones y comprueba las mismas 205/387/549 llamadas de dibujo; no compara un toggle que apaga geometría en una versión con un hover que no la apaga en la otra. El build base se preservó antes de generar el nuevo y se comprobó el bundle servido.

| Capas cargadas | XR 1.5.1, ms/callback | XR 1.5.2, ms/callback |
| --- | ---: | ---: |
| Óseo | 0.372 | 0.478 |
| + Muscular | 0.435 | 0.465 |
| + Cardiovascular | 0.417 | 0.450 |
| Media de las tres ventanas | **0.408** | **0.464** |

Diferencia aproximada: **+0.056 ms/callback**, alrededor del 14% en esta ejecución, con variación entre ventanas. Son costes CPU orientativos, no FPS ni una garantía de rendimiento físico. El control con MediaPipe real sobre vídeo sintético dio 17.91–18.24 inferencias/s en el build nuevo; no se cambia su configuración.

El benchmark puro de 7 rondas alternadas × 50 000 resultados, sin DOM ni raycast Three.js, dio medianas de 0.001025 → 0.001077 ms para anatomía y 0.000649 → 0.000720 ms para UI. Incluye ciclos de dwell y pinch; su escala no debe confundirse con el callback completo.

Reproducción: `scripts/xr/dwell-performance-qa.mjs` extrae la base con `git show` sin cambiar de rama. `scripts/xr/dwell-callback-performance-qa.mjs` acepta módulo Playwright, ejecutable de navegador, etiqueta y origen como argumentos. Los harness usan el Playwright ya disponible en el entorno, sin añadir dependencias al proyecto. Resultados: `.cache/xr-dwell/performance-core.json`, `performance-xr151-callback.json` y `performance-xr152-callback.json`.

Red comprobada: **7 → 25 → 32 GLB** del piloto, **0** de otros sistemas. La página Heart en producción pidió únicamente `heart.glb` entre los modelos; mantiene sus recursos propios.

## Archivos de la iteración

Creados:

- `src/features/xr/dwell.ts`
- `scripts/xr/dwell.test.mjs`
- `scripts/xr/dwell-browser-qa.mjs`
- `scripts/xr/dwell-performance-qa.mjs`
- `scripts/xr/dwell-callback-performance-qa.mjs`
- `docs/xr-phase1-dwell-interaction.md`

Modificados:

- `src/features/xr/handConfig.ts`, `handInteraction.ts`, `handStability.ts`, `types.ts`, `useHandPointer.ts`
- `src/features/xr/ui/handUiRouter.ts`
- `src/features/xr/XrCalibrationDebug.tsx`, `XrHeartExperience.tsx`, `xr.css`
- `src/features/xr/atlas/XrAtlasExperience.tsx`
- `scripts/xr/atlas.test.mjs`, `gesture-ui.test.mjs`, `hand-interaction.test.mjs`, `selection.test.mjs`, `stability.test.mjs`

## Alcance auditado y limitaciones

El cambio se limita a `src/features/xr/`, pruebas/QA en `scripts/xr/` y este documento nuevo. GLB, geometrías, catálogos, IDs, datos educativos, transformaciones anatómicas, Atlas principal, loaders/asset manager, Exploded View estable, MediaPipe, modelo de manos, dependencias y demás páginas permanecen intactos. La documentación previa se conserva. No hay push, merge ni deploy.

La activación ocurre en la primera inferencia fiable que alcanza el umbral: la latencia observable incluye adquisición y cadencia de cámara, además de 1000 ms. CSS muestra el progreso entre resultados; no autoriza acciones. La continuidad de mano usa las señales espaciales existentes, no una identificación física de la persona. La geometría visible y sus oclusiones limitan la selección real. Las medidas de CPU y los landmarks sintéticos no acreditan ergonomía física, precisión clínica ni FPS.

## Recorrido físico pendiente

1. **Selección:** apuntar diez estructuras distintas y mantener aproximadamente un segundo. Anotar nombre, primer intento sí/no y observaciones. Objetivo orientativo: al menos 9/10.
2. **Botones:** Muscular cinco entradas/salidas y Cardiovascular cinco, alternando ON/OFF. Contar fallos y comprobar que mantener el puntero cinco segundos no repite. Objetivo: al menos 9/10 activaciones y cero repeticiones.
3. **Sliders:** capturar y llevar Opacidad a 25/50/75%, luego Despiece a 25/50/75%. Salir verticalmente; confirmar liberación sin pinch, sin saltos del modelo y sin un segundo dwell.
4. **Tracking:** retirar brevemente la mano con progreso incompleto. Regresar cerca y lejos. Confirmar pausa/reset adecuado, mano abierta para recuperar y ninguna acción durante pérdida.
5. **Manipulación:** pinch y rotación sin abrir fichas; dos pinches y escala. Con slider activo, comprobar que la segunda mano no escala.

**Pendiente de la prueba física del usuario.** No se afirma haber alcanzado 9/10. Esta entrega termina en XR 1.5.2: no inicia XR 1.6, otros sistemas, Meta Quest ni XR Fase 2.
