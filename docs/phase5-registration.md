# Fase 5: geometría y registro

Se reutiliza exactamente el frame **`bodyparts3d-4.0-male`**, en metros y con Y superior. Todos los OBJ cardiovasculares son 4.0 y sus conceptos nativos de cabecera coinciden con los FMA seleccionados. No se mezcló una segunda fuente cardiovascular.

```text
(x, y, z) → (x, z, -y) / 1000

 0.001   0       0       0
 0       0       0.001   0
 0      -0.001   0       0
 0       0       0       1
```

No hay ajuste de landmarks, RMS de registro, transformación regional adicional ni escala individual: esos valores son **no aplicables**, no cero clínico. Se conserva el marco nativo compartido; la normalización global del visor es sólo presentación. Las matrices Z-Anatomy históricas no se modifican ni se reutilizan para estos vasos.

La [validación geométrica](../public/models/anatomy/cardiovascular/cardiovascular-validation.json) compara cada GLB decodificado contra su OBJ original con un parser independiente. Conserva triángulos orientados y multiplicidad, vértices utilizados, bounds y propietario FMA/FJ. Resultado: **162 mallas, 685.016 triángulos, 359.568 vértices decodificados**. Posiciones Float32, sin cuantización de posiciones ni decimación adicional; normales a 12 bits y Meshopt.

Error máximo de posición: **6,02076435869605 × 10⁻⁸ m**. Error máximo de bounds: **5,958557136587217 × 10⁻⁸ m**. Son errores numéricos de conversión, no estimaciones de precisión anatómica o clínica. Los arrays decodificados suman 10.582.320 bytes; el uso real del renderer se mide por separado.

[Comprobación complementaria](phase5/supplemental-geometry.json): 162 geometrías originales distintas, ningún duplicado exacto; 62 estructuras laterales de cabeza/cuello y extremidades con centro de bounds en el hemicuerpo esperado. Los bounds de corazón y vasos centrales no se usan para deducir lados anatómicos. Se conservan los lados de fuente, sin reflejar geometría.

[Khronos](phase5/gltf-validation.json): siete GLB comprimidos y sus siete decodificaciones con **0 errores y 0 advertencias**. Los mensajes informativos del formato comprimido no se ocultan. Originales, hashes, tamaños, vértices, caras/triángulos y bounds por archivo se conservan en el manifest.

La red sigue segmentada como en la fuente. La inspección visual comprueba orientación, escala y coherencia educativa, sin afirmar circulación continua, ausencia exhaustiva de intersecciones ni validación clínica. No se fabricaron tubos, secciones o puntos de conexión.
