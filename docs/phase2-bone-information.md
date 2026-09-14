# MED3D · Información del sistema óseo, fase 2

Revisión editorial: 14 de septiembre de 2026.

`src/features/anatomy/atlas/bone-education.ts` añade 43 fichas breves de familias óseas. Cada ficha ofrece descripción, función, relaciones descritas en una referencia educativa y un enlace a esa referencia. El catálogo geométrico y la procedencia de sus modelos se registran por separado.

## Alcance de las fichas

Todas las fichas llevan `scope: 'family'`. La interfaz debe mostrar «Información de la familia ósea» junto al nombre de la familia. Una ficha compartida por varias vértebras, falanges o carpianos no constituye una descripción individual de todos sus detalles. El nombre seleccionado y su lateralidad proceden del catálogo; nunca deben sustituirse por el nombre genérico de la ficha.

Los enlaces de navegación a estructuras relacionadas pueden expresar pertenencia al árbol o correspondencia bilateral. Esos enlaces deben distinguirse de una articulación anatómica. El campo `relations` contiene relaciones revisadas expresamente; no se calcula por distancia entre superficies, colisiones, orientación, semejanza del nombre ni vecindad en la escena.

Las especializaciones del atlas y axis se mencionan en la ficha cervical, sin asignar sus características a las demás vértebras. Las familias agrupadas —carpo, tarso, falanges y huesecillos auditivos— requieren futuras fichas individuales si se incorporan datos más detallados. Los huesos sesamoideos accesorios reciben información del tipo óseo; no se identifica un tendón concreto sin datos específicos del modelo.

## Referencias de los hechos anatómicos

Se consultaron las fuentes originales de sus instituciones editoras. Las fichas son microdescripciones editoriales en español de hechos básicos. No incorporan imágenes del libro, citas extensas, párrafos traducidos ni información clínica nueva.

| Referencia | Familias atendidas |
| --- | --- |
| [OpenStax, Anatomy and Physiology 2e, 7.2 The Skull](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-2-the-skull) | Frontal, parietal, temporal, occipital, esfenoides, etmoides, mandíbula, maxilar, cigomático, nasal, lagrimal, palatino, vómer, concha nasal inferior, hioides |
| [OpenStax, 7.3 The Vertebral Column](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-3-the-vertebral-column) | Cervicales, torácicas, lumbares, sacro y cóccix |
| [OpenStax, 7.4 The Thoracic Cage](https://openstax.org/books/anatomy-and-physiology-2e/pages/7-4-the-thoracic-cage) | Costillas y esternón |
| [OpenStax, 8.1 The Pectoral Girdle](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle) | Clavícula y escápula |
| [OpenStax, 8.2 Bones of the Upper Limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb) | Húmero, radio, cúbito, carpo, metacarpo y falanges de la mano |
| [OpenStax, 8.3 The Pelvic Girdle and Pelvis](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-3-the-pelvic-girdle-and-pelvis) | Coxal, ilion, isquion y pubis |
| [OpenStax, 8.4 Bones of the Lower Limb](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-4-bones-of-the-lower-limb) | Fémur, rótula, tibia, peroné, tarso, metatarso, falanges del pie y sesamoideos |
| [NIH / NIDCD, How Do We Hear?](https://www.nidcd.nih.gov/health/how-do-we-hear) | Huesecillos auditivos |

OpenStax identifica como autores de la segunda edición a J. Gordon Betts, Kelly A. Young, James A. Wise, Eddie Johnson, Brandon Poe, Dean H. Kruse, Oksana Korol, Jody E. Johnson, Mark Womble y Peter DeSaix, con publicación inicial el 20 de abril de 2022. Se mantiene el enlace a cada sección junto a la ficha.

Las páginas actuales de OpenStax consultadas muestran una licencia CC BY-NC-SA. No debe suponerse que futuras copias de sus ilustraciones o textos extensos están autorizadas para cualquier uso. El registro de las licencias de los archivos anatómicos 3D es independiente de estas referencias de consulta. Las fichas no incluyen material visual de OpenStax. Referencia general: [acceso al libro de OpenStax](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction).

## Nombres y búsqueda

`BONE_TERMS` contiene un nombre español, un nombre latino cuando se ha cotejado y sinónimos de búsqueda. Se cotejó el latín con la nomenclatura de FIPAT, Terminologia Anatomica 2, disponible en [TA2Viewer de Open Anatomy](https://ta2viewer.openanatomy.org/). Los nombres españoles son etiquetas editoriales y no se presentan como una traducción oficial de FIPAT.

Los sinónimos comunes incluyen escápula/omóplato, cúbito/ulna, peroné/fíbula, rótula/patela y concha nasal inferior/cornete inferior. El buscador debe normalizar tildes y mayúsculas. Los identificadores y nombres del archivo fuente deben conservarse además de estas etiquetas.

Un nombre de miembro de una familia no es sinónimo de toda la familia: «atlas» no debe añadirse a las demás vértebras cervicales, ni «martillo» a los otros huesecillos. El catálogo individual es quien debe aportar estos nombres. Los plurales latinos identifican familias; no se deben reutilizar como nombre individual de cada hueso.

## Mantenimiento

Para ampliar una ficha: identificar primero la estructura exacta en el catálogo; consultar una fuente pertinente; registrar su URL; escribir sólo los hechos apoyados por ella; y declarar si la información corresponde a una familia o a la estructura individual. Una ausencia de información se conserva como pendiente, sin completar automáticamente contenido anatómico.

La revisión editorial de estas fichas verifica correspondencia con sus referencias; no equivale a una validación clínica independiente del atlas ni de la geometría. La cobertura geométrica y las estructuras que faltan deben comunicarse desde el manifiesto de modelos.
