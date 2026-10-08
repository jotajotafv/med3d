# Unificación visual de los exploradores de órganos

Rama: `phase-organ-explorers-ui`. Base: `537ffcb969cc56a33b78de92a9d1ce8e68daa70f`.

Se rediseñaron Corazón, Pulmones y Encéfalo, conservando sus rutas existentes `/anatomia?organ=heart|lungs|brain`. La presentación compartida utiliza el negro, la tipografía Geist, los separadores finos y el acento cyan de Home y Anatomía. El viewport queda integrado y los controles existentes mantienen sus acciones.

## Archivos

- `src/features/anatomy/LegacyOrganAtlas.tsx`: markup, presentación de información y estado de visibilidad del panel.
- `src/features/anatomy/organ-explorers.css`: estilos aislados mediante `.organ-explorer`.
- Este documento.

## Interfaz y ficha

La navegación entre órganos se presenta como tabs editoriales con estado activo, separadores y línea cyan. Conserva el handler de cambio de órgano y sus parámetros de URL. El header compartido no se modificó.

La ficha abre por defecto y muestra nombre, latín cuando existe, sistema, región, descripción, función y relaciones disponibles. Conserva las fichas educativas originales y sus enlaces NIH/NHLBI. No se inventaron campos de tipo ni nuevas explicaciones para estructuras sin ficha específica. La procedencia queda resumida con fuente original, licencia y una limitación educativa breve. No se muestran conteos internos, identificadores, datos del pipeline ni avisos de desarrollo.

La ficha se oculta/reabre con un icono de panel y tooltips, `aria-expanded` y `aria-controls`. Sólo cambia el layout usando el estado de panel; el canvas permanece montado. A 1366 px su anchura pasa de 804 a 1096 px. Se retiran la nota promocional inferior y la navegación lateral duplicada. Al final queda el footer compartido existente con **únicamente** la advertencia educativa.

## Procedencia verificada por modelo

Contrastada con `public/models/manifest.json`, `docs/model-licenses.md`, la licencia local y la [licencia oficial HRA/HuBMAP](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/main/LICENSE).

| Módulo | Fuente registrada | Licencia |
| --- | --- | --- |
| Corazón | Visible Human / HRA, VH_Male/v1.2/VH_M_Heart.glb | CC BY 4.0 |
| Pulmones | Visible Human / HRA, VH_Male/v1.4/3d-vh-m-lung.glb | CC BY 4.0 |
| Encéfalo | Allen / HRA, VH_Male/v1.2/Allen_M_Brain.glb | CC BY 4.0 |

Los enlaces públicos conservan el archivo fuente específico de cada módulo y la indicación de adaptación educativa. Todos los registros técnicos y licencias permanecen intactos.

## Responsive y comprobaciones

- 1366 y 1050 px: árbol, viewport y ficha; el cierre elimina la columna derecha. A 1050 px el canvas pasa de 562 a 816 px.
- 900 px: ficha de 254 px y árbol en panel superpuesto; canvas de 608 a 862 px al cerrar la ficha.
- 768 y 390 px: paneles superpuestos, exclusivos y cerrables; el canvas ocupa el ancho completo. La ficha está abierta inicialmente y puede cerrarse para explorar. Sin desbordamiento horizontal.
- Los tres módulos cargan, permiten drag, zoom y selección real sobre el modelo, actualizan la ficha y navegan entre sí. Cierre/reapertura: mismo canvas, recurso y cámara, variación de posición/objetivo igual a cero, selección/opacidad/despiece conservados y cero solicitudes GLB adicionales.
- Búsqueda y selección táctil comprobadas en los tres órganos; árbol y ficha nunca se superponen simultáneamente en móvil. Drag táctil, zoom y menú móvil comprobados. Navegación superior hacia Home, Anatomía y Acerca correcta, con footer mínimo intacto.
- `npm run typecheck`: correcto. `npm run build`: correcto, con el aviso preexistente de tamaño del chunk Meshopt. Se utilizó el adaptador local Rollup WASM ya disponible en `.cache/`.
- `npm run verify:anatomy`: correcto, ejecutado **una sola vez**. `git diff --check`: correcto. Sin errores de página en navegador.
- 11 capturas locales en `.cache/organ-explorers-ui/`: tres desktop y tres con ficha cerrada, navegación, tablet, dos estados móviles y footer. Métricas en `qa.json`; no se incluyen en el commit.

## Integridad

La comparación de sintaxis confirma que `changeOrgan`, `choose`, `toggleHidden`, `reset`, `match`, `row`, los efectos, los memos, los handlers anatómicos y el elemento `Scene` permanecen idénticos. Sólo cambia el estado inicial del panel de UI y su presentación.

**No se modificaron GLB, geometrías, materiales, transforms, escalas, rotaciones, cámara, controles 3D, raycast/picking/hover, loaders, catálogos, IDs, jerarquías, búsqueda, datos educativos fuente ni lógica del despiece. No se eliminó documentación técnica. Home, Anatomía y Acerca conservan su implementación.**

Entrega mediante commit local; sin push, merge ni deploy.
