# Fase 7 — revisión visual

Se revisaron **30 capturas finales**: todas en hojas de contacto de geometría, responsive completo y vistas originales ampliadas de búsqueda, árbol, seis sistemas, contexto hepático y las cuatro imágenes corregidas del estómago. Las hojas temporales sólo facilitaron la inspección; los PNG finales no fueron retocados. [Manifiesto, hashes y commit por imagen](capture-manifest.json).

26 vistas no afectadas proceden del renderer probado antes de la corrección editorial. Las cuatro que mostraban el estómago seleccionado (18/19/24/25) se renovaron sobre el código final. Sus versiones previas quedan en `pre-label-review/` como evidencia del defecto corregido; no forman parte de las 30 finales. La corrección no cambió GLB, materiales ni renderer.

| # | Captura | Observación |
|---:|---|---|
| 01 | [01-digestivo-anterior](captures/01-digestivo-anterior.png) | Organización oral–esófago–estómago–intestinos reconocible; hígado a la derecha anatómica. Hueco faríngeo original visible, sin tubo fabricado. |
| 02 | [02-digestivo-posterior](captures/02-digestivo-posterior.png) | Vista posterior coherente con inversión visual izquierda/derecha; páncreas y relaciones posteriores visibles, sin reflejar geometría. |
| 03 | [03-digestivo-lateral](captures/03-digestivo-lateral.png) | Perfil corporal con curvatura esofágica y profundidad abdominal; no aplanamiento ni desplazamiento manual. |
| 04 | [04-esofago](captures/04-esofago.png) | Esófago aislado completo dentro del encuadre; extremos fuente conservados, sin prolongación artificial. |
| 05 | [05-estomago](captures/05-estomago.png) | Estómago aislado con forma macroscópica reconocible y margen de cámara; no subdivisiones creadas. |
| 06 | [06-higado](captures/06-higado.png) | Hígado completo como owner único; costuras visibles de las ocho piezas fuente. No se interpretan como segmentos clínicamente validados. |
| 07 | [07-vesicula](captures/07-vesicula.png) | Vesícula aislada, paleta verde discreta y cuello visible; no continuidad biliar añadida. |
| 08 | [08-pancreas](captures/08-pancreas.png) | Páncreas aislado beige, encuadre completo; superficie original conservada y una sola versión integrada. |
| 09 | [09-duodeno](captures/09-duodeno.png) | Duodeno con curvatura y terminaciones fuente visibles; sin cierres ni cortes inventados. |
| 10 | [10-intestino-delgado](captures/10-intestino-delgado.png) | Conjunto del intestino delgado agrupado; asas mantienen posiciones originales y no se cuentan como órganos separados. |
| 11 | [11-intestino-grueso](captures/11-intestino-grueso.png) | Intestino grueso disponible reconocible; no afirmar ciego o sigmoide completos a partir de esta silueta. |
| 12 | [12-recto](captures/12-recto.png) | Recto lateral aislado dentro del encuadre; corte terminal original y ausencia de canal anal independiente documentados. |
| 13 | [13-solo-digestivo](captures/13-solo-digestivo.png) | Sólo Digestivo permite leer tubo y órganos accesorios; no duplicación visual evidente. |
| 14 | [14-digestivo-oseo](captures/14-digestivo-oseo.png) | Digestivo dentro de caja torácica y pelvis con huesos atenuados; encuadre digestivo recorta parte del contexto corporal, no el objetivo. |
| 15 | [15-digestivo-cardiovascular](captures/15-digestivo-cardiovascular.png) | Relación con vasos existentes y corazón; transparencia muestra trayectos sin duplicar vasos en Digestivo. |
| 16 | [16-digestivo-respiratorio](captures/16-digestivo-respiratorio.png) | Relación esófago–tórax y órganos subtorácicos; pulmones atenuados reutilizados, sin nueva geometría respiratoria. |
| 17 | [17-seis-sistemas](captures/17-seis-sistemas.png) | Seis sistemas con contexto transparente; digestivo legible y solapamiento esperado. Encuadre regional recorta cabeza/extremidades del contexto. |
| 18 | [18-estomago-seleccionado](captures/18-estomago-seleccionado.png) | Estómago seleccionado en cian; tipo órgano y región Estómago corregida. Contexto hepático parcialmente ocluye el órgano como en la fuente. |
| 19 | [19-estomago-aislado](captures/19-estomago-aislado.png) | Aislamiento de estómago en cian, sin otras piezas visibles; región correcta y contorno íntegro. |
| 20 | [20-contexto-hepatico](captures/20-contexto-hepatico.png) | Contexto hepático explícito muestra vesícula, vías y vasos cardiovasculares existentes a través del parénquima atenuado. Intersecciones/costuras transparentes visibles. |
| 21 | [21-exploded-sistemas](captures/21-exploded-sistemas.png) | Seis sistemas separados por bloques; piezas mantienen orientación y escala. Cuerpo entero dentro de encuadre de conjunto. |
| 22 | [22-exploded-regiones](captures/22-exploded-regiones.png) | Despiece regional digestivo moderado: superior, accesorios con estómago y bloques intestinales, sin dispersión de asas. |
| 23 | [23-exploded-estructuras](captures/23-exploded-estructuras.png) | Despiece por estructuras distingue órganos y segmentos; conjuntos yeyunal/ileal conservan coherencia, sin separar cada asa. |
| 24 | [24-busqueda-global](captures/24-busqueda-global.png) | Búsqueda sin tilde estomago devuelve Estómago/Gaster con tipo órgano, sistema y región correcta; selección sincronizada. |
| 25 | [25-arbol-global](captures/25-arbol-global.png) | Árbol mantiene el estómago seleccionado y ancestros/scroll; nombres largos usan elipsis en el panel, mientras la ficha muestra el nombre completo. |
| 26 | [26-laptop](captures/26-laptop.png) | Laptop 1366×768: tres paneles y controles de cámara/despiece accesibles; modelo completo en el área central. |
| 27 | [27-tablet](captures/27-tablet.png) | Tablet 820×1180: árbol lateral y acceso a Inspección; anatomía y despiece caben sin desbordamiento horizontal de página. |
| 28 | [28-movil](captures/28-movil.png) | Móvil 390×844: paneles plegables, cámara y despiece visibles; modelo íntegro. La franja de sistemas tiene texto recortado en este ancho, sin desbordamiento de la página. |
| 29 | [29-region-oral](captures/29-region-oral.png) | Región oral aislada: lengua y cuatro glándulas con simetría/lateralidad conservada; no representa boca completa, parótidas ni faringe. |
| 30 | [30-vias-biliares](captures/30-vias-biliares.png) | Vías biliares aisladas en verde; ramas nativas y extremos originales visibles, sin fabricar colédoco ni continuidad ausente. |

Resultado: organización digestiva macroscópica reconocible, orientación/escala compatibles con el cuerpo de origen, selección y contexto legibles. No se observan duplicados ni desplazamientos ajenos a la fuente. Las vistas de detalle pueden recortar órganos del contexto al enfocar el objetivo; el objetivo aislado cabe en cámara. Las pruebas numéricas complementan la inspección con frustum y conservación de geometría.

Limitaciones: faringe, ciego completo, sigmoide y canal anal independientes pendientes, además de otras ausencias auditadas. Persisten huecos, costuras y contactos originales. La transparencia convencional superpone superficies y seis capas transparentes tienen latencia alta en SwiftShader, registrada en [rendimiento](../phase7-performance.md). No se declara continuidad anatómica completa, precisión clínica ni rendimiento móvil real.
