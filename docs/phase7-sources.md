# Fase 7 — fuentes y licencias

| Fuente auditada | Decisión | Licencia y procedencia |
|---|---|---|
| BodyParts3D 4.0 OBJ99 | Única fuente de los 96 OBJ integrados | DBCLS; CC BY 4.0 según [archivo oficial](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). |
| BodyParts3D 4.3 | Metadatos y descarga selectiva de ocho piezas hepáticas + control gástrico; no integrada | DBCLS/Anatomography conserva [CC BY-SA 2.1 Japan](https://lifesciencedb.jp/bp3d/info_en/license/index.html). La descarga no resolvió la discrepancia VII/VIII. |
| HRA/HuBMAP existente | Inspección del alcance local: corazón, pulmones y encéfalo independientes; sin activo digestivo local que deba registrarse | Se conservan los activos/atribuciones históricas; no se descargan ni reubican órganos HRA. |
| Z-Anatomy existente | Registro periférico nervioso previo no aplicable automáticamente a vísceras; no necesario para esta cobertura | Sin nueva extracción, reutilización de matrices ni redistribución adicional. |

**Atribución:** BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. La declaración vigente permite adaptación y redistribución con atribución. Los OBJ conservan sus avisos históricos CC BY-SA 2.1 Japan sin editar; se documenta la declaración actual del distribuidor. [Licencia distribuida](../public/models/anatomy/digestive/LICENSE.txt).

Fuentes oficiales: [descarga 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html), [archivo exacto](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip), [manifiesto 4.3](https://lifesciencedb.jp/bp3d/get-info.cgi?version=4.3&cmd=concept-objfiles-list), `get-info.cgi`/`upload-all-list` y `download.cgi` para la comparación acotada. El [informe de alternativas](phase7/alternative-source-audit.json) conserva solicitud, tamaño y hash de la descarga 4.3; tres controles hepáticos tienen texto geométrico idéntico a 4.0, pero la identidad segmentaria sigue en conflicto.

Originales integrados: [ZIP](../research/anatomy/digestive-originals.zip), **3499810 bytes**, SHA-256 `db524203d0414b7d7f9031e49dc98d53ebb5e0451fcfd1982cd2ffe6c15d3398`. [Lock](../research/anatomy/digestive-source-lock.json), [metadatos de auditoría](../research/anatomy/digestive-audit-metadata.zip), [manifiesto por archivo](../public/models/anatomy/digestive/digestive-source-manifest.json). Extracción por rangos exactos, CRC y directorio fijado; 2447963 bytes transferidos en la extracción final, más los diagnósticos acotados previos. No se descargó/recalculó el hash histórico del ZIP corporal completo de 142.903.898 bytes.

Modificaciones: selección, jerarquía curada, conversión de coordenadas común, OBJ→GLB y Meshopt con posiciones Float32. Sin nueva decimación, deformación, ajuste visual, reflejo ni anatomía generada por IA. Los textos educativos son redacción propia de hechos anatómicos con enlaces; no se redistribuyen páginas ni imágenes de OpenStax.
