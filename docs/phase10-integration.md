# Fase 10 · integración

El atlas conserva **11 sistemas**: óseo, muscular, nervioso, cardiovascular, respiratorio, digestivo, urinario, endocrino, linfático/inmunitario, reproductor y tegumentario. Resultado: **580 estructuras, 981 nodos, 937 mallas, 52 módulos, 3240172 triángulos y 29795780 bytes GLB**. Las estructuras son unidades anatómicas; los componentes y agrupaciones se contabilizan aparte en nodos. Incremento: dos unidades oculares parciales, seis componentes y una agrupación regional (nueve nodos), seis mallas y un módulo.

La extensión ocular se carga desde su propio catálogo y se une a Nervioso mediante `withOcularCoverage`. Es una agrupación editorial con las vías sensoriales, no una reclasificación de todo el ojo como SNC/SNP ni un duodécimo sistema. Los archivos de catálogos históricos y sus IDs no cambian. Sólo crecen en memoria los ancestros necesarios. Se rechazan marco incompatible, identidades duplicadas y sistemas ajenos.

## Piel, selección y contexto

Tegumentario continúa apagado al inicio. Cada sistema y módulo conserva carga, descarga, opacidad, cancelación y recuperación. La piel sigue siendo una sola estructura fuente; no hay regiones de piel artificialmente separadas.

| Estado | Comportamiento |
|---|---|
| Piel visible al 100 % con interior | El clic directo prioriza exclusivamente la piel; se desactiva raycast de piezas internas, incluso si sobresalen. No se altera su visibilidad. |
| Piel transparente con interior visible | El clic atraviesa piel y alcanza el interior visible. Probado al 75/50/25/10 %. |
| Piel sola o aislada | Conserva clic directo a todas las opacidades. Siempre puede elegirse desde árbol o búsqueda. |
| Elección interna desde árbol/búsqueda | Si piel está cargada y no oculta, se reduce a 25 % cuando estaba por encima; aviso contextual visible sólo cuando la piel realmente participa en la vista. |
| Aislar piel | Carga piel si hace falta, opacidad 100 %, aislamiento, selección y cámara de cuerpo. Los demás sistemas cargados quedan ocultos por el aislamiento. |
| Explorar interior | Limpia aislamiento/contexto, piel a 25 %, deselecciona y restaura cámara. Respeta módulos elegidos y ocultaciones del usuario; no carga todo el interior si sólo estaba piel. |

Ocultar, mostrar, restaurar, aislar y contexto mantienen su semántica. Se limpia hover obsoleto al cambiar visibilidad u opacidad. El contexto ocular usa el globo ipsilateral, el nervio óptico y referencias explícitas de frontal `FMA52734` y esfenoides `FMA52736`; no se infieren relaciones por proximidad. La piel contextual mantiene 25 % y sus referencias históricas.

## Catálogo, lectura y herramientas

Búsqueda comprobada por español, latín, alias, FMA, FJ e IDs internos: piel/cutis, ojo/órbita, riñón, vejiga, tiroides, bazo, próstata, hígado, estómago, pulmón, corazón, nervio óptico y músculos principales. Se preservan resultados de exploradores independientes. El árbol conserva virtualización, teclado Home/End, selección ARIA, ancestros y expansión; menos de 100 elementos DOM para el árbol completamente expandido en la prueba.

Materiales históricos de piel, músculo y nervio se mantienen. Selección cian y contraste general conservados. Las tres familias oculares reciben colores esquemáticos: esclerótica clara, iris gris azulado y córnea translúcida. DoubleSide, depthTest y depthWrite=false bajo opacidad 1. No se simula refracción, óptica ni pigmentación real.

Sistemas/Regiones/Estructuras conservan cero exacto. Piel permanece fija; las piezas de cada ojo se desplazan juntas en el bloque regional cabeza-cuello y no se fragmentan. Se mantienen seis vistas anatómicas y foco por estructura. Paneles comprobados en 1366/1050/900/768/390 px; sin desbordamiento horizontal, once controles accesibles mediante scroll. [Validación](phase10-validation.md).

No cambian contenidos de Home, Procedimientos ni Primeros Auxilios. No hay nueva arquitectura de renderer, recortes corporales, segunda envoltura ni alteraciones espaciales para esconder discrepancias. [Alcance verificable](phase10/scope-check.json).
