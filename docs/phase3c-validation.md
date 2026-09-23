# Fase 3C — validación final

Código probado: `eb84c2d206b0bda73bfa5112d9f7943ab3985126`. Base: `1d58140bec7cdf946f3400d461a218756799bbc5`. Las 14 ejecuciones de la [secuencia final](phase3c/results/commands.json) terminaron con código 0 sobre ese SHA. Después del commit de implementación no se modificó código, fuente o geometría; la entrega siguiente contiene sólo documentación.

## Pruebas estáticas, fuente y reconstrucción

Los logs entregados se normalizan a UTF-8/LF y se eliminan espacios finales y líneas vacías al final para cumplir `git diff --check`; se conservan los mensajes, avisos y códigos de salida.

- TypeScript sin errores; build de producción correcto, 18 rutas. Se conserva el aviso conocido de tamaño del chunk OrbitControls.
- Se ejecutaron los tests óseos, renderer, multisistema 3A y torso 3B originales, más `test-atlas-limbs.mjs`. Las cohortes de regresión mantienen sus totales originales; no se eliminaron pruebas para acomodar el catálogo ampliado.
- Los tests nuevos comprueban auditoría/bindings, clasificación de cuádriceps/cabezas, identidad/lateralidad, ausencia de duplicados, 24 fichas de familia, 12 componentes, contextos óseos explícitos y todos los 20 GLB reales.
- Cada módulo nuevo se prueba frente a fallo/reintento, cancelación tardía, descarga/recarga y liberación única de recursos. Los módulos anteriores permanecen cargados durante fallos de los nuevos.
- Posiciones Float32, topología orientada y multiplicidades comparadas con los 54 OBJ originales: 179.956 triángulos conservados y error máximo ~0,000060 mm frente a tolerancia 0,05 mm.
- Se repitieron las verificaciones geométricas 3A, 3B y 3C. Los 13 GLB musculares pasan el validador glTF, tanto comprimidos como decodificados, con cero errores y cero advertencias.
- La reconstrucción separada coincide byte por byte en ocho GLB y tres JSON. [Reproducción](phase3c/results/reproduction.json).
- Los 321 archivos protegidos de la base se conservan y los 87 IDs musculares anteriores permanecen. [Preservación](phase3c/results/preservation.json). Las fichas previas se comparan contra el código de la base.

## Navegador real

Chrome 153.0.8010.54 con ANGLE SwiftShader. Son 112 comprobaciones agrupadas, no 112 dispositivos ni certificados anatómicos.

| Conjunto | Comprobaciones | Estado | Evidencia |
|---|---:|---|---|
| Fase 3C | 32 | PASS | [JSON](phase3c/results/limbs-functional/limbs-functional.json) |
| Fase 3B | 23 | PASS | [JSON](phase3c/results/torso-functional/torso-functional.json) |
| Fase 3A | 30 | PASS | [JSON](phase3c/results/pilot-functional/pilot-functional.json) |
| Óseo | 26 | PASS | [JSON](phase3c/results/skeletal-functional/browser-qa.json) |
| Árbol virtualizado 3A | 1 | PASS | [JSON](phase3c/results/pilot-tree/pilot-tree.json) |

En Fase 3C se cargan por separado los ocho módulos; se seleccionan los 48 músculos y las 12 cabezas; se prueba el grupo cuádriceps bilateral; se valida la búsqueda en español/latín, la información de tipo/sistema/región y el árbol con Home/End y selección visible. La búsqueda por FMA/FJ y sinónimos también se comprueba en el índice real.

Las pruebas de interacción cubren aislamiento, ocultar/mostrar, selección por raycast, hover distinto del cian seleccionado, contexto óseo ipsilateral, opacidades 100/75/50/25/10 %, independencia del óseo, recarga repetida y fallo de red con reintento explícito. No se ocultan capas profundas al cambiar de cámara.

Un intento previo en SwiftShader alcanzó el plazo de 20 minutos con 29 comprobaciones superadas, sin errores de navegador ni HTTP. El ejecutor final permite `QA_SUITE_TIMEOUT_MS=2400000` (40 minutos); sólo cambia el plazo global, no las aserciones ni las mediciones. El [diagnóstico](phase3c/results/test-adjustment.json) conserva ese intento y el ajuste anterior de la etiqueta regional de búsqueda.

Otra ejecución no encontró el estado de opacidad esperado tras una pausa fija. Un diagnóstico de 25 combinaciones de vista/opacidad pasó sin reproducir un fallo persistente. El ejecutor final espera las propiedades reales de todos los materiales antes de comprobarlas, y el despiece espera el estado solicitado de reposo o desplazamiento. Las aserciones se mantienen; el código de aplicación no cambió por este ajuste del ejecutor.

Las seis vistas se ejercitan en navegador; el encuadre de todos los nodos nuevos se prueba numéricamente en tres proporciones, con los ocho vértices del bounding box dentro del frustum y cámara fuera de su esfera límite. El despiece mantiene los sistemas como bloques y cada miembro inferior completo en su bloque regional; estructuras tienen desplazamiento limitado. Todos los niveles vuelven exactamente al reposo al 0 %.

Responsive: 1366 × 768, 1050 × 844, 900 × 1000 y 390 × 844. Se comprueban ausencia de overflow horizontal, acceso a árbol, capas, búsqueda, ficha y viewport. Los paneles largos requieren scroll explícito.

Las regresiones conservan la representación WebGL de corazón, pulmones y encéfalo en sus visores propios. Las 14 rutas de Procedimientos/Primeros Auxilios siguen respondiendo y mostrando encabezados; no se alteraron sus contenidos ni la home.

## Capturas y revisión

La suite del piloto terminó sus 30 comprobaciones con código 0, pero registró `Browser teardown: exceeded 5000ms` al cerrar Chrome. La consulta posterior de procesos encontró sólo el navegador de rendimiento entonces activo, y la comprobación final encontró cero navegadores de QA. Se conserva el aviso y la [auditoría de cierre](phase3c/results/browser-process-audit.json).

63 PNG finales tomados de la compilación del código probado. Incluyen las vistas corporales, regiones y compartimentos nuevos, cuádriceps seleccionado/aislado, pantorrilla, antebrazo, contextos, tres niveles de despiece, cuatro anchuras, paneles móviles, 15 capturas de opacidad y músculos profundos con y sin aislamiento.

No hay capturas de intrínsecos de mano/pie porque quedaron fuera del alcance aprobado; las tomas 19/20 se usan para tibial posterior y supinador. Cada archivo se inspeccionó individualmente y tiene hash y observación en la [revisión visual](phase3c-visual-review.md) y el [manifiesto](phase3c/results/capture-manifest.json).

El total se desglosa en 61 capturas del recorrido principal, una de regresión del árbol y una complementaria del compartimento medial derecho aislado. La toma 07 mantiene la oclusión por la extremidad contralateral; la 07b la elimina mediante aislamiento, aunque aductor largo y grácil se superponen en esa perspectiva. Su [reporte complementario](phase3c/results/supplemental-captures/supplemental-captures.json) conserva el estado y el script de reproducción.

En el contexto del gastrocnemio se observa una separación distal entre las mallas de sus cabezas y el calcáneo: la geometría aprobada no representa una continuidad tendinosa completa hasta ese hueso. Se conserva la fuente sin añadir ni estirar superficies. Mostrar contexto expresa una relación educativa, sin validar puntos de fijación geométricos. La transparencia de varias capas acumula opacidad y produce bandas tonales; al 25/10 % se distinguen mejor los huesos y disminuye el contraste muscular. Aislar permite examinar los músculos profundos.

Los datos de cada toma incluyen selección, viewport, métricas y estado real de las mallas en [capturas](phase3c/results/captures/limbs-captures.json). Los renders no acreditan precisión clínica; se documentan oclusión, faceteado y acumulación de transparencia.

## Reproducir la comprobación

```sh
npm run typecheck
npm run verify:anatomy
node scripts/anatomy/optimize-muscular-pilot.mjs --verify-only
node scripts/anatomy/optimize-muscular-torso.mjs --verify-only
node scripts/anatomy/optimize-muscular-limbs.mjs --verify-only
node scripts/anatomy/validate-muscular-gltf.mjs
npm run build
node scripts/anatomy/limbs-qa.mjs --functional
node scripts/anatomy/torso-qa.mjs --functional
node scripts/anatomy/pilot-qa.mjs --functional
node scripts/anatomy/browser-qa.mjs
node scripts/anatomy/pilot-qa.mjs --tree
node scripts/anatomy/limbs-qa.mjs --performance
node scripts/anatomy/limbs-qa.mjs --captures
```

Requiere Playwright/Chrome y las herramientas glTF de la fase anterior. Se pueden indicar `ANATOMY_PYTHON`, `QA_PLAYWRIGHT_MODULE`, `QA_BROWSER_EXECUTABLE`, `QA_OUTPUT_DIR` y `QA_SERVE_DIR`. En este entorno se estableció `QA_SUITE_TIMEOUT_MS=2400000` para las suites nuevas. El navegador de QA usa un servidor local y no publica el sitio.
