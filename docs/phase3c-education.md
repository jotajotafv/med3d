# Fase 3C — fichas educativas y contexto óseo

Código: `eb84c2d206b0bda73bfa5112d9f7943ab3985126`. Fuentes revisadas el 23 de septiembre de 2026. Implementación: [limb-education.ts](../src/features/anatomy/atlas/limb-education.ts), [muscle-education.ts](../src/features/anatomy/atlas/muscle-education.ts) y [MuscleInformation.tsx](../src/features/anatomy/atlas/MuscleInformation.tsx).

Se añaden 24 fichas de familia, lateralizadas para 48 músculos, y seis fichas de cabeza aplicadas a 12 componentes. Las 21 familias anteriores se preservan. Cada ficha incluye nombre/latín, sistema, región, compartimento, descripción, función, acción, origen, inserción, inervación, relaciones y fuentes. Son síntesis educativas propias; no se reproducen ilustraciones ni se deduce anatomía de las mallas.

## Familias y fuentes

| Familia | Región / compartimento | Fuentes utilizadas |
|---|---|---|
| Glúteo mayor | Región glútea · Grupo glúteo | [University of Washington · Muscle Atlas · gluteus maximus](https://rad.uw.edu/muscle-atlas/gluteus-maximus) |
| Glúteo medio | Región glútea · Grupo glúteo | [University of Washington · Muscle Atlas · gluteus medius](https://rad.uw.edu/muscle-atlas/gluteus-medius), [University of Washington · Muscle Atlas · gluteus minimus](https://rad.uw.edu/muscle-atlas/gluteus-minimus) |
| Glúteo menor | Región glútea · Grupo glúteo | [University of Washington · Muscle Atlas · gluteus minimus](https://rad.uw.edu/muscle-atlas/gluteus-minimus), [University of Washington · Muscle Atlas · gluteus medius](https://rad.uw.edu/muscle-atlas/gluteus-medius) |
| Tensor de la fascia lata | Región glútea y muslo lateral · Grupo glúteo | [University of Washington · Muscle Atlas · tensor fascia lata](https://rad.uw.edu/muscle-atlas/tensor-fascia-lata), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Recto femoral | Muslo · Compartimento anterior · grupo cuádriceps | [University of Washington · Muscle Atlas · rectus femoris](https://rad.uw.edu/muscle-atlas/rectus-femoris), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Vasto lateral | Muslo · Compartimento anterior · grupo cuádriceps | [University of Washington · Muscle Atlas · vastus lateralis](https://rad.uw.edu/muscle-atlas/vastus-lateralis), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Vasto medial | Muslo · Compartimento anterior · grupo cuádriceps | [University of Washington · Muscle Atlas · vastus medialis](https://rad.uw.edu/muscle-atlas/vastus-medialis), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Vasto intermedio | Muslo · Compartimento anterior · grupo cuádriceps | [University of Washington · Muscle Atlas · vastus intermedius](https://rad.uw.edu/muscle-atlas/vastus-intermedius), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Sartorio | Muslo · Compartimento anterior | [University of Washington · Muscle Atlas · sartorius](https://rad.uw.edu/muscle-atlas/sartorius) |
| Aductor largo | Muslo · Compartimento medial | [University of Washington · Muscle Atlas · adductor longus](https://rad.uw.edu/muscle-atlas/adductor-longus) |
| Grácil | Muslo · Compartimento medial | [University of Washington · Muscle Atlas · gracilis](https://rad.uw.edu/muscle-atlas/gracilis) |
| Bíceps femoral | Muslo · Compartimento posterior | [University of Washington · Muscle Atlas · biceps femoris long head](https://rad.uw.edu/muscle-atlas/biceps-femoris-long-head), [University of Washington · Muscle Atlas · biceps femoris short head](https://rad.uw.edu/muscle-atlas/biceps-femoris-short-head) |
| Semitendinoso | Muslo · Compartimento posterior · isquiotibiales | [University of Washington · Muscle Atlas · semitendinosus](https://rad.uw.edu/muscle-atlas/semitendinosus) |
| Semimembranoso | Muslo · Compartimento posterior · isquiotibiales | [University of Washington · Muscle Atlas · semimembranosus](https://rad.uw.edu/muscle-atlas/semimembranosus), [University of Washington · Muscle Atlas · semitendinosus](https://rad.uw.edu/muscle-atlas/semitendinosus) |
| Tibial anterior | Pierna · Compartimento anterior | [University of Washington · Muscle Atlas · tibialis anterior](https://rad.uw.edu/muscle-atlas/tibialis-anterior) |
| Fibular largo | Pierna · Compartimento lateral | [University of Washington · Muscle Atlas · peroneus longus](https://rad.uw.edu/muscle-atlas/peroneus-longus), [University of Washington · Muscle Atlas · peroneus brevis](https://rad.uw.edu/muscle-atlas/peroneus-brevis) |
| Fibular corto | Pierna · Compartimento lateral | [University of Washington · Muscle Atlas · peroneus brevis](https://rad.uw.edu/muscle-atlas/peroneus-brevis), [University of Washington · Muscle Atlas · peroneus longus](https://rad.uw.edu/muscle-atlas/peroneus-longus) |
| Gastrocnemio | Pierna · Compartimento posterior superficial | [University of Washington · Muscle Atlas · gastrocnemius](https://rad.uw.edu/muscle-atlas/gastrocnemius), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Sóleo | Pierna · Compartimento posterior superficial | [University of Washington · Muscle Atlas · soleus](https://rad.uw.edu/muscle-atlas/soleus), [OpenStax · Anatomy and Physiology 2e · 11.6 Miembro inferior](https://openstax.org/books/anatomy-and-physiology-2e/pages/11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs) |
| Tibial posterior | Pierna · Compartimento posterior profundo | [University of Washington · Muscle Atlas · tibialis posterior](https://rad.uw.edu/muscle-atlas/tibialis-posterior) |
| Flexor radial del carpo | Antebrazo · Compartimento anterior | [University of Washington · Muscle Atlas · flexor carpi radialis](https://rad.uw.edu/muscle-atlas/flexor-carpi-radialis) |
| Pronador redondo | Antebrazo · Compartimento anterior | [University of Washington · Muscle Atlas · pronator teres](https://rad.uw.edu/muscle-atlas/pronator-teres) |
| Extensor radial largo del carpo | Antebrazo · Compartimento posterior | [University of Washington · Muscle Atlas · extensor carpi radialis longus](https://rad.uw.edu/muscle-atlas/extensor-carpi-radialis-longus), [University of Washington · Muscle Atlas · flexor carpi radialis](https://rad.uw.edu/muscle-atlas/flexor-carpi-radialis) |
| Supinador | Antebrazo · Compartimento posterior profundo | [University of Washington · Muscle Atlas · supinator](https://rad.uw.edu/muscle-atlas/supinator) |

## Alcance de componentes y decisiones

- Bíceps femoral: la cabeza larga nace en el isquion, cruza la cadera y recibe la división tibial del ciático; la corta nace en el fémur y recibe la división fibular común. Su ficha no atribuye extensión de cadera a la cabeza corta. La interfaz identifica explícitamente el alcance de la inervación.
- Gastrocnemio: cabezas medial y lateral con su origen femoral propio y una inserción calcánea compartida.
- Pronador redondo: cabeza humeral con origen humeral y cabeza ulnar con origen en la coronoides; inserción radial e inervación medianas resumidas para el músculo.
- Cuádriceps: grupo editorial, sin recuento como quinto músculo; cada vasto y recto femoral tiene ficha propia. Sólo el recto femoral incluye el coxal como origen. El contexto del grupo es la unión explícita de las cuatro fichas.
- Patela: inserción mediante tendón cuadricipital; tibia: continuidad mediante ligamento patelar. El texto distingue ambos tramos.
- Tensor de fascia lata: inserción en tracto iliotibial, sin inventar inserción ósea directa. Su contexto óseo muestra el coxal.
- Glúteo mayor: el cóccix se menciona en texto y permanece ausente del modelo; no se reemplaza por otro hueso.
- Tibial posterior: se utiliza el patrón de expansiones descrito por UW; la posible extensión al cuneiforme medial se marca variable y no se presupone en BP3D.

## Contextos explícitos por nodo

Sólo se muestran huesos ipsilaterales o de línea media con ID documentado. No hay búsqueda por distancia, sustitución contralateral ni superficies de fijación pintadas. Un hueso ausente se omite. El contexto de cabeza usa sus fijaciones propias.

| Nodo muscular | Tipo | Lado | IDs óseos explícitos |
|---|---|---|---|
| `bp3d:FMA22328` | structure | right | `bp3d:FMA16586`, `bp3d:FMA16202`, `bp3d:FMA24474` |
| `bp3d:FMA22329` | structure | left | `bp3d:FMA16587`, `bp3d:FMA16202`, `bp3d:FMA24475` |
| `bp3d:FMA22330` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24474` |
| `bp3d:FMA22331` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24475` |
| `bp3d:FMA22332` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24474` |
| `bp3d:FMA22333` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24475` |
| `bp3d:FMA22425` | structure | right | `bp3d:FMA16586` |
| `bp3d:FMA22426` | structure | left | `bp3d:FMA16587` |
| `bp3d:FMA38928` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24486`, `bp3d:FMA24477` |
| `bp3d:FMA38929` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24487`, `bp3d:FMA24478` |
| `bp3d:FMA38930` | structure | right | `bp3d:FMA24474`, `bp3d:FMA24486`, `bp3d:FMA24477` |
| `bp3d:FMA38931` | structure | left | `bp3d:FMA24475`, `bp3d:FMA24487`, `bp3d:FMA24478` |
| `bp3d:FMA38932` | structure | right | `bp3d:FMA24474`, `bp3d:FMA24486`, `bp3d:FMA24477` |
| `bp3d:FMA38933` | structure | left | `bp3d:FMA24475`, `bp3d:FMA24487`, `bp3d:FMA24478` |
| `bp3d:FMA38934` | structure | right | `bp3d:FMA24474`, `bp3d:FMA24486`, `bp3d:FMA24477` |
| `bp3d:FMA38935` | structure | left | `bp3d:FMA24475`, `bp3d:FMA24487`, `bp3d:FMA24478` |
| `bp3d:FMA22354` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24477` |
| `bp3d:FMA22355` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24478` |
| `bp3d:FMA22456` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24474` |
| `bp3d:FMA22457` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24475` |
| `bp3d:FMA43883` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24477` |
| `bp3d:FMA43884` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24478` |
| `med3d:muscle:bicepsfemoris:right` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24474`, `bp3d:FMA24480`, `bp3d:FMA24477` |
| `bp3d:FMA45888` | component | right | `bp3d:FMA16586`, `bp3d:FMA24480`, `bp3d:FMA24477` |
| `med3d:muscle:bicepsfemoris:left` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24475`, `bp3d:FMA24481`, `bp3d:FMA24478` |
| `bp3d:FMA45889` | component | left | `bp3d:FMA16587`, `bp3d:FMA24481`, `bp3d:FMA24478` |
| `bp3d:FMA45891` | component | right | `bp3d:FMA24474`, `bp3d:FMA24480`, `bp3d:FMA24477` |
| `bp3d:FMA45892` | component | left | `bp3d:FMA24475`, `bp3d:FMA24481`, `bp3d:FMA24478` |
| `bp3d:FMA22358` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24477` |
| `bp3d:FMA22359` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24478` |
| `bp3d:FMA22448` | structure | right | `bp3d:FMA16586`, `bp3d:FMA24477` |
| `bp3d:FMA22449` | structure | left | `bp3d:FMA16587`, `bp3d:FMA24478` |
| `bp3d:FMA22544` | structure | right | `bp3d:FMA24477`, `bp3d:FMA24521`, `bp3d:FMA24507` |
| `bp3d:FMA22545` | structure | left | `bp3d:FMA24478`, `bp3d:FMA24522`, `bp3d:FMA24508` |
| `bp3d:FMA22552` | structure | right | `bp3d:FMA24480`, `bp3d:FMA24521`, `bp3d:FMA24507` |
| `bp3d:FMA22553` | structure | left | `bp3d:FMA24481`, `bp3d:FMA24522`, `bp3d:FMA24508` |
| `bp3d:FMA22554` | structure | right | `bp3d:FMA24480`, `bp3d:FMA24515` |
| `bp3d:FMA22555` | structure | left | `bp3d:FMA24481`, `bp3d:FMA24516` |
| `med3d:muscle:gastrocnemius:right` | structure | right | `bp3d:FMA24474`, `bp3d:FMA24497` |
| `bp3d:FMA45957` | component | right | `bp3d:FMA24474`, `bp3d:FMA24497` |
| `med3d:muscle:gastrocnemius:left` | structure | left | `bp3d:FMA24475`, `bp3d:FMA24498` |
| `bp3d:FMA45958` | component | left | `bp3d:FMA24475`, `bp3d:FMA24498` |
| `bp3d:FMA45960` | component | right | `bp3d:FMA24474`, `bp3d:FMA24497` |
| `bp3d:FMA45961` | component | left | `bp3d:FMA24475`, `bp3d:FMA24498` |
| `bp3d:FMA22558` | structure | right | `bp3d:FMA24480`, `bp3d:FMA24477`, `bp3d:FMA24497` |
| `bp3d:FMA22559` | structure | left | `bp3d:FMA24481`, `bp3d:FMA24478`, `bp3d:FMA24498` |
| `bp3d:FMA65018` | structure | right | `bp3d:FMA24477`, `bp3d:FMA24480`, `bp3d:FMA24500`, `bp3d:FMA24523`, `bp3d:FMA24509`, `bp3d:FMA24511`, `bp3d:FMA24513` |
| `bp3d:FMA65019` | structure | left | `bp3d:FMA24478`, `bp3d:FMA24481`, `bp3d:FMA24501`, `bp3d:FMA24524`, `bp3d:FMA24510`, `bp3d:FMA24512`, `bp3d:FMA24514` |
| `bp3d:FMA38460` | structure | right | `bp3d:FMA23130`, `bp3d:FMA24466` |
| `bp3d:FMA38461` | structure | left | `bp3d:FMA23131`, `bp3d:FMA24467` |
| `med3d:muscle:pronatorteres:right` | structure | right | `bp3d:FMA23130`, `bp3d:FMA23467`, `bp3d:FMA23464` |
| `bp3d:FMA38560` | component | right | `bp3d:FMA23130`, `bp3d:FMA23464` |
| `med3d:muscle:pronatorteres:left` | structure | left | `bp3d:FMA23131`, `bp3d:FMA23468`, `bp3d:FMA23465` |
| `bp3d:FMA38561` | component | left | `bp3d:FMA23131`, `bp3d:FMA23465` |
| `bp3d:FMA38562` | component | right | `bp3d:FMA23467`, `bp3d:FMA23464` |
| `bp3d:FMA38563` | component | left | `bp3d:FMA23468`, `bp3d:FMA23465` |
| `bp3d:FMA38495` | structure | right | `bp3d:FMA23130`, `bp3d:FMA24466` |
| `bp3d:FMA38496` | structure | left | `bp3d:FMA23131`, `bp3d:FMA24467` |
| `bp3d:FMA38513` | structure | right | `bp3d:FMA23130`, `bp3d:FMA23467`, `bp3d:FMA23464` |
| `bp3d:FMA38514` | structure | left | `bp3d:FMA23131`, `bp3d:FMA23468`, `bp3d:FMA23465` |

Cuádriceps derecho: `FMA16586`, `FMA24474`, `FMA24486`, `FMA24477`; izquierdo: `FMA16587`, `FMA24475`, `FMA24487`, `FMA24478`. Son coxal, fémur, patela y tibia del mismo lado.

No se comprueba en este ejemplar la distribución nerviosa, acción o huella de fijación descrita por la literatura. Son relaciones anatómicas generales para estudio. La oclusión de una estructura profunda se mantiene hasta que el estudiante decide aislarla, ocultar vecinas o mostrar contexto.

En particular, la inserción calcánea del gastrocnemio se explica como anatomía general mediante su continuidad tendinosa. Las mallas de sus cabezas no representan todo ese trayecto y queda un intervalo visible hasta el calcáneo en la captura de contexto. Mostrar ambos huesos relacionados no valida puntos de inserción sobre la geometría ni completa el tendón ausente.
