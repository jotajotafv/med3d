# XR 1.4 — Atlas Pilot

Base verificada antes de editar: `8721ba1cea5cd51682fda84f025c8bf87d707ebc`,
rama `phase-xr-experience`, working tree limpio.

## Auditoría de arquitectura previa

El Atlas principal descarga catálogos y monta `AtlasScene` desde `SkeletalAtlas`.
Esos componentes reúnen cámara, árbol, navegación, capas y overlays; XR no los
importa. Tampoco importa el enrutador de fichas de los once sistemas.

Piezas reutilizables, sin modificar sus fuentes:

- Los tres `public/models/anatomy/{skeletal,muscular,cardiovascular}/catalog.json`
  conservan IDs, jerarquía, módulos, conteos, procedencia y marco BodyParts3D común.
- `AtlasAssetManager` y `createAssetLoader`: descarga progresiva, Meshopt,
  validación de propietarios, transforms originales, cancelación y liberación.
  El loader existente crea instancias de presentación con geometría transferida
  y un material placeholder propio. XR no usa ni cambia materiales del Atlas.
- `composeBodyCatalog` y `createCatalogIndex`: composición e identidad existentes.
- `createExplosionOffsets` y `explosionTarget`: offsets regionales existentes,
  en metros fuente. El valor 0 restaura exactamente la posición base.
- `SYSTEMS`, `resolveBoneDetail`, `BONE_EDUCATION`, `BONE_TERMS`, `resolveMuscleDetail`,
  `resolveCardiovascularDetail` y `publicText/publicFields`: única fuente educativa.

Decisión: escena XR independiente y un gestor existente por sistema activado.
Cada sistema solicita su catálogo sólo al activarse, seguido de sus módulos;
el sistema óseo es el único activo inicialmente. El adaptador conserva la lista
deseada al apagar una capa, porque el gestor estable libera lo que se retira.
Así se reutiliza su implementación sin cambiar su política para el Atlas principal.
Salir del modo libera todos los gestores, instancias y materiales de XR.

`MODEL_DEFINITIONS.heart` corresponde al corazón HRA de la demo, en otro marco.
Atlas XR usa los siete módulos cardiovasculares BodyParts3D, incluido su corazón
corporal registrado. No superpone ni registra artificialmente `heart.glb` HRA.

| Sistema | Módulos | Meshes | Triángulos | Bytes GLB |
| --- | ---: | ---: | ---: | ---: |
| Óseo | 7 | 205 | 512450 | 3916940 |
| Muscular | 18 | 182 | 885860 | 9417864 |
| Cardiovascular | 7 | 162 | 685016 | 5649280 |
| Total | 32 | 549 | 2083326 | 18984084 |

Estos conteos se verificaron leyendo los 32 GLB con el loader existente.

## Implementación y estado

`XrExperiencePage` es ahora el selector discreto Corazón / Atlas XR de la misma
ruta. `XrHeartExperience` conserva íntegro el componente anterior, salvo su
nombre. Cambiar modo desmonta el anterior y apaga su cámara. Al volver a un
modo se inicia una sesión nueva; no existe cache global entre modos.

`useHandPointer` sólo generaliza el tipo de resultado del picker. No modifica
el algoritmo ni los umbrales de `HandInteraction`. Las escenas proporcionan
el mismo contrato de rectángulo, hit test y selección.

En `src/features/xr/atlas/`:

- `state.ts`: reducer con `systemVisibility`, `systemOpacity`,
  `hiddenStructures`, `isolatedStructure`, `selectedStructure` y `explodedAmount`
  independientes.
- `assets.ts`: propietario de los gestores existentes, uno por sistema activado.
  Un módulo en vuelo por sistema; máximo tres si se activan rápidamente todos.
  Un sistema desactivado sigue completando la carga ya solicitada y la retiene.
  Reintentar recupera un catálogo fallido o las regiones fallidas del gestor.
- `presentation.ts`: colección de meshes visible, materiales de instancia,
  raycast real y adaptación de offsets regionales existentes.
- `education.ts`: ID/nodo → resolutores educativos y procedencia existentes.
- `XrAtlasScene.tsx`: Canvas propio, cámara XR y grupo raíz común para rotación
  y escala. Normaliza una vez el marco corporal completo, nunca cada región.
- `XrAtlasExperience.tsx`, `XrAtlasCard.tsx`, `atlas-xr.css`: panel, acciones,
  ficha y composición de los hooks de interacción existentes.

No importa `AtlasScene`, `SkeletalAtlas`, sus controles, navegación o árbol.
`SceneBoundary` se reutiliza exclusivamente para errores de renderizado.

## Capas, ficha y acciones

Inicio: Óseo ON, Muscular/Cardiovascular OFF. Cada activación solicita únicamente
el catálogo y módulos del sistema elegido. Indicadores discretos de carga y
reintento; las regiones ya listas aparecen progresivamente.

Opacidad: 10–100%, mismo rango del Atlas. Los materiales de presentación se
clonan a partir del placeholder propio del loader, se colorean por categoría
y se comparten dentro de XR: 2 variantes óseas, 2 musculares y 6 cardiovasculares.
Highlight cyan conserva opacidad, transparencia y depthWrite del sistema;
desseleccionar devuelve la misma variante base. Ningún material compartido con
otra experiencia se modifica. Al terminar se restauran referencias y posiciones
de instancia y se liberan clones; el gestor conserva la propiedad de geometrías.

El raycast prepara la colección al cargar y actualiza la lista pickable cuando
cambia la visibilidad. Usa las matrices renderizadas de Three.js, cámara,
rotación/escala del root, posición real y despiece. Sólo considera sistemas
activos y estructuras visibles; transparencia no implica click-through. Una
estructura tapada se alcanza apagando/ocultando la capa que la cubre. La
selección por manos mantiene el snapshot de XR 1.3 y valida que el objeto siga
siendo visible al soltar. No se hace raycast en cada frame de render.

Ficha: nombre, latín, sistema, región, campos documentados, fuentes educativas
y fuente/licencia del modelo. Usa fichas óseas específicas cuando existen;
si sólo hay una ficha de familia lo indica. Los componentes musculares conservan
su alcance y no reciben una ficha inventada. Las fichas cardiovasculares muestran
sus campos originales (recorrido, territorio, etc.), sin renombrarlos como una
función inexistente. Si faltan datos detallados se muestran sólo los disponibles.
Los IDs internos y métricas nunca aparecen en la ficha pública.

- **Aislar:** filtra por la estructura seleccionada y sus descendientes catalogados.
  No cambia toggles, opacidades ni ocultaciones. Mientras está aislada, los
  controles de capas quedan deshabilitados; **Restaurar** devuelve exactamente
  los filtros anteriores. También hay «Restaurar conjunto» si se cierra la ficha.
- **Ocultar:** oculta esa unidad catalogada; limpia selección y sale de su
  aislamiento, si lo había.
- **Restaurar estructuras:** limpia sólo ocultaciones manuales, sin activar sistemas.
- **Restablecer vista / tecla 0:** rotación inicial, escala 1 y despiece 0.
- **Restaurar atlas:** Óseo ON, los demás OFF, todas las opacidades 100%, sin
  ocultaciones, aislamiento ni selección. Conserva la rotación/escala/despiece.

Despiece: slider 0–100%, usando `createExplosionOffsets` y `explosionTarget`
del Atlas con nivel **regions**, su nivel inicial. Aplica offsets de presentación
a instancias XR; en 0 copia exactamente `basePosition`, sin acumulación.
No añade otro algoritmo ni modifica el despiece estable. No hay árbol, búsqueda
ni niveles regionales de capas en esta iteración.

## Interacción y accesibilidad

Mouse: click selecciona, drag rota, wheel escala. Touch: tap selecciona, drag
rota y dos dedos escalan. Teclado: flechas, +/−, 0 y Escape. Botones y sliders
son controles nativos etiquetados, con foco visible; la selección se anuncia
mediante aria-live. Panel y ficha no desmontan el Canvas.

Manos: índice apunta, pinch breve selecciona al soltar, pinch mantenido/movido
rota el **cuerpo completo**, dos pinches escalan el mismo root. Calibración intacta:
movimiento 0,040; pinch corto nominal 450 ms con tolerancia hasta antes de 550 ms;
hold 550 ms; entrada <0,34; salida 0,43; suavizado del cursor 45 ms;
escala 0,55–1,80. Ninguna manipulación afecta individualmente al objeto seleccionado.

La cámara sigue siendo opcional, local, sin grabación/uploads ni persistencia de
landmarks. `?xrDebug=1` conserva el panel de calibración sólo en desarrollo.
No se ha implementado interacción gestual con toggles/sliders: mouse, touch y
teclado los controlan; esa ampliación de UI se deja para XR 1.5.

Responsive: 1366, 1050, 900, 768 y 390 px sin overflow. En móvil, capas/despiece
son una sección plegable debajo del modelo; la ficha ocupa como máximo 42dvh.
No cubre permanentemente el cuerpo. Se conserva cierre fácil y foco al viewport.

## Red y memoria

QA de producción:

- Corazón: sólo `models/heart.glb`, sin catálogos corporales.
- Atlas Óseo: un catálogo óseo y sus 7 GLB; cero catálogos/GLB Muscular o Cardio.
- Activar Muscular: añade su catálogo y 18 GLB; cero requests cardiovasculares.
- Activar Cardiovascular: añade su catálogo y 7 GLB.
- Total: exactamente 32 GLB distintos. Ningún catálogo/asset de los otros ocho
  sistemas; no se detectó ninguna dependencia anatómica adicional.
- Cinco ciclos Muscular OFF/ON: misma escena y Canvas, 4 materiales XR y
  387 geometrías, mismos listeners y mismo número de requests. Sin recargas.
- Al cambiar de modo se libera todo y la cámara se detiene. Carga tardía después
  de dispose no puede publicar recursos. Retry de catálogo y liberación única
  están cubiertos por pruebas automatizadas.

Memoria de buffers geométricos decodificados: 7.609.772 bytes óseos;
24.905.752 con músculos; 36.207.208 con los tres sistemas. No representa toda la
RAM ni VRAM: excluye materiales, driver, buffers del renderer y MediaPipe.
Apagar capas conserva esa memoria hasta salir del modo. No se añade un sistema
de unloading, LODs ni degradación geométrica.

Los catálogos añaden 238.232 bytes óseos, 291.651 musculares y 170.615
cardiovasculares. Payload anatómico acumulado (GLB + JSON, sin HTTP/JS/WASM):
4.155.172, 13.864.687 y 19.684.582 bytes, respectivamente. Todos se sirven sin
compresión de transporte en esta prueba local.

## Rendimiento observado

Chrome headless local, 1366×1000, build de producción, GLB reales desde localhost,
opacidades 100%, MediaPipe/Worker/WASM reales sobre vídeo sintético sin manos físicas. Muestras
de tres segundos por estado; timing de render basado en una ventana de 60 frames.

| Capas activas | Módulos | Meshes visibles | Triángulos cargados | Bytes GLB | Draw calls | Intervalo frame aprox. | CPU render aprox. | Inferencias/s |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Óseo | 7 | 205 | 512450 | 3916940 | 205 | 6,94 ms | 1,89 ms | 6,61 |
| Óseo + Muscular | 25 | 387 | 1398310 | 13334804 | 387 | 7,53 ms | 2,99 ms | 7,64 |
| Los tres | 32 | 549 | 2083326 | 18984084 | 549 | 10,09 ms | 4,48 ms | 6,29 |

Tiempo desde activar cada sistema (incluye su catálogo), medido al renderizar:

| Sistema añadido | Primera geometría | Sistema completo |
| --- | ---: | ---: |
| Óseo | 317,6 ms | 529,3 ms |
| Muscular | 151,2 ms | 963,7 ms |
| Cardiovascular | 151,9 ms | 543,1 ms |

Estos intervalos **no se presentan como FPS**. CPU render mide envío de comandos
en callbacks, no tiempo completo de GPU; headless no mide presentación física
de pantalla. Las inferencias cuentan respuestas reales del Worker durante la
muestra, no su límite teórico de 20 Hz. El vídeo sin manos no reproduce el coste
de landmarks físicos. No son garantías para móviles ni otros equipos.
No se observaron problemas graves en esta prueba local; se mantiene Óseo solo
por defecto y las demás capas se activan según necesidad.

Instrumentación de QA sólo con `?xrQa=1`: getter de sólo lectura
`window.__med3dXrAtlas`, sin controles de estado, telemetría ni landmarks. Permite
inspeccionar los objetos realmente renderizados, proyección de puntos, conteos,
timings y pose. Se elimina al salir. No aparece como UI de producto.

## Pruebas y capturas

`scripts/xr/atlas.test.mjs`: 11 grupos nuevos con los GLB reales, estado inicial,
carga/retención, fallo/retry, cancelación tardía, opacidad, fuentes intactas,
highlight, selección de los tres sistemas con transforms y despiece, exclusión
de ocultos, hide/isolate/restore, despiece 0/50/100, reset separado, fichas y
continuidad del arbitraje gestual. El conjunto XR contiene 57 pruebas.

`scripts/xr/atlas-browser-qa.mjs`: ocho grupos PASS con controles reales,
network, cinco ciclos de recursos, sliders por teclado, fichas, manos sintéticas,
responsive/touch, webcam sintética y MediaPipe real. Se revisaron las diez capturas
en `.cache/xr-atlas-pilot/`, ignoradas por Git y marcadas como simuladas:

1. [Óseo](../.cache/xr-atlas-pilot/01-oseo.png)
2. [Óseo y Muscular](../.cache/xr-atlas-pilot/02-oseo-muscular.png)
3. [Tres sistemas](../.cache/xr-atlas-pilot/03-tres-sistemas.png)
4. [Ficha](../.cache/xr-atlas-pilot/04-seleccion.png)
5. [Aislamiento](../.cache/xr-atlas-pilot/05-aislada.png)
6. [Opacidad](../.cache/xr-atlas-pilot/06-opacidad-muscular.png)
7. [Despiece](../.cache/xr-atlas-pilot/07-despiece.png)
8. [Panel](../.cache/xr-atlas-pilot/08-panel-capas.png)
9. [Mobile](../.cache/xr-atlas-pilot/09-mobile.png)
10. [Corazón](../.cache/xr-atlas-pilot/10-corazon.png)

El script acepta `XR_QA_ORIGIN`, `XR_PLAYWRIGHT_MODULE` y
`XR_BROWSER_EXECUTABLE`, o módulo Playwright y ejecutable como argumentos:

```sh
node scripts/xr/atlas-browser-qa.mjs [ruta-modulo-playwright] [ejecutable-chromium]
```

Resultados y requests: `.cache/xr-atlas-pilot/browser-results.json`.

## Validación final y auditoría

- `npm run test:xr`: **57/57 PASS**.
- `npm run typecheck`: **PASS**.
- `npm run verify:anatomy`: **PASS**, exactamente una ejecución al final de XR 1.4.
- `npm run build`: **PASS**, 4 páginas estáticas y 15 redirecciones. Se usó el
  adaptador Rollup WASM local existente, sin cambios de dependencias. Persiste
  el aviso previo del chunk Meshopt mayor de 500 KB.
- `git diff --check`: **PASS**.
- Regresión Corazón: 13 resultados de manos, 3 grupos de selección manual,
  16 resultados de cámara/controles/cleanup y 10 de calibración: **PASS**.
- Home, Anatomía, About, Corazón, Pulmones y Encéfalo: carga sin errores JS/HTTP
  ni overflow. Se conserva el aviso previo de deprecación de `THREE.Clock`.

La primera comparación binaria de capturas del pinch en Corazón falló de forma
intermitente; la repetición completa pasó sin cambios en el producto ni relajar
la comparación. Se añadieron únicamente capturas de diagnóstico en caso de
futuro fallo. No se afirma una causa física de esa diferencia. La calibración
también pasó su QA separado y conserva todas las pruebas de pose/umbrales.

Los 32 GLB coinciden en bytes y SHA-256 con sus catálogos. Diff vacío para todos
los modelos y archivos anatómicos, atlas, cámaras previas, loaders/asset manager,
datos, IDs, jerarquías, Home/About/órganos, MediaPipe/Worker y dependencias.
`handConfig.ts`, `handInteraction.ts`, `handPointer.ts` y `gestures.ts` intactos.
La comparación del antiguo `XrExperiencePage` con `XrHeartExperience` confirma
contenido idéntico salvo el nombre de la función exportada.

Archivos creados: nueve de producto (`XrHeartExperience.tsx` y los ocho de
`xr/atlas/`), dos scripts de QA y este documento. Modificados: selector de modo
`XrExperiencePage.tsx`, contrato genérico de tipos en `useHandPointer.ts`, estilos
del selector en `xr.css` y diagnóstico de capturas en `hand-selection-browser-qa.mjs`.

## Límites y prueba física pendiente

**Atlas XR no está físicamente validado.** El usuario debe probar con su webcam:
entrar a Atlas XR; activar capas progresivamente; seleccionar hueso, músculo y
vaso; ocultar la capa superficial y seleccionar debajo; variar opacidad;
aislar/restaurar; despiece; rotación de una mano y escala con dos; alternar con
mouse/touch; cambiar de modo y confirmar que la cámara se apaga.

Las estructuras pequeñas exigen zoom y pueden quedar ocluidas; transparencia
convencional de Three.js tiene limitaciones de ordenación. El despiece no es una
simulación física ni modifica el registro; se utiliza el nivel regional existente.
No hay autofocus de piezas, búsqueda o árbol. Las fichas dependen de la cobertura
editorial actual; algunos componentes sólo tienen metadata básica.

Para la prueba local: `npm run dev` y
`http://localhost:5173/med3d/experiencia-xr/`. En este entorno Windows se usa el
adaptador existente `NODE_OPTIONS=--require=./.cache/home-redesign/rollup-wasm.cjs`.
Activar la cámara explícitamente; para métricas de pinch añadir `?xrDebug=1` al
servidor de desarrollo. No se necesita grabar vídeo.

## Trabajo posterior, sólo documentado

XR 1.5 podría ampliar a Nervioso, Respiratorio, Digestivo, Urinario, Endocrino,
Linfático, Reproductor y Tegumentario; también estudiar UI gestual de capas/sliders.
No están implementados en este piloto. XR Fase 2 — Meta Quest / WebXR inmersivo —
permanece pendiente: sin sesiones immersive-ar/vr, passthrough, anchors, detección
de planos ni hand tracking nativo de visor. Sin push, merge ni deploy.

## Inventario de módulos reutilizados

| ID existente | GLB existente |
| --- | --- |
| `skeletal:arm-left` | `models/anatomy/skeletal/arm-left.glb` |
| `skeletal:arm-right` | `models/anatomy/skeletal/arm-right.glb` |
| `skeletal:leg-left` | `models/anatomy/skeletal/leg-left.glb` |
| `skeletal:leg-right` | `models/anatomy/skeletal/leg-right.glb` |
| `skeletal:skull` | `models/anatomy/skeletal/skull.glb` |
| `skeletal:spine` | `models/anatomy/skeletal/spine.glb` |
| `skeletal:thorax` | `models/anatomy/skeletal/thorax.glb` |
| `muscular:upper-right` | `models/anatomy/muscular/muscular-upper-right.glb` |
| `muscular:upper-left` | `models/anatomy/muscular/muscular-upper-left.glb` |
| `muscular:thorax-anterior` | `models/anatomy/muscular/muscular-torso-anterior.glb` |
| `muscular:abdomen` | `models/anatomy/muscular/muscular-abdomen.glb` |
| `muscular:back` | `models/anatomy/muscular/muscular-torso-posterior.glb` |
| `muscular:gluteal-right` | `models/anatomy/muscular/muscular-gluteal-right.glb` |
| `muscular:gluteal-left` | `models/anatomy/muscular/muscular-gluteal-left.glb` |
| `muscular:thigh-right` | `models/anatomy/muscular/muscular-thigh-right.glb` |
| `muscular:thigh-left` | `models/anatomy/muscular/muscular-thigh-left.glb` |
| `muscular:leg-right` | `models/anatomy/muscular/muscular-leg-right.glb` |
| `muscular:leg-left` | `models/anatomy/muscular/muscular-leg-left.glb` |
| `muscular:forearm-right` | `models/anatomy/muscular/muscular-forearm-right.glb` |
| `muscular:forearm-left` | `models/anatomy/muscular/muscular-forearm-left.glb` |
| `muscular:neck` | `models/anatomy/muscular/muscular-neck.glb` |
| `muscular:hand-right` | `models/anatomy/muscular/muscular-hand-right.glb` |
| `muscular:hand-left` | `models/anatomy/muscular/muscular-hand-left.glb` |
| `muscular:foot-right` | `models/anatomy/muscular/muscular-foot-right.glb` |
| `muscular:foot-left` | `models/anatomy/muscular/muscular-foot-left.glb` |
| `cardio:head-neck` | `models/anatomy/cardiovascular/head-neck.glb` |
| `cardio:heart` | `models/anatomy/cardiovascular/heart.glb` |
| `cardio:lower-left` | `models/anatomy/cardiovascular/lower-left.glb` |
| `cardio:lower-right` | `models/anatomy/cardiovascular/lower-right.glb` |
| `cardio:trunk` | `models/anatomy/cardiovascular/trunk.glb` |
| `cardio:upper-left` | `models/anatomy/cardiovascular/upper-left.glb` |
| `cardio:upper-right` | `models/anatomy/cardiovascular/upper-right.glb` |
