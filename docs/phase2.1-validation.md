# Fase 2.1 — cierre y pulido del sistema óseo

Fecha: 14 de septiembre de 2026. Base aprobada: `97c289d68c243f26c6cc23830a1b8f16035ec3ff`.

Código validado: `8ae335643da56108c6be40243131769c1f15c285`. [Ejecución de validación](https://github.com/jotajotafv/med3d/actions/runs/34869930444): correcta. El commit posterior de entrega añade documentación, originales y evidencias; no cambia el código probado. La entrega queda preparada para revisión del usuario, con las limitaciones de cámara contextual y hardware indicadas abajo; no se presenta como validación clínica ni esqueleto completo.

## Arquitectura y cambios

Se conserva React, TypeScript, Three.js, R3F/Drei, Vite, el enrutamiento, los siete módulos GLB Meshopt, el asset manager, la concurrencia de dos cargas, el catálogo y los IDs estables. Continúan selección por raycast, aislamiento, ocultación, opacidad por sistema, búsqueda global, árbol virtualizado, descarga de regiones y liberación explícita de geometría. No se amplían procedimientos, primeros auxilios ni musculatura.

- Seis vistas anatómicas y encuadre por las ocho esquinas del volumen proyectadas en la base de cámara. El ajuste considera orientación, aspecto y profundidad.
- Distancia mínima y plano cercano proporcionales a la selección; redimensionar conserva el objeto estudiado. Las transiciones usan una base ortogonal interpolada y respetan movimiento reducido.
- El despiece público prioriza Regiones y Estructuras. Sistemas permanece disponible internamente para cuando haya al menos dos sistemas reales solicitados.
- Tipografía educativa de 14 px, controles de 12 px, títulos de ficha de 25 px y árbol con filas de 40 px. Paneles adaptados a portátil y pantallas pequeñas.
- Información técnica en un bloque cerrado; el estado público informa estructuras disponibles. Los sistemas futuros permanecen en el esquema, sin una lista pública de promesas pendientes.
- Breadcrumb navegable y distinción explícita entre sistema, región, grupo, estructura y componente. Acciones de selección antes de la ficha para mantenerlas accesibles.
- Veinte fichas específicas resueltas para 33 estructuras catalogadas, con clasificación, descripción, función, articulaciones documentadas, partes, relaciones y fuentes. El contenido genérico conserva la etiqueta de ficha de familia.
- Instrumentación separada para primera geometría y primer render con los módulos iniciales completos; scripts de funcionalidad, capturas y rendimiento.

## Cobertura, modelos y licencias

| Medida | Valor |
| --- | ---: |
| Huesos convencionales representados | 199 |
| Sesamoideos accesorios | 4 |
| Mallas seleccionables | 205 |
| Nodos de catálogo, incluidos grupos | 249 |
| Módulos GLB regionales | 7 |
| Tamaño total GLB | 3.916.940 bytes |
| Triángulos | 512.450 |
| Buffers geométricos decodificados únicos | 7.609.772 bytes |

El esternón posee tres componentes; por eso el número de mallas no coincide con el número de huesos. La copia duplicada del hioides ya fue eliminada durante la fase 2. Las siete mallas pendientes son el cóccix y martillo, yunque y estribo de ambos lados. **No se declara un esqueleto de 206 huesos completo.**

La geometría visible continúa siendo [BodyParts3D 4.0 / DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/), [CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Los hashes, versiones, autoría, URL originales, conversión global y compresión Meshopt se conservan en `public/models/anatomy/skeletal/`. Los GLB no se han modificado en esta fase; tampoco se han sustituido superficies por primitivas. Sólo se redujo iluminación ambiental/hemisférica para recuperar relieve y se trasladó el indicador de ejes.

Las fuentes candidatas HRA / HuBMAP Pelvis Male v1.3 y OpenEar v2 son CC BY 4.0. La [investigación de registro](phase2.1-registration.md) conserva hashes y matrices originales, conversiones de unidades/ejes y campos finales sin determinar. Los [originales preservados](../research/anatomy/README.md) no se modificaron; el ZIP de 1.334.739 bytes reproduce exactamente los siete modelos originales y cinco metadatos. Se verificó que una extracción independiente reproduce el informe de matrices. Falta demostrar correspondencias anatómicas entre donantes; EPSILON carece de lateralidad primaria resuelta. No se centra cada huesecillo, no se refleja un espécimen ni se coloca el cóccix por ajuste visual.

Higgsfield se utilizó para inspeccionar encabezados espaciales originales de OpenEar y diez transformaciones H5, mediante lecturas parciales de las fuentes científicas oficiales. Permitió distinguir el marco RAS de las superficies/segmentaciones del LPS de volúmenes registrados. También realizó lecturas HTTP públicas para comprobar los hashes del sitio publicado. No se utilizó generación anatómica ni se añadieron modelos sin procedencia.

Las [fichas educativas](phase2.1-education.md) enlazan OpenStax, NLM/NCBI y otras referencias académicas primarias indicadas en cada entrada. Las articulaciones se documentan bibliográficamente; no se deducen de distancia entre mallas.

## Bugs y pruebas

Se corrigieron dos límites del encuadre previo: el cálculo en ejes mundiales podía recortar selecciones oblicuas y el mínimo fijo impedía estudiar cómodamente huesos pequeños. También se corrigió la pérdida de foco al redimensionar y la orientación singular en transiciones hacia vistas superior/inferior. Las regresiones matemáticas cubren seis vistas, tres aspectos, cuatro escalas, direcciones oblicuas, 36 transiciones y límites de plano cercano.

`npm run typecheck`, `npm run verify:anatomy` y `npm run build` pasan localmente. La verificación incluye los GLB reales, integridad/jerarquía, búsqueda, ownership, cancelaciones, resultados tardíos, errores/reintentos, restauración y desplazamientos deterministas. El test de fichas comprueba 20 entradas, 33 estructuras, fuentes y exclusión de grupos/componentes.

La compilación mantiene las 18 rutas estáticas. El motor Three/R3F compartido continúa siendo un chunk grande diferido; no equivale a descargar todos los modelos anatómicos al iniciar.

## Evidencia de navegador y capturas

**26 comprobaciones funcionales aprobadas**, sin errores JavaScript no controlados ni respuestas HTTP inesperadas. Véanse [resultados completos](phase2.1/results/browser-qa.json), [identidad del build](phase2.1/results/build.json) y [manifiesto de capturas](phase2.1/captures/capture-manifest.json).

| Comprobación | Resultado |
| --- | --- |
| Carga, reposo y propiedad | 205 mallas; 512.450 triángulos; render detenido en reposo. |
| Búsqueda | Mayúsculas, acentos, fíbula/peroné, ulna/cúbito y latín comprobados. |
| Árbol | Navegación Home/End/flechas; ancestros visibles; sólo 19 filas montadas en la muestra de 249 nodos. |
| Cámara | Seis vistas; zoom y pan modifican píxeles reales del canvas; selección y foco conservados. |
| Selección | Raycast sobre fémur devuelve su ID; aislamiento 1 draw, ocultación 0, revelado 1. |
| Opacidad / despiece | 10–100 %; Regiones/Estructuras a 100 % conservan ownership y restauración. |
| Educación | Ficha individual, articulaciones, partes y fuentes; texto educativo mínimo observado de 14 px. |
| Carga bajo demanda | Descargar miembro inferior izquierdo libera 33 mallas; buscar tibia vuelve a cargarlo. |
| Liberación completa | 0 bytes y 0 mallas; renderer de 209 a 4 geometrías auxiliares; recarga exacta. |
| Error de red | Conserva 180 mallas sanas; un único intento fallido permanece hasta reintento explícito; segundo intento restaura 205. |
| Responsive | 1366, 1050, 900 y 390 px sin desbordamiento horizontal; búsqueda y paneles operativos. |
| Modelos anteriores | Corazón y ventrículo derecho, pulmones y encéfalo cargan y renderizan. |

La primera ejecución `57bfb18` produjo 30 capturas y aprobó 25 comprobaciones antes de fallar al pulsar reintento en una segunda pestaña WebGL. No se demostró un fallo del gestor: se añadió una regresión que verifica que `setDesired` no reintenta errores y conserva recursos sanos. El ensayo final utiliza una página, mantiene el fallo de transporte hasta el clic y exige exactamente dos solicitudes. No se ocultó el fallo anterior ni se debilitó el criterio de recuperación.

Las capturas finales usan `prefers-reduced-motion: reduce`, una capacidad existente del producto: muestran poses finales y evitan depender de una pausa fija sobre un renderer por software lento. Las pruebas funcionales y las mediciones mantienen animación normal. No se utilizan imágenes generadas ni retoques de los PNG.

Se inspeccionaron visualmente **32 PNG individuales**, por el asistente y una segunda revisión asistida de las vistas anatómicas de detalle. Esto es una revisión de píxeles reales, **no una certificación clínica por un anatomista**. Los [hashes de captura](phase2.1/results/capture-hashes.json) vinculan los archivos al commit probado.

| Capturas | Hallazgo de inspección visual |
| --- | --- |
| 01–04, frontal, posterior y laterales | Cuerpo dentro del encuadre; orientación y bilateralidad visualmente coherentes. No se observan duplicados ni escalas discordantes evidentes. |
| 05, 07, cráneo superior/frontal | Suturas, órbitas y relieve legibles con la iluminación revisada. |
| **06, cráneo inferior con contexto** | **Vista totalmente obstruida por otras estructuras opacas. No es una vista útil para estudiar la base craneal. Se conserva como evidencia de la limitación.** |
| 08–11, columna, tórax, pelvis y mano | Objetivos encuadrados; relaciones espaciales reconocibles. Se recorta anatomía de contexto al enfocar una región, no la selección. |
| 12, pie lateral | Pie completo, con contexto de tibia y peroné; orientación y proporciones coherentes. |
| 13–14, fémur seleccionado/aislado | Cian claramente distinguible; hueso completo sin entrada de cámara en la selección. |
| 15–16, despiece de cuerpo | Regiones y estructuras a 100 % conservan una distribución reconocible, sin direcciones aleatorias ni desapariciones implícitas. |
| 17–20, cráneo, columna, tórax y mano separados | Orden y origen anatómico comprensibles. No se encontró una razón visual para modificar el algoritmo aprobado. |
| 21, tarso aislado separado | Piezas encuadradas; aislamiento solicitado explícitamente, sin ocultación automática. |
| 22–24, carpo seleccionado/transparente/oculto | Estados diferenciables en una región densa; el hueco de la estructura oculta es visible. A gran aumento se aprecia el facetado original. |
| 25, hover | Resalte discreto sobre hueso aislado; no se confunde con cian de selección. |
| 26–28, portátil y tablet | Controles legibles, paneles utilizables, indicador de ejes separado de controles. |
| 29–30, móvil y ficha | Botones por encima del canvas; cráneo ya no queda cubierto; contenido educativo y acciones legibles. |
| 31–32, tarso superior y base craneal aislados | Superficies visibles y correctamente encuadradas mediante aislamiento explícito. |

Los primeros PNG permitieron corregir botones móviles sobre el cráneo, indicador de ejes superpuesto a controles, título poco legible sobre huesos de contexto y sombreado demasiado plano. La regresión móvil exige que el canvas comience debajo de los botones. La segunda serie confirma esas correcciones.

**Límite de cámara que permanece:** enfocar ajusta el volumen seleccionado, no calcula colisiones contra todas las mallas de contexto. Por ello la vista superior del tarso y la inferior del cráneo pueden situarse tras/dentro de otra superficie opaca y quedar bloqueadas. La vía de estudio comprobada es pulsar **Aislar** antes de escoger esa vista, o usar otra orientación. No se presenta el aislamiento como una solución de colisiones automática. No se ha ocultado ni hecho transparente anatomía por cambiar de perspectiva.

## Rendimiento y límites

El [método de medición](phase2.1-performance.md) separa tiempos del gestor, marcas desde navegación, transferencias, FPS durante interacción, buffers geométricos y heap JavaScript. El entorno disponible utiliza Chromium con ANGLE SwiftShader y HTTP local; no es una GPU física.

| Medida, ejecución de rendimiento | Resultado |
| --- | ---: |
| Primera geometría / sistema completo, desde gestor | 222,9 / 222,9 ms |
| Ambas marcas respecto a navegación | 974,7 ms |
| Rotación / despiece, SwiftShader | 2,43 / 1,91 FPS |
| Búsqueda, evento → actualización DOM | 1,5–3,1 ms |
| Descargar región / buscar y recargarla | 1.860,6 / 1.355,9 ms |
| Liberar / recargar sistema completo | 1.512,9 / 1.222,3 ms |
| Buffers geométricos inicial / descargado / recargado | 7.609.772 / 0 / 7.609.772 bytes |
| Heap JS usado inicial / descargado / recargado | 11.398.576 / 13.048.948 / 13.926.156 bytes |
| Llamadas de dibujo con cuerpo completo | 205 |

La prueba funcional independiente observó primera geometría a 239 ms y sistema completo a 1.558 ms desde gestor; el mejor caso de HTTP local no es una promesa de carga pública. Los FPS medidos son bajos en software y las muestras contienen sólo siete y seis frames. No demuestran fluidez en hardware objetivo. El heap no volvió al valor inicial durante esta muestra; no se forzó GC. La liberación afirmada corresponde a buffers y recursos geométricos verificables, no a liberar toda la memoria del proceso.

No se dispone de mediciones en desktop, portátil integrado, móvil de gama media o tablet físicos. Los viewports responsive verifican presentación, no capacidad de esos dispositivos. No se promete rendimiento equivalente en GPU móvil ni se extrapola una prueba de 10.000 metadatos a 10.000 mallas simultáneas.

La cobertura pendiente, el registro entre fuentes y la revisión anatómica por especialistas siguen siendo límites explícitos. No se incorporan batching, BVH o LOD sin un problema medido; sus posibles aplicaciones están documentadas sin sacrificar selección individual.

## Publicación y siguiente fase

Publicado en [MED3D — Anatomía](https://jotajotafv.github.io/med3d/anatomia/). El [despliegue del código probado](https://github.com/jotajotafv/med3d/actions/runs/34871253678) finalizó correctamente. Se comprobaron **35 recursos públicos con HTTP 200 y SHA-256 idéntico** al build validado: entradas HTML, bundles principales, visor/estilos del atlas, catálogo y siete GLB. Los resultados están en [deployment.json](phase2.1/results/deployment.json). El commit de entrega añade evidencias y conserva el código probado `8ae3356`; su identificador definitivo se comunica en la entrega y queda en la historia Git, evitando una referencia circular dentro del propio commit.

El sistema óseo proporciona un patrón técnico y educativo reutilizable: catálogo, procedencia, módulos, ownership, búsqueda, fichas y pruebas visuales. **No se considera cerrado el rendimiento sobre dispositivos físicos ni resuelto el registro de los siete huesos pendientes.** Tampoco se afirma que todas las vistas contextuales sean útiles sin aislamiento. Se entrega para revisión con estos límites explícitos; no se inicia el sistema muscular, procedimientos ni primeros auxilios nuevos.
