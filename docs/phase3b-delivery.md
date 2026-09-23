# Entrega local de Fase 3B — musculatura del torso

Fecha de cierre: 23 de septiembre de 2026. Código: `5c6b6e32aca61ebee8ae14f418a5c32c2eaf686a`. Extensión acotada de BodyParts3D 4.0 OBJ99, con 26 unidades musculares nuevas, 34 mallas y tres módulos. No equivale a un torso muscular completo.

Respaldo: [auditoría](phase3b-audit.md), [registro y geometría](phase3b-registration.md), [fichas](phase3b-education.md), [validación](phase3b-validation.md), [revisión visual](phase3b/visual-review.md) y [rendimiento](phase3b-performance.md).

## 1. Rama utilizada

`phase3b-torso`, exclusivamente local. Se retomó la rama existente.

## 2. SHA base

`84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`, cierre documental de Fase 3A. Su padre es `8c2a9cdd67a482459de106dfc87843502c1c0643`, implementación validada del piloto. Al retomar, HEAD, main y origin/main apuntaban al primero.

## 3. Estado encontrado al retomar

Se inspeccionaron status, rama, log de doce commits, diff, diff estadístico, nuevos archivos y documentos de Fase 3A/3B. Había **11 archivos modificados y 18 nuevos**, sin commit de implementación. El [estado recuperado](phase3b/results/resumed-status.txt) enumera los 29 archivos. No había corrupción, mezcla con main ni una implementación incompatible que obligara a reiniciar.

Los modificados eran `package.json`, el catálogo muscular, dos scripts del piloto, la suite multisistema y seis archivos del atlas. Los nuevos incluían tres GLB, manifiesto y validación, dos ZIP, bloqueo de fuente, selección auditada, siete scripts y dos documentos. No se ejecutó reset, restore, checkout de archivos, clean ni stash; tampoco se escondieron los documentos pendientes.

## 4. Cambios heredados del trabajo interrumpido

Ya estaban implementados el inventario auditado, extracción selectiva, conversión y compresión, catálogo corporal ampliado, jerarquía del torso, colores, fichas/contexto, filtros de módulos y pruebas de torso. Existían resultados preliminares en `.cache/phase3b`, incluida una revisión visual anterior. No se tomaron esos resultados como evidencias finales del commit.

La interrupción dejó pendiente comprobar la serialización LF de los generadores y reproducir los seis archivos, finalizar la captura de capas/fichas móviles y erectores, fijar el código, repetir las pruebas críticas, generar nuevas evidencias y cerrar documentación. La reanudación completó ese cierre. Dos scripts nuevos conservaron CRLF y se normalizaron antes del commit; se comprobó su sintaxis.

## 5. Inventario auditado

Se revisaron seis tablas oficiales, el directorio ZIP fijado y **84 FJ únicos** de la búsqueda declarada: 34 aprobados y 50 descartados en 41 filas conceptuales. Siete familias solicitadas no tenían bindings identificables. No se presenta esta búsqueda regional como censo de toda la musculatura humana ni como procesamiento de los 403 candidatos históricos.

La [tabla completa](phase3b-audit.md) y el [JSON de selección](../research/anatomy/torso-selection.json) contienen FMA, FJ, representación BP, lado, tipo fuente, padre editorial, región, módulo, tamaños y motivo de descarte.

## 6. Estructuras integradas

Todas son bilaterales: pectoral mayor (clavicular, esternocostal y abdominal), pectoral menor, serrato anterior, subclavio, oblicuo externo, trapecio (ascendente, transverso y descendente), romboides mayor, romboides menor, iliocostal lumbar, iliocostal torácico, longísimo torácico, espinoso torácico y redondo mayor. Son 13 familias. Los cuatro tipos aprobados de erectores representan subdivisiones reales, no un grupo completo inventado.

## 7. Estructuras descartadas o ausentes

No se identificaron en este export recto abdominal, oblicuo interno, transverso abdominal, dorsal ancho, cuadrado lumbar, piramidal ni multífido. No se añadieron mallas de otra fuente ni generadas. Los intercostales carecen de identificación inequívoca por lado y espacio; otras representaciones segmentarias requieren curación específica. Cuello/cabeza quedan fuera de alcance. Diafragma, semiespinoso torácico, serratos posteriores y otros candidatos identificables se aplazan para mantener el conjunto acotado. Los 50 FJ descartados no se extrajeron.

## 8. Músculos y unidades

Torso: **26 unidades laterales en 13 familias**. Con el piloto: **42 unidades en 21 familias**. Las tres porciones de cada pectoral mayor y trapecio son componentes de cuatro unidades musculares y no doce músculos adicionales. Los padres editoriales no falsifican conceptos FMA ni convierten IS-A automáticamente en PART-OF.

## 9. Mallas

Torso: **34**. Muscular completo disponible: **60**. Óseo conservado: **205**. Conjunto corporal: **265**. Corazón, pulmones y encéfalo conservan sus exploradores independientes y no se incluyen en estos totales.

## 10. Triángulos

Torso: **523.876**. Piloto: 39.604. Muscular disponible: **563.480**. Óseo: 512.450. Conjunto: **1.075.930**. No hay decimación adicional.

## 11. Tamaños GLB

| Archivo | Bytes | Mallas | Triángulos |
| --- | ---: | ---: | ---: |
| `muscular-torso-anterior.glb` | 1.372.520 | 12 | 141.632 |
| `muscular-abdomen.glb` | 1.971.408 | 2 | 223.652 |
| `muscular-torso-posterior.glb` | 1.862.216 | 20 | 158.592 |
| Nuevo torso | **5.206.144** | **34** | **523.876** |

Los cinco GLB musculares suman 5.746.076 bytes; los doce GLB corporales, 9.663.016 bytes. Tamaño transferible, buffers de geometría y memoria GPU no son métricas equivalentes.

## 12. Módulos creados

`muscular:thorax-anterior` (8 unidades), `muscular:abdomen` (2) y `muscular:back` (16). Se cargan y liberan independientemente. Los dos módulos musculares previos y los siete óseos mantienen sus IDs y archivos.

## 13. Hashes

SHA-256 de los tres GLB, ZIP de originales, metadatos y selección: [tabla de registro](phase3b-registration.md). Los hashes por OBJ están en el [bloqueo de fuente](../research/anatomy/muscular-torso-source-lock.json); los del build final, en [build-identity.json](phase3b/results/build-identity.json). Los PNG y resultados entregados tienen su propio [manifiesto](phase3b/evidence-manifest.json).

## 14. Transformación

Exactamente `(x,y,z) → (x,z,−y)/1000`, traslación nula y marco `bodyparts3d-4.0-male`. No hay normalización, ajuste, reflexión o escala individual. La transformación común de presentación permanece vinculada al marco óseo completo, incluso al descargar regiones.

## 15. Conservación geométrica

Los 34 OBJ se compararon con los GLB finales decodificados: se preservan posiciones usadas y multiconjunto de triángulos orientados, incluidas repeticiones. Error numérico máximo **0,0000601717 mm**, frente a tolerancia de 0,05 mm. Los seis archivos reconstruidos offline son idénticos byte por byte. La [evidencia de preservación](phase3b/results/preservation.json) comprueba 132 archivos protegidos y los nodos/activos originales del piloto. Esto no mide precisión clínica ni ausencia de penetraciones.

## 16. Catálogo

La composición conserva una raíz neutral «Cuerpo humano», los sistemas óseo y muscular, sus marcos y propietarios únicos de mallas. El muscular tiene 87 nodos; el corporal, 337. La interfaz cuenta 245 estructuras: 203 unidades óseas conservadas y 42 musculares; no confunde ese número con las 265 mallas. Las hojas fuente conservan `bp3d:FMA…`; los padres editoriales de pectoral y trapecio usan `med3d:muscle:…`. No cambian IDs óseos ni del piloto.

## 17. Árbol

Sistema muscular → Tronco → Tórax anterior / Abdomen / Espalda. Espalda contiene grupos editoriales explícitos para erectores y transición escapular. La virtualización, expansión, selección visible y navegación por teclado se conservan. Cada unidad compuesta contiene sus porciones; no se aplana todo como músculos independientes.

## 18. Búsqueda

Búsqueda global con nombres españoles, latín, alias, FMA/FJ y distinción de sistema/tipo/región. Permite elegir una pieza y cargar su módulo. Siguen disponibles órganos anteriores. Las búsquedas vacías de transverso abdominal y dorsal ancho documentan ausencias reales.

## 19. Capas

Óseo y muscular tienen activación y opacidad independientes. Cada nuevo módulo se descarga con sus recursos y se recarga sin destruir el otro sistema. El parámetro opcional `modules` acota los módulos musculares iniciales/restablecidos para entradas regionales y regresiones del piloto; el catálogo global sigue siendo completo. Se verifican cancelación rápida, propiedad de recursos, ciclos estables y reintento explícito de fallo parcial.

## 20. Transparencia

Se conserva la estrategia existente: materiales DoubleSide, prueba de profundidad y `depthWrite=false` por debajo del 100 %. Se prueban 100/75/50/25/10 % sobre óseo al 100 % en anterior, posterior y lateral derecho. Persisten bandas oscuras y acumulación, especialmente al 75/50 % posterior. 25/10 % facilitan ver huesos; no separan todos los planos musculares. No se introduce OIT ni se promete orden perfecto durante cualquier giro.

## 21. Exploded View

Sistemas conserva bloques coherentes; Regiones usa un bloque muscular de tronco compartido para evitar romper músculos que cruzan límites; Estructuras mantiene desplazamientos deterministas y acotados de componentes. A 0 % todas las posiciones vuelven exactamente a reposo. Los offsets no son registro anatómico y pueden conservar solapes. No se modificó el algoritmo óseo base.

## 22. Fichas

Trece fichas de familia nuevas aplicadas a las 26 unidades, con doce fichas de porciones fuente; se mantienen las ocho familias del piloto. Nombre, latín, región, grupo, descripción, función, acción, origen, inserción, inervación, relaciones y fuentes están disponibles. Las porciones del trapecio tienen origen/inserción propios; se identifica cuándo inserción o inervación resumen el músculo. [Fuentes y decisiones](phase3b-education.md).

## 23. Contexto músculo-hueso

Asociaciones semánticas explícitas con huesos ipsilaterales y huesos de línea media revisados. No se usan vecinos por distancia ni el lado opuesto como sustituto. Fascia, cartílago, ligamento y aponeurosis quedan como texto. La porción abdominal del pectoral puede mostrar su único hueso disponible —el húmero— sin inventar un origen óseo. No hay huellas de fijación pintadas sobre las mallas.

## 24. Resultados de tests

Véase la [validación final](phase3b-validation.md), con comandos, SHA, resultados originales y límites. TypeScript, suite anatómica, build, geometría del piloto/torso y glTF se ejecutaron sobre el commit de código antes de producir las evidencias finales. Las pruebas de torso suplementan las anteriores.

## 25. Regresiones de Fase 3A

Se conserva la cohorte original de 16 unidades/26 mallas mediante un filtro explícito de catálogo y de carga inicial. No se borraron pruebas previas para adaptar totales. Los dos GLB, las identidades, las fichas originales y sus asociaciones permanecen conservados. El informe final incluye pruebas funcionales del piloto y la regresión dirigida del árbol.

## 26. Regresiones óseas y anteriores

Los 205 meshes, siete módulos y catálogo óseo se mantienen. Se vuelve a ejecutar su suite de navegador, incluyendo corazón, pulmones y encéfalo. Las rutas educativas y el resto del sitio se comprueban sin reescribir sus contenidos. Los documentos y evidencias históricos no se sustituyen.

## 27. Capturas

El [índice visual](phase3b/visual-review.md) enlaza las 48 capturas del build final: cuerpo, torso, laterales, selección/aislamiento, abdomen disponible, ausencia de profundidad abdominal y dorsal ancho, trapecio/romboides/erectores, tres niveles de despiece, contexto, cinco opacidades en tres vistas y cuatro tamaños de viewport con paneles móviles desplazados.

## 28. Revisión visual

La revisión del PNG se registra por separado de su generación en [visual-review.md](phase3b/visual-review.md). Se evalúan lateralidad, escala, registro general, duplicación visible, solapes, oclusión, transparencia, encuadre y lectura responsive. No equivale a evaluación clínica, inspección exhaustiva de todas las superficies ni medición geométrica de contactos.

## 29. Rendimiento

Cuatro configuraciones comparables: sólo óseo, muscular Fase 3A, muscular ampliado y conjunto corporal. Se miden bytes, mallas, triángulos, buffers, primeras geometrías, disponibilidad completa, búsqueda, aislamiento, respuesta de despiece, descarga y recarga. [Resultados y límites](phase3b-performance.md). Son ejecuciones locales secuenciales con SwiftShader, no una prueba de GPU física o de teléfono real.

## 30. Correcciones realizadas

Se permitió contexto con un solo hueso; se preservó la selección inicial de módulos al reactivar/restablecer la cohorte del piloto; se ajustaron textos de cobertura a las regiones existentes; se distinguió el alcance de inserción de porciones; se fijó el hash de selección antes de extraer y se hizo determinista la serialización LF. Se corrigieron la denominación «espinoso torácico» y la síntesis educativa de inervación del oblicuo externo. Estas correcciones pertenecen a la ampliación, sin atribuirles retrospectivamente fallos publicados en Fase 3A.

## 31. Limitaciones restantes

Cobertura muscular parcial, abdomen sin recto ni capas profundas y espalda sin dorsal ancho; candidatos ambiguos aplazados. Los músculos profundos pueden quedar ocultos en el conjunto opaco; aislamiento/contexto son acciones explícitas. Persisten bandas de transparencia, solapes parciales del despiece y recorte de contexto periférico al enfocar una región. La selección tiene tono cian uniforme y no muestra necesariamente las divisiones internas de porciones. El rótulo largo de los erectores cubre parcialmente sus extremos superiores en la captura del grupo; sólo muscular conserva un encuadre inicial amplio. No hay máscaras de inserción, contactos validados ni prueba de GPU móvil real. El build conserva una advertencia por el paquete grande de Three.js.

## 32. SHA local del código probado

`5c6b6e32aca61ebee8ae14f418a5c32c2eaf686a`. El [registro de comandos](phase3b/results/commands.json) identifica este SHA; las evidencias finales se generaron después de fijarlo y sin cambios posteriores de implementación.

## 33. Commit documental local

Este documento, los otros informes de Fase 3B y las evidencias forman el segundo commit, exclusivamente bajo `docs/`. Su SHA se comunica en la entrega final y puede recuperarse con `git log -1 --format=%H -- docs/phase3b-delivery.md`. No se incrusta aquí el hash del propio commit, porque cambiar su contenido cambiaría ese hash.

## 34. Publicación

No se hizo push, despliegue ni publicación del producto. El resultado está en el repositorio local.

## 35. Main

`main` y la referencia local `origin/main` siguen en `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. No se hizo merge. Esta comprobación es de referencias locales; no se afirma una consulta nueva del estado remoto.

## 36. Conclusión

Fase 3B está lista para revisión local con la cobertura y limitaciones declaradas: 80 comprobaciones funcionales finales aprobadas, validación estática/geométrica, cuatro perfiles de rendimiento y 48 capturas revisadas individualmente. No se inicia Fase 3C. La revisión educativa posterior puede valorar ampliaciones o anotaciones anatómicas adicionales sin alterar el registro para ocultar vacíos o solapes.
