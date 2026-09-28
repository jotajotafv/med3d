# Fase 4 expandida: validación

Implementación validada: `e8eb75f2eebc68f4a06c88324d8bebf945ab4aa6`, base `9d7c9389476f160af746fd40f6e0a2fa2793c56f`. [Vinculación de los 27 archivos probados a sus blobs Git](phase4-expansion/commit-binding.json), [hashes y tamaños](phase4-expansion/tested-files.json). Las pruebas regionales/globales se ejecutaron antes del commit y por eso registran base + árbol modificado; ese SHA por sí solo no identifica el código probado. El manifiesto verifica los blobs finales. Después de esas pruebas sólo se quitaron líneas vacías finales del script QA y pasó `node --check`. Capturas y rendimiento registran el commit limpio final.

## Geometría nueva

| Módulo | Mallas | Triángulos | Bytes GLB |
|---|---:|---:|---:|
| `nervous:lower-left` | 8 | 25056 | 202496 |
| `nervous:lower-right` | 8 | 25056 | 202584 |
| `nervous:upper-left` | 11 | 30240 | 238688 |
| `nervous:upper-right` | 11 | 30240 | 238684 |
| Total nuevo | 38 | 110592 | 882452 |

[`build-nervous-expansion.mjs`](../scripts/anatomy/build-nervous-expansion.mjs) extrae sólo aprobados, verifica el ZIP fuente, conserva posiciones Float32, no cuantiza posiciones ni decima; usa Meshopt y normales a 12 bits. La validación independiente conserva el multiconjunto de triángulos orientados, incluidas multiplicidades. Error máximo frente a coordenadas transformadas de doble precisión: `6.010658296664614e-8 m`. Khronos: **0 errores y 0 warnings** tanto comprimido como decodificado en los cuatro GLB. [Manifest](../public/models/anatomy/nervous/nervous-expansion-manifest.json) y [validación por objeto](../public/models/anatomy/nervous/nervous-expansion-validation.json).

Reconstrucción en directorio separado: catálogo, cuatro GLB, manifest y validación idénticos byte a byte. [Reproducción del registro](phase4-expansion/registration-reproduction.json) y [verificación Blender nativa](phase4-expansion/native-reproduction.json) satisfactorias. No se reoptimizaron activos históricos. `nervous:cns` y `nervous:cranial` siguen idénticos, con 57/30 mallas y 2 600 372/332 748 bytes. Snapshot del catálogo previo idéntico al blob de la base.

## Validación incremental y una regresión final

| Comprobación | Resultado y evidencia |
|---|---|
| Suite específica nueva | PASS, cuatro grupos: catálogo/owners/IDs, auditoría y registro, fichas/contexto/búsqueda, geometría/hashes/despiece. [Log](phase4-expansion/final-expansion.log). |
| Navegador regional | PASS, seis grupos; los 38 objetos por español, latín, ID y nombre fuente; cámaras, aislamiento, ocultar/restaurar; raycast real del mediano fino; contexto curado; opacidades 100/50/25/10; cuatro módulos y recuperación de error; árbol ARIA/teclado. [JSON](phase4-expansion/nervous-expansion-regional.json). |
| `npm run typecheck` | PASS. [Log](phase4-expansion/final-typecheck.log). |
| `npm run verify:anatomy` | PASS, siete suites históricas: catálogo, renderer, multisistema, torso, miembros, cabeza/cuello y vacíos musculares. [Log](phase4-expansion/final-anatomy.log). |
| Suite nerviosa original | PASS, cinco grupos, contratos originales sobre snapshot congelado. Ninguna prueba eliminada. [Log](phase4-expansion/final-nervous.log). |
| `npm run build` | PASS, 18 rutas estáticas, exit 0. Advertencia preexistente Vite de chunk OrbitControls >500 kB; el prefijo PowerShell `NativeCommandError` en stderr no corresponde a fallo de build. [Log](phase4-expansion/final-build.log). |
| Navegador global, producción final | PASS, siete grupos: nervioso original, seis vistas, materiales/contexto, tres sistemas, todos los módulos, recuperación de fallo craneal, raycast cerebeloso real, búsqueda ósea/muscular/nerviosa/órganos, árbol, responsive, corazón, pulmones, encéfalo HRA y las 18 rutas. [JSON](phase4-expansion/nervous-functional.json). |

La regresión completa se ejecutó una sola vez al cierre. Durante desarrollo se usaron pruebas regionales y builds de preview. Las mediciones y capturas posteriores son evidencia, no repeticiones de la regresión histórica.

## Contratos del atlas

Catálogo corporal final: **650 nodos, 411 estructuras, 512 mallas, 31 módulos**. Nervioso: 56 estructuras, 61 componentes, 117 propietarios de mallas y 125 mallas en seis módulos. La expansión añade 26 estructuras, 12 componentes y 14 grupos editoriales. Los grupos no aumentan el contador de nervios. No se modificó ningún ID histórico ni se duplicaron mallas originales. Sólo crecen descendientes/bounds/assets de los ancestros nerviosos y periféricos; se retira su agrupación craneal global de despiece para que abarcar extremidades no altere el bloque de cabeza.

Búsqueda: español, latín, inglés/objeto fuente y `zanatomy:*`; se conservan FMA/FJ históricos y órganos independientes. No se ofrecen como presentes médula o ciático. Árbol virtualizado con teclado, ARIA, ancestros y scroll. Capas Óseo/Muscular/Nervioso independientes, módulos regionales, descarga/recarga y recuperación de error. DoubleSide, depthTest y depthWrite=false bajo 100 % conservados; muscular 10–25 %, óseo 25–50 % y nervioso 100 % comprobados.

Fichas nuevas en [nerve-expansion-education.ts](../src/features/anatomy/atlas/nerve-expansion-education.ts): nombre, latín, tipo, región, origen, recorrido, función, modalidad y territorios motor/sensitivo. Referencias NCBI/StatPearls y Z-Anatomy enlazadas por familia. Las ramas reciben notas de componente; no se atribuye función motora a los nervios puramente sensitivos. Contexto mediante IDs óseos y musculares curados, nunca distancia 3D. Ejemplos: mediano–flexor radial del carpo, axilar–deltoides, femoral–cuádriceps, tibial–sóleo, fibular profundo–tibial anterior. No se dibujan inserciones o fascículos inventados.

Despiece: Sistemas, Regiones y Estructuras restauran posición exacta a 0 %. Los nuevos nervios viajan en bloques regionales coherentes; no se cortan para aumentar separación. Cámaras anterior/posterior/lateral y encuadres de plexos, brazos/manos, pelvis, piernas/pies comprobados con muestras de geometría proyectadas dentro del frustum. No se declara prueba de médula/ciático ausentes.

## Revisión visual de 26 capturas nuevas

Se revisaron las 26 mediante hojas de contacto y ampliación individual de vistas generales, contexto y móvil. Las capturas originales no están retocadas ni generadas por IA. [Metadatos, selección, módulos y objetos visibles](phase4-expansion/nervous-expansion-captures.json). No se repitieron capturas históricas masivas.

| Captura | Viewport | Observación |
|---|---|---|
| [01 · nervioso-expandido-anterior](phase4-expansion/captures/01-nervioso-expandido-anterior.png) | 1440 × 900 | Cobertura corporal bilateral distribuida; hueco central visible; nervios finos discontinuos a esta escala. |
| [02 · nervioso-expandido-posterior](phase4-expansion/captures/02-nervioso-expandido-posterior.png) | 1440 × 900 | Cobertura corporal bilateral distribuida; hueco central visible; nervios finos discontinuos a esta escala. |
| [03 · nervioso-expandido-lateral](phase4-expansion/captures/03-nervioso-expandido-lateral.png) | 1440 × 900 | Cobertura corporal bilateral distribuida; hueco central visible; nervios finos discontinuos a esta escala. |
| [04 · plexo-braquial-derecho-parcial](phase4-expansion/captures/04-plexo-braquial-derecho-parcial.png) | 1440 × 900 | Componentes braquiales parciales, seleccionados y aislados; no plexo continuo. |
| [05 · plexo-braquial-izquierdo-parcial](phase4-expansion/captures/05-plexo-braquial-izquierdo-parcial.png) | 1440 × 900 | Componentes braquiales parciales, seleccionados y aislados; no plexo continuo. |
| [06 · mediano](phase4-expansion/captures/06-mediano.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [07 · cubital](phase4-expansion/captures/07-cubital.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [08 · axilar](phase4-expansion/captures/08-axilar.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [09 · musculocutaneo](phase4-expansion/captures/09-musculocutaneo.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [10 · plexo-lumbar-ramas](phase4-expansion/captures/10-plexo-lumbar-ramas.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [11 · plexo-sacro-ramas](phase4-expansion/captures/11-plexo-sacro-ramas.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [12 · femoral](phase4-expansion/captures/12-femoral.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [13 · tibial](phase4-expansion/captures/13-tibial.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [14 · fibular-comun](phase4-expansion/captures/14-fibular-comun.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [15 · fibular-profundo](phase4-expansion/captures/15-fibular-profundo.png) | 1440 × 900 | Selección cian y aislamiento regional legibles; recorridos nativos, sin clipping grave observado. |
| [16 · nervioso-oseo](phase4-expansion/captures/16-nervioso-oseo.png) | 1440 × 900 | Capas superpuestas transparentes; oclusión esperable, controlable con aislamiento/opacidad. |
| [17 · nervioso-muscular](phase4-expansion/captures/17-nervioso-muscular.png) | 1440 × 900 | Capas superpuestas transparentes; oclusión esperable, controlable con aislamiento/opacidad. |
| [18 · tres-sistemas](phase4-expansion/captures/18-tres-sistemas.png) | 1440 × 900 | Capas superpuestas transparentes; oclusión esperable, controlable con aislamiento/opacidad. |
| [19 · contexto-mediano-musculo-hueso](phase4-expansion/captures/19-contexto-mediano-musculo-hueso.png) | 1440 × 900 | Mediano con húmero, radio, ulna y flexor radial del carpo curados; contexto legible. |
| [20 · exploded-sistemas](phase4-expansion/captures/20-exploded-sistemas.png) | 1440 × 900 | Despiece por sistemas/regiones conserva los recorridos; no se fabrican conexiones. |
| [21 · exploded-regiones](phase4-expansion/captures/21-exploded-regiones.png) | 1440 × 900 | Despiece por sistemas/regiones conserva los recorridos; no se fabrican conexiones. |
| [22 · busqueda-global](phase4-expansion/captures/22-busqueda-global.png) | 1440 × 900 | Resultados y jerarquía legibles; encuadre de detalle de miembros superiores, no vista corporal completa. |
| [23 · arbol-ampliado](phase4-expansion/captures/23-arbol-ampliado.png) | 1440 × 900 | Resultados y jerarquía legibles; encuadre de detalle de miembros superiores, no vista corporal completa. |
| [24 · laptop](phase4-expansion/captures/24-laptop.png) | 1366 × 768 | Responsive usable; nervios finos poco visibles a escala de cuerpo, especialmente en móvil. |
| [25 · tablet](phase4-expansion/captures/25-tablet.png) | 820 × 1180 | Responsive usable; nervios finos poco visibles a escala de cuerpo, especialmente en móvil. |
| [26 · movil](phase4-expansion/captures/26-movil.png) | 390 × 844 | Responsive usable; nervios finos poco visibles a escala de cuerpo, especialmente en móvil. |

No se observó inversión de lateralidad, escala corporal discordante, duplicación evidente ni clipping grave en los encuadres regionales. Sí hay discontinuidades por cobertura ausente, tubos finos con aliasing a distancia y solapamiento con capas transparentes. Se conservan las herramientas de selección, zoom, aislamiento y contexto; no se disimula la falta medular. Las capturas del plexo braquial muestran componentes separados tal como se aprobaron. La revisión es técnica/educativa, **no validación clínica ni revisión anatómica experta externa**.

## Ajustes y límites

Se corrigió la asociación de contexto exclusivamente craneal para grupos periféricos, el bloque de despiece de ancestros nerviosos que ahora abarcan el cuerpo y los conteos fijos históricos de QA. Se agregó proyección de muestras reales al puente QA (sólo `?qa=1`), sin ampliar geometría de picking. Se preservaron Home, Procedimientos, Primeros Auxilios y exploradores independientes. La documentación original permanece intacta.

Persisten ausencia central y de varios troncos principales, plexos incompletos, simetría/tubularización propias de la fuente, límites milimétricos del registro entre cuerpos y latencia de despiece en SwiftShader. Véanse [fuentes](phase4-expansion-sources.md), [registro](phase4-expansion-registration.md) y [rendimiento](phase4-expansion-performance.md).
