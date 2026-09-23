# Fase 3DE — entrega local

**Fase 3 — Sistema Muscular cerrada localmente para revisión**, con cobertura disponible explícita. Tres checkpoints: integración, corrección acotada de búsqueda detectada visualmente y documentación. Sin despliegue ni Fase 4.

| N.º | Punto solicitado | Resultado |
|---:|---|---|
| 1 | Rama | `phase3de-muscular-final`, local. |
| 2 | SHA base | `5ba794438287a16b6482c6a63d3d2b6ca8ee6542`; HEAD exacto y árbol limpio comprobados antes de crear la rama. |
| 3 | Inventario auditado | 60 conceptos regionales terminales, más 14 familias solicitadas sin identificación nominal en las tablas consultadas. [Auditoría](phase3de-audit.md). |
| 4 | Decisiones | 20 aprobados, 7 descartados no musculares, 33 aplazados. Las 14 consultas nominales ausentes se registran aparte como pendientes, sin inventar FMA/FJ. |
| 5 | Familias y unidades nuevas | Diez familias bilaterales / 20 músculos completos: esternocleidomastoideo, platisma, escalenos anterior/medio/posterior, largo de la cabeza, esplenio de la cabeza, esternohioideo, milohioideo y genihioideo. Sin nuevas cabezas o zonas. |
| 6 | Mallas | 20 nuevas; 134 musculares y 339 combinadas. |
| 7 | Triángulos | 101.700 nuevos; 845.136 musculares y 1.357.586 combinados. |
| 8 | Bytes GLB | 1.003.996 nuevos; 8.723.428 musculares y 12.640.368 combinados. |
| 9 | Módulos | Uno nuevo: `muscular:neck`; 14 musculares y 21 combinados. Seis divisiones cervicales con cobertura real. |
| 10 | Fuente y transformación | BodyParts3D 4.0 OBJ99 / DBCLS, marco `bodyparts3d-4.0-male`, `(x,y,z) → (x,z,−y)/1000`. Sin ajustes por pieza ni fuentes adicionales. |
| 11 | Geometría | Float32 + Meshopt, todos los triángulos orientados y posiciones usadas conservados. Error máximo ≈0,000060 mm frente a tolerancia numérica de 0,05 mm. Validador nuevo comprimido/decodificado: cero errores y advertencias. [Registro](phase3de-registration.md). |
| 12 | Catálogo final | Cuerpo humano → Óseo / Muscular; muscular → Cuello, Tronco, miembros superiores e inferiores por lado. 202 nodos musculares y 452 compuestos. No hay Cabeza muscular vacía; se conservan los 175 IDs anteriores. |
| 13 | Total corporal | 313 estructuras: 203 óseas + 110 músculos. Mallas, componentes y grupos no se cuentan otra vez como músculos. Los órganos de referencia conservan sus visores independientes. |
| 14 | Búsqueda | Español, latín, alias y FMA/FJ corporales; corazón, pulmones y encéfalo conservados. Tipos explícitos músculo, componente, hueso, órgano y región. Nueve casos adicionales verifican la corrección de etiquetas. |
| 15 | Árbol | Virtualización, ancestros, selección visible, Home/End y navegación conservados. No expone fases de desarrollo en sus nombres públicos. |
| 16 | Capas | Óseo y Muscular independientes; opacidad propia, módulos regionales, descarga/recarga y recuperación explícita tras errores. |
| 17 | Transparencia | Cuello al 100/50/25 %, DoubleSide, depthTest y depthWrite=false bajo 100 %. Alpha convencional, acumulación documentada, sin OIT. |
| 18 | Fichas | Diez familias nuevas; 55 familias educativas totales. Las 45 anteriores mantienen sus textos. [Fuentes y alcance](phase3de-education.md). |
| 19 | Contexto | IDs óseos curados, ipsilaterales o de línea media. Las fijaciones blandas del platisma no se sustituyen por huesos. Origen/inserción continúan en texto, sin landmarks inventados. |
| 20 | Exploded View | Sistemas, Regiones y Estructuras; reposo exacto al 0 %. Cabeza/cervicales/cuello forman un bloque; músculos largos permanecen enteros. |
| 21 | Rendimiento | Cuatro configuraciones A–D. C: primera geometría 238,9 ms; disponible completo 683,7 ms; 23.777.028 bytes de buffers; 339 draw calls iniciales. SwiftShader local, no GPU física/móvil. [Mediciones](phase3de-performance.md). |
| 22 | Pruebas específicas 3DE | Siete grupos estáticos, nueve regionales de navegador, trece de integración global y nueve casos focalizados de búsqueda. Geometría validada sólo para el nuevo activo. |
| 23 | Regresión global final | Un pase completo sobre `7ce4047`: typecheck, seis suites verify:anatomy, build y 125 grupos funcionales. Tres rutas generales y nueve casos del ajuste final elevan el cierre a 137 grupos. El código final pasa también typecheck/build. [Validación](phase3de-validation.md). |
| 24 | Capturas revisadas | 30 PNG inspeccionados individualmente: 29 del cierre, sustitución de búsqueda tras corregir su etiqueta y una vista adicional del ECM a menor zoom. [Manifiesto](phase3de/results/capture-manifest.json). |
| 25 | Limitaciones | Cabeza sin músculos faciales/masticatorios nominalmente fiables en estas tablas; cuello y sistema con cobertura parcial. Digástrico/largo del cuello y otros candidatos aplazados; intrínsecos de mano/pie y ausencias anteriores pendientes. Faceteado, solapes, alpha acumulado y oclusiones. La etiqueta fija puede tapar un extremo enfocado; Alejar lo deja visible. No hay validación clínica. |
| 26 | Bugs y ajustes | Etiquetas ambiguas órgano/componente/hueso corregidas; bloque regional cabeza/cuello y textos de cobertura integrados. Auditoría repetible y cohortes históricas fijas en pruebas, sin eliminar aserciones. Home, Procedimientos y Primeros Auxilios no cambian. |
| 27 | Commit cabeza/cuello e integración | `7ce40479e469b2d846bffae24be2aed5c30b7b98`: geometría, catálogo, fichas y cierre funcional global. |
| 28 | Commit de código final | `93bbbd7349f9c5cb66213211d7df52dd1ecc3f6d`: sólo corrección de tipos y prueba afectada. [Diferencia](phase3de/results/search-label-correction.json). |
| 29 | Commit documental | El commit que añade este informe y evidencias, con el código final como padre. SHA resuelto en la respuesta final; `git log -1 --format=%H -- docs/phase3de-delivery.md`. Sólo rutas `docs/`. |
| 30 | Working tree | Se comprueba limpio después del commit documental y después del bundle; resultado concreto en la respuesta final. |
| 31 | Main intacta | `main` y `origin/main`: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`; comprobación final al entregar. |
| 32 | Sin push ni merge | No se ejecutó push, merge ni publicación de GitHub Pages. Los tres checkpoints son locales. |
| 33 | Ruta del bundle | Ruta literal: `C:\Users\jotaj\Desktop\MED3D\_TRANSFER\med3d-phase3de.bundle`. En Windows está dentro del repositorio; sólo ese archivo se excluye localmente en `.git/info/exclude`. No se sobrescriben respaldos anteriores. |
| 34 | Tamaño del bundle | Se mide después del commit documental y se entrega en la respuesta final, evitando una referencia circular. |
| 35 | SHA-256 y validez | Hash exacto, `git bundle verify` y `git bundle list-heads` se entregan después de crear el bundle de la rama con toda su historia. |
| 36 | Cierre de Fase 3 | Sistema Muscular de MED3D cerrado localmente para revisión, con cobertura parcial explícita. Sin despliegue, Fase 4, órganos nuevos, vasos ni inicio del sistema nervioso. |

Los originales nuevos, hashes por OBJ/GLB, metadatos y herramientas se conservan en el commit de integración. Ningún GLB histórico se reconstruye. Los reportes distinguen el SHA del pase global del ajuste focalizado: éste no cambia geometría, carga, materiales, cámara, despiece ni las mediciones retenidas.

Antecedentes: [3A](phase3-delivery.md), [3B](phase3b-delivery.md), [3C](phase3c-delivery.md). La [preservación](phase3de/results/preservation.json) usa diferencias Git e identidad de nodos. Los avisos del build y del cierre del navegador focalizado se documentan en validación.
