# XR 1.5 — Interfaz gestual del Atlas

Base comprobada antes de editar: `099c4979bf4ff5d8dc985a606054a724a311d072`,
rama `phase-xr-experience`, árbol limpio. Alcance: los tres sistemas de XR 1.4.
Sin sistemas adicionales, nuevas dependencias, push, merge o deploy.

## Arquitectura y decisión sobre la superficie del puntero

`HandUiRouter` recibe los mismos `HandSample` del tracking. Reutiliza
`HandPointer`, la histéresis de `isPinching` y las constantes XR 1.3. Decide el
propietario del gesto antes de llamar a `HandInteraction`, cuya implementación
no cambia. `HandUiRegistry` es el adaptador DOM; no contiene raycasting ni
estado anatómico. `useHandPointer` conecta ambos sólo cuando Atlas entrega su
ref raíz. Corazón conserva el recorrido anterior y su rectángulo de Canvas.

En XR 1.4 el destino del índice era exclusivamente el Canvas. Las capas están
fuera de él: conservar ese destino haría imposible alcanzarlas. En Atlas se
utiliza ahora la unión del workspace y la ficha, recortada al área visible de
la ventana y ampliada simétricamente para conservar el aspecto del vídeo.
`projectIndex`, el espejo y el suavizado permanecen intactos. Cambia el
**rectángulo de destino del Atlas**, no la fórmula de proyección ni los umbrales.
El cursor se dibuja en coordenadas de pantalla mediante CSS fixed y no queda
recortado por el Canvas. El raycast sigue usando el Canvas/cámara reales.

Cuando la cámara queda activa, se alinea el workspace bajo el header usando el scroll-padding global existente. En desktop, los controles
principales quedan accesibles sin scroll auxiliar del test. Un scroll o resize
durante una captura cancela el gesto si cambia el destino; exige abrir la mano
antes de reanclar. No hay desplazamiento de página controlado por manos.

## Registro explícito y hit testing

Sólo elementos con `data-xr-hand-control` dentro de la raíz Atlas son candidatos:

| IDs locales de UI | Control existente |
| --- | --- |
| `skeletal-toggle`, `muscular-toggle`, `cardiovascular-toggle` | Capas |
| `skeletal-opacity`, `muscular-opacity`, `cardiovascular-opacity` | Opacidad |
| `explosion` | Despiece |
| `isolate`, `hide`, `close-card` | Acciones de ficha |
| `exit-isolation` | Restaurar conjunto |
| `restore-hidden`, `reset-view`, `restore-atlas` | Restauraciones existentes |
| `layers-panel` | Abrir/cerrar el panel existente, necesario en móvil |

Estos son identificadores de UI, no IDs anatómicos nuevos. Como máximo existen
15 controles registrados. El registro sólo se reconstruye cuando cambian los
elementos hijos; no en cada frame ni en cada cambio del texto de un porcentaje.
El observer, las referencias DOM y las decoraciones se liberan al salir del modo.

El hit test usa el elemento realmente superior en `elementFromPoint` y el
`getBoundingClientRect()` del control permitido. Para checkboxes se usa el label
asociado como área de apuntado. Los sliders usan el rect del input real.
Controles ocultos, cubiertos, dentro de details cerrado, inert o deshabilitados
(incluido fieldset) no pueden activarse. No se hace click en un elemento DOM
arbitrario, ni en links del header, fuentes educativas o controles externos.

El panel, la ficha y los controles superpuestos bloquean anatomía en toda su
área. Su texto o espacio vacío puede poseer un gesto sin ejecutar ninguna acción.
Fuera del Canvas tampoco se inicia manipulación anatómica. El snapshot del
target conserva sólo ID, tipo, rect, permiso y semántica del rango; el router no
guarda nodos DOM, geometrías ni historial de landmarks.

## Propiedad, captura y cancelación

El árbitro central decide entre apuntado, propietario anatomía, propietario UI
y espera de mano abierta. La UI distingue hover, press, drag y bloqueo con CSS.

- Pinch que comienza en UI pertenece a UI hasta release/cancelación. No llama
  a selección, raycast anatómico, rotación ni escala durante la captura.
- Pinch que comienza en anatomía sigue siendo anatómico al cruzar el panel.
  La UI no roba el gesto. Sobre el panel se bloquea el hit test anatómico,
  aunque la manipulación ya iniciada conserva su propietario.
- Una segunda mano durante UI no inicia escala. Tras release, todas las manos
  detectadas deben estar abiertas antes de rearmar anatomía.
- El release de UI se consume y se reancla: nunca activa un botón y selecciona
  simultáneamente el objeto de detrás.
- Pérdida de tracking, ausencia del propietario, salto inválido, gap superior
  al límite existente, cancelación explícita o entrada manual cancelan captura.
  Reaparecer con la mano cerrada no ejecuta una acción.
- Quitar o deshabilitar un control cancela su acción, manteniendo la exclusión
  anatómica hasta soltar. Los resultados duplicados/stale no repiten acciones.

Botones y toggles actúan **al soltar**, una sola vez por transición observada
abierto → cerrado → abierto. Se acepta el intervalo corto/gracia anterior al
hold de 550 ms. Mantener el pinch más tiempo no rota ni ejecuta el botón.
Salir más de 14 píxeles del rect del botón cancela esa acción; volver al botón
durante el mismo pinch no la reactiva. Esa tolerancia es sólo de UI, no una
recalibración anatómica.

Los sliders capturan desde el inicio y actualizan durante el pinch, incluso si
el cursor sale del rect. Usan `(x - left) / width`, clamp, min/max/step del input
real y redondeo relativo a min. La posición izquierda de opacidad corresponde
a **10%**, no a 0%; Despiece sí permite 0–100%. Se evita emitir valores iguales
al actual. No se añade RAF ni timer de slider: sólo resultados válidos de tracking.
Al perder tracking se conserva el último valor aplicado, sin continuar cambios.

El adaptador emite eventos nativos de los controles registrados. React ejecuta
el mismo `onClick`/`onChange` que mouse/touch: no existe otro reducer de capas,
opacidad, aislamiento o despiece. `systemOpacity` y `explodedAmount` siguen siendo
la única fuente de valor para UI, materiales y offsets.

## Anatomía, ficha, accesibilidad y privacidad

Las acciones Aislar, Ocultar, Restaurar, cerrar ficha, Restaurar estructuras,
Restablecer vista y Restaurar atlas conservan el comportamiento XR 1.4.
No se alteran fichas educativas, selección por ID ni recursos anatómicos.

Los checkboxes, botones y `input type="range"` siguen siendo nativos. Se mantienen
labels, aria-labels, headings, anuncios de selección, Tab, Space, Enter, flechas
y foco visible. La cámara apagada no deshabilita la UI. Los estados gestuales
son una decoración CSS y no mueven el foco con cada hover.

Corazón, MediaPipe, Worker, `.task`, procesamiento local, ausencia de grabación,
uploads, persistencia y analytics permanecen intactos. No se añadieron métricas
técnicas a la UI normal. El debug de calibración existente continúa sólo en
desarrollo. La inspección de QA `?xrQa=1` añade únicamente la pose objetivo para
comprobar que la UI no cambia el cuerpo mientras el render termina de interpolar.

Calibración conservada literalmente: movimiento 0,040; nominal 450 ms;
hold 550 ms; entrada 0,34; salida 0,43; suavizado 45 ms; escala 0,55–1,80.

## Red y rendimiento

La política de carga de XR 1.4 no cambia. La prueba activa las capas por pinch:
7 GLB iniciales, 25 con Muscular y 32 con Cardiovascular. Apagar/encender conserva
los recursos. Cero catálogos/GLB de los otros ocho sistemas; todas las solicitudes
observadas son GET locales. 549 meshes y 2.083.326 triángulos con los tres sistemas.

El coste de UI está limitado a controles explícitos y un resultado de tracking;
no recorre cientos de nodos ni añade un bucle de render. La ventana de medición
usa 60 frames del renderer y muestras de tres segundos en Chrome headless local,
1366×1000, producción, opacidad 100%. Se midieron MediaPipe/Worker/WASM reales
con vídeo sintético sin manos físicas y, por separado, callbacks con landmarks
sintéticos apuntando a la UI.

MediaPipe real sobre vídeo sintético (sin landmarks físicos):

| Capas | Intervalo XR 1.4 / 1.5 | CPU render XR 1.4 / 1.5 | Inferencias/s XR 1.4 / 1.5 |
| --- | ---: | ---: | ---: |
| Óseo | 6,93 / 6,94 ms | 0,98 / 0,49 ms | 16,57 / 17,96 |
| Óseo + Muscular | 7,19 / 6,94 ms | 1,84 / 0,83 ms | 15,92 / 17,94 |
| Tres sistemas | 8,80 / 6,94 ms | 2,96 / 1,10 ms | 11,60 / 17,59 |

Los draw calls siguen siendo 205 / 387 / 549. La muestra base se tomó del build
XR 1.4 previo a compilar XR 1.5; hubo otras tareas de QA activas en parte de esa
medición. Es una comparación orientativa, no un A/B controlado ni evidencia de
una mejora causada por el router.

Con landmarks sintéticos apuntando al checkbox óseo real, el callback completo
(normalización + interacción + feedback, no sólo el hit test) promedió
0,55 / 0,41 / 0,32 ms en XR 1.5; intervalos de 6,96 / 6,94 / 6,94 ms y cadencia
de 17,89 / 17,89 / 17,92 resultados/s. La muestra XR 1.4 del callback anatómico
con landmarks sintéticos fue 0,38 / 0,47 / 0,60 ms. No se observa un coste grande
por la UI en estas muestras; no permite garantizar rendimiento en otro equipo.

No son FPS ni tiempos completos de GPU. La carga del equipo y el navegador
headless hacen variar los resultados; no se atribuyen mejoras de render a este
cambio. Los landmarks físicos y móviles requieren validación propia.

## Pruebas y revisión visual

- `gesture-ui.test.mjs`: 34 pruebas nuevas del router, rangos y acciones reales
  del reducer. El conjunto `npm run test:xr` pasa 91/91.
- `gesture-ui-browser-qa.mjs`: DOM y GLB reales, landmarks/vídeo sintéticos.
  No llama directamente callbacks de React. Comprueba capas, materiales,
  offsets, ficha, exclusión de UI no registrada, conflictos, captura, segunda
  mano, pérdida, reanclaje, teclado, touch y red.
- Responsive: hit targets reales en 1366, 1050, 900, 768 y 390 px; sin overflow.
  También se completó el recorrido gestual desktop a 1366×768 sin scroll auxiliar
  entre acciones. En móvil se conserva el panel plegable bajo el modelo y la ficha inferior.
- `gesture-ui-performance-qa.mjs`: comparación repetible con XR 1.4.
- Regresión Atlas existente: fixture actualizado sólo para el nuevo rectángulo
  destino; ninguna expectativa anatómica se elimina.

Las capturas de `.cache/xr-gesture-ui/` son locales, ignoradas por Git y rotuladas
como simuladas. Se revisan individualmente:

1. [Cursor sobre Óseo](../.cache/xr-gesture-ui/01-cursor-oseo.png)
2. [Muscular por mano](../.cache/xr-gesture-ui/02-muscular-mano.png)
3. [Cardiovascular por mano](../.cache/xr-gesture-ui/03-cardio-mano.png)
4. [Opacidad por mano](../.cache/xr-gesture-ui/04-opacidad-mano.png)
5. [Despiece por mano](../.cache/xr-gesture-ui/05-despiece-mano.png)
6. [Selección anatómica](../.cache/xr-gesture-ui/06-seleccion-anatomia.png)
7. [Aislar por mano](../.cache/xr-gesture-ui/07-aislar-mano.png)
8. [Ocultar por mano](../.cache/xr-gesture-ui/08-ocultar-mano.png)
9. [Restaurar por mano](../.cache/xr-gesture-ui/09-restaurar-mano.png)
10. [Mobile](../.cache/xr-gesture-ui/10-mobile.png)

Los scripts aceptan `XR_QA_ORIGIN`, `XR_PLAYWRIGHT_MODULE` y
`XR_BROWSER_EXECUTABLE`; módulo Playwright y ejecutable también como argumentos.
El script de rendimiento acepta un tercer argumento `base`/`current` para guardar
resultados separados. Evidencia: `browser-results.json`, `performance-*.json`
y `regression-status.json` dentro del mismo directorio local.

Validación final:

- `npm run test:xr`: **91/91 PASS**, incluidas 34 pruebas nuevas.
- `npm run typecheck`: **PASS**.
- `npm run verify:anatomy`: **PASS**, una única ejecución al final de XR 1.5.
- `npm run build`: **PASS**, con el adaptador Rollup WASM preexistente. Permanece
  el aviso previo de tamaño del chunk Meshopt; sin nuevas dependencias.
- `git diff --check`: **PASS**.
- QA gestual: nueve grupos PASS; diez capturas revisadas.
- Regresión Atlas XR: ocho grupos PASS, incluidos recursos estables tras cinco
  ciclos de capas, manual/touch, MediaPipe real y salida de modo.
- Corazón: manos, selección manual, cámara y calibración PASS sin cambiar sus
  expectativas ni umbrales. Home, Anatomía, About, Corazón, Pulmones y Encéfalo
  cargan sin errores JS/HTTP ni overflow.

La primera prueba comparaba la pose renderizada con igualdad exacta después de
un reset. La interpolación seguía convergiendo hacia cero; ahora se comprueba
la pose objetivo exacta del controlador. No se añade tolerancia para permitir
rotación durante UI. El fixture móvil centra el control visible antes de emitir
landmarks; el recorrido desktop no realiza scroll entre acciones.

Diff vacío para modelos, GLB/OBJ, geometrías fuente, transforms fuente, registro,
catálogos, IDs, jerarquías, datos educativos, Atlas principal, loaders/asset manager,
Exploded View estable, Home/About/órganos, MediaPipe/Worker/.task, dependencias y
`handConfig.ts`, `handPointer.ts`, `handInteraction.ts`, `gestures.ts`.
No sistemas nuevos. Los materiales y offsets siguen siendo los de presentación XR.

## Archivos de la iteración

Creados: `src/features/xr/ui/handUiRouter.ts`,
`src/features/xr/ui/HandUiRegistry.ts`, `scripts/xr/gesture-ui.test.mjs`,
`scripts/xr/gesture-ui-browser-qa.mjs`, `scripts/xr/gesture-ui-performance-qa.mjs`
y este documento.

Modificados: `useHandPointer.ts`, `atlas/XrAtlasExperience.tsx`,
`atlas/XrAtlasCard.tsx`, `atlas/atlas-xr.css` dentro de XR;
`atlas/XrAtlasScene.tsx` sólo agrega la pose objetivo al getter de QA existente;
`scripts/xr/atlas-browser-qa.mjs` adapta las coordenadas del fixture a la superficie.

## Limitaciones y prueba física pendiente

**XR 1.5 no está físicamente validado.** Las pruebas de landmarks no demuestran
comodidad, precisión ni rendimiento con webcam/manos reales. Debe comprobarse
especialmente el alcance del nuevo rectángulo destino y la tolerancia de botones.
En móvil, el test desplaza la página para hacer visibles los controles; no hay
scroll gestual ni validación física móvil. Controles fuera de pantalla o cubiertos
por la ficha no se activan. Abrir/cerrar el panel es un control registrado.

La memoria de los sistemas apagados sigue retenida hasta salir del modo. Persisten
las limitaciones anteriores de transparencia, oclusión, piezas pequeñas y cobertura
editorial. No hay búsqueda, árbol, teclado virtual, voz ni nuevos gestos.

Recorrido físico propuesto:

1. Entrar a Atlas XR y activar cámara. Si se activó en Corazón, el cambio de modo
   la apaga por diseño: hay que activarla nuevamente en Atlas.
2. Apuntar a Muscular.
3. Pinch breve y soltar: ON una sola vez.
4. Apuntar al slider muscular.
5. Pinch y arrastrar hasta aproximadamente 50%.
6. Soltar y comprobar que el valor deja de cambiar.
7. Ajustar Despiece aproximadamente a 50%.
8. Seleccionar una estructura anatómica.
9. Aislar mediante mano.
10. Restaurar desde la ficha.
11. Ocultar mediante mano.
12. Restaurar estructuras.
13. Activar Cardiovascular mediante mano.
14. Mantener un slider más de 550 ms y añadir la segunda mano: el cuerpo no rota
    ni escala. Soltar ambas manos antes de volver al cuerpo.
15. Volver a anatomía, seleccionar con pinch y rotar normalmente.
16. Escalar con dos manos.
17. Cerrar ficha y comprobar mouse/touch/teclado con cámara apagada.

Servidor local: `npm run dev`, ruta `/med3d/experiencia-xr/`. En este entorno
Windows se utiliza el adaptador Rollup WASM local preexistente mediante
`NODE_OPTIONS=--require=./.cache/home-redesign/rollup-wasm.cjs`, sin cambiar dependencias.

XR 1.6 (otros ocho sistemas) y XR Fase 2 (Meta Quest/WebXR inmersivo) quedan fuera
de esta entrega. No implementados.
