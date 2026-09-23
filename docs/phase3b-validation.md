# Fase 3B — validación local del código definitivo

Código: `5c6b6e32aca61ebee8ae14f418a5c32c2eaf686a`. Base: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. Fecha: 23 de septiembre de 2026. Esta evidencia corresponde al build local del commit de implementación; no se atribuye a CI ni a una publicación remota.

## Identidad y secuencia

Se recuperaron 11 archivos modificados y 18 nuevos, se revisó el trabajo heredado y se validó antes del primer commit. Después de fijar el código se repitieron los comandos críticos, se reconstruyó `dist` y se ejecutaron las suites de navegador, rendimiento y capturas secuencialmente. La documentación quedó visible y pendiente durante esa ejecución; no hubo cambios en `src`, `scripts`, `public`, `research` o `package.json` después del commit de implementación.

El [registro de comandos](phase3b/results/commands.json) conserva argumentos, inicio/fin UTC, exit code y SHA por ejecución. [build-identity.json](phase3b/results/build-identity.json) conserva los 112 archivos del build, sus tamaños y hashes. [evidence-manifest.json](phase3b/evidence-manifest.json) identifica los resultados y las imágenes entregadas. Las evidencias preliminares de la sesión interrumpida permanecen en `.cache/phase3b`; no se mezclan con los informes finales.

## Comprobaciones técnicas

| Comando | Cobertura | Resultado |
| --- | --- | --- |
| `npm run typecheck` | TypeScript del proyecto | Exit 0 |
| `npm run verify:anatomy` | Catálogo óseo, cámara, gestor, multisistema piloto y nueva suite de torso | Exit 0 |
| `npm run build` | Producción Vite y 18 rutas estáticas | Exit 0 |
| `node scripts/anatomy/optimize-muscular-pilot.mjs --verify-only` | 26 originales, dos GLB del piloto, hashes, posiciones y triángulos | Exit 0; 39.604 triángulos conservados |
| `node scripts/anatomy/optimize-muscular-torso.mjs --verify-only` | 34 originales, tres GLB del torso y comparación de geometría | Exit 0; 523.876 triángulos conservados |
| `node scripts/anatomy/validate-muscular-gltf.mjs` | Cinco GLB comprimidos y decodificados | Cero errores y advertencias |

Logs: [typecheck](phase3b/results/typecheck.txt), [suite anatómica](phase3b/results/verify-anatomy.txt), [build](phase3b/results/build.txt), [piloto](phase3b/results/pilot-geometry.txt), [torso](phase3b/results/torso-geometry.txt), [glTF](phase3b/results/gltf-validation.json). La advertencia de Vite por el paquete `OrbitControls` de aproximadamente 920 kB minificado permanece; no se confundió con fallo de build. PowerShell registra stderr nativo como `NativeCommandError` en el log, pero el proceso terminó con código 0.

La suite de torso prueba los bindings auditados, selección fijada, hashes originales/finales, 26 unidades, 34 hojas con dueño, doce componentes, 21 familias educativas acumuladas, marco conservado y ausencia de familias no disponibles. Comprueba contextos ipsilaterales/línea media y subconjuntos específicos de porciones. Carga los doce GLB reales con 265 mallas, 1.075.930 triángulos y 18.359.392 bytes de buffers; prueba fallos de cada módulo nuevo, cancelación, conservación del otro sistema, liberación única y ciclos sin crecimiento. El despiece se valida numéricamente en todos los niveles con restauración exacta.

La suite original de Fase 3A sigue comprobando sus nueve GLB, 231 mallas y 552.054 triángulos. `pilot-catalog.mjs` conserva explícitamente esa cohorte dentro del catálogo ampliado; no sustituye los activos originales por mocks. Las regresiones previas no se borraron.

## Navegador final

Se sirve el build estático en loopback HTTP sin caché, bajo `/med3d/`, con Playwright y Chrome headless instalado. Se fuerza ANGLE SwiftShader y deviceScaleFactor 1. La captura usa movimiento reducido para estabilizar las transiciones; las pruebas funcionales conservan movimiento normal salvo la regresión dirigida del árbol. `?qa=1` expone posiciones/materiales/visibilidad de objetos Three.js reales para observación. La selección también se prueba con raycasting real sobre el lienzo.

| Ejecución | Comprobaciones | Informe |
| --- | ---: | --- |
| Torso funcional | 23 | [torso-functional.json](phase3b/results/torso-functional.json) |
| Piloto Fase 3A funcional | 30 | [pilot-functional.json](phase3b/results/pilot-functional.json) |
| Sistema óseo y órganos | 26 | [browser-qa.json](phase3b/results/browser-qa.json) |
| Regresión dirigida del árbol | 1 | [pilot-tree.json](phase3b/results/pilot-tree.json) |
| Rendimiento | 4 configuraciones | [torso-performance.json](phase3b/results/torso-performance.json) |
| Capturas | 48 imágenes | [torso-captures.json](phase3b/results/torso-captures.json) |

Los seis informes finales indican `success: true`, sin errores no controlados ni respuestas HTTP de error inesperadas. Las cuatro suites funcionales suman 80 comprobaciones aprobadas. El fallo de transporte inducido deliberadamente se comprueba por separado con reintento explícito; no se oculta como una petición sana.

Torso cubre las tres cargas/descargas independientes; selección de las 26 unidades con ficha de al menos 14 px; español, mayúsculas, tildes y latín; árbol expandido/virtualizado y Home/End; cuatro objetivos anatómicos en seis vistas; ocultación/aislamiento; hover distinto de selección cian; pectoral esternocostal derecho `bp3d:FMA79979` por raycast; cuatro contextos explícitos; quince estados de opacidad; determinismo y restauración del despiece; ciclos y cambios rápidos; fallo parcial con dos intentos, reteniendo 253 mallas; viewports 1366, 1050, 900 y 390 px; y catorce rutas educativas legibles.

Las 30 comprobaciones del piloto incluyen deltoides, bíceps, tríceps, braquial, manguito rotador, fichas/componentes, capas, opacidades, selección, contexto, fallos recuperables y árbol móvil. Las 26 óseas incluyen carga, búsqueda, árbol, cámara, fichas, selección, ocultación, transparencia, despiece, recursos, responsive y exploradores de corazón, pulmones y encéfalo. La prueba dirigida comprueba el historial de expansión del árbol con movimiento reducido.

## Evidencia visual y límites

Las 48 imágenes finales se abrieron para inspección visual. El [registro por captura](phase3b/visual-review.md) distingue resultados observados, limitaciones y acciones de aislamiento. Se generaron búsquedas vacías reales para abdomen profundo y dorsal ancho, porque no existen mallas aprobadas que mostrar. No se fabricaron capturas de estructuras ausentes.

La preservación de [132 archivos y nodos del piloto](phase3b/results/preservation.json), la [reproducción exacta](phase3b/results/reproduction.json) y la [comparación numérica](phase3b-registration.md) complementan los PNG. Ninguna de estas pruebas certifica clínica, precisión de contacto, ausencia de penetraciones, GPU física, móvil real o transparencia perfecta durante todo movimiento.

## Repetición de las pruebas

Instalar las dependencias del proyecto y herramientas geométricas fijadas en [registro](phase3b-registration.md). Configurar `ANATOMY_PYTHON`, `QA_PLAYWRIGHT_MODULE` y `QA_BROWSER_EXECUTABLE` si los ejecutables no son resolubles. `QA_OUTPUT_DIR` selecciona un directorio distinto por ejecución; `QA_SERVE_DIR` permite usar un build diferente y por defecto es `dist`.

```sh
npm run typecheck
npm run verify:anatomy
npm run build
node scripts/anatomy/torso-qa.mjs --functional
node scripts/anatomy/pilot-qa.mjs --functional
node scripts/anatomy/browser-qa.mjs
node scripts/anatomy/pilot-qa.mjs --tree
node scripts/anatomy/torso-qa.mjs --performance
node scripts/anatomy/torso-qa.mjs --captures
```

No ejecutar otras suites de navegador en paralelo con las mediciones de rendimiento. Los resultados de esta entrega son mediciones de una pasada local y no promedios de arranques independientes.
