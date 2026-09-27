# Fase 4 — registro y geometría

Marco **bodyparts3d-4.0-male**, metros; +X izquierda, +Y superior, +Z anterior.

```text
(x,y,z) -> (x,z,-y)/1000
[ 0.001  0      0      0 ]
[ 0      0      0.001  0 ]
[ 0     -0.001  0      0 ]
[ 0      0      0      1 ]
```

Transformación única común, sin registro entre fuentes, recentrado por pieza, reflexión ni deformación. La normalización del visor se aplica al cuerpo completo como presentación. Posiciones Float32, Meshopt y normales a 12 bits; sin decimación adicional.

| Módulo | Mallas | Triángulos | Bytes GLB | Bytes accessors |
|---|---:|---:|---:|---:|
| nervous:cns | 57 | 282842 | 2600372 | 4561644 |
| nervous:cranial | 30 | 34832 | 332748 | 561396 |

Total **87 mallas, 317.674 triángulos, 2.933.120 bytes GLB**, 178.722 vértices decodificados y 5123040 bytes de accessors. Los buffers del renderer se contabilizan aparte.

Comparación independiente OBJ doble precisión → GLB decodificado: se preservan todas las posiciones usadas, caras, multiplicidades y orientaciones. Error máximo **6.00541066033e-08 m** (6.00541066e-05 mm); error máximo de bounds **5.95855713659e-08 m**. Tolerancia numérica 0,05 mm; no es exactitud anatómica ni validación clínica. Cabeceras originales y lateralidad verificadas, sin fabricar lados.

Khronos: ambos GLB comprimidos y decodificados, **0 errores y 0 advertencias**. [Informe geométrico](../public/models/anatomy/nervous/nervous-validation.json), [manifiesto](../public/models/anatomy/nervous/nervous-source-manifest.json), [glTF](phase4/gltf-validation.json).

HRA medular: transformación, landmarks pareados y error **no establecidos**, por eso no integrado. FJ4426/4.3: identificación/marco insuficientes. No se calculó un ajuste visual ficticio.
