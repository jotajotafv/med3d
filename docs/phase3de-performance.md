# Fase 3DE — rendimiento final

Medido sobre el commit de integración `7ce40479e469b2d846bffae24be2aed5c30b7b98`. El código final `93bbbd7349f9c5cb66213211d7df52dd1ecc3f6d` sólo corrige etiquetas de búsqueda y su prueba; geometría, carga, cámaras, transparencia y despiece son idénticos. No se repiten mediciones no afectadas. Cuatro configuraciones útiles, una ejecución por configuración, secuenciales sobre HTTP local sin throttling y respuestas no-store. Chrome headless con **ANGLE SwiftShader, WebGL por software**. No se infiere rendimiento de GPU física ni de móvil real.

| Configuración | GLB bytes | Mallas | Triángulos | Buffers de geometría (bytes) | Primera geometría (ms) | Disponible completo (ms) |
|---|---:|---:|---:|---:|---:|---:|
| A · Óseo | 3916940 | 205 | 512450 | 7609772 | 318.2 | 318.3 |
| B · Muscular disponible | 8723428 | 134 | 845136 | 16167256 | 248.6 | 557.9 |
| C · Óseo + muscular | 12640368 | 339 | 1357586 | 23777028 | 238.9 | 683.7 |
| D · Cuello muscular | 1003996 | 20 | 101700 | 1866240 | 187.1 | 187.3 |

| Configuración | Búsqueda (ms) | Aislar (ms) | Despiece: primera respuesta (ms) | Descargar módulo (ms) | Recargar módulo (ms) | Descargar sistema (ms) | Recargar sistema (ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| A · Óseo | 26.0 | 73.1 | 53.1 | 163.3 | 181.0 | 81.3 | 204.4 |
| B · Muscular disponible | 21.9 | 504.3 | 97.2 | 616.7 | 281.7 | 328.0 | 422.9 |
| C · Óseo + muscular | 25.0 | 780.3 | 276.1 | 747.2 | 744.1 | 1044.6 | 614.2 |
| D · Cuello muscular | 18.6 | 87.4 | 69.6 | 145.8 | 85.6 | 185.7 | 49.4 |

Medición de interacción: desde la acción automatizada hasta el estado real del renderer/DOM; incluye transporte de automatización y trabajo de React. Despiece mide la primera posición cambiada, no la duración completa de la animación. Los tiempos de carga se miden desde la instrumentación del atlas; primera geometría no significa todos los módulos listos. No son promedios, percentiles ni una prueba de red móvil.

Buffers son arrays propios de geometría decodificada, no VRAM total ni memoria de todo el navegador. Los draw calls iniciales equivalen a las mallas de cada configuración. La recarga regional y de sistema recupera exactamente los bytes iniciales; al descargar el único sistema quedan cero bytes de geometría.

D contiene el módulo cervical disponible; no se mide una musculatura facial inexistente. En C se conserva el sistema óseo durante la descarga muscular. El músculo de prueba es el esternocleidomastoideo; en A, el fémur izquierdo.

Renderer detectado: `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)`.

No se añade BVH, LOD, batching, merging ni OIT: estas mediciones y la regresión funcional no mostraron una imposibilidad de cargar y operar el conjunto disponible. Las interacciones animadas en software pueden ser lentas; no se certifica fluidez de hardware real. [Datos completos](phase3de/results/head-neck-performance.json).
