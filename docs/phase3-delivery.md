# Entrega de Fase 3A — piloto muscular bilateral de hombro y brazo

Base autorizada y comprobada en `main`: `ac8631fd2a22509992e6058fcfdc292ecb212bf6`. Fecha de preparación: 21 de septiembre de 2026.

**Estado: piloto terminado y publicado, con código y geometría verificados en CI, revisión visual completada y recursos públicos cotejados, sobre `8c2a9cdd67a482459de106dfc87843502c1c0643`.** La ejecución final completó 30 comprobaciones funcionales del piloto, 26 regresiones óseas, una regresión dirigida del árbol, 38 capturas del piloto, 32 capturas de referencia ósea y tres configuraciones de rendimiento. La revisión de imágenes se distingue de su generación en el punto 16. Los resultados históricos de Fase 2.1 no se trasladan al piloto.

Documentos de respaldo: [validación](phase3-validation.md), [registro](phase3-registration.md), [fuentes](phase3-model-sources.md) y [rendimiento](phase3-performance.md). Se conserva la investigación previa como antecedente.

## 1. Cambios realizados

Se incorporó exclusivamente el piloto autorizado: ocho músculos de cada lado, representados por 26 elementos originales, sobre el sistema óseo existente. No se incorporaron músculos de torso, piernas o cabeza ni se procesó el inventario de 403 candidatos.

El atlas compone ambos catálogos bajo «Cuerpo humano», conserva los identificadores óseos y añade capas y opacidades independientes. Los músculos y sus componentes tienen selección por árbol, búsqueda y raycasting, enfoque, aislamiento, ocultación, restauración y fichas propias. La búsqueda distingue tipos y mantiene el acceso a corazón, pulmones y encéfalo.

Se corrigió el despiece por sistemas, se definió una separación regional coherente y se conservaron porciones/cabezas como componentes. La interfaz incluye contexto músculo-hueso documentado, seis vistas y controles adaptados a los cuatro anchos solicitados. El árbol conserva virtualización y mantiene visible la fila seleccionada después de expandirse o cambiar el tamaño del panel. El resultado final de estas interacciones en navegador se registra en el punto 15.

## 2. Fuente y procedencia

**BodyParts3D 4.0 OBJ99 / DBCLS**, distribución del 19 de junio de 2013, bajo la [declaración vigente CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). La [comparación de fuentes](phase3-model-sources.md) conserva la evaluación de HRA/HuBMAP, Visible Human y Z-Anatomy, además de las limitaciones científicas de BP3D.

Se extrajeron mediante HTTP Range únicamente los 26 miembros aprobados del [ZIP oficial](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip). La extracción registró 1.160.597 bytes transferidos. Se conservan los bytes originales, FJ, FMA, lateralidad, tamaños y hashes individuales; el hash histórico del archivo oficial completo no se presenta como recalculado en esta extracción parcial.

| Evidencia preservada | Contenido |
| --- | --- |
| [Originales del piloto](../research/anatomy/muscular-pilot-originals.zip) | Los 26 OBJ fuente, sin generar un lado mediante reflexión del otro |
| [Bloqueo de fuentes](../research/anatomy/muscular-pilot-source-lock.json) | URL, rangos leídos, tamaños, hashes y correspondencias originales |
| [Manifiesto de conversión](../public/models/anatomy/muscular/source-manifest.json) | Original → FMA/FJ/lado → nodo → módulo, atribución y transformación |
| [Validación numérica](../public/models/anatomy/muscular/validation.json) | Métricas y comprobación de cada elemento y de ambos GLB decodificados |

BP3D es un atlas modelado con trabajo CAD y referencias anatómicas; no demuestra que cada músculo y hueso sea una segmentación independiente de un único donante. Su documentación histórica describe construcción por simetría. Estas limitaciones permanecen visibles y no se sustituyen por una declaración de precisión clínica.

## 3. Lista exacta de músculos y componentes integrados

Los ocho músculos son deltoides, bíceps braquial, tríceps braquial, braquial, supraespinoso, infraespinoso, redondo menor y subescapular. Cada uno está representado a derecha e izquierda: **16 unidades musculares**. Deltoides aporta tres porciones por lado; bíceps, dos cabezas; tríceps, tres cabezas. Los otros cinco músculos aportan un elemento por lado.

| Músculo | Componente fuente | Derecho: FMA / FJ | Izquierdo: FMA / FJ |
| --- | --- | --- | --- |
| Deltoides | Porción clavicular | FMA34680 / FJ1468 | FMA34681 / FJ1468M |
| Deltoides | Porción acromial | FMA34682 / FJ1467 | FMA34683 / FJ1467M |
| Deltoides | Porción espinal | FMA34684 / FJ1513 | FMA34685 / FJ1513M |
| Bíceps braquial | Cabeza corta | FMA37684 / FJ1512 | FMA37685 / FJ1512M |
| Bíceps braquial | Cabeza larga | FMA37686 / FJ1478 | FMA37687 / FJ1478M |
| Tríceps braquial | Cabeza medial | FMA37695 / FJ1480 | FMA37696 / FJ1480M |
| Tríceps braquial | Cabeza lateral | FMA37697 / FJ1477 | FMA37698 / FJ1477M |
| Tríceps braquial | Cabeza larga | FMA37699 / FJ1479 | FMA37700 / FJ1479M |
| Braquial | Músculo indiviso en el piloto | FMA37668 / FJ1486 | FMA37669 / FJ1486M |
| Supraespinoso | Músculo indiviso en el piloto | FMA32544 / FJ1506 | FMA32545 / FJ1506M |
| Infraespinoso | Músculo indiviso en el piloto | FMA32547 / FJ1500 | FMA32548 / FJ1500M |
| Redondo menor | Músculo indiviso en el piloto | FMA32553 / FJ1508 | FMA32554 / FJ1508M |
| Subescapular | Músculo indiviso en el piloto | FMA13414 / FJ1504 | FMA13415 / FJ1504M |

La tabla contiene 13 elementos de cada lado, 26 en total. Las 16 cabezas/porciones geométricas pertenecen a seis músculos compuestos bilaterales; no incrementan el conteo de músculos. Los otros diez elementos representan diez músculos indivisos. No se declara que el piloto contenga todos los músculos del hombro y brazo.

## 4. Número de meshes

| Cobertura | Mallas | Módulos |
| --- | ---: | ---: |
| Muscular derecho | 13 | 1 |
| Muscular izquierdo | 13 | 1 |
| Piloto muscular total | 26 | 2 |
| Sistema óseo conservado | 205 | 7 |
| Atlas óseo + piloto muscular | 231 | 9 |

Los 26 elementos musculares conservan propietarios identificables para raycasting y navegación. Los tres órganos anteriores utilizan sus escenas independientes y no se incluyen en este total corporal.

## 5. Triángulos

El piloto suma **39.604 triángulos**, 19.802 por lado. El sistema óseo conserva 512.450; la configuración conjunta suma 552.054.

La conversión final no introduce simplificación adicional. La verificación compara el multiconjunto completo de triángulos orientados, incluidas repeticiones, y conserva las posiciones originales utilizadas por caras. Las normales de visualización se cuantizan a 12 bits; las posiciones se mantienen en Float32.

## 6. Tamaño GLB

| Módulo | Bytes | Vértices GLB | Materiales | Accessors decodificados, bytes |
| --- | ---: | ---: | ---: | ---: |
| `muscular-upper-right.glb` | 269.856 | 17.387 | 1 | 431.778 |
| `muscular-upper-left.glb` | 270.076 | 17.370 | 1 | 431.472 |
| Total muscular | **539.932** | **34.757** | 2 entre ambos módulos | **863.250** |

Compresión: `EXT_meshopt_compression`, con `KHR_mesh_quantization` para los atributos que la requieren. Se comprimen sin pérdida los valores Float32 finales de posición. Los dos GLB previos a compresión sumaban 1.091.620 bytes. Los vértices GLB incluyen distinciones de normales y no equivalen a posiciones únicas del OBJ.

| Archivo final | SHA-256 |
| --- | --- |
| `muscular-upper-right.glb` | `9aea14bb438f006103f48cf0f42cd2c9d58031973a0e3c355c033f880b719d21` |
| `muscular-upper-left.glb` | `1a5885fe1258bde59dfc88437726f3ddb9db7dee4c3e4c2ae834feb701c3b559` |

Los hashes figuran en la [evidencia numérica](../public/models/anatomy/muscular/validation.json). El tamaño GLB representa transferencia de archivos; los accessors no equivalen a VRAM ni a la memoria total del navegador.

## 7. Transformación utilizada

La conversión es exactamente **`(x, y, z) → (x, z, −y) / 1000`**: escala uniforme 0,001, rotación de −90° alrededor de X y traslación nula. Con vectores columna:

```text
T_fuente_a_catalogo =
[[0.001, 0,      0,     0],
 [0,     0,      0.001, 0],
 [0,    -0.001,  0,     0],
 [0,     0,      0,     1]]
```

No hay normalización, centrado, escala ni ajuste de rotación por músculo. No se estima un registro nuevo entre sujetos.

El renderer aplica una transformación común de presentación `G`: `s = 3.45 / max(extensiones del marco, 0.001)` y traslación `−s × centro del marco`. El marco estable es `bodyparts3d-4.0-male`, procedente del catálogo óseo completo; no cambia al activar o descargar regiones. La cadena es `G × T_fuente_a_catalogo`. Los desplazamientos de Exploded View son una operación adicional de presentación y no forman parte de T.

## 8. Evidencia de compatibilidad

La auditoría previa encontró igualdad exacta de SHA-256 y tamaño en los originales de clavícula, escápula y húmero de ambos lados respecto a las fuentes bloqueadas del esqueleto MED3D. Las cabeceras y metadatos de los archivos musculares identifican la misma versión 4.0.

La comparación numérica del piloto parte de las coordenadas OBJ originales en doble precisión y del GLB final decodificado. La tolerancia fijada es **0,05 mm**, exclusivamente para error euclídeo numérico. El máximo observado es **5,998506872432111 × 10⁻⁸ m**, aproximadamente **0,0000599851 mm**; el máximo error de límites es **0,0000574112 mm**. Se verifican las 26 piezas y los 39.604 triángulos orientados.

Estos resultados acreditan conservación técnica del marco y de la geometría convertida. No miden el error anatómico entre tejidos, las zonas de inserción, contactos, ausencia de penetraciones ni precisión clínica. La evidencia visual conjunta, su alcance y las limitaciones observadas se documentan en el punto 16.

## 9. Catálogo multisistema

Se conservan [skeletal/catalog.json](../public/models/anatomy/skeletal/catalog.json) y [muscular/catalog.json](../public/models/anatomy/muscular/catalog.json). La composición corporal se realiza en memoria y no muta los catálogos fuente. «Cuerpo humano» es una raíz neutral, sin `systemId` óseo ni muscular.

La rama muscular distingue miembro superior de cada lado, hombro, brazo y compartimentos anterior y posterior. El deltoides y los cuatro músculos del manguito se sitúan bajo hombro; bíceps y braquial, en el compartimento anterior del brazo; tríceps, en el posterior. La pertenencia se cura anatómicamente; una relación fuente `is_a` no se convierte automáticamente en `part_of`.

Las unidades compuestas utilizan padres propios y conservan hojas `bp3d:FMA…` para los componentes. Los IDs óseos, su inventario y sus rutas permanecen estables. La búsqueda muestra nombre, tipo, sistema y región; identifica componentes frente a músculos y conserva acceso a los exploradores de órganos anteriores.

## 10. Capas

Óseo y muscular disponen de activación independiente, opacidad propia y selección de módulos. El estado inicial carga ambos sistemas; `?systems=skeletal` o `?systems=muscular` permiten elegir una configuración inicial, que se conserva al restablecer.

Desactivar un sistema libera sus geometrías sin destruir las del otro. La activación posterior recupera la selección de módulos de ese sistema. Salir del aislamiento conserva una capa que el usuario haya desactivado explícitamente.

Las pruebas aprobaron cada módulo muscular por separado, ambos juntos, sólo óseo, sólo muscular y combinación. También aprobaron memoria de módulos/opacidades, descarga sin destruir el otro sistema y cambios rápidos de capas; véase la ejecución final del punto 15.

## 11. Transparencia

Los músculos utilizan rojo moderado con variación tonal sutil por familia. Hover y selección tienen apariencias distintas; la selección mantiene el cian. No se generan texturas anatómicas ni colores aleatorios por músculo.

Se utiliza transparencia estándar de Three.js. Por debajo del 100 % se mantienen prueba de profundidad, materiales `DoubleSide` y `depthWrite=false`; no se incorpora OIT. Las pruebas aprobaron muscular al 100, 75, 50, 25 y 10 % sobre óseo al 100 %, además de opacidad ósea independiente, selección y hover.

La inspección de las seis imágenes de opacidad observó bandas oscuras y acumulación de color en superficies superpuestas, especialmente sobre el deltoides al 75 % y 50 %. Al 25 % y 10 %, húmero y cabeza humeral se distinguen bajo la envoltura tenue; la selección al 50 % conserva un cian diferenciable. No se observaron inversiones evidentes de profundidad en estas vistas estáticas, sin demostrar orden perfecto durante cualquier giro ni transmisión físicamente uniforme. Los porcentajes describen materiales individuales, no la transparencia resultante de todas las capas superpuestas.

## 12. Exploded View

| Nivel | Comportamiento implementado | Límite didáctico |
| --- | --- | --- |
| Sistemas | Cada sistema se desplaza como bloque coherente sobre X, a ±0,16 veces la extensión corporal máxima; no depende de que sus centroides sean diferentes | Presentación determinista, sin modificar el registro de reposo |
| Regiones | Cada miembro superior mantiene un bloque compartido por sus músculos y huesos | Hombro y brazo se navegan y enfocan por separado, pero no se separan como bloques que rompan los músculos que cruzan articulaciones |
| Estructuras | Porciones del deltoides y cabezas del bíceps/tríceps se abren respecto a su padre, con desplazamiento acotado | Conserva la identificación del músculo y de cada componente |

Al 0 % se copia la posición original de las mallas. Las pruebas aprobaron determinismo, coherencia del bloque por sistema, desplazamientos distintos de las cabezas y retorno exacto a reposo. Las capturas muestran separación de sistemas y regiones; en componentes persisten solapes parciales. Las dos cabezas del bíceps continúan muy superpuestas incluso al 100 % de despiece. Por tanto, desplazamientos diferentes no equivalen a separación visual completa de todas las piezas; se conserva como limitación didáctica, sin modificar el registro para ocultarla.

## 13. Fichas

La infraestructura se divide en `AnatomyInformation`, `BoneInformation` y `MuscleInformation`. El componente óseo conserva su implementación. Las ocho fichas de familia muscular se aplican a las 16 unidades laterales; las cabezas y porciones muestran su origen y acción específicos cuando corresponde.

Cada ficha incluye nombre, latín, sistema, región, grupo/compartimento, descripción, función, acción, origen, inserción, inervación, relaciones y fuentes enlazadas. La prueba de navegador confirmó un mínimo de 14 px en el cuerpo educativo muscular. Las fichas describen anatomía general documentada, no mediciones del ejemplar BP3D.

Fuentes principales: [OpenStax 11.5](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-5-muscles-of-the-pectoral-girdle-and-upper-limbs), las ocho fichas institucionales de [University of Washington Muscle Atlas](https://rad.uw.edu/muscle-atlas/deltoid) enlazadas individualmente en la interfaz y [Sawyer et al., 2020](https://pmc.ncbi.nlm.nih.gov/articles/PMC7345276/) para la contribución radial variable al braquial. Se conservan orígenes e inserciones como texto; no se inventan puntos ni áreas en superficies.

## 14. Contexto músculo-hueso

«Mostrar contexto» limita explícitamente la vista al músculo o componente seleccionado y a huesos ipsilaterales sustentados por sus orígenes e inserciones. La selección sigue destacando la estructura muscular. «Mostrar todas las piezas» elimina el filtro.

| Estructura seleccionada | Huesos documentados del mismo lado |
| --- | --- |
| Deltoides completo | Clavícula, escápula y húmero |
| Deltoides, porción clavicular | Clavícula y húmero |
| Deltoides, porción acromial o espinal | Escápula y húmero |
| Bíceps braquial o cualquiera de sus cabezas | Escápula y radio |
| Tríceps braquial completo | Escápula, húmero y cúbito |
| Tríceps, cabeza medial o lateral | Húmero y cúbito |
| Tríceps, cabeza larga | Escápula y cúbito |
| Braquial | Húmero y cúbito |
| Supraespinoso, infraespinoso, redondo menor o subescapular | Escápula y húmero |

El conjunto surge de asociaciones semánticas curadas con IDs óseos explícitos. No se calculan vecinos por distancia ni se agregan huesos del lado contrario. Una cabeza no hereda el origen de sus hermanas. El contexto presenta huesos completos, sin afirmar que esté delimitada una huella de inserción.

## 15. Pruebas

La [ejecución final 35554899964](https://github.com/jotajotafv/med3d/actions/runs/35554899964) terminó correctamente sobre `8c2a9cdd67a482459de106dfc87843502c1c0643`. Todos los informes funcionales finales declaran `success: true`, sin errores de navegador no controlados ni respuestas HTTP de error. El fallo de red deliberadamente provocado tiene su recuperación comprobada por separado.

| Área | Cobertura comprobada | Resultado |
| --- | --- | --- |
| Fuentes y conversión | 26 bindings, hashes, lateralidad, posiciones usadas y multiconjunto de triángulos orientados | 26 elementos conservados; error máximo numérico 5,998506872432111 × 10⁻⁸ m |
| Formato glTF | Ambos archivos finales y representación decodificada | Cero errores y cero advertencias; dos mensajes informativos por GLB comprimido |
| Catálogo | Raíz neutral, 16 unidades, 26 mallas, IDs óseos estables, marcos compatibles y rechazo de duplicados/incompatibilidades | Pruebas del catálogo compuesto aprobadas |
| Fichas/contexto | 26 hojas con ficha, 16 unidades musculares, alcance de componentes, huesos ipsilaterales y guardas ante ausencias | Pruebas aprobadas; cuerpo educativo mínimo de 14 px |
| Gestor | Nueve GLB reales, carga por lado, conservación del otro sistema, descarga, ciclos sin crecimiento y fallo parcial con reintento explícito | Pruebas de recursos y ciclo de vida aprobadas |
| Piloto en navegador | Capas, materiales, raycast real, hover/selección, búsqueda, árbol/teclado, aislamiento, ocultación, contexto, seis vistas, despiece, responsive y órganos anteriores | **30 comprobaciones aprobadas** |
| Regresión ósea en navegador | Carga, búsqueda, árbol, cámara, fichas, selección, ocultación, opacidad, despiece, descarga/recarga, responsive, órganos y fallo recuperable | **26 comprobaciones aprobadas** |
| Regresión dirigida del árbol | Historial de capturas, «Expandir todo» y movimiento reducido | **1 comprobación aprobada** |
| Capturas | Piloto y referencia ósea sobre este mismo código | 38 del piloto y 32 de referencia generadas; revisión separada en el punto 16 |
| Rendimiento | Óseo, muscular y conjunto | Tres perfiles medidos, descritos en el punto 17 |

La ruta `?qa=1` permite inspeccionar en modo de sólo lectura posiciones, visibilidad y materiales de objetos Three.js reales. Las pruebas también ejecutaron raycasting sobre el lienzo; seleccionó un componente del deltoides con ID `bp3d:FMA34684`. «Mostrar contexto» del bíceps derecho produjo exactamente escápula derecha, radio derecho y sus dos cabezas musculares.

Evidencias: [30 comprobaciones del piloto](phase3/results/pilot-functional.json), [26 regresiones óseas](phase3/results/browser-qa.json), [regresión dirigida del árbol](phase3/results/pilot-tree.json), [validación glTF](phase3/results/gltf-validation.json) y [manifiesto de la referencia ósea](phase3/results/capture-manifest.json). Los informes conservan las correcciones de capas desactivadas, cámara sobre selección oculta y árbol móvil. La batería ósea se volvió a ejecutar; sus 26 resultados no son una reutilización del informe histórico. Las ejecuciones iniciales fallidas y el diagnóstico del árbol se preservan en [validación](phase3-validation.md).

## 16. Capturas revisadas

La ejecución final produjo 38 capturas reales del piloto y 32 de referencia ósea desde la compilación de producción de `8c2a9cd`. El manifiesto registra selección, cámara, posiciones, visibilidad y opacidad de las mallas. Generar los archivos se distingue de revisarlos; la inspección se orienta a lateralidad, escala, desplazamientos, flotación, penetraciones sospechosas, selección y transparencia.

| Número solicitado | Escena | Archivo de la ejecución final |
| --- | --- | --- |
| 01 | Anterior óseo + muscular | [01-anterior-oseo-muscular.png](phase3/captures/01-anterior-oseo-muscular.png) |
| 02 | Posterior óseo + muscular | [02-posterior-oseo-muscular.png](phase3/captures/02-posterior-oseo-muscular.png) |
| 03 | Lateral derecho | [03-lateral-derecho.png](phase3/captures/03-lateral-derecho.png) |
| 04 | Lateral izquierdo | [04-lateral-izquierdo.png](phase3/captures/04-lateral-izquierdo.png) |
| 05 | Hombro derecho | [05-hombro-derecho.png](phase3/captures/05-hombro-derecho.png) |
| 06 | Hombro izquierdo | [06-hombro-izquierdo.png](phase3/captures/06-hombro-izquierdo.png) |
| 07 | Brazo derecho | [07-brazo-derecho.png](phase3/captures/07-brazo-derecho.png) |
| 08 | Brazo izquierdo | [08-brazo-izquierdo.png](phase3/captures/08-brazo-izquierdo.png) |
| 09 | Deltoides seleccionado | [09-deltoides-seleccionado.png](phase3/captures/09-deltoides-seleccionado.png) |
| 10 | Deltoides aislado | [10-deltoides-aislado.png](phase3/captures/10-deltoides-aislado.png) |
| 11 | Bíceps seleccionado | [11-biceps-seleccionado.png](phase3/captures/11-biceps-seleccionado.png) |
| 12 | Bíceps aislado | [12-biceps-aislado.png](phase3/captures/12-biceps-aislado.png) |
| 13 | Tríceps | [13-triceps.png](phase3/captures/13-triceps.png) |
| 14 | Manguito rotador posterior | [14-manguito-rotador-posterior.png](phase3/captures/14-manguito-rotador-posterior.png) |
| 15 | Subescapular | [15-subescapular.png](phase3/captures/15-subescapular.png) |
| 16 | Muscular 50 % + óseo 100 % | [16-muscular-50-oseo-100.png](phase3/captures/16-muscular-50-oseo-100.png) |
| 17 | Sólo músculos | [17-solo-musculos.png](phase3/captures/17-solo-musculos.png) |
| 18 | Sólo huesos | [18-solo-huesos.png](phase3/captures/18-solo-huesos.png) |
| 19 | Exploded View de sistemas | [19-exploded-sistemas.png](phase3/captures/19-exploded-sistemas.png) |
| 20 | Exploded View de regiones | [20-exploded-regiones.png](phase3/captures/20-exploded-regiones.png) |
| 21 | Exploded View de estructuras | [21-exploded-estructuras.png](phase3/captures/21-exploded-estructuras.png) |
| 22 | Laptop | [22-laptop-1366.png](phase3/captures/22-laptop-1366.png) |
| 23 | Tablet | [23-tablet-900.png](phase3/captures/23-tablet-900.png) |
| 24 | Móvil | [24-movil-390.png](phase3/captures/24-movil-390.png) |

El protocolo añade los anchos 1366/1050/900/390 px, estados de transparencia y vistas complementarias del manguito. Cuando se oculta el deltoides para mostrar estructuras profundas, la acción es explícita y debe quedar identificada en la evidencia.

El [manifiesto del piloto](phase3/results/pilot-captures.json) contiene 38 entradas y declara generación exitosa. La revisión específica de las seis imágenes de opacidad y los dos paneles móviles se completó: registra bandas de superposición, cian legible y paneles abiertos voluntariamente, sin recorte horizontal. El panel de capas y la ficha requieren desplazamiento vertical; las secciones inferiores no aparecen en su primera pantalla. El botón de cierre permanece visible y el panel no está abierto permanentemente.

Se completó la revisión de las **38 imágenes del piloto** mediante siete hojas de contacto, con inspección individual adicional de opacidades, móvil, manguito, contexto y despiece. No se identificó un impedimento visual que bloquee la entrega del piloto en las vistas revisadas. Se conservan los hallazgos de bandas por superposición, oclusión de músculos profundos y solapes de componentes, especialmente bíceps; la inspección no prueba ausencia de penetraciones en toda la anatomía ni constituye certificación clínica. Véase el [informe de revisión visual](phase3/results/visual-review.md).

## 17. Rendimiento

La ejecución final midió los recursos geométricos reales y los tiempos de interacción de las tres configuraciones:

| Configuración | Módulos | Bytes GLB | Mallas | Triángulos | Bytes de geometría del gestor |
| --- | ---: | ---: | ---: | ---: | ---: |
| Óseo | 7 | 3.916.940 | 205 | 512.450 | 7.609.772 |
| Muscular piloto | 2 | 539.932 | 26 | 39.604 | 932.764 |
| Conjunto | 9 | 4.456.872 | 231 | 552.054 | 8.542.536 |

La memoria del gestor suma los `ArrayBuffer` únicos de atributos e índices de `BufferGeometry` tras decodificar, incluida su capacidad asignada. Las transformaciones permanecen en los objetos 3D y no se hornean en esos buffers. Esta cifra no representa heap total ni VRAM. La concurrencia se mantiene en dos cargas; no se introducen BVH, LOD ni batching sin un problema medido.

| Medición final en navegador | Sólo óseo | Sólo muscular | Conjunto |
| --- | --- | --- | --- |
| Draw calls iniciales | 205 | 26 | 231 |
| Primera geometría, ms | 244,4 | 154,8 | 233,8 |
| Carga completa, ms | 1.494,8 | 154,9 | 233,9 |
| Descargar capa, ms | 279,0 | 422,0 | 2.207,6 |
| Reactivar capa, ms | 519,4 | 285,6 | 897,5 |
| Aislamiento, ms | 611,1 | 156,6 | 1.050,0 |
| Búsqueda, ms | 41,3 | 34,9 | 52,9 |
| Primera respuesta del despiece, ms | 313,0 | 69,1 | 410,6 |
| Heap JS usado tras interacciones, bytes | 15.720.048 | 22.359.516 | 15.112.284 |

**Informe final:** [pilot-performance.json](phase3/results/pilot-performance.json), ejecución 35554899964, con `success: true`. La primera geometría y la carga completa se miden hasta el primer render correspondiente desde la creación del gestor. Los tiempos de interacción incluyen automatización y actualización de interfaz; la primera respuesta del despiece no mide el final de su animación. En la configuración conjunta se descarga/reactiva la capa muscular y se conserva la ósea.

Son observaciones de una ejecución secuencial en el mismo navegador, con posible calentamiento del runtime y del decodificador; no constituyen medias ni comparación controlada entre arranques fríos. La carga conjunta más corta observada no demuestra que nueve módulos carguen sistemáticamente más rápido que siete. El heap se toma tras las interacciones y depende de documentos retenidos y recolección; no permite comparar memoria intrínseca de sistemas ni demostrar por sí solo ausencia de fugas. Los ciclos de descarga/recarga sí verifican que los buffers geométricos regresan a su tamaño previsto.

El entorno de CI utiliza Chromium con ANGLE SwiftShader, rasterización por software, y un servidor HTTP local sin limitación artificial de red. No se extrapolan sus FPS a GPU física ni su carga a redes móviles. Rendimiento térmico, batería y memoria en dispositivos reales permanecen sin evaluar.

## 18. Bugs

| Problema detectado | Corrección implementada | Validación final |
| --- | --- | --- |
| El despiece por sistemas podía quedar casi inmóvil con centros coincidentes | Desplazamiento determinista por rol de sistema sobre X | Prueba de posiciones deterministas y captura 19 completadas |
| La cuantización de posiciones a 16 bits volvía ambiguas las correspondencias entre vértices fuente cercanos | Se descartó esa variante y se conservaron posiciones Float32, con Meshopt y cuantización sólo de normales | La evidencia numérica final conserva los 39.604 triángulos |
| Salir del aislamiento podía reactivar una capa que el usuario había desactivado | Salir del aislamiento preserva selección de capas y módulos | Aprobada la conservación de capa desactivada al salir del aislamiento |
| Una selección oculta impedía ejecutar una nueva vista de cámara | El enfoque utiliza sus límites anatómicos decodificados sin volverla visible | Aprobada la vista posterior sin revelar la selección ni cambiar las mallas |
| La fila seleccionada podía quedar fuera de la ventana del árbol virtualizado tras expandirlo o cambiar el panel | Se sincroniza el desplazamiento y se recupera la selección al reabrir el panel móvil. El diagnóstico confirmó además una transición de altura introducida por movimiento reducido: espaciador y filas virtuales ahora excluyen transiciones | Aprobadas la regresión dirigida de movimiento reducido, la navegación por teclado y la reapertura móvil |

Las regresiones finales de estos problemas pasaron sobre `8c2a9cd`. Las primeras ejecuciones fallidas siguen preservadas y no se presentan como aprobadas. En las baterías finales no hubo errores de navegador no controlados ni respuestas HTTP fallidas. Permanecen las limitaciones visuales de superposición en transparencia y despiece, y las oclusiones de músculos profundos; no se afirma ausencia universal de bugs.

## 19. Limitaciones

- Cobertura limitada a 16 unidades musculares de hombro y brazo; no cubre toda la musculatura regional ni corporal.
- BP3D conserva naturaleza modelada y limitaciones históricas de simetría. La identidad de paquete no certifica registro clínico entre tejidos.
- El error numérico de conversión no expresa precisión anatómica. Contactos e inserciones necesitan revisión independiente; no hay anotaciones geométricas válidas de origen/inserción.
- Transparencia estándar por objetos: bandas oscuras y acumulación de color observadas en superficies superpuestas; las vistas estáticas no acreditan orden perfecto en todas las rotaciones.
- Las seis vistas y el enfoque no resuelven colisiones u oclusiones de cámara. Músculos profundos pueden requerir Aislar u ocultación explícita de estructuras.
- El despiece regional conserva cada miembro superior como bloque compartido; hombro y brazo no se separan en bloques independientes. En despiece de componentes persisten solapes; las cabezas del bíceps siguen muy superpuestas incluso al 100 %.
- En móvil, los paneles abiertos voluntariamente cubren gran parte del modelo y necesitan desplazamiento vertical. Se pueden cerrar; el modelo vuelve a ocupar el espacio.
- CI y responsive de escritorio simulan tamaños CSS; no equivalen a pruebas de GPU física, batería o memoria móvil.
- Cóccix, martillo izquierdo, yunque izquierdo, estribo izquierdo, martillo derecho, yunque derecho y estribo derecho siguen pendientes. Se conservan fuentes y matrices. No se declara un esqueleto completo de 206 huesos ni se añaden piezas artificialmente para alcanzar ese número.

## 20. Commit de código probado

Código probado: [`8c2a9cdd67a482459de106dfc87843502c1c0643`](https://github.com/jotajotafv/med3d/commit/8c2a9cdd67a482459de106dfc87843502c1c0643). La [ejecución 35554899964](https://github.com/jotajotafv/med3d/actions/runs/35554899964) y el [archivo de build](phase3/results/build.json) vinculan ese SHA con las baterías finales, las 38 capturas del piloto, la referencia ósea y las tres mediciones. Las ejecuciones anteriores se conservan como historial de diagnóstico, no como evidencia final de aprobación.

## 21. Commit de entrega

El commit de entrega incorpora esta versión de la documentación y sus evidencias sobre el código probado del punto 20. Su SHA no puede escribirse dentro de su propio contenido sin cambiarlo. Se obtiene desde el repositorio mediante:

```sh
git log -1 --format=%H -- docs/phase3-delivery.md
```

El SHA exacto se proporciona en la respuesta final de entrega. Los cambios de cierre son documentales; cualquier modificación posterior de implementación requiere volver a evaluar el alcance de las pruebas.

## 22. URL publicada

Publicado y verificado: [MED3D · atlas anatómico](https://jotajotafv.github.io/med3d/anatomia/).

El [despliegue 35556168389](https://github.com/jotajotafv/med3d/actions/runs/35556168389) terminó correctamente sobre el código probado. La [verificación HTTP pública](phase3/results/deployment.json) obtuvo coincidencia de tamaño y SHA-256 en **73 recursos, 12.825.058 bytes**, contra una compilación local del mismo SHA y dependencias bloqueadas. Incluye las 18 rutas HTML, los paquetes JavaScript/CSS, nueve módulos GLB corporales, catálogos y archivos de procedencia, y los modelos de los órganos anteriores. No hubo recursos fallidos ni fue necesario reintentar.

Esta comprobación acredita la identidad de los recursos servidos; las interacciones WebGL se probaron en Chromium de CI sobre el mismo código, no se presentan como una nueva sesión interactiva del sitio público. El commit de cierre añade únicamente documentación y evidencias; conserva la implementación y los recursos de producción del SHA probado.

## 23. Tu conclusión sobre si Fase 3A está suficientemente validada para autorizar Fase 3B

La conversión verificada, la arquitectura multisistema y las regresiones finales aportan evidencia suficiente de funcionamiento técnico del piloto en el entorno de CI. Se han medido las tres configuraciones y se conservan las limitaciones de transparencia, oclusión, despiece y rendimiento en software. No se presenta como certificación clínica ni como validación de GPU física.

La revisión de las 38 capturas no identificó un impedimento visual para entregar este piloto educativo, y la publicación quedó verificada en el punto 22. **Considero Fase 3A suficientemente validada como piloto técnico y educativo para que el usuario pueda autorizar una Fase 3B gradual.** Esto no extiende la validación a los 403 candidatos ni acredita rendimiento en GPU física. Una eventual ampliación debe mantener las limitaciones observadas —en particular, los solapes de componentes—, repetir las comprobaciones sobre cada nueva región y detenerse ante cualquier inconsistencia anatómica importante.

**Fase 3B requiere autorización explícita del usuario después de esta entrega. El trabajo se detiene en el piloto; una conclusión técnica favorable no inicia Fase 3B automáticamente.**
