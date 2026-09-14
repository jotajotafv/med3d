# MED3D · Auditoría del explorador antes de la fase 2

Fecha: 14 de septiembre de 2026. Base inspeccionada: commit `d403ec39cff1e1810a6cc0b4b0725b44ad4c4d05` de `jotajotafv/med3d`. Auditoría estática del código y los manifiestos; no constituye una medición de FPS ni una revisión anatómica clínica. Los cambios posteriores deben registrarse por separado.

## Decisión

Ampliar la aplicación existente. Conservar React 19, TypeScript, Three.js, React Three Fiber, Drei, TanStack Router, Vite, la compresión Meshopt, el diseño y las tres áreas. La fase 2 añade un núcleo de atlas modular; el explorador de los órganos existentes sigue disponible durante la integración. Procedimientos y primeros auxilios conservan su alcance actual.

## Inventario comprobado

| Archivo o área | Comportamiento actual |
| --- | --- |
| `src/features/anatomy/AnatomyPage.tsx` | Estado de un órgano activo; selección, ocultación, aislamiento, opacidad global, árbol recursivo, búsqueda local, ficha, controles de cámara y despiece en dos modos. |
| `src/features/anatomy/AnatomyScene.tsx` | Carga por `fetch`, GLTFLoader y MeshoptDecoder; raycasting; materiales propios; cámara orbital y enfoque animado; renderizado bajo demanda; recuperación de carga/contexto WebGL. |
| `src/features/anatomy/data.ts` | Unión cerrada de tres órganos, nombres en español, algunos términos latinos, relaciones padre/hijos y caché de descendientes. |
| `src/features/anatomy/model-index.ts` | Índice extraído de los recursos: nombres originales, jerarquía, metadatos, límites, URL y SHA-256 de fuente y resultado. |
| `src/features/anatomy/education.ts` | 23 fichas breves de corazón y aparato respiratorio con enlaces NHLBI/NIH; las demás estructuras muestran ficha en preparación. |
| `src/features/anatomy/AnatomyHero.tsx` | Portada interactiva. Solicita inicialmente sólo el corazón; el conjunto de cuatro recursos se carga al elegir «Conjunto». |
| `src/features/anatomy/SceneBoundary.tsx` | Límite de errores con reintento y restablecimiento por clave. |
| `src/features/anatomy/anatomy.css` | Dirección visual común, visor protagonista, paneles y controles adaptados a móvil. |
| `src/router.tsx`, `vite.config.ts`, `scripts/static-routes.mjs` | Enrutamiento y recursos respetan `/med3d/`; salida estática compatible con la publicación actual en GitHub Pages. |

| Recurso existente | Mallas seleccionables | Nodos del índice | GLB comprimido |
| --- | ---: | ---: | ---: |
| Corazón | 14 | 18 | 715.820 bytes |
| Pulmones y vías asociadas | 58 | 77 | 1.992.744 bytes |
| Encéfalo | 283 | 286 | 3.496.140 bytes |
| Piel de contexto | 0; una malla sin raycast | 1 | 399.176 bytes |
| Total | 355 | 382 | 6.603.880 bytes |

Los 382 nodos no equivalen a 382 piezas seleccionables: incluyen agrupaciones y piel. Las cantidades provienen del índice; la coincidencia con cada nuevo GLB debe comprobarse durante el proceso de importación.

## Componentes reutilizables sin cambios

- Stack, construcción, navegación, rutas de aprendizaje, `SiteLink`, cabecera, pie y recursos tipográficos.
- Recursos HRA ya entregados, sus índices, hashes y atribuciones. No se requiere volver a generar ni simplificar su anatomía para añadir el esqueleto.
- `SceneBoundary`, útil también para el nuevo visor. La captura de pérdida de contexto y los estados de error son patrones ya adecuados.
- Portada y explorador especializado de órganos, preservados como experiencia operativa durante la incorporación del núcleo de atlas.
- Textos educativos existentes y estados explícitos de contenido pendiente. Ampliar la cobertura no exige sustituirlos.

Son reutilizables **como patrones**, con adaptación al catálogo nuevo: GLTFLoader con Meshopt, raycasting por estructura, enfoque por bounding box, OrbitControls, iluminación, renderizado bajo demanda, DPR acotado y controles nativos. El cargador y la transformación de escena no deben copiarse sin corregir sus límites de escala.

## Límites que impiden crecer directamente

| Hallazgo concreto | Evidencia en la base | Consecuencia y cambio necesario |
| --- | --- | --- |
| Identificadores y lista de recursos cerrados | `OrganId`, `AnatomyModelId`, `ASSETS`, `organIds` y condiciones para corazón/pulmones/encéfalo. | Cada sistema nuevo obliga a editar varios componentes. Sustituir en el núcleo por registros tipados; mantener un adaptador para los órganos existentes. |
| Carga del conjunto indivisible | `useAnatomyResource` utiliza `Promise.all` y sólo publica `resource` cuando terminan todos los assets. Un fallo anula el conjunto. | Un sistema lento bloquea todos los demás. Cargar y representar módulos independientes, con progreso y reintento por módulo. |
| Falta un propietario explícito de cada recurso | Lista mutable `loadedParts`, tareas concurrentes, cancelación y limpieza repartidas entre `loadAsset`, `catch` y cleanup. Existe comprobación de aborto después de parsear y disposición de fuentes. | No se ha medido una fuga. La ampliación debe garantizar liberación exactamente una vez incluso con fallo parcial, desmontaje y resolución tardía, con pruebas de esas carreras. |
| Geometría duplicada y material por malla | `loadAsset` clona cada geometría, aplica `matrixWorld` a vértices, crea un material nuevo y elimina la fuente. | Aumenta memoria y pierde oportunidades de compartir geometría. Mantener transformaciones originales y recursos compartidos con ownership explícito cuando el asset lo permita. |
| Normalización dependiente de lo cargado | `makeResource` centra y escala **el conjunto cargado** para que su dimensión máxima sea 3,45. | Es adecuada para un órgano aislado. Distintos módulos normalizados por separado no se pueden superponer anatómicamente. En el cuerpo completo, mantener un marco común y ajustar la cámara; no renormalizar cada capa. El conjunto HRA actual sí conserva sus posiciones relativas antes de esa transformación global. |
| Despiece limitado a dos agrupaciones | `organGroup` se deduce de un ancestro del GLB; `explodeLevel` admite `organ` o `parts`. | La jerarquía visual depende del archivo, no del modelo anatómico. Añadir rutas y grupos explícitos por sistema, región y componente. |
| Despiece inmediato y dirección de respaldo arbitraria | El efecto escribe `mesh.position` directamente; si coinciden centros usa seno/coseno del índice de la pieza. | No hay interpolación temporal; el orden del fichero puede modificar la dirección. Usar vectores deterministas vinculados a grupos anatómicos y desplazamientos acotados. |
| Desaparición no solicitada de piel | `part.asset === 'skin'` cambia `visible` cuando `exploded >= .4`. | Un control de separación también oculta anatomía. El nuevo despiece no debe alterar visibilidad ni opacidad. |
| Opacidad única y exclusión de sistemas | `opacity` es único; cambiar de órgano sustituye la escena y limpia el estado. | No permite combinar esqueleto y músculos o transparencias independientes. Estado por capa, separado del estado de selección y visibilidad por estructura. |
| Búsqueda limitada al órgano actual | `found` filtra `nodes`; `choose` sólo selecciona y cierra el panel. | No encuentra estructuras de otros sistemas, no centra ni revela una selección oculta. Índice global y selección unificada que cargue, muestre y enfoque el destino. |
| Costes repetidos de recorrido | Render recursivo de todo lo expandido; búsquedas lineales; `descendants` construye un mapa por clave nueva; efectos de material recorren todas las piezas. | Es tolerable con la cobertura actual; para miles de nodos se necesitan índices precalculados y filas visibles acotadas. Optimizar render/materiales según perfiles, sin reescribir prematuramente. |
| ID de escena ligado al nombre del GLB | Selección por `object.name`; aliases con ancestros y ontología. | Nombres repetidos entre proveedores y ontologías duplicadas pueden producir colisiones. Usar ID de estructura estable y bindings de nodo explícitos con namespace. |
| Metadatos mezclan fuente y presentación | `sourceToSpanish` traduce por sustituciones; región por defecto «Cráneo» o «Tórax»; relaciones educativas sin tipo. | La ampliación necesita términos trazables, región explícita y relaciones tipadas; conservar el original cuando falte una traducción verificada. |
| Ficha móvil no acompaña siempre a la selección | `choose` cierra el panel; la inspección requiere abrir «Controles». | Unificar selección desde búsqueda/árbol/visor y ofrecer inspección accesible sin obligar a descubrir otro control. |

## Qué no debe declararse resuelto por esta auditoría

No hay cuerpo completo, esqueleto, musculatura ni nervios periféricos en la base inspeccionada. Tampoco hay caché de GPU compartida, niveles de detalle, texturas KTX2, Draco, árbol virtualizado, métricas instrumentadas o validación de registro entre proveedores. El texto previo de `docs/architecture.md` mezcla decisiones implementadas y propuestas; esta auditoría toma el código como evidencia de implementación.

La investigación de esta fase ha verificado como fuente elegida BodyParts3D/DBCLS v4.0, archivo de 19 de junio de 2013. La [página oficial de derechos](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) publica CC BY 4.0 desde el 27 de febrero de 2025; versiones antiguas de la licencia en mirrors no deben sustituir esa evidencia. La cobertura real descargada, correspondencia de estructuras y modificaciones siguen sujetas al registro de importación antes de presentar el sistema como incorporado o completo.

## Verificación requerida para la nueva entrega

1. Pruebas de catálogo: IDs únicos, jerarquía sin ciclos, padres/bindings válidos, integridad de hashes, lateralidad y cobertura declarada.
2. Prueba de interacción con un hueso de cada gran región: cargar, seleccionar en 3D, buscar por sinónimos, navegar árbol, enfocar, aislar, ocultar, ajustar opacidad, consultar ficha/relaciones y restaurar.
3. Despiece a 0, 50 y 100 % en cada nivel disponible: transición suave, ninguna ocultación implícita, posiciones finitas y reposo restaurado sin deriva.
4. Cambio rápido de capas y navegación durante descarga, error de un módulo y reintento: descartar respuestas obsoletas y liberar recursos sin romper los módulos válidos.
5. Medir descarga comprimida, tiempos de parseo y primera escena útil, geometrías, triángulos, draw calls y estimación de memoria; registrar navegador, tamaño del visor, red y hardware. No extrapolar FPS de software WebGL a un móvil real.
6. Construcción, tipos, rutas existentes y render móvil/escritorio. Procedimientos y primeros auxilios deben seguir funcionando sin dedicarles nuevas escenas.
