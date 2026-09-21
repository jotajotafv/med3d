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

La implementación se somete a las regresiones de Fase 2.1, pruebas del catálogo compuesto y de los nueve GLB reales, pruebas de navegador, capturas y mediciones. Este documento se completará con el commit probado y la evidencia obtenida antes de la entrega. Los resultados históricos de Fase 2.1 no se presentan como pruebas del piloto.

Las pruebas de navegador del piloto usan `?qa=1` para leer posiciones, visibilidad y materiales de los objetos Three.js reales. Esta inspección es de sólo lectura y no sustituye la selección por raycast, los controles de interfaz ni la inspección de píxeles.

## Límites que se conservan

La identidad de versión y la conversión común sustentan la compatibilidad técnica; no constituyen certificación clínica. La musculatura fuente incluye modelado CAD y no demuestra segmentaciones independientes de un único donante. La ordenación de transparencia por objetos puede presentar artefactos en superficies interpenetradas. Las mediciones SwiftShader no representan GPU física.

El cóccix y los seis huesecillos auditivos siguen pendientes de registro, con originales, fuentes y matrices preservados. No se declara un esqueleto completo de 206 huesos. La visualización geométrica de origen/inserción queda pendiente de anotaciones válidas.

**Fase 3B requiere aprobación explícita del usuario después de revisar esta entrega.**
