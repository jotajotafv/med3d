# Fase 6 — entrega local

MED3D integra laringe cartilaginosa, tráquea, árboles bronquiales y ambos pulmones con cinco lóbulos en el marco corporal. Se conserva el explorador pulmonar HRA. **Cobertura respiratoria macroscópica disponible**, sin afirmar anatomía humana completa ni validación clínica.

[Auditoría](phase6-audit.md) · [Fuentes](phase6-sources.md) · [Registro](phase6-registration.md) · [Educación](phase6-education.md) · [Validación](phase6-validation.md) · [Rendimiento](phase6-performance.md) · [Revisión de capturas](phase6/visual-review.md).

| # | Entrega | Estado |
|---:|---|---|
| 1 | Rama | `phase6-respiratory` |
| 2 | SHA base | `d7f76fab25677b30952f057dfe900ee719dbac63` |
| 3 | Fuentes auditadas | BodyParts3D 4.0 IS-A/PART-OF, objetos oficiales 4.3 y pulmones HRA existentes. 68 candidatos: 49 aprobados, 6 descartados, 13 aplazados. |
| 4 | Fuentes utilizadas | 4.0 OBJ99: laringe/tráquea/bronquios. 4.3: sólo parénquima pulmonar. |
| 5 | Licencias | CC BY 4.0 en 4.0; CC BY-SA 2.1 Japan conservadora y explícita en el derivado pulmonar 4.3. HRA independiente CC BY 4.0. |
| 6 | Vías superiores | Laringe cartilaginosa disponible; cavidad nasal pendiente. |
| 7 | Faringe | Completa y subdivisiones pendientes, sin sustitutos geométricos ambiguos. |
| 8 | Laringe | Órgano con cobertura parcial, agrupando nueve cartílagos. |
| 9 | Epiglotis/cartílagos | Epiglotis, tiroides, cricoides y aritenoides/corniculados/cuneiformes bilaterales. |
| 10 | Tráquea | FMA7394/FJ2541; selección, aislamiento, búsqueda y enfoque. |
| 11 | Carina | Bifurcación disponible; sin malla independiente. |
| 12 | Principales | Derecho FMA68418/FJ2539, alias FMA7395; izquierdo FMA7396/FJ2450. |
| 13 | Bronquios lobares | Cinco grupos editoriales de árboles; sin afirmar troncos lobares aislados. |
| 14 | Ramas adicionales | 20 árboles segmentarios, 98 mallas originales. |
| 15 | Pulmón derecho | Parénquima de nueve identidades/piezas, tres lóbulos. |
| 16 | Pulmón izquierdo | Ocho identidades y nueve piezas, dos lóbulos; apicoposterior en dos FJ. |
| 17 | Lóbulos | Cinco agrupaciones de parénquima identificado; sin cortar mallas. |
| 18 | Pleura | Visceral y parietal pendientes. |
| 19 | Diafragma | Relación educativa muscular; geometría identificable evaluada y aplazada, sin duplicación respiratoria. |
| 20 | Vasos pulmonares | Contexto cardiovascular ipsilateral por IDs curados. |
| 21 | Explorador existente | HRA intacto e independiente: 58 mallas, 224.765 triángulos. |
| 22 | Pendientes | Cavidad nasal, faringe, tejidos laríngeos completos, carina independiente, troncos lobares aislados, pleuras, hilio adicional y microanatomía. |
| 23 | Unidades anatómicas | 49 identidades fuente. Catálogo: seis unidades de nivel estructura (laringe parcial, tráquea, dos principales y dos pulmones). |
| 24 | Componentes | 51 nodos componente, incluidos cinco lóbulos; no son 51 órganos. |
| 25 | Mallas nuevas | 128; sin FJ duplicados respecto de los catálogos históricos. |
| 26 | Triángulos nuevos | 212.484, íntegros respecto de los OBJ. |
| 27 | Bytes GLB nuevos | 2.330.012 bytes. |
| 28 | Módulos | `respiratory:larynx`, `respiratory:airway`, `respiratory:lungs`. |
| 29 | Hashes | Por GLB en registro; por OBJ en manifiesto/lock; originales ZIP SHA-256 `bd49ee1deffc725e895a741fbd89e6a880b472c3d5ff7be950faee10d369c693`. |
| 30 | Transformación | `(x,y,z) → (x,z,-y)/1000`; `bodyparts3d-4.0-male`. |
| 31 | Registro adicional | Ningún ajuste. Identidad entre revisiones, contrastada con control traqueal y revisión corporal. |
| 32 | Error geométrico | Máximo OBJ→GLB `6.006865020937111e-8 m`; preservados triángulos orientados y posiciones. glTF: 0 errores/advertencias. |
| 33 | Catálogo final | Cinco sistemas; 872 nodos, 41 módulos, sin cambios de IDs históricos. |
| 34 | Estructuras corporales | 527 estructuras y 802 mallas; 2.724.076 triángulos, 25.129.668 bytes GLB. |
| 35 | Búsqueda | Español, latín, alias, FMA, FJ e ID; órganos independientes conservados. |
| 36 | Árbol | Virtualizado, ancestros/expansión, teclado, ARIA y scroll comprobados. |
| 37 | Capas | Cinco sistemas con carga/descarga, opacidad y módulos independientes. |
| 38 | Transparencia | 100/75/50/25 %; DoubleSide/depthTest, depthWrite=false bajo 100 %. Sin OIT. |
| 39 | Selección | Raycast/hover reales y selección cian. |
| 40 | Aislamiento | Estructuras/componentes/grupos, ocultar/mostrar y restauración comprobados. |
| 41 | Contexto | Hioides/columna/caja torácica, bronquios, vasos pulmonares y corazón por relaciones explícitas. |
| 42 | Fichas | RespiratoryInformation con fuentes OpenStax, NLM/NCBI, NIH y DBCLS; sin fisiología inferida de mallas. |
| 43 | Exploded View | Cinco slots de sistema; región aérea coherente; principales con ramas ipsilaterales y lóbulos reales en Estructuras. 0 % exacto. |
| 44 | Cámara | Seis orientaciones; foco de laringe, tráquea/bifurcación, principales, ambos pulmones y contexto mediastínico sin clipping grave del objetivo. |
| 45 | Rendimiento | Ocho configuraciones SwiftShader: sólo respiratorio disponible en 204,7 ms; cinco sistemas en 1.808,8 ms en esta observación. Sin afirmación sobre hardware real. |
| 46 | Pruebas específicas | Catálogo/identidades/búsqueda/contexto/geometría; navegador regional y despiece correctivo PASS. |
| 47 | Regresión global | Una campaña de cierre PASS sobre implementación; tras corrección, sólo pruebas afectadas/recompilación y mediciones/capturas finales. SHA exactos documentados. |
| 48 | Capturas | 30 PNG nuevos con hashes e índice; no se repitieron capturas históricas. |
| 49 | Revisión visual | Todas revisadas; lateralidad, posición/escala, bifurcación, materiales, selección, oclusión, transparencia, árbol y responsive. |
| 50 | Bugs/omisiones corregidos | Principales unidos a tráquea en Estructuras: ahora dos bloques ipsilaterales. Evitadas falsas superficies pulmonares 4.0 y duplicación de cricoides; resumen del visor actualizado a cinco sistemas. |
| 51 | Limitaciones | Cobertura parcial, costuras/irregularidades fuente, oclusiones y transparencia estándar; revisión gramatical del latín editorial de algunos grupos bronquiales pendiente; registro no clínico; SwiftShader no es GPU física/móvil. |
| 52 | SHA código final | `d45999063b9c290c233f94f9f9a94c601288d32b`; implementación previa `8ef37e8baedad8e638dbee7f0af271e690888da2`. |
| 53 | SHA documental | Es el commit que incorpora este documento, hijo directo del código final; SHA literal en informe final y recibo externo del bundle para evitar autorreferencia circular. |
| 54 | Working tree | Debe quedar limpio después del commit documental y antes del bundle; comprobación definitiva en recibo externo. |
| 55 | main intacta | `main` y `origin/main`: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. |
| 56 | Ramas históricas | Primeros Auxilios, Fase 4, expansión nerviosa y Fase 5 intactas; SHA en protected-refs.json. |
| 57 | Push | No realizado. |
| 58 | Merge | No realizado; cero commits merge en el tramo de esta fase. |
| 59 | Bundle | `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase6.bundle`; historia/ref necesarias mediante `--all`, sin sobrescribir anteriores. |
| 60 | Tamaño bundle | Valor definitivo en informe final y `med3d-phase6.bundle.json`, calculado tras el commit documental. |
| 61 | SHA-256 bundle | Valor definitivo en ese recibo externo y en el informe final; comprobación `git bundle verify` posterior a la creación. |
| 62 | Conclusión | Fase 6 cerrada localmente para revisión: cobertura respiratoria macroscópica disponible, trazable y estable. Sin despliegue ni Fase 7. |
