# Fase 4 expandida: cierre local para revisión

La expansión queda cerrada localmente con **cobertura periférica parcial defendible**: brazos, pelvis y piernas se añaden al encéfalo y estructuras craneales existentes. El objetivo de una red continua con médula y plexos completos no se alcanza: esas ausencias están visibles y documentadas. Se preservó la anatomía previa y se continuó con los candidatos que superaron el registro, conforme a la autorización para completar cobertura parcial.

| Punto solicitado | Entrega |
|---|---|
| 1. Rama | `phase4-nervous-expansion` |
| 2. Base | `9d7c9389476f160af746fd40f6e0a2fa2793c56f` |
| 3. Fuentes investigadas | HRA/HuBMAP, Z-Anatomy y comprobación Open3DModel/CASK; antecedentes Open Anatomy/SPL, Visible Korean e IT'IS. [Fuentes](phase4-expansion-sources.md). |
| 4–5. Fuente usada / licencia | Sólo Z-Anatomy como segunda fuente; versión fijada, CC BY-SA 4.0, atribución y originales conservados; excepciones no comerciales excluidas. BP3D histórico intacto. |
| 6. Registro | Similitud global uniforme seguida de dos ajustes rígidos regionales bilaterales; sin deformación ni recolocación por nervio. |
| 7. Landmarks | 49 centros de bounds óseos; superficies homólogas etiquetadas; 10 huesos superiores y 12 inferiores en refinamiento. |
| 8. Matrices | Tres matrices reproducibles en [registro](phase4-expansion-registration.md) y JSON completo enlazado. Escala común 0.996913831900823. |
| 9–10. RMS / máximo | Superficie superior 4.902 / 18.617 mm, inferior 7.705 / 20.705 mm. Centros: superior RMS 11.322, máximo 15.777 mm; inferior RMS 14.401, máximo 19.106 mm. No precisión clínica. |
| 11. Médula | No integrada: HRA y Z-Anatomy mostraron incompatibilidad con canal/huesos tras los ajustes permitidos. |
| 12. Raíces / espinales | Pendientes, incluidos ganglios y cauda. |
| 13. Plexo braquial | Bilateral parcial: troncos superior, medio e inferior y fascículo posterior; raíces/divisiones pendientes. |
| 14. Miembro superior | Axilar, musculocutáneo, mediano y cubital bilaterales; tronco radial pendiente. |
| 15. Plexo lumbar/sacro | Grupos de ramas disponibles bilaterales; sin malla completa de plexo. |
| 16. Miembro inferior | Femoral, tibial, fibular común/superficial/profundo bilaterales; ciático/obturador pendientes. |
| 17. Otros | Dorsal de la escápula, cutáneos femorales lateral/posterior e iliohipogástrico; ramas profundas cubitales y digitales dorsales radiales como componentes. |
| 18. Inventario / pendientes | 108 candidatos: 38 aprobados, 0 descartados, 70 aplazados; seis ausentes en fuente. [Auditoría completa](../research/anatomy/nervous-expansion-selection.json). |
| 19–20. Nuevas unidades / componentes | 26 nervios (13 familias bilaterales) y 12 componentes; 14 grupos editoriales adicionales. |
| 21–24. Geometría / módulos | 38 mallas, 110 592 triángulos, 882 452 bytes GLB, cuatro módulos `nervous:upper-left/right` y `nervous:lower-left/right`; Float32 y Meshopt. |
| 25–26. Catálogo final | 650 nodos, 411 estructuras corporales, 512 mallas, 31 módulos. Nervioso: 56 estructuras, 61 componentes, 125 mallas, seis módulos. |
| 27–28. Búsqueda / árbol | Nuevos nombres/latín/alias/IDs; FMA/FJ históricos y órganos conservados. Virtualización, ARIA, teclado y ancestros verificados. |
| 29. Capas | Tres sistemas independientes, opacidad, descarga/recarga y recuperación tras fallo verificadas. |
| 30–31. Contexto / fichas | Asociaciones explícitas nervio–músculo–hueso; campos educativos nuevos y fuentes; fichas originales preservadas. |
| 32. Exploded View | Tres modos, bloques regionales de nervios largos, restauración exacta al 0 %. |
| 33. Rendimiento | Seis configuraciones; cuerpo completo 17 150 376 bytes GLB, 32 143 420 bytes buffers, carga completa observada 1 269.20 ms. SwiftShader, sin inferencia a GPU/móvil físico. [Tabla completa](phase4-expansion-performance.md). |
| 34. Pruebas específicas | Cuatro grupos unitarios nuevos, seis grupos de navegador regional, geometría y reproducción nativa/registro satisfactorias. |
| 35. Regresión final | Una ejecución global: typecheck, verify:anatomy, build, suite nerviosa original y siete grupos de navegador global. PASS. [Validación y logs](phase4-expansion-validation.md). |
| 36–37. Capturas / revisión | 26 nuevas, todas revisadas; inventario visual y límites en validación. No capturas de estructuras ausentes. |
| 38. Limitaciones | Red discontinua; sin médula, raíces, ciático ni radial completo; plexos parciales, nervios finos a escala corporal, fuente tubular/simétrica y registro entre cuerpos. Sin validación clínica. |
| 39. Commit de código probado | `e8eb75f2eebc68f4a06c88324d8bebf945ab4aa6` |
| 40. Commit documental | Este commit documental, separado y limitado a `docs/`; padre: commit de código anterior. Su SHA final se entrega en el informe de cierre. |
| 41. Working tree | Se exige limpio tras el commit documental; comprobación final en la entrega. |
| 42. main / origin/main | Se conservan en `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`. |
| 43. phase11-first-aid | Se conserva en `a391093cd28b975673fd0fc1e6b87fa1aeafed29`, sin reescribir sus commits. |
| 44. phase4-nervous-system | Se conserva en `9d7c9389476f160af746fd40f6e0a2fa2793c56f`. |
| 45–46. Publicación / integración | Sin push, merge, cherry-pick, despliegue ni Fase 5. Home, Procedimientos y Primeros Auxilios sin cambios. |
| 47. Bundle | `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase4-expanded.bundle`, generado después de este commit, sin sobrescribir `med3d-phase4.bundle`. |
| 48–49. Tamaño / SHA-256 | Se calculan después del commit documental y se entregan con `git bundle verify` en el informe final. No se incluyen dentro del propio bundle para evitar autorreferencia. |
| 50. Conclusión | Fase 4 expandida cerrada localmente para revisión con cobertura distribuida parcial, sin inventar anatomía ni forzar registro. No se inicia Fase 5. |

El commit de implementación contiene código, geometría, originales y trazabilidad. Este commit documental conserva cinco informes compactos, 26 PNG originales y evidencia nueva. Las pruebas anteriores al commit quedan vinculadas mediante [blobs y hashes](phase4-expansion/commit-binding.json); rendimiento y capturas se ejecutaron con el commit de implementación limpio.
