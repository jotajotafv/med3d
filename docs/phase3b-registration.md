# Fase 3B — fuente, registro y conservación geométrica

Código local: `5c6b6e32aca61ebee8ae14f418a5c32c2eaf686a`, basado en `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. Verificación final: 23 de septiembre de 2026. La [auditoría previa](phase3b-audit.md) se conserva como decisión anterior a la extracción; no es un informe de validación geométrica.

## Procedencia y extracción acotada

Se usa exclusivamente BodyParts3D 4.0 OBJ99 / DBCLS, distribución de 2013-06-19. El [ZIP oficial](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip) mide 142.903.898 bytes. Se verificaron respuestas HTTP 206, Content-Range, tamaño, CRC y SHA-256; sólo se extrajeron los 34 OBJ aprobados. El directorio central contiene 2.234 entradas; su intervalo comienza en 142.733.851 y ocupa 170.025 bytes. No se recalculó un hash del ZIP oficial completo ni se procesaron todos los candidatos musculares.

Los 34 originales suman 39.400.123 bytes; sus datos comprimidos en origen, 11.649.145 bytes. La extracción transfirió 11.820.190 bytes incluyendo directorio y cabeceras. Los originales se conservaron sin modificar en un ZIP local de 11.540.485 bytes. No se creó un lado reflejando el otro. Las cabeceras de cada OBJ confirman versión 4.0, FMA, FJ y representación BP.

| Evidencia | SHA-256 |
| --- | --- |
| [ZIP de originales](../research/anatomy/muscular-torso-originals.zip) | `5759ce2cb62c36f21d7a221b77f053794c053a256a80a5999091f3e1581b2c74` |
| [ZIP de seis tablas y directorio](../research/anatomy/torso-metadata.zip) | `dfd3f6b7e7adab5590b164b58c1c4d9518752e18875f6e5feca21920b82d31ce` |
| Directorio central oficial | `edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b` |
| [Selección canónica UTF-8/LF](../research/anatomy/torso-selection.json) | `9c14ae07f508cae314ba2c6f69b414c56239214d5d28e43a1eab01dce419e801` |

El [bloqueo de fuente](../research/anatomy/muscular-torso-source-lock.json) conserva rangos, CRC, tamaño y hash por OBJ. También conserva `selectionSha256AtExtraction`: la serialización inicial de Windows era CRLF (`ab1c7b7db6ba511377ca2a2feb7e96f49cc077241e9047b0860313d201641628`). La normalización posterior a LF no cambió el JSON interpretado ni un binding; se documenta esa transición sin atribuir el hash nuevo a los bytes usados inicialmente.

La [declaración del publicador](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) es CC BY 4.0. Se mantienen las cabeceras históricas CC BY-SA 2.1 Japan en los originales y la atribución existente. Las restricciones de interpretación de BP3D documentadas en [Fase 3A](phase3-model-sources.md) siguen aplicando: atlas masculino adulto modelado, variación individual no representada y ninguna certificación clínica. Higgsfield no se utilizó para generar anatomía ni para publicar el producto.

## Transformación compartida

Se mantiene exactamente `(x,y,z) → (x,z,−y)/1000`, con traslación nula:

```text
[[0.001, 0,      0,     0],
 [0,     0,      0.001, 0],
 [0,    -0.001,  0,     0],
 [0,     0,      0,     1]]
```

El marco permanece `bodyparts3d-4.0-male`, tomado del esqueleto completo. La presentación común conserva `s=3.45/max(extensiones del marco,0.001)` y traslación `−s×centro`; la cadena es `G×T`. No se centra, escala, rota ni ajusta una pieza individualmente. Tampoco se normaliza según los módulos activos. Los offsets del despiece son una presentación adicional; al 0 % se recupera exactamente el reposo.

El [manifiesto](../public/models/anatomy/muscular/torso-source-manifest.json) enlaza original → FMA/FJ/lado → nodo → módulo y conserva límites originales en milímetros y transformados en metros. `additionalRegistration` es `none`.

## Resultado de conversión

| Módulo | Unidades | Mallas | Triángulos | GLB bytes | Accessors decodificados bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| `muscular:thorax-anterior` | 8 | 12 | 141.632 | 1.372.520 | 2.446.140 |
| `muscular:abdomen` | 2 | 2 | 223.652 | 1.971.408 | 3.642.312 |
| `muscular:back` | 16 | 20 | 158.592 | 1.862.216 | 3.061.044 |
| Nuevo torso | **26** | **34** | **523.876** | **5.206.144** | **9.149.496** |

Hay 333.680 vértices GLB, que incluyen separaciones necesarias para normales; no equivalen a posiciones únicas OBJ. Los tres GLB sin compresión sumaban 11.177.976 bytes. Se conserva el proceso de Fase 3A: posiciones Float32, normales de visualización a 12 bits y `EXT_meshopt_compression` con `KHR_mesh_quantization`. No se aplica simplificación adicional.

| GLB | SHA-256 |
| --- | --- |
| `muscular-torso-anterior.glb` | `0d2938cfcb5d651f97155e4ea4d5d69399e4bf584e99f4321f9a2b95e388356b` |
| `muscular-abdomen.glb` | `f290f3617effb101f91b9d293361e67075d8a2d38c30e05eedfe738c1b3b78cd` |
| `muscular-torso-posterior.glb` | `149b481048540bd5af3d2d436c904917259304cc702d2e9d0fc44d19ccc25ba5` |

El verificador vuelve a leer coordenadas OBJ en doble precisión y decodifica los GLB finales. Coteja todas las posiciones usadas y el multiconjunto de triángulos orientados, incluidas sus repeticiones. Conserva los **523.876 triángulos** y la identidad de las 34 mallas. Con tolerancia fijada de 0,05 mm, el máximo error numérico es **6,017167617049×10⁻⁸ m** (0,0000601717 mm); el máximo error de límites es **5,874633779434646×10⁻⁸ m**. Resultados individuales: [torso-validation.json](../public/models/anatomy/muscular/torso-validation.json).

Los cinco GLB musculares, comprimidos y decodificados, tienen cero errores y cero advertencias de glTF Validator. Los comprimidos producen dos mensajes informativos por archivo porque el validador no implementa Meshopt; se cubre esa limitación validando también la representación decodificada. Véase [informe final](phase3b/results/gltf-validation.json).

La reconstrucción offline a un directorio independiente reprodujo exactamente catálogo, manifiesto, validación y los tres GLB: [comparación de seis archivos](phase3b/results/reproduction.json). El hash final del manifiesto es `f77ccd8cce08219039cba2933ce27b908084fb58d70e6fe01afc50311fe78219`. La igualdad numérica acredita conservación técnica, no precisión anatómica, contactos, huellas de inserción ni ausencia de penetraciones.

## Reproducción

Con Python 3.12 y Node 24, reutilizar los ZIP preservados; no se requiere descarga. Instalar las herramientas fijadas en `.cache/anatomy-tools`: `@gltf-transform/core`, `extensions` y `functions` 4.5.0, `meshoptimizer` 1.2.0 y `gltf-validator` 2.0.0-dev.3.10. `ANATOMY_PYTHON` permite indicar el ejecutable Python. Crear un directorio de salida y copiar allí `catalog.json` del catálogo muscular actual o de Fase 3A antes de construir. El constructor retiene únicamente la cohorte piloto y vuelve a añadir la selección aprobada.

```sh
python scripts/anatomy/audit-torso-inventory.py
python scripts/anatomy/build-muscular-torso.py --output .cache/phase3b/rebuild
node scripts/anatomy/optimize-muscular-torso.mjs --output .cache/phase3b/rebuild
node scripts/anatomy/optimize-muscular-torso.mjs --verify-only
node scripts/anatomy/optimize-muscular-pilot.mjs --verify-only
node scripts/anatomy/validate-muscular-gltf.mjs
```

No se debe ejecutar el optimizador otra vez sobre archivos ya cuantizados sin `--verify-only`; el script rechaza ese caso. Una invocación de reanudación usó por error `--verify`, fue rechazada antes de escribir y se repitió con la opción correcta. Los generadores escriben UTF-8/LF para mantener hashes estables entre plataformas; la igualdad completa se verificó en Windows, sin afirmar una ejecución adicional en Linux.
