# Fase 3 — comparación y elección de fuentes musculares

Revisión: 21 de septiembre de 2026. Base MED3D: `41c797b106c66429eeda41a81597bf05abfb07d8`.

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
