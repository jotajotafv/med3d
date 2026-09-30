# Fase 8 · rendimiento final

Código `180176698318941263a40c8da89f82c321e3456d`. Chrome headless, ANGLE **SwiftShader (software)**, viewport 1366×768 y escala 1. HTTP local sin limitación, respuestas no-store; cargas secuenciales, no arranques fríos independientes. No son mediciones de GPU física ni móvil real. Los tiempos de interacción incluyen automatización y renderizado; buffers son arrays geométricos decodificados, no VRAM.

| Configuración | GLB bytes | Mallas | Triángulos | Buffers bytes | Primera / completa ms | Búsqueda / selección / aislamiento ms | Descarga / recarga ms |
|---|---:|---:|---:|---:|---|---|---|
| A-urinary | 94872 | 6 | 9944 | 167704 | 173.1 / 173.2 | 33.5 / 56.8 / 1224.8 | 672.7 / 474.5 |
| B-endocrine | 467728 | 11 | 20166 | 900976 | 314.8 / 314.9 | 161.7 / 786.4 / 379.7 | 545.7 / 333.9 |
| C-lymphatic | 35160 | 3 | 3410 | 58340 | 406.9 / 406.9 | 159.5 / 273.2 / 598.6 | 498.6 / 396.3 |
| D-reproductive | 93996 | 12 | 7184 | 141784 | 464.2 / 464.3 | 142.2 / 300.5 / 918.9 | 411.1 / 413.8 |
| E-four-new | 691756 | 32 | 40704 | 1268804 | 289.5 / 832.7 | 196.5 / 426.8 / 369.5 | 461.0 / 432.3 |
| F-ten-systems | 27462620 | 930 | 2942020 | 51992064 | 538.8 / 116038.9 | 4003.5 / 7374.8 / 4860.1 | 7232.1 / 4627.1 |
| G-renal-context | 6211880 | 179 | 715126 | 12370136 | 417.6 / 8420.9 | 343.7 / 1510.3 / 389.5 | 1488.8 / 1526.0 |
| H-cervical-context | 2797740 | 139 | 232650 | 5126040 | 614.3 / 614.4 | 440.3 / 401.3 / 349.1 | 500.5 / 428.2 |

Datos íntegros y cadena del renderer: [JSON](phase8/internal-performance.json). Despiece de sistemas en el atlas completo, una vez: 4344.8 ms; regiones de los cuatro nuevos: 999.3 ms. Después se verificó retorno a cero. Los ocho casos recuperan exactamente su memoria geométrica tras descarga/recarga del módulo medido.

Aumento geométrico: 691.756 bytes GLB, 32 mallas y 40.704 triángulos. Atlas corporal disponible: 27462620 bytes GLB y 2942020 triángulos en 50 módulos. El tamaño de las glándulas pequeñas no aumenta artificialmente al seleccionar o enfocar. La cobertura parcial no se rellena por motivos visuales.

La carga completa en la campaña secuencial fue **116.039 ms**; una comparación posterior de seis y diez sistemas en el mismo navegador registró **1.737 / 84.588 ms**. En un navegador nuevo, diez sistemas registraron **1.911 ms**, con primera geometría a **320 ms**. Se conservan las tres observaciones: [comparación secuencial](phase8/load-comparison.json) y [navegador nuevo](phase8/load-fresh.json). El contraste sugiere dependencia del estado/secuencia del entorno WebGL por software; no identifica por sí solo una causa ni garantiza latencia estable. No se repitieron suites históricas ni el despiece global. El cierre del navegador del primer benchmark superó el límite de 5 s de teardown; los checks y el JSON terminaron correctamente, pero se conserva este dato del arnés.

El software puede tardar decenas de segundos o más tras navegaciones repetidas. No se extrapolan estos tiempos a hardware físico. No se añadieron optimizaciones arquitectónicas sin un problema que las justificara.
