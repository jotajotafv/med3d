# Fase 9 · fuentes y licencia

| Fuente examinada | Evidencia disponible | Decisión |
|---|---|---|
| DBCLS BodyParts3D 4.0 OBJ99 | Tablas ISA/PART-OF y directorio central ya conservados en `research/anatomy/torso-metadata.zip`; FMA7163/BP9115/FJ2810 | Usada: una pieza nativa en el marco corporal del atlas |
| BodyParts3D 4.3 | `FMA2Obj43.txt` en `research/anatomy/respiratory-metadata.zip`; misma correspondencia FMA7163/FJ2810 | Sin extracción: no aporta una ventaja demostrada frente al original 4.0; revisión limitada a IDs |
| HRA/HuBMAP existente | `public/models/skin.glb`, procedencia `VH_Male/v1.1/VH_M_Skin.glb` en el manifiesto; un asset de presentación de Visible Human | Conservado sin cambios, excluido de la integración corporal BP3D por marco distinto |
| Z-Anatomy | Documentación y registro regional/per-nervio de Fase 4 | Sin nueva extracción: las matrices nerviosas no prueban el registro de una envoltura corporal |

No fue necesaria otra fuente. No se generó anatomía con IA, ni se usaron modelos comerciales o activos sin procedencia.

Fuente utilizada: **BodyParts3D / Anatomography, Database Center for Life Science (DBCLS), Japón; versión 4.0 OBJ99**. [Descripción institucional](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html), [archivo original](https://dbarchive.biosciencedbc.jp/data/bodyparts3d/20130619/isa_BP3D_4.0_obj_99.zip) y [licencia institucional vigente](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html).

La página institucional declara **CC BY 4.0** desde su actualización de 2025-02-27; permite adaptación y redistribución con atribución. Se mantiene sin editar la cabecera histórica del OBJ original. Atribución distribuida: “BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.” [LICENSE del módulo](../public/models/anatomy/integumentary/LICENSE.txt) y [condiciones CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Se descargaron sólo los rangos de cabecera y contenido de FJ2810, verificando longitud, CRC e identidad. Original sin modificar en [integumentary-originals.zip](../research/anatomy/integumentary-originals.zip); rangos/URLs y hashes en [source-lock](../research/anatomy/integumentary-source-lock.json). El modelo corporal masculino de referencia no representa todos los cuerpos, edades o fenotipos. El material neutro no pretende identificar etnia.

Las fuentes educativas se detallan en [educación](phase9-education.md). El historial de registro nervioso continúa en [Fase 4](phase4-registration.md); no se reabre ni se aplica a piel.
