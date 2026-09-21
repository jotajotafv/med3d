# Fase 3A — piloto muscular bilateral de hombro y brazo

Base autorizada y comprobada en `main`: `ac8631fd2a22509992e6058fcfdc292ecb212bf6`, 21 de septiembre de 2026. Alcance: ocho músculos por lado, 16 unidades anatómicas y 26 elementos BodyParts3D 4.0 OBJ99. No se amplía al torso, piernas, cabeza ni a los 403 candidatos.

## Implementación y alcance

Se conservan los catálogos fuente y los IDs óseos. La composición en memoria añade una raíz neutral «Cuerpo humano», con ramas ósea y muscular, sin atribuir un sistema a la raíz. El marco corporal y la normalización global se mantienen estables al cambiar de capas. Los órganos HRA conservan sus rutas y modelos independientes.

Cada sistema dispone de activación y opacidad independientes. Desactivarlo libera sus geometrías y conserva la selección de módulos para la siguiente activación. La interfaz inicia ambos sistemas; `?systems=skeletal` y `?systems=muscular` permiten abrir una configuración inicial específica, conservada por Restablecer. El árbol sigue virtualizado y la búsqueda diferencia músculo, componente, región y sistema.

Las fichas musculares tienen infraestructura propia; BoneInformation conserva su implementación. Ocho fichas de músculo, con lateralidad, y las porciones/cabezas deltoideas, bicipitales y tricipitales explican sus diferencias. Las fuentes anatómicas se enlazan en cada ficha. Los orígenes e inserciones se describen en texto, sin inventar zonas de superficie.

«Mostrar contexto» limita explícitamente la vista al músculo seleccionado y a sus huesos de origen/inserción documentados del mismo lado. La selección sigue resaltando el músculo. «Mostrar todas las piezas» elimina ese filtro. El contexto no se deduce de distancias 3D.

## Presentación y cámara

Los materiales musculares usan tonos rojos moderados definidos por familia, sin texturas generadas. Hover y selección tienen materiales distintos; la selección conserva el cian. La transparencia utiliza ordenación estándar de Three.js, prueba de profundidad, `depthWrite=false` y materiales DoubleSide cuando la opacidad es menor del 100 %. No se introduce OIT, BVH, LOD ni batching.

El despiece por sistemas mueve cada sistema como un bloque en posiciones deterministas del eje X. El nivel regional conserva todo el miembro superior de cada lado como bloque compartido entre capas: separar la clavícula/escápula del húmero o del antebrazo rompería el contexto de músculos que cruzan articulaciones. Hombro y brazo siguen disponibles como grupos de navegación y enfoque. El nivel de estructuras abre las porciones/cabezas respecto al padre, con separación acotada. Ningún desplazamiento de despiece forma parte del registro anatómico; al 0 % se copia la posición original.

Se conservan las seis vistas anatómicas. Enfocar ajusta el volumen seleccionado o el conjunto de contexto solicitado; no resuelve colisiones de cámara. La interfaz avisa de la posible oclusión de músculos profundos y ofrece Aislar. No oculta anatomía automáticamente al cambiar de perspectiva.

## Estado de verificación

**Código probado: `8c2a9cdd67a482459de106dfc87843502c1c0643`.** La [ejecución final 35554899964](https://github.com/jotajotafv/med3d/actions/runs/35554899964) terminó correctamente. El [registro de compilación](phase3/results/build.json) vincula los informes a ese SHA, Node v22.23.2 y el runner Linux. Se ejecutaron nuevamente las regresiones de Fase 2.1 sobre esta implementación, además de las pruebas del catálogo compuesto, los nueve GLB reales y el piloto muscular; los resultados históricos no sustituyen esta ejecución.

| Evidencia final | Resultado |
| --- | --- |
| [Piloto funcional](phase3/results/pilot-functional.json) | 30 comprobaciones aprobadas: carga bilateral/unilateral, capas, opacidad, raycast, fichas, contexto, cámara, despiece, recuperación y responsive |
| [Regresiones del atlas óseo](phase3/results/browser-qa.json) | 26 comprobaciones aprobadas, con las rutas anteriores conservadas |
| [Reproducción dirigida del árbol](phase3/results/pilot-tree.json) | 1 comprobación aprobada de la secuencia de expansión con movimiento reducido, sin desplazamiento compensatorio |
| [Capturas del piloto](phase3/results/pilot-captures.json) | 38 PNG de producción generados y revisados; cubren las 24 escenas solicitadas y vistas complementarias |
| [Capturas óseas de regresión](phase3/results/capture-manifest.json) | 32 PNG generados nuevamente sobre el mismo código |
| [Rendimiento del piloto](phase3/results/pilot-performance.json) | Configuraciones ósea, muscular y combinada medidas en una corrida secuencial |
| [Rendimiento óseo de regresión](phase3/results/performance-qa.json) | Carga, interacción y descarga comprobadas nuevamente |

Los informes funcionales y de capturas no registran errores de navegador sin manejar ni respuestas HTTP fallidas inesperadas. El fallo muscular de red se provoca expresamente para comprobar conservación de los módulos sanos y recuperación mediante reintento. Las pruebas también verifican que salir del aislamiento no reactive una capa desactivada y que una selección oculta admita una vista posterior sin reaparecer automáticamente. El cuerpo de la ficha muscular comprobada mantiene un tamaño mínimo de 14 px.

La [comparación numérica de conversión](../public/models/anatomy/muscular/validation.json) verifica los 26 elementos y todos sus triángulos orientados. El [informe de glTF Validator](phase3/results/gltf-validation.json) registra cero errores y cero advertencias en ambos GLB. Cada archivo comprimido tiene dos mensajes informativos sobre la extensión Meshopt y el buffer de respaldo; la representación decodificada en memoria no tiene observaciones. Esta validación de formato no certifica anatomía.

Las pruebas de navegador del piloto usan `?qa=1` para leer posiciones, visibilidad y materiales de los objetos Three.js reales. Esta inspección es de sólo lectura y no sustituye la selección por raycast, los controles de interfaz ni la inspección de píxeles.

### Revisión visual final

La [revisión por imagen](phase3/results/visual-review.md) recoge los 38 PNG del piloto; las vistas de manguito, subescapular, despiece y contexto recibieron además una segunda revisión individual. No se detectaron bloqueantes visuales concretos en las imágenes revisadas. La revisión es del piloto y de estas vistas, sin acreditar precisión clínica ni ausencia de penetraciones en todas las superficies.

La [vista posterior sin deltoides](phase3/captures/14b-manguito-sin-deltoides.png) expone el manguito mediante ocultación explícita. El [subescapular en contexto](phase3/captures/15-subescapular.png) conserva la oclusión por las estructuras circundantes, y su [vista aislada](phase3/captures/15b-subescapular-aislado.png) permite estudiar la superficie. El [despiece por sistemas](phase3/captures/19-exploded-sistemas.png) muestra bloques separados; el [regional](phase3/captures/20-exploded-regiones.png) mantiene la relación entre músculos y huesos del miembro superior.

El despiece de componentes no garantiza siluetas completamente separadas en cada perspectiva. En la [captura del bíceps al 100 %](phase3/captures/21b-biceps-componentes.png), los vientres siguen bastante superpuestos, aunque los trayectos proximales se distinguen; deltoides y tríceps también conservan solapes parciales. La selección individual y el cambio de vista siguen disponibles. La transparencia muscular al 100, 75, 50, 25 y 10 % se conserva en las capturas: no se declara una ordenación perfecta para toda intersección o perspectiva a partir de esas muestras.

La verificación del sitio publicado y su correspondencia con el código probado se registra por separado en la [evidencia de despliegue](phase3/results/deployment.json). El alcance termina en el piloto de Fase 3A.

### Fallo inicial conservado y correcciones

La [ejecución inicial del navegador](https://github.com/jotajotafv/med3d/actions/runs/35552076865), sobre `c7f1f3f744418de1cd19d8d92aa5e727b6ad79ae`, pasó las regresiones óseas y las mediciones, pero falló en navegación del árbol muscular y detuvo las capturas tras las primeras 14. Se conservan el [informe del fallo](phase3/results/initial-browser-failures.json) y la [captura del árbol desplazado](phase3/results/initial-tree-failure.png). Esa ejecución no aprueba el piloto.

La ventana virtual podía conservar una posición anterior cuando el navegador ajustaba el desplazamiento al expandir la jerarquía. La corrección sincroniza el desplazamiento real y la ventana antes de pintar, y vuelve a comprobar la selección cuando el panel móvil recupera una altura visible. El desplazamiento manual sigue libre. Las pruebas esperan la fila seleccionada visible tras `End`, «Expandir todo» y cerrar/reabrir el panel móvil, sin desplazar artificialmente el árbol para ocultar el fallo.

La [segunda ejecución](phase3/results/tree-expansion-followup-failure.json) pasó las 30 comprobaciones funcionales musculares, pero todavía fallaba al expandir el árbol durante las capturas con movimiento reducido. El [diagnóstico dirigido](phase3/results/tree-transition-diagnostic.json) confirmó la causa: la regla global de movimiento reducido introducía una transición de altura mínima. El estilo del espaciador ya indicaba 11.720 px, mientras su altura real seguía en 1.840 px; el cálculo limitaba el desplazamiento a 1.413 px. La altura nueva aparecía un fotograma después. El espaciador y las filas virtuales ahora excluyen transiciones, de modo que su geometría cambia instantáneamente. La nueva comprobación `--tree` reproduce esa secuencia al inicio de CI; sólo si pasa se ejecutan las baterías completas.

Durante la revisión también se corrigieron dos comportamientos: salir del aislamiento preserva una capa que el usuario haya desactivado; cambiar la cámara sobre una selección oculta utiliza sus límites anatómicos sin volverla visible. La variante inicial de cuantización de posiciones a 16 bits se descartó por correspondencias ambiguas entre vértices cercanos, y se conservan posiciones Float32. Estos cambios no modifican los originales ni el registro anatómico.

## Límites que se conservan

La identidad de versión y la conversión común sustentan la compatibilidad técnica; no constituyen certificación clínica. La musculatura fuente incluye modelado CAD y no demuestra segmentaciones independientes de un único donante. La ordenación de transparencia por objetos puede presentar artefactos en superficies interpenetradas. Las mediciones SwiftShader no representan GPU física.

El cóccix y los seis huesecillos auditivos siguen pendientes de registro, con originales, fuentes y matrices preservados. No se declara un esqueleto completo de 206 huesos. La visualización geométrica de origen/inserción queda pendiente de anotaciones válidas.

**Fase 3B requiere aprobación explícita del usuario después de revisar esta entrega.**
