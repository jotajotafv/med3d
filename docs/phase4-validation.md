# Fase 4 — validación

Código final: `ed7e11544c4b1720b46e3124b174e967d56a99f7`. Base `3373a06bed350c7af13f26dd1c461448c0650885`.

## Resultado

- `npm run typecheck`: aprobado; repetido sólo para la corrección incremental final de activación de capas.
- `npm run verify:anatomy`: **una ejecución global**, aprobadas sus siete suites históricas (catálogo, renderer, multisistema, torso, miembros, cabeza/cuello y cierre muscular). Ninguna prueba eliminada.
- `npm run build`: aprobado y 18 rutas estáticas generadas. Se recompiló la corrección de entrada regional; un intento intermedio tuvo una restricción de lectura de esbuild del entorno, resuelta con ejecución local autorizada. No fue un fallo de arquitectura ni despliegue.
- `node scripts/test-atlas-nervous.mjs`: cinco grupos aprobados; identidad, jerarquía/IDs/regiones, 79 fichas, búsqueda, rechazo de marco incompatible, contexto curado, despiece, hashes y trazabilidad.
- Conversión original→decodificado y Khronos: [registro](phase4-registration.md). [Reproducción desde OBJ](phase4/reproducibility.json): los dos GLB, catálogo, manifiesto y reporte salen byte por byte iguales. No se reconstruyeron activos históricos.

## Navegador

[Suite funcional](phase4/nervous-functional.json): siete grupos aprobados. Siete unidades representativas pasan búsqueda por todos sus identificadores, fichas, aislamiento, ocultación y restauración; seis vistas para SNC/órbita; contexto explícito; opacidad 100/50/25 independiente; módulos y sistemas; tres despieces y cero exacto; fallo/recuperación de descarga; raycast/hover reales y selección cian; búsqueda histórica y árbol virtual; responsive; corazón, pulmón y encéfalo independientes; rutas generales, incluidos Procedimientos y Primeros Auxilios sin modificar sus archivos.

[Entrada regional](phase4/nervous-entry.json): se abre sólo `nervous:cns`, se activa Muscular y se restaura el subconjunto nervioso recordado. Corrige el caso en que el filtro de módulos impedía activar un sistema diferente.

[Rendimiento final](phase4-performance.md), [26 capturas](phase4/nervous-captures.json), [revisión visual y hashes](phase4/capture-review.json). Los informes crudos registran HEAD base y working tree modificado porque se recogieron antes del commit; no afirman que la base ya incluyera Fase 4. La funcional completa precede a la corrección regional menor; su caso específico y rendimiento/capturas se verificaron después. La normalización posterior del inventario sólo corrigió serialización/filas pendientes: los 87 FMA/FJ aprobados y los GLB son idénticos.

Revisión visual de las 26 capturas: anterior/posterior/lateral, SNC, encéfalo, cerebelo/tronco, órbita, selección/aislamiento/contexto, tres capas, despiece, árbol/búsqueda y laptop/tablet/móvil. Sin clipping grave de la selección; el foco estrecho puede recortar anatomía de contexto. Se conserva la limitación de ordenar superficies transparentes superpuestas. Sin validación clínica ni prueba de GPU física.

## Correcciones acotadas

1. Activación de otro sistema desde una URL con módulos regionales filtrados.
2. Referencias de región nerviosa enlazadas a nodos reales del catálogo.
3. Lectura UTF-8 explícita del historial de auditoría y serialización LF reproducible; evita dos filas pendientes duplicadas por codificación. La cobertura aprobada no cambió.

No se repitió la regresión global tras cada ajuste; se ejecutaron sólo comprobaciones específicas del cambio.
