# Programa de completado anatómico no femenino

Programa en curso. Este documento se amplía por waves; todavía no constituye el cierre de los 117 gaps no femeninos.

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

## Waves pendientes

 WAVE 3: fuentes registrables con pruebas nuevas. WAVE 4: candidatos macro de fuente desconocida. WAVE 5: fuentes y arquitectura micro independiente vinculada. Al cierre se emitirán las decisiones de todos los gaps y los ledgers finales; no se considera este atlas completo.
