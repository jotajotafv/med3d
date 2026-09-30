# Fase 8 · registro y conservación

Marco inalterado: `bodyparts3d-4.0-male`. Transformación única **(x,y,z) → (x,z,-y)/1000**, metros, Y superior. Sin recentrado, ajuste por órgano, reflejos ni deformación.

Los 25 originales 4.0 pertenecen al marco histórico. Para las siete incorporaciones 4.3 se compararon tráquea FJ2541 y cartílago tiroides FJ2808 con los originales respiratorios 4.0: **15.540 registros de vértices, normales y caras idénticos**. Se preservan los hashes de ambos originales en el [informe de registro](../public/models/anatomy/internal/internal-registration.json). Los controles no se vuelven a integrar.

Validación independiente contra coordenadas OBJ en doble precisión: todos los triángulos orientados, incluidas repeticiones, y cada posición usada se conservan. Posiciones Float32, normales de 12 bits y Meshopt; sin decimación adicional. Error máximo **5.98353750134e-08 m**, error máximo de bounds **5.88226318765e-08 m**. Tolerancia numérica 0,05 mm, no precisión clínica. Los cinco GLB comprimidos y sus versiones decodificadas tienen cero errores y advertencias glTF.

| Módulo | Mallas | Triángulos | Bytes GLB | SHA-256 |
|---|---:|---:|---:|---|
| `urinary:organs` | 6 | 9944 | 94872 | `2b979002421ee0944b5f2ac38808f6069c2a8254c8ad441ac5240108db9568ce` |
| `endocrine:glands` | 4 | 8034 | 69408 | `20562f7af6ffa3b227e3eeb7505d3e14f9acf459878fe1d465f82725844c6023` |
| `endocrine:thyroid43` | 7 | 12132 | 398320 | `0039073eb7daeb40a541253997f11ea732663de69a875475efce853e7a803ed7` |
| `lymphatic:central` | 3 | 3410 | 35160 | `c20c719b1ed5382dfbbc5c2c3093918273dc27e2e2b6a20f1b34002d88945f35` |
| `reproductive:male` | 12 | 7184 | 93996 | `7528921142734fc887db51d130fa2be7bb7f05a7e6bc6bf8c19c737dc4379019` |

Total: 32 mallas, 40704 triángulos, 51229 vértices decodificados y 1166346 bytes de datos de accessors decodificados; GLB 691756 bytes. El navegador contabiliza 1268804 bytes en sus buffers geométricos: son asignaciones en ejecución, una magnitud distinta del tamaño de datos de los accessors y del archivo comprimido.

El [manifiesto](../public/models/anatomy/internal/internal-source-manifest.json) conserva FMA/FJ/BP, lado, versión, bytes, SHA-256, vértices fuente, caras, triángulos y bounds por OBJ. SHA-256 del ZIP original: `c71b7e73ed54bb08fe0a1334d396b431081727582c424556d542a8c09cafee8d` (1267071 bytes). [Comparación geométrica](../public/models/anatomy/internal/internal-validation.json).

Reproducción incremental: `python scripts/anatomy/build-internal.py` y `node scripts/anatomy/optimize-internal.mjs`; requiere dependencias existentes en `.cache/anatomy-tools`. `--fetch` realiza la extracción selectiva; sin él utiliza los originales fijados. `ANATOMY_PYTHON` puede señalar al intérprete instalado. Para comprobar sin reconstruir: `optimize-internal.mjs --verify-only`, `verify-internal-registration.py` y `validate-internal-gltf.mjs`. Ningún builder nuevo reconstruye activos históricos.

Los bounds y centroides laterales son controles de ingeniería. Se conservan solapes, costuras, superficies y variaciones del cuerpo fuente; no hay validación clínica ni continuidad fabricada.
