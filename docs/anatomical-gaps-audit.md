# Auditoría de cobertura anatómica MED3D

Fecha: 2026-10-11. Rama: `phase-anatomical-gaps-audit`. Base estable verificada tras `git fetch origin`: `1be9dd644dea33cc008fe47889e4608bd3fab8f6`; `main` y `origin/main` coincidentes. El árbol estaba limpio antes de crear la rama. Auditoría documental, sin implementación ni nuevos modelos.

## Resumen ejecutivo

El Atlas corporal contiene **580 unidades de tipo estructura, 228 componentes, 937 mallas y 52 módulos GLB**, distribuidos en **11 sistemas**. La cobertura es amplia en huesos y regional en músculos, nervios y vasos; los órganos internos están representados principalmente por su forma externa. La red linfática y la anatomía femenina son los huecos más extensos por dominio. Ocular pertenece al sistema nervioso y sólo integra córnea, esclerótica e iris bilaterales, además del nervio óptico del catálogo nervioso.

Se documentan **119 familias de gaps: 49 de nivel A, 57 de nivel B y 13 de nivel C**. Esta cifra cuenta filas de alcance definido, **no estructuras individuales ausentes**: una fila puede contener varios músculos, ambos lados o componentes relacionados. No pretende contar toda la anatomía humana. El inventario óseo sí enumera exactamente las 203 posiciones presentes y las siete posiciones convencionales ausentes.

Las oportunidades de menor incertidumbre de marco están en BodyParts3D 4.0: diafragma, iliopsoas, rotadores profundos, intercostales, dentición y partes oculares. Los enlaces nominales requieren inspección de originales antes de una incorporación futura. Médula, ciático, radial y otros recursos Z/HRA siguen necesitando registro; haberlos descargado o haber registrado otros nervios no los convierte en candidatos aprobados. La anatomía femenina requiere un atlas con referencia propia.

| Sistema | Cobertura actual | Gaps principales | Nivel | Fuente candidata | Dificultad | Prioridad |
| --- | --- | --- | --- | --- | --- | --- |
| Óseo | 203 unidades; cobertura ósea amplia | Cóccix y seis huesecillos; tejidos articulares avanzados | A/B | HRA / OpenEar / Z | Alta para registrar oído/pelvis | P2; B por alcance |
| Muscular | 152 unidades / 76 familias bilaterales | Diafragma, cara, abdomen/espalda, pelvis y músculos distales | A/B | BP3D 4.0 / Z | Baja–media nativos; alta otro cuerpo | P1 nativos; P2 con registro |
| Nervioso | 58 unidades incluyendo 2 ojos; cobertura regional | Médula, raíces, plexos, nervios proximales, autónomo, ocular | A/B/C | BP3D / Z / HRA | Alta; fallos de registro previos | P1 ocular nativo; P2 investigación |
| Cardiovascular | 110 unidades; macrovasculatura segmentaria | Carótidas externas, femorales profundas arteriales, fibulares, detalle cardíaco | A/B/C | BP3D / Z | Media–alta; identidad/continuidad | P2; C futura |
| Respiratorio | 6 órganos/unidades; 51 componentes | Nasal/faringe, pleuras, laringe blanda, continuidad bronquial | A/B/C | BP3D / Z / HRA | Media–alta | P2; C futura |
| Digestivo | 23 unidades; tubo discontinuo | Boca/dentición, parótidas, ciego, sigmoide, canal anal, colédoco | A/B/C | BP3D / Z / HRA | Media–alta | P1 dentición; P2 resto |
| Urinario | 6 órganos/vías externos presentes | Anatomía renal interna y vasos internos | A/B/C | HRA; Z con restricción renal | Alta; licencia/registro/subpartes | P2; C futura |
| Endocrino | 9 unidades; glándulas principales presentes | Subdivisiones y microanatomía | B/C | BP3D/Z a verificar por parte | Media–alta | P2/P3; C futura |
| Linfático / inmunitario | 2 órganos: bazo y timo | Red, ganglios, conductos y amígdalas | A/B/C | Z parcial / HRA ganglio; resto investigar | Alta | P2 investigación; C futura |
| Reproductor | 10 unidades masculinas; femenino 0 | Conductos/glándulas/escroto; referencia femenina | A/B/C | Z / HRA femenino | Alta; femenino separado | P2 estratégico; C futura |
| Tegumentario | 1 superficie global | Regiones, subcutáneo, pelo/uñas y capas histológicas | B/C | BP3D / HRA; otras partes investigar | Media–alta | P2/P3; C futura |

## Estado actual del Atlas

Conteo de los catálogos actuales compuesto con las funciones reales `composeBodyCatalog` y `withOcularCoverage`, contrastado con los GLB físicos. Cada malla tiene un único propietario directo en el catálogo. Cada estructura/componente tiene geometría directa o descendiente. Un padre seleccionable y sus componentes pueden referirse a las mismas superficies: **580 + 228 tampoco es un conteo de órganos independientes**.

| ID sistema | Estructuras | Componentes | Nodos | Editoriales | Mallas | GLB | Triángulos | Bytes GLB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| skeletal | 203 | 3 | 249 | 43 | 205 | 7 | 512.450 | 3.916.940 |
| integumentary | 1 | 0 | 2 | 1 | 1 | 1 | 203.382 | 1.631.504 |
| muscular | 152 | 52 | 260 | 56 | 182 | 18 | 885.860 | 9.417.864 |
| nervous | 58 | 67 | 149 | 24 | 131 | 7 | 523.036 | 4.517.228 |
| cardiovascular | 110 | 30 | 155 | 15 | 162 | 7 | 685.016 | 5.649.280 |
| respiratory | 6 | 51 | 67 | 10 | 128 | 3 | 212.484 | 2.330.012 |
| digestive | 23 | 17 | 50 | 10 | 96 | 4 | 177.240 | 1.641.196 |
| urinary | 6 | 0 | 10 | 4 | 6 | 1 | 9944 | 94.872 |
| endocrine | 9 | 3 | 16 | 4 | 11 | 2 | 20.166 | 467.728 |
| lymphatic | 2 | 2 | 7 | 3 | 3 | 1 | 3410 | 35.160 |
| reproductive | 10 | 3 | 15 | 2 | 12 | 1 | 7184 | 93.996 |

Total: **981 nodos**, incluidos **173 editoriales** (raíces, sistemas, regiones y agrupadores, incluido el root corporal), **3.240.172 triángulos** y **29.795.780 bytes GLB**. Las filas suman 980 nodos; el root corporal neutral aporta el restante. El esternón es una estructura con tres componentes, y los dos ojos son padres de cobertura parcial con seis componentes en total.

| Sistema | Procedencia integrada | Licencias declaradas en catálogo | Frame |
| --- | --- | --- | --- |
| Sistema óseo | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema tegumentario | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema muscular | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema nervioso | BodyParts3D / Anatomography; Z-Anatomy · selección periférica | CC BY 4.0; CC BY-SA 4.0 | bodyparts3d-4.0-male |
| Sistema cardiovascular | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema respiratorio | BodyParts3D / Anatomography | CC BY 4.0; CC BY-SA 2.1 Japan | bodyparts3d-4.0-male |
| Sistema digestivo | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema urinario | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema endocrino | BodyParts3D / Anatomography | CC BY 4.0; CC BY-SA 2.1 Japan | bodyparts3d-4.0-male |
| Sistema linfático / inmunitario | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |
| Sistema reproductor | BodyParts3D / Anatomography | CC BY 4.0 | bodyparts3d-4.0-male |

El marco del producto es `bodyparts3d-4.0-male`, en metros, Y arriba; conversión nativa BP3D `(x,y,z) → (x,z,-y)/1000`. El identificador de marco final no implica que los originales Z-Anatomy o HRA nazcan en ese marco. Sólo 38 objetos de la expansión nerviosa Z fueron aprobados y transformados históricamente. En 4.3 se aprobaron 18 elementos pulmonares y siete tiroideos/paratiroideos mediante controles de sus respectivas regiones.

Los cuatro GLB de exploradores de órgano (corazón, pulmones, encéfalo y piel) están fuera de este inventario corporal. Existen en el producto y conservan cobertura propia, pero sus mallas no se suman al cuerpo ni completan automáticamente sus ausencias, por diferencias de fuente/frame. Sus hashes actuales están en `legacyOrganAssets` del JSON. Las fichas educativas pueden mencionar relaciones o partes sin que exista geometría integrada para ellas.

## Metodología

1. Verificación de Git, remotos y checkpoint publicado antes de crear la rama solicitada; sin trabajar sobre backups.
2. Lectura de los 12 catálogos físicos (11 sistemas más extensión ocular), composición con el código vigente y clasificación por `kind`. Verificación de los 52 GLB actuales: magic/longitud, SHA-256, bytes, mallas, nombres, referencias, propietarios y triángulos de accessors. No se decodificó ni modificó geometría.
3. Lectura de catálogos, manifiestos, registros, validaciones, locks y selecciones bajo `public/models/anatomy` y `research/anatomy`. El JSON identifica 93 archivos de evidencia por ruta/hash, 18 ZIP históricos por hash y los cuatro archivos de caché fuente cuyo hash se cotejó con su lock.
4. Contraste de decisiones históricas con IDs y mallas vigentes. Ejemplo: lumbricales e interóseos plantares del pie ya están; radial principal, cóccix y huesecillos no. No se reutilizaron sin revisar listas antiguas de pendientes.
5. Búsqueda nominal en tablas ISA/PARTOF de BP3D 4.0 y documentación 4.3; comparación de FMA y FJ con elementos ya integrados. Búsqueda en el inventario histórico Z excluyendo marcadores/grupos: una etiqueta o punto de inserción no es un órgano. Las filas del JSON conservan patrones, nombres, IDs y la distinción entre elementos ya integrados y candidatos adicionales.
6. Sólo después, consulta de documentación oficial externa para licencias y candidatos prioritarios. No se descargó, convirtió ni registró ningún modelo nuevo.

**Estados independientes.** PRESENTE significa geometría integrada y vinculada a selección en el código vigente; PARCIAL, representación con alcance importante pendiente; AUSENTE, sin representación para el alcance descrito. APLAZADO describe la decisión histórica explícita, no sustituye al estado actual. NO DISPONIBLE EN FUENTE se limita a la fuente/versión examinada: sin coincidencia nominal no demuestra inexistencia universal. FUENTE CANDIDATA no significa lista para integrar. NO APLICA al cuerpo masculino puede coexistir con AUSENTE en el producto y REQUIERE ATLAS FEMENINO.

**Jerarquía de evidencia.** Un original integrado con catálogo y hash es prueba de presencia; una tabla nominal FMA→FJ es sólo candidato; una página que anuncia un órgano es evidencia de biblioteca, no de todas sus subpartes. Un vínculo PARTOF puede conducir a una parte ya usada: FMA14541/ciego apunta a FJ2599 de unión ileocecal, y FMA7647/médula puede conducir a FJ1737/canal central. No se proponen como órganos completos nuevos.

**Niveles.** A: macroanatomía esencial; B: macroanatomía avanzada; C: microanatomía/histología. Corteza/médula renal, pirámides, cálices y pelvis pertenecen a macroanatomía interna, aquí A; no se relegan a C por estar dentro del órgano. La terminología es coherente con la descripción de anatomía macroscópica renal de [OpenStax](https://openstax.org/books/anatomy-and-physiology-2e/pages/25-3-gross-anatomy-of-the-kidney). No se cambió ninguna clasificación histórica del repositorio.

El alcance se cierra en órganos, regiones macroscópicas, familias musculares y trayectos nerviosos/vasculares educativos; los vasos terminales, variantes menores y tejidos celulares se agrupan. Los IDs de gap de este informe son claves documentales, no nuevos IDs del catálogo. El JSON incluye 808 unidades anatómicas vigentes, sin los agrupadores editoriales, para reproducir el contraste.

## Sistema óseo

**203 estructuras = 199 huesos del inventario adulto convencional representados + cuatro sesamoideos accesorios del pie**. Hay 205 mallas: esternón con tres piezas y un único hioides tras eliminar históricamente su duplicado exacto. No se fuerza el número 206. Cráneo: 22 huesos craneofaciales y hioides; columna: C1–C7, T1–T12, L1–L5 y sacro; tórax: 24 costillas y esternón. Cada región superior tiene 32 posiciones contando clavícula/escápula, brazo/antebrazo y mano; cada región inferior, 33 contando coxal, miembro y dos sesamoideos accesorios por pie.

**Faltantes óseos exactos:** cóccix; martillo izquierdo, yunque izquierdo, estribo izquierdo; martillo derecho, yunque derecho, estribo derecho. No se encontraron otros huecos dentro de este inventario de posiciones óseas adulto; dientes, cartílago, discos y ligamentos son tejidos/alcances separados. No se promete representar toda variación sesamoidea.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `skeletal-coccyx` — Cóccix | AUSENTE / A | HRA cóccix; REGISTERABLE | P2 / 67.6 | Ausente del catálogo actual; candidato HRA VH_M_coccyx, 422 vértices en otro donante. Las matrices finales históricas son nulas. Condición: Registro/identidad del recurso aún no aprobados. |
| `skeletal-ossicles` — Martillo, yunque y estribo de ambos lados | AUSENTE / B | OpenEar; REGISTERABLE | P2 / 67.6 | Seis posiciones ausentes. OpenEar ZETA/EPSILON son dos especímenes, no un par bilateral validado. No reflejar. La excepción de oído interno en Z obliga a revisar procedencia concreta, sin atribuirla automáticamente al oído medio. Condición: Registro/identidad del recurso aún no aprobados; Confirmar lateralidad de cada espécimen. |
| `skeletal-discs` — Discos intervertebrales | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Las 24 vértebras y el sacro tienen geometría; no hay discos seleccionables. Tejido articular separado del conteo óseo. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `skeletal-joints` — Cartílagos articulares, meniscos y cápsulas | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Auditoría del aparato locomotor más allá de huesos. Su ausencia como componentes no convierte una posición ósea presente en ausente; cartílagos laríngeos pertenecen a Respiratorio. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `skeletal-ligaments` — Ligamentos articulares y retináculos seleccionables | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Cobertura no integrada como tejido propio; fuentes nominales parciales, no una colección completa de todas las articulaciones. |

<details>
<summary>Lista exacta de las 203 posiciones óseas presentes, con IDs actuales</summary>

| ID vigente | Posición | Región |
| --- | --- | --- |
| bp3d:FMA7857 | Costilla 1 derecha | skeletal:region:thorax |
| bp3d:FMA7882 | Costilla 2 derecha | skeletal:region:thorax |
| bp3d:FMA7909 | Costilla 3 derecha | skeletal:region:thorax |
| bp3d:FMA7957 | Costilla 4 derecha | skeletal:region:thorax |
| bp3d:FMA7987 | Costilla 1 izquierda | skeletal:region:thorax |
| bp3d:FMA8012 | Costilla 2 izquierda | skeletal:region:thorax |
| bp3d:FMA8039 | Costilla 3 izquierda | skeletal:region:thorax |
| bp3d:FMA8066 | Costilla 5 derecha | skeletal:region:thorax |
| bp3d:FMA8093 | Costilla 5 izquierda | skeletal:region:thorax |
| bp3d:FMA8148 | Costilla 4 izquierda | skeletal:region:thorax |
| bp3d:FMA8175 | Costilla 6 derecha | skeletal:region:thorax |
| bp3d:FMA8202 | Costilla 6 izquierda | skeletal:region:thorax |
| bp3d:FMA8229 | Costilla 7 derecha | skeletal:region:thorax |
| bp3d:FMA8256 | Costilla 7 izquierda | skeletal:region:thorax |
| bp3d:FMA8283 | Costilla 8 derecha | skeletal:region:thorax |
| bp3d:FMA8310 | Costilla 8 izquierda | skeletal:region:thorax |
| bp3d:FMA8364 | Costilla 9 derecha | skeletal:region:thorax |
| bp3d:FMA8391 | Costilla 9 izquierda | skeletal:region:thorax |
| bp3d:FMA8445 | Costilla 10 derecha | skeletal:region:thorax |
| bp3d:FMA8472 | Costilla 10 izquierda | skeletal:region:thorax |
| bp3d:FMA8531 | Costilla 11 derecha | skeletal:region:thorax |
| bp3d:FMA8532 | Costilla 11 izquierda | skeletal:region:thorax |
| bp3d:FMA8533 | Costilla 12 derecha | skeletal:region:thorax |
| bp3d:FMA8534 | Costilla 12 izquierda | skeletal:region:thorax |
| bp3d:FMA9165 | Vértebra torácica · T1 | skeletal:region:spine |
| bp3d:FMA9187 | Vértebra torácica · T2 | skeletal:region:spine |
| bp3d:FMA9209 | Vértebra torácica · T3 | skeletal:region:spine |
| bp3d:FMA9248 | Vértebra torácica · T4 | skeletal:region:spine |
| bp3d:FMA9710 | Vómer | skeletal:region:skull |
| bp3d:FMA9922 | Vértebra torácica · T5 | skeletal:region:spine |
| bp3d:FMA9945 | Vértebra torácica · T6 | skeletal:region:spine |
| bp3d:FMA9968 | Vértebra torácica · T7 | skeletal:region:spine |
| bp3d:FMA9991 | Vértebra torácica · T8 | skeletal:region:spine |
| bp3d:FMA10014 | Vértebra torácica · T9 | skeletal:region:spine |
| bp3d:FMA10037 | Vértebra torácica · T10 | skeletal:region:spine |
| bp3d:FMA10059 | Vértebra torácica · T11 | skeletal:region:spine |
| bp3d:FMA10081 | Vértebra torácica · T12 | skeletal:region:spine |
| bp3d:FMA12519 | Atlas · C1 | skeletal:region:spine |
| bp3d:FMA12520 | Axis · C2 | skeletal:region:spine |
| bp3d:FMA12521 | Vértebra cervical · C3 | skeletal:region:spine |
| bp3d:FMA12522 | Vértebra cervical · C4 | skeletal:region:spine |
| bp3d:FMA12523 | Vértebra cervical · C5 | skeletal:region:spine |
| bp3d:FMA12524 | Vértebra cervical · C6 | skeletal:region:spine |
| bp3d:FMA12525 | Vértebra cervical · C7 | skeletal:region:spine |
| bp3d:FMA13072 | Vértebra lumbar · L1 | skeletal:region:spine |
| bp3d:FMA13073 | Vértebra lumbar · L2 | skeletal:region:spine |
| bp3d:FMA13074 | Vértebra lumbar · L3 | skeletal:region:spine |
| bp3d:FMA13075 | Vértebra lumbar · L4 | skeletal:region:spine |
| bp3d:FMA13076 | Vértebra lumbar · L5 | skeletal:region:spine |
| bp3d:FMA13322 | Clavícula derecha | skeletal:region:arm-right |
| bp3d:FMA13323 | Clavícula izquierda | skeletal:region:arm-left |
| bp3d:FMA13395 | Escápula derecha | skeletal:region:arm-right |
| bp3d:FMA13396 | Escápula izquierda | skeletal:region:arm-left |
| bp3d:FMA16202 | Sacro | skeletal:region:spine |
| bp3d:FMA16586 | Hueso coxal derecho | skeletal:region:leg-right |
| bp3d:FMA16587 | Hueso coxal izquierdo | skeletal:region:leg-left |
| bp3d:FMA23130 | Húmero derecho | skeletal:region:arm-right |
| bp3d:FMA23131 | Húmero izquierdo | skeletal:region:arm-left |
| bp3d:FMA23464 | Radio derecho | skeletal:region:arm-right |
| bp3d:FMA23465 | Radio izquierdo | skeletal:region:arm-left |
| bp3d:FMA23467 | Cúbito derecho | skeletal:region:arm-right |
| bp3d:FMA23468 | Cúbito izquierdo | skeletal:region:arm-left |
| bp3d:FMA23725 | Trapezoide derecho | skeletal:region:arm-right |
| bp3d:FMA23938 | Falange media del índice izquierdo | skeletal:region:arm-left |
| bp3d:FMA23940 | Falange media del medio izquierdo | skeletal:region:arm-left |
| bp3d:FMA23942 | Falange media del anular izquierdo | skeletal:region:arm-left |
| bp3d:FMA23944 | Falange media del meñique izquierdo | skeletal:region:arm-left |
| bp3d:FMA23951 | Falange distal del pulgar izquierdo | skeletal:region:arm-left |
| bp3d:FMA23953 | Falange distal del índice izquierdo | skeletal:region:arm-left |
| bp3d:FMA23955 | Falange distal del medio izquierdo | skeletal:region:arm-left |
| bp3d:FMA23957 | Falange distal del anular izquierdo | skeletal:region:arm-left |
| bp3d:FMA23959 | Falange distal del meñique izquierdo | skeletal:region:arm-left |
| bp3d:FMA24435 | Escafoides derecho | skeletal:region:arm-right |
| bp3d:FMA24436 | Escafoides izquierdo | skeletal:region:arm-left |
| bp3d:FMA24437 | Semilunar derecho | skeletal:region:arm-right |
| bp3d:FMA24438 | Semilunar izquierdo | skeletal:region:arm-left |
| bp3d:FMA24439 | Piramidal derecho | skeletal:region:arm-right |
| bp3d:FMA24440 | Piramidal izquierdo | skeletal:region:arm-left |
| bp3d:FMA24441 | Pisiforme derecho | skeletal:region:arm-right |
| bp3d:FMA24442 | Pisiforme izquierdo | skeletal:region:arm-left |
| bp3d:FMA24443 | Trapecio derecho | skeletal:region:arm-right |
| bp3d:FMA24444 | Trapecio izquierdo | skeletal:region:arm-left |
| bp3d:FMA24445 | Trapezoide izquierdo | skeletal:region:arm-left |
| bp3d:FMA24446 | Hueso grande derecho | skeletal:region:arm-right |
| bp3d:FMA24447 | Hueso grande izquierdo | skeletal:region:arm-left |
| bp3d:FMA24448 | Ganchoso derecho | skeletal:region:arm-right |
| bp3d:FMA24449 | Ganchoso izquierdo | skeletal:region:arm-left |
| bp3d:FMA24450 | Falange proximal del pulgar derecho | skeletal:region:arm-right |
| bp3d:FMA24451 | Falange proximal del índice derecho | skeletal:region:arm-right |
| bp3d:FMA24452 | Falange proximal del medio derecho | skeletal:region:arm-right |
| bp3d:FMA24453 | Falange proximal del anular derecho | skeletal:region:arm-right |
| bp3d:FMA24454 | Falange proximal del meñique derecho | skeletal:region:arm-right |
| bp3d:FMA24455 | Falange media del índice derecho | skeletal:region:arm-right |
| bp3d:FMA24456 | Falange media del medio derecho | skeletal:region:arm-right |
| bp3d:FMA24457 | Falange media del anular derecho | skeletal:region:arm-right |
| bp3d:FMA24458 | Falange media del meñique derecho | skeletal:region:arm-right |
| bp3d:FMA24459 | Falange distal del pulgar derecho | skeletal:region:arm-right |
| bp3d:FMA24460 | Falange distal del índice derecho | skeletal:region:arm-right |
| bp3d:FMA24461 | Falange distal del medio derecho | skeletal:region:arm-right |
| bp3d:FMA24462 | Falange distal del anular derecho | skeletal:region:arm-right |
| bp3d:FMA24463 | Falange distal del meñique derecho | skeletal:region:arm-right |
| bp3d:FMA24464 | Metacarpiano 1 derecho | skeletal:region:arm-right |
| bp3d:FMA24465 | Metacarpiano 1 izquierdo | skeletal:region:arm-left |
| bp3d:FMA24466 | Metacarpiano 2 derecho | skeletal:region:arm-right |
| bp3d:FMA24467 | Metacarpiano 2 izquierdo | skeletal:region:arm-left |
| bp3d:FMA24468 | Metacarpiano 3 derecho | skeletal:region:arm-right |
| bp3d:FMA24469 | Metacarpiano 3 izquierdo | skeletal:region:arm-left |
| bp3d:FMA24470 | Metacarpiano 4 derecho | skeletal:region:arm-right |
| bp3d:FMA24471 | Metacarpiano 4 izquierdo | skeletal:region:arm-left |
| bp3d:FMA24472 | Metacarpiano 5 derecho | skeletal:region:arm-right |
| bp3d:FMA24473 | Metacarpiano 5 izquierdo | skeletal:region:arm-left |
| bp3d:FMA24474 | Fémur derecho | skeletal:region:leg-right |
| bp3d:FMA24475 | Fémur izquierdo | skeletal:region:leg-left |
| bp3d:FMA24477 | Tibia derecha | skeletal:region:leg-right |
| bp3d:FMA24478 | Tibia izquierda | skeletal:region:leg-left |
| bp3d:FMA24480 | Peroné derecho | skeletal:region:leg-right |
| bp3d:FMA24481 | Peroné izquierdo | skeletal:region:leg-left |
| bp3d:FMA24482 | Astrágalo derecho | skeletal:region:leg-right |
| bp3d:FMA24483 | Astrágalo izquierdo | skeletal:region:leg-left |
| bp3d:FMA24486 | Rótula derecha | skeletal:region:leg-right |
| bp3d:FMA24487 | Rótula izquierda | skeletal:region:leg-left |
| bp3d:FMA24497 | Calcáneo derecho | skeletal:region:leg-right |
| bp3d:FMA24498 | Calcáneo izquierdo | skeletal:region:leg-left |
| bp3d:FMA24500 | Navicular del pie derecho | skeletal:region:leg-right |
| bp3d:FMA24501 | Navicular del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA24507 | Metatarsiano 1 derecho | skeletal:region:leg-right |
| bp3d:FMA24508 | Metatarsiano 1 izquierdo | skeletal:region:leg-left |
| bp3d:FMA24509 | Metatarsiano 2 derecho | skeletal:region:leg-right |
| bp3d:FMA24510 | Metatarsiano 2 izquierdo | skeletal:region:leg-left |
| bp3d:FMA24511 | Metatarsiano 3 derecho | skeletal:region:leg-right |
| bp3d:FMA24512 | Metatarsiano 3 izquierdo | skeletal:region:leg-left |
| bp3d:FMA24513 | Metatarsiano 4 derecho | skeletal:region:leg-right |
| bp3d:FMA24514 | Metatarsiano 4 izquierdo | skeletal:region:leg-left |
| bp3d:FMA24515 | Metatarsiano 5 derecho | skeletal:region:leg-right |
| bp3d:FMA24516 | Metatarsiano 5 izquierdo | skeletal:region:leg-left |
| bp3d:FMA24521 | Cuneiforme medial derecho | skeletal:region:leg-right |
| bp3d:FMA24522 | Cuneiforme medial izquierdo | skeletal:region:leg-left |
| bp3d:FMA24523 | Cuneiforme intermedio derecho | skeletal:region:leg-right |
| bp3d:FMA24524 | Cuneiforme intermedio izquierdo | skeletal:region:leg-left |
| bp3d:FMA24525 | Cuneiforme lateral derecho | skeletal:region:leg-right |
| bp3d:FMA24526 | Cuneiforme lateral izquierdo | skeletal:region:leg-left |
| bp3d:FMA24528 | Cuboides derecho | skeletal:region:leg-right |
| bp3d:FMA24529 | Cuboides izquierdo | skeletal:region:leg-left |
| bp3d:FMA32634 | Falange proximal del dedo 2 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32635 | Falange proximal del dedo 2 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32636 | Falange proximal del dedo 3 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32637 | Falange proximal del dedo 3 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32638 | Falange proximal del dedo 4 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32639 | Falange proximal del dedo 4 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32640 | Falange proximal del dedo 5 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32641 | Falange proximal del dedo 5 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32642 | Falange media del dedo 2 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32643 | Falange media del dedo 2 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32644 | Falange media del dedo 3 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32645 | Falange media del dedo 3 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32646 | Falange media del dedo 4 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32647 | Falange media del dedo 4 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32650 | Falange distal del dedo 1 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32651 | Falange distal del dedo 1 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32652 | Falange distal del dedo 2 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32653 | Falange distal del dedo 2 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32654 | Falange distal del dedo 3 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32655 | Falange distal del dedo 3 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32656 | Falange distal del dedo 4 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32657 | Falange distal del dedo 4 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA32658 | Falange distal del dedo 5 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA32659 | Falange distal del dedo 5 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA43253 | Falange proximal del dedo 1 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA43254 | Falange proximal del dedo 1 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA52734 | Frontal | skeletal:region:skull |
| bp3d:FMA52735 | Occipital | skeletal:region:skull |
| bp3d:FMA52736 | Esfenoides | skeletal:region:skull |
| bp3d:FMA52738 | Temporal derecho | skeletal:region:skull |
| bp3d:FMA52739 | Temporal izquierdo | skeletal:region:skull |
| bp3d:FMA52740 | Etmoides | skeletal:region:skull |
| bp3d:FMA52748 | Mandíbula | skeletal:region:skull |
| bp3d:FMA52788 | Parietal derecho | skeletal:region:skull |
| bp3d:FMA52789 | Parietal izquierdo | skeletal:region:skull |
| bp3d:FMA52892 | Cigomático derecho | skeletal:region:skull |
| bp3d:FMA52893 | Cigomático izquierdo | skeletal:region:skull |
| bp3d:FMA53645 | Lagrimal derecho | skeletal:region:skull |
| bp3d:FMA53646 | Lagrimal izquierdo | skeletal:region:skull |
| bp3d:FMA53647 | Nasal derecho | skeletal:region:skull |
| bp3d:FMA53648 | Nasal izquierdo | skeletal:region:skull |
| bp3d:FMA53649 | Maxilar derecho | skeletal:region:skull |
| bp3d:FMA53650 | Maxilar izquierdo | skeletal:region:skull |
| bp3d:FMA53655 | Palatino derecho | skeletal:region:skull |
| bp3d:FMA53656 | Palatino izquierdo | skeletal:region:skull |
| bp3d:FMA54737 | Cornete nasal inferior derecho | skeletal:region:skull |
| bp3d:FMA54738 | Cornete nasal inferior izquierdo | skeletal:region:skull |
| bp3d:FMA65470 | Falange proximal del pulgar izquierdo | skeletal:region:arm-left |
| bp3d:FMA66791 | Falange proximal del meñique izquierdo | skeletal:region:arm-left |
| bp3d:FMA71908 | Falange proximal del medio izquierdo | skeletal:region:arm-left |
| bp3d:FMA71915 | Falange proximal del índice izquierdo | skeletal:region:arm-left |
| bp3d:FMA71916 | Falange proximal del anular izquierdo | skeletal:region:arm-left |
| bp3d:FMA230986 | Falange media del dedo 5 del pie derecho | skeletal:region:leg-right |
| bp3d:FMA230988 | Falange media del dedo 5 del pie izquierdo | skeletal:region:leg-left |
| bp3d:FMA52749 | Hueso hioides | skeletal:region:skull |
| bp3d:FMA45098:FJ3266 | Sesamoideo del pie izquierdo · FJ3266 | skeletal:region:leg-left |
| bp3d:FMA45098:FJ3270 | Sesamoideo del pie izquierdo · FJ3270 | skeletal:region:leg-left |
| bp3d:FMA45097:FJ3372 | Sesamoideo del pie derecho · FJ3372 | skeletal:region:leg-right |
| bp3d:FMA45097:FJ3376 | Sesamoideo del pie derecho · FJ3376 | skeletal:region:leg-right |
| bp3d:FMA7485 | Esternón | skeletal:region:thorax |

</details>

Evidencia: [public/models/anatomy/skeletal/catalog.json](../public/models/anatomy/skeletal/catalog.json), [public/models/anatomy/skeletal/source-manifest.json](../public/models/anatomy/skeletal/source-manifest.json), [docs/phase2-missing-bones.md](../docs/phase2-missing-bones.md) y [docs/phase2.1-registration.md](../docs/phase2.1-registration.md). HRA cóccix y OpenEar son recursos ya obtenidos históricamente; las matrices de registro finales siguen sin aprobarse.

## Sistema muscular

**152 unidades, 76 familias bilaterales, 52 componentes, 182 mallas, 18 módulos.** Los componentes de cabezas musculares no se cuentan como músculos completos adicionales.

| Región | Presencia verificada | Cobertura pendiente |
| --- | --- | --- |
| Cara / masticación | Sin músculos específicos integrados; platisma pertenece a cuello | Expresión facial y cuatro grupos masticatorios |
| Cuello | 20: SCM, platisma, tres escalenos, largo de cabeza, esplenio de cabeza, esternohioideo, milohioideo, genihioideo bilaterales | Supra/infrahioideos restantes, profundos/suboccipitales, extensores restantes |
| Hombro / brazo | 16: deltoides, bíceps, tríceps, braquial y cuatro músculos del manguito rotador por lado | Antebrazo y conexiones escapulares profundas descritas abajo; no marcar manguito ausente |
| Tórax / abdomen / espalda | 26: pectorales mayor/menor, serrato anterior, subclavio, oblicuo externo, trapecio, romboides mayor/menor, iliocostales lumbar/torácico, longísimo torácico, espinoso torácico, redondo mayor | Diafragma, intercostales, pared abdominal restante, dorsal ancho, cuadrado lumbar, multífidos y otros profundos |
| Antebrazo | 8: FCR, pronador redondo, ECR largo y supinador por lado | Flexores/extensores/pronador cuadrado/braquiorradial restantes |
| Mano | 12: abductor corto/oponente/aductor del pulgar; abductor, flexor corto y oponente del meñique, bilaterales | FPB, lumbricales, interóseos palmares/dorsales, palmar corto |
| Pelvis / glúteos | 8: tres glúteos y tensor de fascia lata por lado | Iliopsoas, rotadores profundos y suelo pélvico/periné |
| Muslo | 20: cuatro cuádriceps, sartorio, aductor largo, grácil, bíceps femoral, semitendinoso y semimembranoso por lado | Pectíneo y aductores corto/mayor/mínimo |
| Pierna | 12: tibiales anterior/posterior, fibulares largo/corto, gastrocnemio y sóleo por lado | Poplíteo, plantar, largos digitales/hallux y fibular tercero |
| Pie | 30: abductor hallux, FDB, abductor/flexor corto quinto, cuadrado plantar, EHB, cuatro lumbricales, tres interóseos plantares, flexor corto/aductor hallux por lado | EDB, interóseos dorsales y oponente quinto; variante/identidad por revisar |

Los lumbricales **del pie**, los interóseos **plantares** y varias familias intrínsecas que faltaban en documentos antiguos son PRESENTES hoy. Los de la mano y los dorsales del pie siguen pendientes. Piramidal abdominal y piriforme son estructuras distintas.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `muscular-diaphragm` — Diafragma | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 90.8 | FMA13295/FJ3131 nominal en BodyParts3D 4.0; no figura en el catálogo muscular. Gap prioritario adicional a los pendientes iniciales. |
| `muscular-face` — Musculatura de expresión facial | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | No integrada. Alcance: orbiculares oral/ocular, buccinador, risorio, cigomáticos, elevadores/depresores labiales, mentoniano, nasal, prócer y vientres occipitofrontales. No confundir platisma presente con cobertura facial completa. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-mastication` — Masetero, temporal y pterigoideos medial/lateral | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes bilateralmente; candidatos nominales en Z, pendientes de procedencia específica, registro y revisión de cabezas/partes. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-abdominal-wall` — Recto abdominal, oblicuo interno y transverso abdominal | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | El oblicuo externo está presente. Los tres grupos descritos no lo están; no sustituir músculo con una aponeurosis o línea alba nominal. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-latissimus` — Dorsal ancho | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausente bilateralmente; trapecio, romboides y redondo mayor presentes no cubren este músculo. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-quadratus` — Cuadrado lumbar | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausente bilateralmente; no confundir con cuadrado plantar, ya presente. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-pyramidalis` — Piramidal abdominal | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | No encontrado nominalmente en las tablas BP3D 4.0 examinadas. Es distinto del piriforme pelviano; variabilidad anatómica exige no sintetizarlo para cerrar una lista. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-multifidus` — Multífidos | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Iliocostales, longísimo torácico y espinoso torácico presentes no equivalen a multífidos. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-intercostals` — Intercostales externos, internos e íntimos | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | FMA9756/9757/9758 enlazan geometría agregada. Hace falta comprobar extensión, lado y espacios; no contar esos elementos como once pares individualizados. |
| `muscular-thorax-deep` — Transverso del tórax, serratos posteriores y musculatura segmentaria profunda | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Incluye semiespinoso torácico, elevadores costales, rotadores, interespinosos e intertransversos. Alcance familiar, no cada fascículo. |
| `muscular-neck` — Supra/infrahioideos y extensores cervicales restantes | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Faltan digástrico, estilohioideo, omohioideo, esternotiroideo, tirohioideo, elevador escapular y extensores cervicales adicionales. Esternohioideo, milohioideo, genihioideo, escalenos, largo de cabeza y esplenio de cabeza sí están. |
| `muscular-suboccipital` — Suboccipitales y largo del cuello | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Rectos posteriores mayor/menor y oblicuos superior/inferior de cabeza, largo del cuello y rectos anterior/lateral no integrados como músculos propios. |
| `muscular-forearm-flexors` — Flexores/pronadores y braquiorradial restantes | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Faltan FCU, FDS, FDP, FPL, palmar largo, pronador cuadrado y braquiorradial. FCR y pronador redondo presentes. |
| `muscular-forearm-extensors` — Extensores restantes y abductor largo del pulgar | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Faltan ECR corto, ECU, extensor de dedos, del meñique, del índice, EPB, EPL y APL; ECR largo y supinador presentes. |
| `muscular-fpb` — Flexor corto del pulgar | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | FMA nominal y cabeza superficial necesitan aclarar correspondencia; no deducir una cabeza profunda independiente ni incorporar duplicados whole/head. Condición: Resolver identidad del músculo y sus cabezas. |
| `muscular-hand-lumbricals` — Lumbricales de la mano | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Pendientes, a diferencia de los cuatro lumbricales de cada pie, ya integrados. La geometría fuente agrupada no prueba individualización 1–4. |
| `muscular-hand-interossei` — Interóseos palmares y dorsales de la mano | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausentes; requieren asignación anatómica individual fiable si la fuente ofrece una geometría agregada. |
| `muscular-palmaris-brevis` — Palmar corto | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | No encontrado en la metadata BP3D 4.0 consultada; fuente específica a confirmar. Condición: Identificar fuente y licencia. |
| `muscular-iliopsoas` — Psoas mayor e ilíaco | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | Ausentes, con candidatos nominales BP3D. No confundir continuidad funcional con un músculo único adicional en el conteo. |
| `muscular-hip-rotators` — Piriforme, obturadores, gemelos y cuadrado femoral | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | Glúteos mayor/medio/menor y tensor de fascia lata presentes. Faltan los rotadores profundos citados. |
| `muscular-thigh` — Pectíneo y aductores corto/mayor/mínimo | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Aductor largo, grácil, cuádriceps y principales isquiotibiales sí existen. Aductor mínimo puede ser porción, no asumir músculo independiente. |
| `muscular-leg` — Poplíteo, plantar y flexores/extensores largos de los dedos | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Faltan poplíteo, plantar, FDL, FHL, EDL, EHL y fibular tercero. Tibiales anterior/posterior, fibulares largo/corto, gastrocnemio y sóleo presentes. |
| `muscular-edb` — Extensor corto de los dedos del pie | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | EDB no integrado; extensor corto del hallux sí integrado. No confundirlos. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-foot-dorsal-interossei` — Interóseos dorsales del pie | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Ausentes; tres interóseos plantares y cuatro lumbricales de cada pie sí están presentes. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `muscular-opponens-foot` — Oponente del quinto dedo del pie | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | FMA86034/86035 y FJ1399/FJ1399M son oportunidad nominal; confirmar variante/independencia frente a flexor corto. No confundir con oponente del meñique de la mano presente. Condición: Revisar variante e identidad anatómica. |
| `muscular-pelvic-floor` — Suelo pélvico y músculos perineales | AUSENTE / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | No integrados: elevador del ano, coccígeo, transversos perineales, bulbospongioso e isquiocavernoso. Relación con genitales y continencia, sin duplicar uretra. Condición: Candidatos levator/coccígeo; cobertura perineal restante por verificar. |

Evidencia: [public/models/anatomy/muscular/catalog.json](../public/models/anatomy/muscular/catalog.json); selecciones [research/anatomy/torso-selection.json](../research/anatomy/torso-selection.json), [research/anatomy/limbs-selection.json](../research/anatomy/limbs-selection.json), [research/anatomy/head-neck-selection.json](../research/anatomy/head-neck-selection.json) y [research/anatomy/muscle-gaps-selection.json](../research/anatomy/muscle-gaps-selection.json). Se usó el catálogo vigente para resolver lo que ya había cambiado tras cada selección histórica.

## Sistema nervioso

**58 estructuras y 67 componentes con ocular; 131 mallas, siete módulos.** Sin ocular: 56 estructuras, 61 componentes y 125 mallas. El encéfalo incluye bulbo, puente, mesencéfalo, cerebelo y regiones corticales/subcorticales disponibles; no una parcellación completa. Hay giros frontales, temporales, parietales, occipitales, ínsula, cíngulo, hipocampos, cápsula interna, sustancia blanca, hipotálamo, habénula, túber cinéreo y colículos según los IDs detallados en el JSON.

Pares craneales: II y IV bilaterales PRESENTES; III PARCIAL por ramos superior/inferior; V PARCIAL por V1 y ramas orbitarias. I, VI, VII, VIII, IX, X, XI y XII no están integrados como nervios propios. Los ganglios ciliares sí están. El nervio óptico no implica un ojo completo.

Expansión periférica presente: 26 unidades bilaterales de 13 familias (axilar, musculocutáneo, mediano, cubital, dorsal escapular, femoral, tibial, fibular común/superficial/profundo, cutáneos femorales lateral/posterior e iliohipogástrico), más 12 componentes: tres troncos y cordón posterior del braquial, rama profunda cubital y ramas digitales dorsales radiales, por lado. Plexos lumbar y sacro son agrupaciones de cobertura parcial; no una geometría completa del plexo.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `nervous-spinal-cord` — Médula espinal | AUSENTE / A | HRA médula; REGISTERABLE | P2 / 75.2 | No integrada. FMA7647 en PARTOF remite a FJ1737, que ISA identifica como canal central (FMA78497): no aprobar como médula completa. FJ4426 de 4.3 requiere identidad/frame. HRA y Z ya estudiados no superaron el registro exigido. Condición: Registro/identidad del recurso aún no aprobados; Reevaluar fallo histórico de registro. |
| `nervous-spinal-roots` — Raíces espinales anteriores y posteriores | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes como geometría integrada; no inferir presencia por los nervios distales existentes. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-spinal-ganglia` — Ganglios sensitivos espinales | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Los ganglios ciliares presentes no cubren ganglios de raíz dorsal. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-cauda` — Cauda equina | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Candidata aplazada: evidencia histórica de penetración del canal óseo de aproximadamente 11,3 mm. Sin integración. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-brachial-roots` — Raíces C5–T1 del plexo braquial | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Los tres troncos y cordón posterior bilaterales sí están; raíces del plexo ausentes. Este gap no vuelve a contar raíces intradurales del gap espinal. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-brachial-divisions` — Divisiones del plexo braquial | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | No hay seis divisiones individualizadas por lado; candidato geométrico no equivale a continuidad validada. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-brachial-cords` — Cordones medial y lateral | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Cordón posterior integrado. Medial y lateral constan sin geometría candidata en la selección histórica fijada; no crear por interpolación. Condición: Identificar fuente y licencia. |
| `nervous-radial` — Trayecto principal del nervio radial | PARCIAL / A | Z-Anatomy; REGISTERABLE | P2 / 76 | PARCIAL: sólo ramas digitales dorsales radiales integradas, no el tronco completo. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-sciatic` — Nervio ciático | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausente. Ramas tibial y fibular común presentes no suplen el ciático. Registro regional histórico: penetración pélvica aproximadamente 6,4 mm; global aproximadamente 9,14 mm. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-obturator` — Nervio obturador | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausente, candidato aplazado con registro/recorrido anatómico no aprobados. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-lumbar-plexus` — Conexiones y ramos restantes del plexo lumbar | PARCIAL / A | Z-Anatomy; REGISTERABLE | P2 / 76 | PARCIAL: femoral, cutáneo femoral lateral e iliohipogástrico presentes; faltan conexiones y, entre otros, ilioinguinal/genitofemoral. Obturador se cuenta sólo en su gap. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-sacral-plexus` — Conexiones y ramos restantes del plexo sacro | PARCIAL / A | Z-Anatomy; REGISTERABLE | P2 / 76 | PARCIAL: tibial, fibulares y cutáneo femoral posterior presentes. Faltan red proximal, glúteos, pudendo y conexiones; ciático tiene gap propio. Glúteo inferior no disponible en la geometría fijada examinada. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-upper-branches` — Ramos periféricos restantes de miembro superior | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Suprascapular, torácico largo, cutáneos y ramas distales adicionales; no volver a marcar ausentes mediano/cubital/axilar/musculocutáneo/dorsal escapular ya integrados. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-lower-branches` — Safeno, plantares y ramos distales restantes | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Cobertura periférica regional; troncos tibial/fibulares no prueban toda la distribución plantar o cutánea. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-cranial-missing` — Pares craneales I, VI, VII, VIII, IX, X, XI y XII | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes del catálogo corporal como nervios propios. II y IV sí están. No extrapolar el encéfalo HRA del explorador antiguo al cuerpo integrado. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica; Revisar crédito específico de nervios craneales y forámenes. |
| `nervous-cranial-partial` — III y V: troncos/territorios restantes | PARCIAL / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | III representado por ramos superior/inferior. V por territorio V1 y ramos orbitarios; V2/V3 y tronco completo no integrados. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-brain-regions` — Cobertura cortical regional restante | PARCIAL / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | PARCIAL: giros y regiones disponibles, cerebelo y tronco no constituyen una parcellación cortical completa. La ausencia es de identidad regional separada, no de todo el volumen cerebral. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-deep-brain` — Tálamos y núcleos profundos restantes | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Hipotálamo, hipocampos, cápsula interna y componentes mesencefálicos sí presentes; tálamo, caudado, putamen y globo pálido no integrados. |
| `nervous-ventricles` — Sistema ventricular y circulación de LCR | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | No integrado como sistema de cavidades/plexos; canal nominal no equivale a toda la médula ni a todo el sistema ventricular. |
| `nervous-meninges` — Meninges craneales y espinales | AUSENTE / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | Sin capas meníngeas seleccionables; candidatos Z con alcance y licencia por revisar. Condición: Regiones de duramadre no acreditan tres capas meníngeas completas. |
| `nervous-autonomic` — Troncos, ganglios y plexos autónomos | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Red autónoma ausente salvo componentes orbitarios parciales; no duplicar los ganglios ciliares ya presentes. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `nervous-ear` — Oído externo/interno y componentes sensoriales | AUSENTE / B | OpenEar; REGISTERABLE | P2 / 67.6 | No hay atlas ótico corporal aparte de huesos temporales. Pabellón, tímpano, laberinto y cóclea son cobertura regional adicional; los tres huesecillos se cuentan en Óseo. Condición: Registro/identidad del recurso aún no aprobados; Licencia específica del oído Z: posible NC; preferir revisar OpenEar. |
| `nervous-micro` — Neuronas, sinapsis y microcircuitos | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Otro nivel de detalle; no exigirlo para evaluar cobertura de nervios o médula macroscópica. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/nervous/catalog.json](../public/models/anatomy/nervous/catalog.json), [research/anatomy/nervous-expansion-selection.json](../research/anatomy/nervous-expansion-selection.json), [research/anatomy/nervous-expansion-registration.json](../research/anatomy/nervous-expansion-registration.json) y [docs/phase4-expansion-registration.md](../docs/phase4-expansion-registration.md). La selección histórica tiene 108 candidatos, 38 aprobados y 70 aplazados; seis sin geometría en ese conjunto. Esto no se interpreta como 108 nervios completos distintos.

## Sistema cardiovascular

**110 estructuras, 30 componentes, 162 mallas y siete módulos.** Cobertura macroscópica amplia pero segmentaria: corazón, aorta/cavas y vasos mayores de cabeza/cuello, miembros superiores, tórax, abdomen, pelvis y miembros inferiores. El conjunto venoso contiene tributarias y venas profundas; no todas las redes regionales.

Corazón: cuatro cavidades, paredes auriculares, pared ventricular agregada; cuatro válvulas y once valvas/componentes (tricúspide 3, mitral 2, pulmonar 3, aórtica 3). Coronarias principales, descendente anterior, circunfleja, seno coronario y vena cardíaca mayor presentes. No atribuir automáticamente lados anatómicos a cúspides de nomenclatura fuente ambigua. Las venas femorales profundas sí están: la ausencia histórica de profunda se refiere al territorio arterial pendiente.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `cardio-external-carotids` — Carótidas externas | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes; carótidas comunes e internas presentes. No inferir de una bifurcación visible una estructura seleccionable independiente. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `cardio-external-jugulars` — Yugulares externas | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausentes; sistema yugular interno y otros troncos presentes. Condición: Tributarias nominales no prueban yugular externa completa. |
| `cardio-profunda` — Arterias femorales profundas y ramas principales | AUSENTE / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | Las venas femorales profundas derecha/izquierda SÍ están; este gap es arterial. Condición: Sólo subdivisiones nominales de femoral profunda; verificar tronco y continuidad. |
| `cardio-fibular` — Arterias fibulares/peroneas | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Ausentes como ramas propias; tibiales presentes no equivalen a fibulares. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `cardio-septum` — Septos y paredes ventriculares individualizadas | PARCIAL / B | A investigar; UNKNOWN | P3 / 38.4 | PARCIAL: cuatro cavidades, paredes auriculares y pared ventricular agregada presentes. No hay septo propio ni paredes ventriculares derecha/izquierda seleccionables. No afirmar que el tejido septal no exista en absoluto en el agregado. Condición: Identificar fuente y licencia. |
| `cardio-coronary` — Ramas coronarias y venas cardíacas restantes | PARCIAL / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | PARCIAL: coronarias derecha/izquierda, descendente anterior, circunfleja, seno coronario y vena cardíaca mayor disponibles; no árbol coronario completo. |
| `cardio-internal-heart` — Músculos papilares, cuerdas tendinosas, conducción y pericardio | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Sin identidades integradas propias. Cuatro válvulas/once valvas disponibles; no renombrar automáticamente cúspides semilunares de identidad fuente ambigua. |
| `cardio-secondary` — Ramas arteriales/venosas regionales secundarias | PARCIAL / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Cobertura amplia pero segmentaria en cabeza, manos, vísceras, pelvis y pies; no todas las ramas colaterales, perforantes, arcos o tributarias. Excluye los gaps arteriales nombrados y vasos intrarrenales del propietario Urinario. Condición: Seleccionar y verificar IDs concretos por territorio antes de descargar. |
| `cardio-micro` — Microvasculatura y capilares | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Nivel microscópico separado; no es la razón para considerar parcial la macrovasculatura. Condición: Identificar fuente y licencia. |

Los capilares son nivel C; la cobertura macro se considera parcial por trayectos/ramas concretos, no por falta de capilares. Evidencia: [public/models/anatomy/cardiovascular/catalog.json](../public/models/anatomy/cardiovascular/catalog.json), [research/anatomy/cardiovascular-selection.json](../research/anatomy/cardiovascular-selection.json) y [docs/phase5-audit.md](../docs/phase5-audit.md).

## Sistema respiratorio

**Seis estructuras y 51 componentes, 128 mallas, tres módulos.** Estructuras: laringe de cartílagos disponibles, tráquea, dos bronquios principales y dos pulmones. Componentes: nueve cartílagos laríngeos, cinco lóbulos como padres/grupos de componentes, 20 árboles bronquiales segmentarios y 17 componentes parenquimatosos con 18 mallas. No se cuentan lóbulos editoriales como nuevos órganos ni árboles ramificados como un bronquio por triángulo.

La epiglotis SÍ está, junto a tiroides laríngeo, cricoides y pares aritenoideos, corniculados y cuneiformes. El bronquio principal derecho está explícitamente rotulado como porción disponible. La carina es región de la bifurcación, sin identidad propia separada: no afirmar ausencia total de bifurcación. Hilio es región de relaciones y no obliga a inventar una malla. Vasos pulmonares pertenecen a Cardiovascular. Diafragma se cuenta una sola vez en Muscular.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `resp-nasal` — Cavidad nasal y mucosa respiratoria | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Huesos nasales/cornetes óseos no constituyen la vía aérea mucosa completa. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `resp-sinuses` — Cavidades de senos paranasales | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Las paredes óseas visibles no proporcionan cavidades seleccionables ni mucosa. Condición: Identificar fuente y licencia. |
| `resp-pharynx` — Faringe: naso-, oro- y laringofaringe | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausente; gap único compartido con Digestivo, sin duplicarlo en el total. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica; Subdivisión de laringofaringe no completa las tres regiones. |
| `resp-larynx` — Laringe funcional: pliegues vocales, mucosa y músculos | PARCIAL / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | PARCIAL: nueve cartílagos, incluida epiglotis, sí presentes. Falta representación funcional de las partes blandas. |
| `resp-bronchi` — Continuidad de bronquios principales/lobares | PARCIAL / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | PARCIAL: derecho rotulado como porción disponible; carina reconocible en unión no es una malla propia. Grupos lobares y árboles segmentarios no prueban troncos lobares independientes completos. Condición: Inspeccionar continuidad e identidad; no duplicar bifurcaciones existentes. |
| `resp-pleura` — Pleuras parietal/visceral y cavidad pleural | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | No representadas como componentes. Candidato Z Pleura no prueba que ambas hojas estén individualizadas. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `resp-hilum` — Relaciones y detalle del hilio pulmonar | PARCIAL / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | PARCIAL: bronquios/vasos tienen geometría en sus sistemas; no hay componente hilar propio. Es principalmente un objetivo de cobertura regional y presentación, no exigir una falsa malla de un órgano nuevo. Condición: Definir si basta cobertura regional existente; no crear geometría artificial. |
| `resp-bronchioles` — Bronquiolos terminales/respiratorios | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | El árbol segmentario no representa la vía aérea microscópica. Condición: Identificar fuente y licencia. |
| `resp-alveoli` — Alvéolos y barrera alveolocapilar | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Módulo microscópico futuro; no es requisito para declarar presente el parénquima pulmonar macroscópico. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/respiratory/catalog.json](../public/models/anatomy/respiratory/catalog.json), [public/models/anatomy/respiratory/respiratory-registration.json](../public/models/anatomy/respiratory/respiratory-registration.json) y [docs/phase6-audit.md](../docs/phase6-audit.md). La cobertura de pulmones del explorador antiguo tiene otro alcance/frame y no se añade a estas cifras.

## Sistema digestivo

**23 estructuras, 17 componentes, 96 mallas y cuatro módulos.** Presentes: lengua; glándulas submandibulares/sublinguales bilaterales; esófago, estómago, duodeno, yeyuno/íleon con tres porciones cada uno; unión ileocecal parcial, apéndice; colon ascendente/transverso/descendente y recto; hígado, vesícula, páncreas y conducto pancreático disponible; conductos cístico y hepáticos común/derecho/izquierdo con tributarias.

No hay continuidad completa del tubo por faltar ciego completo, sigmoide y canal anal. Hepático común no es colédoco. El hígado está PRESENTE como agregado, pero ocho mallas no prueban ocho segmentos correctamente identificados: la contradicción de identidad VII/VIII sigue sin resolverse. Faringe se cuenta en Respiratorio con relación Digestivo.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `digestive-oral` — Cavidad oral completa y partes blandas | PARCIAL / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | PARCIAL: lengua y salivales submandibulares/sublinguales presentes; faltan mucosa, vestíbulo y límites blandos seleccionables. Dientes y músculos faciales tienen gaps separados. Condición: Paladar/úvula no completan cavidad oral. |
| `digestive-teeth` — Dentición | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | No hay dientes integrados. Tablas 4.0 ofrecen 28 FJ dentales nominales; no equivalen a dentición de 32 piezas ni se cuentan como huesos faltantes. |
| `digestive-parotids` — Parótidas | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes. 4.3 FJ4645/FJ4648 sin identidad FMA activa suficiente en el ensayo previo; Z tiene objetos nominales. No aprobar por nombre de archivo. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `digestive-cecum` — Ciego completo | PARCIAL / A | A investigar; UNKNOWN | P2 / 60.4 | PARCIAL: componente de unión ileocecal no equivale al ciego completo. Condición: Identificar fuente y licencia. |
| `digestive-sigmoid` — Colon sigmoide | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ascendente, transverso, descendente y recto presentes; el sigmoide no. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `digestive-anal` — Canal anal y esfínteres | AUSENTE / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | Recto presente no cubre canal anal ni complejo esfinteriano independiente. Condición: Sólo esfínter externo nominal; canal y esfínter interno no verificados. |
| `digestive-choledochus` — Colédoco | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Conductos cístico, hepático común, derecho e izquierdo están. Hepático común no es colédoco; no usar el texto educativo como prueba geométrica. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `digestive-liver-segments` — Segmentación hepática validada | PARCIAL / B | BP3D 4.3; UNKNOWN | P3 / 38.4 | PARCIAL: hígado agregado de ocho mallas presente. Contradicción VII/VIII (FJ2823) persiste en alternativas 4.0/4.3; no inventar etiquetas segmentarias. Condición: Validar identidad y frame de cada candidato 4.3; Resolver identidad segmentaria sin relabelado especulativo. |
| `digestive-regions` — Subdivisiones gástricas y pancreáticas independientes | PARCIAL / B | A investigar; UNKNOWN | P3 / 38.4 | PARCIAL: órganos y conducto pancreático disponibles, pero no todas las regiones anatómicas seleccionables. No duplicar geometría agregada. Condición: Identificar fuente y licencia. |
| `digestive-mesentery` — Mesenterio, mesocolon y epiplones | AUSENTE / A | BP3D 4.0; SAME FRAME | P2 / 87.8 | Fuentes nominales incluyen FJ3396/FJ3397/FJ3398 según auditoría histórica, fuera de integración; su representación debe revisarse por elemento. Condición: Mesenterios candidatos; epiplones completos no verificados. |
| `digestive-peritoneum` — Peritoneo y ligamentos viscerales restantes | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Sin membranas/ligamentos propios integrados; gap separado de mesenterios anteriores para evitar contar de nuevo sus hojas. |
| `digestive-salivary-ducts` — Conductos salivales | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Cuatro glándulas integradas no equivalen a conductos individualizados; parótidas como órganos se cuentan aparte. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `digestive-micro` — Capas histológicas, vellosidades y unidades glandulares digestivas | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Detalle microscópico separado; no subdividir artificialmente la superficie de los órganos. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/digestive/catalog.json](../public/models/anatomy/digestive/catalog.json), [research/anatomy/digestive-selection.json](../research/anatomy/digestive-selection.json), [docs/phase7-audit.md](../docs/phase7-audit.md) y [docs/phase7/alternative-source-audit.json](../docs/phase7/alternative-source-audit.json). No se recomiendan FJ2629/FJ2630/FJ2409 como órganos nuevos si duplican páncreas/hígado ya integrados.

## Sistema urinario

**Seis estructuras y seis mallas:** riñones, uréteres bilaterales, vejiga y uretra masculina. Macroórganos externos PRESENTES; anatomía interna renal AUSENTE como componentes seleccionables. Arterias/venas renales principales pertenecen a Cardiovascular y no se duplican.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `urinary-renal-parenchyma` — Corteza, médula, pirámides, columnas y papilas renales | AUSENTE / A | HRA biblioteca; UNKNOWN | P2 / 75.2 | Órganos completos presentes externamente, pero estas partes internas no tienen geometría propia. Son macroanatomía interna, no histología. HRA es candidato de órgano; subpartes exactas no se verificaron descargando modelos. Condición: Registro/identidad del recurso aún no aprobados; Confirmar subestructuras disponibles; excluir riñón Z con restricción NC sin revisión. |
| `urinary-collecting` — Cálices y pelvis renal | AUSENTE / A | HRA biblioteca; UNKNOWN | P2 / 75.2 | Ausentes como componentes diferenciados; uréteres presentes. Z tiene pelvis renal nominal, pero procedencia/licencia renal necesita revisión específica. Condición: Registro/identidad del recurso aún no aprobados; Confirmar alcance calicial y licencia renal concreta. |
| `urinary-vessels` — Vasos intrarrenales macroscópicos | AUSENTE / B | HRA biblioteca; UNKNOWN | P3 / 38.4 | Arterias/venas renales principales sí integradas en Cardiovascular. Faltan ramas segmentarias, interlobares y arcuatas como componentes internos; no duplicar troncos ni contar capilares aquí. Condición: Registro/identidad del recurso aún no aprobados; Revisar identidad, registro y licencia de la geometría renal. |
| `urinary-micro` — Nefronas, glomérulos y túbulos microscópicos | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Nivel C distinto de corteza, médula, pirámides, cálices y pelvis. Condición: Identificar fuente y licencia. |

No llamar «microanatomía» a corteza, médula, pirámides, cálices o pelvis: son objetivos macroscópicos. Nefronas/glomérulos sí son C. La licencia específica del riñón Z es una restricción real, no resuelta por la licencia general del proyecto. Evidencia: [public/models/anatomy/urinary/catalog.json](../public/models/anatomy/urinary/catalog.json) y [docs/phase8-audit.md](../docs/phase8-audit.md).

## Sistema endocrino

**Nueve estructuras, tres componentes y once mallas.** Hipófisis, pineal, suprarrenales derecha/izquierda, tiroides con lóbulos/istmo y cuatro paratiroides PRESENTES. Páncreas está en Digestivo y testículos en Reproductor: funciones endocrinas no exigen duplicar sus geometrías o cifras. Ovarios ausentes, clasificados en el proyecto femenino.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `endocrine-subdivisions` — Lóbulos hipofisarios y corteza/médula suprarrenal | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Glándulas presentes; subdivisiones macroscópicas no individualizadas. Tiroides con lóbulos/istmo y cuatro paratiroides sí están. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `endocrine-islets` — Islotes pancreáticos | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Páncreas presente y propiedad Digestivo; los islotes endocrinos no tienen geometría propia. No duplicar el órgano. Condición: Identificar fuente y licencia. |
| `endocrine-micro` — Folículos tiroideos, zonas celulares y tejido endocrino gonadal | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Glándulas y testículos macroscópicos presentes; tejido funcional microscópico ausente. Ovarios se cuentan únicamente en el proyecto femenino. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/endocrine/catalog.json](../public/models/anatomy/endocrine/catalog.json), [public/models/anatomy/internal/internal-registration.json](../public/models/anatomy/internal/internal-registration.json) y [docs/phase8-audit.md](../docs/phase8-audit.md).

## Sistema linfático / inmunitario

**Dos órganos, dos componentes y tres mallas:** bazo y timo (dos lóbulos). **Red linfática corporal AUSENTE**: los órganos no suplen ganglios, vasos, colectores o conductos. La biblioteca HRA incluye un ganglio de referencia, y Z algunas geometrías nominales; no son evidencia de una red completa ni de ganglios correctamente colocados en este cuerpo.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `lymphatic-nodes` — Ganglios linfáticos por cadenas regionales | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | Ausentes en el catálogo actual. Z contiene algunos objetos nominales reales y HRA un órgano de referencia; ninguno acredita automáticamente una red corporal completa. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `lymphatic-vessels` — Vasos y colectores linfáticos macroscópicos | AUSENTE / A | A investigar; UNKNOWN | P2 / 60.4 | Red ausente. No confundir linfáticos con venas o grupos editoriales; sin fuente corporal completa fiable identificada en esta revisión. Condición: Identificar fuente y licencia. |
| `lymphatic-thoracic-duct` — Conducto torácico | AUSENTE / A | A investigar; UNKNOWN | P2 / 60.4 | Ausente; investigar representación fiable con trayecto y drenaje, sin construir tubos aproximados. Condición: Identificar fuente y licencia. |
| `lymphatic-right-duct` — Conducto linfático derecho | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Ausente, no inferirlo de desembocadura venosa o de un ganglio. Condición: Identificar fuente y licencia. |
| `lymphatic-cisterna` — Cisterna del quilo | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Ausente; variante anatómica y continuidad ductal requieren evaluación. Condición: Identificar fuente y licencia. |
| `lymphatic-tonsils` — Amígdalas y tejido linfoide macroscópico faríngeo | AUSENTE / A | Z-Anatomy; REGISTERABLE | P2 / 76 | No integrado; Z aporta candidatas palatinas. No afirmar anillo faríngeo completo por dos amígdalas. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `lymphatic-micro` — Tejido linfoide microscópico, folículos y pulpa esplénica detallada | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Bazo y timo presentes como órganos; no hay histología ni toda la distribución de MALT. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/lymphatic/catalog.json](../public/models/anatomy/lymphatic/catalog.json), [research/anatomy/internal-selection.json](../research/anatomy/internal-selection.json) y [docs/phase8-audit.md](../docs/phase8-audit.md). No contar marcadores/agrupadores del archivo Blender como ganglios nuevos.

## Sistema reproductor

**Masculino: diez unidades, tres componentes, doce mallas.** Testículos, epidídimos, deferentes y vesículas seminales bilaterales; próstata y pene de cobertura parcial. Componentes peneanos: glande, esponjoso y cavernoso agregado, sin asignar automáticamente dos cuerpos cavernosos individualizados. La uretra masculina está PRESENTE bajo Urinario; no se vuelve a contar aquí.

**Femenino: cero estructuras integradas.** Ausente en el producto y fuera del alcance del donante masculino. HRA ofrece referencia femenina y órganos candidatos, pero no se ha demostrado un frame femenino compatible con el cuerpo BP3D actual. Se requiere un atlas separado, identidad/sexo/frame explícitos y evaluación conjunta de pelvis, tejidos y relaciones. No superponer una pelvis u órganos femeninos aislados sobre el varón para aparentar cobertura.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `reproductive-ejaculatory` — Conductos eyaculadores | AUSENTE / B | Z-Anatomy; REGISTERABLE | P2 / 57.6 | Deferentes, vesículas seminales y próstata presentes no suplen los conductos eyaculadores propios. Condición: Revisar licencia por objeto; Nuevo registro regional y validación anatómica. |
| `reproductive-bulbourethral` — Glándulas bulbouretrales | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Ausentes como órganos propios. Condición: Identificar fuente y licencia. |
| `reproductive-external` — Escroto y envolturas genitales | PARCIAL / A | A investigar; UNKNOWN | P2 / 60.4 | PARCIAL en cobertura externa: glande, esponjoso y cavernoso agregado presentes; sin escroto individual ni todas las cubiertas/prepucio seleccionables. Piel corporal no equivale a estructura escrotal separada. Condición: Identificar fuente y licencia. |
| `reproductive-female-internal` — Ovarios, trompas, útero, cuello uterino y vagina | AUSENTE / A | HRA femenino; INCOMPATIBLE / REQUIRES SEPARATE ATLAS | P2 / 70 | Ninguna estructura femenina integrada. Requiere atlas femenino/frame propio. HRA publica ovario, trompa y útero; continuidad cervical/vaginal exacta aún por verificar por asset. No overlay sobre el cuerpo masculino. Condición: Proyecto separado con referencia femenina propia. |
| `reproductive-female-external` — Genitales externos femeninos y glándulas mamarias | AUSENTE / A | HRA femenino; INCOMPATIBLE / REQUIRES SEPARATE ATLAS | P2 / 70 | Ausentes del producto, fuera del alcance del donante masculino. Biblioteca HRA femenina es punto de investigación, no confirmación de vulva/periné completos ni un frame ya registrado. Condición: Identificar cobertura específica fiable de genitales externos y mamas; Proyecto separado con referencia femenina propia. |
| `reproductive-micro` — Túbulos seminíferos, folículos ováricos y microanatomía reproductora | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Detalle microscópico futuro; tejido ovárico además exige proyecto femenino. Condición: Identificar fuente y licencia. |

Evidencia local: [public/models/anatomy/reproductive/catalog.json](../public/models/anatomy/reproductive/catalog.json), [docs/phase8-audit.md](../docs/phase8-audit.md) y referencia femenina histórica en [docs/phase2-missing-bones.md](../docs/phase2-missing-bones.md). Investigación externa de candidatos: [biblioteca oficial HRA](https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html); no se descargaron nuevos modelos femeninos.

## Sistema tegumentario

**Una estructura y una malla:** superficie corporal global FMA7163/FJ2810. Está PRESENTE como envolvente; regiones y capas tienen cobertura parcial/ausente. La auditoría histórica de skin distingue componentes geométricos conectados de componentes anatómicos: dos superficies grandes y fragmentos no prueban epidermis/dermis ni tejido subcutáneo.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `integumentary-regions` — Regiones de piel seleccionables | PARCIAL / B | HRA biblioteca; UNKNOWN | P3 / 38.4 | PARCIAL: una superficie corporal global. Sus componentes conectados no son regiones anatómicas. No dividir artificialmente malla para simular cobertura regional. Condición: Registro/identidad del recurso aún no aprobados. |
| `integumentary-subcutis` — Hipodermis/subcutáneo macroscópico | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | No hay capa subcutánea propia. La doble superficie de skin no demuestra epidermis/dermis/hipodermis ni permite renombrarla así. Condición: Identificar fuente y licencia. |
| `integumentary-hair` — Pelo como cobertura macroscópica | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | No integrado; metadata 4.0 incluye FJ2813 cabeza, FJ2815 pubis y FJ2812 facial. No confundir una inclusión editorial bajo epidermis con geometría de la capa epidérmica. |
| `integumentary-nails` — Uñas | AUSENTE / B | A investigar; UNKNOWN | P3 / 38.4 | Sin componentes ungueales seleccionables; distinto de falanges distales presentes. Condición: Identificar fuente y licencia. |
| `integumentary-layers` — Epidermis, dermis y estratos histológicos | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Ausentes como capas educativas diferenciadas. Esquema histológico futuro; superficie global no acredita estas capas. Condición: Identificar fuente y licencia. |
| `integumentary-glands` — Glándulas sudoríparas/sebáceas y folículos pilosos | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Microanatomía ausente; no igualar pelo superficial con folículos o glándulas. Condición: Identificar fuente y licencia. |

Evidencia: [public/models/anatomy/integumentary/catalog.json](../public/models/anatomy/integumentary/catalog.json), [public/models/anatomy/integumentary/integumentary-registration.json](../public/models/anatomy/integumentary/integumentary-registration.json), [docs/phase10/skin-interior-audit.json](../docs/phase10/skin-interior-audit.json) y [docs/phase10-audit.md](../docs/phase10-audit.md). No modificar ni cortar piel para crear regiones en esta auditoría.

## Cobertura ocular

Integrada mediante extensión de Nervioso; **dos ojos padres parciales, seis componentes y seis mallas** en un módulo. Lista exacta:

| ID vigente | Parte presente |
| --- | --- |
| ocular:FMA58239 | Córnea derecha |
| ocular:FMA58271 | Esclerótica derecha |
| ocular:FMA58236 | Iris derecho |
| ocular:FMA58240 | Córnea izquierda |
| ocular:FMA58272 | Esclerótica izquierda |
| ocular:FMA58237 | Iris izquierdo |

Los nervios ópticos derecho/izquierdo pertenecen al catálogo nervioso principal y ya están presentes, igual que IV y ramos oculomotores/orbitarios disponibles. No sumar de nuevo esos nervios al módulo ocular. No hay cristalino, retina, músculos extraoculares, cuerpo ciliar, coroides, vítreo/cámaras ni aparato lagrimal completos integrados.

| Gap documental | Estado / nivel | Fuente candidata preferida | Prioridad / puntuación | Hallazgo y límite |
| --- | --- | --- | --- | --- |
| `ocular-lens` — Cristalinos | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | Ausentes: FMA58242/FJ1356 derecho y FMA58243/FJ1305 izquierdo, candidatos nominales en el mismo release. |
| `ocular-retina` — Retina macroscópica | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | Ausente: porción óptica derecha FMA58607/FJ1367 e izquierda FMA58608/FJ1316. Esto no prueba todas las capas/circunferencia retinal. |
| `ocular-extraocular` — Músculos extraoculares y elevador del párpado superior | AUSENTE / A | BP3D 4.0; SAME FRAME | P1 / 87.8 | Cuatro rectos, dos oblicuos y elevador palpebral por lado tienen enlaces nominales 4.0; ninguno integrado. Propietario de la auditoría ocular, relacionado con Muscular, sin duplicar el gap. |
| `ocular-ciliary` — Cuerpo ciliar y zónula | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausentes. Fuente nominal de región ciliar y ligamento suspensor del cristalino; validar alcance, no asumir toda la estructura por un agregado. |
| `ocular-choroid` — Coroides | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausente: FMA58299/FJ1336+1337 derecha; FMA58300/FJ1285+1286 izquierda. No implica dos estructuras por lado. |
| `ocular-vitreous` — Cuerpo vítreo y cámaras oculares | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausentes. FMA58828/FJ1382 y FMA58829/FJ1331 vítreos; cámara anterior FJ1332/FJ1282. Comprobar cavidad frente a tejido; no prometer cámara posterior separada sin evidencia. |
| `ocular-lacrimal` — Aparato lagrimal y párpados | AUSENTE / B | BP3D 4.0; SAME FRAME | P2 / 70.8 | Ausentes como componentes completos; nervio lagrimal presente no es glándula lagrimal. FMA59102/FJ1350 y FMA59103/FJ1299 son candidatos de glándulas. |
| `ocular-micro` — Capas retinales y microanatomía ocular | AUSENTE / C | A investigar; UNKNOWN | PFUTURA / 34.6 | Separado de retina macroscópica, córnea, esclerótica e iris; no condición para completar un ojo macroscópico. Condición: Identificar fuente y licencia. |

Los candidatos nominales 4.0 con IDs/FJ están detallados en el JSON. Coroides y vítreo muestran oportunidades adicionales a las listas históricas, siempre sujetas a alcance y original. Evidencia: [public/models/anatomy/ocular/catalog.json](../public/models/anatomy/ocular/catalog.json), [research/anatomy/ocular-selection.json](../research/anatomy/ocular-selection.json), [research/anatomy/torso-metadata.zip](../research/anatomy/torso-metadata.zip) y [src/features/anatomy/atlas/ocular-catalog.ts](../src/features/anatomy/atlas/ocular-catalog.ts).

## Gaps Nivel A

**49 familias.** Prioridad anatómica antes de B/C. Incluye órganos grandes y trayectos esenciales, musculatura visible, anatomía renal interna, dentición y macropartes oculares. La prioridad de investigación de un gap esencial puede ser alta aunque su integración no esté habilitada por registro/licencia.

| Sistema | Familias A |
| --- | --- |
| Sistema óseo | Cóccix |
| Sistema tegumentario | — |
| Sistema muscular | Diafragma; Musculatura de expresión facial; Masetero, temporal y pterigoideos medial/lateral; Recto abdominal, oblicuo interno y transverso abdominal; Dorsal ancho; Cuadrado lumbar; Intercostales externos, internos e íntimos; Psoas mayor e ilíaco; Piriforme, obturadores, gemelos y cuadrado femoral; Suelo pélvico y músculos perineales |
| Sistema nervioso | Médula espinal; Raíces espinales anteriores y posteriores; Ganglios sensitivos espinales; Cauda equina; Raíces C5–T1 del plexo braquial; Trayecto principal del nervio radial; Nervio ciático; Nervio obturador; Conexiones y ramos restantes del plexo lumbar; Conexiones y ramos restantes del plexo sacro; Pares craneales I, VI, VII, VIII, IX, X, XI y XII; Meninges craneales y espinales; Troncos, ganglios y plexos autónomos; Cristalinos; Retina macroscópica; Músculos extraoculares y elevador del párpado superior |
| Sistema cardiovascular | Carótidas externas; Arterias femorales profundas y ramas principales |
| Sistema respiratorio | Cavidad nasal y mucosa respiratoria; Faringe: naso-, oro- y laringofaringe; Pleuras parietal/visceral y cavidad pleural |
| Sistema digestivo | Cavidad oral completa y partes blandas; Dentición; Parótidas; Ciego completo; Colon sigmoide; Canal anal y esfínteres; Colédoco; Mesenterio, mesocolon y epiplones |
| Sistema urinario | Corteza, médula, pirámides, columnas y papilas renales; Cálices y pelvis renal |
| Sistema endocrino | — |
| Sistema linfático / inmunitario | Ganglios linfáticos por cadenas regionales; Vasos y colectores linfáticos macroscópicos; Conducto torácico; Amígdalas y tejido linfoide macroscópico faríngeo |
| Sistema reproductor | Escroto y envolturas genitales; Ovarios, trompas, útero, cuello uterino y vagina; Genitales externos femeninos y glándulas mamarias |

## Gaps Nivel B

**57 familias.** Subdivisiones, ramas regionales, pequeños músculos/huesecillos, relaciones y tejidos articulares. Los seis huesecillos son seis posiciones, pero una familia bilateral en este recuento. Algunos gaps parciales (hilio, regiones cutáneas, regiones de órgano) necesitan primero decidir si el objetivo es identificación educativa o una geometría realmente ausente; no se prescribe segmentación artificial.

| Sistema | Número de familias B |
| --- | --- |
| Sistema óseo | 4 |
| Sistema tegumentario | 4 |
| Sistema muscular | 16 |
| Sistema nervioso | 13 |
| Sistema cardiovascular | 6 |
| Sistema respiratorio | 4 |
| Sistema digestivo | 4 |
| Sistema urinario | 1 |
| Sistema endocrino | 1 |
| Sistema linfático / inmunitario | 2 |
| Sistema reproductor | 2 |

La lista y alcance de todas las familias B figura en las tablas por sistema y en `gaps` del JSON; no se añaden grupos editoriales al total.

## Gaps Nivel C

**13 familias**, todas PRIORIDAD FUTURA. Propuesta de módulos educativos microscópicos independientes; no exigencia de esculpir células dentro del cuerpo actual.

| Sistema | Microanatomía / histología |
| --- | --- |
| Sistema nervioso | Neuronas, sinapsis y microcircuitos |
| Sistema cardiovascular | Microvasculatura y capilares |
| Sistema respiratorio | Bronquiolos terminales/respiratorios |
| Sistema respiratorio | Alvéolos y barrera alveolocapilar |
| Sistema digestivo | Capas histológicas, vellosidades y unidades glandulares digestivas |
| Sistema urinario | Nefronas, glomérulos y túbulos microscópicos |
| Sistema endocrino | Islotes pancreáticos |
| Sistema endocrino | Folículos tiroideos, zonas celulares y tejido endocrino gonadal |
| Sistema linfático / inmunitario | Tejido linfoide microscópico, folículos y pulpa esplénica detallada |
| Sistema reproductor | Túbulos seminíferos, folículos ováricos y microanatomía reproductora |
| Sistema tegumentario | Epidermis, dermis y estratos histológicos |
| Sistema tegumentario | Glándulas sudoríparas/sebáceas y folículos pilosos |
| Sistema nervioso / ocular | Capas retinales y microanatomía ocular |

## Fuentes candidatas

**Evidencia del repositorio.** Se revisaron los ZIP de originales/metadata existentes, source-locks, manifiestos y decisiones. Los 18 ZIP no son 18 fuentes nuevas: varios contienen subconjuntos del mismo release. La metadata de BP3D permite descubrir candidatos sin descargar el ZIP completo de geometría. La fuente Z completa y los GLB HRA espinales están sólo en caché histórica local; hashes comprobados, pero no se asume que existan en otro checkout. En cambio, cóccix HRA y PLY OpenEar están en el bundle versionado de candidatos.

| Fuente | Disponibilidad comprobada | Registro | Límite |
| --- | --- | --- | --- |
| BP3D 4.0 | Metadata y subconjuntos integrados descargados; no está descargado el archivo completo para todos los candidatos. | SAME FRAME | Un enlace FMA→FJ es evidencia nominal; falta comprobar el original, identidad, lateralidad y duplicados de cada incorporación. |
| BP3D 4.3 | Metadata y originales de pulmones/tiroides/paratiroides disponibles; otros candidatos por comprobar. | UNKNOWN | Compatibilidad nativa demostrada sólo para las incorporaciones y controles regionales aprobados; no para toda la versión. |
| Z-Anatomy | Fuente completa ya descargada en caché histórica, hash verificado; sólo subconjunto aprobado portable/versionado. | REGISTERABLE | REGISTERABLE significa candidato a un nuevo estudio, no registro aprobado. Riñón: Lissie Cowley, CC BY-NC 4.0; oído interno: Dundee, CC BY-NC-SA 4.0. No extender la licencia global a esos recursos. |
| HRA cóccix | Original descargado y versionado, sin integrar. | REGISTERABLE | Otro donante/frame; registro final a BodyParts3D inexistente. |
| OpenEar | Seis PLY de dos especímenes descargados y versionados. | REGISTERABLE | ZETA tiene indicio de lado derecho; EPSILON no tiene lateralidad validada. Dos especímenes no prueban seis posiciones bilaterales registrables. No reflejar para completar. |
| HRA médula | GLB y landmarks ya descargados en caché; hashes actuales coinciden con source-lock. | REGISTERABLE | Ensayo histórico no aprobado para integrar; no reutilizar el ajuste como solución. |
| HRA biblioteca | Biblioteca oficial conocida; estos candidatos nuevos no se descargaron en esta auditoría. | UNKNOWN | Existencia de riñón o ganglio no prueba todas sus subestructuras ni una red linfática corporal. No se inspeccionó su geometría nueva. |
| HRA femenino | Fuente oficial conocida, sin candidato femenino integrado ni nuevo modelo descargado. | INCOMPATIBLE / REQUIRES SEPARATE ATLAS | No hay frame femenino validado compatible con bodyparts3d-4.0-male. La lista publicada no acredita vagina/vulva/mamas completas ni su registro conjunto. |
| A investigar | No se identificó una representación fiable para el alcance exacto en las fuentes examinadas. | UNKNOWN | No encontrado en esta revisión no significa inexistente en todas las fuentes del mundo. |

Los estados por gap distinguen original ya descargado en bundle, original en caché, metadata conocida sin original descargado, y fuente no encontrada. `sourceSearch.bp40Evidence` distingue elementos integrados de elementos nominales adicionales; ni esa lista ni el inventario Z autorizan una incorporación. No se afirma que un archivo candidato contenga toda una familia por tener uno de sus miembros.

**Investigación externa**, realizada después del análisis local: [declaración DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), [portal BodyParts3D](https://lifesciencedb.jp/bp3d/info_en/license/index.html), [licencia Z fijada](https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/38649f4193adbe58e426ccac5670b8c4dde474ec/License.txt), [HRA](https://humanatlas.io/3d-reference-library), [biblioteca HRA publicada](https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html) y [OpenEar v2](https://zenodo.org/records/1473724). Sólo páginas/documentación; no modelos nuevos. HRA es una colección heterogénea: anunciar órgano masculino/femenino no garantiza mismo donante, ni todas las subdivisiones, ni compatibilidad con BP3D.

## Riesgos de registro

| Clase | Interpretación en esta auditoría |
| --- | --- |
| SAME FRAME | Candidato del release nativo BP3D 4.0; falta validar identidad, lateralidad, unidad y extensión del original. No equivale a permiso para integrarlo. |
| REGISTERABLE | Existe recurso y evidencia suficiente para estudiar correspondencias. No se asegura que un registro seguro sea posible ni que esté aprobado. |
| UNKNOWN | No hay evidencia específica suficiente del frame/identidad para el alcance candidato. |
| INCOMPATIBLE / REQUIRES SEPARATE ATLAS | Marco/sexo/donante exige proyecto separado; en particular referencia femenina frente al cuerpo masculino. |

No extrapolar transformaciones aprobadas. Los controles cervicales 4.3 no prueban abdomen 4.3. La expansión Z usó referencias óseas y ajustes regionales, aprobando sólo 38 objetos. Su ajuste global con 49 referencias tenía escala aproximada 0,996914; residuales regionales de referencia de aproximadamente 4,90 mm (superior) y 7,71 mm (inferior) no son certificados clínicos ni garantía de todos los tejidos.

Los rechazos históricos son evidencia concreta: ciático con penetración pélvica regional aproximada 6,4 mm; cauda equina alrededor de 11,3 mm; HRA médula con penetración aproximada 3,53 mm en C2 y ajuste global de RMS 7,08 mm / máximo 36,28 mm. Son mediciones históricas de ensayos específicos, no recalculadas aquí. Véase [docs/phase4-expansion-registration.md](../docs/phase4-expansion-registration.md) y [research/anatomy/nervous-expansion-registration.json](../research/anatomy/nervous-expansion-registration.json).

Cóccix necesita referencias sacro/pelvis del donante; OpenEar, lateralidad, unidad y registro temporal por espécimen. Convertir mm a m o LPS a otra base no registra dos anatomías. No usar mirroring como evidencia bilateral, escalar órganos a ojo, aceptar interpenetraciones para cerrar un conteo ni superponer un cuerpo femenino.

## Licencias

Las siguientes son condiciones documentadas de fuentes candidatas, no un dictamen de compatibilidad jurídica de un futuro derivado. Debe fijarse versión y licencia del objeto concreto antes de integrar.

| Fuente / autor | Licencia | Derivados / atribución / SA | Duda o restricción |
| --- | --- | --- | --- |
| BP3D 4.0 / Database Center for Life Science (DBCLS) | CC BY 4.0 (declaración vigente del archivo; headers históricos SA conservados) | Permitidos bajo las condiciones de atribución; conservar procedencia y cambios. BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International. Share-alike: no. | Un enlace FMA→FJ es evidencia nominal; falta comprobar el original, identidad, lateralidad y duplicados de cada incorporación. |
| BP3D 4.3 / DBCLS | CC BY-SA 2.1 Japan conservada en el repositorio | Permitidos bajo la licencia específica del recurso y sus obligaciones SA; no relicenciar automáticamente esta cohorte. DBCLS / BodyParts3D; indicar modificaciones y licencia aplicable. Share-alike: sí. | Compatibilidad nativa demostrada sólo para las incorporaciones y controles regionales aprobados; no para toda la versión. |
| Z-Anatomy / Gauthier Kervyn, Kousaku Okubo/BodyParts3D y colaboradores acreditados | CC BY-SA 4.0 general; excepciones por objeto | Candidatos generales sujetos a SA y a revisar la atribución y las excepciones de cada objeto. Conservar créditos de BodyParts3D, Z-Anatomy y autor específico. Share-alike: sí. | REGISTERABLE significa candidato a un nuevo estudio, no registro aprobado. Riñón: Lissie Cowley, CC BY-NC 4.0; oído interno: Dundee, CC BY-NC-SA 4.0. No extender la licencia global a esos recursos. |
| HRA cóccix / HRA / HuBMAP, NIH/NIAID y autores del asset | CC BY 4.0 verificada en metadata del asset | Permitidos con atribución, referencia a licencia e indicación de cambios. Conservar DOI, versión y todos los creadores de metadata.json; no atribuir genéricamente todos los órganos a Visible Human. Share-alike: no. | Otro donante/frame; registro final a BodyParts3D inexistente. |
| OpenEar / Daniel M. Sieber y coautores; MED-EL, Hannover, Hoersys, Copenhague | CC BY 4.0 según metadata institucional guardada | Permitidos con atribución y cambios declarados. Autores completos, OpenEar v2 y DOI 10.5281/zenodo.1473724. Share-alike: no. | ZETA tiene indicio de lado derecho; EPSILON no tiene lateralidad validada. Dos especímenes no prueban seis posiciones bilaterales registrables. No reflejar para completar. |
| HRA médula / HuBMAP/HRA y creadores del recurso NIH | CC BY 4.0 | Permitidos con atribución a creadores y versión. Usar el recurso fijado y sus autores; fuente commit f1a3a63f110e27ff0736047d52d04dba5d3087f9. Share-alike: no. | Ensayo histórico no aprobado para integrar; no reutilizar el ajuste como solución. |
| HRA biblioteca / HuBMAP/HRA, NIH/NIAID, Indiana University y colaboradores por asset | CC BY 4.0 de la biblioteca publicada; verificar metadata de la versión elegida | La biblioteca permite derivados con atribución; fijar asset/version/creadores antes de usarlos. Autores y DOI del objeto concreto. La colección combina donantes y fuentes diferentes. Share-alike: no. | Existencia de riñón o ganglio no prueba todas sus subestructuras ni una red linfática corporal. No se inspeccionó su geometría nueva. |
| HRA femenino / HuBMAP/HRA y creadores específicos | CC BY 4.0 de la biblioteca; fijar licencia y versión por recurso | Permitidos conforme a licencia específica y atribución. Autores, DOI y versión de cada órgano y del marco femenino. Share-alike: no. | No hay frame femenino validado compatible con bodyparts3d-4.0-male. La lista publicada no acredita vagina/vulva/mamas completas ni su registro conjunto. |

DBCLS publica actualmente CC BY 4.0; los headers antiguos SA se conservan como historia. La cohorte 4.3 del producto mantiene su declaración conservadora CC BY-SA 2.1 Japan; esta auditoría no la relicencia. [Fuentes oficiales DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html) y [portal BP3D](https://lifesciencedb.jp/bp3d/info_en/license/index.html).

Z tiene licencia general CC BY-SA 4.0, pero riñón de Lissie Cowley CC BY-NC 4.0 y oído interno Dundee CC BY-NC-SA 4.0; los créditos de nervios craneales/forámenes también deben preservarse según el recurso. **No tratar todo Z como una licencia uniforme.** [Licencia del commit fijado](https://raw.githubusercontent.com/Z-Anatomy/Models-of-human-anatomy/38649f4193adbe58e426ccac5670b8c4dde474ec/License.txt).

HRA publica la biblioteca bajo CC BY 4.0; conservar autores, DOI y versión por asset, no una atribución genérica incorrecta. La licencia del cóccix ya fue comprobada en metadata local. OpenEar v2 tiene `metadata.license.id=cc-by-4.0` en el registro institucional guardado; no confundir acceso restringido de otra versión con el recurso v2. [Biblioteca HRA](https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html), [OpenEar](https://zenodo.org/records/1473724) y [docs/phase2-missing-bones.md](../docs/phase2-missing-bones.md).

No conviene integrar recursos NC/ND o de licencia desconocida sin resolver el caso concreto, modelos cerrados como fuente principal, ni paquetes cuya licencia de código se use como sustituto de la licencia de las mallas. Los candidatos no encontrados quedan con `UNKNOWN`, no con una licencia supuesta.

## Priorización recomendada

Cada gap tiene ocho puntuaciones de 0 a 5 y un resultado de 0 a 100, reproducibles en el JSON. **5 siempre es favorable**: importancia, visibilidad, tamaño del hueco, disponibilidad de fuente, facilidad de registro, claridad de licencia, economía de integración y seguridad anatómica. En los dos últimos factores 5 significa coste bajo/riesgo bajo. Son juicios editoriales explícitos: no una escala clínica validada.

| Factor | Peso |
| --- | --- |
| anatomicalImportance | 22% |
| educationalVisibility | 18% |
| gapSize | 15% |
| reliableSourceAvailability | 12% |
| registrationEase | 10% |
| licenseClarity | 8% |
| integrationEconomy | 8% |
| anatomicalSafety | 7% |

Fórmula: `Σ(puntuación / 5 × peso)`, redondeada a un decimal. A precede a B y B a C. A con resultado ≥75 y sin condición extraordinaria pendiente: PRIORIDAD 1; ≥55: PRIORIDAD 2; resto: PRIORIDAD 3; C: PRIORIDAD FUTURA. Condiciones de licencia, registro o alcance limitan a P2, aunque el resultado numérico sea alto. Femenino es P2 estratégico y separado. Todo P1 todavía requiere la comprobación normal del original/identidad antes de ejecutar. Desempates por ID documental, no por una superioridad anatómica demostrada.

**Top 10 operativo de futuras evaluaciones** (primero P1 de A, después los mejores A condicionados; no autorización de integración):

| Orden | Gap | Puntuación | Prioridad | Condición principal |
| --- | --- | --- | --- | --- |
| 1 | Diafragma | 90.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 2 | Dentición | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 3 | Piriforme, obturadores, gemelos y cuadrado femoral | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 4 | Psoas mayor e ilíaco | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 5 | Intercostales externos, internos e íntimos | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 6 | Músculos extraoculares y elevador del párpado superior | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 7 | Cristalinos | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 8 | Retina macroscópica | 87.8 | PRIORIDAD 1 | Verificar original, identidad y cobertura del candidato nativo |
| 9 | Arterias femorales profundas y ramas principales | 87.8 | PRIORIDAD 2 | Sólo subdivisiones nominales de femoral profunda; verificar tronco y continuidad |
| 10 | Canal anal y esfínteres | 87.8 | PRIORIDAD 2 | Sólo esfínter externo nominal; canal y esfínter interno no verificados |

Varias oportunidades comparten puntuación por su perfil de evidencia; no interpretar el ordinal como precisión clínica. Los grandes huecos con registro difícil —médula, plexos, cara, linfático, renal y femenino— siguen siendo estratégicos, aunque no encabecen la lista de menor incertidumbre de integración.

**Matriz de frentes prioritarios**, incluidos expresamente los propuestos en la solicitud:

| Gap | Valor educativo | Fuente disponible | Registro | Licencia | Complejidad | Recomendación |
| --- | --- | --- | --- | --- | --- | --- |
| Diafragma | A; importancia 5/5 | BP3D 4.0; known-source-originals-not-downloaded | SAME FRAME | CC BY 4.0 (declaración vigente del archivo; headers históricos SA conservados) | Menor relativa | PRIORIDAD 1; Revisión de original e identidad |
| Médula espinal | A; importancia 5/5 | HRA médula; downloaded-historical-cache | REGISTERABLE | CC BY 4.0 | Alta / por estudiar | PRIORIDAD 2; Registro/identidad del recurso aún no aprobados; Reevaluar fallo histórico de registro |
| Raíces espinales anteriores y posteriores | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Nervio ciático | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Trayecto principal del nervio radial | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Nervio obturador | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Musculatura de expresión facial | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Masetero, temporal y pterigoideos medial/lateral | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Ganglios linfáticos por cadenas regionales | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Conducto torácico | A; importancia 5/5 | A investigar; not-found-in-audited-sources | UNKNOWN | UNKNOWN | Alta / por estudiar | PRIORIDAD 2; Identificar fuente y licencia |
| Cavidad nasal y mucosa respiratoria | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Faringe: naso-, oro- y laringofaringe | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica; Subdivisión de laringofaringe no completa las tres regiones |
| Pleuras parietal/visceral y cavidad pleural | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Colon sigmoide | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Colédoco | A; importancia 5/5 | Z-Anatomy; downloaded-historical-cache | REGISTERABLE | CC BY-SA 4.0 general; excepciones por objeto | Alta / por estudiar | PRIORIDAD 2; Revisar licencia por objeto; Nuevo registro regional y validación anatómica |
| Ciego completo | A; importancia 5/5 | A investigar; not-found-in-audited-sources | UNKNOWN | UNKNOWN | Alta / por estudiar | PRIORIDAD 2; Identificar fuente y licencia |
| Corteza, médula, pirámides, columnas y papilas renales | A; importancia 5/5 | HRA biblioteca; known-source-not-downloaded-for-this-gap | UNKNOWN | CC BY 4.0 de la biblioteca publicada; verificar metadata de la versión elegida | Alta / por estudiar | PRIORIDAD 2; Registro/identidad del recurso aún no aprobados; Confirmar subestructuras disponibles; excluir riñón Z con restricción NC sin revisión |
| Ovarios, trompas, útero, cuello uterino y vagina | A; importancia 5/5 | HRA femenino; known-source-not-downloaded-for-this-gap | INCOMPATIBLE / REQUIRES SEPARATE ATLAS | CC BY 4.0 de la biblioteca; fijar licencia y versión por recurso | Alta / por estudiar | PRIORIDAD 2; Proyecto separado con referencia femenina propia |
| Regiones de piel seleccionables | B; importancia 3/5 | HRA biblioteca; known-source-not-downloaded-for-this-gap | UNKNOWN | CC BY 4.0 de la biblioteca publicada; verificar metadata de la versión elegida | Alta / por estudiar | PRIORIDAD 3; Registro/identidad del recurso aún no aprobados |
| Hipodermis/subcutáneo macroscópico | B; importancia 3/5 | A investigar; not-found-in-audited-sources | UNKNOWN | UNKNOWN | Alta / por estudiar | PRIORIDAD 3; Identificar fuente y licencia |
| Cóccix | A; importancia 4/5 | HRA cóccix; downloaded-versioned | REGISTERABLE | CC BY 4.0 verificada en metadata del asset | Alta / por estudiar | PRIORIDAD 2; Registro/identidad del recurso aún no aprobados |
| Martillo, yunque y estribo de ambos lados | B; importancia 4/5 | OpenEar; downloaded-versioned | REGISTERABLE | CC BY 4.0 según metadata institucional guardada | Alta / por estudiar | PRIORIDAD 2; Registro/identidad del recurso aún no aprobados; Confirmar lateralidad de cada espécimen |
| Cristalinos | A; importancia 5/5 | BP3D 4.0; known-source-originals-not-downloaded | SAME FRAME | CC BY 4.0 (declaración vigente del archivo; headers históricos SA conservados) | Menor relativa | PRIORIDAD 1; Revisión de original e identidad |

**Qué no conviene integrar:** recursos de otro cuerpo con el ajuste de un subconjunto distinto; ciático/cauda/médula con fallos históricos no resueltos; riñón/oído Z bajo restricciones incompatibles o sin revisión; huesecillos reflejados como segunda lateralidad; VII/VIII hepáticos relabelados sin resolver fuente; fuente PARTOF que sólo remite a geometría ya existente; femenino sobre varón; duplicados de hioides, páncreas o hígado; microanatomía creada cortando mallas macroscópicas.

## Roadmap propuesto

1. **Cerrar identidad de candidatos nativos A.** Diafragma, dentición y musculatura/ocular BP3D 4.0. Fijar original, ID, lado, cobertura y duplicados; decidir alcance educativo sin modificar ahora el catálogo. Es el frente con menos incertidumbre de frame.
2. **Resolver macroanatomía pendiente con fuentes parciales.** Vía aérea alta, faringe/pleuras, continuidad digestiva, ramas vasculares esenciales y suelo pélvico. Determinar qué subparte aporta realmente cada fuente; evitar prometer toda una región a partir de una pieza.
3. **Investigación de registro dirigida.** Médula/raíces/plexos/ciático/radial/obturador, cara/masticación, cóccix y oído. Reexaminar ensayos rechazados; controles regionales, continuidad y distancias específicas antes de cualquier decisión. No extrapolar transformaciones.
4. **Órganos internos y linfático.** Confirmar subpartes renales con licencia utilizable; estudiar ganglios/cadenas y conductos por separado. Un órgano HRA no acredita una red corporal. Priorización A antes del detalle celular.
5. **Referencia femenina independiente.** Elegir donante/frame, catálogo y fuentes compatibles entre sí. Acordar cobertura de órganos internos, genitales externos, suelo pélvico y mamas. Sin overlay directo ni modificaciones del varón.
6. **Nivel B y luego C.** Completar músculos distales, ramas, capas macroscópicas, piel regional y pequeños componentes después de cerrar los gaps A elegidos. Histología/microanatomía en módulos educativos definidos, sin convertirla en requisito de un atlas macro.

Es una propuesta documental. Ningún paso se ha iniciado como fase de implementación; esta rama termina con el informe.

## Limitaciones de la auditoría

- Revisión exhaustiva del inventario **actual** y de los dominios pedidos, con familias de gaps acotadas. No constituye un inventario universal de cada variante, rama terminal o tejido humano. Los totales A/B/C dependen de las unidades documentales explícitas, no de una referencia anatómica universal contable.
- Los hashes, bytes, mallas, triángulos y vínculos se comprobaron de nuevo. Seleccionabilidad se verifica estructuralmente con catálogos/código; no se ejecutó una nueva batería de interacción gráfica ni validación clínica de superficies.
- Las validaciones y medidas históricas se leyeron como evidencia con su alcance original; no se presentan como pruebas repetidas hoy. No se ejecutaron `verify:anatomy`, build ni suites gráficas por rutina en una tarea documental.
- BP3D nominal, inventario Z y biblioteca HRA son niveles distintos de evidencia. No encontrado en tablas examinadas no significa que jamás exista en la fuente; candidato nominal no demuestra geometría completa, individualizada o utilizable.
- La caché histórica no es portable. Sus hashes y nombres relevantes quedan documentados; no se copia al repositorio ni se descarga otra vez para esta auditoría.
- Fuentes pueden compartir antecesores (Z/BodyParts3D), sin compartir coordenadas exactas, identidad de cada elemento ni licencia uniforme. No hay aceptación anatómica de nuevos registros ni asesoramiento jurídico de un futuro derivado.
- El diff autorizado contiene sólo `docs/anatomical-gaps-audit.md` y `docs/anatomical-gaps-audit.json`. Modelos, transforms, catálogos, IDs, fuentes educativas, loaders, Atlas, XR, About y documentos históricos permanecen intactos. La rama histórica `phase11-first-aid` no se utiliza ni modifica.

Validación documental: parseo del JSON, coherencia de recuentos/puntuaciones/IDs/rutas/hash de evidencia, comprobación del diff y `git diff --check`. Un único commit local; sin push, merge ni deploy.
