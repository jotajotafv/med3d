# Fase 3C — entrega local

Implementación de extremidades sobre el cierre local de Fase 3B. El respaldo se crea después del commit documental y su identidad final se entrega fuera del commit que preserva.

| N.º | Punto solicitado | Resultado |
|---:|---|---|
| 1 | Rama | `phase3c-limbs`, local. |
| 2 | SHA base | `1d58140bec7cdf946f3400d461a218756799bbc5`; se verificó HEAD exacto y working tree limpio antes de crear la rama. |
| 3 | Inventario auditado | 202 conceptos terminales del universo de búsqueda declarado, con las seis tablas y el directorio ZIP verificados. [Auditoría](phase3c-audit.md). |
| 4 | Aprobados | 54 conceptos/FJ originales, que representan 48 músculos. Sólo esos OBJ se extrajeron. |
| 5 | Descartados | 18 coincidencias no musculares: vasos, membranas y retináculos; cada motivo está en la tabla. |
| 6 | Aplazados | 130 conceptos: alcance acotado, conjuntos o descomposiciones pendientes. Se distinguen los identificables aplazados de los ambiguos; no se afirma ausencia de mano/pie. |
| 7 | Músculos añadidos | 24 familias bilaterales: glúteo mayor, medio y menor; tensor de fascia lata; recto femoral; vastos lateral, medial e intermedio; sartorio; aductor largo; grácil; bíceps femoral; semitendinoso; semimembranoso; tibial anterior; fibulares largo y corto; gastrocnemio; sóleo; tibial posterior; flexor radial del carpo; pronador redondo; extensor radial largo del carpo; supinador. |
| 8 | Unidades anatómicas | 48 músculos nuevos y 12 componentes de cabeza. Cuádriceps es un grupo con cuatro músculos por lado, sin contarlo una segunda vez. Total muscular disponible: 90 músculos. |
| 9 | Mallas | 54 nuevas; 114 musculares y 319 con óseo. |
| 10 | Triángulos | 179.956 nuevos; 743.436 musculares y 1.255.886 en el conjunto óseo + muscular. |
| 11 | GLB bytes | 1.973.356 nuevos; 7.719.432 musculares y 11.636.372 combinados. |
| 12 | Módulos | Ocho nuevos: glúteos, muslo, pierna y antebrazo, derecho/izquierdo. Total: 13 musculares y 20 combinados. |
| 13 | Hashes | [Registro](phase3c-registration.md): SHA-256 de los ocho GLB, selección y ZIP. [Manifiesto por OBJ](../public/models/anatomy/muscular/limbs-source-manifest.json). La reconstrucción separada coincidió byte por byte. |
| 14 | Transformación | `(x,y,z) → (x,z,−y)/1000`; marco `bodyparts3d-4.0-male`. Sin registro adicional ni ajuste por pieza. |
| 15 | Preservación geométrica | Float32 + Meshopt, sin decimación: todos los triángulos orientados, multiplicidades y posiciones usadas se conservan. Error máximo ~0,000060 mm; tolerancia numérica 0,05 mm. |
| 16 | Catálogo | 175 nodos musculares y 425 nodos compuestos. Se conservan los 87 IDs previos. Sólo se amplían tres ancestros antiguos; las nuevas regiones no incluyen nodos vacíos de mano/pie. |
| 17 | Árbol | Virtualización, Home/End, navegación por teclado, ARIA, ancestros y selección visible comprobados. Las regiones musculares pertenecen al mismo sistema. |
| 18 | Búsqueda | Español, latín, sinónimos y FMA/FJ; conserva huesos, músculos 3A/3B y órganos previos. Resultados con nombre, tipo, sistema y región. |
| 19 | Capas y presets | Óseo/muscular independientes; ocho módulos nuevos activables. Las configuraciones óseo, muscular y ambos se obtienen con los controles de sistema existentes y el parámetro systems. Se conserva el control regional; no se añaden botones de presets redundantes. |
| 20 | Transparencia | Estados 100/75/50/25/10 % sobre óseo comprobados. Quince capturas específicas de muslo, pierna y antebrazo; acumulación y oclusión documentadas. Sin OIT. |
| 21 | Exploded View | Sistemas como bloques; miembro inferior completo por lado en regiones; estructuras con desplazamiento limitado. Restauración exacta al 0 % y determinismo comprobados. |
| 22 | Fichas | 24 familias y seis tipos de cabeza, con origen/inserción e inervación del alcance correspondiente. Las 21 familias anteriores conservan sus textos. [Fuentes](phase3c-education.md). |
| 23 | Contexto | IDs óseos explícitos, ipsilaterales o de línea media. Cuádriceps agrupa las fijaciones de sus cuatro músculos; cabeza corta del bíceps femoral usa origen femoral e inervación fibular común. Sin inferencia por distancia ni zonas pintadas. |
| 24 | Tests Fase 3C | 32 comprobaciones funcionales en navegador, más tests estáticos, geometría y ciclo de vida de los ocho módulos. [Validación](phase3c-validation.md). |
| 25 | Regresiones Fase 3B | 23 comprobaciones funcionales, tests estáticos y geometría original; 26 músculos / 34 mallas preservados. |
| 26 | Regresiones Fase 3A | 30 comprobaciones funcionales más 1 del árbol, tests estáticos y geometría original; 16 músculos / 26 mallas preservados. La aserción de región ahora exige los nombres bilaterales del catálogo, conservando la verificación de etiquetas. |
| 27 | Regresiones óseas | 26 comprobaciones funcionales, tests de catálogo/cámara/renderer y 205 mallas conservadas. Corazón, pulmones y encéfalo siguen renderizando; las 14 rutas de procedimientos y primeros auxilios pasan regresión. |
| 28 | Capturas | 63 PNG reales finales, con selección, escena, viewport y hash. [Manifiesto](phase3c/results/capture-manifest.json). |
| 29 | Revisión visual | Cada PNG final se inspeccionó por separado. [Observaciones por captura](phase3c-visual-review.md). No se declara certificación clínica. |
| 30 | Rendimiento | Cinco configuraciones A–E medidas. E: 229.7 ms hasta primera geometría y 1000.3 ms hasta carga completa; 319 draw calls y 21910788 bytes de buffers. Chrome/SwiftShader local, no GPU física. [Mediciones](phase3c-performance.md). |
| 31 | Bugs y ajustes | Se ampliaron el contexto de cabeza con inervación específica, el contexto del grupo cuádriceps y los bloques regionales inferiores. Se corrigieron textos de cobertura y la expectativa antigua de etiqueta regional del test 3A. El ejecutor sincroniza opacidad/despiece con el estado real y permite ampliar su plazo total en WebGL por software. No se eliminaron pruebas ni se alteraron mallas para hacerlas encajar. |
| 32 | Limitaciones | Cobertura parcial; intrínsecos de mano/pie y otros candidatos aplazados. Cóccix y seis huesecillos siguen pendientes. Fuente OBJ99 modelada, faceteado y falta de landmarks. Las cabezas del gastrocnemio no representan continuidad tendinosa completa hasta el calcáneo; contexto no valida fijaciones geométricas. Persisten oclusiones y bandas por acumulación de transparencia. Rendimiento sólo en escritorio con WebGL por software. No se iniciaron cabeza, cara, cuello profundo ni Fases 3D/3E. |
| 33 | SHA código probado | `eb84c2d206b0bda73bfa5112d9f7943ab3985126`; 14 ejecuciones finales y 112 comprobaciones funcionales agrupadas. |
| 34 | SHA documental | Es el commit que incorpora este archivo y las evidencias, con el commit de código como padre. Se entrega resuelto en la respuesta final; localmente: `git log -1 --format=%H -- docs/phase3c-delivery.md`. No se inserta un hash autorreferente dentro de su propio commit. |
| 35 | Bundle local | `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase3c.bundle`, creado después del commit documental, sin sobrescribir respaldos anteriores. La respuesta final confirma el archivo y su verificación. |
| 36 | SHA-256 del bundle | Se entrega en la respuesta final tras crear y verificar el bundle; incluirlo aquí antes de crear este commit produciría una referencia circular. Puede recalcularse con `Get-FileHash -Algorithm SHA256` sobre el archivo. |
| 37 | Sin push | No se ejecutó push, publicación de GitHub Pages ni merge. La rama se conserva local. |
| 38 | Main intacta | `main` y `origin/main` permanecen en `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. |
| 39 | Conclusión | Fase 3C queda cerrada localmente para revisión con cobertura explícita, geometría trazable, pruebas y evidencias. El commit documental contiene sólo docs/. No se inicia la siguiente fase. |

## Preservación y operación

La home, Procedimientos y Primeros Auxilios no se modificaron. Las 321 comprobaciones de archivo de la base, los módulos óseos y musculares previos y las fichas anteriores están documentados en [preservación](phase3c/results/preservation.json). Los órganos HRA continúan en sus visores propios; no se superponen en un marco BP3D sin registro. El [registro del ajuste de la prueba](phase3c/results/test-adjustment.json) conserva los intentos y explica la expectativa regional corregida.

El bundle contiene la rama `phase3c-limbs` y sus antecesores, incluyendo ambos commits de esta fase. Se valida con `git bundle verify` y `git bundle list-heads`; no requiere una publicación remota. El commit documental se identifica después de crearlo, se verifica que su único padre sea el SHA de código y que todas sus rutas comiencen por `docs/`.

El estado final de Git, SHA documental y SHA-256 del bundle se comunican tras esas operaciones. El working tree debe quedar limpio antes de dar por terminada la entrega.
