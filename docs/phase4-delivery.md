# Fase 4 — cierre local del Sistema Nervioso

**Cerrada localmente para revisión.** No desplegada; no se inicia Fase 5.

Rama `phase4-nervous-system`, base `3373a06bed350c7af13f26dd1c461448c0650885`, código probado `ed7e11544c4b1720b46e3124b174e967d56a99f7`. El commit documental es el siguiente commit de esta rama y su padre es este código; su SHA y los datos finales del bundle se entregan al cierre, evitando autorreferencias de hash.

## Cobertura

Sólo **BodyParts3D 4.0 OBJ99 / DBCLS**, con `(x,y,z) → (x,z,-y)/1000`, marco `bodyparts3d-4.0-male`. Sin registro secundario, normalización por pieza, reflejo o decimación adicional. HRA encefálico conserva su explorador independiente y sus bytes.

- **SNC:** regiones encefálicas disponibles, cerebelo, mesencéfalo, puente, bulbo y nervios ópticos. No es un encéfalo exhaustivo.
- **SNP:** nervios trocleares, ramas superior/inferior del III, V1 y ramas orbitarias identificadas, ganglios ciliares. No se anuncian III/V completos.
- **Pendiente:** médula (FJ1737 es conducto, FJ4426/4.3 no suficientemente resuelto, HRA sin registro demostrado), raíces/nervios espinales, cuatro plexos y nervios principales de miembros superiores/inferiores. Otros pares craneales y regiones encefálicas no disponibles permanecen ausentes. Pineal aplazada; espacios ventriculares descartados como tejido.

Auditoría: **87 elementos aprobados**, 6 descartados como tejido, 1 elemento aplazado y 29 filas de cobertura pendiente. **79 unidades nuevas: 30 estructuras y 49 componentes**, 43 familias anatómicas/46 claves educativas. **87 mallas, 317.674 triángulos, 2.933.120 bytes GLB**, dos módulos `nervous:cns` (57 mallas) y `nervous:cranial` (30). Geometría original completa conservada; error máximo numérico `6.00541066033e-8 m`; glTF 0 errores/advertencias.

Catálogo corporal final: **598 nodos, 385 estructuras de categoría structure, 474 mallas, 27 módulos, 1.715.984 triángulos, 16.267.924 bytes GLB**. El número de estructuras no suma componentes como órganos completos. Se preservan los 509 nodos fuente históricos y sus IDs; no se reconstruyen sus activos.

## Funciones y evidencia

Árbol corporal con tres sistemas y sólo ramas con contenido. Búsqueda en español, latín, alias, FMA y FJ; corazón, pulmones y HRA siguen accesibles como modelos independientes. Selección/raycast/hover, seis vistas, foco, aislamiento, ocultación/restauración, carga/descarga y recuperación comprobados.

Tres capas independientes. Dorado discreto, emisivo bajo, cian para selección. DoubleSide/depthTest y depthWrite desactivado bajo 100 %; pruebas 100/50/25. No OIT. Fichas nerviosas propias y contexto óseo curado sin inferir inervaciones. Despiece Sistemas/Regiones/Estructuras: cero exacto y trayectos orbitarios coherentes.

**Pruebas aprobadas**, una regresión global histórica, suite nerviosa, pruebas funcionales y corrección regional focalizada. **26 capturas revisadas**, sin repetir series históricas. Rendimiento final **SwiftShader**, no GPU física: conjunto completo disponible en 1.118 ms, buffers 30.386.236 B; sólo nervioso 202 ms y 5.480.484 B. Detalle de las cinco configuraciones en [rendimiento](phase4-performance.md).

Limitaciones: cobertura central/periférica parcial, transparencia con superficies superpuestas, nervios finos dependientes del zoom/aislamiento, contexto geométrico recortado en enfoques estrechos, sin certificación clínica. Correcciones: entrada por módulo que bloqueaba activar otras capas; región nerviosa sin nodo; lectura UTF-8 del inventario pendiente.

## Git y entrega

Sólo dos commits: código y documentación/evidencias. El documental contiene exclusivamente `docs/`. Al cierre se exige working tree limpio. `main` y `origin/main` permanecen en `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`; `phase11-first-aid` en `a391093cd28b975673fd0fc1e6b87fa1aeafed29`, incluido `29a2947`, intactos. Sin push, merge, cherry-pick, cambios en Primeros Auxilios/Procedimientos/Home ni inicio de Fase 5.

Bundle solicitado: `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase4.bundle`. Incluirá la historia completa de Fase 4, más referencias separadas de main y Primeros Auxilios, sin fusionarlas. Verificación `git bundle verify`; tamaño/SHA-256 se registran en el recibo externo `med3d-phase4-transfer.txt` y en el informe final. No se sobrescriben bundles anteriores. El recibo queda fuera del repositorio para evitar circularidad de hashes.

[Auditoría](phase4-audit.md) · [Fuentes](phase4-sources.md) · [Comparación](phase4-source-comparison.md) · [Registro](phase4-registration.md) · [Educación](phase4-education.md) · [Validación](phase4-validation.md) · [Rendimiento](phase4-performance.md).
