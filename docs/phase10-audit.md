# Fase 10 · auditoría acotada

Base `bd4756ff6c0a84427e2c0326c4e89815e690a5f1`. Los cinco problemas solicitados se abordaron: penetraciones nerviosas, músculos expuestos, identificación ocular, uso de piel con interior y coste de interacción. Se conserva la cobertura de once sistemas; [Fase 9](phase9-delivery.md) contiene el historial de la envoltura. No se reextraen ni reconstruyen activos históricos.

## Piel frente al interior

Se decodificaron en lectura 475 mallas musculares, nerviosas (incluidos los seis componentes oculares) y cardiovasculares. Se tomaron 32 centros de triángulo deterministas por malla: **15200 muestras**. Se compararon con intervalos anterior/posterior de la piel original FJ2810 en proyección XY. [Resultado completo](phase10/skin-interior-audit.json); scripts `audit-skin-interior.mjs` y `audit-skin-projection.py` bajo `scripts/anatomy/`.

| Sistema | Dentro del intervalo | Exceso >0,2 mm | Indeterminado |
|---|---:|---:|---:|
| Muscular | 5812 | 10 | 2 |
| Nervioso y extensión ocular | 3917 | 56 | 219 |
| Cardiovascular | 5172 | 3 | 9 |

Se exigen dos grupos de profundidad separados al menos 6 mm para establecer un intervalo corporal. Una lámina posterior detrás de una apertura orbital no basta. Los umbrales son filtros del método, **no tolerancias anatómicas**. El exceso proyectado no es distancia mínima a la piel ni error de registro en 3D. El muestreo no certifica contención de cada triángulo. Las aperturas y siluetas rasantes son indeterminadas.

| Hallazgo | Clasificación y decisión |
|---|---|
| Fibulares profundos R/L: máximos proyectados 30,08/28,69 mm; digitales dorsales radiales L/R: 23,46/19,90 mm | **D**, incongruencia residual del registro histórico Z-Anatomy respecto a la piel BP3D. Se conserva el registro; no se desplazan nervios individualmente. |
| Fibulares superficiales, cutáneos femorales laterales y posteriores | **D**; discrepancias proyectadas de hasta 12,33 mm en este muestreo. Explorar sin piel o a baja opacidad y aislar. |
| Gastrocnemio medial R/L: 9,97/6,61 mm; grácil R: 6,09 mm; platisma R/L: 3,56/3,31 mm; sartorio L: 2,55 mm; vasto lateral L: 1,28 mm | **A**, interpenetraciones entre geometrías nativas BP3D. No hay transformación nueva entre piel y esos músculos. Se mantienen formas originales. |
| Safenas magnas L/R: 1,67/1,18 mm; vena femoral R: 0,23 mm | **A**; algunas superficies vasculares alcanzan o cruzan la envoltura nativa. No se ocultan automáticamente para simular una cobertura perfecta. |
| Córneas L/R: 1,74/1,02 mm, con muchas muestras indeterminadas | **A**, borde de apertura palpebral y proyección insuficiente. No demuestra un ojo mal registrado; requiere lectura visual con sus coordenadas nativas. |
| Interior superpuesto al bajar opacidad | **B**, transparencia esperada de superficies dobles; no prueba penetración. |
| Orden de profundidad | **C** revisado: DoubleSide y depthTest; depthWrite activo a opacidad 1 y desactivado bajo 1. No se identificó un fallo de estos flags que explicase las salidas geométricas. Sin OIT. |
| Clic interior inesperado con piel opaca; dificultad para revelar selección interna | **E**, corregido con prioridad de piel opaca, paso de clic transparente, revelado a 25 % y acciones explícitas. |

El [registro nervioso anterior](phase4-expansion-registration.md) empleó escala uniforme global y ajuste rígido regional bilateral, no colocación individual de nervios. Sus RMS óseos históricos (4,902 mm miembro superior; 7,705 mm inferior) no son garantías de ajuste a piel ni validación clínica. Fase 10 no lo vuelve a calcular.

La revisión regional cubre cabeza, cuello, tórax, abdomen, pelvis, hombro, brazo, antebrazo, mano, muslo, pierna y pie. [Galería con observaciones](phase10/visual-review.md). Clasificar los defectos permite conservar trazabilidad; aislar piel mejora la lectura exterior ocultando explícitamente el resto, sin reparar geometría.

## Fuente ocular y alcance

Inventario previo: ojos corporales ausentes, nervios ópticos disponibles y exploradores independientes de corazón, pulmones y encéfalo; no existe explorador ocular HRA registrado. Se revisaron sólo identidades oculares nominales y PART-OF de BP3D 4.0. **Seis componentes aprobados**, dos agrupaciones de globo aprobadas como cobertura parcial, **cero candidatos geométricos descartados en esta selección acotada** y tres grupos aplazados: retina/interior ocular, anexos/músculos extraoculares y eventual explorador HRA ocular. No equivale a una auditoría exhaustiva de todas las estructuras del ojo.

[Tabla y procedencia](phase10-eye-review.md), [selección fuente](../research/anatomy/ocular-selection.json). La fuente principal y el marco corporal se conservan. Ninguna anatomía fue generada con IA ni mezclada con una nueva fuente externa.
