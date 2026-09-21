# Fase 3 — auditoría multisistema previa al piloto

Fecha: 21 de septiembre de 2026. Código inspeccionado: `41c797b106c66429eeda41a81597bf05abfb07d8`, HEAD de `main` al comenzar esta revisión. No se encontraron commits posteriores. La decisión de [Fase 2.1](phase2-architecture.md) sigue vigente: cóccix y los seis huesecillos permanecen pendientes y no bloquean nuevos sistemas.

**Estado: auditoría y elección de fuente. Fase 3A todavía no implementada ni validada.** Esta entrega incorpora documentación y evidencia de investigación; no cambia aplicación, modelos, catálogos ni pruebas. Las validaciones de Fase 2.1 son antecedentes del código óseo, no pruebas de musculatura.

## Decisión técnica

Utilizar BodyParts3D 4.0 OBJ99 como fuente del piloto de hombro/brazo, conservando la configuración espacial publicada en el mismo paquete que el esqueleto actual. La identidad de seis huesos de control y la matriz vigente se verificaron; todavía falta evaluar la anatomía muscular integrada y su interacción en MED3D. Véanse [fuentes](phase3-model-sources.md), [registro y piloto](phase3-registration.md) y [evidencia numérica](phase3/research/source-audit.json).

Mantener React, TypeScript, Vite, Three.js, R3F/Drei y TanStack Router. Ampliar el atlas existente; no crear otro visor muscular.

## Reutilización y cambios mínimos

Las rutas de código enlazadas corresponden al repositorio; el estado auditado queda fijado por el commit indicado arriba.

| Área | Estado comprobado | Cambio necesario para el piloto |
| --- | --- | --- |
| Contratos y catálogo | [types.ts](../src/features/anatomy/atlas/types.ts) incluye sistemas, regiones, IDs, procedencia y assets. [SkeletalAtlas.tsx](../src/features/anatomy/atlas/SkeletalAtlas.tsx) carga sólo `skeletal/catalog.json`. | Componer metadatos óseos y musculares en un catálogo corporal estable, conservando los catálogos fuente e IDs óseos. Validar duplicados, bindings, referencias y compatibilidad documentada. |
| Gestor de assets | [asset-manager.ts](../src/features/anatomy/atlas/asset-manager.ts) tiene concurrencia 2, cancelación, reintento explícito, retención de recursos sanos y liberación idempotente. | Reutilizar. Cambiar `assetIds` al activar sistemas, sin recrear el catálogo y el gestor. Reforzar verificación de dueño único y del conjunto completo de mallas esperadas. |
| Árbol | [catalog-index.ts](../src/features/anatomy/atlas/catalog-index.ts) admite varias raíces; [VirtualTree.tsx](../src/features/anatomy/atlas/VirtualTree.tsx) conserva virtualización, teclado y ARIA. | Añadir una raíz neutral «Cuerpo humano». El contrato actual no contempla `kind: body` y obliga a asignar sistema a cada nodo; no etiquetar el cuerpo como óseo. |
| Búsqueda | El índice normaliza acentos, alias, nombres originales y latín. El contenedor ya ofrece resultados de corazón, pulmones y encéfalo. | Buscar sobre el compuesto y mostrar nombre, tipo, sistema y región. Preservar rutas `?organ=heart|lungs|brain`; esos modelos HRA siguen en sus propios marcos. |
| Selección y visibilidad | [AtlasScene.tsx](../src/features/anatomy/atlas/AtlasScene.tsx) usa IDs y ancestros para raycast, selección, hover y ocultación. | Reutilizar y probar superficies musculares densas, transparencia y selección por árbol/buscador cuando el objetivo esté cubierto. |
| Aislamiento y contexto | El aislamiento admite un nodo y descendientes; pulsar una relación cambia selección y elimina aislamiento. | Añadir un conjunto explícito de contexto músculo+huesos con relaciones documentadas. No inferir relaciones de distancias ni de cajas. |
| Fichas | El contenedor llama siempre a [BoneInformation.tsx](../src/features/anatomy/atlas/BoneInformation.tsx). | Despachar información por sistema y distinguir músculo, porción/cabeza y ficha familiar. Conservar educación ósea. Origen/inserción textual no equivale a coordenadas en la superficie. |
| Capas | La lista de sistemas registrados y `opacityBySystem` ya son genéricas. Reset y carga inicial activan todos los assets. | Configuraciones explícitas de huesos, músculos y combinación; carga progresiva por módulos. Generalizar títulos, textos, ARIA y slider fijo óseo, sin rediseñar el sitio. |
| Cámara | Se mantienen seis vistas y encuadre por ocho esquinas en [camera-framing.ts](../src/features/anatomy/atlas/camera-framing.ts). | Conservar las mejoras. Informar cuando el estudio requiera aislamiento; cualquier atenuación de obstáculos debe ser una acción explícita y anunciar su efecto. |
| Medición | Las métricas de primera geometría/sistema completo se fijan respecto al gestor y su selección inicial. | Medir aparte la incorporación posterior de sistemas/regiones, liberación, interacción, transparencia y búsqueda. |

## Riesgos concretos

### Compatibilidad de coordenadas

El loader sólo compara `frameId`, metros y eje Y. Es una barrera técnica, no prueba de registro. El render aplica una normalización global adicional basada en los bounds del catálogo. Mantener un marco corporal estable e independiente de las capas activas; no recentrar cada músculo o módulo. La estrategia verificable se detalla en [phase3-registration.md](phase3-registration.md).

### Despiece por sistemas

[explosion.ts](../src/features/anatomy/atlas/explosion.ts) deriva la traslación de cada sistema de la diferencia entre su centro y el centro corporal. Centros coincidentes producen desplazamiento cero; centros próximos pueden dar una separación ilegible. Los bounds incluyen todos los assets del sistema, aunque sólo se solicite una región.

Además, el selector se habilita con dos sistemas solicitados, aunque el segundo esté cargando o en error. El piloto debe usar sistemas realmente renderizados/visibles y una separación didáctica determinista de cada sistema como bloque. Esa transformación de presentación debe distinguirse del registro anatómico, conservar correspondencias y restaurar exactamente el reposo. No introducir vectores aleatorios.

### Transparencia y materiales

El renderer ya emplea `transparent`, opacidad por sistema, `depthWrite=false` en transparencia, prueba de profundidad y `renderOrder=1` para superficies translúcidas. Los materiales originales se sustituyen por variantes compartidas de reposo, hover y selección; el color muscular preparado es `#b67070`.

La ordenación por objeto no garantiza imágenes correctas en superficies cruzadas o densamente superpuestas. La selección recibe la misma opacidad del sistema. Validar músculo opaco/transparente sobre hueso antes de aprobar el material; documentar sustitución, contraste entre vecinos y cualquier variación tonal. No adoptar OIT, BVH, LOD o batching sin un problema medido.

### Anatomía profunda

El enfoque encuadra la selección, pero no calcula colisiones con el contexto. La limitación de Fase 2.1 sigue presente. Un modo de estudio puede facilitar aislamiento o atenuación voluntaria; no debe ocultar músculos automáticamente ni declarar resuelto el problema sin implementar y validar esa función.

## Validación que debe conservarse y ampliarse

Mantener los tests óseos actuales como baseline independiente. Añadir pruebas del catálogo compuesto, compatibilidad, carga muscular/combinada, opacidad, selección, contexto, búsquedas, descarga y recarga, cambio rápido de sistemas y error parcial. Las pruebas actuales de despiece sólo ejercitan un sistema; no constituyen validación multisistema.

Comprobar los tres niveles de despiece con dos sistemas reales, centros coincidentes y cambios durante la carga. Preservar rutas y funcionalidad de corazón, pulmones y encéfalo. Revisar desktop, laptop, tablet y 390 px con capturas de píxeles reales. La inspección visual muscular deberá evaluar lateralidad, proporciones, porciones, contacto aparente, penetraciones, duplicados y orientación; cualquier duda quedará documentada.

No se han ejecutado en esta investigación nuevos tests de aplicación ni pruebas de GPU. Las mediciones históricas SwiftShader no validan hardware físico. El siguiente trabajo implementable es el piloto descrito en registro; no expandir al torso o al cuerpo completo hasta validarlo.

