# XR Fase 1 — Pan vertical y scroll de sistemas

Base: `6f214da7b737e29805ff9b6a0053cd15a42c0aa2`, rama `phase-xr-experience`. Working tree inicialmente limpio; comprobados status, rama, HEAD y diez commits antes de editar.

## Alcance

Dos ajustes de interacción: desplazar verticalmente el cuerpo completo y recorrer con el índice los once sistemas del panel. La entrada unificada, modelos, educación, fichas, selección, Despiece, opacidades y semántica de restauración se conservan. No hay rediseño ni nueva fase.

## Pan y escala con dos manos

`GestureController` acepta la opción `verticalPan`, activada únicamente por `XrAtlasExperience`. Heart histórico conserva el comportamiento anterior por defecto.

Cuando hay dos pinches válidos se guarda una misma base de distancia, centro Y, escala y desplazamiento vertical. La distancia sigue usando la corrección de aspecto, dead zone y límites anteriores de escala. El centro Y de los puntos de pinch filtrados controla una traslación independiente:

`offsetY = clamp(initialOffsetY + (initialCenterY - centerY) * TWO_HAND_VERTICAL_PAN_SENSITIVITY)`

Subir ambas manos reduce su Y normalizada y eleva el cuerpo. Separarlas manteniendo el centro sólo escala; moverlas juntas principalmente desplaza; ambas operaciones pueden coexistir. No se suma un delta acumulativo por frame.

| Constante nueva | Valor |
|---|---:|
| `TWO_HAND_VERTICAL_PAN_SENSITIVITY` | 4 unidades XR por unidad Y normalizada |
| `MIN_VERTICAL_OFFSET` | −0,9 unidades XR |
| `MAX_VERTICAL_OFFSET` | +0,9 unidades XR |
| `VERTICAL_PAN_KEY_STEP` | 0,15 unidades XR |

Un movimiento de 0,1 en Y produce aproximadamente 0,4 unidades de desplazamiento. El cuerpo ya se normaliza a 3,45 unidades; la altura visible de referencia en el plano central es aproximadamente 4,68 unidades (cámara existente: distancia mínima 6,8, FOV 38°). El rango conservador ±0,9 permite movimiento claro sin expulsar el cuerpo completo. El viewport estrecho mantiene la adaptación de cámara anterior; no se cambia su encuadre.

Sólo `xrAtlasRoot.position.y` interpola hacia `gestures.verticalOffset`, con el mismo alpha temporal que rotación/escala: `1 - exp(-min(dt, .1) / .055)`. El filtrado de manos actual suaviza el cálculo del centro. Sin nuevo RAF ni setState de React por frame.

No se modifican posiciones anatómicas, matrices fuente, geometrías ni offsets de Despiece. El raycast existente ya usa la matriz mundial del root, por lo que sigue considerando la nueva traslación. La medición de QA sólo añade posición del root y offset a la inspección existente.

Cambio de cantidad/identidad/modo, discontinuidad y pérdida de tracking invalidan la base anterior. Una mano puede seguir con la rotación anterior, pero no produce pan. Recuperar la segunda crea nueva base desde la posición actual, sin salto. La recuperación después de perder ambas manos conserva el requisito existente de mano abierta y asentamiento.

UI capturada o dwell sobre UI mantiene su prioridad: no llegan esos resultados a la manipulación anatómica. Pinch durante un scroll cancela esa captura conforme al comportamiento previo y no pasa directamente a manipular el cuerpo.

## Reset y alternativas manuales

Restablecer vista y `0` restablecen Y=0, rotación, escala y Despiece. Restaurar atlas conserva su semántica anterior: restablece capas/selección/opacidad, preservando pose, pan y Despiece.

Con foco en el viewport:
- `Shift + ArrowUp`: subir 0,15.
- `Shift + ArrowDown`: bajar 0,15.
- Flechas sin Shift: rotación anterior.
- `+ / −`, rueda y dos dedos: escala anterior.

Los atajos de pan no se interceptan en sliders, botones ni regiones con foco propio. Tampoco se añaden combinaciones con Ctrl/Alt/Meta. No se añadió Shift+drag ni un gesto táctil nuevo; drag normal continúa rotando. La ayuda breve del Atlas documenta pan y scroll; la etiqueta del gesto de dos manos indica “Escalar / desplazar”.

## Lista de sistemas como scroll-region

La lista existente declara `data-xr-hand-control="systems-scroll"` y `data-xr-hand-kind="scroll-region"`. Añade foco nativo para navegación por teclado y conserva su scrollbar fina, tamaños y layout. Despiece continúa fuera y debajo de la región.

Se reutilizan **sin duplicar ni modificar el algoritmo** `HandScroll`, su captura en `HandUiRouter`, el dwell global, grace y rearm implementados para la ficha. `handScroll.ts`, `handUiRouter.ts` y la ficha educativa permanecen intactos.

Para que el fondo sea realmente alcanzable, el registro da prioridad a controles que contienen el punto; sólo dentro de una región de scroll explícita evita extender su hit slop sobre los espacios libres. De otro modo, las franjas entre filas quedaban absorbidas por el margen tolerante de los toggles. No se cambian constantes globales ni tolerancias de controles fuera de estas regiones.

Prioridad: toggle/label o slider real > espacio/texto de scroll-region > anatomía. Los nombres asociados a un checkbox siguen perteneciendo a su label y activan ese sistema. El texto normal de opacidad fuera del input y los espacios entre filas pueden adquirir scroll. Controles cubiertos, ocultos o deshabilitados no se activan. El panel cerrado deja de resolver la región.

Se exige overflow real, visibilidad y hit dentro de la región. Stable target existente + **1000 ms** captura sin desplazar inmediatamente. Guarda `startPointerY`/`startScrollTop`; mover el índice arriba avanza hacia los sistemas inferiores, con el mismo `SCROLL_HAND_GAIN=1.25` de la ficha. Clamp nativo 0…scrollHeight−clientHeight.

Mientras el scroll está capturado sólo cambia scrollTop: no toggle, opacidad, raycast/selección, rotación, escala ni pan. El cursor y el aro existentes señalan la captura.

Release y continuidad se conservan:
- Salida horizontal >60 px durante 300 ms; el tramo fuera congela el desplazamiento.
- Pinch, input manual, desaparición/cierre de región, desmontaje o pérdida definitiva liberan.
- Grace de tracking existente (380 ms): pausa sin cambiar scrollTop.
- Recuperación cercana: nuevas bases Y/scrollTop, sin reutilizar el delta anterior.
- Después de liberar, salida estable y reentrada/rearm antes de otra captura.

Mouse, rueda/trackpad, arrastre de scrollbar, teclado y touch mantienen scroll nativo. El pan del cuerpo no mueve la lista y el scroll de la lista no cambia el cuerpo.

## Pruebas

`scripts/xr/pan-and-system-scroll.test.mjs` añade 14 pruebas: dirección, distancia fija, escala idéntica al comportamiento previo, simultaneidad, ambos clamps, bases sin deriva, pérdida/retorno de segunda mano, discontinuidades, input manual/reset, Heart sin pan, dwell de sistemas a 999/1000 ms, movimiento relativo, exclusión UI y grace/reanclaje/cierre. La suite conserva también las pruebas genéricas de scroll de ficha, límites, rearm y pérdidas.

`scripts/xr/pan-system-scroll-browser-qa.mjs` usa DOM, once controles, GLB, clases y eventos reales. Sólo vídeo/landmarks son sintéticos; los observadores no alteran resultados de los controladores. Los 30 escenarios solicitados se cubren entre tests de controladores y navegador.

Comprueba pan arriba/abajo, sólo escala, scale+pan, bases anatómicas sin cambios, panel inmóvil, pérdida de segunda mano, ambos clamps, reset, Restaurar atlas sin reset de pose y atajos de teclado limitados al viewport. Después recorre la lista con manos, llega a los once sistemas, activa Tegumentario por dwell desde su posición alcanzada sin scroll programático, verifica carga lazy, mueve su slider y vuelve arriba.

Incluye conflicto de scroll >550 ms sin cambios del cuerpo/capas/opacidades, grace/reanclaje, release, pinch, pérdida definitiva, cierre del panel, rueda, scrollbar nativa y touch. Prueba 1366/1050/900/768/390 px y visibilidad del cuerpo en ambos límites con escala máxima.

La regresión completa mide las geometrías fuera de las capturas y observa directamente la pose del controlador durante sliders y pinches. Así evita que la propia inspección pesada provoque una discontinuidad de tracking; también comprueba que el offset vertical no cambia al ajustar opacidad. Los primeros recorridos expusieron esa interferencia del QA, primero en opacidad y después en escala; se corrigió la medición sin alterar controladores de producto ni resultados esperados.

El primer cambio a transparencia en Chrome de QA produjo una interrupción registrada de tracking (~355 ms). El watchdog existente libera el slider ante esa pausa. El QA exige evidencia de `suspendGesture` antes de permitir una nueva adquisición; después requiere nuevo dwell y alcanzar la opacidad esperada. No se ampliaron umbrales ni se forzaron valores para ocultar esa interrupción. No se atribuye esa observación a una medición de webcam física.

Ejecución con Vite local activo:
```powershell
node scripts/xr/pan-system-scroll-browser-qa.mjs <ruta-playwright> <ruta-chrome>
```

Evidencias locales en `.cache/xr-pan-system-scroll/`, ignoradas por Git:
1. `01-initial.png`
2. `02-pan-up.png`
3. `03-pan-down.png`
4. `04-scale-pan.png`
5. `05-reset.png`
6. `06-system-scroll.png`
7. `07-endocrine-lymphatic.png`
8. `08-reproductive-integumentary.png`
9. `09-skin-dwell.png`
10. `10-opacity-after-scroll.png`
11. `11-back-to-top.png`
12. `12-mobile.png`

## Validación y regresión

- `npm run test:xr`: **180/180 PASS**, 14 pruebas nuevas.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**, 4 páginas estáticas y 15 redirects de compatibilidad existentes. Se usó el shim local Rollup WASM preexistente, sin cambios de dependencias; persiste el aviso anterior de chunk grande.
- QA específico de pan/lista y regresión de ficha: **PASS**, sin errores JS. Las doce capturas fueron generadas y revisadas las vistas de pan, escala, controles y móvil.
- Build compilado: pan 0,3, selección de Clavícula izquierda en la posición desplazada, drag/rueda y reset correctos; siete GLB iniciales, sin recargas. Evidencia adicional: `13-production-pan-selection.png` y `production-results.json`.
- Home, Anatomía, About, Corazón, Pulmones y Encéfalo: **6/6 PASS**, sin errores JS/HTTP ni overflow; estilos computados idénticos al checkpoint anterior. Sólo persiste el aviso previo de THREE.Clock.
- `npm run verify:anatomy`: **PASS**, ejecutado una sola vez al final; siete suites anatómicas completadas.
- Regresión completa del Atlas: **20/20 PASS**; once sistemas reales, lazy, opacidad/selección/aislar/ocultar/restaurar, Despiece, dwell, pinch de rotación/escala, controles manuales y responsive. Evidencia: `.cache/xr-pan-system-scroll/full-atlas-final/browser-results.json`; sin errores JS.
- `git diff --check`: **PASS**.

## Auditoría y límites

Cambios de producto sólo en la capa XR; fuera de ella, tests/QA y este documento. No se eliminan archivos.

Intactos: GLB, geometrías, catálogos, IDs anatómicos, transforms fuente, Atlas principal, loaders/AssetManager, datos educativos, MediaPipe/modelos de manos, dwell global, smoothing/umbrales previos, fichas, selección, Despiece, capas y opacidades. No se añadieron sistemas ni dependencias. Home/About y exploradores no se modifican.

Pendiente prueba física con webcam: comodidad de ±0,9, sensibilidad 4, movimientos simultáneos de ambas manos y precisión para mantener dwell en espacios entre filas. Touch fue simulado; el trackpad conserva el camino nativo de wheel, sin prueba de hardware. Los límites evitan perder el cuerpo completo; no garantizan que cada estructura ampliada/aislada permanezca íntegra dentro del viewport. No hay pan horizontal. Listas largas pueden necesitar liberar y repetir el recorrido relativo.

Sin rediseño, nueva fase, Meta Quest, WebXR inmersivo, push, merge ni deploy.
