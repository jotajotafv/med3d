# Wave 3: registro de fuentes externas

Base de integración: `83deba445c221adb2a21098143c81e563ae8816a`. Los modelos corporales de Waves 1–2 y los exploradores independientes permanecen intactos.

`../completion-wave3-decisions.json` consolida 317 candidatos: cuatro aprobados, 284 bloqueados por registro, 25 por identidad y cuatro sin superficie anatómica utilizable. Son candidatos de investigación, no 317 gaps ni nuevas estructuras. Algunos objetos participan en varios intentos; el ledger conserva esa secuencia. La cohorte aprobada contiene EDB izquierdo/derecho y un conjunto original de interóseos dorsales por pie. No hay ocho interóseos individualizados artificialmente, ni sustitución del EHB o de los interóseos plantares existentes.

## Originales y reproducción

`../completion-wave3-originals.zip` conserva posiciones mundiales Float64, triángulos originales orientados, matrices de objeto, materiales/modificadores documentados, licencia y matrices de registro de las cuatro piezas aprobadas. El source lock fija el ZIP, la selección, el catálogo de base, el registro y el `Startup.blend` original del commit Z-Anatomy `38649f4193adbe58e426ccac5670b8c4dde474ec`. Los dos lados son objetos originales separados de ese archivo. Se conserva cualquier matriz negativa ya escrita por sus autores, con winding coherente al exportar; MED3D no refleja un lado para fabricar el contrario.

La conversión usa posiciones Float32 sin cuantizarlas; Meshopt y cuantización de normales de presentación. La verificación compara posiciones usadas, multiconjunto de triángulos orientados, multiplicidad, bounds, ausencia de transform oculto y validación glTF del archivo comprimido y decodificado. El error de redondeo máximo, aproximadamente `1.03e-8 m`, no es precisión anatómica.

Verificar la salida de conversión conservada sin reconstruir modelos:

```powershell
node scripts/anatomy/build-completion-registered.mjs --verify-only
node scripts/test-anatomy-completion.mjs
```

Para reproducir en una carpeta nueva, usar `--output <carpeta-nueva>` sin `--install`. El builder se niega a sobrescribir GLB existentes. La instalación sólo acepta el catálogo W2 fijado; no es un mecanismo para reemplazar modelos históricos. La salida puede compararse por hash con los dos GLB publicados en el repositorio.

## Registro

Se estima una similitud positiva global mediante 84 correspondencias de huesos completos, seguida de registros rígidos regionales comunes, nunca ajustes por pieza. Los centros de bounds son controles iniciales gruesos, no puntos de inserción ni landmarks clínicos. El refinamiento emplea superficies de huesos homólogos, muestreo determinista y reserva de controles regionales; matrices, controles y métricas están en `evidence/registration.json`.

El pie requiere una región propia por su distinta pose articular. Conserva la escala global `0.9952171923529913`; cada pie utiliza 26 huesos, seis excluidos del refinamiento regional. RMS de superficie: 0.913/0.905 mm; máximos muestreados: 4.294/4.241 mm. Se aplica exactamente la misma matriz a todos los candidatos del mismo pie. El registro global de origen está conservado también en el ZIP; no se recuperó una matriz histórica para aprobar la cohorte.

La aceptación muscular combina identidad, lateralidad, vistas, relaciones y cribado de superficies. Permanecen contactos locales esquemáticos: profundidad ósea muestreada hasta 1.09 mm y muscular hasta 0.89 mm. No se afirma separación tisular exacta. Las fichas incluyen este límite. Los interóseos mantienen su conjunto original y su relación con metatarsianos y falanges; el EDB representa los dedos segundo a cuarto, separado del EHB.

Los retináculos flexores no se aceptan por el mero hecho de tener pocas penetraciones: sus interfaces originales de inserción se separan hasta unos 3.7 mm. Las ramas plantares quedan a unos 18.4 mm del tibial ya integrado. Las cápsulas presentan ocupación ósea no aprobada. Las cápsulas metatarsofalángicas fueron mal clasificadas como miembro superior en el plan nominal inicial; `foot-supplemental` conserva el intento corregido con la matriz del pie. No se usa el primer intento como evidencia de registro válido.

## Fuentes rechazadas y límites del estudio

Los registros regionales principales Z conservan conflictos relevantes, incluyendo cara, pared abdominal, médula, cauda y nervios. El ajuste alternativo con 38 nervios existentes recupera continuidad de algunos padres, pero no resuelve las relaciones óseas; su error numérico casi nulo refleja identidad entre geometrías del mismo dataset y no acredita precisión clínica. Núcleos, fascias y regiones no se publican como nervios o músculos completos.

Los nuevos ensayos HRA mantienen el cóccix desconectado del sacro y conflictos de la médula con la columna. Se conservan matriz, RMS, máximo y controles. OpenEar dispone de huesecillos y contexto temporal científico, pero faltan correspondencias verificadas de la cavidad timpánica con el temporal corporal. ZETA aporta indicio explícito de lado derecho; EPSILON no demuestra lateralidad. Las vistas de OpenEar centran cada fuente para inspección a igual escala: **no son un registro anatómico ni un overlay aprobado**. El hueso fuente se muestra con todos sus vértices como puntos, sin decimación del original.

La licencia se revisa por conjunto/objeto. Los cuatro músculos aprobados corresponden a la licencia general Z CC BY-SA 4.0, conservando el crédito original BP3D. El conjunto craneal requiere además el crédito Dundee CC BY 4.0; el ledger corrige la etiqueta genérica preliminar del plan. Riñón Z CC BY-NC 4.0 y oído interno Z CC BY-NC-SA 4.0 no se integran. No se incluye anatomía femenina.

`evidence/` conserva los reportes y scripts recuperados con sus rutas relativas. `research-lock.json` fija hashes de entradas y capturas que permanecen en caché. Para reproducir los ensayos completos, restaurar los scripts en `.cache/anatomy-completion/wave3/`, usar el blend y fuentes oficiales fijados, y generar las referencias de destino sobre el checkout W2 en una carpeta aislada. No ejecutar la extracción contra un catálogo posterior y confundirlo con el destino original. Los grandes originales y arrays de cribado permanecen en la caché conservada; el repositorio incluye los originales seleccionados necesarios para reproducir la integración aprobada.

El cribado por paridad de rayos y distancia a superficie es muestreo, no medición volumétrica de penetración. Superficies abiertas, un contacto mínimo o estar fuera del tejido de la piel no prueban encaje ni estar fuera del cuerpo. Ningún dato de este estudio acredita precisión clínica.
