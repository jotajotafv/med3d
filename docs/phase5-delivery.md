# Fase 5: entrega local

Cobertura cardiovascular macroscópica integrada disponible; no se afirma vasculatura humana completa. Se conservan las entregas históricas, sin repetir sus informes.

| Nº | Punto | Resultado |
|---:|---|---|
| 1 | Rama | `phase5-cardiovascular` |
| 2 | SHA base | `8d817bc09966e7e9e7f88a7e5e6aa82b78d252bd` |
| 3 | Fuentes auditadas | BodyParts3D 4.0; corazón HRA existente; inventario cardiovascular Z-Anatomy previo, sólo metadatos. |
| 4 | Fuentes utilizadas | BodyParts3D 4.0 OBJ99 para toda geometría cardiovascular nueva. HRA conserva su explorador independiente. |
| 5 | Licencias | BP3D: declaración actual CC BY 4.0, cabeceras históricas retenidas. HRA existente: CC BY 4.0. Z-Anatomy auditado: CC BY-SA 4.0, sin nueva extracción cardiovascular. [Detalle](phase5-sources.md). |
| 6 | Corazón corporal | Paredes, cavidades y valvas originales en el frame corporal; un corazón editorial, sin cortes inventados. |
| 7 | Relación con HRA | Explorador detallado intacto, 14 mallas / 164.119 triángulos; frame independiente, sin superposición corporal. |
| 8 | Cámaras cardíacas | Cuatro cavidades explícitamente identificadas como espacios; paredes auriculares separadas y pared ventricular conjunta. |
| 9 | Grandes vasos | Cuatro segmentos aórticos, tronco/arterias pulmonares, cuatro venas pulmonares y cavas. |
| 10 | Coronarias | Troncos derecho/izquierdo, interventricular anterior, circunfleja, seno coronario y vena cardíaca magna; cobertura parcial. |
| 11 | Arterias cabeza/cuello | Carótidas comunes/internas y vertebrales bilaterales. |
| 12 | Arterias miembros superiores | Subclavia, axilar, braquial/profunda, radial y cubital, bilateral. |
| 13 | Arterias tórax/abdomen | Aorta torácica/abdominal, celíaco, ramas digestivas seleccionadas, mesentéricas y renales. |
| 14 | Arterias pelvis | Ilíacas comunes, internas y externas. |
| 15 | Arterias miembros inferiores | Femoral, poplítea y tibiales anterior/posterior, bilateral. |
| 16 | Venas cabeza/cuello | Yugulares internas y continuidad braquiocefálica/subclavia. |
| 17 | Venas miembros superiores | Axilar, braquial medial, cefálica, basílica, radial, cubital y mediana antebraquial. |
| 18 | Sistema venoso central | Cavas, braquiocefálicas, ácigos, hemiácigos y accesoria. |
| 19 | Venas abdomen/pelvis | Hepáticas, porta, esplénica, mesentéricas, renales e ilíacas. |
| 20 | Venas miembros inferiores | Femoral/profunda, poplítea, safenas magna/menor y tibiales. |
| 21 | Pendientes | Carótidas externas, yugulares externas, troncos arteriales femorales profundos, fibulares, septo independiente y ramas secundarias/microvasculatura. Auditoría: 134 aprobadas, 1 descartada, 6 filas aplazadas. |
| 22 | Unidades anatómicas | 134 conceptos fuente en 92 familias; 110 estructuras de catálogo, incluidos corazón y aorta editoriales. |
| 23 | Componentes | 30: 26 fuente más cuatro grupos valvulares. No se cuentan como órganos completos. |
| 24 | Mallas | 162 nuevas; 674 corporales totales. |
| 25 | Triángulos | 685.016 nuevos; 2.511.592 corporales. |
| 26 | Bytes GLB | 5.649.280 nuevos; 22.799.656 corporales. |
| 27 | Módulos | 7 nuevos: corazón/coronarias, tronco, cabeza/cuello y cuatro extremidades; 38 corporales. |
| 28 | Fuentes y hashes | Originales ZIP 12.987.203 bytes, SHA-256 `8a4b8ef1e490ef64006c922506425a7d8b5ae38825555cd61bff6e08ae47754d`; hashes individuales en source-lock/manifest y GLB en catálogo. |
| 29 | Transformación BP3D | `(x,y,z) → (x,z,-y)/1000`; frame `bodyparts3d-4.0-male`, sin ajustes por pieza. |
| 30 | Registro de otras fuentes | Ninguno nuevo; no se modifican registros históricos. |
| 31 | RMS / máximo | RMS de registro no aplicable. Error numérico máximo Float32 `6,02076435869605 × 10⁻⁸ m`; no precisión clínica. |
| 32 | Catálogo final | Cuerpo humano → Óseo / Muscular / Nervioso / Cardiovascular → Corazón / Arterial / Venoso → regiones con contenido real. 805 nodos. |
| 33 | Total estructuras corporales | 521. IDs, catálogos y geometría históricos conservados. |
| 34 | Búsqueda | Español, latín, alias, FMA/FJ e IDs cardiovasculares; búsqueda conjunta de sistemas y órganos independientes. |
| 35 | Árbol | Virtualizado, selección/ancestros, ARIA, expansión y teclado comprobados. |
| 36 | Capas | Cuatro sistemas con activación, opacidad, módulos y carga/descarga independiente. |
| 37 | Subcapas | Arterias, venas y corazón dentro del mismo sistema cardiovascular. |
| 38 | Transparencia | Cardiovascular 100/50/25%; contexto óseo y muscular/nervioso atenuado. DoubleSide, depthTest, depthWrite=false bajo 100%. Sin OIT. |
| 39 | Selección | Raycast y hover reales; color cian diferenciado; enfoque y seis orientaciones. |
| 40 | Aislamiento | Por estructura o grupo; ocultar, mostrar y restaurar conservan identidad y geometría. |
| 41 | Contexto | Mappings explícitos vaso–hueso y coronaria–corazón; no inferencia por distancia. |
| 42 | Fichas | Campos vasculares y cardíacos propios, fuentes y límites de representación explícitos. |
| 43 | Exploded View | Cuatro sistemas deterministas; redes en bloques regionales; 0% vuelve a coordenadas exactas. Sin separación individual extrema de vasos. |
| 44 | Cámara | Corazón, arco, carótidas, hombro/brazo, abdomen/pelvis, femoral, rodilla y pierna comprobados; seis orientaciones cardíacas. |
| 45 | Rendimiento | Siete configuraciones SwiftShader. Cardiovascular: primera geometría 206.8 ms, disponibilidad 675.4 ms. Cuatro sistemas: 267.2 / 1726.7 ms. [Tabla completa](phase5-performance.md); sin afirmación sobre GPU física/móvil. |
| 46 | Pruebas específicas | Catálogo/IDs/ownership/fichas/búsqueda, geometría, raycast, capas/subcapas, contexto, opacidad, módulos/reintento, despiece y responsive. |
| 47 | Regresión global | Typecheck, verify:anatomy, ambas suites nerviosas, suite cardiovascular y build PASS. Navegador completado con continuación acotada por carrera del arnés en una ruta; fallo original retenido. [Evidencia](phase5-validation.md). |
| 48 | Capturas | 35 imágenes cardiovasculares nuevas del build final; [índice](phase5/visual-review.md). |
| 49 | Revisión visual | 35 revisadas: cobertura corporal, orientación/lado, contexto, selección, colores, transparencia, clipping, despiece y responsive. Sin validación clínica. |
| 50 | Bugs corregidos | Alias para ID estable y lados cardíacos nuevos; aorta alternativa excluida; fuente/cavidad/componentes distinguidos. Carrera del arnés histórico documentada y comprobación de rutas pendientes con espera visible, sin cambiar contenido. |
| 51 | Limitaciones | Cobertura parcial y segmentada, sin microvasculatura ni conexiones fabricadas; corazón BP3D menos detallado que HRA; oclusiones/transparencia estándar; nombres semilunares históricos; pruebas gráficas por software. |
| 52 | SHA código | `a2fbbb43182480c06be92a4c7d74e3a71ed51829` |
| 53 | SHA documental | Commit separado posterior a éste, sólo `docs/`, con padre igual al SHA de código. Su SHA definitivo consta en el informe final y recibo externo del bundle; no se incrusta un hash autorreferente. |
| 54 | Working tree | Se exige limpio después del commit documental y antes de crear el bundle; estado final en recibo externo. |
| 55 | main intacta | `main` y `origin/main`: `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. |
| 56 | phase11-first-aid intacta | `a391093cd28b975673fd0fc1e6b87fa1aeafed29`; sin cherry-pick ni modificación de sus commits. |
| 57 | phase4-nervous-system intacta | `9d7c9389476f160af746fd40f6e0a2fa2793c56f`. |
| 58 | phase4-nervous-expansion intacta | `8d817bc09966e7e9e7f88a7e5e6aa82b78d252bd`. |
| 59 | Sin push | No se ejecutó push; trabajo exclusivamente local. |
| 60 | Sin merge | No se ejecutó merge ni integración entre ramas protegidas. |
| 61 | Ruta bundle | `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase5.bundle`. |
| 62 | Tamaño bundle | Se calcula después del HEAD documental, sin sobrescribir respaldos. Valor en informe final y `med3d-phase5.bundle.json` junto al bundle. |
| 63 | SHA-256 bundle | Se calcula sobre el bundle final verificado; informe final y recibo externo. El bundle contiene toda la historia necesaria, sin prerrequisitos externos. |
| 64 | Conclusión | Fase 5 — Sistema Cardiovascular macroscópico disponible, cerrada localmente para revisión. Sin despliegue ni Fase 6. |

El recibo externo evita circularidad entre el SHA del commit documental, el bundle que lo contiene y su propio hash. La verificación final se realiza tras el commit y se informa al usuario; no se crea un commit adicional para insertar hashes autorreferentes. Los tres checkpoints son implementación, corrección del arnés de pruebas y documentación. La aplicación del primer checkpoint permanece idéntica en el segundo.
