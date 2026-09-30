# Fase 9 · revisión visual

**30 capturas finales revisadas individualmente en cinco hojas de contacto**, con revisión adicional a resolución completa de cabeza, mano, pie, piel con atlas completo, piel seleccionada/aislada y panel móvil. Capturas originales sin retoque ni geometría generada. [Estado, selección, viewport y mallas visibles por captura](integumentary-captures.json).

La silueta corporal es coherente, reconocible y conservada. No se aprecia incompatibilidad espacial global grave. Las aperturas oculares y las costuras del pie son propias de la representación; al superponer todo el atlas aparecen pequeñas intersecciones/moteado (especialmente cuello, tronco y miembros) que se atenúan o desaparecen al aislar piel. No se garantiza cierre estanco, ausencia de toda penetración ni grosor clínico. Son límites documentados, no reparados mediante deformación.

La transparencia progresiva permite estudiar el interior; el solapamiento de las superficies nativas altera la apariencia de opacidad respecto a una lámina única, sin hacer inutilizable la exploración. Se mantienen DoubleSide, depthTest y depthWrite=false bajo 100 %, sin OIT. La selección interna a través de piel, su selección por árbol/búsqueda, el aislamiento y el panel responsive cumplen las comprobaciones funcionales. Los encuadres de detalle recortan el contexto corporal alrededor de la zona enfocada; no indican clipping de la estructura objetivo.

| Captura | Revisión |
|---|---|
| [01-piel-anterior](01-piel-anterior.png) | Cuerpo externo completo reconocible; manos y pies contenidos en el encuadre, escala y orientación coherentes. |
| [02-piel-posterior](02-piel-posterior.png) | Silueta posterior, glúteos, espalda y miembros conservados sin fragmentos desplazados visibles a escala corporal. |
| [03-piel-lateral-izquierda](03-piel-lateral-izquierda.png) | Perfil izquierdo completo, sin recortes del cuerpo por el frustum. |
| [04-piel-lateral-derecha](04-piel-lateral-derecha.png) | Perfil derecho coherente; no se fabricó el lado opuesto mediante reflexión. |
| [05-piel-cabeza](05-piel-cabeza.png) | Cabeza completa: ojos con aperturas nativas, rasgos simplificados; no se inventan globos oculares o párpados nuevos. |
| [06-piel-mano](06-piel-mano.png) | Mano derecha con cinco dedos completos y muñeca; el muslo adyacente corresponde a la misma envoltura, no a una duplicación. |
| [07-piel-pie](07-piel-pie.png) | Pie lateral completo, talón y dedos visibles; costuras/punteado fino en dorso y planta. La pierna continúa fuera del encuadre de detalle. |
| [08-piel-75](08-piel-75.png) | Piel al 75 % con músculo: envoltura dominante y lectura parcial del interior, comportamiento esperado a opacidad alta. |
| [09-piel-50](09-piel-50.png) | Piel al 50 %: aumenta la lectura muscular; hay superposición de las dos superficies nativas. |
| [10-piel-25](10-piel-25.png) | Piel al 25 %: músculos claramente legibles, manteniendo referencia de silueta. |
| [11-piel-10](11-piel-10.png) | Piel al 10 %: lectura interna dominante; la superficie queda como guía tenue. |
| [12-piel-muscular-posterior](12-piel-muscular-posterior.png) | Relación posterior piel/músculo, sin desplazamiento corporal global aparente. |
| [13-piel-oseo](13-piel-oseo.png) | Piel al 25 % con óseo: cráneo, caja torácica, pelvis y extremidades se leen dentro de la silueta. |
| [14-piel-cardiovascular](14-piel-cardiovascular.png) | Cardiovascular con piel al 10 %, vasos y corazón legibles; no se añade microvasculatura cutánea. |
| [15-piel-nervioso](15-piel-nervioso.png) | Nervioso con piel al 10 %, referencias centrales y periféricas legibles; se conserva el registro previo. |
| [16-solo-piel-clic-transparente](16-solo-piel-clic-transparente.png) | Clic real sobre piel transparente cuando está sola, resaltado y ficha correspondientes. |
| [17-atlas-inicial-sin-piel](17-atlas-inicial-sin-piel.png) | Inicio normal: diez sistemas históricos, piel apagada; se conserva la experiencia interna. |
| [18-atlas-con-piel](18-atlas-con-piel.png) | Once sistemas con piel opaca: envoltura general coherente. Moteado/pequeñas intersecciones en cuello, tórax, brazos y piernas; no se promete oclusión hermética. |
| [19-piel-seleccionada](19-piel-seleccionada.png) | Piel seleccionada con atlas interno activo: resaltado correcto, pequeñas penetraciones/intersecciones más evidentes por contraste. No se recolocan estructuras. |
| [20-piel-aislada](20-piel-aislada.png) | Piel aislada: una unidad completa, sin el moteado del interior de 18/19. El contador indica estructuras disponibles, no mallas visibles. |
| [21-seleccion-interna-con-piel](21-seleccion-interna-con-piel.png) | Riñón derecho seleccionado por raycast real a través de piel al 25 %, con ficha correcta. El cuerpo recortado por la ventana es contexto de un zoom local. |
| [22-panel-laptop](22-panel-laptop.png) | Laptop 1366×768: controles de piel, opacidad y módulo accesibles; paneles y modelo legibles. |
| [23-panel-tablet](23-panel-tablet.png) | Tablet 900×1100: panel de estructuras abierto y deslizable, modelo e inspección accesibles. |
| [24-panel-movil](24-panel-movil.png) | Móvil 390×844: panel superpuesto con cierre visible, slider y módulo accesibles; sin desborde horizontal. El modelo queda parcialmente detrás del panel por diseño. |
| [25-despiece-sistemas](25-despiece-sistemas.png) | Sistemas separados: huesos y músculos se desplazan con el algoritmo existente; piel queda como referencia fija. No se disgregan fragmentos de piel. |
| [26-busqueda-piel](26-busqueda-piel.png) | Búsqueda “piel” ofrece la estructura y el sistema, con tipo y latín; no son geometrías duplicadas. |
| [27-arbol-once-sistemas](27-arbol-once-sistemas.png) | Árbol corporal con ramas de los once sistemas. La última rama puede requerir scroll; Home/End y virtualización se comprobaron en la integración. |
| [28-contexto-superficial](28-contexto-superficial.png) | Contexto explícito de referencias superficiales con piel al 25 %; ficha explica el cambio y limita las piezas visibles. |
| [29-piel-torax](29-piel-torax.png) | Enfoque anterior de tórax conservando piel como unidad. Cuello y abdomen continúan fuera de esta vista de detalle. |
| [30-piel-espalda](30-piel-espalda.png) | Enfoque posterior de espalda sin corte geométrico ni región cutánea inventada. |

Durante el desarrollo se ajustó exclusivamente el encuadre del arnés de mano para incluir todos los dedos. No fue necesario cambiar el algoritmo de cámara ni generar nuevas capturas históricas. Los archivos de esta galería son la evidencia final; los ensayos preliminares no se presentan como resultado final. Validación técnica y visual, **no validación clínica**.
