# Fase 7 — auditoría digestiva

**59 filas: 38 aprobadas, 8 descartadas y 13 aplazadas; 96 mallas seleccionadas.** Una fila es una unidad de selección, no necesariamente un órgano ni una malla. El catálogo resultante distingue **23 unidades estructurales y 17 componentes**, además de 10 nodos de organización. Los agregados de yeyuno e íleon reúnen sus porciones identificadas.

[Tabla completa con los 13 campos](phase7/audit.csv), [selección reproducible](../research/anatomy/digestive-selection.json), [auditor](../scripts/anatomy/audit-digestive.py). Se inspeccionaron primero los metadatos locales 4.0 y las referencias HRA/Z-Anatomy existentes; se seleccionaron candidatos digestivos antes de extraer OBJ. No se procesó el archivo corporal completo.

| Región | Cobertura incorporada | Ausencia o decisión |
|---|---|---|
| Oral | Lengua y cuatro glándulas: submandibulares/sublinguales bilaterales | Cavidad oral completa y parótidas pendientes. La lengua no estaba en ningún catálogo histórico; se incorpora una sola vez como estructura oral muscular. |
| Faringe/esófago | Esófago FMA7131/FJ2563 | No se equiparan epiglotis ni músculos a faringe completa; no se fabrica unión superior. |
| Estómago | FMA7148/FJ2564 | Sin cortar cardias, fundus, cuerpo, antro o píloro. |
| Delgado | Duodeno; yeyuno e íleon, cada uno con tres porciones fuente; unión ileocecal | Cada asa es una pieza de su porción, no un órgano. |
| Grueso | Apéndice, colon ascendente/transverso/descendente, recto | Ciego completo, sigmoide y canal anal independientes pendientes. |
| Hígado | Ocho piezas de parénquima bajo un único órgano FMA7197 | No se expone una segmentación I–VIII inconsistente. |
| Biliar | Vesícula, cístico, hepático común, hepáticos derecho/izquierdo y tributarias identificadas | Colédoco e hilio independientes pendientes. |
| Páncreas | FJ1895 y conducto FJ1896 | No duplicar FJ2629/FJ2630 ni fabricar cabeza/cuerpo/cola separados. |

Se resolvieron tres riesgos de interpretación antes de integrar: FJ2599 dice **Ileocecal junction / FMA11338** en su OBJ 4.0 aunque PART-OF lo incluye en ciego e íleon; FJ2409 es una revisión hepática antigua que solapa territorio de FJ2822; y la tabla 4.3 asigna VII a FJ2823 mientras su descarga todavía dice VIII/FMA15746, igual que FJ2824. Se conserva la identidad original por malla y el hígado agregado, sin inventar segmentos ni cambiar la fuente nativa. [Comparación oficial](phase7/alternative-source-audit.json).

El bazo queda fuera de Digestivo. Vasos y nervios mantienen sus sistemas; no se añaden músculos faríngeos, tenias aisladas ni diafragma. Mesenterios identificados quedan aplazados. Los padres son curados; la pertenencia hepática e intestinal usa PART-OF, no una conversión automática de IS-A.
