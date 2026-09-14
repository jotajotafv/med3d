# Fuentes para los siete huesos pendientes de BodyParts3D

Investigación de sólo lectura, 14 de septiembre de 2026. No se modificó el proyecto MED3D ni se colocaron mallas en el esqueleto.

## Cóccix: fuente HRA verificada y descargada

- Archivo local: `hra-pelvis-male-v1.3.glb`, 1 348 340 bytes; SHA-256 `5bfd2c34b62a7224796d50002bcdf9ded60ea11485a118351dfd1f19c6853e77`.
- Original: https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/assets/3d-vh-m-pelvis.glb
- Metadatos institucionales: https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/metadata.json
- Autoras: Kristen Browne y Heidi Schlehlein. HuBMAP / Human Reference Atlas, datos Visible Human Male de la National Library of Medicine. Revisora consignada: Muzlifah A. Haniffa.
- Versión del asset: v1.3, 2024-06-15. DOI https://doi.org/10.48539/HBM384.SBWX.873
- Licencia del asset: CC BY 4.0, verificada en `was_derived_from.license` de metadata.json.
- Nodo original `VH_M_coccyx`, malla 1, 422 vértices; padre `VH_M_pelvis`, sin transformación local en ninguno de estos dos nodos.
- Etiqueta ontológica publicada: `UBERON:0001350`, coccyx. Archivo https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/assets/crosswalk.csv descargado.
- AABB de posiciones: min[-0.00554418564,0.01124464,-0.11215394], max[0.0116152382,0.0308184847,-0.08895875]. glTF usa metros; extensión aproximada17.2×19.6×23.2mm. Mantener escena/marco original al extraer.
- Modificaciones del original: ninguna. Se extrajo además `hra-coccyx-male-v1.3-native-frame.glb` conservando el nodo rotulado por HRA; se eliminaron otros nodos y recursos no referenciados. Verificación exacta de las 422 posiciones antes/después: idénticas. No se aplicó transformación espacial, simplificación ni segmentación adicional.
- Existe equivalente female en `pelvis-female/v1.3/assets/3d-vh-f-pelvis.glb`, pero no se descargó ni se propone mezclarlo.
- Importante: la carpeta de ccf-releases `v1.3/models/VH_M_Pelvis.glb` corresponde a un asset antiguo v1.2; no mezclar la versión del release con la versión del asset. El archivo de provenance v1.2 guardado es historial de investigación, no el crédito del asset descargado v1.3.

## Huesecillos del oído: fuente OpenEar v2 verificada

- Registro oficial abierto https://zenodo.org/records/1473724, v2, 2019-01-08; DOI https://doi.org/10.5281/zenodo.1473724.
- API institucional guardada `openear-record-v2.json`; licencia de los datos `metadata.license.id = cc-by-4.0`.
- Autores: Daniel Manuel Sieber, Peter Erfurt, Samuel John, Gabriel Ribeiro dos Santos, Daniel Schurzig, Mads Sølvsten Sørensen y Thomas Lenarz. Instituciones: MED-EL, Medizinische Hochschule Hannover, Hoersys, Rigshospitalet/University of Copenhagen.
- Artículo metodológico: https://doi.org/10.1038/sdata.2018.297. XML abierto descargado de Europe PMC: https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6326113/fullTextXML
- Ocho especímenes con PLY individuales de malleus/incus/stapes. Segmentados de CBCT, con superficies suavizadas y optimizadas por los autores; el propio artículo describe resolución CBCT125µm y aproximadamente70vértices/mm². No asumir que son mallas crudas sin posprocesamiento.
- El registro v1 `1342658` está restringido; **v2 `1473724` sí es abierto**. No se accedió a archivos restringidos.
- ZIP oficial usado: https://zenodo.org/records/1473724/files/ZETA.zip (3 868 308 936 bytes, MD5 publicado66fc062426086d2757e837593fd548e5).
- Sólo se descargaron el directorio ZIP y los rangos de tres PLY; se verificaron tamaños y CRC32 del directorio. No se descargó tomografía completa ni se accedió a datos personales adicionales.

| Archivo local | Miembro original ZIP | Bytes | SHA-256 |
|---|---|---:|---|
| openear-zeta-03_Malleus.ply | 07_3D_Models/03_Malleus.ply | 76148 | 52e00f6afe6946e8adf6e2514acbf072950e62dac4d39ca8edc0d87b2ffb1cc2 |
| openear-zeta-04_Incus.ply | 07_3D_Models/04_Incus.ply | 76148 | f967dd6b0fc5f195fe76a3605f8a5acfaf522c62667d0acf194637574c2049ee |
| openear-zeta-05_Stapes.ply | 07_3D_Models/05_Stapes.ply | 42161 | 91da300f4245514218410d33a371be2470e53b30c4197001ebf9879988bb3364 |

Los PLY conservan su disposición mutua en el marco del espécimen. No incluyen declaración de unidad en su encabezado; el origen documentado 3D Slicer y los tamaños físicos sugieren milímetros, pero debe contrastarse con los volúmenes/transformaciones antes de integrar. No normalizar cada hueso por separado.

La carpeta DICOM del espécimen ZETA lleva `DICOM_rechts_20150826`, indicio de lado derecho, pero no se ha verificado una asignación bilateral completa ni un registro al sujeto BodyParts3D. No crear seis huesos contabilizando automáticamente un reflejo como un segundo espécimen. Las otras siete carpetas oficiales incluyen los tres PLY, pero sus nombres no explicitan de forma suficiente la lateralidad para concluirla en esta auditoría.

## Segundo espécimen candidato: EPSILON

Se extrajeron además los tres PLY del espécimen EPSILON del mismo registro OpenEar v2 y la misma licencia CC BY4.0. Los miembros son `07_3D_Models/Incus.ply`, `07_3D_Models/Malleus.ply` y `07_3D_Models/Stapes.ply` en https://zenodo.org/records/1473724/files/EPSILON.zip . Todos los tamaños y CRC32 fueron verificados. Estos tres archivos constituyen **un segundo espécimen candidato**, cuya lateralidad aún no se ha validado; no deben asignarse automáticamente a la izquierda para completar una lista bilateral.

| Archivo local | Bytes | SHA-256 |
|---|---:|---|
| openear-epsilon-Incus.ply | 76148 | 4c62d640b60336d291665bb1fa40d969378541390c41b803f70add8f9398c582 |
| openear-epsilon-Malleus.ply | 162028 | 5403a47d58b79fb7e74205e662f24b9ad1ce7dfc0be698833b06867951dcdc73 |
| openear-epsilon-Stapes.ply | 42161 | e87a08d32ae99029ac29799d409d68c1d51c570560b9a2605960446f07881109 |

Así quedan preparados siete archivos candidatos: un cóccix y dos juegos de tres huesecillos. Esto **no significa que se hayan cerrado las siete posiciones anatómicas faltantes**: faltan la comprobación de lateralidad y el registro anatómico de los dos juegos al cuerpo.

## Viabilidad de inspección en un marco separado

Los tres huesecillos de cada espécimen conservan sus coordenadas relativas originales. Se pueden cargar juntos en una escena propia, con selección por nombre de miembro, sin alterar su colocación. ZETA suma5000 vértices y9992 triángulos; EPSILON suma7260 vértices y14512 triángulos. El cóccix HRA tiene422 vértices y su extracción conserva el marco de la pelvis original. Son recursos pequeños y adecuados para una escena de inspección; su viabilidad de carga no equivale a validación de posición dentro del sujeto BodyParts3D.

Se inspeccionó también **sólo el encabezado** del volumen `05_Registred_Slicer_Volumes/CBCT_Unembedded.nrrd` de ZETA, mediante rangoHTTP del ZIP. Declara `space: left-posterior-superior`, `space directions: (-0.125,0,0) (0,-0.125,0) (0,0,0.125)` y un origen propio. El espaciado 0.125, relacionado con la resolución CBCT 125µm publicada, sustenta la interpretación de milímetros; los PLY no declaran por sí mismos la unidad. Las direcciones LPS no establecen la lateralidad del espécimen ni constituyen registro al cuerpo BodyParts3D. El encabezado quedó guardado como `openear-zeta-nrrd-header.txt`.

## Plan de alineación y aceptación anatómica

1. Mantener originales, hashes, topología y relaciones intrínsecas de cada espécimen. Resolver lateralidad con referencias del volumen y revisión de anatomía del oído; si se utiliza un espejo como representación contralateral, registrarlo expresamente como adaptación y someterlo a revisión, sin presentarlo como un segundo hueso escaneado.
2. Fijar por fuente las unidades y ejes, dejando en un manifiesto la matriz de conversión y su inversa. La conversión debe preservar las proporciones; no usar escala distinta por eje ni centrar cada huesecillo independientemente.
3. Registrar el cóccix utilizando el conjunto HRA pelvis/sacro como contexto y referencias homólogas del sacro BodyParts3D. Para los huesecillos, usar el temporal de su propio espécimen como contexto y referencias homólogas del temporal del atlas. No ajustar sólo por caja envolvente ni por centroide. Conservar la transformación de todo el grupo auditivo como unidad.
4. Un registro rígido basado en puntos anatómicos documentados puede generar un candidato. Cualquier ajuste por tamaño de distintos donantes debe justificarse y quedar explícito. ICP u otra optimización geométrica pueden ayudar a medir ajuste, pero por sí solos no prueban correspondencia anatómica ni autorizan deformar el hueso.
5. Revisar con anatomista los puntos y orientación, lateralidad, proporciones, límites, contacto/articulación y posibles intersecciones, comparando vistas anatómicas y el contexto original. Registrar los puntos, matriz 4×4, método, versión, errores medidos, capturas de revisión, revisor y fecha. No se ha fijado una tolerancia clínica inventada.
6. Sólo tras esa revisión añadir las siete posiciones al manifiesto público, sus relaciones y fichas; volver a verificar selección, aislamiento, árbol, explosión acotada y restauración. Antes de ese paso, el atlas conserva la cobertura real de BodyParts3D y declara la ausencia de estos huesos.

## Decisión de integración honesta

Las fuentes aportan cóccix y huesecillos reales, con licencias compatibles y procedencia institucional verificable. **Todavía no aportan un cuerpo único registrado de206huesos**. Los donantes y marcos de coordenadas difieren de BodyParts3D. La opción inmediata científicamente honesta es mantener estos candidatos fuera del cuerpo combinado o mostrarlos en un módulo complementario con procedencia clara; la superposición requiere registro basado en referencias anatómicas y revisión del encaje. No se hizo registro arbitrario, corte de geometría para inventar límites ni anatomía generativa.

## Fuentes descartadas o pendientes

- BodyParts3D4.3: endpoint oficial devuelve ZIP de FMA2Obj, pero no se verificó incorporación de cóccix ni de los tres tipos de huesecillos; otro agente contrastó esos IDs y no los encontró.
- Z-Anatomy: la licencia global no demuestra la de oído; contiene créditos a recurso Dundee con restricciónNC. No usarlo para cerrar el conteo sin revisar asset concreto.
- Western University, estudio Bartling2021, DOI10.1111/joa.13457: publicaciónCC BY-NC-ND; no se confirmó licencia separada compatible de las mallas.
- RODBUK DOI10.57903/UJ/5ALG57: metadataCC BY4.0, pero archivos de microCT restringidos con embargo hasta2027-12-05. No acceder.
- Elon/EricBauer sacrum+coccyx enSketchfab: acceso403, licencia/segmentación noverificadas; no usar para suplir el assetHRA ya comprobado.
