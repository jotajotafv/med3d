# Fase 3DE — registro y conservación

Base: `5ba794438287a16b6482c6a63d3d2b6ca8ee6542`. Integración geométrica: `7ce40479e469b2d846bffae24be2aed5c30b7b98`; código final con corrección de etiquetas: `93bbbd7349f9c5cb66213211d7df52dd1ecc3f6d`. Se reutiliza el marco `bodyparts3d-4.0-male` y exactamente `(x,y,z) → (x,z,−y)/1000`.

La fuente es [BodyParts3D 4.0 OBJ99 / DBCLS](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip). Se reutilizan las tablas preservadas en 3B y se extraen por HTTP Range únicamente los 20 FJ aprobados. Transferencia registrada: 2.327.333 bytes, incluido el directorio ZIP; no se descarga ni se vuelve a hashear todo el archivo remoto. Los OBJ originales suman 7.145.196 bytes y se conservan en un ZIP de 2.138.368 bytes.

| Artefacto nuevo | SHA-256 |
|---|---|
| Selección regional | `4845c8eaed44d16e41546918b5b143708fe6eb327a1b35e8c667d65d9df5f92d` |
| ZIP de originales | `bd00cd75b66bd9757063bfd106cc487c61a1f9d5934a557d333df1e08ba92b44` |
| muscular-neck.glb | `08b8635109dc69d4de32cd5a93f8eb3fc0861466708c65aeb98058ebaef1223a` |

[Selección](../research/anatomy/head-neck-selection.json), [registro de extracción](../research/anatomy/muscular-head-neck-source-lock.json), [manifiesto por OBJ](../public/models/anatomy/muscular/head-neck-source-manifest.json) y [validación geométrica](../public/models/anatomy/muscular/head-neck-validation.json) conservan identidad FMA/FJ/BP, lado, hash, tamaño, vértices, triángulos y bounds. Se verificaron las cabeceras originales de versión 4.0. `FJ1545M` es un archivo izquierdo suministrado por la fuente: MED3D no refleja el músculo derecho.

Un módulo `muscular:neck` agrupa 20 músculos/mallas de diez familias bilaterales y seis divisiones: superficial, lateral, prevertebral, posterior, suprahioidea e infrahioidea. Su tamaño permite selección individual y descarga regional sin fragmentarlo en 20 GLB.

| Magnitud nueva | Valor |
|---|---:|
| GLB final | 1.003.996 bytes |
| Mallas / triángulos | 20 / 101.700 |
| Vértices decodificados | 62.802 |
| Accessors decodificados | 1.740.636 bytes |
| Buffers propios de geometría en Three.js | 1.866.240 bytes |
| Error máximo de posición | 5,9971293 × 10⁻⁸ m |
| Error máximo de bounds | 5,9547424 × 10⁻⁸ m |
| Tolerancia numérica de conservación | 0,00005 m = 0,05 mm |

Float32 para posiciones, Meshopt sin pérdida de posiciones y normales de visualización de 12 bits. No hay decimación adicional, normalización, recentrado, registro, escalado por pieza ni deformación. Se comparan los OBJ transformados con el GLB decodificado: se conserva cada triángulo orientado, su multiplicidad y cada posición usada. La tolerancia mide conservación numérica, no exactitud clínica.

El validador glTF informa cero errores y advertencias tanto en el nuevo archivo comprimido como en su versión decodificada. El comprimido tiene dos avisos informativos (extensión Meshopt no soportada por ese validador y buffer fallback no usado); la decodificación independiente resuelve esa limitación. [Resultado](phase3de/results/gltf-validation.json).

Los 20 GLB previos no cambian y no se reconstruyen ni optimizan. Los 175 IDs musculares previos y las 45 familias educativas previas se conservan; sólo el nodo raíz muscular amplía/reordena sus hijos para situar Cuello antes de Tronco y miembros. La nueva suite verifica esta preservación contra la base, sin repetir las auditorías históricas. [Registro 3C](phase3c-registration.md).

La atribución DBCLS se mantiene. Se conserva literalmente la licencia histórica de las cabeceras OBJ y se enlaza la [declaración actual de licencia del proveedor](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html); no se borran las cabeceras originales.
