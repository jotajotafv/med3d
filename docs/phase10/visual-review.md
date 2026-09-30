# Fase 10 · revisión de 35 capturas

Capturas originales PNG del código `9c778713cf37e3736850daaeba21108a62c443f6`, Chrome/SwiftShader local. Se revisaron las 35 mediante hojas de contacto de la zona anatómica y paneles; se abrieron además a tamaño completo cara, pelvis, mano, muslo, búsqueda ocular, contexto ocular y móvil. Las hojas auxiliares quedan en caché, no cuentan como evidencia adicional ni sustituyen los originales. [Estados y métricas de cada captura](browser-captures.json). La documentación ya estaba en preparación: `workingTreeDirty=true`, **`implementationDirty=false`**.

La revisión cubre lateralidad, orientación, escala, penetraciones, moteado, transparencia, selección, encuadre, árbol y responsive. No acredita exactitud clínica. Los acercamientos regionales muestran detalles y pueden dejar partes adyacentes fuera del viewport; no son cortes geométricos. No se detectó clipping grave de las estructuras objetivo en esta galería.

| Nº | Captura | Observación |
|---|---|---|
| 01 | [01-atlas-piel-100.png](01-atlas-piel-100.png) | Once sistemas, piel 100 %. Cuerpo entero encuadrado; interpenetraciones visibles en cuello y miembros, sin supresión automática. |
| 02 | [02-atlas-piel-75.png](02-atlas-piel-75.png) | Piel 75 %. Interior empieza a superponerse; contraste externo dominante. |
| 03 | [03-atlas-piel-50.png](03-atlas-piel-50.png) | Piel 50 %. Solape de superficies evidente, coherente con transparencia convencional. |
| 04 | [04-atlas-piel-25.png](04-atlas-piel-25.png) | Piel 25 %. Músculos y referencias internas legibles; envoltura permanece tenue. |
| 05 | [05-atlas-piel-10.png](05-atlas-piel-10.png) | Piel 10 %. Lectura próxima al interior sin piel; no se afirma desaparición de todos los solapes. |
| 06 | [06-atlas-sin-piel.png](06-atlas-sin-piel.png) | Diez sistemas sin piel, incluida extensión ocular. Escala/orientación general conservadas. |
| 07 | [07-superficie-aislada.png](07-superficie-aislada.png) | Acción Aislar piel: cian por selección; silueta limpia al ocultar explícitamente los otros sistemas, no por corrección geométrica. |
| 08 | [08-cabeza-ojos.png](08-cabeza-ojos.png) | Cabeza anterior: ojos bilaterales visibles dentro de aperturas fuente, iris esquemático y pupila pálida. Cabeza completa sin corte superior. |
| 09 | [09-cuello.png](09-cuello.png) | Cuello anterior: áreas musculares expuestas bilaterales compatibles con platisma en la auditoría. El recorte de frente pertenece al encuadre de detalle. |
| 10 | [10-torax.png](10-torax.png) | Tórax: cobertura general conservada; parche claro inferior esternal y pequeñas áreas expuestas en flancos. No se asigna ID óseo sólo por imagen. |
| 11 | [11-abdomen.png](11-abdomen.png) | Abdomen: volumen cubierto; parches musculares laterales y moteado fino permanecen. |
| 12 | [12-pelvis-genital.png](12-pelvis-genital.png) | Pelvis/genital masculino de referencia: cobertura superficial y forma fuente conservadas; pequeño fragmento azul inguinal visible. No se deduce su identidad sólo por color. |
| 13 | [13-hombro.png](13-hombro.png) | Hombro derecho: contorno cubierto, sin desplazamiento nuevo; el cuello adyacente mantiene la intersección ya descrita. |
| 14 | [14-brazo-antebrazo.png](14-brazo-antebrazo.png) | Brazo y antebrazo: continuidad y escala conservadas; moteado fino sobre antebrazo. Los dedos se revisan completos en 15. |
| 15 | [15-mano.png](15-mano.png) | Mano derecha: cinco dedos completos en encuadre; prolongaciones nerviosas amarillas fuera de puntas/laterales. Residuo del registro histórico, no corregido mediante deformación. |
| 16 | [16-muslo.png](16-muslo.png) | Muslo: áreas musculares mediales/laterales expuestas y líneas nerviosas; pelvis y rodillas permiten orientar el hallazgo. |
| 17 | [17-pierna.png](17-pierna.png) | Pierna posterior: salidas musculares en pantorrilla visibles bilateralmente. Pies y talones dentro del encuadre regional. |
| 18 | [18-pie.png](18-pie.png) | Pie derecho lateral: talón y dedos completos; trayectos nerviosos amarillos por fuera del dorso. La piel no fue inflada para cubrirlos. |
| 19 | [19-nervio-fibular-revisado.png](19-nervio-fibular-revisado.png) | Nervio fibular profundo derecho seleccionado, piel 25 %. La vista lateral permite relacionar nervio y extremidad; no demuestra ajuste perfecto a la envoltura. |
| 20 | [20-gastrocnemio-revisado.png](20-gastrocnemio-revisado.png) | Gastrocnemio medial derecho seleccionado, piel 100 %. La zona cian expuesta confirma intersección también con superficie opaca; no es sólo transparencia. |
| 21 | [21-busqueda-ojo.png](21-busqueda-ojo.png) | Búsqueda ojo: región, ojos parciales y componentes distinguidos; resultados en español y latín con jerarquía. |
| 22 | [22-ojo-derecho-aislado.png](22-ojo-derecho-aislado.png) | Ojo derecho parcial aislado: tres superficies fuente resaltadas como unidad; no aparecen retina/cristalino inventados. |
| 23 | [23-contexto-ocular.png](23-contexto-ocular.png) | Contexto ocular: ojo derecho, nervio óptico, frontal y esfenoides; lista explícita en ficha. El resto del cráneo no se carga como contexto ficticio. |
| 24 | [24-seleccion-interna.png](24-seleccion-interna.png) | Selección directa de riñón a través de piel 25 %: cian interior visible; clic comprobado por ID, no sólo por captura. |
| 25 | [25-rinon-aislado.png](25-rinon-aislado.png) | Riñón aislado: desaparece el contexto cutáneo y permanece la pieza completa. |
| 26 | [26-contexto-mixto.png](26-contexto-mixto.png) | Contexto mixto de piel 25 %: envoltura seleccionada y referencias óseas/musculares explícitas; sin todos los órganos superpuestos. |
| 27 | [27-despiece-sistemas.png](27-despiece-sistemas.png) | Despiece Sistemas 70 %: separación de sistemas perceptible, piel fija y tenue. No se interpreta como posición anatómica. |
| 28 | [28-despiece-regiones.png](28-despiece-regiones.png) | Despiece Regiones 70 %: bloques regionales se separan sin disgregar componentes del ojo; piel fija. |
| 29 | [29-despiece-estructuras.png](29-despiece-estructuras.png) | Despiece Estructuras 70 %: más denso visualmente con once sistemas; aislamiento/capas siguen siendo preferibles para piezas pequeñas. |
| 30 | [30-arbol-once-sistemas.png](30-arbol-once-sistemas.png) | Árbol: once raíces de sistema bajo Cuerpo humano; rótulos sin nombres de fases. Sólo piel cargada en esta captura del catálogo global. |
| 31 | [31-panel-1366.png](31-panel-1366.png) | 1366×768: columnas de escritorio y panel con scroll; todos los controles accesibles aunque no caben simultáneamente. |
| 32 | [32-panel-1050.png](32-panel-1050.png) | 1050×844: panel lateral y visor; inspección abre por control, sin desborde horizontal. |
| 33 | [33-panel-900.png](33-panel-900.png) | 900×1100: panel, opacidad y ambas acciones de piel legibles; modelo visible al lado. |
| 34 | [34-panel-768.png](34-panel-768.png) | 768×1024: herramientas conservadas en panel lateral; cierre y scroll accesibles. |
| 35 | [35-panel-390.png](35-panel-390.png) | 390×844: panel superpuesto cubre gran parte del visor de forma prevista; buscador, cierre, slider y acciones caben. Se cierra para explorar el modelo. |

## Matriz regional y diagnóstico

| Región solicitada | Evidencia | Resultado |
|---|---|---|
| Cabeza | 08, 21–23 | Ojos identificables; apariencia parcial, abertura pupilar pálida y superficies esquemáticas. |
| Cuello | 09 | Interpenetración muscular nativa, clasificación A. |
| Tórax | 10 | Cobertura general, pequeñas exposiciones conservadas A. |
| Abdomen | 11 | Parche lateral/moteado A; transparencia se distingue en 02–05 (B). |
| Pelvis | 12 | Región genital conservada; pequeña exposición inguinal, sin reconstrucción. |
| Hombro | 13 | Contorno estable; piel no reposicionada. |
| Brazo | 14 | Continuidad cubierta, sin flotación global. |
| Antebrazo | 14–15 | Moteado fino y continuidad hacia mano. |
| Mano | 15 | Salidas nerviosas distales del registro Z, clasificación D. |
| Muslo | 16 | Exposiciones musculares A y nerviosas D caracterizadas. |
| Pierna | 17, 19–20 | Gastrocnemio nativo A; nervio registrado D. |
| Pie | 18–19 | Trayectos nerviosos fuera del dorso, D. |

Clasificaciones completas A–E y medidas proyectadas en [auditoría](../phase10-audit.md). Las capturas no separan siempre la identidad de cada pequeña pieza; no se inventan diagnósticos por color. Las salidas nerviosas y musculares no quedan eliminadas. La solución E proporciona selección predecible, aislamiento exterior e interior accesible.

## Comparación con la evidencia anterior

[Cabeza en Fase 9](../phase9/05-piel-cabeza.png) frente a [cabeza con cobertura ocular en Fase 10](08-cabeza-ojos.png): ahora hay superficies oculares identificables y un flujo de búsqueda/ficha/aislamiento. La captura anterior tenía sólo piel; la nueva mantiene once sistemas, por lo que los parches cervicales no deben interpretarse como una deformación introducida en la piel. La geometría histórica es idéntica. Para las intersecciones generales puede compararse [atlas previo con piel](../phase9/18-atlas-con-piel.png) con [atlas actual con piel](01-atlas-piel-100.png); no se afirma que esas intersecciones hayan desaparecido. La [superficie aislada](07-superficie-aislada.png) evidencia una acción explícita de visibilidad, no una reparación anatómica.
