# Fase 4 expandida: fuentes y cobertura

La expansión añade 26 nervios y 12 componentes bilaterales de Z-Anatomy. La médula, raíces espinales, ciático y tronco radial quedan pendientes por registro insuficiente. Los plexos son parciales. No se representa una red continua ni el sistema nervioso humano completo.

Se conserva la Fase 4 original: [entrega](phase4-delivery.md), [comparación previa](phase4-source-comparison.md) y [fuentes previas](phase4-sources.md). No se repitió la auditoría craneal cerrada.

| Fuente | Versión, licencia y decisión |
|---|---|
| [HRA/HuBMAP, IU y colaboradores](https://github.com/hubmapconsortium/ccf-3d-reference-object-library) | Commit `f1a3a63f110e27ff0736047d52d04dba5d3087f9`, VH Male v1.2. CC BY 4.0 permite adaptar y redistribuir con atribución. Se descargaron médula y referencias vertebrales; ajuste real insuficiente. No se integra geometría nueva HRA. |
| [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy) | Commit `38649f4193adbe58e426ccac5670b8c4dde474ec`. Fuente adicional elegida para 38 objetos periféricos. Esqueleto y nervios comparten coordenadas. |
| [Open3DModel/AnatomyTOOL](https://anatomytool.org/open3dmodel), [CASK/LUMC](https://caskanatomy.info/open3dviewer/?model=upper-limb-arm-muscles&subset=ligament-parts-hidden) | Las páginas del proyecto/activo devolvieron 403 en esta revisión. Visor CASK accesible; GPL del visor no acredita licencia de sus geometrías. Sin activo nervioso concreto y licencia verificables para integrar. |
| [Open Anatomy Project](https://www.openanatomy.org/) / SPL | Investigación anterior regional, sin conjunto corporal PNS registrado y redistribuible confirmado. No incorporado. |
| Visible Korean / IT'IS | Se conserva la evaluación previa: redistribución no acreditada para el primero y restricciones para el segundo. Sin nueva incorporación. |
| BodyParts3D 4.0 / DBCLS | Continúa como marco corporal y fuente craneal ya validada; insuficiente para la expansión solicitada. |

## Licencia y procedencia de la fuente incorporada

[Licencia de la versión fijada](https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/38649f4193adbe58e426ccac5670b8c4dde474ec/License.txt) y [proyecto en SPI](https://www.spi-inc.org/projects/z-anatomy/): Z-Anatomy se distribuye bajo **CC BY-SA 4.0**. Se permite modificar y redistribuir con atribución, indicación de cambios y la misma licencia para la geometría adaptada. Los cuatro GLB nuevos conservan ese aviso en metadatos y catálogo; no se atribuye esa licencia a todo el código MED3D.

Atribución: Gauthier Kervyn/Z-Anatomy; origen BodyParts3D, Kousaku Okubo/DBCLS; colaboradores Marcin Zielinski, Lluis Vinent y traductores según el texto original retenido. Se conserva el reconocimiento histórico BP3D CC BY-SA 2.1 Japan que pide el distribuidor. Los activos BP3D históricos de MED3D mantienen su procedencia existente.

El paquete contiene excepciones: oído interno de Dundee CC BY-NC-SA 4.0 y riñón de Lissie Cowley CC BY-NC 4.0. **Se excluyen ambos**. No se redistribuye el ZIP completo ni se afirma que todo su contenido tenga una licencia uniforme. El subconjunto guardado contiene los 38 objetos aprobados, 49 referencias óseas y dependencias de jerarquía (127 objetos en total); los padres sin geometría no son estructuras integradas. No contiene objetos de esas excepciones.

Se conservan curvas/mallas nativas, matrices del editor, geometría evaluada, licencia original y referencias del registro en [nervous-expansion-originals.zip](../research/anatomy/nervous-expansion-originals.zip), 8 776 987 bytes, SHA-256 `fc00ea153e8b798acad40dafa4ce28246653cb60f9bc0a134adcc03e52fd7f73`. El [source-lock](../research/anatomy/nervous-expansion-source-lock.json) fija URLs, bytes y hashes de descargas, Blender original y subconjunto. El ZIP original de 86 734 957 bytes tiene SHA-256 `e029688545627bd0214b269e1063143abb580aad72b2c2445d6d8a9a0d9da736`; queda en caché, fuera del bundle. Blender se abrió con autoejecución desactivada; no se ejecutaron scripts ni addons incluidos.

## Inventario acotado

108 candidatos: **38 APROBADO, 0 DESCARTADO, 70 APLAZADO**. Hay 102 objetos presentes y 6 ausentes (glúteo inferior y fascículos medial/lateral del plexo braquial, bilaterales). Esta cuenta corresponde a la selección Z-Anatomy; HRA se evalúa como alternativa medular aparte. La distinción entre descarte de fuente y aplazamiento anatómico se mantiene.

El [inventario completo](../research/anatomy/nervous-expansion-selection.json) registra por candidato nombre, latín, ID estable, objeto fuente, lado, tipo, padre, región, módulo, decisión, motivo, geometría nativa y penetración ósea medida. Los IDs `zanatomy:<nombre-fuente-r/l>` son estables; no se inventaron equivalencias FMA ni se confundieron grupos con nervios.

| Familia incorporada | Entidad | Objetos bilaterales |
|---|---|---:|
| Nervio axilar | nervio | 2 |
| Nervio musculocutáneo | nervio | 2 |
| Nervio mediano | nervio | 2 |
| Nervio cubital | nervio | 2 |
| Nervio dorsal de la escápula | nervio | 2 |
| Nervio femoral | nervio | 2 |
| Nervio tibial | nervio | 2 |
| Nervio fibular común | nervio | 2 |
| Nervio fibular superficial | nervio | 2 |
| Nervio fibular profundo | nervio | 2 |
| Nervio cutáneo femoral lateral | nervio | 2 |
| Nervio cutáneo femoral posterior | nervio | 2 |
| Nervio iliohipogástrico | nervio | 2 |
| Tronco superior del plexo braquial | tronco | 2 |
| Tronco medio del plexo braquial | tronco | 2 |
| Tronco inferior del plexo braquial | tronco | 2 |
| Fascículo posterior del plexo braquial | fascículo | 2 |
| Rama profunda del nervio cubital | rama | 2 |
| Ramas digitales dorsales del radial | rama | 2 |

El plexo braquial aporta tres troncos y un fascículo posterior por lado, sin raíces ni divisiones. Los grupos lumbar y sacro reúnen ramas disponibles; no afirman reconstruir el plexo completo. Las ramas digitales dorsales radiales conservan identidad de componente, aunque el tronco radial no esté aprobado. No se crean ramas vacías para médula o raíces.

También quedan aplazados, entre otros, supraescapular, torácico largo, obturador, glúteo superior y varias ramas terminales: las transformaciones permitidas causan penetración ósea. Su exclusión no significa que la fuente carezca de ellos. Véase [registro y decisiones geométricas](phase4-expansion-registration.md).

Muchos nervios son curvas con sección tubular educativa. Se conserva el grosor nativo; **no es un diámetro físico validado**. La fuente reutiliza geometría con reflexión en varios pares; se conserva y declara esa simetría de origen. MED3D no fabrica lados por reflexión, no engrosa nervios ni decima sus mallas.
