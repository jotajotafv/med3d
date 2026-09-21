# Fase 3 — comparación y elección de fuentes musculares

Revisión: 21 de septiembre de 2026. Base MED3D: `41c797b106c66429eeda41a81597bf05abfb07d8`.

**Actualización de Fase 3A:** se implementó exclusivamente el piloto autorizado de 26 elementos originales, que representan 16 músculos bilaterales. El apartado final documenta extracción, catálogo, conversión y validación numérica. El código `8c2a9cdd67a482459de106dfc87843502c1c0643` completó la [ejecución final 35554899964](https://github.com/jotajotafv/med3d/actions/runs/35554899964): 30 comprobaciones funcionales del piloto, 26 regresiones óseas y una regresión dirigida del árbol; se generaron 38 capturas del piloto y 32 de referencia, y se midieron las configuraciones ósea, muscular y conjunta. La inspección visual y sus limitaciones se registran separadamente en [validación](phase3-validation.md) y [entrega](phase3-delivery.md). La investigación previa se conserva a continuación como antecedente; sus afirmaciones «aún no convertido/medido» describen aquel momento, no el estado del piloto implementado.

**Decisión previa a Fase 3A: BodyParts3D 4.0 OBJ99 para el piloto.** La elección se apoya en procedencia, metadatos, existencia de archivos y compatibilidad con la fuente ósea actual. No declara validada la anatomía muscular integrada ni su cobertura completa. La [auditoría](phase3-audit.md) y la [estrategia de registro](phase3-registration.md) delimitan el trabajo pendiente.

## Comparación de candidatos

| Fuente y versión inspeccionada | Procedencia y licencia | Cobertura y segmentación | Marco espacial y compatibilidad con MED3D | Calidad geométrica y viabilidad web |
| --- | --- | --- | --- | --- |
| BodyParts3D 4.0, archivo 20130619, OBJ99 | DBCLS/ROIS; responsable Kousaku Okubo. Declaración vigente CC BY 4.0. | Atlas masculino adulto; elementos OBJ identificados FJ, conceptos FMA, grupos y componentes. La unión de tres ramas musculares aporta 403 elementos candidatos, no 403 músculos. | Mismo paquete y versión de los huesos de MED3D. Seis huesos de control coinciden en SHA-256/bytes; la muestra muscular declara compatibilidad 4.0. Conservar el marco original y la conversión existente. | Distribución reducida por el proveedor. Muestra de seis piezas musculares legible numéricamente; aún sin evaluación visual en MED3D. Requiere GLB modulares y medición posterior, no servir OBJ/ZIP al navegador. |
| HRA/HuBMAP ASCT+B Muscular System v1.4 y objetos 3D United Male v1.10 | Gustilo/Weber para tabla; Browne/Schlehlein para objetos. Ambas versiones de 15-06-2026, CC BY 4.0 en sus metadatos. | La tabla es semántica, no una colección de meshes. Los objetos examinados contienen musculatura local; no se identificó un conjunto muscular corporal completo. | Los objetos masculinos documentan Visible Human Male, distinto del modelo BP3D. No se encontró registro a MED3D. Las tablas carecen de geometría; unidades y transforms requieren inspección por asset. | GLB y crosswalks son útiles para referencias locales. No se descargaron ni midieron estas mallas. Fuente complementaria para jerarquía y relaciones, no sustituto inmediato del sistema corporal. |
| NLM Visible Human Project, masculino 1994 y femenino 1995 | NLM; producción University of Colorado Health Sciences Center/NCAR. Dominio público según NLM; acceso sin acuerdo de licencia desde 2019. | Imágenes CT/MRI y criocortes, no músculos individualmente segmentados listos para GLB. | Cadáveres masculino y femenino propios, sin registro demostrado al modelo BP3D. Las dimensiones de adquisición no proporcionan por sí solas una matriz de integración. | Necesitaría segmentación, reconstrucción, revisión y optimización. No se evaluó geometría derivada ni rendimiento web; coste alto para esta fase. |
| Z-Anatomy, snapshot 23d42ff2acf149e4cc0af666b3f80af2ed19909a, 20-09-2026 | Derivado de BP3D; anatomía/diseño/modelado atribuidos a Gauthier Kervyn. CC BY-SA 4.0 global, con componentes de terceros que declaran NC. | Atlas masculino distribuido mediante Blender. No se auditó el paquete ni su inventario muscular individual. | Su procedencia parcial BP3D no acredita identidad con v4.0: unidades, matrices y cambios por asset no comprobados. | Candidato secundario. Exige auditoría de geometría, procedencia, licencia y transformación por asset antes de usarlo; no se midió viabilidad web. |

Fuentes de la tabla: [descripción BP3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html), [licencia vigente BP3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [metadata muscular HRA](https://github.com/hubmapconsortium/hra-kg/blob/8cf7ee34c9c16f7fa5f129bc577e906270d50393/digital-objects/asct-b/muscular-system/v1.4/raw/metadata.yaml), [metadata United Male](https://github.com/hubmapconsortium/hra-kg/blob/8cf7ee34c9c16f7fa5f129bc577e906270d50393/digital-objects/ref-organ/united-male/v1.10/raw/metadata.yaml), [NLM Visible Human](https://www.nlm.nih.gov/research/visible/visible_human.html), [README Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/23d42ff2acf149e4cc0af666b3f80af2ed19909a/Readme.md), [licencia Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/23d42ff2acf149e4cc0af666b3f80af2ed19909a/License.txt).

La preferencia por BP3D y el coste relativo de las alternativas son conclusiones de ingeniería de esta investigación, no una clasificación de precisión clínica.

## BodyParts3D: procedencia exacta y límites

Archivo elegido: [isa_BP3D_4.0_obj_99.zip](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip). Release 4.0 de mayo de 2013; archivo de 19-06-2013. La actualización de licencia de 27-02-2025 no es una nueva versión geométrica. La declaración oficial vigente es CC BY 4.0; los comentarios originales inspeccionados aún conservan CC BY-SA 2.1 Japan y no deben borrarse para ocultar esa historia. Atribución: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

Publicación de referencia: Mitsuhashi, Fujieda, Tamura, Kawamoto, Takagi y Okubo, [BodyParts3D: 3D structure database for anatomical concepts](https://doi.org/10.1093/nar/gkn613).

Se trata de un atlas anatómico modelado, no de musculatura segmentada íntegramente de un solo donante. La [información del proyecto](https://lifesciencedb.jp/bp3d/info_en/index.html) describe el uso de distintas referencias y reconoce limitaciones de cobertura y correspondencia conceptual. La [nota técnica histórica v2.0](https://lifesciencedb.jp/bp3d/info/userGuide/releaseNotes/modelingNote-2.0.pdf), comprobada visualmente en páginas 8 y 38, describe modelado CAD de músculos con atlas/textos y construcción por simetría de algunas piezas. Es un antecedente de producción, no evidencia de que cada FJ v4 conserve exactamente ese proceso ni dos escaneos bilaterales independientes.

La [nota de v4.0](https://lifesciencedb.jp/bp3d/info_en/userGuide/releaseNotes/release-4.0.html) advierte cambios espaciales del esqueleto y otros órganos. No mezclar versiones ni sustituir la prueba de compatibilidad por compartir proveedor.

## Cobertura comprobada en metadatos

Se recorrió el grafo padre→hijo de `isa_inclusion_relation_list.txt`, incluyendo cada raíz, y se resolvieron sus conceptos a FJ mediante `isa_element_parts.txt`. Se deduplicaron los FJ. Las tres colecciones siguientes no comparten elementos entre sí.

| Rama | Conceptos, incluida raíz | Elementos FJ únicos |
| --- | ---: | ---: |
| FMA5022 — muscle organ | 535 | 323 |
| FMA10474 — zone of muscle organ | 63 | 38 |
| FMA85453 — head of muscle organ | 68 | 42 |
| Unión candidata | 666 | 403 |

La distinción entre músculo, grupo, lateralidad, cabeza y zona impide interpretar esos totales como número de músculos completos. Seleccionar sólo FMA5022 omitiría porciones de deltoides y cabezas de bíceps/tríceps. La jerarquía editorial final requiere curación y contraste con el alcance de musculatura esquelética; no se han aprobado todos los candidatos para importación ni se acredita cobertura anatómica exhaustiva.

[Conceptos oficiales](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_parts_list_e.txt), [relaciones](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_inclusion_relation_list.txt), [bindings FMA–FJ](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_element_parts.txt). Los hashes de las cinco tablas inspeccionadas y los conjuntos obtenidos se conservan en [source-audit.json](phase3/research/source-audit.json).

Higgsfield leyó el directorio ZIP mediante HTTP Range: los 403 FJ candidatos y los 26 del piloto existen dentro de sus 2.234 OBJ. Esto comprueba presencia y tamaños declarados, no integridad descomprimida de los 403 archivos.

| Medida de inventario | Valor |
| --- | ---: |
| ZIP completo, tamaño declarado | 142.903.898 bytes |
| 403 candidatos: suma OBJ sin comprimir | 181.315.733 bytes |
| 403 candidatos: suma de contenidos comprimidos ZIP | 53.590.425 bytes |
| 26 piezas piloto: suma OBJ sin comprimir | 3.264.206 bytes |
| 26 piezas piloto: suma de contenidos comprimidos ZIP | 989.792 bytes |
| Seis piezas musculares realmente extraídas y verificadas | 618.861 bytes; 8.628 triángulos |

Los tamaños ZIP/OBJ no son tamaños GLB ni memoria GPU. No se descargaron cientos de modelos. No se midieron triángulos del conjunto de 403, GLB finales, draw calls, FPS ni rendimiento móvil. El siguiente paso es convertir sólo el piloto, medir y validar antes de ampliar módulos.

## Papel complementario de HRA y límites de otras fuentes

El [CSV muscular HRA v1.4](https://github.com/hubmapconsortium/hra-kg/blob/8cf7ee34c9c16f7fa5f129bc577e906270d50393/digital-objects/asct-b/muscular-system/v1.4/raw/asct-b-vh-muscular-system.csv) distingue regiones, grupos y partes. El [Musculoskeletal Crosswalk v1.1](https://github.com/hubmapconsortium/hra-kg/blob/8cf7ee34c9c16f7fa5f129bc577e906270d50393/digital-objects/asct-b/musculoskeletal-crosswalk/v1.1/raw/metadata.yaml), de Weber/Gustilo, 15-06-2025, CC BY 4.0, documenta relaciones de origen/inserción inicialmente en miembro superior. Son relaciones semánticas, no máscaras ni coordenadas de inserción sobre los GLB.

Registrar las inconsistencias originales: el YAML muscular v1.4 conserva una cita que dice v1.3; el YAML del crosswalk conserva una cita titulada Blood Vasculature Organ Crosswalk. No corregir silenciosamente estos metadatos ni confundir versión de carpeta, texto de citación y recurso descargado.

HRA posee también geometría local histórica de región de rodilla: los [nodos publicados](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/main/NodeLists/05162022/VH_M/OutputM.csv) identifican recto femoral y tendón del cuádriceps. No equivalen a un sistema muscular corporal ni a cobertura completa de rodilla. La [metadata del ojo](https://github.com/hubmapconsortium/hra-kg/blob/8cf7ee34c9c16f7fa5f129bc577e906270d50393/digital-objects/ref-organ/eye-male-left/v1.3/raw/metadata.yaml) documenta modificaciones y omisiones regionales. No se inspeccionaron esas mallas ni su registro a BP3D.

La licencia Z-Anatomy enumera excepciones NC del oído interno Dundee y del riñón de Lissie Cowley. Su existencia no significa que todos los músculos sean NC, ni permite afirmar que todos sean reutilizables bajo la licencia global sin auditoría específica.

## Conclusión y límites

La investigación justifica elegir la fuente y preparar una prueba regional con transformaciones conservadas. No justifica afirmar cuerpo muscular completo, alineación anatómica aprobada, rendimiento web o puntos seguros de origen/inserción. Mantener las siete ausencias óseas documentadas y los órganos HRA en exploradores independientes.

## Fase 3A — originales incorporados y conversión reproducible

Se extrajeron **solamente los 26 OBJ aprobados**, mediante 53 peticiones HTTP Range: directorio ZIP fijado por SHA-256, 26 cabeceras locales y 26 contenidos comprimidos. Se rechazaba la descarga si el servidor no respondía `206` con el intervalo exacto. Se transfirieron 1.160.597 bytes; el ZIP completo de 142.903.898 bytes no se descargó. No se procesaron los 403 candidatos.

Cada original se comprobó contra tamaño/CRC32 del directorio auditado; los seis músculos inspeccionados previamente también coinciden con sus SHA-256 anteriores. Los 26 encabezados coinciden con versión compatible `4.0`, FMA, FJ y representación BP de los metadatos. El [ZIP de originales](../research/anatomy/muscular-pilot-originals.zip) conserva íntegros sus comentarios históricos y geometría. Su SHA-256 es `251bf962442e4077d258ee164bc6af68f51ec89f888ae1051f4f7dc611238844`, ocupa 988.669 bytes y contiene 3.264.206 bytes OBJ. El [lock de extracción](../research/anatomy/muscular-pilot-source-lock.json) registra fuentes, intervalos y hashes por elemento. El hash histórico del ZIP completo se identifica expresamente como no recalculado en esta fase.

### Identidad y conteo

El [catálogo muscular](../public/models/anatomy/muscular/catalog.json) contiene 16 nodos `structure` —8 músculos por lado— y 26 mallas originales. Deltoides, bíceps y tríceps tienen padres editoriales `med3d:muscle:<familia>:<lado>`; sus porciones/cabezas conservan los FMA y FJ originales como componentes. Los otros cinco músculos por lado son estructuras indivisas identificadas con sus FMA originales. No se inventan FMA para padres ni se cuentan cabezas como músculos adicionales.

| Músculo o componente | FMA / FJ derecho | FMA / FJ izquierdo |
| --- | --- | --- |
| Deltoides, porción clavicular | FMA34680 / FJ1468 | FMA34681 / FJ1468M |
| Deltoides, porción acromial | FMA34682 / FJ1467 | FMA34683 / FJ1467M |
| Deltoides, porción espinal | FMA34684 / FJ1513 | FMA34685 / FJ1513M |
| Bíceps braquial, cabeza corta | FMA37684 / FJ1512 | FMA37685 / FJ1512M |
| Bíceps braquial, cabeza larga | FMA37686 / FJ1478 | FMA37687 / FJ1478M |
| Tríceps braquial, cabeza medial | FMA37695 / FJ1480 | FMA37696 / FJ1480M |
| Tríceps braquial, cabeza lateral | FMA37697 / FJ1477 | FMA37698 / FJ1477M |
| Tríceps braquial, cabeza larga | FMA37699 / FJ1479 | FMA37700 / FJ1479M |
| Braquial | FMA37668 / FJ1486 | FMA37669 / FJ1486M |
| Supraespinoso | FMA32544 / FJ1506 | FMA32545 / FJ1506M |
| Infraespinoso | FMA32547 / FJ1500 | FMA32548 / FJ1500M |
| Redondo menor | FMA32553 / FJ1508 | FMA32554 / FJ1508M |
| Subescapular | FMA13414 / FJ1504 | FMA13415 / FJ1504M |

Los grupos de navegación distinguen hombro y brazo, y el brazo conserva compartimento anterior —bíceps y braquial— y posterior —tríceps—. Es curación anatómica, no inferencia de una relación `part_of` a partir de `is_a`; véase [OpenStax, músculos de cintura escapular y miembro superior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs). El alcance no incluye todos los músculos del hombro/brazo ni musculatura corporal completa.

### Transformación y entrega web

Los 26 originales reciben exactamente `(x,y,z) → (x,z,-y)/1000`, igual que los huesos; no hay ajuste espacial adicional, centrado individual, espejo generado, síntesis, unión ni simplificación. El marco declarado sigue siendo `bodyparts3d-4.0-male`, con los límites corporales existentes para que una carga regional no altere escala o centro global. La [documentación de registro](phase3-registration.md) distingue esta conservación del marco de una validación anatómica independiente.

Los GLB conservan posiciones Float32 en metros y comprimen sin pérdida esos valores con Meshopt. Sólo las normales de visualización se cuantizan a 12 bits, almacenadas como Int16 normalizado; se declaran `EXT_meshopt_compression` y `KHR_mesh_quantization`. Una prueba inicial con posiciones a 16 bits volvió ambiguas las correspondencias por proximidad entre vértices originales muy cercanos del bíceps; se descartó esa variante, sin usarla como resultado final. Conservar Float32 permite comprobar todos los triángulos sin aumentar la tolerancia ni omitir piezas.

| Módulo final | Bytes GLB | Mallas | Triángulos | Vértices GLB | Materiales | Bytes de accessors decodificados |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| muscular-upper-right.glb | 269.856 | 13 | 19.802 | 17.387 | 1 | 431.778 |
| muscular-upper-left.glb | 270.076 | 13 | 19.802 | 17.370 | 1 | 431.472 |
| Total | 539.932 | 26 | 39.604 | 34.757 | 2 por módulos | 863.250 |

Los vértices GLB distinguen normales/seams y no equivalen al número de posiciones únicas del OBJ ni al número de músculos. Los bytes de accessors cuentan sus datos de atributos/índices decodificados. El gestor mide por separado los `ArrayBuffer` únicos asignados por el loader, incluida su capacidad; ninguna cifra representa memoria GPU total. Las transformaciones permanecen en los objetos 3D, sin hornearse en esos buffers. Las mediciones de ejecución pertenecen a [rendimiento](phase3-performance.md). Los dos GLB sin compresión ocupaban en conjunto 1.091.620 bytes.

El [manifiesto](../public/models/anatomy/muscular/source-manifest.json) enlaza original → FMA/FJ/lado → nodo → módulo e incluye la matriz compartida. El [informe numérico](../public/models/anatomy/muscular/validation.json) contiene hashes finales, métricas por módulo y por los 26 elementos. La comparación parte de coordenadas OBJ originales en doble precisión, no del GLB intermedio: busca cada posición decodificada en metros, exige el mismo multiconjunto de todos los triángulos orientados —incluidas repeticiones— y conserva toda posición original usada por caras.

Tolerancia fijada: error euclídeo máximo **0,05 mm**, exclusivamente numérico. Resultado final: **0,0000599851 mm** máximo entre posición original transformada y decodificada; error máximo de límites **0,0000574112 mm**. Los 39.604 triángulos, sus identidades y orientación se conservan. Estas cifras no expresan precisión anatómica o clínica.

### Reproducir sin volver a descargar

```sh
npm install --prefix .cache/anatomy-tools --no-save @gltf-transform/core@4.5.0 @gltf-transform/extensions@4.5.0 @gltf-transform/functions@4.5.0 meshoptimizer@1.2.0
python scripts/anatomy/build-muscular-pilot.py
node scripts/anatomy/optimize-muscular-pilot.mjs
node scripts/anatomy/optimize-muscular-pilot.mjs --verify-only
```

`build-muscular-pilot.py --fetch` repite opcionalmente la extracción exacta de los 26 originales; no es necesario para reconstruir con el ZIP preservado. El optimizador rechaza cuantizar de nuevo un archivo ya comprimido. `--verify-only` verifica los hashes finales y vuelve a calcular íntegramente el informe sin modificar archivos.

El catálogo y los GLB óseos originales no forman parte de esta conversión. Persisten las siete ausencias óseas y el criterio de Fase 2.1; las fuentes alternativas, matrices y razonamiento previo permanecen conservados. La evaluación visual y funcional del piloto, y sus límites, se documentan en [validación de Fase 3A](phase3-validation.md). No se han incorporado nuevos sistemas ni iniciado Fase 3B.


### Cierre técnico del piloto

La ejecución final y los informes conservados en [validación](phase3-validation.md) vinculan fuentes, GLB y funcionamiento al código `8c2a9cd`. El validador glTF registró cero errores y cero advertencias en ambos GLB; los mensajes informativos de Meshopt no modifican la evidencia de conversión. Los recursos óseos, su catálogo y la documentación histórica de los siete huesos pendientes permanecen sin cambios.

Las mediciones finales del [piloto](phase3-performance.md) registran 205 / 26 / 231 draw calls iniciales para óseo / muscular / conjunto y 7.609.772 / 932.764 / 8.542.536 bytes de buffers geométricos. Se midió Chromium con ANGLE SwiftShader sobre HTTP local, sin GPU física. Los tiempos de una ejecución secuencial no demuestran superioridad de una configuración ni representan redes móviles.

La inspección específica de transparencia observa bandas oscuras y acumulación de color por superposición al 75 % y 50 %; al 25 % y 10 % se distingue el húmero subyacente. En móvil los paneles se abren voluntariamente y requieren desplazamiento vertical. El despiece de componentes conserva solapes parciales, especialmente entre las dos cabezas del bíceps incluso al 100 %; no es una separación completa de todas las superficies. Estas limitaciones de presentación no se corrigen alterando las coordenadas fuente.

Se revisaron las 38 capturas del piloto mediante hojas de contacto e inspecciones individuales adicionales de los casos relevantes. El [informe visual](phase3/results/visual-review.md) no identifica un impedimento para entregar el piloto educativo dentro del alcance inspeccionado; conserva las limitaciones anteriores y no certifica ausencia global de penetraciones. La publicación se verifica por separado en la [entrega](phase3-delivery.md). No se declara precisión clínica, musculatura corporal completa ni autorización para Fase 3B.
