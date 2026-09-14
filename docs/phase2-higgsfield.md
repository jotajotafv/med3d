# Higgsfield: papel verificable en MED3D, fase 2

Fecha de revisión: 2026-09-14. Revisión de contratos de las herramientas disponibles y comprobación de ejecutables en el sandbox de Higgsfield. No se creó ningún proyecto ni se importó anatomía del catálogo.

## Conclusión

Higgsfield aportó adquisición e inspección real de la geometría pública BodyParts3D mediante su sandbox general. La conversión modular y las verificaciones del GLB se realizaron localmente. El trabajador Blender de **3D Jutsu** ofrece edición e inspección reales, pero la versión del conector disponible no permite importar nuestros propios archivos BodyParts3D/Z-Anatomy: `scene_builder_3d_import_asset` acepta exclusivamente identificadores del catálogo. No debemos prometer que los GLB propios pasaron por ese trabajador ni sortear su restricción con red o bytes incrustados en Python.

## Capacidades y límites confirmados

| Recurso | Capacidad | Límite relevante para MED3D |
|---|---|---|
| `scene_builder_3d_query_python` | Inspección de objetos, dimensiones, transformaciones, padres, colecciones, materiales y escenas; render temporal | Opera sobre una escena ya admitida. Prohíbe descargar modelos o insertar sus bytes desde Python. |
| `scene_builder_3d_run_python` | Blender 5.2; nombres semánticos, jerarquías, materiales PBR, geometría compartida, escena editable; exportación comprometida a GLB y Blend | Requiere proyecto, revisión y secuencia inspeccionados; importación de modelos únicamente con `import_asset`. |
| `scene_builder_3d_search_assets` | Búsqueda de catálogo GLB | Exige proyecto autorizado. La respuesta solo declara `assetId`, `name`, `tags` e `importArguments`: no entrega fuente, autor, licencia ni versión que permitan aprobar un asset anatómico. No demuestra rigor científico. |
| `scene_builder_3d_import_asset` | Importación de un asset confirmado del catálogo | No admite identificadores de adjuntos ni URL propias. No existe ruta anunciada para nuestro conjunto anatómico externo. |
| `scene_builder_3d_get_glb` / `get_blend` | Descarga de una revisión existente | La descarga no acredita integridad anatómica ni calidad visual; necesita comparación y revisión. |
| `higgsfield_sandbox_exec` | Python, NumPy, Node/npm/npx y acceso de red para procesamiento de archivos | En la comprobación actual no están instalados Blender/bpy, gltf-transform/gltfpack, trimesh ni pygltflib. Su disco es efímero: un resultado debe exportarse antes de terminar la operación. |

Comprobación real del sandbox: Node **20.9.0**, npm **10.1.0**, Python y NumPy disponibles. `which blender`, `gltf-transform`, `gltfpack` no devolvieron ejecutables; la consulta de módulos no encontró `bpy`, `trimesh` ni `pygltflib`.

## Uso real en la prueba ósea

El paso de adquisición descargó en el sandbox Higgsfield el [archivo oficial BodyParts3D 4.0 OBJ99](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip), comprobó su SHA-256 e inspeccionó vértices, caras y límites espaciales de los OBJ. Seleccionó los elementos de FMA5018 y los componentes FMA7485. Exportó únicamente el subconjunto anatómico y sus metadatos públicos. El registro de origen está incorporado en [source-manifest.json](../public/models/anatomy/skeletal/source-manifest.json).

El ZIP oficial contiene 142.903.898 bytes; SHA-256 `40665852c49f218326590e204db91064a1ecfc3c6f8cbd7bbbcaac62c7cd409e`. El subconjunto de entrada contiene 206 OBJ y 513.646 triángulos. FJ2772 y FJ3201 duplican exactamente los registros v/vn/f del hioides; la deduplicación conserva 205 mallas y 512.450 triángulos. No se generaron huesos ni se completaron ausencias con primitivas.

El pipeline local exportó siete GLB con glTF Transform 4.5.0 y Meshoptimizer 1.2.0, posiciones de 16 bits y normales de 12 bits. No aplicó simplificación adicional. Se mantuvo el marco común `(x,z,-y)/1000`, conservando cada malla y sus identificadores FMA/FJ. No se recentró cada hueso o módulo por separado. El resultado comprimido está documentado en [validation.json](../public/models/anatomy/skeletal/validation.json).

## Inspección independiente de los GLB finales

La auditoría adicional se ejecutó **localmente**, leyendo los bloques JSON de los siete GLB y cruzándolos con el catálogo y el manifiesto de procedencia. Sus resultados y hashes de archivo están en [phase2-glb-metadata-audit.json](phase2-glb-metadata-audit.json).

| Módulo | Mallas | Triángulos | Bytes GLB |
|---|---:|---:|---:|
| Miembro superior izquierdo | 32 | 44.808 | 345.860 |
| Miembro superior derecho | 32 | 42.330 | 336.004 |
| Miembro inferior izquierdo | 33 | 24.312 | 230.240 |
| Miembro inferior derecho | 33 | 23.748 | 230.668 |
| Cráneo e hioides | 23 | 128.290 | 1.002.700 |
| Columna | 25 | 70.086 | 579.828 |
| Caja torácica | 27 | 178.876 | 1.191.640 |
| **Total** | **205** | **512.450** | **3.916.940** |

Comprobaciones aprobadas:

- 205 nombres de malla e identificadores anatómicos únicos; coincidencia exacta con el catálogo y con los FMA/FJ de origen.
- 249 nodos de catálogo con referencias padre/hijo y relaciones existentes.
- Recuentos de triángulos sin cambios respecto a cada OBJ de entrada después de deduplicar el hioides.
- Un material PBR compartido por módulo, sin texturas ni dependencias de buffers externos.
- `EXT_meshopt_compression` y `KHR_mesh_quantization` requeridos en todos los módulos.
- Límites espaciales calculados con los accessors normalizados y las matrices de nodo completas; desviación máxima de caja frente al origen de **0,000002784 m**, aproximadamente **2,784 µm**.

La cifra de error compara cajas envolventes, no distancias de superficie vértice a vértice, precisión del dato médico o rendimiento de renderizado. Esta inspección de metadatos no vuelve a decodificar los buffers Meshopt ni constituye validación visual o clínica. Las 205 mallas tampoco equivalen a un esqueleto convencional completo: faltan cóccix identificable y seis huesecillos auditivos; el recuento representado es 199 huesos convencionales más cuatro sesamoideos accesorios, con tres componentes seleccionables del esternón.

La revisión automática rechazó repetir esta auditoría en el sandbox remoto al considerar el envío de metadatos del proyecto una divulgación sensible sin aprobación específica. No se reintentó por otra vía. Se completó la comprobación local y se mantuvo como evidencia Higgsfield únicamente la adquisición e inspección de los OBJ públicos que sí se había ejecutado.

No se creó una escena vacía de 3D Jutsu ni se adoptó anatomía de un catálogo sin procedencia demostrada. Si aparece una ruta autorizada para archivos propios, se podrán trasladar jerarquías, pivotes y revisión visual a Blender sin cambiar el contrato del atlas.

## Registro y evidencia

Fuentes de esta revisión: contratos anunciados por las herramientas Higgsfield citadas, comprobación de ejecutables con `higgsfield_sandbox_exec`, registro de adquisición BodyParts3D, manifiesto del pipeline y auditoría local independiente. No se verificó ningún asset anatómico del catálogo, no se evaluó su licencia y no se realizó una conversión en Blender.
