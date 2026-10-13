# Aceptación gestual XR — checkpoint de diagnóstico

Base: 1b67eaead6b6c39a3fa4fb748b7d3328b20582f1. Rama: phase-anatomy-completion-nonfemale. Fecha: 2026-10-13.

**ENVIRONMENT_BLOCKED.** La suite funcional completa controlada y una campaña completa con MediaPipe real pasan en desktop. La campaña prolongada y escalonada vuelve a interrumpir tracking bajo carga, incluso con GPU y ventana. No se emite el commit documental de aceptación global ni se modifica el cierre anatómico existente.

[Resultados por intento](../research/anatomy/completion-final/xr-gesture-acceptance.json), incluidos fallos, transiciones, entorno y hashes. Las [capturas funcionales](../research/anatomy/completion-final/xr-gesture-captures/) se versionan. Los timelines completos permanecen en las rutas de caché indicadas y tienen SHA-256.

## Diagnóstico

- El fixture anterior sustituía window.Worker por landmarks programados. Su vídeo mostraba fondo/texto, sin mano detectable. La prueba anterior del Worker/WASM comprobaba transporte e inferencias, no aceptación de gestos reales. No se reclasifica aquella evidencia como PASS de MediaPipe.
- chromium_headless_shell usa SwiftShader en este equipo. Chromium completo permite Intel UHD / D3D11 tanto headless como headed. El nuevo harness selecciona explícitamente Chromium completo; mantiene un override para reproducir el contraste.
- Forzar SwiftShader en el mismo Chromium completo 149.0.7827.55, escena, DPR 1 e input impide adquirir continuidad: recepción mediana 695 ms, inferencia mediana 659 ms y RAF mediano 181 ms. Sólo hay una frame en vuelo. D3D11 mantiene los 15 s sobre Óseo.
- El mínimo real sin GLB mantiene 195 muestras válidas en 15,019 s sin pérdidas; inferencia mediana 70 ms. La campaña funcional desktop real completa 23 tramos críticos sin grace, lost ni reacquiring.
- Persisten picos reales: una pasada fallida de pan registra detectForVideo de 350 ms, sin long task simultánea en el hilo principal, con vídeo visible, avanzando y readyState 4. Las campañas escalonadas reproducen interrupciones con GPU y ventana. Callbacks de controladores y bitmaps son mucho más breves. El watchdog de 250 ms detecta demoras reales.

No se atribuye toda demora a GC: no se perfiló por separado. La duración del Worker es tiempo de pared, que incluye planificación; no CPU exclusiva. RAF tampoco representa FPS de GPU. Hay evidencia causal de limitación de runtime/render bajo carga; no sólo timeouts ni un bug demostrado del controlador.

## Capas e instrumentación

**A — controlled:** sustituye deliberadamente la salida del Worker. Valida controladores e interrupciones programadas; no se presenta como MediaPipe real.

**B — real:** vídeo canvas 640×480 con fotografías de manos, captureStream(0) y requestFrame aproximadamente cada 50 ms. Un marcador alterna para distinguir frames. Conserva createImageBitmap, transferencia, Worker, WASM, modelo local, configuración CPU y resultados originales. El temporizador de detectForVideo se inserta sólo en la respuesta de desarrollo interceptada; sus mensajes QA no llegan al producto.

Se conservan timestamps de RAF, reloj, frecuencia máxima y una frame en vuelo. La fuente puede producir 20 frames/s y la inferencia ir más lenta. Las imágenes se trasladan, escalan y giran junto a bordes para mantener la mano dentro del vídeo. El puño produce un ratio pulgar–índice aproximado de 0,2: es un estímulo cerrado del fixture, no un pinch físico grabado. Nunca se sustituyen landmarks en la capa real.

Referencias: [test oficial de HandLandmarker](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/python/test/vision/hand_landmarker_test.py) y [assets de pruebas](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/testdata/vision/BUILD). URLs y hashes están en el manifiesto QA. Los originales quedan en caché; no se añaden a producción ni a fuentes anatómicas.

Los observadores llaman a las clases originales y conservan sus retornos. Registran captura, envío/recepción, inferencia, hands, último sample válido, tracking, settling, dwell, target, captura UI, gesto, RAF, long tasks y estado del vídeo. Acumulan arrays acotados; no imprimen por frame ni inyectan pose, selección o captura.

## Archivos y correcciones del harness

- gesture-acceptance-browser-qa.mjs: navegador nuevo, plazos por operación, persistencia y protección contra sobrescribir intentos.
- gesture-acceptance-fixture.mjs: inputs y observadores.
- gesture-minimal-qa.tsx: página interceptada sólo por Playwright, sin GLB/ruta publicada; hooks originales.
- gesture-acceptance-scenarios.mjs: DOM, raycast, controles, gestos y carga mediante la UI existente.
- gesture-acceptance-inputs.mjs: descarga QA y verificación SHA-256.
- summarize-gesture-acceptance.mjs: consolidación, auditoría de timelines y capturas.

Rearmar dwell requiere salida estable; retirar la mano no borra el latch. Se prueba continuidad sobre el panel, porque Restablecer vista termina tracking deliberadamente. El slider recién añadido por Tegumentario se alcanza con otro scroll gestual. La captura se lee del router actual después de suspend/resume, evitando un snapshot obsoleto.

La escala compara pan con la posición estabilizada de inicio: cambiar de foto abierta a cerrada desplaza ligeramente el centro estimado. En 390 px se usan canvas y superficie reales; las posiciones de desktop podían apuntar fuera o activar un botón.

Las capturas funcionales se toman después de soltar. Inspección de geometrías, búsqueda del punto seleccionable y serialización grande quedan fuera del gesto. La segunda campaña de carga espera cinco segundos de tracking estable, con plazo de 30 s; conserva las pérdidas de preparación y todas las aserciones de los 15 s medidos, incluida reacquisición.

**Producción intacta:** dwell 1000 ms, grace 380 ms, watchdog 250 ms, thresholds, smoothing, pinch, pan, escala, cursor, prioridad UI y MediaPipe no cambian.

## Cobertura

Dwell sin fire prematuro, una activación al mantener y rearmado; scroll hasta Tegumentario, activación y slider; ficha hasta fuentes/licencia y cierre prioritario; pan arriba/abajo; rotación sin selección; escala aislada/combinada; límites 0,55/1,8; pérdida de segunda mano sin salto y reanchor. Interrupciones intencionales de 150 y 650 ms verifican grace, pérdida y recuperación; la ficha comprueba conservación/liberación de captura y rearmado.

Scroll/slider exigen pose idéntica y ausencia de selección incidental. Cada tramo crítico exige continuidad. Las pérdidas intencionales para soltar/fotografiar se marcan; no se afirma ausencia de lost durante todo el intento.

Carga: A mínimo separado; B Óseo; C panel; D cuatro sistemas/39 módulos; E once históricos/52; F 92 con piel oculta; G piel; H sin capturas; I con capturas. I es diagnóstico. Hay interrupciones sin screenshots. Algunas filas continuas quedan bajo la aserción conservadora de 100 muestras/15 s; el bloqueo se fundamenta también en pérdidas reales de otras filas, no sólo en ese recuento.

DPR 1 / 0,75 / 0,5 conserva canvas 1056×680 en headless: el producto tiene mínimo 1. GPU pasa los tres contrastes; SwiftShader falla también con 0,75 y 0,5. Bajar DPR del contexto no es una solución.

## Reproducción

Servidor Vite local y Playwright/Chromium instalados. XR_PLAYWRIGHT_MODULE admite una ruta al módulo; XR_BROWSER_EXECUTABLE selecciona otro binario (por defecto chromium.executablePath). XR_QA_DEV_ORIGIN y XR_QA_OUTPUT cambian origen/carpeta.

~~~text
node scripts/xr/gesture-acceptance-inputs.mjs
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=minimal --run=nuevo
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=controlled --scenario=desktop-nuevo --suite=gestures
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=desktop-nuevo --suite=gestures --headed=true
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=mobile-nuevo --suite=gestures --headed=true --width=390
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=carga-nueva --suite=load --headed=true
node scripts/xr/gesture-acceptance-browser-qa.mjs --mode=real --scenario=software-nuevo --graphics=swiftshader
~~~

Usar nombres nuevos para conservar intentos. La consolidación lee decision.json, required-attempts.json y validation.json de la caché de campaña; el JSON versionado conserva la decisión y listas exactas.

## Condición pendiente

Hace falta un entorno que mantenga entregas del pipeline real dentro de las condiciones vigentes bajo las cargas del atlas, y una nueva campaña que lo demuestre. No se prescribe ampliar watchdog ni suavizar aserciones. No hay evidencia que justifique un fix de producto. No se afirma prueba con webcam física.

Validación final y resultados responsive: ver detalle consolidado. No se repiten typecheck/build al no cambiar producto, ni verify:anatomy; no se descarga o reconstruye anatomía. Sin push, merge, deploy, tag o release.

## Resultado final de la campaña

| Etapa | Controlled / GPU | Real headless / GPU | Real headed / GPU |
| --- | --- | --- | --- |
| B Óseo | PASS | PASS | PASS |
| C panel | PASS | PASS | Interrupción |
| D cuatro sistemas | PASS | Interrupciones | PASS |
| E once históricos | PASS | PASS | Interrupciones |
| F 92 módulos sin piel visible | PASS | PASS | PASS |
| G piel visible | PASS | Reacquisición | Interrupciones |
| H sin capturas | PASS | PASS | Continuo; 98 muestras, bajo el mínimo QA |
| I con capturas (diagnóstico) | PASS | PASS | Continuo; 94 muestras, bajo el mínimo QA |

La suite funcional desktop pasa completa en ambas capas. En **390 px**, la suite controlada también pasa completa; MediaPipe real queda bloqueado antes de los gestos por continuidad insuficiente: 64 muestras válidas/15,023 s, recepción p95 de 296,6 ms, inferencia mediana de 232,4 ms y p95 de 278,5 ms. El vídeo produce frames aproximadamente cada 50 ms; RAF mediano 6,9 ms, sin long tasks en ese tramo. Las diez capturas versionadas distinguen **ocho desktop reales** y **dos mobile controladas**. No se presentan las capturas móviles como una campaña real aprobada.

Validación final: **npm run test:xr PASS, 181/181, cero omitidos**, 49,144 s. El comando terminó con código 0. El lector inicial del log esperaba TAP; se adaptó al reporter de Node 24 leyendo ese mismo log, sin repetir la suite. Sintaxis de los cinco scripts JavaScript: PASS. Preparación/verificación de hashes de las imágenes QA: PASS. git diff --check: PASS.

El diff contra la base para src, public, dependencias y las dos auditorías originales está vacío. Los únicos archivos nuevos son seis scripts/página QA, este documento, el JSON de evidencia y diez PNG. Anatomía, modelos, catálogos, source locks, microanatomía, recursos femeninos y documentos anatómicos existentes permanecen intactos. No se ejecutaron typecheck, build ni verify:anatomy en esta iteración.

Este commit es un checkpoint de diagnóstico. **No autoriza ni representa GLOBAL_ACCEPTED**; no se crea el commit final Document final non-female anatomy completion status.
