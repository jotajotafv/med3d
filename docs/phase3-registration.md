# Fase 3 — estrategia de registro y alcance del piloto


## Actualización de implementación · Fase 3A

Se integran únicamente los 26 elementos del piloto autorizado desde `ac8631fd2a22509992e6058fcfdc292ecb212bf6`. Los dos GLB contienen 39.604 triángulos, sin simplificación adicional, y conservan `(x,y,z) → (x,z,−y)/1000`. La conversión y la cadena de presentación descritas abajo siguen vigentes.

Los [originales y sus hashes](../research/anatomy/muscular-pilot-source-lock.json), el [manifiesto de conversión](../public/models/anatomy/muscular/source-manifest.json) y la [validación numérica del GLB decodificado](../public/models/anatomy/muscular/validation.json) permiten reproducir la comparación. Las posiciones Float32 conservan un error máximo de aproximadamente `5.999e-8 m` respecto a la transformación de los OBJ en doble precisión; no es un error clínico de registro. La prueba coteja todos los triángulos orientados, además de posiciones y conteos. Se descartó la cuantización de posiciones a 16 bits porque producía correspondencias ambiguas entre vértices próximos; se conserva compresión Meshopt y cuantización de normales a 12 bits.

El marco corporal procede siempre del catálogo óseo completo y no cambia con los módulos activos. La raíz corporal no tiene sistema asignado. La [validación del piloto](phase3-validation.md) registra las pruebas y la inspección visual; la identidad técnica de los originales no sustituye esa revisión.

El despiece añade offsets de presentación independientes: sistemas a ±0,16 veces la extensión corporal máxima en X; regiones con un bloque compartido de miembro superior por lado; estructuras/componentes alrededor de su padre real con desplazamiento acotado. No se incorporan a T ni a un manifiesto de registro. Al 0 % se restaura exactamente la posición de cada malla.

## Investigación original previa al piloto

Se conserva a continuación el estado y razonamiento de la auditoría anterior. Las menciones a GLB o validación pendientes describen ese momento histórico; el estado de implementación vigente figura arriba y en el informe de validación.

Fecha: 21 de septiembre de 2026. Base inspeccionada: `41c797b106c66429eeda41a81597bf05abfb07d8`.

**Estado: decisión de fuente e inspección numérica previa a Fase 3A.** No hay GLB musculares integrados ni validación visual músculo-hueso terminada. Esta documentación permite empezar un piloto verificable; no autoriza declarar todo el cuerpo muscular validado.

## Estrategia elegida: conservar la configuración de BP3D 4.0

Extraer musculatura del mismo paquete BodyParts3D 4.0 OBJ99 que originó el esqueleto. La [nota oficial de v4.0](https://lifesciencedb.jp/bp3d/info_en/userGuide/releaseNotes/release-4.0.html) y las cabeceras originales identifican la compatibilidad de versión. Los hashes de seis huesos de control reproducen exactamente los originales fijados por MED3D.

Esto proporciona evidencia de un marco de referencia compartido; no es una nueva estimación de registro entre donantes. La naturaleza modelada y las limitaciones anatómicas del atlas se conservan explícitamente en [fuentes](phase3-model-sources.md). No inferir que cada músculo y hueso sea una segmentación independiente del mismo individuo.

### Conversión a conservar

Marco de catálogo vigente: `bodyparts3d-4.0-male`. La convención usada por MED3D interpreta la fuente en milímetros, X positivo hacia izquierda anatómica, Z superior y Y posterior. El catálogo conserva metros, Y superior y Z anterior.

Con vectores columna y matrices escritas por filas:

```text
T_fuente_a_catalogo =
[[0.001, 0,      0,     0],
 [0,     0,      0.001, 0],
 [0,    -0.001,  0,     0],
 [0,     0,      0,     1]]
```

Equivale a `(x,y,z) → (x,z,-y)/1000`: escala uniforme 0,001; rotación de -90° alrededor de X; traslación nula. La matriz coincide exactamente con `public/models/anatomy/skeletal/source-manifest.json`. No incorpora reflexión, deformación, ajuste por bounding box ni escalado por pieza.

El renderer añade una transformación común de presentación `G`: `s = 3.45 / max(extensiones del marco, 0.001)`, con traslación `-s × centro del marco`. Su implementación está en [AtlasScene.tsx](../src/features/anatomy/atlas/AtlasScene.tsx). Por tanto, la cadena a escena es `G × T_fuente_a_catalogo`, compartida por todos los sistemas; G no es un registro anatómico.

Para los bounds corporales actuales, centro `[0.0000105, 0.78289505, 0.1090215]` metros y escala de presentación aproximada `2.0213857930`. La matriz numérica queda en la evidencia JSON. Mantener el marco estable al activar/desactivar regiones; no recalcular G a partir de las piezas que estén cargadas. Si el catálogo corporal se amplía posteriormente, definir bounds estables de ese catálogo completo.

| Campo de registro | Estado |
| --- | --- |
| Procedencia | Mismo paquete BP3D 4.0 que el esqueleto; no basta sólo el nombre del proveedor |
| Conversión de unidades/ejes | Matriz T anterior, ya utilizada por MED3D |
| Registro adicional entre sujetos | No se estima: se conserva la configuración del paquete |
| Puntos anatómicos de ajuste | Ninguno; no se ajustaron centroides, extremos ni puntos inventados |
| Escala/rotación/traslación adaptadas por músculo | Ninguna |
| Error clínico de registro | No medido; no se declara 0 mm |
| Error de conversión/compresión del GLB muscular final | Pendiente: aún no se ha generado |
| Validación anatómica conjunta y de lateralidad | Pendiente del piloto renderizado |

## Evidencia obtenida con Higgsfield

Se usó `sandbox_exec` para leer HTTP Range del ZIP oficial y procesar sus datos originales. No se usaron generación, catálogo de anatomía sin procedencia, Blender ni deformación. Tres inspecciones transfirieron 235.582, 1.651.177 y 235.582 bytes de cuerpo HTTP, respectivamente: directorio inicial, muestra con directorio y comprobación de candidatos con directorio. No se descargó el archivo completo ni cientos de OBJ.

Se extrajeron 12 OBJ: seis porciones musculares (deltoides acromial, bíceps cabeza larga y tríceps cabeza larga de ambos lados), y seis huesos de control. La descompresión verificó CRC32 y tamaño; se calcularon SHA-256, número de vértices/caras/triángulos, coordenadas finitas y bounds. Las cabeceras declaran compatibilidad 4.0.

| Hueso de control | FMA / FJ derecho | FMA / FJ izquierdo | Resultado |
| --- | --- | --- | --- |
| Clavícula | FMA13322 / FJ3362 | FMA13323 / FJ3237 | Dos SHA-256 y tamaños iguales al source-lock |
| Escápula | FMA13395 / FJ3384 | FMA13396 / FJ3279 | Dos SHA-256 y tamaños iguales al source-lock |
| Húmero | FMA23130 / FJ3368 | FMA23131 / FJ3262 | Dos SHA-256 y tamaños iguales al source-lock |

Los pares musculares FJ/FJM tienen igual número de triángulos en la muestra, pero distinto número de vértices. Sus bounds casi simétricos no prueban identidad por reflexión vértice a vértice. Se conservarán ambos archivos publicados; no se fabricará un lado reflejando el otro.

El SHA-256 completo del ZIP permanece como referencia histórica de `source-lock.json`; no fue recalculado con estas lecturas parciales. Los resultados completos están en [source-audit.json](phase3/research/source-audit.json). La igualdad de fuentes óseas demuestra identidad técnica de esos originales; no valida contactos, inserciones, ausencia de penetraciones ni precisión clínica muscular.

## Piloto hombro y brazo

Objetivo: ocho músculos por lado, 16 unidades anatómicas bilaterales, representadas por 26 elementos geométricos publicados. Son objetivos de integración, no cobertura ya disponible en MED3D.

| Músculo o componente | Derecho | Izquierdo |
| --- | --- | --- |
| Deltoides, porción clavicular | FMA34680 / FJ1468 | FMA34681 / FJ1468M |
| Deltoides, porción acromial | FMA34682 / FJ1467 | FMA34683 / FJ1467M |
| Deltoides, porción espinal | FMA34684 / FJ1513 | FMA34685 / FJ1513M |
| Bíceps braquial, cabeza corta | FMA37684 / FJ1512 | FMA37685 / FJ1512M |
| Bíceps braquial, cabeza larga | FMA37686 / FJ1478 | FMA37687 / FJ1478M |
| Tríceps braquial, cabeza medial | FMA37695 / FJ1480 | FMA37696 / FJ1480M |
| Tríceps braquial, cabeza lateral | FMA37697 / FJ1477 | FMA37698 / FJ1477M |
| Tríceps braquial, cabeza larga | FMA37699 / FJ1479 | FMA37700 / FJ1479M |
| Braquial | FMA37668 / FJ1486 | FMA37669 / FJ1486M |
| Supraespinoso | FMA32544 / FJ1506 | FMA32545 / FJ1506M |
| Infraespinoso | FMA32547 / FJ1500 | FMA32548 / FJ1500M |
| Redondo menor | FMA32553 / FJ1508 | FMA32554 / FJ1508M |
| Subescapular | FMA13414 / FJ1504 | FMA13415 / FJ1504M |

Bindings cotejados con [isa_element_parts.txt](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_element_parts.txt). Conservar porciones/cabezas como componentes navegables de un músculo, sin contarlas como músculos completos adicionales. Resolver la agrupación anatómica con fuentes; una relación IS-A no se convierte automáticamente en PART-OF.

Reutilizar los módulos óseos del miembro superior, con clavícula, escápula, húmero, radio y cúbito. Proponer dos módulos musculares iniciales, hombro/brazo derecho e izquierdo, conservando coordenadas comunes. El tamaño final de GLB y la partición definitiva se decidirán después de la conversión piloto.

## Condición para ampliar a Fase 3B y siguientes

1. Verificar archivos piloto, hashes, nombres, bindings, lateralidad y conversión conservada; comparar el GLB decodificado con la fuente.
2. Inspeccionar imágenes reales anteriores, posteriores, laterales y de detalle con hueso+músculo, músculo transparente y músculos aislados. Distinguir solapamiento normal de penetración sospechosa y conservar dudas.
3. Verificar selección, árbol, búsqueda, capas/opacidad independientes, contexto documentado, tres niveles de despiece, cámara y restauración.
4. Medir carga, memoria geométrica, recarga, draw calls e interacción en el entorno real de prueba, con límites explícitos; comprobar errores parciales y regresiones óseas/órganos anteriores.
5. Conservar evidencia reproducible y un commit de código probado antes de ampliar cobertura.

No se dispone todavía de zonas de origen/inserción anotadas sobre estas superficies. Las relaciones textuales o HRA crosswalk pueden sustentar contexto educativo después de revisar cada entrada; no bastan para pintar una zona exacta. Esa visualización opcional queda pendiente mientras no existan datos y representación seguros.

El cóccix y los seis huesecillos auditivos conservan su estado de [registro pendiente](phase2.1-registration.md). Esta investigación no cambia esa decisión.
