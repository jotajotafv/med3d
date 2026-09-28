# Fase 7 — registro y conservación

Todos los activos integrados pertenecen a **BodyParts3D 4.0 OBJ99**. Marco `bodyparts3d-4.0-male`; transformación exacta **`(x,y,z) → (x,z,-y)/1000`**, metros, +X izquierda, +Y superior, +Z anterior. **Sin registro adicional** ni transformación por órgano. Se comprueba versión/FMA/FJ/hash por original, encaje en el marco corporal y lateralidad de las cuatro glándulas. [Informe](../public/models/anatomy/digestive/digestive-registration.json), [verificador](../scripts/anatomy/verify-digestive-registration.py).

| Módulo | Mallas | Triángulos | Bytes GLB | SHA-256 |
|---|---:|---:|---:|---|
| digestive:upper | 6 | 2032 | 26860 | `decd0605b0b7892b64e21f37991e5f11d92a8112a4f2c6e72e44354f2ed6d9e9` |
| digestive:stomach-accessory | 29 | 144220 | 1261644 | `1ffb7b60c78f61c5cdbb51bb87301f8900107a27c69abb86b6e40cc4d3045c5b` |
| digestive:small-intestine | 56 | 16058 | 212852 | `e27bcba591179f84d43b68d702b3b783e9c8c89bfa4d958148607a86d945a055` |
| digestive:large-intestine | 5 | 14930 | 139840 | `e4543eccffef09b22955c5ed4d234888734f20465006532cc6b89f68aa6f37bd` |

Total: **96 mallas, 177240 triángulos, 1641196 bytes GLB**, 99494 vértices decodificados y 2854332 bytes de accessors. Posiciones Float32; normales a 12 bits; Meshopt. Los ocho componentes geométricos del hígado tienen un único owner anatómico; cada malla retiene su FMA/FJ original en nombre/extras/manifiesto.

La comparación independiente desde las posiciones OBJ de doble precisión conserva **todos los triángulos, su orientación, multiplicidad y posiciones usadas**. Máximo error posicional **6.007136616829016e-08 m**; máximo error de bounds **5.9280395481309256e-08 m**. [Validación numérica](../public/models/anatomy/digestive/digestive-validation.json). Khronos: **0 errores y 0 advertencias** en los cuatro GLB comprimidos y sus representaciones decodificadas. [Evidencia](phase7/gltf-validation.json).

La revisión visual evalúa ubicación/orientación/escala con huesos y órganos existentes. Se conservan costuras, huecos y solapes de segmentación; no se rellenan conexiones. La fidelidad de conversión y pertenencia al mismo marco **no constituyen validación clínica**. 4.3 sólo se auditó: no se incorporó otra geometría ni licencia al módulo.

Reproducción local: `python scripts/anatomy/audit-digestive.py`, `python scripts/anatomy/build-digestive.py` usando los originales fijados, `node scripts/anatomy/optimize-digestive.mjs`, `python scripts/anatomy/verify-digestive-registration.py`, `node scripts/anatomy/validate-digestive-gltf.mjs`. `--fetch` vuelve a obtener únicamente la selección aprobada. No reconstruir módulos históricos.
