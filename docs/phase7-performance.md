# Fase 7 — rendimiento final

Mediciones sobre `fb85dc66728ff67785b72c740fc102187f1c10cc`; código final `bd0394ef1a2f94377c10eb384e02997cb890aaf6` conserva exactamente renderer y GLB. La revisión posterior sólo corrigió la etiqueta regional del estómago y la secuencia de capturas, con comprobación en [trazabilidad](phase7/protected-refs.json). **Chromium headless con ANGLE/SwiftShader, WebGL por software**, viewport 1366×768, DPR 1. HTTP local loopback sin limitación, respuestas `no-store`. Una observación por configuración, secuenciales: no son arranques fríos independientes ni un benchmark estadístico.

| Configuración | GLB bytes | Mallas | Triángulos | Buffers CPU | Primera ms | Completa ms | Buscar ms | Seleccionar ms | Aislar ms | Despiece ms | Descargar ms | Recargar ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A-bone | 3916940 | 205 | 512450 | 7609772 | 340.2 | 340.2 | 37.68 | 135.58 | 110.87 | 981.73 | 156.64 | 207.12 |
| B-muscle | 9417864 | 182 | 885860 | 17295980 | 336.9 | 716.3 | 20.72 | 253.69 | 361.7 | 958.24 | 492.72 | 416.75 |
| C-nervous | 3815572 | 125 | 428266 | 7237668 | 332 | 332 | 25.35 | 150.15 | 78.08 | 963.55 | 78.09 | 230.4 |
| D-cardio | 5649280 | 162 | 685016 | 11301456 | 398.1 | 398.3 | 22.18 | 91.74 | 109.1 | 915.7 | 163.55 | 345.88 |
| E-respiratory | 2330012 | 128 | 212484 | 4225064 | 182.1 | 182.1 | 50.89 | 154.5 | 116.41 | 931.23 | 350.55 | 294.69 |
| F-digestive | 1641196 | 96 | 177240 | 3053320 | 199.8 | 224.6 | 21.27 | 58.09 | 212.72 | 944.22 | 334.6 | 119.14 |
| G-digestive-cardio | 7290476 | 258 | 862256 | 14354776 | 262 | 818.3 | 21.21 | 74.35 | 373.98 | 1066.57 | 547.03 | 448.46 |
| H-six-systems | 26770864 | 898 | 2901316 | 50723260 | 210.2 | 2299.6 | 18.98 | 1042.28 | 895.75 | 558.54 | 1476.36 | 875.42 |


[Datos y renderer literal](phase7/browser/performance/digestive-performance.json). Los buffers son arrays de geometría CPU, **no VRAM**. Primera geometría/disponibilidad completa usan marcas del renderer; las duraciones de interacción incluyen automatización y renderizado. Descarga/recarga conserva el recuento de buffers. No se midió GPU física, móvil real, FPS representativo ni consumo de memoria total del dispositivo.

Las ocho configuraciones completaron carga, selección, aislamiento, despiece y recarga sin errores JS/HTTP. No se introducen BVH, LOD, batching, merging ni OIT. Las latencias de software deben interpretarse con las condiciones anteriores; no se extrapolan a hardware real.

**Limitación medida con seis capas transparentes simultáneas:** en la prueba de integración, las opacidades óseo/muscular/nervioso/cardiovascular/respiratorio/digestivo fueron 25/15/50/75/25/50 %. El ciclo de Despiece 0 → 70 → 0 tardó **48,85 s en Sistemas, 38,40 s en Regiones y 27,23 s en Estructuras**. La corrección de interpolación elimina la prolongación artificial por fotograma, pero no elimina el coste de renderizado transparente en SwiftShader. Todos los modos regresaron exactamente a cero. En este entorno conviene activar capas selectivamente o aislar estructuras; estas mediciones no permiten afirmar rendimiento en GPU física. [Datos de integración](phase7/browser/integration/digestive-integration.json).
