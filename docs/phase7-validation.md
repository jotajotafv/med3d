# Fase 7 — validación final

Código probado **`bd0394ef1a2f94377c10eb384e02997cb890aaf6`**. Implementación limpia durante las pruebas finales; sólo se generan evidencias bajo `docs/`. Una única batería global de cierre sobre `079a7155f3d69be4b2b7ff5b7aca7ca35d6bf7f1`, seguida de una corrección puntual de animación. Los resultados siguientes corresponden a esa batería inicial:

- `npm run typecheck`: PASS.
- `npm run verify:anatomy`: PASS.
- `npm run build`: PASS.
- `node scripts/test-atlas-nervous.mjs`: PASS.
- `node scripts/test-atlas-nervous-expansion.mjs`: PASS.
- `node scripts/test-atlas-cardiovascular.mjs`: PASS.
- `node scripts/test-atlas-respiratory.mjs`: PASS.
- `node scripts/test-atlas-digestive.mjs`: PASS.

[Resultados y tiempos](phase7/final-checks.json), [logs](phase7/checks/build.txt). Tras el ajuste de animación `fb85dc66728ff67785b72c740fc102187f1c10cc` pasaron typecheck, renderer, suite digestiva y build; [resultados específicos](phase7/post-validation-checks.json). La integración transparente se repitió sobre ese renderer sin eliminar aserciones. Después, la revisión visual corrigió únicamente la región editorial del estómago y la secuencia de selección de capturas; `bd0394ef1a2f94377c10eb384e02997cb890aaf6` pasó suite digestiva, build y revisión de selección/aislamiento/búsqueda/árbol. [Checks finales específicos](phase7/visual-correction-checks.json) y [navegador](phase7/label-correction-browser.json). Renderer y todos los GLB permanecen idénticos a las mediciones; no se atribuyen al nuevo SHA ejecuciones hechas antes de él. No se repitió la batería global completa. La compilación produjo **18 rutas** y conserva la advertencia previa de chunk superior a 500 kB. No se eliminaron pruebas ni se reconstruyeron GLB históricos.

| Evidencia | Alcance |
|---|---|
| [Regional digestiva](phase7/browser/regional/digestive-regional.json) | Esófago, estómago, hígado, vesícula, páncreas, duodeno, delgado, colon, recto y oral; fichas, seis orientaciones, encuadre, aislamiento, ocultación y restauración. Raycast real y selección cian. Cuatro módulos, fallo/reintento y descarga/recarga. |
| [Integración](phase7/browser/integration/digestive-integration.json) | Seis sistemas activos, opacidad independiente, tres despieces/restauración exacta, búsqueda corporal y órganos independientes. |
| [Histórica funcional](phase7/browser/historical/nervous-functional.json) | Óseo/muscular/nervioso, navegación, órganos independientes y rutas generales, incluidos Home, Procedimientos y Primeros Auxilios. Cardiovascular/Respiratorio cubiertos también por sus suites y las configuraciones finales. |
| [Rendimiento](phase7/browser/performance/digestive-performance.json) | Ocho configuraciones A–H, con aislamiento/selección/despiece y descarga/recarga. |
| [Capturas](phase7/captures/digestive-captures.json) | 30 capturas finales; [revisión](phase7/visual-review.md) y [hashes](phase7/capture-manifest.json). |
| [Geometría](phase7/gltf-validation.json) | Cuatro módulos comprimidos/decodificados: 0 errores, 0 advertencias; todos los triángulos originales preservados. |
| [Protección histórica](phase7/protected-refs.json) | Refs y objetos Git históricos sin cambios. |

Transparencia digestiva probada a **100/75/50/25 %** con DoubleSide y depthTest; depthWrite=false bajo 100 %. Contextos óseo/muscular atenuados y vascular explícito. El hígado agrupa sus ocho piezas; las porciones yeyunales/ileales permanecen juntas en Despiece. **0 % devuelve exactamente las posiciones originales**.

Desarrollo incremental: auditoría, conservación geométrica, typecheck y tests específicos. La automatización inicial agotó 20 s al capturar varias capas y al finalizar una interacción responsive; se aumentó el plazo de esa suite a 120 s manteniendo las aserciones. La repetición específica responsive pasó y la suite final confirma el resultado. Se conserva [informe inicial](phase7/incremental-regional.json) y [repetición](phase7/incremental-responsive.json). Además, el [primer despiece con seis transparencias](phase7/initial-integration-failure.json) agotó 120 s. El [diagnóstico opaco](phase7/opaque-diagnostic.json) pasó. Se corrigió exclusivamente el límite artificial de delta de 50 ms en la interpolación de cámara y piezas: ahora usa tiempo real sin sobrepasar el objetivo. El [ensayo corregido](phase7/correction-preview.json) y la integración final conservan seis transparencias y todos los modos, con cero exacto. Ese ajuste cambió AtlasScene.tsx y la medición en la suite. El checkpoint final incorpora además la corrección regional del estómago en catálogo/generador, su aserción y la selección de capturas. Research y todos los GLB permanecen idénticos; public sólo cambia esa referencia de catálogo. Esto no es una medición de GPU física ni validación clínica.

Capturas: la secuencia original completó 01–22 y después intentó Enfocar sin selección, por lo que agotó el plazo esperando el panel de inspección. Se conserva el [fallo original de automatización](phase7/initial-captures.json). La [continuación utilizada](phase7/capture-continuation.mjs) vuelve a seleccionar Digestivo y completa únicamente 23–30 sobre el mismo código de esa ejecución, sin quitar aserciones. [Resultado de continuación](phase7/captures-continuation.json). El manifiesto final reúne ambas ejecuciones; no se presenta la primera secuencia como una ejecución íntegramente exitosa. Tras corregir la etiqueta se renovaron solamente 18/19/24/25, con prueba de navegador y conservación de las versiones previas. Cada captura final indica su commit observado; las otras 26 corresponden a vistas no afectadas. El generador principal también conserva la selección antes de Enfocar para que la secuencia completa pueda repetirse.
