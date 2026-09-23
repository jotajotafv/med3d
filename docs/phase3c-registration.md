# Fase 3C — fuente, registro y geometría

Código local: `eb84c2d206b0bda73bfa5112d9f7943ab3985126`. Base exacta: `1d58140bec7cdf946f3400d461a218756799bbc5`. La [auditoría previa](phase3c-audit.md) fijó la selección antes de descargar OBJ.

## Fuente y extracción

Se usó exclusivamente [BodyParts3D 4.0 OBJ99 / DBCLS](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip). El ZIP remoto tiene 142.903.898 bytes y 2.234 entradas. Se reutilizaron las seis tablas y el directorio central de Fase 3B sin modificarlos. Cada petición exige HTTP 206, Content-Range y tamaño exactos; cada miembro exige CRC, versión 4.0, FMA, FJ y representación BP concordantes. No se descargó el ZIP completo ni se recalculó su hash global.

Se extrajeron únicamente los 54 elementos aprobados: 13,208,272 bytes OBJ originales, 4,110,766 bytes comprimidos en origen y 4,282,411 bytes transferidos en 109 rangos, incluyendo directorio y cabeceras. El ZIP local conserva los originales sin alterar y ocupa 4,088,305 bytes.

| Evidencia | SHA-256 |
|---|---|
| [Selección](../research/anatomy/limbs-selection.json) | `67b6b1fc3a525d22c0ee8bef6a317eee0fcf65bf6581580519d86adf73f1228c` |
| [Originales](../research/anatomy/muscular-limbs-originals.zip) | `ffc90ccfe0ae6b3d12e87fa556417b259801d7191ec2dc5014c83ce80522defb` |
| [Metadatos reutilizados](../research/anatomy/torso-metadata.zip) | `dfd3f6b7e7adab5590b164b58c1c4d9518752e18875f6e5feca21920b82d31ce` |
| Directorio central | `edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b` |

El [bloqueo de fuente](../research/anatomy/muscular-limbs-source-lock.json) enumera cada rango, CRC, hash y tamaño. El [manifiesto](../public/models/anatomy/muscular/limbs-source-manifest.json) añade por pieza: vértices originales/usados, caras, triángulos, bounds en milímetros/metros, lateralidad, clasificación BP3D, nodo y módulo. Los textos se fijaron en UTF-8/LF antes de extraer; `selectionSha256` es el hash de los bytes usados en la extracción.

Se conserva la atribución y declaración CC BY 4.0 del [publicador](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), junto con las cabeceras históricas CC BY-SA 2.1 Japan de los OBJ. No se generó geometría con Higgsfield ni se mezclaron fuentes anatómicas. Las fuentes universitarias se usaron sólo para curación y educación.

## Marco y transformación

Marco: `bodyparts3d-4.0-male`, metros, Y superior y Z anterior. Transformación exacta compartida:

```text
(x,y,z) → (x,z,−y)/1000
[[0.001, 0,      0,     0],
 [0,     0,      0.001, 0],
 [0,    -0.001,  0,     0],
 [0,     0,      0,     1]]
```

No hay registro adicional, traslación local, normalización por región, escala por pieza, reflexión, ajuste manual, deformación ni decimación. Cada lado proviene de su OBJ identificado. La escala de presentación global del visor sigue usando el marco óseo completo; activar módulos no cambia el marco corporal.

## Módulos y conservación

Ocho módulos: glúteos, muslo, pierna y antebrazo por lado. Conservan selección individual y permiten carga/descarga regional. Son 48 músculos en 24 familias, 54 mallas y 179,956 triángulos. El cuádriceps es un grupo de cuatro músculos; las cabezas de bíceps femoral, gastrocnemio y pronador redondo no incrementan el recuento de músculos.

| Módulo | Mallas | Triángulos | GLB bytes | SHA-256 |
|---|---:|---:|---:|---|
| `muscular:gluteal-right` | 4 | 11194 | 134776 | `be87371801af26c861945e687dc2380b28c04854eb5f578b6a8886db1b3d18a9` |
| `muscular:gluteal-left` | 4 | 11194 | 134860 | `14f83ce22f7f1cdeee39d408208bd80e24ea21976cb6ee9aacb5f354b58b7277` |
| `muscular:thigh-right` | 11 | 44582 | 446544 | `ce1dd0e234da9c4453f4c00742635593c1aaeb9fa8f88a6e7e8ffd8b81b4377d` |
| `muscular:thigh-left` | 11 | 44582 | 446536 | `133cbefa198db25c986ff82b23a63b973deefacc3d7fe21a8a6c8ab26d493806` |
| `muscular:leg-right` | 7 | 24584 | 291172 | `5cdd6f97d812b603c9423e381bc2de58f64d9edfa473381a54be57b3cfdaafb2` |
| `muscular:leg-left` | 7 | 24584 | 291188 | `0ecaddb994e38fca93c77105a8b0551a30f9fc88c7d52414c536d606cf90c6f3` |
| `muscular:forearm-right` | 5 | 9618 | 113968 | `cac92857c59bb202f6161ba83531e061f8922c8790b8c2d83807916b8aa4c7be` |
| `muscular:forearm-left` | 5 | 9618 | 114312 | `77d25ab61c3a3308f1a2dd5bc0d923378d631ace49b7cc0a52a1c41365560aec` |

Total: 1,973,356 bytes GLB y 3,304,230 bytes de accessors decodificados. Estos últimos no son memoria VRAM ni el total de buffers que Three.js asigna al cargar.

Posiciones Float32 y Meshopt; sólo las normales de visualización se cuantizan a 12 bits. El [informe geométrico](../public/models/anatomy/muscular/limbs-validation.json) compara posiciones globales decodificadas contra coordenadas OBJ en doble precisión, transforma una sola vez y contrasta todos los triángulos orientados, incluyendo multiplicidades. También exige conservar todas las posiciones originales utilizadas.

Tolerancia: **0,05 mm** de conversión numérica, no exactitud clínica. Error máximo medido: **0.000060050 mm**; error máximo de bounds: **0.000054703 mm**. Los 179.956 triángulos originales se conservan. Los ocho GLB reconstruidos y los tres JSON generados coincidieron byte por byte en una reconstrucción separada; ver [reproducción](phase3c/results/reproduction.json).

## Reproducir sin afectar cohortes anteriores

```sh
python scripts/anatomy/audit-limbs-inventory.py
python scripts/anatomy/build-muscular-limbs.py
node scripts/anatomy/optimize-muscular-limbs.mjs
node scripts/anatomy/optimize-muscular-limbs.mjs --verify-only
npm run verify:anatomy
```

Los originales ya están preservados. `--fetch` sólo es necesario para repetir la extracción remota y comprueba la selección fijada. Para una reconstrucción de comprobación se copió el catálogo a un directorio temporal y se usó `--output` en conversor y optimizador; los módulos anteriores permanecieron intactos. No ejecutar los antiguos constructores 3A/3B sobre el catálogo ampliado: sus cohortes históricas se verifican con `--verify-only` y pruebas de regresión.

Las herramientas conservan las versiones fijadas de Fase 3B: glTF Transform 4.5.0 y meshoptimizer 1.2.0. `ANATOMY_PYTHON` permite seleccionar el intérprete; no se cambiaron dependencias de la aplicación.

## Preservación y límites

Los 12 GLB previos, sus metadatos y el catálogo óseo se conservan. Los 87 nodos musculares anteriores mantienen sus IDs; sólo crecen los ancestros `muscular` y `muscular:region:arm-right/left` en bounds, módulos e hijos, y los dos últimos se nombran miembro superior. No se duplica ningún elemento de 3A/3B. Las fichas anteriores se comparan contra la base y permanecen iguales.

Cuádriceps: la clase original `zone of muscle organ` se conserva en el manifiesto. La representación como cuatro músculos bajo un grupo editorial se fundamenta en fuentes educativas, no en transformar IS-A en PART-OF. La tabla PART-OF inspeccionada no respalda por sí sola estos padres.

El atlas es un ejemplar masculino modelado con cobertura parcial. No se añadieron intrínsecos de mano/pie, cabeza, cara, cuello profundo, cóccix ni huesecillos auditivos. La conservación geométrica no certifica anatomía clínica ni variación individual.

La captura del contexto del gastrocnemio muestra que sus mallas de cabeza terminan antes del calcáneo y no incluyen una continuidad tendinosa completa hasta él. Es una limitación de la representación seleccionada: no se completó, estiró ni reposicionó la fuente. Las relaciones músculo-hueso de las fichas no equivalen a landmarks de fijación validados en estas superficies.
