# Fase 2.1: método de medición de rendimiento

Fecha de preparación: 14 de septiembre de 2026.

Las mediciones reproducibles se ejecutan sobre la compilación de producción. El archivo `performance-qa.json` registra los valores de la ejecución; este documento no convierte pruebas de viewport en pruebas sobre hardware físico.

## Ejecución

```sh
npm ci
npm run build
node scripts/anatomy/browser-qa.mjs
node scripts/anatomy/performance-qa.mjs
node scripts/anatomy/visual-qa.mjs
```

Se requiere Playwright y Chromium. `QA_PLAYWRIGHT_MODULE` permite indicar la instalación de Playwright; `QA_BROWSER_EXECUTABLE`, un Chromium disponible; `QA_OUTPUT_DIR`, el destino de resultados. El servidor HTTP y el navegador se mantienen en el mismo proceso para evitar depender de conectividad entre sesiones aisladas. Los archivos se sirven con `Cache-Control: no-store`.

## Qué se mide

| Medida | Método y alcance |
| --- | --- |
| Primera geometría | Marca en `scene.onAfterRender`, después del primer render con recursos anatómicos. Duración desde la creación del gestor de assets, no desde la navegación. |
| Sistema completo | Marca después del primer render con todos los módulos solicitados inicialmente. No incorpora pausas artificiales para estabilizar capturas. |
| Transferencia de modelos | Resource Timing: duración, bytes de cuerpo codificado y bytes transferidos de cada GLB. HTTP local sin compresión adicional ni limitación de ancho de banda. |
| Rotación | Tres segundos de arrastre automatizado continuo; se registran timestamps distintos de `requestAnimationFrame` que realmente emiten dibujos WebGL. |
| Exploded View | Transición solicitada progresivamente de 0 a 100 % durante tres segundos; mismo muestreo de frames realmente dibujados. |
| FPS e intervalos | Número de intervalos dividido por tiempo entre primer y último frame. Se registran mediana y percentil 95 del intervalo. |
| Búsqueda | Evento de entrada hasta la mutación DOM que incorpora el resultado esperado; no incluye transporte de Playwright ni tiempo humano de escritura. |
| Cambio de región | Clic para descargar una región y confirmación de su retirada en las métricas. Después, búsqueda que solicita nuevamente la región hasta su carga. |
| Descarga y recarga completas | Acciones públicas de capas hasta actualización de las métricas; incluyen interacción automatizada, carga y confirmación React. |
| Memoria geométrica | Bytes de buffers decodificados propiedad del gestor y número de geometrías reportadas por Three.js. No son una medida directa de VRAM. |
| Memoria JavaScript | `JSHeapUsedSize` y `JSHeapTotalSize` del protocolo de Chromium. No se fuerza GC: una subida temporal del heap no demuestra por sí sola una fuga. |
| Llamadas y triángulos | Contadores del renderer y del catálogo. Las geometrías descargadas pueden seguir en memoria mientras otra estructura esté aislada; ocultación y descarga son operaciones diferentes. |

El script comprueba que descargar el sistema deja cero bytes de geometría propiedad del gestor y que una recarga devuelve el mismo volumen de buffers, sin crecimiento acumulado. Las pruebas funcionales verifican además liberación de geometrías del renderer, renderizado detenido en reposo, búsqueda, árbol virtual, controles, recuperación de errores y compatibilidad con órganos previos.

## Perfiles y límites

El perfil de medición disponible es Chromium sin interfaz, ANGLE SwiftShader, DPR 1 y viewport 1366 × 768. Las capturas responsive adicionales usan 1440 × 900, 1050 × 844, 900 × 1000 y 390 × 844. Son tamaños de viewport; no emulan una GPU física, RAM disponible, temperatura, pantalla táctil o conexión móvil.

No se ha medido un desktop, portátil con GPU integrada, móvil de gama media ni tablet físicos. Los resultados SwiftShader deben conservar esa etiqueta y no extrapolarse. El runtime local carece de `/proc`; los binarios Chromium 133 y 153 pudieron responder `--version`, pero abortaron antes de abrir una página. La ejecución real requiere el entorno remoto de validación.

La revisión visual de los PNG es una comprobación separada. Generar una captura no significa haberla inspeccionado ni haber aprobado proporciones anatómicas.

## Estrategias futuras si aparece un problema medido

Con aproximadamente una llamada por hueso, la selección individual sigue siendo sencilla y los costes actuales son observables. Antes de cambiar esta arquitectura, medir el mismo recorrido de cámara en hardware objetivo. Si aparece un límite real:

- Batching o merging selectivo de partes no seleccionables, conservando un mapa verificable de IDs para las estructuras identificables.
- Instancing sólo para geometrías realmente compartidas; no convertir huesos de distinta forma o lateralidad en copias por conveniencia.
- BVH para reducir coste de raycasting en meshes complejos; no elimina llamadas de dibujo.
- LOD validado contra la geometría anatómica original, con especial cuidado en carpo, tarso, superficies articulares y estructuras pequeñas.
- Mantener carga por módulos y ownership explícito de buffers antes de introducir cachés globales.

Las cifras finales y el commit ensayado se incorporan al informe de validación después de ejecutar y revisar esta versión.
