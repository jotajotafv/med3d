# MED3D XR 1.1 · Selección anatómica y ficha educativa

Validado localmente el 9 de octubre de 2026 sobre `phase-xr-experience`.
SHA base: `56c2af30a22c24db11377489853a4f9a57309334` (árbol limpio al iniciar).
Entrega mediante commit local `Add anatomical selection and educational cards to XR heart`.
Sin push, merge ni deploy. XR Fase 2 y selección con manos no implementadas.

## Inspección previa y fuente de verdad

Se revisaron `LegacyOrganAtlas.tsx`, `AnatomyScene.tsx`, `data.ts`, `model-index.ts`,
`education.ts` y el GLB real antes de implementar.

El explorador Corazón usa el nombre de `event.object` obtenido por el raycast de
R3F, rechaza arrastres con `event.delta` y resuelve el nombre mediante
`selectionFromScene` / `STRUCTURES`. `model-index.ts` proporciona las identidades;
`data.ts` aporta los nombres de presentación y las definiciones del modelo;
`education.ts` contiene las notas educativas. El nuevo adaptador importa esas
fuentes directamente. No se copiaron textos ni se creó un catálogo alternativo.

`heart.glb` tiene 14 mallas separadas bajo `VH_M_heart`, y un material original
compartido (`heart_mat`). La raíz es un grupo, no una estructura superficial
seleccionable. Todos los nombres de malla coinciden exactamente con IDs existentes.

## Cobertura real

Hay **14 estructuras identificadas y elegibles para raycast**, con **9 notas
educativas completas y 5 fichas de identificación parcial**. La selección exige
que la superficie sea visible desde la cámara: las piezas interiores pueden estar
ocultas por otras mallas. Esta iteración no añade cortes, transparencia, aislamiento,
explosión, subdivisiones ni geometría para hacerlas accesibles.

| ID / nombre real de malla | Nombre existente | Nota educativa específica |
| --- | --- | --- |
| `VH_M_mitral_valve` | Válvula mitral | Sí |
| `VH_M_tricuspid_valve` | Válvula tricúspide | Sí |
| `VH_M_aortic_valve` | Válvula aórtica | Sí |
| `VH_M_pulmonary_valve` | Válvula pulmonar | Sí |
| `VH_M_papillary_muscle_of_heart_anterior` | Músculo papilar anterior | No |
| `VH_M_papillary_muscle_of_heart_anterolateral` | Músculo papilar anterolateral | No |
| `VH_M_papillary_muscle_of_heart_medial` | Músculo papilar septal | No |
| `VH_M_papillary_muscle_of_heart_posterior` | Músculo papilar posterior | No |
| `VH_M_papillary_muscle_of_heart_posteromedial` | Músculo papilar posteromedial | No |
| `VH_M_left_cardiac_atrium` | Aurícula izquierda | Sí |
| `VH_M_right_cardiac_atrium` | Aurícula derecha | Sí |
| `VH_M_heart_right_ventricle` | Ventrículo derecho | Sí |
| `VH_M_interventricular_septum` | Tabique interventricular | Sí |
| `VH_M_heart_left_ventricle` | Ventrículo izquierdo | Sí |

Los cinco papilares muestran su nombre, sistema y procedencia del modelo. No se
les atribuye la descripción del corazón completo ni se inventan nombres latinos,
regiones, funciones o relaciones ausentes. Un nombre desconocido devuelve `null`;
si se alcanza una malla desconocida se limpia la selección y se comunica que aún
no dispone de información educativa, sin abrir una ficha falsa.

## Raycast y estado

`selection.ts` prepara una colección de mallas y un mapa por objeto una sola vez
al cargar el recurso. `selectedStructure` conserva el ID existente, la referencia
a la malla y referencias a su metadata; nunca copia geometría.

Al confirmar un click/tap, `SelectionRaycast` obtiene el rectángulo real del
canvas y la cámara actual de R3F. Convierte las coordenadas del puntero a NDC,
actualiza las matrices de mundo —incluidos los grupos contenedores XR— y usa
`THREE.Raycaster.setFromCamera` / `intersectObjects` sobre la colección preparada.
Se elige la primera intersección visible. Una malla desconocida también ocluye:
no se selecciona una estructura conocida situada detrás de ella.

Se utilizan las transformaciones renderizadas, incluida la interpolación, en vez
de calcular posiciones aproximadas a partir de los objetivos de los gestos.
La selección contempla posición, rotación, escala, cámara y proporción del canvas.
No hay raycasts por frame ni hover. El recorrido completo se hace al cargar;
durante una selección sólo se actualizan matrices y se intersectan las 14 mallas.

La carga del GLB depende del recurso/reintento, no de `selectedStructure`. La ficha
vive fuera del canvas. Cambiar, abrir o cerrar la selección mantiene la escena y
el recurso cargados. La prueba de navegador confirma identidad del mismo nodo
canvas y una sola petición a `heart.glb` durante todas esas operaciones.

## Click, drag y touch

- `pointerDown` inicia un candidato y conserva la prioridad del control manual.
- Un desplazamiento máximo de **6 píxeles CSS** o menos y una duración de
  **450 ms** o menos permiten selección al recibir `pointerUp`.
- Superar el umbral activa rotación y cancela definitivamente el candidato,
  incluso si el puntero vuelve a su origen. También se comprueba la posición final.
- Dos dedos, cancelación, pérdida de captura y pérdida de foco impiden un tap.
  Dos dedos siguen escalando; al quedar uno puede continuar la manipulación.
- Click/tap en vacío limpia la selección. Otra estructura sustituye directamente
  a la anterior. Escape y el botón de cierre limpian la ficha y el resaltado.
- El botón de cierre devuelve el foco al viewport sin desplazar la página.
  Los controles, enlaces y vídeo no generan selecciones.

Los gestos de manos siguen siendo una mano + pinch para rotar y dos manos + pinch
para escalar. No se ha cambiado su controlador, Worker, cámara ni ciclo de vida.
La entrada manual conserva su prioridad mientras el usuario toca el viewport.

## Ficha, presentación y accesibilidad

`XrEducationCard.tsx` muestra inicialmente sólo el encabezado «SELECCIONA UNA
ESTRUCTURA» y «Toca o haz clic sobre el corazón para explorar su anatomía» en su
área educativa. Al seleccionar presenta:

1. Encabezado ANATOMÍA, nombre y nombre latino cuando existe.
2. Sistema y región disponible.
3. Descripción, función y relaciones existentes, resueltas a nombres educativos.
4. Enlace a la fuente educativa y procedencia/licencia del modelo por separado.

Las fuentes de las notas se importan de `EDUCATION` (por ejemplo, la ficha del
ventrículo derecho enlaza al NHLBI). Fuente y licencia del recurso se derivan de
`SOURCE_CREDIT` y `MODEL_DEFINITIONS.heart.sourceUrl`: **HRA / HuBMAP · CC BY 4.0**.
Esta licencia se etiqueta como licencia del modelo, sin atribuírsela al contenido
de las fuentes educativas externas. No se muestran IDs técnicos, UUID, nombres
internos, estadísticas de geometría o datos de raycast en el texto de la interfaz.

La ficha tiene fondo negro casi opaco, borde fino, tipografía Geist heredada y
acentos cyan discretos. En desktop flota a la derecha (310 px); en tablet se reduce
a 280 px. Su cuerpo tiene scroll independiente y el cierre queda accesible.
En móvil ocupa como máximo **44dvh** en un bottom sheet. Al seleccionar se desplaza
la página hasta el viewport, respetando el margen de navegación existente, para
dejar visible el corazón encima de la ficha. No se cambia el tamaño del canvas ni
la cámara. No hay backdrop modal ni bloqueo del resto de la página.

Incluye encabezados semánticos, botón real con `aria-label`, foco visible y una
región `aria-live="polite"` que anuncia los cambios de selección; no hay anuncios
de hover ni por frame. La ficha no roba el foco al seleccionar con puntero.

## Resaltado y protección de recursos

Sólo la malla seleccionada recibe un clon temporal de su material. Sobre ese clon
se aplica emissive cyan suave, intensidad 0,24. El resto de mallas conserva su
material compartido. Al cambiar, cerrar o desmontar se reasigna exactamente la
referencia original y se libera el clon una sola vez. La limpieza del recurso
restaura primero el material original antes de liberar la instancia XR.

Geometrías, texturas y transforms del modelo no se clonan ni modifican para la
selección. La prueba comprueba identidad de geometría/material, matriz original,
propiedades del material fuente y disposición única de los clones. En navegador,
la captura del canvas tras cerrar coincide exactamente con la captura inicial.

## Validación

- `npm run test:xr`: **21/21 PASS** (13 existentes y 8 nuevas).
- `npm run typecheck`: PASS.
- `npm run verify:anatomy`: PASS; ejecutado **una sola vez al final** de esta iteración.
- `npm run build`: PASS; 4 páginas estáticas y 15 redirecciones de compatibilidad.
  Se utilizó el adaptador Rollup WASM local ya existente mediante
  `NODE_OPTIONS=--require=./.cache/home-redesign/rollup-wasm.cjs`, debido a la
  restricción del binario nativo de este entorno Windows. Sin cambios en dependencias.
  Persiste el aviso de tamaño del chunk Meshopt existente.
- `git diff --check`: PASS.

Las pruebas nuevas de Node cargan el GLB real y comprueban la cobertura, mapping,
ausencia de datos inventados, intención del puntero, raycast transformado,
restauración de materiales y renderizado condicional de campos. Los módulos
TypeScript se transpilan para Node únicamente en `.cache/xr-selection-tests`.

`scripts/xr/selection-browser-qa.mjs` valida en Chromium real contra el build:

| Requisito | Evidencia |
| --- | --- |
| Click sin movimiento | Selección real del ventrículo derecho |
| Drag sin selección accidental | Preserva la selección o permanece vacío; cambia la pose |
| Tap corto | Eventos touch reales de Chromium seleccionan |
| Tap fuera | Limpia selección |
| A → B | Ventrículo derecho → izquierdo |
| Escape / cierre | Limpian y restauran; cierre devuelve foco |
| Mapping / desconocidos | Pruebas sobre los 14 meshes reales y nombres no reconocidos |
| Canvas persistente | Misma identidad DOM y un solo GET de `heart.glb` |
| Rotación y escala XR | Raycast real después de drag/wheel y touch/pinch |
| Cámara activa | Selección manual con Worker/WASM/MediaPipe real y vídeo sintético |

También pasó `scripts/xr/browser-qa.mjs` sin modificar: 16 resultados, incluidos
cinco anchos responsive, mouse/teclado/touch, errores y cancelación de cámara,
MediaPipe real, gestos de una/dos manos con landmarks sintéticos, pérdida y
recuperación, pausa de pestaña y limpieza al navegar. No se usó webcam física.

Regresión rápida: Home, Anatomía, About, Corazón, Pulmones y Encéfalo cargan a
1366 px sin errores JS/HTTP ni overflow. Persiste el aviso previo de `THREE.Clock`
en el atlas/exploradores. No se cambiaron sus fuentes ni comportamiento.

Ejecución reproducible contra un servidor del build en el puerto 5184:

```sh
node scripts/xr/selection-browser-qa.mjs [ruta-al-modulo-playwright] [ejecutable-chromium]
node scripts/xr/browser-qa.mjs [ruta-al-modulo-playwright] [ejecutable-chromium]
```

Se pueden usar `XR_QA_ORIGIN`, `XR_PLAYWRIGHT_MODULE` y `XR_BROWSER_EXECUTABLE`.
Los resultados y capturas locales no se versionan:

- [01 · Sin selección](../.cache/xr-selection/01-xr-sin-seleccion.png)
- [02 · Estructura seleccionada](../.cache/xr-selection/02-estructura-seleccionada.png)
- [03 · Otra estructura](../.cache/xr-selection/03-otra-estructura.png)
- [04 · Ficha cerrada](../.cache/xr-selection/04-ficha-cerrada.png)
- [05 · Rotado y escalado con selección](../.cache/xr-selection/05-rotado-escalado-seleccionado.png)
- [06 · Mobile con bottom sheet](../.cache/xr-selection/06-mobile-bottom-sheet.png)

Se revisaron visualmente las seis capturas. Logs: `.cache/xr-selection/`, incluidos
`browser-results.json`, `phase1-regression.txt`, `routes-regression.txt` y
`final-audit.json`.

## Auditoría del diff y límites

El código de producto cambia exclusivamente dentro de `src/features/xr/`; fuera
de ahí sólo se añaden dos scripts de QA y este documento. No se modifican assets,
GLB, geometrías, catálogo, IDs, fuentes anatómicas, cámaras del atlas, explorador
Corazón, rutas, dependencias ni los gestos de manos existentes.

`public/models/heart.glb`: 715.820 bytes; SHA-256
`4637d0779ee7c278cf81a326c933528421372bf0aa709188c20308a6ad81b3a1`.
La comparación con el commit base no presenta cambios en `public/` ni en
`src/features/anatomy/`, componentes compartidos o rutas.

La cobertura de metadata no garantiza acceso a todas las piezas interiores
desde el exterior. No hay hover ni selección por manos; los cinco papilares
carecen de nota educativa específica. Touch y tracking se validaron mediante
entradas sintéticas en Chromium; no se afirma una validación en móvil físico,
webcam física o un visor XR.

## Próximo paso documentado: XR 1.2

Evaluar un cursor anatómico controlado por el índice, pinch corto para seleccionar
y una separación explícita entre pinch de selección y de manipulación. **Sólo
documentado: no implementado en XR 1.1.** No se inicia XR Fase 2.
