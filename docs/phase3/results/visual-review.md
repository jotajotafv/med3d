# Fase 3A — revisión visual de las capturas finales

Revisión del 21 de septiembre de 2026. Código: `8c2a9cdd67a482459de106dfc87843502c1c0643`. [Ejecución de validación 35554899964](https://github.com/jotajotafv/med3d/actions/runs/35554899964).

Se inspeccionaron las 38 capturas reales de Chromium/SwiftShader: recorrido completo mediante siete hojas de contacto y revisión ampliada de los PNG de transparencia, paneles móviles, manguito, subescapular, contexto y despiece. Las hojas de contacto sólo facilitaron la inspección; se conservan los PNG originales sin modificación, con [hashes y tamaños](capture-hashes.json). El [registro original de captura](pilot-captures.json) conserva viewport, selección, estado de las mallas, opacidad y cámara. Su campo `humanReview` es el recordatorio emitido por el script antes de esta revisión, no un resultado anatómico automatizado.

No se identificó una inconsistencia visual importante de lateralidad, escala, orientación, desplazamiento global, duplicación de músculos completos o flotación manifiesta en estas vistas. La conclusión se limita a compatibilidad visual razonable del piloto. No equivale a revisión por un anatomista, validación clínica, comprobación exhaustiva de intersecciones ni certificación de inserciones.

## Registro de las 38 imágenes inspeccionadas

| Captura original | Observación |
| --- | --- |
| [01 anterior](../captures/01-anterior-oseo-muscular.png) | Piloto bilateral limitado a hombro y brazo; proporción y orientación coherentes con el cuerpo óseo. |
| [02 posterior](../captures/02-posterior-oseo-muscular.png) | Distribución bilateral posterior coherente; musculatura profunda parcialmente cubierta. |
| [03 lateral derecho](../captures/03-lateral-derecho.png) | Músculos siguen el volumen del hombro y brazo derechos, sin desplazamiento global evidente. |
| [04 lateral izquierdo](../captures/04-lateral-izquierdo.png) | Relación lateral izquierda comparable; no se observa una inversión manifiesta. |
| [05 hombro derecho](../captures/05-hombro-derecho.png) | Deltoides y estructuras adyacentes conservan escala y marco común. |
| [06 hombro izquierdo](../captures/06-hombro-izquierdo.png) | Encuadre y proporción coherentes con el lado opuesto. |
| [07 brazo derecho](../captures/07-brazo-derecho.png) | Volúmenes musculares próximos al húmero, sin piezas globalmente desplazadas. |
| [08 brazo izquierdo](../captures/08-brazo-izquierdo.png) | Se conserva el conjunto izquierdo; el encuadre regional recorta contexto ajeno a la selección. |
| [09 deltoides seleccionado](../captures/09-deltoides-seleccionado.png) | Cian distinguible del hueso y del rojo; límites entre porciones visibles. |
| [10 deltoides aislado](../captures/10-deltoides-aislado.png) | Tres porciones identificables; uniones y bordes de la geometría fuente permanecen visibles. |
| [11 bíceps seleccionado](../captures/11-biceps-seleccionado.png) | Selección reconocible en su contexto; cabezas próximas entre sí. |
| [12 bíceps aislado](../captures/12-biceps-aislado.png) | Se aprecian los trayectos proximales de ambas cabezas; no se han separado ni ajustado manualmente. |
| [13 tríceps](../captures/13-triceps.png) | Selección posterior y ficha correspondientes; solapes entre componentes conservados. |
| [14 manguito posterior](../captures/14-manguito-rotador-posterior.png) | El deltoides opaco cubre parte del manguito; esta vista no demuestra exposición completa. |
| [14b manguito sin deltoides](../captures/14b-manguito-sin-deltoides.png) | Ocultación explícita del deltoides, indicada en el árbol; supraespinoso, infraespinoso y redondo menor se leen junto a la escápula. |
| [15 subescapular](../captures/15-subescapular.png) | Costillas y contexto muscular ocultan parte de la lámina; la oclusión sigue presente. |
| [15b subescapular aislado](../captures/15b-subescapular-aislado.png) | El aislamiento expone la superficie triangular sin modificar su geometría fuente. |
| [16 muscular 50 / óseo 100](../captures/16-muscular-50-oseo-100.png) | Se observa hueso bajo la capa muscular y acumulación de color por superposición. |
| [17 sólo músculos](../captures/17-solo-musculos.png) | Queda el piloto bilateral de 16 músculos; no se presenta como musculatura corporal completa. |
| [18 sólo huesos](../captures/18-solo-huesos.png) | Se conserva la presentación ósea al desactivar la musculatura. |
| [19 despiece por sistemas](../captures/19-exploded-sistemas.png) | Esqueleto y piloto se separan como bloques reconocibles. |
| [20 despiece regional](../captures/20-exploded-regiones.png) | Hombro y miembro superior conservan relaciones músculo-hueso dentro de un bloque compartido. |
| [21 porciones del deltoides](../captures/21-exploded-estructuras.png) | Contornos y separación didáctica visibles; quedan solapes parciales. |
| [21b cabezas del bíceps](../captures/21b-biceps-componentes.png) | Trayectos proximales distinguibles, pero los vientres siguen muy superpuestos incluso al 100 % del despiece. No es una separación visual completa. |
| [21c cabezas del tríceps](../captures/21c-triceps-componentes.png) | Componentes reconocibles con solapes parciales. |
| [22 laptop 1366](../captures/22-laptop-1366.png) | Visor y paneles conservan estructura y controles; el contenido largo se desplaza verticalmente. |
| [22b laptop 1050](../captures/22b-laptop-1050.png) | La inspección pasa a apertura voluntaria y el modelo mantiene su área central. |
| [23 tablet 900](../captures/23-tablet-900.png) | Capas y visor conviven; controles de inspección accesibles. |
| [24 móvil 390](../captures/24-movil-390.png) | Modelo visible con paneles cerrados y controles de apertura voluntaria. |
| [24b capas móviles](../captures/24b-movil-capas.png) | Panel abierto voluntariamente con cierre visible, sin recorte horizontal; requiere scroll para llegar a los controles musculares. |
| [24c ficha móvil](../captures/24c-movil-ficha.png) | Texto y acciones legibles, con cierre visible. Descripción, origen e inserción quedan bajo el primer pliegue y requieren scroll. |
| [25 contexto del bíceps](../captures/25-biceps-contexto.png) | Bíceps, escápula y radio corresponden a las relaciones curadas. El húmero no forma parte de este subconjunto de origen/inserción. |
| [Opacidad 100](../captures/opacity-100.png) | Rojo moderado, porciones identificables; hueso profundo cubierto donde la superficie es opaca. |
| [Opacidad 75](../captures/opacity-075.png) | Contornos internos y bandas oscuras por superposición, sobre todo en deltoides. |
| [Opacidad 50](../captures/opacity-050.png) | Mayor visibilidad del húmero y acumulación de color entre superficies. |
| [Opacidad 25](../captures/opacity-025.png) | Cabeza y diáfisis humerales claramente visibles con envolvente muscular tenue. |
| [Opacidad 10](../captures/opacity-010.png) | Predomina la lectura ósea; superficie muscular muy tenue. |
| [Opacidad 50 con selección](../captures/opacity-050-selected.png) | Bíceps cian distinguible del rojo y del hueso; la selección conserva transparencia. |

## Límites observados y alcance del cierre

La transparencia estándar es utilizable en estas vistas, pero acumula color y muestra contornos de caras superpuestas. No se observó una inversión evidente de profundidad en las imágenes revisadas; no se acredita orden perfecto desde todos los ángulos. Los porcentajes musculares se comprueban en el estado de escena y las pruebas; en varias capturas de escritorio su control queda bajo el pliegue del panel. Hover y raycast se verifican funcionalmente, sin inferirlos de una imagen estática.

La oclusión del manguito y del subescapular se conserva y se comunica. Ocultar el deltoides o aislar el músculo son acciones explícitas. El despiece regional usa un bloque común por miembro superior para conservar relaciones a través de las articulaciones. El despiece de componentes desplaza las piezas de forma determinista, pero no garantiza que sus siluetas queden totalmente separadas en cada vista. La vuelta exacta al reposo se comprueba numéricamente en las pruebas.

En móvil, los paneles abiertos cubren gran parte del visor y requieren desplazamiento vertical; se pueden cerrar y no ocupan permanentemente el viewport. Los encuadres cercanos recortan parte del torso o del brazo no seleccionado, manteniendo las estructuras seleccionadas en el área de estudio.

La inspección permite cerrar el piloto con estas limitaciones documentadas. La decisión de ampliar a Fase 3B corresponde al usuario; esta revisión no inicia esa fase.
