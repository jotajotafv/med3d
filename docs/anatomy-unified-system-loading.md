# Carga unificada de sistemas anatómicos

Base: `0eba7b5da92cfd80774c438bbb642c378fba5cdf`, rama `phase-anatomy-completion-nonfemale`.

## Decisión de producto y auditoría

Cada sistema representa toda su anatomía aprobada. La procedencia histórica de los módulos no es una elección educativa: se retira «Ampliación anatómica» de la interfaz XR y se elimina su estado, acción y filtro adicional de visibilidad. No se retira ningún módulo.

En XR la fila estaba en `XrAtlasExperience.tsx`, con `optionalSystems` en el reducer, `includeOptional` en el propietario de recursos y un filtro adicional en `XrAtlasPresentation`. Los once sistemas se generaban desde la misma lista; siete podían mostrar esa fila con el catálogo completo. No tenía un `data-xr-hand-control` propio: no había registros explícitos que borrar. El registro gestual sigue leyendo el DOM real; desaparece la fila y permanece la región de scroll.

Atlas principal no tenía ese checkbox ni ese texto. Sí excluía los módulos con `defaultEnabled: false` de la activación normal y recordaba subconjuntos al reactivar sistemas. Ahora el toggle ON solicita todos sus módulos. Conserva el árbol, búsqueda, controles regionales con nombres anatómicos y enlaces regionales explícitos. No se modifica el catálogo: el indicador histórico se usa sólo para ordenar solicitudes.

## Carga, cola y memoria

- Arranque normal: sólo Óseo en ambos visores. Atlas antes solicitaba diez sistemas; conservarlo y añadir todos los módulos habría contradicho la carga inicial limitada.
- Óseo solicita primero sus siete módulos base (205 mallas) y después sus dos módulos restantes (207 mallas en total). Cada recurso se muestra al terminar; no hay barrera de carga completa.
- `prioritizeAtlasAssets` ordena sin mutar datos: módulos base antes de los marcados históricamente como opcionales. Atlas aplica ese orden también al cambiar la selección de módulos; XR al solicitar un sistema.
- Se conservan las colas: Atlas tiene hasta dos cargas simultáneas; XR hasta dos propietarios activos y una carga por propietario. La prioridad es por solicitud/sistema, sin interrumpir transferencias ya iniciadas.
- OFF retira todo el sistema de visualización y picking. En XR conserva lo listo y permite terminar la única transferencia en curso, retirando la cola pendiente; un catálogo que termina después de OFF no inicia geometría. Los sistemas nunca activados no descargan GLB.
- Atlas conserva los recursos ya listos durante la sesión mediante una opción local de su gestor. Es el cambio mínimo necesario para cumplir ON → OFF → ON sin nueva descarga/decodificación: antes los liberaba en OFF. Cancela trabajo no terminado al quitarlo de la solicitud. El gestor genérico conserva su política anterior por defecto.
- ON reutiliza las mismas instancias listas; lo que aún no se cargó vuelve a la cola. Una descarga cancelada o fallida puede requerir otro intento; no se promete cero solicitudes para un recurso que nunca terminó.
- Salir del visor, reemplazar su catálogo o recuperar el contexto WebGL libera los recursos según el ciclo de vida existente. No hay caché global o persistente.
- Los fallos se anuncian en el estado normal del sistema/visor y usan su botón de reintento. Atlas muestra un mensaje público sin IDs de módulos; conserva el detalle técnico en el estado interno.

## Comportamiento anatómico

Opacidad, selección, ficha, aislamiento, ocultación, restauración y despiece utilizan los mecanismos anteriores. Las estructuras nuevas tienen el mismo filtro de sistema y materiales de presentación; desaparece únicamente la barrera de opt-in.

En XR la lista de raycast incluye todas las mallas visibles del sistema. OFF las excluye. Se conserva el material temporal, los IDs y las fichas resueltas desde las fuentes existentes. En Atlas los recursos apagados salen de la escena aunque permanezcan retenidos en memoria.

Búsqueda, relaciones, árbol y enfoque del Atlas siguen solicitando los módulos necesarios para el destino; no requieren activar una ampliación ni cargar todos los sistemas. Los enlaces con `systems`/`modules` siguen siendo entradas regionales intencionadas. El toggle principal ON carga el sistema entero incluso después de una entrada regional. XR no incorpora búsqueda nueva.

Restablecer Atlas vuelve al conjunto inicial solicitado por la entrada (Óseo normalmente), limpia filtros/opacidad/despiece como antes y reutiliza recursos. En XR «Restaurar atlas» sigue restableciendo capas/filtros conservando despiece; «Restablecer vista» mantiene su alcance previo.

## Cobertura conservada

| Sistema | Base | Otros aprobados | Total módulos | Mallas |
| --- | ---: | ---: | ---: | ---: |
| Óseo | 7 | 2 | 9 | 207 |
| Muscular | 18 | 15 | 33 | 298 |
| Nervioso, incluidos ojos | 7 | 8 | 15 | 189 |
| Cardiovascular | 7 | 8 | 15 | 209 |
| Respiratorio | 3 | 2 | 5 | 165 |
| Digestivo | 4 | 4 | 8 | 136 |
| Urinario | 1 | 0 | 1 | 6 |
| Endocrino | 2 | 0 | 2 | 11 |
| Linfático | 1 | 0 | 1 | 3 |
| Reproductor | 1 | 0 | 1 | 12 |
| Tegumentario | 1 | 1 | 2 | 4 |
| Total | 52 | 40 | 92 | 1240 |

El total de archivos GLB catalogados es 47.93 MB; Óseo son 4.03 MB. No se solicitan micromodelos independientes al activar estos sistemas.

## UI, responsive y gestos

No hay cambios CSS, paleta, tipografía, hero ni tamaños generales. XR conserva once toggles, sliders de sistema y la región con scrollbar. El espacio que deja la fila retirada vuelve al flujo normal de esa región. Se verifican 1366, 1050, 900, 768 y 390 px, scroll manual, acceso a Tegumentario y ausencia de overflow horizontal.

El código de MediaPipe, tracking, hand UI registry/router, dwell, scroll gestual, pinch, pan, rotación, escala, suavizado y thresholds no cambia. Dwell continúa en 1000 ms. El QA gestual de esta entrega utiliza landmarks controlados contra los controladores reales.

## Validación y evidencia

Resultado: **PASS** de Atlas, XR manual/UI y UI gestual controlada. Evidencia resumida y hashes: [anatomy-unified-system-loading-qa.json](anatomy-unified-system-loading-qa.json).

| Comprobación | Resultado |
| --- | --- |
| `npm run test:xr` | 187/187 PASS; 0 fallos, 0 omitidas |
| `npm run typecheck` | PASS |
| `node scripts/test-atlas-renderer.mjs` | PASS |
| `node scripts/test-anatomy-completion.mjs` | PASS; 92 módulos y hashes originales |
| `npm run build` | PASS; advertencia habitual de chunks grandes |
| `git diff --check` | PASS |
| Atlas browser | PASS |
| XR manual/UI browser | PASS |
| Controlled gesture UI | PASS; dwell 1000 ms, slider y scroll hasta Tegumentario |
| Responsive | PASS en los cinco anchos, ambos visores; scrollbar y target dentro de la región |
| Fallo de catálogo XR → OFF → ON | PASS en prueba y navegador |

Se añaden seis pruebas en `scripts/xr/unified-system-loading.test.mjs`: sistema completo/orden/entrada regional; base visible durante espera y reintento; retención/reutilización/cleanup; OFF durante descarga o catálogo; ausencia de controles/estado de ampliación; recuperación tras error de catálogo. La suite real `full-atlas.test.mjs` comprueba el orden de solicitudes, visibilidad/picking de todos los módulos y fichas/raycast/aislar/ocultar también sobre estructuras nuevas por sistema, además de despiece y limpieza. Se actualiza la expectativa de carga inicial del test anatómico, conservando las comprobaciones de identidad y hashes.

El script reproducible `scripts/anatomy/unified-system-loading-qa.mjs` usa la aplicación real, GLB reales, raycasts reales y fixtures de cámara/landmarks únicamente para regresión de UI. Requiere Vite local y Playwright; admite `XR_PLAYWRIGHT_MODULE`, `XR_BROWSER_EXECUTABLE`, `XR_QA_DEV_ORIGIN` y `XR_QA_OUTPUT`. Las opciones `--responsive-only` y `--catalog-retry-only` repiten sólo esas comprobaciones.

El QA cubre: primer render mientras un módulo nuevo está retenido artificialmente; once toggles y ausencia de texto técnico; ON base+nuevos; opacidad de ambos; OFF sin picking; ON sin peticiones repetidas; restauración; despiece; búsqueda/enfoque; selección por mouse/touch; ficha/aislar/ocultar de un músculo nuevo; retry visible de un módulo fallido en ambos visores; navegación del árbol; scroll y limpieza al salir. Se comprobó que abrir/cerrar ficha conserva la escena XR.

Capturas locales revisadas: `.cache/unified-system-loading/browser-responsive/{atlas,xr}-{1366,1050,900,768,390}.png`. Son evidencia local ignorada por Git, con hashes en el resumen JSON. La primera ejecución del harness terminó por desregistrar demasiado pronto la ruta demorada; se corrigió sólo la sincronización del QA. La ejecución funcional posterior pasó completa.

### Rendimiento observado

Chromium 149.0.7827.55, entorno local de desarrollo. Se midieron Óseo, Muscular, Óseo+Muscular+Nervioso y los once sistemas. Todas las cargas terminaron; cero errores JavaScript.

| Etapa | Módulos acumulados | Mallas | Atlas: tiempo de etapa | XR: tiempo de etapa |
| --- | ---: | ---: | ---: | ---: |
| Óseo | 9 | 207 | 8.78 s | 7.65 s |
| + Muscular | 42 | 505 | 5.25 s | 3.48 s |
| + Nervioso | 57 | 694 | 4.32 s | 4.32 s |
| Once sistemas | 92 | 1240 | 12.58 s | 10.37 s |

Los tiempos de etapa incluyen automatización, estabilización y, en Óseo, demora artificial; no son un benchmark de descarga en producción. El primer contenido óseo se registró a 886 ms en Atlas y 301 ms en XR desde el inicio del gestor. En XR el primer contenido muscular apareció a 186 ms y Nervioso a 639 ms; sus sistemas completos a 2090 y 2350 ms. No se esperó a todos los módulos para mostrarlos.

Buffers de geometría decodificada: 7.82 MB con Óseo y 95.88 MB con todos los sistemas. No incluyen materiales, texturas, memoria del driver ni objetos JS. Con todo visible, la muestra XR registró un intervalo medio de frame de 54.7 ms: sigue siendo una escena costosa. No se interpreta como FPS físico ni como mejora del bloqueo MediaPipe. ON/OFF/ON de Muscular produjo cero nuevas solicitudes en ambos visores. Los contadores globales del JSON incluyen navegaciones, reintentos 503 intencionados y solicitudes canceladas por StrictMode de desarrollo.

### Inventario del diff

Modificados:

- `src/features/anatomy/atlas/AtlasScene.tsx`
- `src/features/anatomy/atlas/SkeletalAtlas.tsx`
- `src/features/anatomy/atlas/asset-manager.ts`
- `src/features/anatomy/atlas/initial-assets.ts`
- `src/features/xr/atlas/XrAtlasExperience.tsx`
- `src/features/xr/atlas/assets.ts`
- `src/features/xr/atlas/presentation.ts`
- `src/features/xr/atlas/state.ts`
- `scripts/test-anatomy-completion.mjs`
- `scripts/xr/full-atlas.test.mjs`

Creados:

- `scripts/anatomy/unified-system-loading-qa.mjs`
- `scripts/xr/unified-system-loading.test.mjs`
- `docs/anatomy-unified-system-loading.md`
- `docs/anatomy-unified-system-loading-qa.json`


## Límite de aceptación XR

`ENVIRONMENT_BLOCKED` de la campaña anterior sigue vigente y separado. Esta entrega no resuelve ni vuelve a ejecutar MediaPipe prolonged-load, no hace una prueba física y no afirma que esa aceptación esté aprobada. La ausencia de cambios gestuales, la misma geometría total y la regresión controlada no equivalen a medir continuidad física bajo carga prolongada. Ahora los módulos se solicitan automáticamente, pero la concurrencia sigue limitada y la carga inicial es sólo Óseo.

No se modifican modelos, geometrías, catálogos, IDs, owners, educación, relaciones, registros, matrices, hashes, fuentes, licencias, locks, clasificación ni decisiones de los 117 gaps. Anatomía femenina y micromodelos permanecen intactos. No se ejecuta `verify:anatomy` porque no cambian esos elementos.

Sólo commit local; sin push, merge o deploy.
