# Fase 9 · registro y conservación geométrica

**Marco nativo `bodyparts3d-4.0-male`; transformación exacta `(x,y,z) → (x,z,-y)/1000`.** Ninguna matriz adicional, recentrado, escala por pieza, deformación, ajuste manual o decimación. Meshopt con posiciones Float32 y normales a 12 bits. Sólo se convirtió el OBJ aprobado.

| Medida nueva | Valor |
|---|---:|
| Unidades / componentes anatómicos / mallas / módulos | 1 / 0 / 1 / 1 |
| Vértices originales y GLB | 102467 |
| Caras triangulares / triángulos | 203382 / 203382 |
| Bytes OBJ / ZIP de conservación / GLB | 14465502 / 4093976 / 1631504 |
| Bytes de accessors decodificados | 4284990 |
| Error euclídeo máximo de posición | 6.085485393543343e-8 m |
| Error máximo de bounds | 4.447937018703385e-8 m |
| Error RMS de posición | 2.3359957899241466e-8 m |

La comparación usa las coordenadas OBJ en doble precisión transformadas una vez contra las posiciones mundiales del GLB decodificado. Se preservan todos los triángulos orientados, multiplicidades y posiciones utilizadas. Tolerancia de ingeniería 0,05 mm; el error medido es numérico y no mide precisión clínica. [Validación de conservación](../public/models/anatomy/integumentary/integumentary-validation.json).

| SHA-256 | Valor |
|---|---|
| FJ2810.obj | `682f402206f15592acdeaae8ffb6b34c3e5c3267fa4685e63d2e4920ef2a80e0` |
| ZIP original conservado | `b23458588ae7faf2942fddfa0a49de7fabd3c538bf12e01182a983688f46d6ab` |
| skin.glb | `4e5b104ea12608250387f9a25c45d6d1b3ad0f2b02f9cf5bc05a9f4c3722035c` |
| Selección aprobada | `39416375b68a0e2737c20a4a6f817d34ccc25fef74f931851d05c3bfa14fd919` |

Bounds de piel en metros: `[-0.334119,-0.0781112,-0.0452476]` a `[0.332825,1.64136,0.246783]`. Bounds de referencia ósea: `[-0.323914,-0.0704799,-0.018001]` a `[0.323935,1.63627,0.236044]`. La primera caja contiene la segunda. En 24 referencias curadas de cráneo, tronco, pelvis, miembros, manos y pies, el centro quedó dentro del intervalo anterior/posterior proyectado de la piel: 24 dentro, cero fuera o indeterminadas. [Datos y límites del método](../public/models/anatomy/integumentary/integumentary-registration.json). Esto no prueba contención volumétrica de cada vértice ni grosor cutáneo.

La topología fuente contiene **100 componentes conexos geométricos**, 1512 aristas de borde y cero aristas no manifold. Dos componentes principales tienen 54949 y 47178 vértices; 98 fragmentos reúnen 340 vértices. Se conserva todo. Las dos superficies principales no se identifican como epidermis/dermis, no se mide grosor clínico ni se reparan huecos para aparentar una envoltura estanca. Los componentes conexos se calculan por índices del OBJ; no son estructuras anatómicas nuevas.

El validador glTF no registra errores ni advertencias en el archivo comprimido o decodificado. El comprimido incluye dos avisos informativos por la extensión Meshopt y su buffer de respaldo; la versión decodificada independiente no tiene avisos. [Informe final](phase9/gltf-validation.json).

La revisión de silueta, manos, pies, cabeza, transparencias y relaciones visibles está documentada en [revisión visual](phase9/visual-review.md). Se conservan orificios oculares, costuras y pequeños defectos nativos. No se modifica el cuerpo interno para ocultarlos.
