# Entrega: interfaz de Anatomía 3D

Fecha: 6 de octubre de 2026. Rama: `phase-anatomy-ui-redesign`.
Base: `6bcb9d7931806146fcb9d72bb07194e2ccf119fb` (Home aprobado, conservado).

Objetivo: acercar la interfaz del atlas al Home mediante negro, tipografía Geist, bordes finos, superficies discretas y cyan moderado. Referencia: imagen suministrada «Imagen de ChatGPT 6 oct 2026, 09_16_03 p.m.png». Se adapta su composición al atlas real, sin copiar su contenido ni alterar el encuadre inicial.

## Archivos y presentación

- `src/features/anatomy/atlas/anatomy-ui.css`: estilos limitados a `.atlas-phase2`; header condicionado a la presencia de esa página. Tres zonas de escritorio, paneles más estrechos, fondo neutro y mayor espacio central. Buscador integrado, pestañas con línea fina, filas seleccionadas discretas, scrollbars suaves. Fichas con títulos, latín y metadata jerarquizados; controles verticales y barra horizontal de Despiece oscuros. Se conservan contenido, iconos, contadores dinámicos y controles reales.
- `src/features/anatomy/atlas/SkeletalAtlas.tsx`: únicamente una importación de CSS. Ningún cambio en JSX, handlers, hooks, estado, efectos o cálculos.
- `docs/anatomy-ui-redesign-delivery.md`: esta entrega.

Responsive revisado en 1366, 1050, 900, 768 y 390 px, sin desbordamiento horizontal. Se mantienen el drawer derecho hasta 1150 px y los paneles móviles existentes hasta 680 px, con cierre y apertura exclusiva. No se cambian los límites CSS del canvas, las filas virtuales ni sus posiciones. Las indicaciones decorativas no interceptan el puntero.

## Validación

- `npm run typecheck`: correcto.
- `npm run build`: correcto; 18 rutas. Se utilizó el adaptador WASM local de Rollup ya disponible en `.cache/` por el bloqueo del binario nativo en Windows, sin cambiar dependencias. Sólo permanece el aviso de tamaño del chunk compartido de Three.js.
- `npm run verify:anatomy`: correcto, ejecutado **una sola vez**.
- Chrome local con Playwright: carga, drag, zoom por botones/rueda, búsqueda por nombre y latín, expansión y teclado del árbol, selección por búsqueda/clic, hover, aislamiento, ocultación/restauración, capas, opacidad, tres modos de Despiece y retorno a 0%, seis vistas, centrado y actualización de fichas. En emulación móvil: paneles exclusivos y cerrables, scroll táctil, drag y pellizco. 40 comprobaciones aprobadas; sin errores JavaScript. No se afirma validación en un dispositivo físico.
- Comparación con la versión base: mismas 936 mallas cargadas y propiedades observables de posición, material, opacidad y picking; cámara inicial equivalente tras completar su animación. El Home conserva sus estilos al volver desde Anatomía.
- Diff revisado y `git diff --check` sin errores. Sólo CSS y su importación afectan al producto.

Confirmación explícita: **no se modificó ningún GLB, OBJ, catálogo, manifiesto, geometría, transformación, material anatómico, loader, Meshopt, registro espacial, módulo ni lógica del atlas. No cambiaron cámara, raycast, búsqueda funcional, árbol, fichas educativas ni la lógica de Exploded View.** No se editaron `public/models/`, `research/anatomy/` ni `scripts/anatomy/`. Home intacto.

## Capturas finales

Guardadas localmente en `.cache/anatomy-ui-redesign/`, excluidas del commit:

- [Desktop 1366](../.cache/anatomy-ui-redesign/desktop-1366.png)
- [Estructura seleccionada](../.cache/anatomy-ui-redesign/desktop-selected.png)
- [Árbol expandido](../.cache/anatomy-ui-redesign/tree-expanded.png)
- [Capas](../.cache/anatomy-ui-redesign/layers.png)
- [Tablet 1050](../.cache/anatomy-ui-redesign/tablet-1050.png)
- [Tablet 900](../.cache/anatomy-ui-redesign/tablet-900.png)
- [Móvil 390](../.cache/anatomy-ui-redesign/mobile-390.png)

Comparación visual: fondo negro coherente con Home, paneles más ligeros, información jerarquizada y modelo central con sus colores y funcionamiento originales. Capturas inspeccionadas después del build. Entrega mediante commit local, sin push, merge ni deploy.
