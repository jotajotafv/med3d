# Fase 2.1: registro del cóccix y los huesecillos auditivos

Fecha: 14 de septiembre de 2026. Base del proyecto: `97c289d`.

**Resultado: los siete huesos continúan pendientes de integración.** Se avanzó en la comprobación del marco original de los dos especímenes OpenEar y se registraron las matrices originales del cóccix. No se colocó, escaló, reflejó, deformó ni añadió ninguna de estas mallas al cuerpo BodyParts3D. La cobertura publicada sigue siendo 199 huesos convencionales y cuatro sesamoideos accesorios.

Esta decisión responde a la falta de correspondencias anatómicas verificadas entre donantes. No se establece una aprobación administrativa o humana obligatoria inventada: el criterio pendiente es demostrar el registro anatómico con evidencia suficiente. El encargo permite conservar los elementos pendientes si esa evidencia falta.

## Evidencia reproducible

- [`openear_headers.py`](../scripts/anatomy/registration-research/openear_headers.py): lectura por rangos de los ZIP oficiales; inspecciona encabezados NRRD, parámetros H5 y únicamente campos DICOM espaciales/de lateralidad. Rechaza descargar el ZIP entero si el servidor ignora `Range`.
- [`openear-headers-2026-09-14.jsonl`](../scripts/anatomy/registration-research/openear-headers-2026-09-14.jsonl): resultados de esa inspección ejecutada en **Higgsfield**, con miembros originales, CRC32 y SHA-256 de las diez transformaciones H5. Se leyeron 1.237 MB de ZETA y 1.242 MB de EPSILON; no las tomografías completas de varios GB.
- [`verify_candidates.py`](../scripts/anatomy/registration-research/verify_candidates.py): comprueba los seis PLY originales contra el encabezado de su propia segmentación y registra las matrices del GLB HRA. No registra modelos entre sujetos.
- [`candidate-matrices-2026-09-14.json`](../scripts/anatomy/registration-research/candidate-matrices-2026-09-14.json): hashes de los originales, matrices 4×4, unidades, mediciones y campos de registro pendientes explícitamente `null`.

La inspección de Higgsfield fue numérica sobre datos científicos originales. No se usaron generación de imágenes, generación de anatomía ni geometría del catálogo 3D Jutsu sin procedencia. No se exportaron código de MED3D ni capturas privadas a otro servicio.

## Cóccix: marco HRA preservado, registro al cuerpo pendiente

Fuente: [HRA / HuBMAP, Pelvis Male v1.3](https://doi.org/10.48539/HBM384.SBWX.873), Kristen Browne y Heidi Schlehlein; datos Visible Human Male de la National Library of Medicine. Asset de 15 de junio de 2024, licencia **CC BY 4.0** según [metadatos oficiales](https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/metadata.json). La fecha de 2026 que aparece en el contenedor de metadatos corresponde al procesamiento del grafo, no a una nueva versión anatómica del asset.

Original conservado sin modificar en la investigación: `hra-pelvis-male-v1.3.glb`; [descarga exacta](https://cdn.humanatlas.io/digital-objects/ref-organ/pelvis-male/v1.3/assets/3d-vh-m-pelvis.glb). Tamaño 1 348 340 bytes; SHA-256 `5bfd2c34b62a7224796d50002bcdf9ded60ea11485a118351dfd1f19c6853e77`.

El nodo `VH_M_coccyx`, identificado como `UBERON:0001350`, conserva 422 vértices dentro de `VH_M_pelvis`. El contexto original incluye el sacro y pubis, ilion e isquion bilaterales. Se comprobó que ni el padre ni el cóccix declaran una transformación local adicional. Por tanto:

| Campo | Resultado comprobado |
|---|---|
| Matriz local original | Identidad 4×4 |
| Matriz del padre original | Identidad 4×4 |
| Matriz mundial original | Identidad 4×4 |
| Unidades / eje superior | Metros / Y, según glTF 2.0 |
| Conversión de formato para conservar la escena glTF | Identidad 4×4 |
| Escala original | `[1, 1, 1]` |
| Rotación original, cuaternión XYZW | `[0, 0, 0, 1]` |
| Traslación original | `[0, 0, 0]` |
| Matriz final hacia BodyParts3D | **No determinada** |
| Escala, rotación y traslación hacia BodyParts3D | **No determinadas** |
| Modificaciones en Fase 2.1 | Ninguna |

Las unidades y la interpretación de matrices proceden de la [especificación glTF](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units). Compartir formato, metros y eje superior **no establece una posición anatómica común**. HRA y BodyParts3D corresponden a sujetos y orígenes distintos.

El sacro objetivo es `bp3d:FMA16202` / `bp3d_FMA16202_FJ3393`. Su marco BodyParts3D ya tiene la conversión única documentada `(x, y, z) → (x, z, −y) / 1000`. Los originales inspeccionados no aportan pares de puntos homólogos etiquetados entre el sacro HRA y ese sacro. No se asignaron puntos tomando mínimos/máximos de la malla ni se sustituyó la superficie sacrococcígea por un centroide.

Para obtener una transformación justificable faltan correspondencias explícitas de referencias homólogas del sacro —por ejemplo extremos identificados de la superficie sacrococcígea, referencias bilaterales de las superficies auriculares y el promontorio— y comprobación de su identificación en ambas fuentes. Estos son objetivos de identificación, **no puntos ya medidos ni garantizados por las mallas**. La comprobación debe incluir referencias independientes en pelvis, proporciones, orientación y relación sacrococcígea; un error ICP pequeño por sí solo no prueba homología. No se ejecutó ICP con un inicio arbitrario ni se fabricó una matriz final.

## OpenEar: unidades y marco de los PLY

Fuente: [OpenEar v2, Zenodo 1473724](https://zenodo.org/records/1473724), publicado el 8 de enero de 2019, **CC BY 4.0**. Autores: Daniel Manuel Sieber, Peter Erfurt, Samuel John, Gabriel Ribeiro dos Santos, Daniel Schurzig, Mads Sølvsten Sørensen y Thomas Lenarz. El [artículo metodológico](https://doi.org/10.1038/sdata.2018.297) describe reconstrucción, registro de modalidades, segmentación y posterior suavizado/optimización de las superficies. No se presentan los PLY como mallas crudas.

Se encontró una distinción que impedía asumir la documentación actual del software:

| Fuente original | ZETA | EPSILON |
|---|---|---|
| Segmentación `06_Segmentation/Segmentation.seg.nrrd` | RAS (`right-anterior-superior`) | RAS (`right-anterior-superior`) |
| CBCT registrado | LPS (`left-posterior-superior`) | LPS (`left-posterior-superior`) |
| Paso de la segmentación | 0.125 en los tres ejes | 0.125 en los tres ejes |
| DICOM sin incluir | Espaciado 0.250 mm | Espaciado 0.250 mm |
| DICOM incluido en resina | Espaciado 0.125 mm | Espaciado 0.125 mm |
| PLY: unidad o sistema explícito en encabezado | No | No |

La [guía oficial de migración de Slicer](https://www.slicer.org/wiki/Documentation/Nightly/Developers/Tutorials/MigrationGuide/Slicer#Slicer_5.0:_Models_are_saved_in_LPS_coordinate_system_by_default) sitúa el cambio de exportación predeterminada de mallas de RAS a LPS en el 26 de febrero de 2020. OpenEar v2 es anterior. Los encabezados actuales de Slicer no bastaban para inferir estos archivos antiguos.

Se compararon los extremos de las coordenadas **sin modificar** de cada PLY con los extremos de centros de vóxel declarados para ese mismo hueso en su segmentación original. Esto es una comprobación de marco/unidades dentro de la misma fuente, **no un método de colocación por bounding box**. La coordenada original PLY concuerda con el marco RAS de su segmentación; interpretar erróneamente esos números como LPS desplaza los extremos entre 42.8 y 52.8 mm.

| Espécimen / hueso | Diferencia máxima de extremos PLY–segmentación (mm) | Expresada en vóxeles de 0.125 mm |
|---|---:|---:|
| ZETA / martillo | 0.065825 | 0.527 |
| ZETA / yunque | 0.097781 | 0.782 |
| ZETA / estribo | 0.061497 | 0.492 |
| EPSILON / martillo | 0.407463 | 3.260 |
| EPSILON / yunque | 0.113081 | 0.905 |
| EPSILON / estribo | 0.079053 | 0.632 |

El martillo EPSILON difiere más que un vóxel. No se corrigió, no se ocultó ese resultado y no se impuso un umbral anatómico inventado para darlo por aprobado. El suavizado publicado puede explicar diferencias de superficie, pero no se demostró que sea la causa concreta de esta diferencia. Debe revisarse contra la segmentación completa si se utiliza este espécimen.

La concordancia de números, las unidades DICOM y el paso de 125 µm publicado sustentan **milímetros** y **RAS de la segmentación** para las coordenadas PLY. Las tres mallas conservan su disposición mutua original; no se centró ni escaló cada huesecillo.

### Matrices originales y conversiones

Convención del registro JSON: matrices almacenadas por filas y vectores columna. La dimensión de lista de segmentos del NRRD 4D no es un eje espacial.

```text
IJK → RAS mm, ZETA:
[[0.125, 0,     0,     -17.306900024414102],
 [0,     0.125, 0,      -7.370230197906490],
 [0,     0,     0.125,  -0.110730051994320],
 [0,     0,     0,       1]]

IJK → RAS mm, EPSILON:
[[0.125, 0,     0,      -9.513299942016600],
 [0,     0.125, 0,     -14.679500579833999],
 [0,     0,     0.125,  -1.409930229187010],
 [0,     0,     0,       1]]

Conversión RAS ↔ LPS:
[[-1, 0, 0, 0],
 [ 0,-1, 0, 0],
 [ 0, 0, 1, 0],
 [ 0, 0, 0, 1]]

Conversión de unidades/base únicamente hacia X izquierdo, Y superior, Z anterior:
[[-0.001, 0,     0,     0],
 [ 0,     0,     0.001, 0],
 [ 0,     0.001, 0,     0],
 [ 0,     0,     0,     1]]
```

La última matriz no se aplicó. Conserva proporciones, cambia milímetros a metros y tiene determinante positivo; no produce un oído contralateral. **No registra la pose del espécimen dentro del temporal BodyParts3D.** Una etiqueta RAS describe el sistema de coordenadas del volumen y no demuestra que el temporal aislado se escaneara en la misma pose que el cuerpo entero.

Los diez H5 originales contienen transformaciones entre modalidades, no entre OpenEar y BodyParts3D. Sus parámetros exactos y hashes constan en el JSONL. Ambos `FlipXY.h5` contienen `diag(-1,-1,1,1)`. No debe reaplicarse sin conocer la cadena: los volúmenes y PLY finales ya están en su marco registrado. La [documentación de Slicer sobre transformaciones ITK](https://slicer.readthedocs.io/en/latest/developer_guide/script_repository.html#convert-between-itk-and-slicer-linear-transforms) distingue la transformación de remuestreo LPS de la transformación de modelado RAS; por eso no se trataron esos parámetros como una matriz de colocación lista para glTF.

## Lateralidad: qué se confirmó y qué falta

ZETA contiene tres carpetas oficiales `DICOM_rechts_20150826_X/Y/Z`. `rechts` es la indicación textual de derecha. Es evidencia del nombre publicado de la adquisición, **no una validación completa de lateralidad y orientación en el cuerpo**. EPSILON no incluye una indicación equivalente en los nombres de carpetas inspeccionados.

En ambos especímenes se inspeccionaron tres primeras imágenes DICOM de los planos X/Y/Z de la adquisición sin incluir en resina y una de la adquisición incluida. El campo DICOM `Laterality` está vacío e `ImageLaterality` no está presente. `ImageOrientationPatient` e `ImagePositionPatient` sí existen, pero describen la geometría del escáner y no rellenan la lateralidad que falta. No se consultaron ni publicaron datos identificativos del donante.

La investigación web encontró productos derivados etiquetados como Zeta-derecho y Epsilon-izquierdo. Al no ser metadatos primarios de adquisición, **no se usaron para asignar lateralidad definitiva**. La publicación principal no proporciona una tabla de lateralidad de los ocho especímenes.

Los destinos del atlas son `bp3d:FMA52738` (temporal derecho) y `bp3d:FMA52739` (temporal izquierdo). No existen en la evidencia inspeccionada pares de puntos homólogos ya etiquetados y medidos que registren el temporal de cada espécimen con esos temporales. Tampoco se midió el ajuste de la platina del estribo a la ventana oval ni la relación del martillo con la membrana timpánica después de un registro al atlas. Se necesita identificar dichas referencias y preservar el juego completo durante una única transformación por espécimen. No se aplicó reflexión ni se declaró EPSILON como izquierdo por descarte.

## Estado para la entrega

| Elemento | Fuente disponible | Estado de incorporación |
|---|---|---|
| Cóccix | HRA male pelvis v1.3, CC BY 4.0 | Pendiente: registro verificable sacro/pelvis entre donantes |
| Martillo, yunque y estribo derechos | OpenEar ZETA v2, CC BY 4.0; nombre de adquisición indica derecha | Pendientes: corroboración anatómica de lado/pose y registro con temporal derecho |
| Martillo, yunque y estribo izquierdos | OpenEar EPSILON v2, CC BY 4.0, candidato sin lateralidad primaria resuelta | Pendientes: lateralidad y registro; revisar además diferencia del martillo respecto a la segmentación |

Se conservaron las mallas originales y sus hashes de la investigación previa. Se añadió evidencia técnica y scripts de comprobación, no nuevos modelos públicos. La matriz final, escala, rotación y traslación al cuerpo permanecen `null` para impedir que una identidad de formato sea confundida con un registro anatómico terminado.
