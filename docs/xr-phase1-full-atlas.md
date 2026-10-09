# XR 1.6 — Atlas XR completo

Base: `1c17f6952daaba09f5af74351200ea003ca0ab0a`, rama `phase-xr-experience`. Estado inicial verificado limpio. Iteración de cobertura de XR Fase 1, sin nuevas interacciones ni cambios en XR Heart.

## Inventario actual verificado

La auditoría se realizó antes de implementar: catálogos actuales, manifiestos de procedencia y bytes reales de los 52 GLB. Se cotejaron SHA-256, tamaños y topología del JSON GLTF; los tests vuelven a cargar las geometrías con el loader de producción y verifican sus propietarios/triángulos. No se tomaron cifras de informes históricos.

“Estructuras” corresponde a `coverage.structures`: unidades anatómicas editoriales, no al número de mallas ni al total de nodos de agrupación/componentes. Nervioso suma la cobertura ocular que también compone el Atlas principal; no es un duodécimo sistema.

| ID | Módulos | Estructuras | Mallas | Triángulos | Bytes GLB | Inicial | Licencias |
|---|---:|---:|---:|---:|---:|---|---|
| skeletal | 7 | 203 | 205 | 512450 | 3916940 | ON | CC BY 4.0 |
| muscular | 18 | 152 | 182 | 885860 | 9417864 | OFF | CC BY 4.0 |
| nervous | 7 | 58 | 131 | 523036 | 4517228 | OFF | CC BY 4.0; CC BY-SA 4.0 |
| cardiovascular | 7 | 110 | 162 | 685016 | 5649280 | OFF | CC BY 4.0 |
| respiratory | 3 | 6 | 128 | 212484 | 2330012 | OFF | CC BY 4.0; CC BY-SA 2.1 Japan |
| digestive | 4 | 23 | 96 | 177240 | 1641196 | OFF | CC BY 4.0 |
| urinary | 1 | 6 | 6 | 9944 | 94872 | OFF | CC BY 4.0 |
| endocrine | 2 | 9 | 11 | 20166 | 467728 | OFF | CC BY 4.0; CC BY-SA 2.1 Japan |
| lymphatic | 1 | 2 | 3 | 3410 | 35160 | OFF | CC BY 4.0 |
| reproductive | 1 | 10 | 12 | 7184 | 93996 | OFF | CC BY 4.0 |
| integumentary | 1 | 1 | 1 | 203382 | 1631504 | OFF | CC BY 4.0 |

Total: **52 módulos, 580 unidades de cobertura, 937 mallas, 3.240.172 triángulos, 29.795.780 bytes GLB**. Todos usan `bodyparts3d-4.0-male`, metros, Y arriba.

Catálogos: `public/models/anatomy/<ID>/catalog.json`; Nervioso añade `public/models/anatomy/ocular/catalog.json` mediante el mismo `withOcularCoverage` del Atlas. Sus siete módulos incluyen seis nerviosos y uno ocular.

Procedencia consultada: `skeletal/source-manifest.json`; los cinco manifiestos de `muscular/`; `nervous/nervous-source-manifest.json` y `nervous-expansion-manifest.json`; los manifiestos de `ocular/`, `cardiovascular/`, `respiratory/`, `digestive/` e `integumentary/`; y `internal/internal-source-manifest.json`. Todos bajo `public/models/anatomy/`.

Fuentes/licencias conservadas por módulo:
- BodyParts3D / Anatomography, DBCLS: **CC BY 4.0** para los recursos 4.0 declarados en los catálogos.
- Z-Anatomy, selección periférica registrada: **CC BY-SA 4.0**, revisión `38649f4193adbe58e426ccac5670b8c4dde474ec`; el manifiesto conserva el crédito original de BodyParts3D.
- Algunos recursos BodyParts3D 4.3 de Respiratorio y Endocrino: **CC BY-SA 2.1 Japan**. No se sustituyó esta licencia por CC BY 4.0.
- La ficha muestra procedencia/licencia de los assets del nodo seleccionado; el pie general resume las procedencias cargadas. Los enlaces proceden de los catálogos existentes.

Reproductor usa exclusivamente sus diez unidades masculinas y doce mallas registradas. El manifiesto interno conserva la transformación común y los controles cervicales 4.3/4.0; XR no registra ni transforma anatómicamente nuevas piezas. No hay assets femeninos añadidos.

## Arquitectura y carga

`src/features/xr/atlas/systems.ts` concentra los once IDs existentes, orden de controles, nombres derivados de `SYSTEMS`, rutas, visibilidad inicial y categorías de color. No contiene estructuras, lecciones ni jerarquías duplicadas. `composeXrCatalog` adapta la firma del compositor existente; el marco óseo sigue siendo la referencia corporal.

Estado inicial: Óseo ON, otros diez OFF, piel OFF, opacidades 100%, sin selección, ocultación ni aislamiento. Sólo se solicitan catálogo y siete módulos óseos al entrar en Atlas XR. El modo Corazón previo conserva su carga independiente de `heart.glb`.

Cada primera activación solicita su catálogo y módulos. Nervioso solicita además el catálogo ocular, exactamente como el Atlas principal. OFF sólo filtra visibilidad; ON posterior reutiliza referencias, buffers y materiales. Restaurar atlas tampoco borra recursos ya cargados. Salir del modo desmonta el propietario y libera sus recursos.

`XrAtlasAssets` mantiene una cola de sistemas con **dos slots globales**. Cada slot usa un `AtlasAssetManager` original con concurrencia 1; máximo efectivo **dos módulos GLB en carga simultánea**, aun activando once controles rápidamente. La lectura de catálogos ocupa esos mismos slots; Nervioso lee sus dos catálogos secuencialmente. No hay downloader nuevo. Errores liberan slot; reintentos de módulos entran por la misma cola; desmontar aborta propietarios activos y cancela los pendientes. Un sistema desactivado durante su primera carga termina y queda retenido, conforme a la política actual.

No se modificaron `AtlasAssetManager`, loaders ni catálogos.

## Presentación, selección y fichas

El panel genera checkboxes y sliders nativos 10–100% desde la configuración. La lista de sistemas tiene altura limitada y scroll manual; Despiece, restauración y control con manos quedan fuera de esa lista. Mobile conserva el panel plegable y la ficha inferior. No hay scroll gestual.

Se conserva la paleta de sistemas del Atlas y las categorías arterial/venosa/corazón, respiratorias, digestivas y oculares. Los tres sistemas piloto conservan su tratamiento XR. La córnea nueva reutiliza la transparencia esquemática del Atlas (.22 base, .55 seleccionada, multiplicadas por opacidad del sistema). Los materiales son clones de presentación XR; geometrías y materiales fuente conservan su propiedad. Selección usa el cyan suave existente y restaura la variante anterior.

El raycast usa `THREE.Raycaster`, cámara real y matrices del root ya rotado/escalado, sobre la colección de mallas visibles y seleccionables. Se actualiza esa colección al añadir recursos o cambiar capas/ocultaciones/aislamiento; no se reconstruye por selección, opacidad o Despiece. No hay raycast por frame: sólo click/tap o resultado de mano relevante según el controlador existente. Ocultación e aislamiento invalidan los hits que dejaron de ser seleccionables.

La piel opaca intercepta el rayo según su geometría. Reducir opacidad permite ver el interior, pero **la piel transparente continúa siendo seleccionable**; para seleccionar una estructura cubierta hay que apagar/ocultar/aislar la capa correspondiente. No se añade click-through. Los huecos originales se conservan.

La ficha mantiene nombre, latín cuando existe, sistema, región y campos disponibles. Reutiliza `resolveBoneDetail`/`BONE_EDUCATION`, `resolveMuscleDetail`, `resolveNerveDetail`, `OCULAR_DESCRIPTION`, `resolveCardiovascularDetail`, `resolveRespiratoryDetail`, `resolveDigestiveDetail`, `resolveInternalDetail` y `SKIN_EDUCATION`. No duplica textos anatómicos. Nervioso mantiene Origen general, Recorrido general, Modalidad funcional, Territorio, Territorio motor/sensitivo y Relaciones cuando existen. Los resolutores con listas de campos conservan sus etiquetas. Los datos ausentes no se inventan; los filtros públicos existentes omiten detalles técnicos del contenido presentado.

Aislar filtra por ID y descendientes catalogados sin reescribir toggles/opacidades. Ocultar elimina la estructura y limpia selección. Restaurar estructuras quita ocultaciones sin encender capas apagadas. Restaurar atlas vuelve a Óseo ON y demás OFF, limpia selección/aislamiento/ocultaciones y restablece opacidad; conserva pose y valor de Despiece según semántica XR anterior. Restablecer vista reinicia pose y Despiece.

Cerrar ficha y Escape limpian selección. La misma escena/canvas sigue montada al seleccionar, cambiar o cerrar la ficha.

## Despiece

Se consumen `createExplosionOffsets` y `explosionTarget(..., 'regions', amount)` existentes, sin nuevos offsets. El compositor conserva los grupos regionales compatibles. Se probaron 0, 50 y 100%, y regreso a 0 con igualdad exacta de posiciones base.

La tabla real de offsets a 100% da movimiento en las 936 mallas interiores (205 óseas, 182 musculares, 131 nerviosas/oculares, 162 cardiovasculares, 128 respiratorias, 96 digestivas, 6 urinarias, 11 endocrinas, 3 linfáticas y 12 reproductoras). La única malla tegumentaria tiene offset cero y conserva su posición. La prueba de producción cubre todos los sistemas; navegador valida especialmente Óseo + Muscular + Nervioso + Cardio.

No se exige separación uniforme ni se fabrican regiones para piel u otros grupos.

## Interacción y accesibilidad

Dwell permanece en **1000 ms**. Selección/UI por apuntar y mantener; pinch con movimiento rota el root corporal; dos pinches escalan. Smoothing, jump limiter, grace, reacquisition, stable target, hysteresis, stick radius, slop, rearm y salida vertical de sliders permanecen byte a byte sin cambios.

El registro DOM existente descubre automáticamente los nuevos controles `<ID>-toggle` y `<ID>-opacity`. Sliders: dwell captura, desplazamiento horizontal del índice modifica el input real, salida vertical libera conforme a XR 1.5.2. No se añade gesto por sistema.

Mouse/touch distinguen click/tap de drag con el controlador existente. Rueda, dos dedos, teclado, Escape y prioridad manual permanecen. Checkboxes, ranges y botones son nativos, con labels, foco visible y Tab/Space/Enter/flechas. La ficha conserva headings semánticos, botón de cerrar y anuncio de selección sin anuncios continuos de hover.

## Carga progresiva, red y memoria

| Activación acumulativa | Módulos | Mallas | Triángulos | Bytes GLB | Buffers geométricos (bytes) | Carga hasta render completo (ms) |
|---|---:|---:|---:|---:|---:|---:|
| skeletal | 7 | 205 | 512450 | 3916940 | 7609772 | 342 |
| muscular | 25 | 387 | 1398310 | 13334804 | 24905752 | 491 |
| nervous | 32 | 518 | 1921346 | 17852032 | 33718420 | 310 |
| cardiovascular | 39 | 680 | 2606362 | 23501312 | 45019876 | 355 |
| respiratory | 42 | 808 | 2818846 | 25831324 | 49244940 | 238 |
| digestive | 46 | 904 | 2996086 | 27472520 | 52298260 | 300 |
| urinary | 47 | 910 | 3006030 | 27567392 | 52465964 | 154 |
| endocrine | 49 | 921 | 3026196 | 28035120 | 53366940 | 190 |
| lymphatic | 50 | 924 | 3029606 | 28070280 | 53425280 | 161 |
| reproductive | 51 | 936 | 3036790 | 28164276 | 53567064 | 155 |
| integumentary | 52 | 937 | 3240172 | 29795780 | 58056988 | 172 |

Tiempos locales de Vite durante QA funcional; incluyen desde la solicitud del sistema hasta su render completo. No son benchmarks de red. El primer paso usa el cronómetro interno iniciado al entrar en Atlas.

Bytes: suma de archivos GLB solicitados, excluye JSON, JS, cámara y WASM. Memoria geométrica: buffers de índices/atributos/morphs medidos por el loader, no RAM ni VRAM total. Las capas apagadas retienen estos buffers hasta salir del modo.

La QA comprueba el conjunto exacto de catálogos/GLB tras cada activación, ausencia de otros sistemas y 52 solicitudes GLB anatómicas al completar el recorrido. Nervioso incluye ocular de forma explícita. Reactivaciones ON/OFF/ON no aumentan módulos, mallas, materiales, buffers ni descargas. Se comprueba identidad de escena y canvas.

## Rendimiento local

| Nivel | Tracking | Módulos / mallas | Triángulos | Bytes GLB | Draw calls | Intervalo ms | CPU render ms | Resultados/s | CPU callback ms |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A | MediaPipe real | 7 / 205 | 512450 | 3916940 | 205 | 6.97 | 1.58 | 8.44 | 0.468 |
| B | MediaPipe real | 32 / 549 | 2083326 | 18984084 | 549 | 11.46 | 3.87 | 6.23 | 0.296 |
| C | MediaPipe real | 46 / 904 | 2996086 | 27472520 | 906 | 15.36 | 7.40 | 6.20 | 0.292 |
| D-before-skin | MediaPipe real | 51 / 936 | 3036790 | 28164276 | 938 | 17.42 | 8.38 | 5.97 | 0.304 |
| D | MediaPipe real | 52 / 937 | 3240172 | 29795780 | 939 | 18.19 | 7.09 | 5.44 | 0.291 |
| A | Sintético | 7 / 205 | 512450 | 3916940 | 205 | 6.93 | 1.66 | 17.93 | 0.833 |
| B | Sintético | 32 / 549 | 2083326 | 18984084 | 549 | 11.44 | 4.34 | 17.17 | 0.884 |
| C | Sintético | 46 / 904 | 2996086 | 27472520 | 906 | 15.18 | 8.98 | 15.93 | 0.822 |
| D-before-skin | Sintético | 51 / 936 | 3036790 | 28164276 | 938 | 15.99 | 7.70 | 16.41 | 0.759 |
| D | Sintético | 52 / 937 | 3240172 | 29795780 | 939 | 17.66 | 8.31 | 16.66 | 0.915 |

A: Óseo. B: Óseo/Muscular/Cardiovascular. C: los seis primeros sistemas del orden de carga. D-before-skin: diez sistemas sin piel; D: los once. Con piel se añaden exactamente 1.631.504 bytes GLB, 203.382 triángulos y 4.489.924 bytes de buffers. El total retenido llega a 58.056.988 bytes de geometría (55,37 MiB); el incremento de piel es 4,28 MiB. Las pequeñas variaciones temporales no se interpretan como mejoras causales; en este equipo MediaPipe real bajó de 8,44 a 5,44 resultados/s entre A y D. Los ~16–18 resultados/s de landmarks sintéticos no miden velocidad de inferencia del modelo.

Chrome headless local, 1366×1000, modelos reales. Medición en build de producción, muestras tras calentamiento, sólo una sesión gráfica activa durante el ensayo. `real` usa MediaPipe real con vídeo sintético sin manos; `sintético` mide el callback real de la app recibiendo landmarks sintéticos y apuntando al control Restablecer vista, sin toggles que alteren la carga durante la muestra. No equivale a tracking físico. Intervalo de frame y CPU del render son medidas aproximadas del navegador; **no se afirma FPS** ni tiempo GPU.

El caso previo a piel permite separar su coste geométrico de los once sistemas visibles. No hay reducción de geometría, LOD ni cambios de assets. **Uso recomendado: activar sólo sistemas necesarios.**

## Pruebas y capturas

- `npm run test:xr`: **152/152**, sin fallos. Se conservan los 145 casos previos y se añaden siete casos agrupados con tablas de sistemas.
- `npm run typecheck`: correcto.
- `npm run verify:anatomy`: correcto, **una única ejecución final**.
- `npm run build`: correcto; 4 páginas estáticas y 15 redirecciones. Sólo aviso de tamaño de chunk Meshopt ya existente.
- `git diff --check`: correcto.
- QA navegador completa: **20 grupos**, incluidos los once sistemas individuales; cero errores JS. Red: sólo los catálogos/GLB solicitados, 52 módulos al final, sin descargas adicionales al reactivar.
- Sliders gestuales de Óseo, Nervioso y Tegumentario; dwell de toggles nuevos y fichas Nervioso/Respiratorio/piel; pinch y escala con once sistemas cargados.
- Responsive: 1366, 1050, 900, 768 y 390 px, sin overflow horizontal; panel con once controles y ficha mobile ≤42dvh. Mouse, touch real simulado por Chromium, teclado y cierre/foco verificados.
- XR Heart: prueba dwell y **tres grupos de regresión manual** (desktop, cámara con MediaPipe real sobre vídeo sintético y touch mobile), correctos.
- Home, Anatomía, About, Corazón, Pulmones y Encéfalo: las seis cargan sin errores JS/HTTP ni overflow. Los estilos DOM medidos y títulos coinciden exactamente con la evidencia XR 1.5.2. Se conserva el aviso previo de deprecación de THREE.Clock en las vistas 3D.
- Rendimiento: diez muestras (cinco estados × dos modalidades), sin sesiones gráficas concurrentes.
- Las doce capturas se revisaron visualmente; anatomía alineada en el marco original, sin deformación para corregir penetraciones fuente.

Scripts:
- `scripts/xr/full-atlas.test.mjs`: tablas de once sistemas, GLB reales, hashes/red, retención, memoria/reuso, opacidad, raycast tras transforms, educación, aislamiento, ocultación/restauración, despiece, concurrencia y liberación.
- `scripts/xr/atlas-test-compiler.mjs`: compilación compartida de adaptadores de producción para tests Node, sin cambiar resultados.
- `scripts/xr/full-atlas-browser-qa.mjs`: DOM real, catálogos/GLB/raycast/controladores reales; cámara y landmarks sintéticos.
- `scripts/xr/full-atlas-performance-qa.mjs`: niveles A/B/C/D y coste adicional de piel.

Para ejecutar scripts de navegador sin nuevas dependencias se usó el Playwright ya instalado en el runtime, pasado como primer argumento, y Chrome como segundo. QA interactiva usa Vite local :5173; rendimiento y regresión usan `dist/` servido localmente en :5184, ambos bajo `/med3d/`. El build utiliza el shim Rollup/WASM preexistente `.cache/home-redesign/rollup-wasm.cjs` mediante NODE_OPTIONS por la restricción local del binario nativo. No se alteró package.json ni lockfile.

Evidencia local en `.cache/xr-full-atlas/`: inventario, resultados JSON, métricas y capturas 01 Óseo, 02 Óseo/Muscular, 03 Nervioso, 04 Respiratorio/Digestivo, 05 internos, 06 piel, 07 multisistema, 08 ficha nerviosa, 09 Despiece, 10 panel, 11 mobile, 12 Corazón. Capturas revisadas visualmente; incluyen rótulo de QA sintética.

Estructuras seleccionadas mediante raycast en navegador (IDs sólo en esta documentación técnica):

| Sistema | ID existente | Ficha comprobada |
|---|---|---|
| skeletal | bp3d:FMA13323 | Clavícula izquierda |
| muscular | bp3d:FMA79979 | Porción esternocostal del pectoral mayor derecho |
| nervous | bp3d:FMA72658 | Giro frontal inferior · izquierdo |
| cardiovascular | bp3d:FMA3941 | Arteria carótida común derecha |
| respiratory | resp:FMA9615 | Cartílago cricoides |
| digestive | dig:FMA7131 | Esófago |
| urinary | uri:FMA7204 | Riñón derecho |
| endocrine | endo:FMA15629 | Glándula suprarrenal derecha |
| lymphatic | lym:FMA7196 | Bazo |
| reproductive | rep:FMA7211 | Testículo derecho |
| integumentary | integ:FMA7163 | Piel · superficie corporal |

## Cobertura y limitaciones reales

- Óseo: 199 huesos del recuento adulto habitual y 4 sesamoideos accesorios; componentes de esternón no son huesos adicionales. Cóccix separable y huesecillos del oído pendientes.
- Muscular: cobertura parcial; no implica musculatura completa, ni inserciones anotadas en geometría.
- Nervioso: SNC/orbitario y selección periférica BP3D/Z-Anatomy ya registrada, más ojos parciales. No se añaden médula, raíces espinales, ciático ni plexos completos pendientes; no es una red continua.
- Ocular: córnea, esclerótica e iris de dos ojos parciales; sin microanatomía ni simulación óptica.
- Respiratorio: laringe cartilaginosa disponible, tráquea, bronquios y pulmones/lóbulos/segmentos existentes. Sin cavidad nasal, faringe, pleuras independientes ni alvéolos.
- Digestivo: cobertura actual, sin completar conexiones, segmentaciones ni órganos ausentes.
- Urinario: superficies renales y vías disponibles; uretra masculina única, sin capas renales separadas.
- Endocrino: glándulas disponibles; sin microanatomía, islotes ni duplicación de páncreas/testículos.
- Linfático/inmunitario: sólo bazo y lóbulos del timo; no representa una red linfática completa.
- Reproductor: masculino parcial; sin marco femenino ni piezas nuevas. Uretra sigue bajo Urinario.
- Tegumentario: una malla nativa con la superficie corporal, sin subdivisiones, capas histológicas, uñas o pelo independientes.

La cobertura detallada y sus advertencias siguen en los catálogos/resolutores. Los modelos educativos no adquieren validación clínica por integrarse en XR. Activar once sistemas simultáneos puede aumentar significativamente trabajo gráfico y memoria retenida; el producto sigue siendo modular.

## Recorrido físico pendiente

No se afirma validación física con webcam/manos. Recorrido corto para el usuario:
1. Entrar en Atlas XR.
2. Activar Nervioso por dwell.
3. Seleccionar una estructura nerviosa y leer su ficha.
4. Activar Respiratorio.
5. Activar Digestivo.
6. Activar Tegumentario.
7. Capturar opacidad de piel por dwell y desplazar índice.
8. Apagar/ocultar piel y seleccionar una estructura interior.
9. Activar varios sistemas.
10. Probar Despiece y volver a cero.
11. Rotar el cuerpo con un pinch y movimiento.
12. Escalar con dos pinches.

Pendiente solicitado explícitamente: **“Permitir desplazar verticalmente la ficha educativa mediante la mano para leer contenido largo.”** No implementado en XR 1.6. Panel y ficha usan scroll normal por mouse/touch/trackpad.

## Auditoría y entrega

Cambios de producción limitados a siete archivos de `src/features/xr/atlas/` (seis modificados y `systems.ts` nuevo). Además: esta documentación y seis archivos de scripts/pruebas XR.

Creados: `systems.ts`, `atlas-test-compiler.mjs`, `full-atlas.test.mjs`, `full-atlas-browser-qa.mjs`, `full-atlas-performance-qa.mjs` y este informe. Modificados: `XrAtlasExperience.tsx`, `assets.ts`, `atlas-xr.css`, `education.ts`, `presentation.ts`, `state.ts`, `scripts/xr/atlas.test.mjs` y `scripts/xr/gesture-ui.test.mjs`. Los dos tests anteriores sólo adaptan la compilación/importación de TypeScript; conservan sus casos.

Auditoría de diff: cero cambios en GLB/OBJ/geometrías/catálogos/IDs/jerarquías/registros/fuentes educativas, Atlas principal/AtlasScene/SkeletalAtlas/búsqueda/despiece original, loaders/AtlasAssetManager, Home/About/exploradores, XR Heart, MediaPipe/modelo de manos, controladores/thresholds de tracking/dwell o dependencias. Ningún archivo fuera de XR, sus tests y el informe está modificado.

Sin push, merge ni deploy. No se implementaron búsqueda gestual, voz, teclado virtual, árbol XR, autofocus, nuevos gestos o LOD.

## XR FASE 2 — FUTURO

Meta Quest; WebXR; immersive-vr; immersive-ar; passthrough; hand tracking 3D; colocación espacial; anchors. Sólo documentado, sin implementar.
