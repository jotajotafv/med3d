# MED3D · Arquitectura de ampliación anatómica

Fecha: 14 de septiembre de 2026. Diseño de la fase 2 sobre la base existente; los contratos siguientes definen responsabilidades y criterios de aceptación, no prometen que todos los sistemas estén ya disponibles. La auditoría de partida está en `phase2-audit.md`.

## 1. Alcance y estrategia

El núcleo sigue siendo React 19 + TypeScript + Three.js/R3F/Drei, TanStack Router, Vite y GLB con Meshopt. Se amplía el área anatómica, manteniendo el explorador de órganos, la portada y las otras dos áreas. El primer sistema candidato a completar es el óseo. No se añaden representaciones anatómicas hechas con primitivas para aparentar cobertura.

Separar tres conceptos:

- **Catálogo anatómico:** identidad, términos, jerarquía, relaciones, fichas y cobertura; pequeño y consultable antes de descargar geometría.
- **Manifiesto de assets:** ficheros versionados, bindings, coordenadas, licencia y métricas de importación.
- **Estado de la experiencia:** capas activas, opacidad, selección, ocultación, aislamiento, cámara y despiece. No modifica los datos fuente.

Un grupo del árbol no requiere malla. Una estructura puede ocupar varios nodos de malla. Un órgano puede pertenecer a varios sistemas mediante referencias sin duplicar su geometría ni su identidad.

## 2. Contratos de datos

Contratos conceptuales que el núcleo debe poder expresar; los nombres de campos pueden adaptarse a la implementación real.

```ts
type StructureId = string; // estable, con namespace; no es el texto traducido

type AnatomyNode = {
  id: StructureId;
  kind: 'body' | 'system' | 'region' | 'organ' | 'structure' | 'component';
  label: string;
  anatomicalName?: string;
  latinName?: string;
  sourceName?: string;
  synonyms: string[];
  displayParentId?: StructureId;
  systemIds: string[];
  regionIds: string[];
  laterality?: 'left' | 'right' | 'midline' | 'not-applicable';
  sourceIds: Array<{ namespace: string; id: string }>;
  bindings: Array<{ assetId: string; nodeId: string }>;
  availability: 'available' | 'partial' | 'planned' | 'unavailable';
  educationId?: string;
};

type AnatomicalRelation = {
  from: StructureId;
  to: StructureId;
  kind: 'part-of' | 'articulates-with' | 'connected-to' | 'adjacent-to' | 'related';
  sourceId: string;
};
```

`displayParentId` organiza el árbol editorial y no afirma por sí solo una relación ontológica formal. Las relaciones anatómicas contrastadas se almacenan aparte, con fuente. No generar «adyacente a» a partir de cajas que se tocan, ni «articula con» por proximidad de mallas. No convertir una ontología IS-A en PART-OF sin comprobación.

Los identificadores originales se conservan en `sourceIds`. Una clave de proveedor puede formar parte del ID estable; la revisión del fichero pertenece al manifiesto de assets. Se mantienen aliases cuando cambia una etiqueta o un binding. No usar traducciones, índices de un array o nombres no únicos como identidad.

### Trazabilidad obligatoria de cada asset

| Campo | Contenido requerido |
| --- | --- |
| Identidad y revisión | ID local, nombre original, versión/release, fecha de consulta. |
| Procedencia | Fuente, autores u organización, URL original de descarga y página de documentación. |
| Derechos | Nombre y URL de licencia verificada; atribución; avisos específicos del recurso. |
| Integridad | SHA-256 y bytes del original descargado y del GLB entregado. |
| Transformaciones | Conversión de formato, cambio de unidades/ejes, matrices, materiales, compresión, cuantización y cualquier simplificación. |
| Estructura | IDs fuente, bindings de nodos, número de piezas y grupos; cobertura y excepciones. |
| Geometría | Bounds, vértices/triángulos, geometrías, materiales, texturas y extensiones glTF. |
| Marco anatómico | Individuo o población de referencia, lateralidad, postura, unidades, ejes y `coordinateSpaceId`. |

Las modificaciones se registran aunque sólo cambien colores o nombres de presentación. Un índice o traducción de MED3D no sustituye a la autoría del modelo.

## 3. Catálogo objetivo de sistemas y regiones

La tabla es una **jerarquía editorial de navegación prevista**, no una lista de GLB disponibles ni una reproducción literal de una ontología externa. Cada rama se materializa sólo cuando existen recursos trazables. Nombres latinos y etiquetas detalladas requieren fuente terminológica; no se completan mediante traducción automática no revisada.

| Sistema | Regiones o ramas de navegación | Estructuras que debe poder alojar el catálogo |
| --- | --- | --- |
| Tegumentario | Cabeza/cuello, tronco, miembros superiores e inferiores | Piel por regiones y anexos cuando estén representados; no confundir una envolvente corporal con capas histológicas separadas. |
| Óseo | Esqueleto axial; esqueleto apendicular | Cráneo y huesos, huesecillos del oído, hioides, columna, caja torácica, cinturas y huesos de miembros. Desglose de aceptación en la sección 4. |
| Muscular | Cabeza/cuello, tronco, cintura escapular/miembro superior, pelvis/miembro inferior | Músculos individuales con lateralidad y agrupación regional; tendones/aponeurosis sólo cuando el recurso los distinga. |
| Nervioso | Central; periférico; ramas autónomas con relaciones cruzadas | Encéfalo, médula espinal, nervios craneales, raíces/nervios espinales, plexos, nervios periféricos principales y ganglios representados. |
| Cardiovascular | Corazón; circulación pulmonar; arterial sistémica; venosa sistémica | Cavidades y válvulas, aorta y ramas principales, vasos pulmonares, venas cavas y tributarias principales. Vasos por región y lateralidad. |
| Respiratorio | Vías superiores; vías inferiores; pulmones; estructuras asociadas | Cavidades nasales, faringe/laringe según cobertura, tráquea, bronquios, pulmones/lóbulos/segmentos y pleuras si están disponibles. |
| Digestivo | Cabeza/cuello; tórax; abdomen; pelvis; órganos accesorios | Cavidad oral y estructuras disponibles, esófago, estómago, intestino delgado y grueso por segmentos, recto, hígado, vías biliares y páncreas. |
| Urinario | Riñones; vías urinarias superiores e inferiores | Riñones con lateralidad y componentes del recurso, uréteres, vejiga y uretra según espécimen. |
| Endocrino | Cabeza/cuello; abdomen; pelvis | Hipófisis, pineal, tiroides, paratiroides, suprarrenales; referencias a páncreas y gónadas, evitando duplicación de órganos compartidos. |
| Linfático | Cabeza/cuello; tórax; abdomen/pelvis; miembros; órganos linfoides | Grupos ganglionares y vasos/conductos representados, bazo, timo y otras estructuras con fuente. No generar una red capilar inexistente. |
| Reproductor | Cobertura masculina y femenina diferenciada; pelvis/periné; estructuras asociadas | Gónadas, conductos, glándulas y genitales del espécimen disponible. No presentar un único espécimen como cobertura de ambas anatomías. |

«Órganos internos» y «vasos principales» son vistas transversales de consulta, no copias de los órganos en otro sistema. Una sola ficha puede aparecer mediante enlaces en varias rutas. Los cartílagos, articulaciones, ligamentos, fascias y órganos sensoriales se incorporan como estructuras asociadas o ramas explícitas cuando el recurso los proporcione, sin etiquetarlos erróneamente como huesos.

## 4. Primer sistema: desglose óseo y cobertura

El árbol óseo debe admitir esta granularidad. La lista fija el alcance que se contrasta con el inventario fuente; no acredita disponibilidad hasta verificar bindings y geometría.

| Rama | Subrama | Elementos individualizables previstos |
| --- | --- | --- |
| Axial | Cráneo: neurocráneo | Frontal, parietales y temporales por lado, occipital, esfenoides, etmoides. |
| Axial | Cráneo: viscerocráneo | Maxilares, cigomáticos, nasales, lagrimales, palatinos y conchas nasales inferiores por lado; vómer y mandíbula. |
| Axial | Estructuras asociadas de cabeza/cuello | Martillo, yunque y estribo por lado; hioides. Los dientes se registran por separado y no se cuentan como huesos. |
| Axial | Columna | Cervicales C1–C7, torácicas T1–T12, lumbares L1–L5, sacro y cóccix; componentes sólo si el recurso los separa. |
| Axial | Caja torácica | Costillas por número y lado; esternón. Manubrio, cuerpo y apófisis xifoides como componentes si hay geometría correspondiente. |
| Apendicular | Cintura escapular | Clavícula y escápula por lado. |
| Apendicular | Brazo y antebrazo | Húmero, radio y cúbito/ulna por lado. |
| Apendicular | Mano: carpo | Escafoides, semilunar, piramidal, pisiforme, trapecio, trapezoide, grande y ganchoso por lado. |
| Apendicular | Mano: metacarpo y dedos | Metacarpianos I–V y falanges identificadas por dedo, posición y lado. |
| Apendicular | Cintura pélvica | Coxales por lado; ilion, isquion y pubis como componentes cuando el modelo adulto y sus mallas permitan distinguirlos. |
| Apendicular | Muslo y pierna | Fémur, rótula/patela, tibia y peroné/fíbula por lado. |
| Apendicular | Pie: tarso | Astrágalo/talus, calcáneo, navicular, cuboides y cuneiformes medial, intermedio y lateral por lado. |
| Apendicular | Pie: metatarso y dedos | Metatarsianos I–V y falanges identificadas por dedo, posición y lado. Sesamoideos sólo según el recurso real. |

No aprobar «completo» por alcanzar un número redondo de mallas: un hueso puede tener varias mallas y una malla puede agrupar huesos. Registrar por separado estructuras anatómicas, mallas y grupos. Las fusiones, elementos ausentes o agrupados y variaciones del espécimen se declaran en un informe de cobertura. Si faltan huesos relevantes individualizables, la entrega se describe como parcial y se completa antes de expandir a otro sistema.

## 5. Archivos modulares y coordenadas

Mantener los GLB HRA existentes para compatibilidad. Los módulos nuevos viven bajo `models/anatomy/`, separados por sistema y, cuando el peso o la selección lo justifique, por región. Para esqueleto: cráneo/cabeza, columna, tórax, miembro superior derecho/izquierdo y pelvis/miembro inferior derecho/izquierdo son particiones candidatas. La importación decide los cortes con los tamaños reales; no un GLB por cada hueso si genera cientos de peticiones.

Cada módulo de un mismo dataset conserva el **mismo marco de coordenadas**. Mantener los pivotes y transformaciones locales de reposo; aplicar unidades/ejes de forma explícita y documentada. El encuadre ajusta la cámara, no cambia la escala del hueso seleccionado ni la del módulo.

Un registro de coordenadas debe declarar unidades, orientación, origen, postura, espécimen y matriz del espacio fuente al espacio de escena. La escena usa una transformación global común. No superponer HRA y BodyParts3D por igualación de sus bounding boxes: esa operación no demuestra correspondencia anatómica. Hasta contar con un registro validado, mantener vistas separadas o desactivar combinaciones incompatibles con una explicación breve. Priorizar nuevas capas procedentes del mismo conjunto registrado que el esqueleto.

## 6. Carga, memoria y rendimiento

- Descargar el catálogo antes de las geometrías. Resolver qué módulos necesita la selección o combinación de capas.
- Publicar cada módulo cuando esté listo; el fallo de uno no elimina los demás. El progreso distingue descarga y preparación de escena.
- Acotar concurrencia y deduplicar peticiones en curso por `assetId` + revisión. Cancelar trabajo obsoleto y liberar resultados que llegan tarde.
- Un propietario por recurso controla geometrías, materiales y texturas. Compartir geometría inmutable; mantener materiales independientes sólo cuando selección/opacidad lo exijan. No disponer un recurso mientras lo use otra instancia.
- Una política de caché acotada por presupuesto retiene lo que aporta valor. Ocultar una estructura dentro de un módulo no exige descargarla de nuevo. Desactivar un sistema completo permite liberar sus recursos cuando no existen consumidores.
- Separar el ciclo de vida de la fuente glTF, los objetos de escena y las GPU allocations. La limpieza debe ser idempotente y verificable ante cancelación, reintento y cambio de ruta.
- Conservar frustum culling y renderizado bajo demanda. El despiece, la cámara y el hover invalidan sólo mientras cambian; evitar un bucle permanente de trabajo del atlas inmóvil.
- Mantener Meshopt. Añadir Draco únicamente si una medición de los assets concretos justifica su coste de descarga y decodificación. Añadir KTX2 sólo cuando haya texturas relevantes; los huesos sin texturas no lo necesitan.
- Valorar LOD después de perfilar. Cada nivel debe conservar IDs, cobertura, lateralidad y selección. No eliminar huesos pequeños para mejorar cifras ni inventar superficies de sustitución.
- Indexar mapa por ID, ancestros, descendientes y términos una vez por revisión del catálogo. Mostrar sólo ramas expandidas y resultados acotados; virtualizar si la medición de miles de filas lo exige.

Presupuestos iniciales son objetivos a medir, no garantías: módulos regionales de pocos MiB cuando sea viable, ausencia de descarga de sistemas inactivos, reposo sin actualizaciones continuas y memoria que vuelva a un nivel estable tras ciclos de carga/descarga. La compresión de red no equivale a memoria GPU; registrar ambas por separado.

## 7. Capas, búsqueda, ficha y selección

Cada capa tiene estado de activación, visibilidad, opacidad y carga/error. La selección es global por `StructureId`. El aislamiento y las ocultaciones son filtros reversibles sobre el catálogo, sin borrar la configuración de las otras capas. «Restaurar» vuelve a un estado inicial definido: capas iniciales, opacidad 100 %, ninguna ocultación o aislamiento, despiece 0 %, selección limpia y cámara de conjunto.

Una misma acción de selección atiende visor, árbol, búsqueda y relaciones:

1. Resolver el ID y comprobar disponibilidad real.
2. Activar los módulos compatibles necesarios; revelar el destino si estaba oculto o aislado fuera de vista.
3. Abrir sus ancestros y mostrar la ruta jerárquica.
4. Resaltar, presentar la ficha y enfocar cuando la geometría exista; conservar la solicitud si está descargándose.

El índice normaliza mayúsculas, espacios y diacríticos; busca nombre común, anatómico, términos originales, sinónimos y latín documentado. Una coincidencia no disponible se indica como tal; nunca se selecciona una estructura distinta para simular el resultado. El detalle identifica nombre, sistema(s), región, descripción, función, relaciones, fuente educativa y procedencia del modelo. Los campos sin contenido contrastado muestran estado pendiente, sin texto médico deducido de la forma.

## 8. Exploded View jerárquico

Conservar el control 0–100 % y añadir tres niveles explícitos:

| Nivel | Grupo que se desplaza | Ejemplo |
| --- | --- | --- |
| 1 · Sistemas | Todos los descendientes de cada sistema comparten transformación. | Esqueleto respecto de otros sistemas compatibles activos. Con un solo sistema no se inventa una separación entre sistemas. |
| 2 · Regiones / estructuras | Grupos dentro del sistema, determinados por el nodo de contexto. | Esqueleto axial/apendicular y regiones; dentro del cráneo, huesos cuando el contexto es cráneo. |
| 3 · Componentes disponibles | Componentes reales del órgano o estructura compleja elegida. | Componentes cardíacos o cerebrales presentes; en huesos sin componentes reales el nivel se desactiva. |

Los niveles son contextuales: profundidad de un árbol editorial no equivale automáticamente a nivel de despiece. Un hueso completo puede ser hoja aunque su ruta tenga varios grupos regionales.

El desplazamiento se calcula desde el reposo inmutable, con vectores registrados por grupo o derivados de centros anatómicos dentro del mismo marco, acotados por el tamaño del padre. En centros coincidentes se usa una dirección explícita del grupo o no se separa; nunca azar ni índice de la malla. Los hijos acompañan a su grupo y sólo se separan de él en el nivel permitido.

Interpolar posición y cambio de nivel con un factor temporal acotado; detener invalidación al llegar al objetivo. Respetar movimiento reducido. A 0 % se restauran exactamente las transformaciones de reposo, sin suma incremental ni deriva. El control no modifica `visible`, opacidad ni aislamiento. Conservar contexto mediante encuadre y límites de separación; no resolver solapamientos dispersando piezas arbitrariamente.

## 9. Fuentes, herramientas y secuencia de aceptación

Los GLB HRA actuales permanecen atribuidos según `model-licenses.md` y sus manifiestos. La fuente elegida para investigar la cobertura ósea es **BodyParts3D/DBCLS v4.0**, archivo oficial del 19 de junio de 2013, basado en un adulto masculino. La [documentación del archivo](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) identifica el proyecto y su autor, Kousaku Okubo. La [licencia oficial](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) publica CC BY 4.0 y registra el cambio del 27 de febrero de 2025. La atribución indicada es: «BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International».

Sus [descargas oficiales](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) incluyen geometría y datos de términos/relaciones; las [notas de v4.0](https://lifesciencedb.jp/bp3d/info_en/userGuide/releaseNotes/release-4.0.html) advierten sobre diferencias de coordenadas entre versiones. Por tanto, la importación debe fijar una release, comprobar su inventario y conservar sus relaciones originales. La existencia de esos ficheros no demuestra todavía cobertura ósea completa o calidad suficiente de la reducción elegida; la aceptación depende del informe de importación y de la inspección. La elección de nuevos recursos no se decide por su apariencia ni por una licencia de un mirror sin confirmar.

Higgsfield y Blender pueden inspeccionar mallas, unidades, nombres, jerarquías, materiales, pivotes, bounds y exportaciones GLB. No constituyen una fuente anatómica por sí mismos. Registrar las operaciones que realmente se ejecuten y comprobar después los bindings. Las capacidades concretas disponibles y el resultado de la inspección se documentan en el informe de herramientas correspondiente; no atribuir una conversión a Blender si se ejecutó con otro proceso.

Orden de entrega:

1. Auditoría y contratos de catálogo/carga, sin reemplazar el stack.
2. Fuente ósea verificada, importación reproducible, manifiestos y cobertura explícita.
3. Esqueleto en el nuevo núcleo: seleccionar, buscar, árbol, enfocar, aislar, ocultar, transparencia, información y relaciones trazables, despiece reversible y restauración.
4. Verificación funcional, visual y de memoria/rendimiento con resultados y límites publicados en el repositorio.
5. Completar carencias óseas importantes antes de importar el siguiente sistema. Las capas futuras se activan cuando exista geometría y registro compatibles, no por añadir su nombre al selector.

## 10. Estado implementado de esta entrega

El contrato TypeScript operativo vive en `src/features/anatomy/atlas/types.ts`; la sección 2 describe el modelo objetivo, con relaciones cruzadas que se irán ampliando. Esta entrega implementa un sistema corporal registrado y once definiciones de sistemas para organizar la expansión, no once sistemas 3D disponibles.

- La ruta anatómica predeterminada usa `SkeletalAtlas`. `LegacyOrganAtlas` conserva las vistas HRA y los enlaces `organ`/`structure`; sus geometrías no se superponen a BodyParts3D sin registro.
- `catalog.json` contiene 249 nodos y siete assets. Se registran 199 huesos convencionales, cuatro sesamoideos accesorios y tres componentes del esternón, que dan 205 mallas únicas. La lista precisa de siete huesos pendientes está en `phase2-missing-bones.md`.
- Cada estructura usa el nombre individual del catálogo y, cuando existe, la ficha documentada de su familia. La interfaz identifica ese alcance; las relaciones navegables indican pertenencia y homología, sin fingir un grafo completo de articulaciones.
- Los tres niveles implementados separan sistemas, regiones y estructuras/componentes según su padre anatómico. El nivel de sistemas permanece en reposo con una sola capa corporal. No hay aún despiece contextual de tres niveles aplicado a todos los órganos HRA: éstos conservan sus dos niveles previos con transición suavizada.
- El árbol virtualiza filas y ofrece navegación por teclado. Los resultados óseos se presentan en páginas de 60. Los módulos desactivados se liberan y una selección reactiva su región cuando sea necesaria.
- KTX2, Draco, BVH y LOD no se añaden sin un problema medido que los justifique. Los huesos actuales no tienen texturas; Meshopt, geometría compartida cuando existe, culling, materiales compartidos y renderizado bajo demanda son las medidas activas.

No pasar al siguiente sistema mientras las ausencias óseas importantes, el registro espacial y la revisión anatómica sigan abiertos.
