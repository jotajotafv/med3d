# Fase 5: validación

Código final: `a2fbbb43182480c06be92a4c7d74e3a71ed51829`. Implementación y build: `a8e4581327532414aed9da12b6deaf3ce69525de`; el checkpoint posterior sólo corrige dos scripts de pruebas, sin cambios en `src/`, `public/` ni `research/`. La [identidad de implementación](phase5/implementation-identity.json) registra hashes de archivos y blobs Git. Los reportes finales de navegador señalan `implementationDirty: false`; `workingTreeDirty: true` se refiere a documentación nueva todavía sin commit. Cada reporte conserva el SHA real de su ejecución.

## Desarrollo incremental

Sólo pruebas cardiovasculares, typecheck cuando correspondía, comprobación de geometría nueva y revisión regional. El [reporte regional de desarrollo](phase5/regional-development.json) conserva honestamente el HEAD base y el árbol de implementación entonces modificado; no se presenta como ejecución posterior al commit.

Se comprobaron corazón y 16 familias vasculares representativas: búsqueda español/latín/FMA/FJ, fichas, selección, aislamiento, ocultar/mostrar, enfoque y vistas anterior/posterior/lateral. El corazón se probó en seis orientaciones. Muestras de triángulos renderizados permanecieron dentro del frustum. Hubo raycast y hover reales sobre radial, safena y pared auricular, con selección cian y sin geometría de picking engrosada.

Subcapas arterial, venosa y cardíaca; colores pulmonares por tipo; contexto femoral–huesos y coronaria–corazón; cuatro opacidades independientes; cardiovascular 100/50/25%, óseo 25%, muscular/nervioso 10%; DoubleSide, depthTest y depthWrite=false bajo 100%. Los tres modos de despiece restituyeron exactamente sus posiciones de reposo al 0%. Los vasos se mantienen en bloques regionales en Regiones/Estructuras.

Los siete módulos descargaron/recargaron sin incremento de buffers; un fallo de transporte regional preservó las otras piezas y se recuperó con reintento. Árbol ARIA virtualizado y teclado; laptop, tablet y móvil sin overflow horizontal.

## Única regresión global de cierre

- `npm run typecheck`: PASS.
- `npm run verify:anatomy`: PASS; catálogo/renderer/multisistema/tronco/extremidades/cabeza-cuello/cobertura muscular adicional, sin eliminar pruebas.
- Suites nerviosa original y expansión: PASS.
- `node scripts/test-atlas-cardiovascular.mjs`: PASS; 134 identidades fuente, propietarios únicos, búsqueda y fichas, preservación histórica, cuatro sistemas y geometría.
- `npm run build`: PASS; 18 rutas estáticas. Advertencia conocida de chunk >500 kB registrada.
- Regresión funcional de navegador: capas históricas, selección, contexto, búsqueda global, árbol/teclado, módulos/reintento, despiece, responsive y tres órganos independientes completados. El [reporte original](phase5/nervous-functional.json) conserva `success: false`: el conteo inmediato de `h1` en Vendaje se adelantó al contenido diferido. La captura de fallo mostró la página ya cargada, sin errores de aplicación. La [continuación acotada](phase5/routes-continuation.json), con espera visible de hasta 30 s, comprobó esa ruta y las nueve pendientes: PASS. No se repitió toda la regresión ni se modificó contenido. El [script de reproducción](phase5/recheck-routes.mjs) se conserva como evidencia; no se eliminaron aserciones.
- [Capturas del build final](phase5/cardiovascular-captures.json): 35 imágenes cardiovasculares nuevas. La primera ejecución produjo 28 imágenes válidas y se detuvo porque el arnés buscaba la raíz compuesta `body` en catálogos fuente. El checkpoint QA corrigió esa referencia y la espera de rutas; se reanudaron únicamente las capturas 29–35. Ambos reportes originales se conservan y el índice combinado identifica el SHA de cada captura. No se alteró la aplicación ni se regeneraron las primeras 28 imágenes.
- [Siete configuraciones finales](phase5/cardiovascular-performance.json): PASS; selección, aislamiento, despiece, descarga/recarga y buffers, sin errores capturados.

[Comandos, timestamps y códigos de salida](phase5/final-command-results.json); logs `phase5/final-*.txt`. La geometría nueva tiene cero errores/advertencias Khronos y comparación de todos los triángulos orientados con originales, documentada en [registro](phase5-registration.md).

## Revisión visual

Las 35 capturas se revisan en [índice y observaciones](phase5/visual-review.md), con evidencia de red corporal, corazón/grandes vasos, arterias/venas regionales, contexto, transparencia, cuatro sistemas, despiece, búsqueda/árbol y tres formatos de pantalla. No se infiere continuidad vascular cerrada ni validación clínica. La captura es una revisión educativa de las vistas registradas, no una auditoría exhaustiva de toda posible intersección o combinación de cámara.

## Correcciones y límites

Durante la integración se corrigieron los alias para búsqueda por ID estable y la lateralidad de paredes/cavidades auriculares. Se excluyó la aorta descendente alternativa para evitar doble representación y se distinguieron explícitamente cavidades, paredes, valvas y vasos. Los colores separan categoría anatómica de selección y de oxigenación.

No hubo cambio de código en Home, Procedimientos, Primeros Auxilios, exploradores HRA ni catálogos/assets históricos. No se reconstruyeron sus GLB. Permanecen las ausencias cardiovasculares, discontinuidades y limitaciones de nomenclatura detalladas en la auditoría. Transparencia estándar con solapes; no OIT. SwiftShader no permite afirmar rendimiento de GPU física o móvil real.
