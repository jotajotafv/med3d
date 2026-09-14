# Fase 2.1 — Fichas individuales del sistema óseo

Fecha de verificación: 14 de septiembre de 2026.

## Alcance

Se añaden 20 fichas de huesos nombrados en `src/features/anatomy/atlas/bone-details.ts`. Incluyen clasificación, descripción, función, principales articulaciones, partes, relaciones anatómicas y fuentes. La identidad, lateralidad, región, latín y breadcrumb siguen procediendo del catálogo existente.

Las fichas describen anatomía habitual de un hueso concreto, aplicable a sus ejemplares derecho e izquierdo. No son una caracterización clínica del donante ni certifican que cada accidente anatómico descrito sea distinguible en la malla. Las partes se enumeran para estudio; no se crean mallas, puntos de anclaje ni regiones geométricas ficticias.

El contenido ocupa 69–87 palabras por ficha, sin contar títulos de fuentes ni metadatos del catálogo. Es una extensión breve de consulta, pensada para una lectura de 30–60 segundos; ese tiempo es un objetivo editorial y no una medición con estudiantes.

## Resolución y compatibilidad

- `BoneDetail` y `BONE_DETAILS` son aditivos: `bone-education.ts` permanece como fallback familiar.
- `resolveBoneDetail(node)` da prioridad al `sourceId`, después al `family`, y sólo devuelve fichas para `kind: 'structure'`.
- Atlas C1 (`FMA12519`) y axis C2 (`FMA12520`) tienen fichas distintas. No se aplica la anatomía del atlas a C3–C7 por compartir familia cervical.
- Los grupos, regiones y sistemas no reciben una ficha de hueso individual. Un componente del esternón tampoco recibe silenciosamente la ficha del esternón entero.
- `articulations` contiene relaciones escritas y verificadas. `relatedIds` y la cercanía entre mallas no se utilizan para inferir articulaciones.
- El campo opcional `family` de una articulación es una pista de navegación, no una lista de huesos con los que se articula. Cualquier enlace debe resolver lateralidad y distinguir los rótulos «opuesto»; un astrágalo no se debe convertir en un enlace genérico a todos los tarsos.

## Cobertura y referencias

| Clave | Ficha | Referencia principal |
| --- | --- | --- |
| `femur` | Fémur | [Chang et al., StatPearls / NCBI Bookshelf](https://www.ncbi.nlm.nih.gov/books/NBK532982/) |
| `tibia` | Tibia | [Anatomy, Bony Pelvis and Lower Limb: Tibia](https://www.ncbi.nlm.nih.gov/books/NBK526053/) |
| `fibula` | Peroné | [Anatomy, Bony Pelvis and Lower Limb: Fibula](https://www.ncbi.nlm.nih.gov/books/NBK470591/) |
| `patella` | Rótula | [Anatomy, Bony Pelvis and Lower Limb, Knee Patella](https://www.ncbi.nlm.nih.gov/books/NBK519534/) |
| `humerus` | Húmero | [Anatomy, Shoulder and Upper Limb, Humerus](https://www.ncbi.nlm.nih.gov/books/NBK534821/) |
| `radius` | Radio | [Anatomy, Shoulder and Upper Limb, Forearm Radius](https://www.ncbi.nlm.nih.gov/books/NBK544512/) |
| `ulna` | Cúbito | [Anatomy, Shoulder and Upper Limb, Forearm Ulna](https://www.ncbi.nlm.nih.gov/books/NBK547749/) |
| `scapula` | Escápula | [Anatomy, Thorax, Scapula](https://www.ncbi.nlm.nih.gov/books/NBK538319/) |
| `clavicle` | Clavícula | [Anatomy, Shoulder and Upper Limb, Clavicle](https://www.ncbi.nlm.nih.gov/books/NBK525990/) |
| `hipbone` | Coxal | [Anatomy, Bony Pelvis and Lower Limb: Pelvis Bones](https://www.ncbi.nlm.nih.gov/books/NBK545204/) |
| `sacrum` | Sacro | [Anatomy, Bony Pelvis and Lower Limb: Pelvis Bones](https://www.ncbi.nlm.nih.gov/books/NBK545204/) |
| `sternum` | Esternón | [Anatomy, Thorax, Sternum](https://www.ncbi.nlm.nih.gov/books/NBK541141/) |
| `frontal` | Frontal | [Anatomy, Head and Neck: Frontal Bone](https://www.ncbi.nlm.nih.gov/books/NBK535424/) |
| `parietal` | Parietal | [Anatomy, Head and Neck, Skull](https://www.ncbi.nlm.nih.gov/books/NBK499834/) |
| `temporal` | Temporal | [Temporal Fracture, apartado de anatomía](https://www.ncbi.nlm.nih.gov/books/NBK535391/) |
| `occipital` | Occipital | [Anatomy, Head and Neck, Occipital Bone, Artery, Vein, and Nerve](https://www.ncbi.nlm.nih.gov/books/NBK541093/) |
| `mandible` | Mandíbula | [Anatomy, Head and Neck, Mandible](https://www.ncbi.nlm.nih.gov/books/NBK532292/) |
| `maxilla` | Maxilar | [Anatomy, Head and Neck, Maxilla](https://www.ncbi.nlm.nih.gov/books/NBK538527/) |
| `FMA12519` | Atlas C1 | [Anatomy, Back, Cervical Vertebrae](https://www.ncbi.nlm.nih.gov/books/NBK459200/) |
| `FMA12520` | Axis C2 | [Anatomy, Back, Cervical Vertebrae](https://www.ncbi.nlm.nih.gov/books/NBK459200/) |

NCBI Bookshelf es el repositorio de la National Library of Medicine; estos capítulos pertenecen a StatPearls y a sus autores, no se presentan como autoría del NIH. Se verificaron sus apartados anatómicos, sin incorporar recomendaciones diagnósticas ni terapéuticas.

La clasificación morfológica se contrastó con [OpenStax, 6.2 Bone Classification](https://openstax.org/books/anatomy-and-physiology-2e/pages/6-2-bone-classification). Para detalles concretos también se consultaron [FIPAT, coxal](https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/EN/TAH1029%20Unit%20EN.htm), [FIPAT, parietal](https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/LAEN/TAH403%20Unit%20EN.htm), [FIPAT, temporal](https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/LAEN/TAH544%20Unit%20EN.htm) y [FIPAT, rótula](https://ifaa.unifr.ch/Public/TNAEntryPage/auto/unit/EN/TAH1131%20Unit%20EN.htm). La distinción entre contacto carpiano y disco articular se verificó en [OpenStax, 8.2 Bones of the Upper Limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb).

## Decisiones anatómicas explícitas

Las fichas distinguen articulación, unión ligamentosa y relaciones topográficas. Por ejemplo, el peroné no se articula con el fémur; la rótula no se articula con la tibia; el cúbito no tiene contacto articular directo con el carpo; las costillas se unen al esternón mediante cartílagos; la escápula se desliza respecto al tórax sin una articulación ósea con las costillas. Estas distinciones constan en sus fuentes y no se deducen del render.

Para el temporal se hace explícita la clasificación FIPAT como hueso plano craneal, aunque su geometría sea compleja. Las páginas TAH se identifican en origen como trabajo en curso; no se presentan como una nueva edición definitiva de Terminologia Anatomica.

Se mantiene la nomenclatura latina existente. La referencia [FIPAT TA98, fémur](https://ifaa.unifr.ch/Public/EntryPage/TA98%20Tree/Entity%20TA98%20EN/02.5.04.001%20Entity%20TA98%20EN.htm) confirma `femur` como término preferido y `os femoris` como sinónimo oficial: ambos son válidos. Las fichas no inventan formas latinas laterales ni cambian identificadores de modelos.

## Redacción y licencias

El texto español es redacción original de hechos anatómicos breves. No se copiaron párrafos, traducciones extensas, tablas, imágenes ni figuras de las fuentes. La bibliografía no transfiere la licencia de los artículos a los modelos 3D ni sustituye el registro independiente de procedencia de los assets.

Los capítulos de StatPearls consultados indican CC BY-NC-ND 4.0; OpenStax indica actualmente CC BY-NC-SA 4.0. Se utilizan para verificar hechos y aportar enlaces, sin redistribuir sus obras. Las páginas terminológicas FIPAT consultadas indican CC BY-SA 4.0. Cualquier futura incorporación de imágenes o extractos deberá valorar su licencia específica, independientemente de estas fichas originales.

Cada ficha contiene menos de 90 palabras de contenido. Las dos parejas que comparten referencia principal —coxal/sacro y atlas/axis— suman menos de 200 palabras por página. La referencia general de clasificación sólo aporta etiquetas morfológicas; no se utiliza como fuente del resto del texto.

## Comprobaciones

Se comprobaron los 20 contratos, la longitud del texto, la resolución específica de C1 y C2, el fallback de C3 y la exclusión de componentes y grupos. TypeScript acepta el módulo sin errores. La integración visual y las pruebas globales de la aplicación se documentan por separado en `phase2.1-validation.md`.

El resto de estructuras conserva información familiar identificada como tal. No se declara que todos los huesos dispongan ya de una ficha individual; la ampliación de carpo, tarso, falanges y variantes queda para una revisión educativa posterior.
