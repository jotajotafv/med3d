# Fase 8 · auditoría acotada

Base `beeed24e810dc69f23a4e71451241c4bf95139a7`. Consulta de metadatos 4.0/4.3 antes de extraer. No se reprocesó el atlas histórico.

**32 elementos APROBADOS, 24 entradas APLAZADAS y 3 decisiones DESCARTADAS.** Las entradas pendientes pueden agrupar candidatos; no son un recuento de órganos humanos ausentes. Selección completa, motivos e identidades: [internal-selection.json](../research/anatomy/internal-selection.json). Su SHA-256 fijado antes de extracción: `022c884c635d0f5ee980feb4c8392b435a4b1e1edf24de062e555ce3289cca6e`.

Motivo común de aprobación: identidad FMA/FJ explícita, pieza nativa y ausencia de duplicación. En los siete elementos cervicales 4.3, la aprobación de extracción exigía comprobar el marco antes de integrar; dos controles idénticos superaron esa condición. El manifiesto conserva los BP efectivamente entregados por el servidor; FJ3672 y FJ3673 tienen BP distintos del índice histórico consultado, con el mismo FMA/FJ y versión nativa 4.3. No se equipara BP histórico con un hash de geometría.

| Sistema | Nombre / latín | FMA / FJ | Fuente | Tipo / lado | Padre | Archivo | Decisión |
|---|---|---|---|---|---|---|---|
| urinary | Riñón derecho / Ren dexter | FMA7204 / FJ3147 | BP3D 4.0 | órgano / right | `uri:abdomen` | `FJ3147.obj` | APROBADO |
| urinary | Riñón izquierdo / Ren sinister | FMA7205 / FJ3145 | BP3D 4.0 | órgano / left | `uri:abdomen` | `FJ3145.obj` | APROBADO |
| urinary | Uréter derecho / Ureter dexter | FMA15571 / FJ3146 | BP3D 4.0 | conducto / right | `uri:abdomen-pelvis` | `FJ3146.obj` | APROBADO |
| urinary | Uréter izquierdo / Ureter sinister | FMA15572 / FJ3144 | BP3D 4.0 | conducto / left | `uri:abdomen-pelvis` | `FJ3144.obj` | APROBADO |
| urinary | Vejiga urinaria / Vesica urinaria | FMA15900 / FJ3149 | BP3D 4.0 | órgano / midline | `uri:pelvis` | `FJ3149.obj` | APROBADO |
| urinary | Uretra masculina disponible / Urethra masculina | FMA19667 / FJ3148 | BP3D 4.0 | conducto / midline | `uri:pelvis` | `FJ3148.obj` | APROBADO |
| endocrine | Glándula suprarrenal derecha / Glandula suprarenalis dextra | FMA15629 / FJ3130 | BP3D 4.0 | glándula / right | `endo:abdomen` | `FJ3130.obj` | APROBADO |
| endocrine | Glándula suprarrenal izquierda / Glandula suprarenalis sinistra | FMA15630 / FJ3129 | BP3D 4.0 | glándula / left | `endo:abdomen` | `FJ3129.obj` | APROBADO |
| endocrine | Hipófisis / Hypophysis | FMA13889 / FJ1796 | BP3D 4.0 | glándula / midline | `endo:head` | `FJ1796.obj` | APROBADO |
| endocrine | Glándula pineal / Glandula pinealis | FMA62033 / FJ1795 | BP3D 4.0 | glándula / midline | `endo:head` | `FJ1795.obj` | APROBADO |
| endocrine | Istmo de la glándula tiroides / Isthmus glandulae thyroideae | FMA49178 / FJ3670 | BP3D 4.3 | componente de órgano / midline | `endo:thyroid` | `FJ3670.obj` | APROBADO |
| endocrine | Lóbulo izquierdo de la tiroides / Lobus sinister glandulae thyroideae | FMA13369 / FJ3671 | BP3D 4.3 | componente de órgano / left | `endo:thyroid` | `FJ3671.obj` | APROBADO |
| endocrine | Lóbulo derecho de la tiroides / Lobus dexter glandulae thyroideae | FMA13368 / FJ3672 | BP3D 4.3 | componente de órgano / right | `endo:thyroid` | `FJ3672.obj` | APROBADO |
| endocrine | Paratiroides inferior izquierda / Glandula parathyroidea inferior sinistra | FMA55563 / FJ3673 | BP3D 4.3 | glándula / left | `endo:neck` | `FJ3673.obj` | APROBADO |
| endocrine | Paratiroides superior izquierda / Glandula parathyroidea superior sinistra | FMA55561 / FJ3674 | BP3D 4.3 | glándula / left | `endo:neck` | `FJ3674.obj` | APROBADO |
| endocrine | Paratiroides inferior derecha / Glandula parathyroidea inferior dextra | FMA55562 / FJ3675 | BP3D 4.3 | glándula / right | `endo:neck` | `FJ3675.obj` | APROBADO |
| endocrine | Paratiroides superior derecha / Glandula parathyroidea superior dextra | FMA55560 / FJ3676 | BP3D 4.3 | glándula / right | `endo:neck` | `FJ3676.obj` | APROBADO |
| lymphatic | Bazo / Splen | FMA7196 / FJ2561 | BP3D 4.0 | órgano / left | `lym:abdomen` | `FJ2561.obj` | APROBADO |
| lymphatic | Lóbulo derecho del timo / Lobus dexter thymi | FMA71194 / FJ3151 | BP3D 4.0 | componente de órgano / right | `lym:FMA9607` | `FJ3151.obj` | APROBADO |
| lymphatic | Lóbulo izquierdo del timo / Lobus sinister thymi | FMA71195 / FJ3150 | BP3D 4.0 | componente de órgano / left | `lym:FMA9607` | `FJ3150.obj` | APROBADO |
| reproductive | Testículo derecho / Testis dexter | FMA7211 / FJ3142 | BP3D 4.0 | órgano / right | `rep:pelvis` | `FJ3142.obj` | APROBADO |
| reproductive | Testículo izquierdo / Testis sinister | FMA7212 / FJ3138 | BP3D 4.0 | órgano / left | `rep:pelvis` | `FJ3138.obj` | APROBADO |
| reproductive | Epidídimo derecho / Epididymis dextra | FMA18256 / FJ3141 | BP3D 4.0 | órgano / right | `rep:pelvis` | `FJ3141.obj` | APROBADO |
| reproductive | Epidídimo izquierdo / Epididymis sinistra | FMA18257 / FJ3136 | BP3D 4.0 | órgano / left | `rep:pelvis` | `FJ3136.obj` | APROBADO |
| reproductive | Conducto deferente derecho / Ductus deferens dexter | FMA19235 / FJ3140 | BP3D 4.0 | conducto / right | `rep:pelvis` | `FJ3140.obj` | APROBADO |
| reproductive | Conducto deferente izquierdo / Ductus deferens sinister | FMA19236 / FJ3135 | BP3D 4.0 | conducto / left | `rep:pelvis` | `FJ3135.obj` | APROBADO |
| reproductive | Vesícula seminal derecha / Glandula vesiculosa dextra | FMA19387 / FJ3143 | BP3D 4.0 | glándula / right | `rep:pelvis` | `FJ3143.obj` | APROBADO |
| reproductive | Vesícula seminal izquierda / Glandula vesiculosa sinistra | FMA19388 / FJ3137 | BP3D 4.0 | glándula / left | `rep:pelvis` | `FJ3137.obj` | APROBADO |
| reproductive | Próstata / Prostata | FMA9600 / FJ3139 | BP3D 4.0 | glándula / midline | `rep:pelvis` | `FJ3139.obj` | APROBADO |
| reproductive | Glande del pene / Glans penis | FMA18247 / FJ3134 | BP3D 4.0 | componente de órgano / midline | `rep:penis` | `FJ3134.obj` | APROBADO |
| reproductive | Cuerpo esponjoso del pene / Corpus spongiosum penis | FMA19617 / FJ3133 | BP3D 4.0 | componente de órgano / midline | `rep:penis` | `FJ3133.obj` | APROBADO |
| reproductive | Cuerpo cavernoso del pene · representación fuente / Corpus cavernosum penis | FMA19618 / FJ3132 | BP3D 4.0 | componente de órgano / midline | `rep:penis` | `FJ3132.obj` | APROBADO |

La tiroides agrupa dos lóbulos y un istmo; el timo, dos lóbulos. Los tres componentes peneanos tienen un padre explícitamente parcial. No se convierte IS-A en PART-OF. El cuerpo cavernoso FJ3132 conserva una sola identidad sin fabricar laterales: `midline` es la clasificación técnica de esta representación sin lado asignado, no una afirmación de que los cuerpos cavernosos humanos sean un órgano impar. Los padres sin malla no añaden geometría. Total: 27 unidades estructurales, 8 componentes, 32 mallas.

| Sistema | Candidato | Decisión y motivo |
|---|---|---|
| urinary | Corteza y médula renal | APLAZADO: Sin geometría separada identificada en los metadatos activos 4.0/4.3; no fabricar microanatomía. |
| urinary | Pelvis renal | APLAZADO: Sin geometría separada identificada en los metadatos activos 4.0/4.3; no fabricar microanatomía. |
| urinary | Cálices renales | APLAZADO: Sin geometría separada identificada en los metadatos activos 4.0/4.3; no fabricar microanatomía. |
| endocrine | Islotes pancreáticos | APLAZADO: Sin representación macroscópica útil; el páncreas permanece exclusivamente en Digestivo. |
| lymphatic | Amígdalas | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios cervicales | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios axilares | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios mediastínicos | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios abdominales | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios pélvicos | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Ganglios inguinales | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Conducto torácico | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Cisterna del quilo | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Conducto linfático derecho | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| lymphatic | Vasos linfáticos principales | APLAZADO: Sin mallas activas identificadas en BodyParts3D 4.0/4.3. No construir una red ni extrapolar el registro regional de otra fuente. |
| reproductive | Conductos eyaculadores | APLAZADO: Sin representación inequívoca separada en los metadatos consultados. |
| reproductive | Glándulas bulbouretrales | APLAZADO: Sin representación inequívoca separada en los metadatos consultados. |
| reproductive | Escroto | APLAZADO: Sin representación inequívoca separada en los metadatos consultados. |
| reproductive | Ovarios | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| reproductive | Trompas uterinas | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| reproductive | Útero | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| reproductive | Cérvix | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| reproductive | Vagina | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| reproductive | Genitales externos femeninos | APLAZADO: Ausentes del cuerpo masculino BP3D. Reservado para futuro atlas femenino con marco documentado propio; no mezclar cuerpos. |
| endocrine | Hipófisis alternativa 4.3 | DESCARTADO: Identidad ya cubierta por FJ1796 de 4.0; no duplicar. |
| endocrine | Páncreas endocrino duplicado | DESCARTADO: Mantener propietario Digestivo y relación textual explícita; no copiar su GLB. |
| endocrine | Testículos duplicados en Endocrino | DESCARTADO: Único propietario Reproductor; función endocrina en ficha y contexto. |

La uretra tiene un único propietario Urinario; el páncreas continúa en Digestivo y los testículos en Reproductor. [Fuentes alternativas y decisión femenina](phase8-sources.md).
