# XR 1.5.1 — estabilidad del puntero y selección

Base: `ad7b5cf00b5b1ab21f49379e970e535a41f2db9c`, rama `phase-xr-experience`, árbol inicialmente limpio. Iteración local de estabilidad; la aprobación física queda pendiente del usuario.

## Feedback y diagnóstico

La prueba física de XR 1.5 mostró que apuntar y controlar el Atlas era posible, pero seleccionar requería muchos intentos. Se observaron pérdidas breves de mano, desplazamientos demasiado rápidos, saltos y cambios de objetivo al juntar índice y pulgar. Este feedback motivó los cambios; las simulaciones no sustituyen esa prueba.

Había cuatro causas tratables por separado: EMA fijo de 45 ms; ausencia de protección temporal de discontinuidades del índice; cancelación visual inmediata al faltar la mano; snapshot del hit instantáneo al iniciar pinch. Aumentar solamente el smoothing habría añadido retraso a todos los movimientos sin resolver las pérdidas ni el cambio de malla.

## Arquitectura y archivos

Flujo actual: resultado de MediaPipe → normalización existente → `HandStability` → punto filtrado compartido → router UI/anatomía → hit real → `TargetStability` de cada dominio → snapshot al iniciar pinch → acción existente al soltar.

Archivos nuevos:

- `src/features/xr/handStability.ts`: continuidad primaria, estados, cancelación y recuperación. Conserva `lastReliablePointer`, `lastReliableTime` y un único filtro compartido.
- `src/features/xr/targetStability.ts`: dwell e histéresis sobre resultados ya calculados.
- `scripts/xr/stability.test.mjs`: secuencias puras con ruido, discontinuidades, pérdidas y controles reales de interacción.
- `scripts/xr/stability-browser-qa.mjs`: DOM, GLB, raycast y controladores reales; vídeo y landmarks sintéticos.
- `scripts/xr/stability-performance-qa.mjs`: comparación reproducible del núcleo con fuentes del commit base, leídas con `git show` en `.cache`, sin cambiar de rama.
- Este documento.

Archivos modificados:

- `handConfig.ts`, `handPointer.ts`: parámetros centralizados, velocidad, EMA adaptativo y rechazo de saltos.
- `handInteraction.ts`: selección desde objetivo estable, punto compartido y feedback de estabilidad.
- `ui/handUiRouter.ts`, `ui/HandUiRegistry.ts`: dwell independiente, captura, hit slop y protección DOM.
- `useHandPointer.ts`: integración compartida Heart/Atlas, watchdog sin RAF nuevo, presentación de grace y diagnóstico.
- `XrCalibrationDebug.tsx`, `xr.css`: siete campos derivados y aro/atenuación del cursor.
- `gestures.ts`: sólo normalización de identificadores temporales cuando dos detecciones tienen el mismo label. El algoritmo y los valores de manipulación no cambian.
- Pruebas existentes: `atlas.test.mjs`, `gesture-ui.test.mjs`, `gestures.test.mjs`, `hand-interaction.test.mjs`, `selection.test.mjs`, `atlas-browser-qa.mjs`, `browser-qa.mjs`, `gesture-ui-browser-qa.mjs`, `hand-selection-browser-qa.mjs`, `physical-calibration-browser-qa.mjs`, `hand-browser-fixture.mjs`. Sus secuencias ahora respetan dwell/reacquire y el contrato de diagnóstico actual. El fixture permite inyectar timestamps repetidos. Se mantienen las comprobaciones de hold, movimiento, rotación, escala y selección con GLB reales.

Los archivos de aplicación anteriores pertenecen a `src/features/xr/`. No se añaden dependencias.

## Puntero y velocidad

Se usa la distancia euclídea entre muestras normalizadas válidas del índice dividida por `dt / 1000`. No se acumula velocidad. La constante temporal interpola linealmente entre 110 ms y 45 ms según esa velocidad. El factor EMA es `1 - exp(-dt / tau)`.

Una mano casi quieta recibe mayor filtrado; un movimiento rápido conserva respuesta. Router y anatomía reciben el mismo punto: no se filtra dos veces ni se modifica el midpoint utilizado por rotación/escala. La proyección conserva el aspect ratio, espejo y rectángulo real de XR. No hay snap ni clamp al borde.

NaN, coordenadas fuera del vídeo, timestamps duplicados/regresivos y gaps grandes no alimentan el filtro. Un desplazamiento que supera `min(0.25, 0.08 + 2.4 * dtSegundos)` se trata como discontinuidad. El punto nuevo no aparece inmediatamente. Una discontinuidad persistente debe completar pérdida y adquisición nueva.

## Tracking, grace y recuperación

| Estado | Presentación | Acciones |
| --- | --- | --- |
| tracking | Cursor normal; aro cyan si hay objetivo estable | Flujo normal |
| grace | Último punto filtrado inmóvil, atenuado | Ningún hit test, raycast, selección, cambio UI ni manipulación |
| lost | Cursor oculto | Gesto cancelado; adquisición nueva requerida |
| reacquiring | Cerca: punto previo y transición filtrada; lejos: oculto | Sin acciones hasta mano abierta y settle |

Grace dura hasta 380 ms desde la última muestra fiable. El candidato, pinch, captura UI y manipulación se cancelan **al comenzar** la pérdida. Mantener el cursor nunca mantiene una mano ficticia en el controlador. La selección educativa y el estado de capas permanecen intactos.

Si vuelve a ≤0.08 unidades normalizadas durante grace, el filtro conserva su punto anterior y reancla el tiempo/entrada cruda. Si vuelve lejos, se espera a declarar la pérdida real, se reinicia el filtro y se oculta el cursor durante la adquisición. No interpola atravesando la pantalla. Ambas recuperaciones exigen todas las manos observadas abiertas, ratio ≥0.43, durante 150 ms. Después se adquiere de nuevo el target mediante su dwell. No hay selección desde una mano recuperada cerrada.

Cuando dejan de llegar resultados por completo, el watchdog existente inicia cancelación/grace a los 250 ms y oculta después de 380 ms. Resultados con timestamps inválidos/repetidos no pueden posponerlo. Se usan timeouts, no otro RAF. Apagar cámara, salir de la página, ocultar la pestaña o usar controles manuales cancela inmediatamente, sin prolongar el cursor mediante grace.

## Mano primaria

La asignación utiliza continuidad espacial del índice. Con dos detecciones compara el coste total de mantener primaria y secundaria. Coincidir en Left/Right sólo desempata con un peso de 0.001; no es la identidad principal. Los controladores reciben identificadores temporales estables, sin modificar IDs anatómicos.

Durante grace la otra mano no puede reemplazar inmediatamente a la primaria. Tras pérdida real puede adquirirse otra, pasando por mano abierta y settle. La normalización conserva dos detecciones aunque sus labels coincidan momentáneamente. Se mantiene el umbral de handedness score ya existente (0.6); no se inventa confidence de landmarks.

## Objetivo anatómico y pinch

`rawTarget` es el resultado real del raycast; `stableTarget` se adquiere tras 150 ms consistentes, comparando el ID anatómico existente. Se refresca la metadata sin crear otro catálogo ni guardar geometrías.

Un A/B/A breve o vacío breve conserva A dentro de 18 px del último punto sobre A. Un B sostenido lo reemplaza tras dwell; vacío sostenido limpia el target. Alejarse más de 18 px cancela inmediatamente el target anterior y exige adquirir el siguiente. Esta histéresis sólo afecta la elección del objetivo, nunca la posición del cursor ni el raycast.

Al empezar pinch se guarda el **objetivo estable**. El candidate conserva ese snapshot, aunque el hit cambie después. Si todavía no hay target estable, se rechaza seleccionar una estructura cruda. Para deseleccionar se acepta un hit real vacío que haya permanecido durante el dwell. Un hit bloqueado/inválido no inventa selección.

Se conservan enter 0.34, exit 0.43, hold 550 ms y movimiento 0.040. Movimiento deliberado o hold convierten el candidato en la manipulación existente. Dos pinches siguen escalando; no se cambia su sensibilidad, límites ni algoritmo.

## UI, hit slop y sliders

La UI mantiene su propio `TargetStability`, con dwell de 120 ms. Los targets anatómicos y UI se limpian al cambiar de dominio abierto; el dueño de un gesto iniciado sigue gobernándolo hasta terminar/cancelar.

Los botones/toggles amplían sólo el hit gestual 10 px por lado; sliders 8 px verticales y 0 horizontales. Se mantiene el tamaño visual. Se comprueba el elemento superior real con `elementFromPoint`, visibilidad y registro explícito. El margen sólo existe sobre el fondo de un ancestro dentro del mismo panel autorizado. No atraviesa hermanos superpuestos, textos de otro control, header, canvas, controles sin registro ni paneles ocultos.

Un hit directo de otro control tiene prioridad. En márgenes solapados se comprueba la exposición del punto más cercano del rectángulo real; se resuelve por nivel visual, distancia y orden DOM como desempate determinista. Una muestra sólo produce un target. Un target estable distinto del control realmente alcanzado no puede capturarse a través de él.

Botón/toggle ejecuta una sola acción al soltar dentro del tiempo permitido. El máximo previo de tolerancia de captura (14 px) sigue sujeto a las comprobaciones de exposición. El slider necesita dwell para empezar; una vez capturado sigue directamente el **punto filtrado** y conserva captura fuera de su rectángulo, con min/max/step reales. No vuelve a estabilizar targets durante el arrastre. Pérdida, control eliminado/deshabilitado, entrada manual o cambios de superficie cancelan la captura. Grace no modifica ningún valor.

## Parámetros realmente implementados

| Parámetro | Valor |
| --- | --- |
| EMA casi quieto | 110 ms |
| EMA rápido | 45 ms |
| Velocidad lenta / rápida | 0.15 / 1.2 unidades normalizadas por segundo |
| Salto admisible | `min(0.25, 0.08 + 2.4 × dtSegundos)` |
| Gap de inferencia | 250 ms |
| Tracking grace | 380 ms desde última muestra fiable |
| Recuperación cercana | ≤0.08 unidades normalizadas |
| Reacquire settle abierto | 150 ms |
| Dwell anatomía | 150 ms |
| Stick radius | 18 px CSS |
| Dwell UI | 120 ms |
| Hit slop botón/toggle | 10 px por lado |
| Hit slop slider | 8 px vertical / 0 horizontal |
| Tolerancia máxima de captura botón | 14 px, sujeta a exposición |
| Pinch enter / exit | 0.34 / 0.43, intactos |
| Hold / movimiento | 550 ms / 0.040, intactos |
| Smoothing manipulación / sensibilidad rotación | 65 ms / 2π, intactos |
| Límites escala | 0.55–1.8, intactos |
| MediaPipe | 1.1.0; máximo 20 inferencias/s, un frame en vuelo |

## Diagnóstico

Sólo desarrollo con `?xrDebug=1`: Tracking, Cursor velocity, Raw target, Stable target, Stable time, Lost duration, Last pinch. Los targets muestran el nombre educativo existente o `none`. Last pinch admite select/rotate/cancel. No hay landmarks, historial, grabación, contadores de éxito, persistencia ni telemetría. En producción el parámetro no monta el panel. Durante hover no se generan anuncios educativos adicionales.

## Validación técnica

Evidencias locales en `.cache/xr-stability/` (ignorada por Git). Validación final:

| Comprobación | Resultado |
| --- | --- |
| `npm run test:xr` | 118/118, cero fallos |
| `npm run typecheck` | Aprobado |
| `npm run verify:anatomy` | Aprobado; ejecutado una sola vez al final |
| `npm run build` | Aprobado; 4 páginas estáticas y 15 redirecciones de compatibilidad |
| `git diff --check` | Sin errores |

Se usó el adaptador local Rollup WASM ya existente mediante `NODE_OPTIONS=--require=./.cache/home-redesign/rollup-wasm.cjs`, sin instalar dependencias. Permanece el aviso previo de chunk >500 kB. Las páginas existentes también emiten el aviso de deprecación de `THREE.Clock`; no hubo errores JS ni HTTP ni overflow.

`npm run test:xr`: 118 pruebas, incluidas 27 nuevas de estabilidad. Cubren fast/slow EMA, jitter pequeño/moderado, outlier, entradas/dt inválidos, grace sin acciones, recuperación cercana/lejana, mano cerrada, cambio de label, continuidad primaria, target A/B/A/vacío, snapshot stable A/raw B, UI dwell, slider fuera del rectángulo, cancelación, manipulación y valores calibrados.

QA de estabilidad: 12 capturas numeradas, revisadas visualmente, y diez grupos de aserciones aprobados. El caso de borde observa el controlador y raycast reales: raw Fémur izquierdo (`bp3d:FMA24475`) sólo al iniciar pinch, stable Rótula izquierda (`bp3d:FMA24487`), selección final Rótula. No se inyecta la selección. La preparación de endpoints sintéticos del caso de borde invierte matemáticamente el EMA, sin cambiar el filtro de aplicación. La instrumentación de desarrollo sólo observa métodos y usa la URL exacta del módulo cargado, incluido el timestamp de Vite, para evitar observar otra instancia tras HMR. Las regresiones funcionales también corren sobre el build de producción.

El mismo script prueba el registry con DOM real: slop, controles cubiertos/ocultos, margen compartido, prioridad visual, control directo y header. La pérdida breve medida duró 222.4 ms: cursor retenido, cero raycasts nuevos y selección conservada. También se probó pérdida >380 ms, regreso cerrado y resultados repetidos durante 500 ms, sin acciones falsas. Vídeo, ruido, outliers, pérdidas y cambios de label son sintéticos y están identificados así en las capturas.

Regresiones aprobadas: `gesture-ui-browser-qa` (capas, opacidad, Despiece, aislamiento, ocultación, restauración, conflictos y cinco anchuras), `hand-selection-browser-qa` (13 resultados), `physical-calibration-browser-qa` (10), `selection-browser-qa`, `atlas-browser-qa` y `browser-qa`. Cubren mouse, touch real simulado por el navegador, teclado, rotación/escala, MediaPipe/Worker/WASM reales sobre vídeo sintético, cámara y limpieza de recursos. Home, Anatomía, About, Corazón, Pulmones y Encéfalo cargaron correctamente.

Network: 7 GLB óseos → 25 con Muscular → 32 con Cardiovascular; cero GLB de otros sistemas y ninguna recarga causada por selección/estabilización. Los 32 módulos mantienen 549 meshes y 2,083,326 triángulos. Heart conserva un único canvas y una descarga de `heart.glb` en su regresión.

Auditoría: el diff de `public/`, `src/features/anatomy/`, `package.json` y `package-lock.json` frente a la base está vacío. El blob de `heart.glb` coincide con la base: `d684eb1025958ce0c6d7e336688b72e3f21c4962`. No cambian GLB, geometrías, modelos, catálogo, IDs anatómicos, transforms, BodyParts3D, educación/fichas, atlas principal/cámara/capas, loaders, asset manager, algoritmo de Despiece, MediaPipe 1.1.0 ni `hand_landmarker.task`.

Para reproducir: ejecutar las suites con Node y las rutas a Playwright/Chrome disponibles en el equipo, mediante `XR_PLAYWRIGHT_MODULE` y `XR_BROWSER_EXECUTABLE` o los dos argumentos existentes. El script de estabilidad usa producción en `http://127.0.0.1:5184` y Vite en `http://127.0.0.1:5173`, configurables con `XR_QA_ORIGIN` y `XR_QA_DEV_ORIGIN`. La comparación pura se ejecuta con `node --experimental-strip-types scripts/xr/stability-performance-qa.mjs`.

## Rendimiento orientativo

Comparación local del build XR 1.5 antes de modificarlo y del build final XR 1.5.1. Chrome headless 1366×1000; ventanas de tres segundos por carga; hover UI sintético, callbacks completos medidos con `performance.now()`. No se ejecutó otra suite de navegador simultáneamente con estas mediciones. No es un benchmark físico ni una medida de FPS.

| Carga | Callback XR 1.5 | Callback XR 1.5.1 | Diferencia |
| --- | --- | --- | --- |
| Óseo, 205 meshes | 0.494 ms | 0.604 ms | +0.109 ms |
| + Muscular, 387 meshes | 0.418 ms | 0.478 ms | +0.060 ms |
| + Cardiovascular, 549 meshes | 0.411 ms | 0.437 ms | +0.026 ms |

Media de las tres cargas: 0.441 → 0.506 ms por callback, +0.065 ms. Son muestras cortas sujetas a scheduling, layout y GC; no se afirma una mejora ni un coste universal. Se eliminaron lecturas duplicadas del rectángulo de proyección y la segunda resolución DOM del mismo hit antes de la medición final.

El worker MediaPipe real, con vídeo sintético, entregó aproximadamente 17.96–18.24 resultados/s en XR 1.5.1 (XR 1.5: 17.55–18.24). Siguen el límite de 20/s y un frame en vuelo del código intacto de sesión. Draw calls: 205/387/549, iguales a la base.

Comparación adicional del núcleo puro, siete rondas alternadas de 50,000 muestras con calentamiento y puertos deterministas, sin DOM ni coste de Three.js: mediana de anatomía 0.001029 → 0.001455 ms (+0.000426); UI 0.000505 → 0.001144 ms (+0.000639). Incluye smoothing, continuidad, dwell e histéresis. Sus cifras no deben extrapolarse al coste total del navegador. Evidencias: `performance-core.json` y `.cache/xr-gesture-ui/performance-xr15.json` / `performance-xr151.json`.

## Limitaciones y prueba física pendiente

Los parámetros son un punto de partida informado por el feedback, no una calibración física aprobada. Una mano que se mueve muy deprisa puede tratarse conservadoramente como discontinuidad. Dos manos superpuestas o cruzándose muy cerca pueden seguir siendo ambiguas: continuidad espacial no equivale a un identificador biométrico. Los dwell y la apertura tras pérdidas añaden una espera deliberada. Las superficies muy finas u ocluidas siguen limitadas por la geometría real. Hit slop se restringe al panel autorizado; no alcanza a través de una ficha superpuesta.

La prueba sintética no mide iluminación, piel, distancia de cámara, fatiga ni reconocimiento real de la mano. No se afirma ≥8/10 ni que el problema físico esté solucionado.

Prueba exacta para el usuario:

1. Iniciar la app local y abrir `/med3d/experiencia-xr/?xrDebug=1` en desarrollo. Elegir Atlas XR y activar control con manos. Mantener la misma iluminación/distancia durante la prueba.
2. Mano abierta 15 segundos sobre un hueso: contar pérdidas visibles y saltos grandes. Anotar si aparece grace/reacquiring. No hacer pinch.
3. Realizar 10 selecciones anatómicas naturales, alternando estructuras. Apuntar, esperar el aro cyan y hacer pinch breve; contar aciertos al primer intento y rotaciones accidentales. No contar reintentos como aciertos iniciales.
4. Realizar 10 activaciones de Muscular u otros botones/toggles visibles. Contar aciertos iniciales y dobles activaciones.
5. En Despiece (rango 0–100), intentar 25%, 50% y 75%. En opacidad, cuyo mínimo real es 10%, usar los valores mostrados. Anotar facilidad para llegar y mantener el valor y qué ocurre al soltar.
6. Sacar parcialmente la mano y volver cerca; repetir volviendo lejos y con pinch cerrado. Comprobar cursor atenuado durante la pérdida breve, ninguna acción, recuperación abierta y ausencia de trayectorias grandes por la pantalla.
7. Repetir una selección y rotación en Corazón XR. Reportar: pérdidas/saltos en 15 s; anatomía x/10; botones x/10; rotaciones accidentales; sliders; retorno cercano/lejano; navegador/cámara/iluminación.

Objetivo de aceptación física posterior: anatomía ≥8/10 y botones ≥8/10 al primer intento, sin rotaciones accidentales significativas ni saltos grandes en pérdidas breves. Sólo el reporte físico del usuario puede aprobarlo.

No se inicia XR 1.6, otros sistemas, Meta Quest ni XR Fase 2. Entrega mediante commit local; sin push, merge ni deploy.
