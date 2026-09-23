# Fase 3F · Entrega local

Fase 3F cerrada localmente para revisión: **42 músculos adicionales**, representados por **48 mallas** de BodyParts3D. Cara/masticación permanece sin identificación suficiente. Mano y pie ganan cobertura parcial fiable; no se declara musculatura humana completa.

## Git y alcance

- Rama: `phase3f-muscle-gaps`.
- Base: `0841ad7942755905886d86e799c2e510473d6649`.
- Código/geometría probado: `b2921c7ea8bb86b1421fb8c9067c6d1cb0893027`.
- Checkpoint documental separado: este commit; su padre es el commit de código anterior. El SHA documental literal se obtiene con `git rev-parse HEAD` al cierre y figura en el informe final.
- `main` y `origin/main`: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`, intactas.
- Sin push, merge, Pages, Fase 4, Home ni cambios en Procedimientos/Primeros Auxilios. La fase anterior se referencia en [3DE](phase3de-delivery.md), sin rehacer su documentación.

## Inventario y resultado

[Auditoría por candidato](phase3f-audit.md): **97 filas** (cara 34, mano 25, pie 38). Son 74 conceptos encontrados y 23 objetivos sin ID. Decisiones: **48 aprobados, 14 descartados y 35 aplazados**; los ausentes están incluidos entre los aplazados. No se extrajo ningún aplazado/descartado.

| Módulo nuevo | Músculos | Mallas | Triángulos | Bytes GLB |
|---|---:|---:|---:|---:|
| `muscular:hand-right` | 6 | 7 | 4.432 | 73.596 |
| `muscular:hand-left` | 6 | 7 | 4.432 | 73.480 |
| `muscular:foot-right` | 15 | 17 | 15.930 | 273.584 |
| `muscular:foot-left` | 15 | 17 | 15.930 | 273.776 |
| **Total** | **42** | **48** | **40.724** | **694.436** |

21 familias/entradas educativas nuevas; 12 cabezas pertenecen a seis de esos músculos. Se conserva su tipo como componente. Catálogo final: **152 músculos / 182 mallas musculares / 18 módulos musculares**, junto a **203 huesos / 205 mallas óseas**: **355 estructuras corporales, 387 mallas, 25 módulos, 510 nodos de catálogo**. Regiones de mano/pie cuelgan de los miembros ya existentes; no se duplican padres ni se crean ramas de cabeza vacías. Los 202 IDs musculares anteriores y las 55 familias educativas se conservan.

**Cara:** 20 objetivos sin concepto identificado; los 14 conceptos de la categoría «muscle of face» son orbitales y no sustituyen masticación/expresión facial. **Mano:** seis familias bilaterales, incluida la representación por cabezas del aductor; quedan FPB, agregados de lumbricales/interóseos y palmar corto. **Pie:** quince entradas bilaterales; siguen pendientes EDB, interóseos dorsales y oponente del quinto dedo. Los conjuntos de mano y este oponente sí existen nominalmente: se aplazan, no se declaran ausentes.

## Registro e integración

Fuente única: **BodyParts3D 4.0 OBJ99 / DBCLS**; marco `bodyparts3d-4.0-male`, transformación exacta `(x,y,z) → (x,z,-y)/1000`. Originales ZIP conservados: **1.165.949 bytes**, con lock, hashes, FMA/FJ/BP, lado, vértices y bounds por archivo. No se reconstruyó ningún GLB histórico.

Float32 + Meshopt; todos los triángulos orientados y cada posición original usada preservados. Error máximo **0,000033567 mm** frente a tolerancia numérica de 0,05 mm; no implica validación clínica. Los cuatro GLB comprimidos y decodificados tienen **0 errores y 0 advertencias** del validador.

Búsqueda por español, latín, alias, FMA/FJ; árbol virtual y navegación conservados. Fichas nuevas con fuentes y alcance de cabeza; contexto óseo por IDs curados, sin proximidad. Lumbricales conservan fijaciones tendinosas sin sustitución ósea. Capas independientes, opacidad muscular 100/50/25 %, carga/descarga y recuperación comprobadas. Exploded View conserva bloques regionales de miembros; Estructuras separa componentes según el comportamiento previo, y todos los modos restauran exactamente 0 %.

## Validación y evidencia

Una regresión global final: `npm run typecheck`, `npm run verify:anatomy` (siete suites) y `npm run build`, todas con salida 0. Build genera 18 rutas; persiste el aviso conocido de tamaño del chunk OrbitControls. No se repitieron las baterías históricas de navegador.

Pruebas específicas: siete grupos estáticos de 3F; once grupos funcionales en navegador, con las 42 fichas de músculo y 12 de componente, cinco contextos, seis orientaciones, tres opacidades, cuatro módulos descargados/recargados, fallo de red y recuperación explícita, sistemas, búsqueda de órganos, árbol y viewports laptop/tablet/móvil. **0 errores de página / 0 respuestas HTTP fallidas**. El aborto de red controlado se recuperó en dos intentos.

Evidencia compacta: [validación](phase3f/validation.json), [GLB](phase3f/gltf-validation.json), [navegador y revisión individual](phase3f/browser-qa.json), [12 capturas](phase3f/screenshots/01-mano-palmar.png). El informe de navegador conserva el HEAD base existente durante la ejecución y añade la correspondencia explícita con el commit de código probado; no se altera esa cronología.

| Configuración observada | Mallas | Triángulos | Buffers reales | Primera geometría | Disponible |
|---|---:|---:|---:|---:|---:|
| Óseo + cuatro módulos nuevos | 253 | 553.174 | 8.738.496 B | 750,8 ms | 750,8 ms |
| Óseo + muscular integrado | 387 | 1.398.310 | 24.905.752 B | 329,4 ms | 1.233,9 ms |

Son observaciones de una ejecución secuencial local sin throttling, con **Chrome / ANGLE SwiftShader**, no un benchmark frío independiente ni rendimiento de GPU física/móvil. Incremento de buffers por 3F: **1.128.724 B** (incluye padding); accessors útiles: 1.040.286 B. Recarga sin crecimiento de buffers. No se introducen BVH, LOD ni cambios de renderizador.

## Revisión visual y limitaciones

Las doce PNG se inspeccionaron individualmente: lateralidad, orientación, escala, superposición, selección, aislamiento y contexto. Los primeros planos de mano encuadran la musculatura añadida y recortan parte de los dedos óseos; las vistas plantares incluyen el cuerpo de fondo. No hay pérdida geométrica observada de las nuevas mallas.

La captura 10 muestra una separación entre cabeza transversa del aductor del hallux y su falange de contexto: **el modelo no acredita una trayectoria tendinosa continua ni un punto de inserción**. Se conserva esa limitación de fuente, sin desplazar piezas para aparentar contacto. Los solapes se estudian con aislamiento, contexto y opacidad. Los errores de los controles de desarrollo (umbral de altura de pie, expectativa de despiece y distinción accessor/buffer) se corrigieron contrastando el marco y los contratos existentes; no requirieron cambios en anatomía histórica ni arquitectura.

No hay validación clínica. La cobertura de cara sigue ausente y mano/pie siguen parciales. [Fuentes candidatas futuras](phase3f-audit.md#posibles-fuentes-para-una-decisión-futura) sólo documentadas; ninguna geometría externa descargada o integrada.

## Respaldo y cierre

Tras el commit documental y con working tree limpio se crea, sin sobrescribir archivos existentes:

`C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase3f.bundle`

Se preserva la historia alcanzable desde `phase3f-muscle-gaps` mediante `git bundle create <ruta> phase3f-muscle-gaps`; se comprueban `git bundle verify` y el HEAD anunciado. Tamaño y SHA-256 se informan tras producir el bundle, fuera de este commit para evitar una referencia circular.

**Fase 3F cerrada localmente para revisión. Sin despliegue ni inicio de Fase 4.**
