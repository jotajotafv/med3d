# Fase 5: fuentes

La geometría cardiovascular nueva procede únicamente de **BodyParts3D 4.0 OBJ99 / DBCLS**. Se revisaron primero los assets, licencias y documentación locales. La red macroscópica de BP3D permite mantener el marco corporal existente sin registrar una segunda fuente.

| Fuente auditada | Versión / licencia / decisión |
|---|---|
| [BodyParts3D, DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html) | 4.0, archivo `20130619/isa_BP3D_4.0_obj_99.zip`. Fuente utilizada para 162 OBJ. La [declaración vigente del editor](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) indica CC BY 4.0: permite adaptación y redistribución con atribución e indicación de cambios. Las cabeceras históricas CC BY-SA 2.1 Japan se conservan literalmente en los originales. |
| [HRA/HuBMAP, IU y colaboradores](https://github.com/hubmapconsortium/ccf-3d-reference-object-library) | Corazón existente `VH_Male/v1.2/VH_M_Heart.glb`; [licencia del repositorio](https://github.com/hubmapconsortium/ccf-3d-reference-object-library/blob/main/LICENSE) y copia local CC BY 4.0. Se conserva como explorador independiente, sin extracción nueva ni registro corporal. No se extrapola esta licencia a fuentes ajenas. |
| [Z-Anatomy](https://github.com/Z-Anatomy/Models-of-human-anatomy/tree/38649f4193adbe58e426ccac5670b8c4dde474ec) | Inventario local previamente fijado en `38649f4193adbe58e426ccac5670b8c4dde474ec`: 632 nombres candidatos por filtro cardiovascular. Revisión de metadatos, no auditoría geométrica de esos objetos. CC BY-SA 4.0 para la fuente pertinente, con excepciones documentadas en [Fase 4](phase4-expansion-sources.md). No utilizado en Cardiovascular: BP3D proporciona la cobertura seleccionada con registro nativo. No se aplican matrices nerviosas a vasos sin validación. |

Atribución de los activos nuevos: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**. Las modificaciones constan en el catálogo, manifest y [LICENSE](../public/models/anatomy/cardiovascular/LICENSE.txt): selección, transformación común, conversión GLB, compresión Meshopt y nombres/jerarquía curados. Sin geometría de IA, cortes anatómicos inventados ni engrosamiento vascular.

El [source-lock](../research/anatomy/cardiovascular-source-lock.json) registra CRC, bytes, SHA-256 y FMA/FJ de cada original. Se descargaron rangos HTTP exactos de los 162 elementos aprobados, después de seleccionar el inventario; un candidato aórtico adicional se examinó separadamente y se excluyó. No se descargó ni convirtió masivamente todo el archivo de BP3D.

- ZIP original selectivo: SHA-256 `8a4b8ef1e490ef64006c922506425a7d8b5ae38825555cd61bff6e08ae47754d`.
- Directorio central del archivo BP3D: `edde15c7c5f34b2b9743935fb3c1873cce3a9789164427ddf8343c879bcde96b`. El SHA completo del archivo remoto de 142.903.898 bytes no se recalculó.
- Selección final: `a65f74de77298000e1274db9b4c15a42143488b7c1ae801c2736f6b106250540`.
- Los siete hashes GLB y sus tamaños constan en el [catálogo](../public/models/anatomy/cardiovascular/catalog.json); la relación OBJ–malla–propietario está en el [manifest](../public/models/anatomy/cardiovascular/cardiovascular-source-manifest.json).

## Corazón HRA conservado

El [inventario específico](phase5/existing-heart-audit.json) conserva sus 18 nodos/IDs, 14 mallas, 164.119 triángulos, matrices nativas, bounds y ontologías. Aporta cuatro cámaras, cuatro válvulas, septo interventricular y cinco piezas papilares. No se reemplaza ni se superpone al corazón BP3D.

GLB local: 715.820 bytes, SHA-256 `4637d0779ee7c278cf81a326c933528421372bf0aa709188c20308a6ad81b3a1`. Original registrado: 4.071.500 bytes, SHA-256 `b1237e7e765178e9357fd2ea7ccf19d55d0bf9ca55e187886635febe28244c70`. La URL histórica utiliza `main`, no un commit; los hashes fijan los bytes. Se mantienen discrepancias históricas entre algunas etiquetas papilares y URLs ontológicas, señaladas en el inventario, sin reinterpretarlas silenciosamente.

Su visor aplica las matrices del GLB y una normalización global de presentación `3.45 / max(extensión)`, trasladando `-centro × escala`. Esto no constituye registro a BP3D. Las rutas de corazón, pulmones y encéfalo siguen independientes.
