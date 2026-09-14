# Verificación del núcleo anatómico · fase 2

Fecha: 14 de septiembre de 2026. Se amplía la base MED3D existente; los modelos de órganos y las áreas de procedimientos y primeros auxilios se conservan.

## Geometría y trazabilidad

- Fuente: BodyParts3D 4.0 / DBCLS; versión, licencia vigente CC BY 4.0, URL, atribución, hashes originales y modificaciones registradas.
- Cobertura: 199 huesos convencionales + 4 sesamoideos accesorios. Hay 205 mallas únicas: el esternón tiene tres componentes y se eliminó una copia exactamente duplicada del hioides. Faltan cóccix y seis huesecillos auditivos en el cuerpo registrado.
- 7 GLB; 3.916.940 bytes; 512.450 triángulos; 249 nodos de catálogo.
- Los siete GLB son idénticos byte por byte en una reconstrucción independiente con el canal fijado.
- Decodificación Meshopt conserva nombres, bindings y número de triángulos. Desviación máxima de extremos por hueso: 0,002784 mm. Esta medida no es una distancia de Hausdorff ni una validación clínica.
- Auditoría estructural independiente: `phase2-glb-metadata-audit.json`. Procedimiento reproducible: `scripts/anatomy/README.md`.

## Pruebas automatizadas locales

`npm run verify:anatomy` comprueba integridad del catálogo, búsquedas comunes/latinas y sinónimos, jerarquía sin duplicados/ciclos, revelado de ancestros, pertenencia de mallas y módulos; concurrencia máxima de dos trabajos, cancelación, liberación de resultados tardíos, retención de regiones activas, reintento y liberación idempotente.

El despiece se contrasta en sus tres niveles: una sola capa no deriva en el nivel de sistemas; los componentes de una región se desplazan juntos en el nivel regional; los vectores respetan centros anatómicos y límites; 0 % restaura exactamente el reposo.

El mismo cargador usado por el navegador decodificó los siete GLB reales en Node: 205 mallas, 512.450 triángulos y 7.609.772 bytes de buffers de geometría únicos. Tiempo local observado de transporte simulado y decodificación: 123–168 ms. **No es un tiempo de descarga de internet ni una medida de navegador o GPU.**

Prueba de escala del catálogo: 10.000 registros sintéticos exclusivamente de metadatos, sin generar anatomía. Indexación 94–102 ms, búsqueda 30–36 ms y aplanado 7 ms en el entorno de trabajo. Esta prueba no demuestra rendimiento de 10.000 mallas 3D. El árbol del producto virtualiza filas y pagina los resultados óseos de búsqueda a 60 por página.

`npm run typecheck` y `npm run build` pasan. Se generan las 18 rutas estáticas existentes. Se mantiene el bundle diferido de Three/R3F; la advertencia de chunk mayor de 500 kB corresponde al motor compartido y no a la descarga de todos los modelos.

## Verificación de navegador

El procedimiento reproducible está en `scripts/anatomy/browser-qa.mjs`: sirve el build y abre Chromium en el mismo proceso; genera un informe JSON y capturas.

**17 comprobaciones funcionales aprobadas** sobre el commit público `aeaacbbc606cc61a2971aaf4066ef0f333602afa`, clonado en el sandbox Higgsfield. Build con Node22.20 y Chromium sin interfaz, ANGLE/SwiftShader (WebGL por software), HTTP local. No se enviaron archivos privados del proyecto al entorno.

| Comprobación | Resultado observado |
| --- | --- |
| Carga del esqueleto registrado | 7 módulos, 205 mallas, 512.450 triángulos; 7.609.772 bytes de geometría. |
| Renderizado completo | 205 llamadas de dibujo; 209 geometrías GPU (205 huesos y 4 auxiliares), 4 texturas auxiliares del indicador de ejes. |
| Reposo | 0 llamadas nuevas durante un segundo. |
| Selección, enfoque y aislamiento | Fémur izquierdo seleccionado; aislamiento reduce a 1 llamada de dibujo y conserva recursos para restaurar. |
| Ocultación / revelado | La pieza aislada pasa a 0 / 1 llamadas de dibujo. |
| Selección directa | Raycast real sobre el fémur aislado devuelve su ID registrado. |
| Opacidad | Control por sistema comprobado de 10 a 100 %. |
| Despiece | Sistemas, regiones y estructuras a 100 % conservan 205 mallas, 512.450 triángulos y la misma propiedad de buffers; restauración a 0 %. |
| Desactivar región y buscar | Descarga/liberación de miembro inferior izquierdo; buscar tibia izquierda reactiva el módulo y mantiene el foco pendiente. |
| Desactivar todo el sistema | 0 módulos, 0 mallas, 0 bytes de geometría y 0 llamadas de dibujo; sólo quedan 4 geometrías auxiliares. |
| Recargar el sistema | Recupera exactamente 205 mallas, 7.609.772 bytes y 209 geometrías GPU, sin crecimiento. |
| Pantallas de 1050, 900 y 390 px | Paneles, búsqueda y cierre funcionan; sin desbordamiento horizontal. |
| Compatibilidad previa | Ruta del corazón, ventrículo derecho seleccionado y contexto WebGL conservados. |
| Errores | Ningún error JavaScript no controlado ni respuesta HTTP fallida. |

Primera geometría observada: aproximadamente 1,16 segundos en ese entorno local. No representa internet móvil ni garantiza tiempos en dispositivos físicos. La medición total del script incluye pausas deliberadas, por lo que no se utiliza como tiempo exacto de carga. No se midieron FPS de GPU física.

Se generaron ocho capturas, pero la revisión automática rechazó exportarlas a Higgsfield storage por considerar que faltaba autorización específica para compartir esos resultados derivados. No se reintentó. **Las capturas no se inspeccionaron visualmente**; la aprobación anterior corresponde a comprobaciones automatizadas reales de navegador, layout y WebGL, no a una revisión visual humana de píxeles.

## Límites de aceptación

No se declara completo un esqueleto de 206 huesos, ni disponibles once sistemas 3D. Las fuentes candidatas para las siete posiciones pendientes están documentadas en `phase2-missing-bones.md`; aún necesitan registro espacial y comprobación de lateralidad. Las fichas son de familias óseas, identificadas como tales. Las relaciones navegables actuales representan jerarquía y homología; no se infieren articulaciones por proximidad.

LOD, Draco, KTX2 y BVH quedan sujetos a problemas medidos. Los assets óseos carecen de texturas. Se debe repetir el perfil en dispositivos físicos representativos antes de prometer una tasa de FPS móvil o rendimiento de miles de mallas simultáneas.
