# Fase 9 · validación

Código probado: `b6a21cafacaa993342b81a287a59ce95b8b21d4d`. Una campaña global final después del commit de implementación; [registro de comandos y tiempos](phase9/campaign.json). No se borraron pruebas ni se recompilaron activos históricos. El desarrollo previo usó validación regional y un build de previsualización; no otra campaña global.

| Comprobación final | Resultado / evidencia |
|---|---|
| `npm run typecheck` | PASS · [log](phase9/typecheck.txt) |
| `npm run verify:anatomy` | PASS · siete suites óseas/musculares históricas · [log](phase9/verify-anatomy.txt) |
| Nervioso / expansión nerviosa | PASS · [nervioso](phase9/nervous.txt), [expansión](phase9/nervous-expansion.txt) |
| Cardiovascular / respiratorio / digestivo | PASS · [cardiovascular](phase9/cardiovascular.txt), [respiratorio](phase9/respiratory.txt), [digestivo](phase9/digestive.txt) |
| Cuatro sistemas internos | PASS · [log](phase9/internal.txt) |
| Seis comprobaciones específicas de Tegumentario | PASS · [log](phase9/integumentary.txt) |
| GLB comprimido y decodificado | Cero errores/advertencias · [JSON](phase9/gltf-validation.json) |
| `npm run build` | PASS, 18 rutas estáticas; aviso conocido de chunk >500 kB · [log](phase9/build.txt) |
| Integración de once sistemas en navegador | PASS · [informe](phase9/integumentary-integration.json) |
| Seis configuraciones de rendimiento | PASS, buffers acotados al descargar/recargar · [mediciones](phase9-performance.md) |

Los tests específicos verifican 578 estructuras, 972 nodos, 931 propietarios únicos de malla, 51 módulos, once sistemas; igualdad de IDs/nodos de los diez sistemas previos; búsqueda española, latina, inglesa, FMA/FJ/BP e ID interno; ancestros/restauración; referencias educativas existentes; picking según opacidad; piel fija y cero exacto en tres niveles; hashes; transformada; 24 controles espaciales y topología nativa.

La validación regional incremental en navegador comprobó seis vistas, ficha, clic real de piel, aislamiento, ocultación/restauración, carga/descarga de sistema y módulo, buffers restituidos y recuperación de descarga fallida. Verificó DoubleSide/depthTest y depthWrite desactivado bajo 100 % en **100/75/50/25/10 %**; clic real del riñón atravesando piel a 75/50/25/10 %, selección de piel por búsqueda, y picking cutáneo recuperado al aislarla. [Informe de desarrollo](phase9/regional-development.json): declara HEAD base y cambios de implementación, por haberse ejecutado antes del commit; no se presenta como una segunda campaña final.

La integración final confirma búsqueda/selección/aislamiento entre los diez sistemas históricos, resultados de órganos independientes, árbol virtualizado (<100 filas DOM), ARIA, Home/End, y render real de corazón, pulmones y encéfalo HRA. Home, Procedimientos, Primeros Auxilios, Acerca y Arquitectura responden 200 con contenido. [Alcance sin cambios de contenido ni activos históricos](phase9/scope-check.json).

El panel de once capas conservó controles accesibles y sin desborde horizontal en 1366×768, 1050×844, 900×1100 y 390×844. Las capturas finales cubren laptop, tablet y móvil simulado; no acreditan rendimiento de hardware móvil.

La galería final contiene 30 capturas del mismo código: [informe de captura](phase9/integumentary-captures.json) y [revisión visual](phase9/visual-review.md). La comprobación explícita de inicio verifica diez sistemas cargados y piel apagada; al activarla pasa de 930 a 931 mallas. La cámara conserva vistas anatómicas y enfoca cuerpo/cabeza/tórax/espalda/mano/pie. El enfoque de detalle usa referencias anatómicas descargadas antes de capturar, sin inventar regiones cutáneas.

Sin errores de aplicación ni solicitudes fallidas no previstas en la integración y capturas finales. Las fuentes contienen aperturas y pequeños fragmentos conservados: [registro y límites](phase9-registration.md). Esta validación es técnica y visual, no clínica.
