# Fase 10 · validación

Código final probado `9c778713cf37e3736850daaeba21108a62c443f6`, guardado antes de la **única campaña global final**. [Registro y tiempos](phase10/campaign.json). No hubo corrección de código posterior ni repetición de la campaña. El desarrollo utilizó pruebas regionales, validación de geometría nueva y previews; no una regresión global tras cada cambio.

| Comprobación | Resultado |
|---|---|
| `npm run typecheck` | PASS · [log](phase10/typecheck.txt) |
| `npm run verify:anatomy` | PASS · siete suites óseas/musculares históricas · [log](phase10/verify-anatomy.txt) |
| Nervioso y expansión | PASS · [nervioso](phase10/nervous.txt), [expansión](phase10/nervous-expansion.txt) |
| Cardiovascular, respiratorio, digestivo | PASS · [cardiovascular](phase10/cardiovascular.txt), [respiratorio](phase10/respiratory.txt), [digestivo](phase10/digestive.txt) |
| Sistemas internos y tegumentario | PASS · [internos](phase10/internal.txt), [piel](phase10/integumentary.txt) |
| Seis comprobaciones específicas de Fase 10 | PASS · [log](phase10/integration.txt) |
| glTF ocular comprimido/decodificado | Cero errores/advertencias · [informe](phase10/gltf-validation.json) |
| `npm run build` | PASS, 18 rutas estáticas; aviso conocido de chunk >500 kB · [log](phase10/build.txt) |
| Once sistemas, árbol, órganos independientes, rutas | PASS · [navegador final](phase10/browser-integration.json) |
| Cuatro configuraciones finales de rendimiento | PASS sin errores de aplicación; recarga recupera buffers · [comparativa](phase10-performance.md) |
| 35 capturas finales | PASS, sin errores de aplicación/solicitudes inesperadas · [informe](phase10/browser-captures.json), [revisión](phase10/visual-review.md) |

Los tests específicos finales comprueban: 11 sistemas/580 estructuras/981 nodos/937 mallas/52 módulos; propietarios únicos y archivos históricos iguales; búsqueda solicitada en español/latín/FMA/FJ/ID y contexto explícito; prioridad de piel opaca/paso transparente/fallback aislado; resaltado incremental semánticamente equivalente, sin recorrer todo por cada hover; cero exacto y bloque ocular en tres niveles; originales fijados por hash, topología, Float32, lateralidad y rechazo de extensiones incompatibles.

[Prueba regional incremental](phase10/regional-development.json), nueve comprobaciones: seis vistas, cinco opacidades, picking real, ocultar/restaurar, descarga de sistema/módulo y buffers acotados; prioridad de superficie opaca, selección interna a 25 %, raycast a 75/50/25/10 %, piel aislada y acciones explícitas; tres piezas por ojo, selección de iris, aislamiento unilateral y contexto; fallo simulado de descarga ocular seguido de recuperación; despiece ocular coherente y cero; panel en 1366/1050/900/768/390. El informe declara HEAD base e implementación sin commit por ejecutarse durante desarrollo. Incluyó un ensayo de culling ocular; la configuración final vuelve a DoubleSide y se revisa en la galería final. Las pruebas finales de geometría e integración corresponden al commit final.

La integración final comprueba búsqueda/selección/aislamiento de los once sistemas, resultados de órganos independientes, árbol virtualizado con menos de 100 filas DOM expandido y navegación ARIA/Home/End. Render real de corazón, pulmones y encéfalo HRA; Home, Procedimientos, Primeros Auxilios, Acerca y Arquitectura responden 200 con contenido. No se modificaron sus contenidos. [Alcance y referencias protegidas](phase10/scope-check.json).

Responsive son viewports simulados, no teléfonos físicos. Los 35 PNG fueron inspeccionados; se documentan penetraciones reales, pupila pálida y densidad del despiece. No se declara validación clínica. [Inventario de evidencias y SHA-256](phase10/evidence-manifest.json).
