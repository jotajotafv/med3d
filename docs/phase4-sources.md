> **Estado vigente — integración:** la autorización posterior permite terminar con cobertura parcial. Se conserva debajo la investigación y sus pausas como historial; las sustituye la decisión de [entrega](phase4-delivery.md). BP3D 4.0 en el cuerpo; HRA independiente.

# Fase 4 — fuentes inspeccionadas antes de la pausa

Fecha: 27 septiembre 2026. [Preauditoría](phase4-audit.md). No se incorpora una nueva fuente.

## BodyParts3D 4.0 OBJ99 / DBCLS

Se reutilizan las seis tablas oficiales preservadas en `research/anatomy/torso-metadata.zip` y su directorio del archivo `isa_BP3D_4.0_obj_99.zip`. [Descargas oficiales](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), [metadatos 2013-06-19](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/), [licencia oficial](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Las páginas de descarga y licencia se consultaron de nuevo; CC BY 4.0 vigente desde 27 febrero 2025. Se mantienen las cabeceras históricas sin sobrescribirlas.

Atribución: BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

Registro corporal exigido: `bodyparts3d-4.0-male`, `(x,y,z) → (x,z,-y)/1000`. No se aplicó aún ninguna conversión nueva. La trazabilidad y los hashes históricos ya fijados están en [fuentes de Fase 2](phase2-sources.md) y los manifiestos previos; no se recalcularon todos los hashes históricos. Las asociaciones FMA/FJ concretas y tamaños se guardan en [JSON](phase4/preaudit.json).

## Encéfalo HRA/HuBMAP existente

Archivo: `public/models/brain.glb`. Fuente registrada: [Allen_M_Brain.glb, VH_Male/v1.2](https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/main/VH_Male/v1.2/Allen_M_Brain.glb). [Biblioteca HRA/HuBMAP](https://github.com/hubmapconsortium/ccf-3d-reference-object-library). Licencia conservada CC BY 4.0, atribución HRA/HuBMAP y datos Visible Human/Allen según [registro existente](model-licenses.md). La consulta web directa a la página del binario GitHub no se pudo resolver; se inspeccionó el GLB y la procedencia ya preservados localmente.

Original registrado: 11.977.312 bytes; SHA-256 `2b9ad5b53e40e9f0936da74f7be38d2eed15604e26358c3870a0ea13499b9a35`. Ese original no se volvió a descargar ni revalidar.

GLB local: 3.496.140 bytes, **283 mallas, 286 nodos y 656.268 triángulos** según índices del GLB. SHA-256 comprobado específicamente para esta inspección: `ecda8d7886b75241c36eefebf7796ec5ed38cd4495c8eb96e50595ee733c52e6`, coincide con `public/models/manifest.json`.

Raíz `Allen_brain`, grupos hemisféricos y nombres originales de nodos conservados; inventario de IDs en el JSON de preauditoría y `src/features/anatomy/model-index.ts`. Metadatos de ejemplo: `anatomical_structure_of=#VHMAllenBrain`, `source_spatial_entity=#VHMaleOrgans`, identificadores UBERON. La procedencia no demuestra equivalencia con el sujeto corporal BP3D.

El GLB existente usa Meshopt y cuantización. `AnatomyScene.tsx` aplica matrices globales de cada nodo a la geometría; luego centra el grupo cargado y lo escala por `3.45/maxExtent`. Esa transformación es una presentación para navegación, **no un registro anatómico HRA→BodyParts3D**. No se encontró en la documentación/código revisados una matriz de correspondencia validada entre esos marcos.

Decisión: conservar íntegro el explorador independiente `?organ=brain`. No extraer sus regiones ni superponerlas al cuerpo para suplir carencias. Tiene regiones corticales/profundas; los metadatos originales presentan términos ausentes, identificadores repetidos e inconsistencias nominales documentadas. No se declara validación clínica.


## Fuente efectivamente integrada

Sólo **BodyParts3D 4.0 OBJ99 / DBCLS** en el cuerpo; no hay superposición de otra fuente. HRA, corazón y pulmones mantienen sus modelos y rutas previos. Se preservan las cabeceras antiguas CC BY-SA 2.1 Japan, documentando la declaración actual CC BY 4.0 del editor.

Extracción por rangos HTTP exactos: 6602620 bytes transferidos, 87 OBJ, sin descargar todo el archivo. ZIP preservado: 6386640 bytes; SHA-256 `5db3c69127251179e50aa6e738ca4b926c39c923ba6b8000eb3c3de2b014ce48`. Cada miembro tiene tamaño, CRC, hash, FMA, FJ y representación.

Educación: [OpenStax, SNC](https://openstax.org/books/anatomy-and-physiology-2e/pages/13-2-the-central-nervous-system), [Purves, asociación cortical](https://www.ncbi.nlm.nih.gov/books/NBK10952/), [Anatomy of the Orbit](https://pmc.ncbi.nlm.nih.gov/articles/PMC7561454/), [III, IV y VI](https://pmc.ncbi.nlm.nih.gov/articles/PMC2801485/). Resúmenes editoriales breves; no se copian imágenes ni geometría de estas publicaciones.
