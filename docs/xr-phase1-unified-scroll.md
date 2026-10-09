# XR Fase 1 — Experiencia unificada y scroll educativo

Base: `46ea30e16a2d0fb64ecf91193e60c28c52e1b125`, rama `phase-xr-experience`. Estado inicial limpio, comprobado con status, branch, HEAD y log antes de modificar.

## Alcance y entrada pública

`/experiencia-xr/` renderiza directamente `XrAtlasExperience`, con su carga diferida y fallback existentes. Se retiraron el estado de modos, la importación pública de `XrHeartExperience`, el selector Corazón/Atlas XR, su eyebrow y sus estilos/espaciado. No se añadió ruta, redirect ni cambio al header.

Atlas conserva los once sistemas, Óseo ON y los otros diez OFF, carga progresiva, siete GLB óseos iniciales y las mismas acciones de capas, opacidad, Despiece, selección, ocultación, aislamiento, restauración y manipulación.

Se revisaron las referencias de Heart en código, tests, QA y documentación antes de retirarlo de la entrada. `XrHeartExperience.tsx`, sus componentes, `public/models/heart.glb`, datos y documentos históricos permanecen intactos. Ya no se importa desde la ruta pública. Sus pruebas unitarias de selección/interacción continúan en `test:xr`; los QA de navegador históricos de Heart describen los checkpoints donde era una entrada pública y no son recorridos actuales de esta ruta. No se creó un acceso oculto ni se hizo limpieza agresiva.

El corazón corporal sigue disponible en Cardiovascular, desde `models/anatomy/cardiovascular/heart.glb`. Es un recurso distinto del antiguo `models/heart.glb`. La prueba del build seleccionó **Pared de la aurícula derecha**, abrió su ficha real y llegó a su final (369/369 px). No se fusionaron modelos, IDs ni fuentes.

## Scroll nativo y accesibilidad

La ficha mantiene contenido, estructura, textos, fuentes, licencias, tipografía y dimensiones. Su cuerpo ya usaba `overflow-y:auto` y `min-height:0`; se conserva esa disposición y la cabecera/acciones permanecen fuera del área que se desplaza.

El cuerpo ahora es una región con nombre accesible, `tabIndex=0`, foco visible y scrollbar fina oscura. Admite rueda/trackpad por la ruta nativa del navegador, arrastre de scrollbar, touch vertical, Home/End, PageUp/PageDown y flechas con foco. No se interceptan estos eventos para simular scroll. El input manual conserva su prioridad y cancela la captura de mano mediante los listeners existentes.

`key={node.id}` reemplaza sólo el cuerpo al cambiar estructura, reinicia su scroll y da una nueva identidad DOM. No desmonta el canvas, no recarga GLB ni cambia geometría.

## Registro, captura y exclusión

El cuerpo declara `data-xr-hand-control="education-scroll"` y `data-xr-hand-kind="scroll-region"`. `HandUiRegistry` acepta este tipo explícito; no convierte otros elementos DOM en controles.

Para adquirirlo se exige contenido con `scrollHeight > clientHeight`, elemento conectado/visible, intersección con viewport, hit real dentro de la región y ausencia de un elemento que cubra el punto. El registro comprueba también un punto visible de la región antes de resolverla durante captura. Una ficha corta no ofrece target ni feedback de captura.

Los controles específicos se resuelven primero. Botones, checkboxes y sliders conservan prioridad sobre la región; un botón no registrado tampoco se convierte en scroll. Texto y enlaces del cuerpo pueden pertenecer a la región, pero no reciben un click sintético. Fuente/licencia siguen siendo enlaces nativos para mouse, touch y teclado; no están registrados para activar por dwell.

Se reutiliza el stable UI target existente, seguido del **dwell global de 1000 ms**. El reloj existente proporciona el disparo único y el rearm; la acción local de scroll captura en lugar de activar un botón. `dwell.ts` y sus umbrales no se modificaron.

La captura posee la interacción hasta su liberación. Cada resultado válido de tracking consulta esa captura antes de sliders/anatomía: no raycast anatómico, selección, rotación, escala ni activación de controles detrás. Pinch nunca se usa para desplazar la ficha.

## Movimiento relativo y feedback

`src/features/xr/ui/handScroll.ts` concentra el estado y las constantes:

| Parámetro | Valor |
|---|---:|
| `SCROLL_HAND_GAIN` | 1,25 px de scroll / px visual |
| `SCROLL_RELEASE_HORIZONTAL_PX` | 60 px |
| `SCROLL_RELEASE_MS` | 300 ms |

Al capturar guarda `startPointerY`, `startScrollTop` e identidad del elemento. No escribe scroll al iniciar.

`scrollTop = clamp(startScrollTop + (startPointerY - pointerY) * SCROLL_HAND_GAIN, 0, scrollHeight - clientHeight)`

Mover el índice arriba avanza el contenido hacia abajo, siguiendo la dirección del touch. Se utiliza el cursor filtrado actual y sólo resultados válidos nuevos de tracking. No se añadió RAF, segundo filtro, tracker, estado React por frame ni posición absoluta sobre toda la lección.

Apuntar conserva el cursor UI y el anillo de dwell. Capturar muestra un aro cyan discreto y una línea vertical corta, sin texto adicional. La scrollbar sigue mostrando la posición.

## Liberación, grace y rearm

- Salir horizontalmente más de 60 px durante 300 ms libera. Mientras se mantiene fuera de esa banda, no hay nuevos desplazamientos; volver antes reinicia el contador. Jitter dentro de la tolerancia no libera.
- Pinch de cualquiera de las manos, prioridad manual, cierre/cambio de ficha, pérdida de overflow/visibilidad/control, desmontaje y pérdida definitiva de tracking cancelan captura.
- Cambio de estructura se detecta por identidad DOM, aunque el ID funcional siga siendo `education-scroll`.
- La pérdida breve usa el **TRACKING_GRACE_MS existente (380 ms)**: pausa, conserva scrollTop y no aplica deltas.
- La recuperación cercana de la misma mano sigue las reglas existentes de identidad/proximidad y asentamiento. El primer resultado válido posterior guarda nuevas bases Y/scrollTop; no reutiliza el delta anterior. Reaparición incompatible o pérdida definitiva libera.
- Liberar conserva el bloqueo de disparo del dwell existente. Permanecer o regresar inmediatamente al mismo target no recaptura; se necesita su salida estable/rearm y una nueva entrada con dwell. No se cambió el rearm global.
- Una captura activa sigue siendo dueña aun cuando el índice cruce verticalmente sobre otro control. Para activar Aislar/Cerrar por dwell, primero se libera; antes de capturar, el botón siempre gana el hit test.

## Responsive

Se mantiene la ficha lateral de desktop y el bottom sheet móvil existente (máximo 42dvh). Sólo cambia el cuerpo desplazable. QA en **1366, 1050, 900, 768 y 390 px**, sin overflow horizontal y con acceso hasta el final. Touch nativo se comprobó con eventos táctiles de Chrome a 390 px.

La capa gestual sólo recibe resultados cuando el control con manos está activo. Con cámara apagada se conserva la lectura nativa.

## Pruebas y evidencias

`scripts/xr/scroll.test.mjs` añade **14 pruebas** integrando los controladores reales. Cubre ficha corta/larga, 999/1000 ms, bases iniciales sin salto, dirección y ganancia, límites, jitter/salida sostenida, pinch primario/secundario, manual, cierre, reemplazo, overflow, deshabilitación, desmontaje, rearm, grace/reanclaje con `HandStability` y resultados obsoletos/pérdida definitiva. Incluye bloqueo de rotación/selección/raycast tras más de 550 ms.

`scripts/xr/unified-scroll-browser-qa.mjs` ejecuta DOM, GLB, raycasts, overflow y clases reales. Sólo vídeo/landmarks son sintéticos. Los observadores de desarrollo no cambian resultados de producción.

Cubre los 26 casos solicitados entre unidad y navegador: entrada directa/sin selector, once sistemas/estado inicial, teclado, rueda y arrastre de scrollbar, captura por texto, avance/retroceso, footer real, salida/rearm, grace sin salto, conflicto >550 ms sin cambio de pose ni raycast, Aislar por dwell, links sin click/navegación, cancelaciones y conservación del canvas. Un fixture DOM con el registro real comprueba fichas corta/larga, ocultación/cobertura, botón anidado, texto, links y cambio de identidad.

`scripts/xr/full-atlas-browser-qa.mjs` se adapta a la entrada directa y distingue el corazón corporal del Heart histórico. Se conserva la regresión de once sistemas, carga progresiva, OFF/ON sin nuevas descargas, opacidades, Despiece 0/50/100/0, selección, ocultar/aislar/restaurar, dwell/controles gestuales, pinch para rotar/escalar, mouse/touch/teclado y responsive. `full-atlas-performance-qa.mjs` sólo pierde el click al selector retirado; no se recalibró rendimiento en esta iteración.

Comandos reproducibles, con un servidor Vite local activo (los argumentos externos de Playwright/Chrome son opcionales):
```powershell
node scripts/xr/unified-scroll-browser-qa.mjs <ruta-playwright> <ruta-chrome>
$env:XR_QA_OUTPUT='.cache/xr-unified-scroll/full-atlas'
node scripts/xr/full-atlas-browser-qa.mjs <ruta-playwright> <ruta-chrome>
```

Evidencias locales ignoradas por Git, bajo `.cache/xr-unified-scroll/`:

- `browser-results.json`, `production-results.json`, `full-atlas/browser-results.json`.
- `01-unified-entry.png`, `02-native-scroll.png`, `03-scroll-captured.png`, `04-relative-up-down.png`, `05-lesson-end.png`, `06-button-priority.png`, `07-mobile-touch-scroll.png`, `08-production-cardiovascular.png`.
- Build local y registros de validación.

Regresión del build: Home, Anatomía, About, Corazón, Pulmones y Encéfalo cargan sin errores JS/HTTP ni overflow. Los estilos computados coinciden exactamente con el checkpoint XR 1.6; capturas y JSON en `.cache/xr-gesture-ui/regression-unified-scroll/`. Persiste únicamente el aviso previo de `THREE.Clock` en vistas 3D.

## Validación final

| Comprobación | Resultado |
|---|---|
| `npm run test:xr` | PASS, 166/166 (14 pruebas nuevas) |
| `npm run typecheck` | PASS |
| `npm run verify:anatomy` | PASS; una sola ejecución al final |
| `npm run build` | PASS; 4 páginas estáticas y 15 redirects de compatibilidad existentes |
| `git diff --check` | PASS |
| QA específico de scroll, build y Atlas completo | PASS |
| Regresión del sitio | 6/6; estilos idénticos al checkpoint |

Build ejecutado con el shim local Rollup WASM ya existente (`NODE_OPTIONS=--require=./.cache/home-redesign/rollup-wasm.cjs`), sin cambios de dependencias. Se conserva el aviso de chunk grande del decoder Meshopt. El QA hace visible la scrollbar nativa de Chrome (deshabilita su flag headless `--hide-scrollbars`) y verifica arrastre del thumb hasta el límite inferior.

## Auditoría y límites

Cambios de producto limitados a `src/features/xr/`; fuera de ella, sólo QA/tests y este documento. No hay archivos eliminados.

Intactos: todos los GLB/geometrías, modelos/manifiestos de manos, catálogos, IDs, educación/procedencias/licencias, Atlas principal y sus cámaras/loaders, MediaPipe, `dwell.ts`, `handConfig.ts`, smoothing, jump limiter, stable target, tracking grace y pinch thresholds. Sin sistemas ni dependencias nuevas.

Limitaciones: las pruebas de manos usan vídeo y landmarks sintéticos; no certifican ergonomía con webcam física. Touch fue simulado; rueda valida el camino nativo compartido con trackpad, sin prueba de hardware de trackpad. Fichas extensas pueden requerir liberar y repetir un recorrido relativo. Al llegar al clamp, se conserva la base relativa de la captura. El scroll gestual se limita al cuerpo de ficha; no se añadió al listado de sistemas ni a otras regiones de la página.

No rediseño, nueva fase, Meta Quest, WebXR inmersivo, push, merge ni deploy.
