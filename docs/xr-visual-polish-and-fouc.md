# XR — Pulido visual y estabilidad de presentación

Base: `64671a9908fb8110b0239e3b2c063a6d34e9a070`, rama `phase-xr-experience`. Antes de editar se comprobaron status, rama, HEAD y los diez commits anteriores; el árbol estaba limpio.

## Objetivo y alcance

Integrar visualmente XR en el MED3D negro del Explorador Anatómico y eliminar la presentación antigua durante la carga de rutas. Sin nueva fase, funciones ni cambios en anatomía o interacción.

Los únicos archivos de producto afectados son `index.html`, `src/styles.css`, `src/features/xr/xr.css`, `src/features/xr/atlas/atlas-xr.css` y el markup de `XrAtlasExperience.tsx`. Se añaden dos harness de navegador y este único documento.

## Diagnóstico reproducido antes de editar

La navegación principal usa `SiteLink`, que genera enlaces HTML ordinarios. Por tanto, la mayoría de los cambios del menú cargan un documento nuevo; no son únicamente transiciones del router. El wordmark sí usa navegación cliente. No se cambió ninguno de ellos.

La base de `src/styles.css` todavía declaraba `--bg: #101c24`, paneles azulados y el header antiguo: logo de 24 px, otros márgenes y línea activa de 2 px. `html` y `#root` carecían de fondo explícito. El HTML inicial tenía theme-color azul y ninguna regla crítica.

El negro de Anatomía, About y los exploradores dependía de hojas de ruta y selectores `body:has(...)`. Anatomía además tiene un segundo límite lazy/Suspense: su fallback `.atlas-page` existe antes de `.atlas-phase2` y de su presentación final. Mientras tanto, la base antigua era visible. XR también mostraba un fallback `.xr-page` y conservaba el header azul incluso al terminar.

Se reprodujo sobre el build base, antes de modificar producto, con el menú real y dos recorridos Inicio → Anatomía → About → XR → Anatomía → Inicio:

- Carga normal de Anatomía: first paint a 84 ms; la base azul y el logo antiguo se observaron hasta aproximadamente 437 ms, antes del negro/logo de 28 px a 448 ms.
- Con 900 ms de retraso por solicitud JS/CSS: fondo azul desde el primer paint de Anatomía a 1016 ms; el fallback mantuvo el header antiguo aproximadamente hasta 3 s.
- La captura `fouc-before/slow-1-anatomia-40ms.png` muestra el fondo azul. Los nombres de capturas son ventanas aproximadas; el JSON conserva los tiempos reales del documento.

Evidencia previa: `.cache/xr-visual-polish/fouc-before/navigation.json`, capturas tempranas y `.cache/xr-gesture-ui/regression-visual-polish-before/`.

La causa comprobada es la combinación de base global antigua, contenedores transparentes y presentación compartida condicionada a la ruta lazy. No se encontró un overlay de transición ni un pendingComponent personalizado responsable. Geist ya usaba su carga normal; el intercambio de fuente no explica el fondo azul ni el cambio de tamaño CSS del logo. No se modificaron fuentes, imports del router, Suspense ni lógica de navegación.

## Corrección de la causa

- `--bg` global adopta el negro real del Atlas, `#050607`. `--panel`, `--muted` y `--border` adoptan sus valores actuales. Se exponen sólo tres tokens auxiliares tomados del mismo diseño: `--border-strong`, `--control` y `--dim`.
- `html` y `body` tienen fondo y color base explícitos. `body` conserva margin 0 y gana min-height 100vh; `#root` también cubre 100vh e hereda el fondo. `#contenido` hereda ese fondo.
- El fondo, medidas y estilos del header ya presentes en Anatomía/About pasan a ser la base global disponible durante los fallbacks. `SiteHeader.tsx` y sus handlers no cambian. Las variantes locales existentes siguen prevaleciendo, incluido el header de Home.
- Una regla crítica mínima en `index.html` define únicamente fondo, color base, color-scheme, margen y altura mínima. No contiene el diseño de la aplicación. `theme-color` pasa a `#050607`.
- El color crítico se declara en `html`, permitiendo que el color de cada página siga heredándose desde `body`; no fija un color independiente en `#root`.
- `color-scheme: dark` ya existía globalmente; ahora está disponible también en el HTML inicial. Los checkbox y range siguen siendo inputs nativos.

No se añadieron loaders, overlays, fades ni esperas de producto. Las hojas lazy conservan su carga y no se adelantaron modelos ni chunks anatómicos.

## Presentación XR

- Hero compacto: se elimina únicamente el salto de línea forzado del título; se conserva el texto. Eyebrow pequeño, título de 30–40 px, subtítulo breve e indicación experimental discreta.
- Gutter de 24 px en desktop, 20 px en tablet y 16 px en móvil. La escena aparece aproximadamente a 217 px desde el inicio del documento a 1366 × 900.
- Viewport con negro continuo del Atlas, sin el degradado radial anterior. Separadores finos, contenedor de radio 6 px y altura entre 520 y 680 px según pantalla; móvil conserva 460 px.
- Panel de sistemas derecho con superficie `--panel`, divisores discretos, labels jerarquizados, acento sobrio y scrollbar fina visible. No cambian los once controles, IDs, valores ni atributos funcionales. La lista conserva su altura máxima y sus espacios de captura; Despiece continúa fuera de ella.
- Cámara, estados y ayuda se distribuyen en una franja inferior: acción/privacidad, estado e instrucciones. Los mismos elementos y handlers se mueven dentro del mismo workspace y uiRoot. La franja conserva `data-xr-ui`, antes aportado por su aside contenedor, para que el fondo de esos controles siga perteneciendo a UI.
- Ficha: superficie del Atlas, borde fino, título y jerarquía tipográfica coherentes, botones sobrios y scrollbar discreta. El componente, contenido, fuentes, acciones y scroll de la ficha no se modifican.
- Se mantienen Geist/Geist Mono, acento `#86bec8`, superficies `#0b0d0f`/`#101315`, líneas blancas de baja opacidad, foco visible, inputs reales, reduced motion y footer mínimo.

No se cambian cámara, FOV, encuadre calculado, Three.js, matrices ni tamaño anatómico. El renderer existente responde al nuevo tamaño CSS del contenedor.

## Responsive y accesibilidad

Comprobados 1366, 1050, 900, 768 y 390 px. El modelo domina el ancho; la franja secundaria pasa de tres a dos y después a una columna. Móvil mantiene panel plegable y ficha bottom sheet de hasta 42dvh. Sin overflow horizontal.

Se conservan headings, labels, inputs, rangos, orden relativo de controles y botones reales. Se prueba foco mediante Tab/Shift+Tab y apertura/cierre por Enter. La selección móvil mantiene el scrollIntoView anterior; no se cambió ese efecto. Las capturas de móvil seleccionado se toman como viewport real para no confundir la posición sticky del header en una captura larga.

## Evidencia anti-FOUC

`scripts/xr/route-style-flash-qa.mjs` registra estilos en cada RAF de QA, PerformanceObserver de paint y capturas tempranas CDP. No basta con la captura final: conserva los estados de documento vacío, fallback y contenido listo.

Recorrido final: dos vueltas al menú, una con retraso de 900 ms por recurso JS/CSS y otra normal. **12 documentos / 2200 frames / 0 frames con base incorrecta**, sin errores JS/HTTP. Se comprueban html, body, root, shell, main, header y fondo del viewport anatómico; el logo mide 28 px desde su primera aparición en Anatomía, About y XR.

Además, con JS y CSS externos bloqueados, el HTML crítico por sí solo mantiene html/body/root en `rgb(5, 6, 7)`, color-scheme dark, margin 0 y root de 900 px. Esta prueba justifica la protección mínima independiente de la hoja global; no afirma adelantar el momento en que el navegador decide pintar.

Evidencias:

- `.cache/xr-visual-polish/fouc-final/navigation.json` y sus 24 capturas tempranas.
- `.cache/xr-visual-polish/critical/navigation.json` y `critical-without-external-css.png`.
- `.cache/xr-visual-polish/site-comparison.json`.

La prueba crítica final se ejecutó por separado mediante una copia temporal del mismo harness que omite los recorridos ya completados; el script versionado incluye ambas comprobaciones.

## Regresión visual del sitio

Home, Anatomía, About, Corazón, Pulmones y Encéfalo cargan sin errores JS/HTTP ni overflow. Se comparan los mismos elementos y 17 propiedades calculadas con el checkpoint previo, además de revisar capturas.

Los estilos de contenido, medidas y distribución de las seis páginas permanecen iguales. Diferencias esperadas: root y contenido pasan de fondo transparente a heredar el negro que ya se veía debajo. En Home, el enlace de salto adopta texto negro por el token global y cambia el color calculado de una regla de marca que ya estaba oculta; no cambia su layout ni navegación. Persiste únicamente la advertencia previa de THREE.Clock.

## Capturas XR y regresión de interacción

`scripts/xr/visual-polish-browser-qa.mjs` usa DOM, GLB y controles reales. Sólo cámara/vídeo son sintéticos y las capturas llevan esa indicación. Comprueba carga ósea inicial, capas, selección por raycast, ficha sin desmontar canvas, Despiece/reset, cinco anchos, foco, panel móvil y cleanup tanto al desactivar cámara como al navegar a Home dentro del mismo documento.

El recorrido visual/cleanup final se repitió sobre el **build compilado**, también PASS y sin errores JS/HTTP.

Capturas en `.cache/xr-visual-polish/visual/`: `01-desktop-initial`, `02-multiple-systems`, `03-education-card`, `04-system-panel`, `05-camera-hands`, `06-explosion`, `07-tablet`, `08-mobile` (PNG).

Regresión completa del Atlas: **20/20 PASS**, once sistemas reales, selección/fichas, opacidad, aislar/ocultar/restaurar, Despiece, dwell, pinch de rotación/escala y controles manuales. Pan y scroll de sistemas: **PASS**, incluidos los once sistemas accesibles, Tegumentario por dwell después del scroll, su slider, exclusión del cuerpo, grace/reanchor, límites, scrollbar y touch.

Scroll de ficha: **10/10 PASS**, scroll nativo/gestual hasta fuentes y licencias, botones prioritarios, grace/reanchor/rearm, cancelación por input/cierre, cambio de estructura, canvas conservado y cinco anchos con touch.

Evidencias en `.cache/xr-visual-polish/full-atlas/`, `pan-regression/` y `card-regression/`. Los scripts existentes se reutilizan sin cambiar sus aserciones; las copias temporales de pan/ficha sólo cambian rutas de import y salida.

## Validación técnica y auditoría

- `npm run test:xr`: **180/180 PASS**.
- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**, 4 páginas estáticas y 15 redirects. Se reutilizó el shim Rollup WASM local preexistente; persiste el aviso anterior de chunk grande.
- `npm run verify:anatomy`: **PASS**, ejecutado una sola vez al final; siete suites anatómicas completadas.
- `git diff --check`: **PASS**.

Auditoría AST local: el código previo al return del componente es idéntico; **79 callbacks/handlers y atributos funcionales** coinciden con la base. Modelos, catálogos, IDs, datos, Atlas principal, loaders, componentes globales, rutas y package/lock no presentan cambios.

Intactos: GLB/OBJ/geometrías, transforms fuente, registros anatómicos, licencias, fuentes, selección/raycast, MediaPipe/modelo de manos, thresholds, dwell de 1000 ms, stable target, tracking, cursor, scroll gestual, pan, rotación/escala, opacidad/capas/Despiece, aislar/ocultar/restaurar, teclado/mouse/touch. No se añaden dependencias ni loops/timers/listeners al producto.

## Límites

La evidencia cubre Chrome local y carga artificialmente ralentizada, no todos los navegadores, GPU o políticas de caché. No puede comprobar frames anteriores al documento controlado por la aplicación ni impedir que el navegador muestre su propia superficie. Geist mantiene su font-display y puede producir un intercambio tipográfico normal. La prueba física con webcam y dispositivos touch sigue pendiente; landmarks/vídeo y touch de QA son sintéticos. Ningún resultado se presenta como prueba física. Al pasar por primera vez a transparencia, el QA volvió a observar la pausa del render/tracking ya documentada en la base: el watchdog libera la captura y exige rearm/dwell nuevo. La prueba sólo permite repetir la adquisición si registra esa pérdida; no se cambian umbrales ni se fuerzan valores.

Sin nueva fase, Meta Quest, WebXR inmersivo, push, merge ni deploy.
