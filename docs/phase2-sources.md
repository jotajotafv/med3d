# MED3D · Fuentes anatómicas para la fase 2

Revisión: 2026-09-14. Documento de investigación y adquisición; no certificación clínica.

## Fuente seleccionada: BodyParts3D 4.0

- Organización: Database Center for Life Science (DBCLS), Research Organization of Information and Systems. Creador: Kousaku Okubo.
- Descripción oficial: modelo anatómico de un varón adulto y diccionario de conceptos anatómicos enlazados a geometrías.
- Archivo oficial fijado: https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip
- Versión: 4.0; archivo publicado 2013-06-19. Mallas reducidas al 99 % según la denominación oficial; no se aplicó simplificación adicional durante la adquisición.
- SHA-256 del ZIP original (142903898 bytes): `40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e`.
- Descripción: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html
- Descargas: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html
- Historial: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/update.html
- Publicación científica: https://doi.org/10.1093/nar/gkn613

## Licencia y trazabilidad

La licencia oficial vigente cambió el 2025-02-27 a CC BY 4.0 Internacional: https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html . Su texto fue conservado en `bp3d-v4/source-license.html`. El README oficial confirma el mismo cambio. Los OBJ archivados conservan cabeceras antiguas CC BY-SA 2.1 Japan; esta discrepancia histórica debe registrarse, sin borrar las cabeceras originales ni atribuir la licencia antigua a la concesión actual.

Atribución indicada por el proveedor:

BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.

Para los GLB derivados: conservar fuente, versión, URL de licencia, cambios realizados, hashes de entrada/salida y atribución. El registro de transformaciones debe indicar exportación OBJ→GLB, rotación global, conversión de unidades, materiales y Meshopt. Esta licencia de los datos no establece por sí misma una licencia para el código independiente de MED3D.

## Metadatos oficiales descargados

Todos desde `https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/`:

- `isa_parts_list_e.txt`: FMA ID, representación y nombre inglés.
- `isa_element_parts.txt`: composición FMA→identificadores FJ de las mallas atómicas.
- `isa_inclusion_relation_list.txt`: relaciones IS-A.
- `partof_parts_list_e.txt`, `partof_element_parts.txt`, `partof_inclusion_relation_list.txt`: equivalentes PART-OF.
- `README_e.html`: documentación de campos, límites y licencia.

IS-A no equivale a PART-OF. El árbol de estudio de MED3D debe distinguir la taxonomía editorial de regiones/sistemas de las relaciones FMA originales. Los conceptos compuestos no tienen necesariamente un OBJ propio; corresponden a conjuntos de elementos.

## Adquisición realizada y cobertura exacta

Higgsfield sandbox descargó los datos públicos oficiales, inspeccionó vértices/caras/bounding boxes y exportó el subconjunto. No se generó anatomía.

Selección: todos los elementos de FMA5018 (bone organ, 203 archivos) más FMA7485 (sternum, 3 archivos adicionales). Total de entrada: 206 OBJ, 513646 triángulos. Copia local: `bp3d-v4/`; registros por archivo: `source-provenance.json`.

La cifra 206 NO representa 206 huesos. Auditoría de contenido:

- 197 conceptos de huesos convencionales con una malla única.
- Hioides: FJ2772 y FJ3201 contienen exactamente los mismos registros v/vn/f; eliminar una copia y conservar el alias de origen.
- Esternón: 3 componentes fuente, considerados un hueso en el recuento adulto convencional.
- 4 sesamoideos accesorios de los pies.
- Tras deduplicar el hioides: 205 mallas únicas y 512450 triángulos; 199 de los 206 huesos del recuento convencional, más 4 sesamoideos accesorios. Son 203 huesos semánticos; los 3 componentes del esternón pueden seguir siendo seleccionables.
- Faltan modelos identificados de cóccix y seis huesecillos del oído. No se deben simular, duplicar ni contar como presentes. Un sistema certificado completo exige cerrar estos siete faltantes con datos válidos y registro espacial verificable.

El manifiesto oficial 4.3 también se consultó desde `https://lifesciencedb.jp/bp3d/get-info.cgi?version=4.3&cmd=concept-objfiles-list`. Su cabecera confirma Objects set 4.3 / FMA3.0; no incluye FMA20229 (cóccix), FMA52751, FMA52752 ni FMA52753 (clases de huesecillos). No hay motivo verificado para sustituir el corpus 4.0 por 4.3 para resolver esos faltantes.

## Marco espacial

El visor oficial expresa las coordenadas en milímetros. Inspección de datos: fémur izquierdo FJ3259 tiene X positivo (31.9662 a150.237); fémur derecho FJ3365 tiene X negativo (-150.134 a-31.8943). Z aumenta hacia la cabeza. Y aumenta hacia posterior. Conversión recomendada a Three.js: `(x,z,-y)/1000`, con una única matriz aplicada a todo el sistema. No recentrar cada órgano independientemente ni espejar modelos para inventar lados.

Las notas oficiales 4.0 advierten que las versiones mayores pueden cambiar la coordinación espacial y que no se deben combinar sin validación: https://lifesciencedb.jp/bp3d/info_en/userGuide/releaseNotes/release-4.0.html . Los órganos HRA existentes de MED3D pueden conservar sus exploradores; su superposición corporal con BodyParts3D necesita registro explícito y evaluación, no normalización por caja envolvente.

## Alternativas evaluadas

Z-Anatomy es una adaptación organizada según TA2 de BodyParts3D con modelos adicionales. Repositorio primario: https://github.com/Z-Anatomy/Models-of-human-anatomy ; depósito: https://zenodo.org/records/4953712 . Su licencia general es CC BY-SA 4.0, pero `License.txt` enumera componentes de terceros con NC (oído interno y riñón). No basta con la licencia general para importar todo el archivo como si fuera homogéneo. Auditar origen y licencia de cada malla adicional antes de reutilizarla.

La adquisición de los siete huesos faltantes se está investigando de forma independiente; no forman parte del subconjunto descrito aquí. No expandir otros sistemas ni declarar un atlas corporal completo basándose en este estado.
