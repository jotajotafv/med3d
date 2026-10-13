# Programa de completado anatómico no femenino

Revisión anatómica cerrada: los 117 gaps no femeninos tienen una decisión con evidencia. La aceptación global todavía no está aprobada: la campaña gestual XR en navegador presenta fallos reproducidos durante interrupciones del tracking sintético. Se conserva un checkpoint documental, sin declarar PASS global ni aceptación con webcam física. Las secciones por wave conservan sus resultados históricos; el cierre de revisión y los límites vigentes están al final.

Base documental: `101024e8d4083fcaf991e9c683733d0a02388e29`. Base del producto: `1be9dd644dea33cc008fe47889e4608bd3fab8f6`. Rama: `phase-anatomy-completion-nonfemale`.

La auditoría original se conserva intacta. **FUTURE SEPARATE FEMALE ATLAS**: ningún recurso exclusivamente femenino se ha descargado, registrado o integrado.

## WAVE 0

Inventario rehecho desde catálogos y GLB: 11 sistemas, 580 estructuras, 228 componentes, 981 nodos (173 editoriales), 937 mallas, 52 módulos, 3.240.172 triángulos y 29.795.780 bytes. Baseline local en `.cache/anatomy-completion/inventory.json`.

## WAVE 1 — nativos prioritarios (checkpoint inicial)

Los números y pruebas de esta sección describen el commit inicial `42def42361a0a39af7e1e7494a779bb4befbc382`. La revisión ampliada de WAVE 2 retira catorce de sus candidatos; la cobertura activa y las decisiones revisadas se describen más abajo. No se borra el historial de la primera aceptación.

Cohorte: 77 estructuras, 5 componentes, 1 región editorial, 86 mallas, 11 módulos opcionales. Total provisional: 657 estructuras, 233 componentes, 1.064 nodos, 1.023 mallas, 63 módulos, 4.100.946 triángulos y 39.200.560 bytes. El número de estructuras óseas no aumenta; los 28 dientes pertenecen a Digestivo.

Incluye diafragma, tres capas intercostales agregadas, seis rotadores profundos por lado, psoas mayor e ilíaco bilaterales, 28 dientes permanentes, seis músculos extraoculares y elevador palpebral por lado, dos cristalinos, dos porciones ópticas retinales, ocho músculos del suelo pélvico, dos porciones de un esfínter anal externo, seis trayectos arteriales femorales regionales y una porción de tienda del cerebelo.

La correspondencia nominal de femoral profunda era insuficiente: los originales identifican circunflejas laterales, sus ramas descendentes y geniculares descendentes. No se renombraron como troncos femorales profundos. Tampoco se afirma que los intercostales equivalgan a once pares individualizados, que haya 32 dientes, que se complete el canal anal, el periné o todas las meninges.

### Procedencia e identidad

Original oficial BP3D 4.0 OBJ99, recuperado por rangos HTTP exactos del archivo de 142.903.898 bytes, con comprobación CRC32 y SHA-256. Se examinaron 97 candidatos; 86 originales integrados se conservan en `research/anatomy/completion-wave1-originals.zip`. Selección, encabezados, versiones, identidad, decisiones por candidato y licencias están fijados en los archivos `completion-wave1-*.json` de research/anatomy.

Se comprobó [la declaración oficial de licencia](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) antes de descargar: CC BY 4.0, DBCLS. Los encabezados históricos CC BY-SA 2.1 Japan permanecen intactos en los OBJ; no se han reescrito. Copia y hash de la declaración actual incluidos. Las fichas son paráfrasis breves con enlaces a OpenStax y procedencia geométrica separada.

### Conservación y encaje

Transformación única `(x,y,z) -> (x,z,-y)/1000`. Sin centrar, escalar, reflejar, deformar, registrar por pieza ni simplificar. Posiciones Float32 y Meshopt; cuantización sólo de normales de presentación. La comparación independiente contra los OBJ decodifica el GLB final y comprueba todas las posiciones usadas, multiconjunto de triángulos, multiplicidad, winding, bounds e identidad FMA/FJ.

860.774 triángulos conservados; 9.404.780 bytes añadidos; 19.841.364 bytes de accessors decodificados. Error máximo de posición: 6,010618735117701e-8 m; tolerancia de aceptación: 0,00005 m. Son medidas numéricas, no precisión anatómica o clínica. Validador glTF: cero errores y advertencias en archivos comprimidos y decodificados.

Las pruebas de superficies registran contactos reales del dataset. En las relaciones pulmonares y hepáticas, el muestreo determinista con tres rayos por punto no detectó profundidades mayores de 1 mm: diafragma/hígado 0,964 mm máximo muestreado; diafragma/pulmón derecho 0,049 mm e izquierdo 0,091 mm. Este muestreo no prueba estanqueidad ni mide volumen de penetración. No se ajustaron las superficies para ocultar contactos.

FJ2549/FJ2550/FJ2551 contienen pequeños fragmentos contralaterales de origen: áreas de 0,277/0,310/1,650 mm² respectivamente, frente a 4.954/5.873/4.822 mm² totales. Se conservan en las mallas fuente, sin recortar, sin propietarios adicionales y sin interpretarlos como nuevas estructuras. Inspección aislada y regional documentada.

### Comportamiento

Las adiciones tienen `defaultEnabled: false`; las carga una búsqueda/selección o el control de módulo. Primera carga: los 51 módulos históricos sin piel. Nombres públicos de módulos, IDs estables, alias españoles/latinos/FMA/FJ, propiedad única, árbol virtual, aislamiento, ocultación, restauración, contexto curado y retorno exacto a cero del despiece.

Las nuevas lecciones se almacenan una vez por familia en el catálogo y se referencian por ID. Atlas y XR consumen esa misma fuente; referencias ausentes y definiciones incompatibles se rechazan. El compositor XR ya descubre los módulos de los sistemas activos. No cambian gestos, dwell, pan ni MediaPipe.

### Validación y reproducción

Pruebas nuevas: `node scripts/test-anatomy-completion.mjs`. Verifican catálogos completos, hashes históricos, IDs/owners, búsqueda, fichas compartidas, cargas opcionales, alcance real y despiece cero. Las suites históricas usan una proyección de sus módulos originales reales; sus cifras y afirmaciones anteriores se mantienen, y la suite nueva valida la composición completa.

Geometría reproducible desde el checkout base y originales fijados: `python scripts/anatomy/build-completion.py wave1`, optimizador, validador e instalación explícita. El builder se niega a sobrescribir GLB existentes salvo con `--replace-reviewed-cohort`, un ledger de aceptación explícito y coincidencia exacta de ruta, procedencia y hash previo del módulo creado por este programa. Nunca autoriza sobrescribir modelos históricos. Para verificar este checkout sin reconstruir ni modificar modelos:

`node scripts/anatomy/optimize-completion.mjs --output research/anatomy/completion-wave1 --source research/anatomy/completion-wave1-originals.zip --verify-only`

Reporte glTF, transformación, cohortes y comparación fuente/resultado en `research/anatomy/completion-wave1/`. QA local en `.cache/anatomy-completion/wave1/`; el navegador utiliza Chromium headless/SwiftShader sobre HTTP loopback, no GPU física. No se publican promesas de FPS.

Suites dirigidas superadas: nueva cobertura; integración histórica; digestivo; cardiovascular; nervioso; muscle-gaps; XR full-atlas (7 pruebas). Typecheck y build superados. Build conserva la advertencia preexistente por chunks mayores de 500 kB. `verify:anatomy` se reserva para la campaña global final.

### Rendimiento y QA de WAVE 1

En Chromium headless/SwiftShader, primera carga histórica: 51 módulos, 28.164.276 bytes, 53.567.064 bytes de geometría en memoria, 892 draw calls observadas; primera geometría ~222 ms y carga completa ~2.323 ms. Con todas las ampliaciones sin piel: 62 módulos, 37.569.056 bytes, 74.671.196 bytes de geometría y 978 draw calls, ~2.733 ms de carga completa. Con piel: 63 módulos, 39.200.560 bytes, 79.161.120 bytes de geometría y 979 draw calls, ~4.645 ms. Son mediciones locales puntuales, sin red real ni GPU física.

Los cinco escenarios (primera carga, muscular aislado, varios sistemas, completo sin piel y con piel) están en `research/anatomy/completion-wave1/qa-summary.json`. Los intervalos recogidos tras un único zoom tienen pocas muestras: no sustentan una conclusión de FPS sostenidos. Otra pasada registra la duración CPU publicada por el renderer, incluyendo el coste del driver y envío de comandos, sin medir finalización GPU: ~13,7 / 3,2 / 822,1 / 1.418,8 / 1.148,3 ms respectivamente. Estos picos en software son una limitación explícita. Las nuevas cargas no se activan por defecto.

QA funcional recorre cada nuevo owner con búsqueda por FMA, carga real, ficha, aislar, ocultar, restaurar y mismo Canvas. Tres niveles de despiece vuelven exactamente a reposo. Capturas regionales y aisladas revisadas manualmente, además de móvil a 390 px y nombres públicos de cada módulo. La revisión responsive completa se reserva para el cierre global.

## WAVE 2 — selección nativa ampliada y revisión de contactos

Se inspeccionaron 282 originales BP3D 4.0, incluidos 57 candidatos adicionales a la consulta nominal de la auditoría. La cohorte inicial para QA contenía 277 mallas; 225 se conservan tras la revisión. No se tomaron las coincidencias de las tablas ISA/PARTOF como identidad definitiva: cada decisión conserva encabezado, FJ, FMA, hash, bounds y topología del original.

La cohorte activa de esta wave añade 96 estructuras, 89 componentes y 3 editoriales, distribuidos en 26 módulos opcionales: 881.476 triángulos, 9.044.004 bytes GLB y 16.090.512 bytes de accessors decodificados. Los 203 owners estructurales del sistema óseo permanecen iguales; sus ligamentos añadidos son componentes.

### Cobertura y límites

Se añaden músculos y porciones de cuello, antebrazo, mano y pie; tálamos, caudados, putámenes y globos pálidos; ventrículos y acueducto; porciones coronarias y papilares; tejidos musculares/ligamentosos de laringe, faringe y región oral; mesoapéndice; superficies de cabello, cejas y pubis; coroides, corona ciliar, vítreo, cámaras anteriores, aparato lagrimal, tarsos y soportes oculares. Cada conjunto mantiene la granularidad del original.

Los ligamentos estilohioideos son las piezas conectivas óseas aceptadas en esta wave. No se añade geometría nominal de disco, menisco o cápsula sin original BP3D identificado; esas alternativas pasan a la investigación de fuentes registrables. La búsqueda de ramas vasculares regionales adicionales continúa en WAVE 4.

FJ1469/FJ1469M tienen lateralidad de encabezado opuesta a su ubicación nativa: quedan fuera. Se aceptan únicamente las cabezas superficiales identificadas del flexor corto del pulgar. Los supuestos candidatos yugulares externos eran venas supraescapulares, que además no pasan el control óseo; no se publica una yugular falsa. El largo del cuello sólo tiene tres porciones izquierdas verificadas. Corona ciliar no equivale a cuerpo ciliar completo; tarso no equivale a párpado completo.

### Corrección del control geométrico y retiradas

La revisión detectó que el control de contactos de WAVE 1 aplicaba matrices sobre accessors enteros normalizados de algunos huesos históricos. Al escribir metros en esos arrays se distorsionaban las coordenadas de la copia de medición. `qa-world-geometry.mjs` expande a Float32 antes de transformar y comprueba los bounds decodificados de los 205 controles óseos contra el catálogo. Una prueba de regresión conserva los índices, grupos y arrays originales. Este fallo afectaba al control de contactos; la comparación independiente OBJ → GLB de las incorporaciones utilizaba otro decodificador y sigue pasando.

El nuevo control muestrea hasta 3.072 posiciones únicas por owner, exige tres votos de paridad y mide distancia a superficie. Es un cribado geométrico, no volumen de interpenetración ni precisión clínica. El disparador de 3 mm no es un umbral médico: estructuras pequeñas también se rechazan con valores menores si la interfaz no es defendible. Las raíces en la región alveolar se documentan aparte, porque el hueso esquemático no resuelve alvéolos y espacio periodontal.

Se retiraron 14 owners de WAVE 1: piriformes, obturadores internos/externos, cuadrados femorales, psoas mayores, ilíacos y ramas descendentes de las circunflejas femorales laterales. La cobertura de rotadores conserva los gemelos superiores e inferiores bilaterales; el iliopsoas vuelve a quedar bloqueado. Los originales y las decisiones iniciales se conservan, y sus estados activos se corrigen explícitamente.

WAVE 2 excluye 51 owners candidatos por encaje no aprobado. Entre ellos hay aductores, pectíneos, plantares, poplíteos, otros músculos de pierna/cuello/espalda, cabezas ulnares del FCU, ligamentos plantares, retináculos, constrictores faríngeos inferiores, rafe, venas supraescapulares, zónulas, mesenterio y mesocolon. Ejemplos máximos muestreados: aductor mayor/fémur ~14,7 mm; poplíteo/tibia ~10,5 mm; mesocolon/colon ~9,3 mm. Las fichas aceptadas explicitan las interfaces de inserción esquemáticas que permanecen.

No se cortó, desplazó, reflejó ni deformó ninguna pieza para ocultar el conflicto. Se excluyó cada original completo y se reconstruyeron únicamente módulos creados por este programa. Los 52 GLB corporales y los cuatro assets de exploradores históricos mantienen sus hashes.

Evidencia versionada: `research/anatomy/completion-wave1-acceptance.json`, `completion-wave2-acceptance.json`, los respectivos ledgers de decisiones y `completion-wave2/contact-evidence/`. Las tablas de candidatos distinguen originales investigados de cobertura activa. El reporte corregido de contactos de WAVE 1 se conserva en la carpeta de WAVE 2, sin presentar el reporte anterior como validación vigente.

### Catálogos, XR y pruebas

Los nuevos tipos oculares usan las lecciones compartidas del catálogo; un tipo nuevo no fuerza una descripción de una clase histórica distinta. Búsqueda, árbol, ficha, contexto, aislar, ocultar, restaurar y despiece utilizan los mismos owners. Los músculos laríngeos/faríngeos pertenecen a Respiratorio y tienen relaciones educativas con Digestivo. No hay geometría propietaria duplicada.

XR incorpora un control manual «Ampliación anatómica» por sistema. Activar un sistema carga inicialmente sólo sus módulos históricos; activar su ampliación añade los opcionales a la misma cola global de dos descargas. Desactivar/reabrir retiene recursos y bloquea picking de las piezas ocultas. No cambian gestos, dwell, pan ni MediaPipe. La única modificación adicional de AtlasScene amplía el inspector de QA, habilitado por URL, a las nuevas mallas nerviosas.

Geometría: todos los triángulos orientados y posiciones usadas de los originales activos conservados; máximo error numérico WAVE 2 6,122820607893197e-8 m. Validador glTF comprimido y decodificado: cero errores y advertencias en 26 módulos. Typecheck y build pasan; persiste la advertencia conocida de tamaño de chunk. Las 19 pruebas dirigidas XR (piloto histórico y composición completa) pasan. La suite de cobertura comprueba además rechazos ausentes, conflicto de lateralidad, granularidad de corona/tarsos, largo del cuello unilateral y conteo óseo.

QA funcional completado: 185 owners activos recorridos; 26 módulos con hover y clic real; búsqueda, ficha, aislamiento, ocultación y restauración pasan. No hubo errores de consola ni peticiones fallidas. Los tres modos de despiece retornan exactamente a reposo. Las 17 capturas regionales/móvil y cuatro vistas interiores suplementarias se revisaron manualmente. Las vistas opacas de contexto pueden ocultar estructuras internas; las cuatro vistas aisladas confirman su geometría visible. El seguimiento suplementario comprueba identidad del objeto DOM Canvas a través de selección, aislamiento, ocultación, restauración y deselección. La primera pasada comprobó el conteo de Canvas para todos los owners.

Rendimiento puntual en Chromium headless/SwiftShader con movimiento reducido, HTTP loopback y caché HTTP desactivada:

| Escenario | Módulos | Bytes GLB | Bytes de geometría | Draw calls | Primera geometría / completo (ms) | CPU render (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Primera carga | 51 | 28.164.276 | 53.567.064 | 892 | 176 / 3.786 | 3,9 |
| Muscular con ampliaciones | 31 | 19.999.752 | 40.157.492 | 278 | 151 / 3.016 | 1,5 |
| Óseo, muscular y nervioso | 55 | 31.478.980 | 62.869.616 | 644 | 161 / 6.408 | 3,4 |
| Completo sin piel, con pelo | 88 | 46.199.172 | 91.215.108 | 1.187 | 155 / 4.748 | 4,0 |
| Completo con piel | 89 | 47.830.676 | 95.705.032 | 1.188 | 165 / 4.266 | 5,3 |

Sólo se registraron uno o dos intervalos de frame por zoom: no representan FPS sostenidos. CPU render mide envío de comandos/driver, no finalización GPU. El primer escenario «sin piel» omitía también el pelo; se repitió con los 88 módulos correctos y se conserva la observación anterior como escenario más limitado, no como cifra vigente. Evidencia, transferencias y hashes de las 21 capturas en `research/anatomy/completion-wave2/qa-summary.json`. El cierre del navegador suplementario agotó su plazo de cinco segundos después de superar todas las comprobaciones y guardar el reporte; no fue un error de la aplicación.

### Inventario activo tras esta selección

11 sistemas; 739 estructuras; 322 componentes; 1.238 nodos; 177 editoriales; 1.234 mallas; 89 módulos; 4.945.358 triángulos; 47.830.676 bytes GLB. Son cifras derivadas por `test-anatomy-completion.mjs`, todavía provisionales para el programa. La primera carga conserva 51 módulos históricos sin piel ni ampliaciones.

## WAVE 3 — fuentes registradas y recuperación validada

La recuperación parte de `83deba445c221adb2a21098143c81e563ae8816a`. Todos los cambios locales encontrados correspondían a Wave 3: catálogo muscular, dos GLB de pie, harness de QA, builder y originales/selección/registro/validación de investigación. No se descartó trabajo ni caché; los originales válidos no se descargaron de nuevo. Waves 1–2 y los 56 modelos históricos conservan sus hashes.

Se evaluaron 317 candidatos únicos: 309 Z-Anatomy, dos HRA y seis huesecillos OpenEar. Cuatro se aprueban; 284 se bloquean por registro, 25 por identidad y cuatro por ausencia de superficie utilizable. Son candidatos, no gaps. Decisiones, intentos, matrices, controles y evidencia están en `research/anatomy/completion-wave3-decisions.json` y `research/anatomy/completion-wave3/README.md`.

La incorporación contiene EDB bilateral, separado del EHB, y un conjunto original de interóseos dorsales por pie, separado de los plantares. Cuatro propietarios estructurales, cuatro mallas, dos módulos opcionales, 10.260 triángulos y 92.644 bytes GLB. No se individualizan artificialmente los cuatro interóseos de cada conjunto.

Fuente Z-Anatomy fijada en el commit `38649f4193adbe58e426ccac5670b8c4dde474ec`, licencia CC BY-SA 4.0 y crédito BP3D original. Los dos lados son objetos independientes de la fuente; no se fabrica uno reflejando el otro. Se conservan sus matrices originales documentadas y se corrige el winding de exportación cuando corresponde.

Una similitud global positiva, escala `0.9952171923529913`, se estima con 84 huesos; después se aplica una transformación rígida común por pie. Cada región usa 26 huesos, seis reservados del ajuste. RMS izquierda/derecha 0,913/0,905 mm; máximo muestreado 4,294/4,241 mm. No hay ajustes por músculo, deformación, recorte ni simplificación. Los contactos esquemáticos locales de hasta 1,09 mm con hueso y 0,89 mm con músculos vecinos se explicitan; estas cifras no establecen precisión clínica.

Los originales seleccionados Float64, matrices y triángulos orientados se conservan en ZIP. La verificación independiente de salida mantiene posiciones utilizadas, multiconjunto orientado y multiplicidad de triángulos, bounds e identidad. Float32 sin cuantizar posiciones; Meshopt y cuantización sólo de normales. Error máximo numérico `1.0255714611608195e-8 m`; glTF comprimido y decodificado, cero errores/advertencias. `build-completion-registered.mjs --verify-only` comprueba sin reinstalar ni reconstruir.

El catálogo comparte fichas entre Atlas y XR, con nombre español/latino, función, descripción, relaciones, licencia, fuente y límites de representación. El contexto del EDB usa calcáneo, falanges 2–4 y EHB; el de interóseos usa metatarsianos, falanges y EHB. Búsqueda y módulos siguen siendo opcionales. No se modificó código de interacción XR ni el renderer para completar QA.

### QA recuperado y diagnóstico de tiempos

Los cuatro owners pasan búsqueda, carga, selección, ficha, aislamiento, ocultación, restauración y conservación del mismo Canvas. Clic/hover real en ambos módulos y los tres modos de despiece con retorno exacto a cero pasan. Escritorio a 1366 px y móvil a 390 px pasan; se revisaron las ocho capturas nuevas de escritorio y cuatro móviles. El primer intento móvil del harness chocó con el panel de inspección reabierto; se corrigió el orden de cierre/apertura del test, sin cambiar producto.

El timeout histórico ocurrió al navegar tras un escenario completo que había tardado ~101 s. Una repetición con piel cargó todos los datos antes de fallar únicamente la captura de píxeles. Hay evidencia de carga progresiva y alto coste de render por software, sin errores JS/HTTP; no se puede atribuir retrospectivamente una causa única a la navegación. Se conservaron ambos fallos, las métricas completadas y el intento móvil fallido. Sólo se ampliaron plazos del harness; las aserciones de carga, conteos y funcionamiento permanecen.

Las repeticiones en navegadores nuevos pasan para el atlas completo:

| Escenario | Módulos / mallas | Triángulos | Bytes GLB / geometría | Draw calls | Primera geometría / completo (ms) | CPU render (ms) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Sin piel, con pelo | 90 / 1.237 | 4.752.236 | 46.291.816 / 91.379.508 | 1.191 | 1.078 / 6.675 | 34,2 |
| Con piel | 91 / 1.238 | 4.955.618 | 47.923.320 / 95.869.432 | 1.192 | 647 / 7.084 | 11,3 |

`qa-summary.json` conserva los cinco escenarios de Wave 3, intervalos de frame, buffers, transferencias, errores e historial de intentos, además de hashes de las capturas. Las muestras de frames y CPU en Chromium/SwiftShader no describen FPS sostenidos de GPU física. El cierre del navegador puede exceder los cinco segundos del harness después de guardar un reporte exitoso; se documenta aparte de las comprobaciones de producto.

Typecheck, build, prueba de cobertura y verificación de geometría pasan. La advertencia de chunk grande del build ya existía. `verify:anatomy` sigue reservado a una única campaña final. Inventario derivado: 11 sistemas, 743 estructuras, 322 componentes, 1.242 nodos, 177 editoriales, 1.238 mallas, 91 módulos, 4.955.618 triángulos y 47.923.320 bytes. Las cifras definitivas se cerrarán tras Waves 4–5.

## Wave 4 — cierre macroscópico

Wave 3 quedó protegida en `a0ec84efce918c0b0241bdcb359014ef6a4f61da`, con working tree limpio antes de comenzar esta wave. Se inspeccionaron 840 originales BP3D restantes, 287 candidatos Z y 18 assets HRA masculinos descargados con metadatos por versión. No se repitieron los modelos de Waves 1–2. Los inventarios, intentos, matrices, hashes y conclusiones por familia quedan en `research/anatomy/completion-wave4/` y `completion-wave4-decisions.json`.

Se incorporan únicamente las arterias recurrentes cubitales anteriores izquierda y derecha: `bp3d:FMA22802` / FJ2259 y `bp3d:FMA22801` / FJ2311. Son dos segmentos originales, dos owners y un módulo opcional de 938 triángulos / 10.376 bytes. Transformación nativa común `(x,z,-y)/1000`; sin reflejar, centrar, ajustar o fabricar conexiones. La cobertura de ramas regionales sigue siendo parcial. El contexto enlaza la arteria cubital y el miembro superior correspondiente; la ficha compartida explica función, relaciones, fuentes y límites.

El control inicial con tejidos históricos no detectaba contacto muscular; el control ampliado con los **813 tejidos actuales**, incluidos Waves 1–3 y nervios, lo sustituye: contactos superficiales con el flexor superficial de los dedos de 0,641/0,628 mm, además del solapamiento proximal esperado con el tronco cubital de 1,701/1,687 mm. No hay penetración ósea muestreada. Se conserva esta interfaz esquemática original, sin declararla precisión clínica ni anastomosis completa. Las recurrentes tienen contacto con su tronco; interóseas y recurrentes posteriores examinadas quedan separadas 6,21–21,89 mm del tronco disponible y no se completan con tubos inventados.

Los originales y headers históricos se conservan en ZIP; la declaración oficial vigente de DBCLS es CC BY 4.0. Verificación fuente→GLB decodificado: todos los triángulos orientados y sus multiplicidades, posiciones, bounds y ownership preservados; error máximo numérico `5.934869822905118e-8 m`. Meshopt sin cuantizar posiciones. Validador glTF, comprimido y decodificado: cero errores y advertencias. Typecheck, build y pruebas de catálogo pasan. Escritorio y móvil pasan búsqueda, ficha, aislar, ocultar, mostrar, enfocar y mismo Canvas; escritorio incluye raycast de clic y hover real en ambos owners. Capturas de contexto e inspección revisadas a 1366 y 390 px, sin overflow.

Las otras fuentes no se superponen directamente. HRA renal/ureteral contiene piezas reales y licencias permisivas, pero el ajuste común abdominopélvico da RMS 15,161 mm / máximo muestreado 47,086 mm; colon 14,464 / 64,216 mm. Las superficies de distintos donantes no coinciden. El intento visceral común Z para conductos eyaculadores da 6,029 / 31,816 mm y deja sus puntas separadas de la uretra al menos 2,61–2,68 mm. Las ramas renales BP3D probadas presentan discontinuidades y contactos ureterales; no se añaden conexiones ni se duplica el tronco existente.

Las cadenas linfáticas Z no conservan interfaces regionales (por ejemplo, nodos ilíacos dentro del colon hasta 20,67 mm); las amígdalas intersectan esfenoides. NIH ofrece un constructo de válvula local, que no representa conductos corporales; XCAT requiere resolver acceso/licencia de redistribución. El ganglio HRA aislado deriva de microarquitectura de ratón y no sustituye una red humana. La hipodermis HRA son parches engrosados, no una capa corporal segmentada. Piel regional y uñas Z fallan sus interfaces con tejidos actuales. Los lóbulos hipofisarios se reevaluaron en región craneofacial correcta; el intento inicial clasificado como tronco se conserva como intento inválido, no como evidencia final.

Los bloqueos describen fuentes y ensayos concretos, no una inexistencia mundial. El asset masculino de boca agotó dos descargas controladas; su geometría no se aprueba sin inspección y ese fallo no detiene el resto. La cobertura oral aceptada en Wave 2 permanece. No se usa riñón Z con licencia NC. No se descargan assets femeninos ni se modifica interacción XR, render, lazy loading, geometría histórica o baseline de auditoría.

Inventario corporal derivado después de Wave 4: 11 sistemas, 745 estructuras, 322 componentes, 1.244 nodos, 177 editoriales, 1.240 mallas, 92 módulos, 4.956.556 triángulos y 47.933.696 bytes GLB. La carga inicial mantiene los 51 módulos históricos sin piel. `verify:anatomy` continúa reservado a la campaña global final.

## Wave 5 — microanatomía independiente

Dos módulos reales bajo demanda, desde la ficha de Cerebro y la de cada riñón. Neurona: original SWC de Allen Cell Types / NeuroMorpho.Org 102401, donante humano masculino de 30 años, 17.990 puntos y 17.989 conexiones, 830.373 bytes intactos. Es un trazado parcial; no superficie celular, sinapsis ni circuito. La metadata regional discordante no se convierte en una localización cortical precisa.

Glomérulo: original HRA / NIH 3DPX-023604, Heidi Schlehlein, dirección Katy Börner y revisión Sanjay Jain. Esquema científico basado en bibliografía; no segmentación de un donante. Arteriolas, capilares y quince podocitos: 18 mallas, 1.646.925 triángulos. Descarga completa de 150.372.224 bytes verificada con SHA-256 y ETag multipart; se conserva la descarga incompleta anterior. El DOI declarado no resolvió; la procedencia comprobada es la entrada NIH y su archivo exacto.

Ambas fuentes son CC BY 4.0. Glomérulo comprimido con Meshopt a 57.940.448 bytes sin cuantizar posiciones, normales o colores: todos los atributos decodificados son idénticos byte a byte; cada triángulo conserva índices y orientación, permitiendo únicamente la rotación cíclica del códec. Jerarquía, matrices, materiales y bounds conservados. Validador glTF original comprimido y decodificado: cero errores/advertencias. Memoria de atributos/índices: 150.357.740 bytes; este módulo es pesado y sólo se descarga al abrirlo.

Escenas independientes, coordenadas originales, cámara propia y cierre con liberación de geometrías, materiales y buffers; sin sistema duodécimo, órgano duplicado o inserción microscópica en el frame corporal. Se mantienen selección y Canvas principal. Diálogo semántico con foco, Escape, fuentes, licencias y límites; portal para permanecer visible al colapsar el panel. Escritorio y móvil comprobados en 1366/1050/900/768/390, giro real, reset, cierre/reapertura, reintento tras HTTP 503 controlado y buffers creados/eliminados iguales. Capturas desktop/mobile revisadas. No cambios XR.

Los 13 gaps C tienen decisión en completion-wave5-decisions.json: tres parcialmente cubiertos (nervioso, microvasculatura y urinario), usando el glomérulo una sola vez. Los demás tienen bloqueos concretos por fuente, identidad o licencia. No se convierten diagramas 2D, cultivos, datos moleculares o modelos animales en geometría humana. Se excluye la porción ovárica del gap reproductor mixto.

Cuatro pruebas unitarias micro pasan, junto con typecheck y build. El reporte de QA conserva fallos anteriores y correcciones. En SwiftShader, carga neuronal 50,2 ms y glomérulo 399 ms; draw calls 2/18. CPU primer render glomerular 329,7 ms, incluyendo preparación inicial; las muestras posteriores e intervalos están en qa-summary.json, sin afirmación de FPS físicos. El cierre del navegador superó 5 s después de guardar todas las comprobaciones satisfactorias. Campaña global y conteos finales se detallan a continuación.

## Cierre de revisión anatómica — 13 de octubre de 2026

Los [resultados por gap](anatomy-completion-nonfemale-final.json), [fuentes utilizadas](anatomy-completion-sources.json) y [bloqueos](anatomy-completion-blockers.json) se generan con `node scripts/anatomy/close-completion-final.mjs`. Cada uno de los 119 gaps originales aparece exactamente una vez. Se evalúan 117; dos siguen `EXCLUDED_FEMALE`. El campo `closed` del ledger significa cierre de la clasificación anatómica, no aprobación de toda la campaña XR.

| Estado | Gaps |
| --- | ---: |
| INTEGRATED | 6 |
| PARTIAL_ACCEPTED | 35 |
| BLOCKED_SOURCE | 13 |
| BLOCKED_IDENTITY | 8 |
| BLOCKED_REGISTRATION | 51 |
| BLOCKED_LICENSE | 1 |
| BLOCKED_ANATOMY | 3 |
| EXCLUDED_FEMALE | 2 |

Los seis gaps integrados son diafragma, EDB, oponentes del pie, cristalinos, músculos extraoculares y coroides. Los interóseos dorsales agrupados siguen siendo una aceptación parcial. Un bloqueo describe lo que falta y no elimina cobertura parcial anterior: `baselineCoveredIds` la conserva. `wave` indica la última revisión y `integrationWaves` las cohortes que aportaron geometría. No hay gaps no femeninos pendientes de investigación ni estados UNKNOWN/TODO en el resultado final.

La revisión suplementaria de nueve gaps macroscópicos está en `research/anatomy/completion-final-macro-review.json`: palmar corto, fascículos del plexo braquial, regiones encefálicas, oído, tabiques cardíacos, senos, bronquios, hilios y peritoneo. Distingue una publicación de un asset descargable, una segmentación con identidad desconocida de un modelo masculino verificado, y ausencia de registro de una prueba numérica de registro fallida. No se aplican métricas abdominopélvicas al cerebro o al tórax. NasalSeg y reconstrucciones patológicas del tabique no se presentan como anatomía normal masculina identificada. La ausencia de un asset verificado en estas búsquedas no prueba inexistencia mundial.

### Inventario derivado

Conteo con la composición real del catálogo, incluyendo Ocular bajo Nervioso, desde cada commit histórico. Wave 1 describe su checkpoint inicial, antes de las retiradas documentadas de Wave 2. Los micros se cuentan aparte.

| Estado | Sistemas | Estructuras | Componentes | Nodos | Editoriales | Mallas | Módulos | Triángulos | Bytes GLB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| BASELINE | 11 | 580 | 228 | 981 | 173 | 937 | 52 | 3.240.172 | 29.795.780 |
| WAVE 1 | 11 | 657 | 233 | 1.064 | 174 | 1.023 | 63 | 4.100.946 | 39.200.560 |
| WAVE 2 | 11 | 739 | 322 | 1.238 | 177 | 1.234 | 89 | 4.945.358 | 47.830.676 |
| WAVE 3 | 11 | 743 | 322 | 1.242 | 177 | 1.238 | 91 | 4.955.618 | 47.923.320 |
| WAVE 4 | 11 | 745 | 322 | 1.244 | 177 | 1.240 | 92 | 4.956.556 | 47.933.696 |
| WAVE 5 | 11 | 745 | 322 | 1.244 | 177 | 1.240 | 92 | 4.956.556 | 47.933.696 |
| FINAL corporal | 11 | 745 | 322 | 1.244 | 177 | 1.240 | 92 | 4.956.556 | 47.933.696 |

Dos módulos micro independientes: neurona de 17.990 puntos / 17.989 conexiones y 830.373 bytes SWC; glomérulo de 18 mallas / 1.646.925 triángulos y 57.940.448 bytes GLB. Total corporal más glomérulo: 1.258 mallas triangulares, 6.603.481 triángulos y 105.874.144 bytes GLB; el trazado neuronal no se finge como malla triangular. Los micros no añaden owners al cuerpo ni un duodécimo sistema.

El source ledger fija 305 originales activos: 299 BP3D, cuatro objetos Z y dos fuentes micro. Conserva versión, URL/DOI cuando existe, autoría disponible, licencia por asset, hashes, frames, matrices y derivados. NeuroMorpho/Allen y NIH/HRA micro son CC BY 4.0; las piezas Z aceptadas son CC BY-SA 4.0. Se conservan los encabezados históricos BP3D. El bloqueo de Alvin no afirma que GPL sea NC: la licencia de aplicación no resuelve por sí sola la procedencia/licencia específica del modelo.

### Validación final y protección

Commits de producto: Wave 3 `a0ec84efce918c0b0241bdcb359014ef6a4f61da`; Wave 4 `3dcf955c7aa049826a2166a0be3277a9b6edbf9f`; Wave 5 `1cb29b1046a8f3f93a1a39233de69e541efaecbd`.

`node scripts/anatomy/validate-completion-final.mjs` pasa nueve comprobaciones: conservación desde originales de Waves 1–4 y glomérulo, validadores glTF comprimidos/decodificados y cuatro pruebas micro. Son 41 GLB nuevos activos, 40 corporales y uno micro, con cero errores/advertencias de validador. No se regeneran modelos durante esta verificación. El SWC conserva su grafo original. `test-anatomy-completion.mjs` pasa sobre el catálogo actual completo: IDs/refs/owners, hashes, módulos, búsqueda ES/latín/FMA/FJ, fichas, contexto y despiece.

Typecheck PASS. Build PASS en 26,82 s, con el preload WASM ya existente y la advertencia conocida de chunks grandes. `test:xr` PASS, 181/181, sin pruebas omitidas. Un primer intento de tests heredó el preload de Rollup y falló antes de ejecutar pruebas en los workers de Node 24; el reintento sin ese preload pasa. No se cambiaron dependencias ni lockfile.

`verify:anatomy` fue una campaña global final: la invocación inicial paró en la suite de miembros porque su proyección histórica retenía nuevas fichas/notas y bounds agregados tras las retiradas de Wave 2. Se corrigió únicamente `pre-completion-catalog.mjs`, manteniendo todas las aserciones. Se reanudaron las suites afectadas y se comprobaron las cuatro anteriores con la proyección definitiva. Las siete suites pasan. No se presenta la salida inicial de npm como exit 0; ambos resultados quedan documentados.

Se compararon por SHA-256 los 93 GLB presentes en el HEAD recuperado de Wave 2 y ambos archivos originales de auditoría: todos intactos. Ningún archivo de producción de `src/features/xr/` cambia desde ese HEAD. No se descargó ni integró geometría femenina; los recursos históricos permanecen intactos. Las fuentes rechazadas y cachés se conservan.

### Navegador, responsive y límite de aceptación XR

Atlas principal PASS sobre el build: los once sistemas y Ocular, búsqueda/árbol virtualizado, clic/hover real, ficha, focus, seis orientaciones, aislamiento, ocultar/mostrar/restaurar, capas y opacidad, tres niveles de despiece con retorno exacto, reset, carga opcional, retry ante un 503 controlado, dispose y mismo Canvas. Los doce representantes incluyen EDB de Wave 3 y recurrente cubital de Wave 4. Responsive 1366/1050/900/768/390 sin overflow. Home, Anatomía, About, Corazón, Pulmones, Encéfalo y XR cargan; los exploradores renderizan sus GLB. Micro pasa las mismas cinco anchuras, giro, reset, foco, Escape, retry y liberación de buffers.

XR pasa los once sistemas históricos con selección/raycast, fichas, opacidad, aislar, ocultar/restaurar, OFF/ON sin recarga y despiece exacto. Un seguimiento independiente pasa tap, drag sin selección, wheel, teclado, selección después de rotación/escala, responsive a cinco anchuras y bottom sheet. La UI existente carga los 92 módulos / 1.240 mallas, muestra los seis owners nuevos de Waves 3–4, conserva Canvas/escena y no carga micros; abandonar la ruta desmonta el Canvas.

**La campaña gestual XR de navegador no está aprobada.** El recorrido multisistema falló al adquirir el primer control gestual. Reintentos independientes del pan observaron `grace/lost/reacquiring`, muestras vacías del watchdog de 250 ms y pausas de muestras de hasta varios segundos. Una pasada con DPR 0,5 consiguió pan ascendente (~0,45 unidades), pero perdió tracking antes del descendente. Excluir la lectura de píxeles del vídeo sintético tampoco mantuvo adquisición. No se deshabilitó el watchdog, se virtualizó el reloj ni se modificaron gestos o umbrales. Son limitaciones reproducidas de esta campaña; no prueban por sí solas una causa única ni el comportamiento de una webcam física. El scroll nativo de ficha pasó al esperar el estado real del scroll en lugar de 400 ms fijos: foco, flechas, Home/End, PageUp/PageDown, wheel y arrastre de scrollbar. Ese mismo reintento agotó 120 s al adquirir el scroll gestual; los fallos anteriores permanecen registrados. Los resultados exactos por intento se versionan en el resumen QA.

Por este motivo, la clasificación anatómica está terminada y las waves anatómicamente validadas están protegidas, pero **no se emite el commit documental de aceptación final** `Document final non-female anatomy completion status`. El checkpoint documental conserva la evidencia y la limitación pendiente. Para cerrar la aceptación global falta ejecutar satisfactoriamente dwell, scroll de sistemas/ficha, pan y manipulación gestual en un navegador con continuidad de muestras suficiente, conservando las mismas aserciones y el producto actual.

### Rendimiento final observado

Navegadores nuevos, HTTP loopback sin caché, Chromium headless/SwiftShader. Óseo inicial conserva sólo siete módulos; los otros escenarios incluyen ampliaciones opcionales. Bytes de geometría = atributos/índices contabilizados, no memoria total del proceso. CPU = envío de comandos y driver, no finalización GPU.

| Escenario | Módulos / mallas | Triángulos | Bytes GLB | Bytes geometría | Buffers vivos | Draws | Primera / completa ms | CPU ms | Intervalos ms (N) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Óseo inicial | 7 / 205 | 512.450 | 3.916.940 | 7.609.772 | 629 | 173 | 166 / 166 | 1,4 | 16,60–16,63 (2) |
| Muscular | 33 / 298 | 1.780.144 | 20.092.396 | 40.321.892 | 908 | 282 | 155,4 / 402,2 | 1,1 | 16,6 (1) |
| Nervioso + Ocular | 15 / 189 | 873.004 | 7.453.976 | 14.892.416 | 575 | 191 | 155,2 / 237,9 | 28,8 | 16,7 (1) |
| Órganos internos | 33 / 542 | 1.547.182 | 14.279.508 | 27.484.752 | 1.640 | 542 | 164,1 / 386,7 | 2,1 | 16,7 (1) |
| Completo sin piel | 91 / 1.239 | 4.753.174 | 46.302.192 | 91.394.636 | 3.725 | 1.193 | 196 / 7.075,2 | 1.685,9 | 3.249,75–5.016,5 (3) |
| Completo con piel | 92 / 1.240 | 4.956.556 | 47.933.696 | 95.884.560 | 3.728 | 1.194 | 199,4 / 2.414,1 | 4,2 | 16,7 (2) |

Los seis escenarios cargan sin errores JS/HTTP. La observación completa desde el harness tardó respectivamente 933/1.145/995/1.154/11.701/3.183 ms. El pico del caso sin piel se conserva expresamente; la dispersión impide atribuir una mejora al caso con piel. Hay sólo 1–3 intervalos tras un zoom y render bajo demanda: **no son FPS sostenidos ni mediciones de GPU física**. No se cambia renderer o producto para mejorar estos números. El glomérulo independiente requiere 150.357.740 bytes de geometría y sigue siendo una descarga pesada bajo demanda.

Evidencia consolidada y hashes de logs/capturas: `research/anatomy/completion-final/qa-summary.json`, generado por `scripts/anatomy/summarize-completion-final.mjs`. Los fallos previos, plazos de teardown tras reportes exitosos y diagnósticos de DPR se distinguen de los PASS funcionales. No se incluyen cachés temporales en Git. Sin push, merge, deploy, tag o release; no se inicia otra fase.
