# Fase 9 · entrega local

**FASE 9 cerrada localmente para revisión.** Rama `phase9-integumentary`, base `5839a7423cd1b0dfab4f79837661147f71b6aab8`, código probado `b6a21cafacaa993342b81a287a59ce95b8b21d4d`. Implementación completa seguida de una única campaña global y un commit documental separado. El SHA documental, su padre y el hash del bundle se registran en el recibo externo y en la respuesta final para evitar autorreferencia del commit.

| Cobertura nueva | Resultado |
|---|---|
| Fuente y licencia | DBCLS BodyParts3D 4.0 OBJ99, CC BY 4.0 según archivo institucional actual |
| Identidad | Piel / Cutis, FMA7163 · FJ2810 · BP9115, `integ:FMA7163` |
| Representación | Superficie corporal macroscópica nativa del cuerpo masculino de referencia |
| Unidad / componentes anatómicos / mallas | 1 / 0 / 1 |
| Módulo | `integumentary:skin` |
| Vértices / triángulos / bytes GLB | 102467 / 203382 / 1631504 |
| Regiones independientes | Ninguna: se conserva la única pieza fuente; no se recorta para aislar piel regional |
| Subcutáneo / anexos | Sin subcutáneo independiente ni uñas; pelo nominal disponible descartado por falta de prioridad |
| Pendientes | Subcutáneo, capas histológicas separadas, uñas y regiones cutáneas separadas |
| Auditoría | 1 aprobado, 11 filas de metadatos descartadas y 4 coberturas aplazadas; las filas no equivalen a estructuras únicas |

Se revisaron BP3D 4.0, correspondencias 4.3, el skin HRA/HuBMAP ya existente y la viabilidad de reutilizar el registro Z-Anatomy. Sólo se extrajo el OBJ aprobado de 4.0. No se mezcla una segunda envoltura. [Auditoría](phase9-audit.md), [fuentes/licencia](phase9-sources.md), [registro/hashes](phase9-registration.md).

Transformación exacta `(x,y,z) → (x,z,-y)/1000`, frame `bodyparts3d-4.0-male`, sin registro adicional ni modificación espacial. Float32/Meshopt, todos los triángulos orientados conservados. Error numérico máximo `6.085485393543343e-8 m`; 24 referencias proyectadas dentro de la envoltura. Los 100 componentes conexos geométricos y 1512 aristas de borde se conservan, sin interpretarlos como entidades o capas histológicas. glTF comprimido y decodificado: cero errores/advertencias.

Catálogo final: **11 sistemas, 578 estructuras, 972 nodos, 931 mallas y 51 módulos**; 3145402 triángulos y 29094124 bytes GLB en el atlas corporal completo. Los diez catálogos e IDs históricos permanecen iguales. Árbol virtualizado/teclado/ARIA y búsqueda español/latín/alias/FMA/FJ/ID preservados, incluidos órganos independientes.

Tegumentario está apagado inicialmente, con controles propios de sistema, módulo y opacidad. Probado al 100/75/50/25/10 % con DoubleSide/depthTest; depthWrite=false bajo 100 %. Si hay interior visible, piel transparente deja pasar clics; sola o aislada conserva raycast. Siempre puede seleccionarse por árbol/búsqueda. Aislar, ocultar, mostrar y restaurar funcionan sobre la unidad fuente. El contexto activa piel al 25 % y once referencias óseas/musculares explícitas. La nueva ficha distingue funciones educativas y superficie realmente representada. [Educación y comportamiento](phase9-education.md).

En Sistemas/Regiones/Estructuras, piel permanece como referencia fija; cero restaura posiciones originales exactas. Las seis vistas anatómicas se conservan; cuerpo, cabeza, tórax, espalda, mano y pie comprobados. Panel accesible a 1366/1050/900/390 px; móvil simulado, no hardware móvil probado.

Piel sola: 207 ms hasta geometría/disponibilidad, 4489924 bytes de buffers CPU. Atlas con piel: 1756,4 ms; sin piel: 2132,6 ms, muestras independientes de SwiftShader sin valor estadístico. Incremento de activos: 1631504 bytes GLB, 203382 triángulos y 4489924 bytes de buffers. No se afirma que piel mejore el rendimiento. [Seis configuraciones y todas las operaciones medidas](phase9-performance.md).

Pruebas específicas regionales PASS, typecheck/verify:anatomy/build PASS, suites nerviosa/cardiovascular/respiratoria/digestiva/interna PASS; integración final de sistemas, órganos HRA y rutas generales PASS. 18 rutas estáticas generadas. Aviso conocido de chunk >500 kB. **30 capturas finales revisadas**. [Validación](phase9-validation.md) y [galería e incidencias](phase9/visual-review.md).

Correcciones directas: picking transparente deja de interceptar el interior visible; opacidad del contexto de piel explícita; etiqueta singular “1 estructura disponible”. El encuadre de mano del arnés incluye todos los dedos. No se introdujeron cambios de renderer, BVH, LOD, OIT, batching ni nuevas herramientas de corte.

Limitaciones: representación macroscópica parcial, sin histología/grosor clínico; cuerpo masculino de referencia; una única unidad de piel sin aislamiento regional; aperturas, costuras y pequeños fragmentos fuente. Al activar todos los sistemas aparecen pequeñas penetraciones/moteado en cuello, tronco y miembros, más visibles con selección; desaparecen al aislar piel. No se movieron estructuras para ocultarlos. No es validación clínica.

Main y origin/main siguen en `beeed24e810dc69f23a4e71451241c4bf95139a7`; ramas históricas verificadas contra el inicio, incluida `phase11-first-aid` en `a391093cd28b975673fd0fc1e6b87fa1aeafed29`. [Referencias preservadas](phase9/protected-refs.json) y [alcance](phase9/scope-check.json). Home, Procedimientos y Primeros Auxilios no cambian. No hubo push, merge, cherry-pick ni despliegue en Fase 9.

Bundle de cierre tras el commit documental y con working tree limpio: `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase9.bundle`. Se crea con `--all`, sin sobrescribir anteriores, y se verifica con `git bundle verify`. Tamaño, SHA-256, HEAD final y padre documental quedan en `med3d-phase9.bundle.json` junto al bundle y en la entrega final. **No se inicia Fase 10.**
