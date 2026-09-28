# Fase 6 — registro y conservación geométrica

Marco `bodyparts3d-4.0-male`; metros, +X izquierda, +Y superior, +Z anterior. Para todas las piezas: **`(x,y,z) → (x,z,-y)/1000`**. Sin recentrado, escala por pieza, reflexión, deformación ni movimiento a ojo. La normalización global del visor sigue siendo sólo presentación.

Se comprobó el marco nativo de 4.3 mediante la tráquea FJ6588 de la revisión pulmonar 20140325 frente a FJ2541/4.0. Distancia de todos los vértices a los triángulos de la revisión contraria: medianas 0,00713/0,00705 mm, p95 0,11433/0,11983 mm, máximos 0,28042/0,56278 mm; diferencia máxima entre bounds 0,15450 mm. El remallado explica que la distancia a vértices aislados sea mayor y no se use como error superficial. **Transformación adicional: identidad; no se ajustó ningún parámetro.** Lateralidad comprobada en las 18 piezas y posición revisada con huesos/corazón. Este control respalda la compatibilidad de marco, no certifica cada superficie ni precisión clínica. [Informe reproducible](../public/models/anatomy/respiratory/respiratory-registration.json), [script](../scripts/anatomy/verify-respiratory-registration.py).

| Módulo | Mallas | Triángulos | Bytes GLB | SHA-256 |
|---|---:|---:|---:|---|
| respiratory:larynx | 9 | 9642 | 107936 | `e21096d61dacf35876679f7c113bd661a08dd1477999e298b0e081cb5bcca88e` |
| respiratory:airway | 101 | 66466 | 733700 | `028685f7a5d7ebe905325067662f2d0234147574a502d26a74b596cee8430191` |
| respiratory:lungs | 18 | 136376 | 1488376 | `8587aac2e22bc25a349e9785223dc684692a7d49a2ac32d6a24fc071b52edaf7` |

Total: **128 mallas, 212484 triángulos, 2330012 bytes**, 147508 vértices decodificados, 3930048 bytes de accessors. Float32 en posiciones; normales a 12 bits y Meshopt. Sin decimación adicional.

Comparación independiente OBJ original en doble precisión → GLB decodificado: todos los triángulos, orientaciones, multiplicidades y posiciones usadas conservados. Error máximo `6.006865020937111e-08` m; bounds `5.9280395481309256e-08` m. Es error numérico de conversión, separado del control entre versiones y de la exactitud anatómica. [Informe](../public/models/anatomy/respiratory/respiratory-validation.json).

Khronos valida los tres GLB comprimidos y decodificados con **0 errores y 0 advertencias**. [Evidencia](phase6/gltf-validation.json). Cada original conserva hash, tamaño, FMA/FJ, lateralidad, vértices, caras/triángulos y bounds. No se reconstruyeron activos históricos.
