# Fase 3DE — validación de cierre

Código: `93bbbd7349f9c5cb66213211d7df52dd1ecc3f6d`. Base: `5ba794438287a16b6482c6a63d3d2b6ca8ee6542`. Hubo validación incremental acotada y **un único pase global de cierre**, sobre `7ce40479e469b2d846bffae24be2aed5c30b7b98`. Después, la revisión visual detectó etiquetas ambiguas de búsqueda; se corrigieron en el código final y sólo se repitieron typecheck, build y nueve casos específicos afectados. [Diferencia acotada](phase3de/results/search-label-correction.json). Los reportes nuevos distinguen árbol sucio por documentación de `implementationDirty: false`: cada ejecución final instrumentada se realizó sin cambios de implementación concurrentes.

## Desarrollo regional

La suite `node scripts/test-atlas-head-neck.mjs` pasó siete grupos: topología/owners; preservación de IDs y fichas previas; identidad/auditoría/geometría nueva; búsqueda/fichas/contexto de las 20 unidades; despiece y reposo exacto; cámara en seis vistas y tres proporciones para todos los nodos nuevos; carga real Meshopt y ciclo de vida con retry/cancelación.

La comparación OBJ → GLB y el validador glTF se ejecutaron únicamente sobre el activo nuevo. No se reconstruyeron ni reoptimizaron activos históricos. [Conservación](phase3de-registration.md).

La ejecución regional de navegador pasó 9 grupos: 20 fichas, cinco contextos explícitos, aislamiento/ocultación/restauración, seis cámaras, opacidad 100/50/25 %, tres modos de despiece con reposo exacto, tres ciclos de recarga sin crecimiento y fallo de red con recuperación explícita. Sus tres vistas de desarrollo se inspeccionaron individualmente y se sustituyen por las capturas finales en la entrega. [Reporte regional](phase3de/results/regional-functional.json).

## Regresión global única y corrección focalizada

| Suite | Resultado | Evidencia |
|---|---|---|
| Typecheck | PASS | [Log](phase3de/results/typecheck.txt) |
| Verify anatomy | PASS: seis suites de catálogo/renderer/3A/3B/3C/3DE | [Log](phase3de/results/verify-anatomy.txt) |
| Build del pase global | PASS; 18 rutas estáticas | [Log](phase3de/results/build.txt) |
| Óseo y órganos previos | PASS: 26 grupos | [Reporte](phase3de/results/browser-qa.json) |
| 3A funcional | PASS: 30 grupos | [Reporte](phase3de/results/pilot-functional.json) |
| Árbol 3A | PASS: 1 grupo | [Reporte](phase3de/results/pilot-tree.json) |
| 3B funcional | PASS: 23 grupos | [Reporte](phase3de/results/torso-functional.json) |
| 3C funcional | PASS: 32 grupos | [Reporte](phase3de/results/limbs-functional.json) |
| Integración global 3DE | PASS: 13 grupos | [Reporte](phase3de/results/head-neck-functional.json) |
| Inicio, Acerca y Arquitectura | PASS: 3 grupos | [Reporte](phase3de/results/site-routes.json) |
| Corrección de tipos de búsqueda | PASS: 9 casos | [Reporte](phase3de/results/head-neck-search.json) |

El código final pasa también [typecheck](phase3de/results/targeted-typecheck.txt) y [build](phase3de/results/targeted-build.txt). Se conservaron las demás pruebas aprobadas, sin repetir la regresión completa.

Total: **137 grupos funcionales** de cierre, además de las suites estáticas, cuatro mediciones y captura final. [Comandos, tiempos, SHA y códigos de salida](phase3de/results/commands.json). No se eliminaron aserciones para pasar pruebas. Las suites históricas usan sus cohortes fijadas; la suite nueva verifica el catálogo completo de 313 estructuras / 339 mallas / 21 módulos.

La regresión incluye búsqueda global en español/latín/alias/FMA/FJ, identificación de músculo/componente/hueso/órgano/región, árbol virtual y navegación, dos sistemas, opacidad independiente, selección/raycast/aislamiento/contexto, retorno exacto al 0 % de los tres modos de despiece, descarga/recarga, errores y restauración, y tamaños de laptop/tablet/móvil. Corazón, pulmones y encéfalo renderizan en sus visores previos; las 14 rutas de Procedimientos y Primeros Auxilios siguen legibles. No se integran órganos en el marco corporal.

El build conserva el aviso de chunk de OrbitControls superior a 500 kB; no es un fallo ni se ocultó el aviso. La prueba focalizada terminó con exit 0 y sus nueve casos aprobados; el cierre del navegador superó el plazo de 5 s y dejó un aviso del arnés, sin errores de página ni respuestas HTTP fallidas. Las animaciones y tiempos se ejecutan en SwiftShader. Los perfiles responsive son viewports, no dispositivos físicos.

## Revisión visual final

Se inspeccionaron individualmente los 30 PNG. [Manifiesto, SHA-256 y commit de adquisición por imagen](phase3de/results/capture-manifest.json). Las capturas 01–29 se generaron en el cierre; la 21 se sustituyó tras corregir su etiqueta y se añadió únicamente la 30 para el encuadre del ECM. No se regeneraron vistas no afectadas. No equivalen a certificación clínica.

| Captura | Observación individual |
|---|---|
| [01-cabeza-anterior](phase3de/captures/01-cabeza-anterior.png) | Cráneo completo en vista anterior, sin recorte superior; sólo contexto óseo y musculatura cervical disponible. Ausencia facial explícita. |
| [02-cabeza-lateral](phase3de/captures/02-cabeza-lateral.png) | Lateral derecha coherente con el indicador de ejes; cráneo y mandíbula encuadrados, fijaciones cervicales en su marco original. |
| [03-cabeza-posterior](phase3de/captures/03-cabeza-posterior.png) | Occipital y cuello posterior centrados; superposición cervical esperable, sin duplicación visible. |
| [04-cuello-anterior](phase3de/captures/04-cuello-anterior.png) | Cuello completo y bilateral en contexto del tórax; la bóveda craneal queda fuera por el enfoque regional. Platisma superficial oculta estructuras profundas. |
| [05-cuello-lateral](phase3de/captures/05-cuello-lateral.png) | Perfil cervical derecho coherente; ECM y platisma se superponen con trapecio/torso. No se desplaza geometría para despejar planos. |
| [06-cuello-posterior](phase3de/captures/06-cuello-posterior.png) | Trapecio histórico cubre gran parte de los nuevos músculos posteriores; oclusión esperable. Cuello y hombros conservan escala y continuidad de contexto. |
| [07-platisma-seleccionado](phase3de/captures/07-platisma-seleccionado.png) | Platisma derecho resaltado en cian y ficha coherente; el enfoque unilateral recorta contexto distante, no la estructura seleccionada. |
| [08-platisma-aislado](phase3de/captures/08-platisma-aislado.png) | Una sola lámina muscular, completa y sin duplicaciones; aislamiento voluntario hace legible su contorno. Faceteado original visible. |
| [09-cervical-seleccionado](phase3de/captures/09-cervical-seleccionado.png) | ECM derecho visible en cian bajo contexto superficial; lateralidad y ficha corresponden. Parte proximal queda bajo la etiqueta superpuesta del visor. |
| [10-cervical-aislado](phase3de/captures/10-cervical-aislado.png) | Una única malla de ECM aislada; contorno distal visible y faceteado de fuente conservado. La etiqueta del visor tapa parte del extremo superior; se añade la captura 30 con zoom menor. |
| [11-muscular-anterior](phase3de/captures/11-muscular-anterior.png) | 110 músculos disponibles en vista anterior, sin sistema óseo visible; ausencias de cabeza, mano/pie y abdomen completo no se rellenan. |
| [12-muscular-posterior](phase3de/captures/12-muscular-posterior.png) | Cobertura posterior bilateral coherente; huecos y planos musculares reflejan cobertura parcial, sin duplicación nueva. |
| [13-muscular-lateral](phase3de/captures/13-muscular-lateral.png) | Vista lateral derecha del conjunto disponible, sin corte de los extremos visibles ni desplazamientos aislados nuevos. |
| [14-oseo-muscular](phase3de/captures/14-oseo-muscular.png) | Esqueleto y 110 músculos en un único marco corporal; cabeza ósea, manos y pies hacen visibles las ausencias musculares. |
| [15-solo-muscular](phase3de/captures/15-solo-muscular.png) | Se retira el sistema óseo y permanecen 110 estructuras musculares. El árbol conserva el catálogo global, aunque haya módulos descargados. |
| [16-cuello-transparencia-50](phase3de/captures/16-cuello-transparencia-50.png) | Alpha al 50 % permite leer huesos y planos profundos; bandas por acumulación y superposición visibles, sin desaparición del contexto óseo. |
| [17-exploded-sistemas](phase3de/captures/17-exploded-sistemas.png) | Óseo y muscular se separan como dos conjuntos; cada sistema conserva su forma interna. La ausencia de musculatura craneofacial sigue visible. |
| [18-exploded-regiones](phase3de/captures/18-exploded-regiones.png) | Cabeza/cuello, tronco y miembros quedan en bloques reconocibles, con separación acotada; no se cortan músculos largos para aumentar distancias. |
| [19-exploded-estructuras](phase3de/captures/19-exploded-estructuras.png) | Músculos cervicales resaltados se separan enteros; huesos de contexto también se desplazan. El encuadre regional recorta cráneo/torso alejados, no las unidades cervicales enfocadas. |
| [20-contexto-cervical](phase3de/captures/20-contexto-cervical.png) | ECM derecho con temporal derecho, occipital, clavícula derecha y esternón; no aparecen huesos inferidos por proximidad ni puntos de fijación inventados. |
| [21-busqueda-global](phase3de/captures/21-busqueda-global.png) | Captura sustituida tras la corrección: Corazón figura inequívocamente como Órgano, con sistema/región y enlace al modelo independiente. |
| [22-arbol-global](phase3de/captures/22-arbol-global.png) | Cuello aparece bajo Sistema muscular y despliega sus divisiones y lados; selección visible. Los nombres largos usan elipsis en la columna y se leen completos en la ficha. |
| [23-laptop](phase3de/captures/23-laptop.png) | 1366×768: tres paneles y controles disponibles, cuerpo completo dentro del visor y sin desbordamiento horizontal. |
| [24-tablet](phase3de/captures/24-tablet.png) | 900×1000: árbol lateral legible, inspección mediante botón y modelo completo; Cuello figura en el mismo sistema muscular. |
| [25-movil](phase3de/captures/25-movil.png) | 390×844: modelo íntegro, controles táctiles y despiece visibles; paneles secundarios cerrados y sin desbordamiento horizontal. |
| [26-movil-ficha](phase3de/captures/26-movil-ficha.png) | Nombre largo se adapta a dos líneas; acciones y contexto legibles en panel desplazable. El contenido educativo inferior requiere scroll, sin truncamiento de datos. |
| [27-movil-capas](phase3de/captures/27-movil-capas.png) | Módulo Cuello accesible dentro del panel de capas desplazable, junto a módulos previos; referencias de órganos permanecen separadas. |
| [28-cuello-transparencia-25](phase3de/captures/28-cuello-transparencia-25.png) | Huesos permanecen opacos y el cuello profundo se distingue más; acumulación de superficies transparentes y bandas visibles pero utilizables. |
| [29-prevertebral-aislado](phase3de/captures/29-prevertebral-aislado.png) | Largo de la cabeza derecho completo, aislado y dentro del visor; no se desplaza ni deforma para exponerlo. |
| [30-ecm-aislado-encuadre-completo](phase3de/captures/30-ecm-aislado-encuadre-completo.png) | Dos pasos de Alejar muestran el ECM derecho completo, con ambos extremos fuera de la etiqueta fija; cambia sólo la cámara, sin modificar la malla. |

No se detectaron inversiones laterales, cambio de escala ni duplicaciones introducidas. Las vistas de cuello encuadran el cuello y pueden excluir la bóveda craneal; las tres vistas de cabeza muestran el contexto óseo porque no existe cobertura facial/masticatoria fiable en la selección. Los músculos profundos requieren aislamiento u ocultación voluntaria. Se conserva el faceteado y la superposición de la fuente, y las bandas de acumulación de alpha a 50/25 %.

## Preservación y ajustes

Se preservan los 175 IDs musculares previos, 174 nodos sin cambios y las 45 familias educativas previas; sólo se amplía/reordena la raíz muscular. Ningún GLB histórico, Home, Procedimientos o Primeros Auxilios cambia. [Preservación por diferencias Git](phase3de/results/preservation.json).

Ajustes de integración: bloque regional coherente cráneo/cervicales/cuello; textos de cobertura que incluyen cuello y limitaciones; auditoría reproducible tras añadir su propia cohorte; proyección de la cohorte 3C en sus pruebas para conservar expectativas originales. No se reescribe el algoritmo de despiece, transparencia ni cámara. La revisión visual corrigió la etiqueta «Órgano / componente» y el genérico «Estructura» de los huesos, usando las identidades existentes. No se detectó una regresión que exigiera modificar las mallas históricas.

Antecedentes, sin repetir sus informes: [3A](phase3-delivery.md), [3B](phase3b-delivery.md), [3C](phase3c-delivery.md).
