# XR 1.3 — CALIBRACIÓN FÍSICA — ITERACIÓN 1

Base: `e04959de1142c2767d71dfbc7a76d30ad01e25a8`, rama
`phase-xr-experience`. Iteración local de ergonomía; no inicia XR Fase 2.

## Evidencia física recibida

El usuario probó XR 1.2 con su webcam y sus manos:

1. El cursor y el apuntado con el índice funcionan bien.
2. A veces se inicia rotación cuando sólo quiere apuntar.
3. El pinch de selección requiere varios intentos para abrir la ficha.

Ese feedback tiene prioridad sobre los umbrales sintéticos de XR 1.2.
Los valores siguientes son una primera calibración basada en ese feedback.
**No están físicamente validados por Codex. La segunda prueba con webcam queda
pendiente del usuario.** Las pruebas de esta entrega utilizan entradas sintéticas.

## Ajustes controlados

| Parámetro | XR 1.2 | XR 1.3 | Motivo |
| --- | --- | --- | --- |
| Movimiento para rotar | 0,025 | **0,040** | Tolerar más jitter antes de interpretar manipulación |
| Pinch corto nominal | 280 ms | **450 ms** | Permitir cerrar y abrir los dedos a un ritmo natural |
| Hold | 330 ms | **550 ms** | Exigir una intención sostenida más clara para rotar |
| Entrada de pinch | 0,30 | **0,34** | Detectar un cierre menos estricto |
| Salida de pinch | 0,43 | **0,43** | Conservar histéresis sin ajustar ambos umbrales a la vez |
| Suavizado del índice | 45 ms | **45 ms** | El usuario considera correcto el apuntado |
| Sensibilidad de rotación | 2π | **2π** | Cambia la intención necesaria, no la velocidad de giro |
| Límites de escala | 0,55–1,80 | **0,55–1,80** | Escala de dos manos sin recalibrar |

Los valores residen en `src/features/xr/handConfig.ts`. La comparación existente
de entrada es `ratio < 0.34`; una vez cerrado, permanece pinch mientras
`ratio < 0.43`. El ratio es la distancia pulgar–índice normalizada por la palma.
El movimiento es el desplazamiento desde el inicio del pinch, en unidades de
altura de vídeo: `hypot(dx * aspect, dy)`. **No son píxeles del cursor.**

## Arbitraje y ausencia de zona muerta

- Mano abierta: apuntar; no cambia la rotación.
- Pinch: candidato; conserva el objetivo del raycast al inicio y no escribe
  rotación. El filtro/anchor existente sigue actualizado para evitar saltos.
- Liberación estable hasta 450 ms: selecciona el objetivo guardado.
- Liberación estable entre 450 y **menos de 550 ms**: también selecciona.
  Esta tolerancia elimina el intervalo anterior en que se perdía el gesto.
- Movimiento **mayor que 0,040** o hold **desde 550 ms**: pasa a rotación.
  Desde ese momento nunca selecciona al soltar, aunque vuelva al origen.
- Dos pinches: prioridad inmediata para la escala existente. Se cancela el
  candidato. La transición de dos a una mano conserva su manipulación anterior.

No se selecciona al cerrar los dedos. El snapshot no cambia al pasar a otra
estructura durante un jitter moderado; no exige permanecer en el mismo píxel.
Un pinch válido sobre vacío sigue deseleccionando. Salir del área válida,
perder tracking o recibir input manual cancela el candidato.

La inspección detectó otra entrada a rotación inmediata: adquirir una mano ya
cerrada o recibir el pinch de la mano secundaria. Ahora también debe superar
movimiento/hold. Ese candidato no puede seleccionar: se exige haber observado
la transición abierta → cerrada de la mano principal. Esto evita que la
recuperación del tracking produzca un clic falso.

El raycast, la colección de meshes, el mapeo educativo, el resaltado del órgano,
la ficha y la proyección del índice permanecen iguales a XR 1.2.

## Feedback e instrumentación

El círculo normal mantiene posición, tamaño y suavizado. Durante candidate se
rellena ligeramente; al confirmar una estructura aparece un anillo cyan de
220 ms; durante rotate el borde es discontinuo y discreto. La animación respeta
`prefers-reduced-motion`. Candidate no modifica materiales del corazón.

El panel aparece **sólo en desarrollo y con `?xrDebug=1`**. Sin query no aparece;
un build de producción lo omite incluso con query. Muestra exclusivamente el
último resumen al terminar/interrumpir el pinch:

1. Duración en milisegundos.
2. Desplazamiento máximo observado durante candidate, incluida la muestra que
   cruza el umbral; no es la distancia acumulada ni el desplazamiento final.
3. Resultado `select`, `rotate` o `cancel`.
4. Ratio mínimo mientras se observó el pinch.

`select` incluye la deselección mediante un pinch válido en vacío. Interrumpir
candidate con otra mano, tracking inválido o input manual produce `cancel`.
No se registra la fase de escala de dos manos. La duración se mide entre
muestras observadas; un corte de inferencia no añade tiempo sin tracking.

Sólo se conserva un resumen en memoria de React. No hay historial, almacenamiento,
telemetría, vídeo adicional ni landmarks persistidos. Recargar lo borra. El
resumen se calcula únicamente si está conectado el callback de debug; el
producto publicado no lo conecta. Los temporizadores de cursor se limpian al
parar/desmontar.

## Segunda prueba física: instrucciones exactas

En PowerShell, desde este equipo, iniciar únicamente el servidor local:

```powershell
cd C:\Users\jotaj\Desktop\med3d
$env:NODE_OPTIONS='--require=./.cache/home-redesign/rollup-wasm.cjs'
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

El adaptador de Rollup ya existe localmente en este entorno Windows; no añade
dependencias. Abrir:
`http://127.0.0.1:5173/med3d/experiencia-xr/?xrDebug=1`.

1. Pulsar **Activar control con manos** y conceder permiso a la webcam.
   Mantener iluminación y distancia similares a la primera prueba.
2. Con una sola mano abierta, apuntar durante 10 segundos y recorrer el corazón.
   Comprobar si aparece algún giro accidental; contar los casos.
3. Apuntar a una estructura, juntar índice/pulgar y soltar con naturalidad.
   Repetir **10 veces**, alternando dos estructuras visibles. Contar cuántas
   seleccionan al primer intento. No intentar cronometrar el gesto; observar
   relleno y pulso, y anotar los cuatro valores del debug para varios aciertos
   y para cada fallo.
4. Repetir un pinch estable algo más lento. Debe seleccionar si se libera antes
   del hold. Después mantenerlo claramente más de medio segundo y mover la
   mano: debe rotar y no abrir otra ficha al soltar.
5. Hacer un pinch con movimiento deliberado, volver al origen y soltar. Debe
   conservar la rotación sin convertirse en selección.
6. Hacer pinch con ambas manos y separarlas/acercarlas: debe conservar la escala.
7. Seleccionar una estructura y hacer pinch breve sobre vacío para deseleccionar.
   Ocultar/reintroducir la mano y alternar con mouse: sin selección accidental.
8. Desactivar el control. Recargar: el debug debe volver a «Sin pinch completado»
   y la cámara no debe activarse sola. Detener el servidor con **Ctrl+C**.

Para el siguiente ajuste bastan: navegador, iluminación/distancia aproximadas,
aciertos de los 10 intentos, número de giros accidentales y los cuatro valores
derivados de los ejemplos. No hace falta grabar ni compartir vídeo.

## Pruebas y regresión

`npm run test:xr`: **46/46 PASS**. Incluye jitter de mano abierta y candidate,
350/430 ms, límites 450/451/500/549/550/551 ms, movimiento a ambos lados de
0,040, histéresis, snapshot, pinch adquirido cerrado, cancelación por pérdida,
escala, métricas derivadas, raycast con poses reales y ficha existente.

Nuevo QA: `scripts/xr/physical-calibration-browser-qa.mjs`. Ejecuta Chrome con
vídeo/landmarks sintéticos, movimiento oscilatorio del índice y del punto de
pinch, y ratios próximos a entrada/salida. No utiliza sólo coordenadas fijas.
Comprueba apertura real de ficha, ausencia de giro mediante capturas del canvas
antes/después de limpiar selección, pulso, giro deliberado, hold, vacío, pérdida,
debug en desarrollo, ausencia en producción, limpieza y recarga.

Contra servidores locales de producción (5184) y desarrollo (5173):

```sh
node scripts/xr/physical-calibration-browser-qa.mjs [ruta-modulo-playwright] [ejecutable-chromium]
```

Admite `XR_QA_ORIGIN`, `XR_QA_DEV_ORIGIN`, `XR_PLAYWRIGHT_MODULE` y
`XR_BROWSER_EXECUTABLE`. El fixture sintético se comparte con el QA de XR 1.2;
no lo importa la aplicación. Artefactos ignorados en `.cache/xr-physical-calibration/`.

Resultados finales:

- `npm run typecheck`: **PASS**.
- `npm run verify:anatomy`: **PASS**, una sola ejecución al final de XR 1.3.
- `npm run build`: **PASS**, con el adaptador Rollup local existente; 4 páginas
  estáticas y 15 redirecciones. Persiste el aviso previo del chunk Meshopt >500 KB.
- `git diff --check`: **PASS**.
- QA de calibración: **10 resultados PASS**. Liberaciones sintéticas observadas
  de 389, 445 y 500 ms seleccionaron; jitter máximo aproximadamente 0,018 y
  ratio mínimo 0,326. Movimiento deliberado de 0,0676 y hold de 667 ms rotaron
  sin seleccionar. Son ejemplos del simulador, no mediciones físicas.
- `hand-selection-browser-qa.mjs`: **13 resultados PASS**, incluyendo A → B,
  escala, snapshot, prioridad manual, canvas persistente y una sola carga GLB.
- `selection-browser-qa.mjs`: **3 grupos PASS**, mouse/touch/drag, ficha,
  materiales restaurados y selección manual con MediaPipe real activo.
- `browser-qa.mjs`: **16 resultados PASS**, incluyendo teclado, cámara,
  Worker/WASM/MediaPipe reales con vídeo sintético, errores, privacidad de red,
  pérdida de manos, pausa/reanudación y cleanup al salir.
- Home, Anatomía, About, Corazón, Pulmones y Encéfalo cargaron a 1366 px sin
  errores JS/HTTP ni overflow. Conservan el aviso previo de `THREE.Clock`.
- Responsive del puntero probado a 1366, 1050, 900, 768 y 390 px.

Revisión visual de las capturas de selección, giro y mobile: ficha existente,
highlight existente, cursor discreto y bottom sheet conservados. Capturas y
logs están marcados como simulados:
[selección con debug](../.cache/xr-physical-calibration/02-seleccion-430ms-simulada.png),
[giro deliberado](../.cache/xr-physical-calibration/03-movimiento-intencional-simulado.png),
[mobile](../.cache/xr-hand-selection/07-mobile-pinch-simulado.png).

## Alcance y límites

La cadencia existente de inferencia (máximo 20 Hz) cuantiza las duraciones.
Iluminación, oclusiones, clasificación de mano y ergonomía aún requieren la
segunda prueba física. No se observó un falso inicio por el nuevo ratio en
los casos sintéticos; eso no demuestra ausencia de falsos positivos físicos.

No se modifican GLB, geometrías, catálogo, IDs, anatomía, materiales originales,
atlas, órganos, cámara, Worker, MediaPipe, modelo de manos, privacidad ni
dependencias. Tampoco la sensibilidad de giro, el cursor/proyección, el raycast,
la ficha o las matemáticas de escala. Sólo calibración, feedback e instrumentación
solicitados, con sus pruebas. Sin push, merge, deploy ni otra fase.

La auditoría del diff confirma únicamente seis archivos de producto dentro de
`src/features/xr/`, cinco archivos de QA y este documento. Hashes intactos:

- `public/models/heart.glb`, 715.820 bytes, SHA-256
  `4637d0779ee7c278cf81a326c933528421372bf0aa709188c20308a6ad81b3a1`.
- `public/xr/hand_landmarker.task`, 7.819.105 bytes, SHA-256
  `fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1`.
