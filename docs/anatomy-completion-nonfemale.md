# Programa de completado anatómico no femenino

Programa en curso. Este documento se amplía por waves; todavía no constituye el cierre de los 117 gaps no femeninos.

Base documental: `101024e8d4083fcaf991e9c683733d0a02388e29`. Base del producto: `1be9dd644dea33cc008fe47889e4608bd3fab8f6`. Rama: `phase-anatomy-completion-nonfemale`.

La auditoría original se conserva intacta. **FUTURE SEPARATE FEMALE ATLAS**: ningún recurso exclusivamente femenino se ha descargado, registrado o integrado.

## WAVE 0

Inventario rehecho desde catálogos y GLB: 11 sistemas, 580 estructuras, 228 componentes, 981 nodos (173 editoriales), 937 mallas, 52 módulos, 3.240.172 triángulos y 29.795.780 bytes. Baseline local en `.cache/anatomy-completion/inventory.json`.

## WAVE 1 — nativos prioritarios

Cohorte: 77 estructuras, 5 componentes, 1 región editorial, 86 mallas, 11 módulos opcionales. Total provisional: 657 estructuras, 233 componentes, 1.064 nodos, 1.023 mallas, 63 módulos, 4.100.946 triángulos y 39.200.560 bytes. El número de estructuras óseas no aumenta; los 28 dientes pertenecen a Digestivo.

Incluye diafragma, tres capas intercostales agregadas, seis rotadores profundos por lado, psoas mayor e ilíaco bilaterales, 28 dientes permanentes, seis músculos extraoculares y elevador palpebral por lado, dos cristalinos, dos porciones ópticas retinales, ocho músculos del suelo pélvico, dos porciones de un esfínter anal externo, seis trayectos arteriales femorales regionales y una porción de tienda del cerebelo.

La correspondencia nominal de femoral profunda era insuficiente: los originales identifican circunflejas laterales, sus ramas descendentes y geniculares descendentes. No se renombraron como troncos femorales profundos. Tampoco se afirma que los intercostales equivalgan a once pares individualizados, que haya 32 dientes, que se complete el canal anal, el periné o todas las meninges.

### Procedencia e identidad

Original oficial BP3D 4.0 OBJ99, recuperado por rangos HTTP exactos del archivo de 142.903.898 bytes, con comprobación CRC32 y SHA-256. Se examinaron 97 candidatos; 86 originales integrados se conservan en `research/anatomy/completion-wave1-originals.zip`. Selección, encabezados, versiones, identidad, decisiones por candidato y licencias están fijados en los archivos `completion-wave1-*.json` de research/anatomy.

Se comprobó [la declaración oficial de licencia](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) antes de descargar: CC BY 4.0, DBCLS. Los encabezados históricos CC BY-SA 2.1 Japan permanecen intactos en los OBJ; no se han reescrito. Copia y hash de la declaración actual incluidos. Las fichas son paráfrasis breves con enlaces a OpenStax y procedencia geométrica separada.

### Conservación y encaje

Transformación única `(x,y,z) -> (x,z,-y)/1000`. Sin centrar, escalar, reflejar, deformar, registrar por pieza ni simplificar. Posiciones Float32 y Meshopt; cuantización sólo de normales de presentación. La comparación independiente contra los OBJ decodifica el GLB final y comprueba todas las posiciones usadas, multiconjunto de triángulos, multiplicidad, winding, bounds e identidad FMA/FJ.

860.774 triángulos conservados; 9.404.780 bytes añadidos; 19.841.364 bytes de accessors decodificados. Error máximo de posición: 6,010618735117701e-8 m; tolerancia de aceptación: 0,00005 m. Son medidas numéricas, no precisión anatómica o clínica. Validador glTF: cero errores y advertencias en archivos comprimidos y decodificados.

Las pruebas de superficies registran contactos reales del dataset. El muestreo determinista con tres rayos por punto no detectó profundidades mayores de 1 mm en las relaciones examinadas: diafragma/hígado 0,964 mm máximo muestreado; diafragma/pulmón derecho 0,049 mm e izquierdo 0,091 mm. Este muestreo no prueba estanqueidad ni mide volumen de penetración. No se ajustaron las superficies para ocultar contactos.

FJ2549/FJ2550/FJ2551 contienen pequeños fragmentos contralaterales de origen: áreas de 0,277/0,310/1,650 mm² respectivamente, frente a 4.954/5.873/4.822 mm² totales. Se conservan en las mallas fuente, sin recortar, sin propietarios adicionales y sin interpretarlos como nuevas estructuras. Inspección aislada y regional documentada.

### Comportamiento

Las adiciones tienen `defaultEnabled: false`; las carga una búsqueda/selección o el control de módulo. Primera carga: los 51 módulos históricos sin piel. Nombres públicos de módulos, IDs estables, alias españoles/latinos/FMA/FJ, propiedad única, árbol virtual, aislamiento, ocultación, restauración, contexto curado y retorno exacto a cero del despiece.

Las nuevas lecciones se almacenan una vez por familia en el catálogo y se referencian por ID. Atlas y XR consumen esa misma fuente; referencias ausentes y definiciones incompatibles se rechazan. El compositor XR ya descubre los módulos de los sistemas activos. No cambian gestos, dwell, pan ni MediaPipe.

### Validación y reproducción

Pruebas nuevas: `node scripts/test-anatomy-completion.mjs`. Verifican catálogos completos, hashes históricos, IDs/owners, búsqueda, fichas compartidas, cargas opcionales, alcance real y despiece cero. Las suites históricas usan una proyección de sus módulos originales reales; sus cifras y afirmaciones anteriores se mantienen, y la suite nueva valida la composición completa.

Geometría reproducible desde el checkout base y originales fijados: `python scripts/anatomy/build-completion.py wave1`, optimizador, validador e instalación explícita. El builder se niega a sobrescribir GLB existentes. Para verificar este checkout sin reconstruir ni modificar modelos:

`node scripts/anatomy/optimize-completion.mjs --output research/anatomy/completion-wave1 --source research/anatomy/completion-wave1-originals.zip --verify-only`

Reporte glTF, transformación, cohortes y comparación fuente/resultado en `research/anatomy/completion-wave1/`. QA local en `.cache/anatomy-completion/wave1/`; el navegador utiliza Chromium headless/SwiftShader sobre HTTP loopback, no GPU física. No se publican promesas de FPS.

Suites dirigidas superadas: nueva cobertura; integración histórica; digestivo; cardiovascular; nervioso; muscle-gaps; XR full-atlas (7 pruebas). Typecheck y build superados. Build conserva la advertencia preexistente por chunks mayores de 500 kB. `verify:anatomy` se reserva para la campaña global final.

### Rendimiento y QA de WAVE 1

En Chromium headless/SwiftShader, primera carga histórica: 51 módulos, 28.164.276 bytes, 53.567.064 bytes de geometría en memoria, 892 draw calls observadas; primera geometría ~222 ms y carga completa ~2.323 ms. Con todas las ampliaciones sin piel: 62 módulos, 37.569.056 bytes, 74.671.196 bytes de geometría y 978 draw calls, ~2.733 ms de carga completa. Con piel: 63 módulos, 39.200.560 bytes, 79.161.120 bytes de geometría y 979 draw calls, ~4.645 ms. Son mediciones locales puntuales, sin red real ni GPU física.

Los cinco escenarios (primera carga, muscular aislado, varios sistemas, completo sin piel y con piel) están en `research/anatomy/completion-wave1/qa-summary.json`. Los intervalos recogidos tras un único zoom tienen pocas muestras: no sustentan una conclusión de FPS sostenidos. Otra pasada registra la duración CPU publicada por el renderer, incluyendo el coste del driver y envío de comandos, sin medir finalización GPU: ~13,7 / 3,2 / 822,1 / 1.418,8 / 1.148,3 ms respectivamente. Estos picos en software son una limitación explícita. Las nuevas cargas no se activan por defecto.

QA funcional recorre cada nuevo owner con búsqueda por FMA, carga real, ficha, aislar, ocultar, restaurar y mismo Canvas. Tres niveles de despiece vuelven exactamente a reposo. Capturas regionales y aisladas revisadas manualmente, además de móvil a 390 px y nombres públicos de cada módulo. La revisión responsive completa se reserva para el cierre global.

## Waves pendientes

WAVE 2: restantes nativos A/B. WAVE 3: fuentes registrables con pruebas nuevas. WAVE 4: candidatos macro de fuente desconocida. WAVE 5: fuentes y arquitectura micro independiente vinculada. Al cierre se emitirán las decisiones de todos los gaps y los ledgers finales; no se considera este atlas completo.
