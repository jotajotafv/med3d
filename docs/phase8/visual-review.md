# Fase 8 · revisión de las 35 capturas finales

Revisión efectuada el 30 de septiembre de 2026 sobre la galería definitiva de `312300bb8c047f28bfd442d073af54880953c77a`. La aplicación y los modelos corresponden a `180176698318941263a40c8da89f82c321e3456d`; el commit posterior sólo corrige el alcance del arnés de capturas. Se inspeccionaron las 35 imágenes en seis hojas de contacto y, además, las imágenes 23, 24 y 32 a resolución completa. [Registro de captura y estado](internal-captures.json), [hashes de las imágenes](capture-sha256.json).

Se revisaron orientación, lateralidad aparente, escala relativa, duplicación visible, encaje de contexto, recortes, transparencia, selección, árbol y panel de capas. No se observa una incompatibilidad espacial grave ni una pieza artificialmente recolocada. La comparación OBJ/GLB y los controles cervicales, documentados en [registro](../phase8-registration.md), sustentan la conservación geométrica; una captura por sí sola no prueba exactitud anatómica ni constituye validación clínica.

| Captura | Observación de revisión |
|---|---|
| [01 · Urinario anterior](01-urinario-anterior.png) | Dos riñones a distinta altura, uréteres, vejiga y uretra en el mismo marco. Sin inversión aparente. |
| [02 · Urinario posterior](02-urinario-posterior.png) | Cambio de orientación coherente con la vista anterior; no aparece geometría duplicada. |
| [03 · Riñones](03-rinones.png) | Se distinguen ambos contornos e hilios; se mantiene su diferencia de altura. |
| [04 · Uréter](04-ureter.png) | Trayecto nativo curvo y extremos originales visibles. No se fabricó continuidad. |
| [05 · Vejiga](05-vejiga.png) | Superficie de baja resolución y facetas visibles, conservadas del original. |
| [06 · Uretra](06-uretra.png) | Trayecto curvo completo en el encuadre; extremo superior próximo al selector de vista. |
| [07 · Endocrino global](07-endocrino-global.png) | Distribución craneal, cervical y abdominal coherente. Las glándulas craneales son pequeñas a esta escala. |
| [08 · Tiroides](08-tiroides.png) | Dos lóbulos y región del istmo visibles; superficie nativa irregular, sin suavizado geométrico añadido. |
| [09 · Paratiroides posteriores](09-paratiroides-posteriores.png) | Cuatro cuerpos glandulares distinguibles por detrás de la tiroides en la vista enfocada. |
| [10 · Hipófisis](10-hipofisis.png) | Cuerpo y prolongación superior visibles; el enfoque modifica la cámara, no su escala anatómica. |
| [11 · Suprarrenales](11-suprarrenales.png) | Ambas glándulas mantienen formas distintas; no se reflejó una para producir la otra. |
| [12 · Linfático disponible](12-linfatico-disponible.png) | Timo torácico y bazo abdominal; no se representa una red linfática inexistente. |
| [13 · Bazo](13-bazo.png) | Contorno y superficie medial distinguibles; facetas originales perceptibles. |
| [14 · Timo](14-timo.png) | Dos lóbulos identificables, con límite entre ellos. |
| [15 · Reproductor masculino](15-reproductor-masculino.png) | Órganos y conductos nativos en conjunto. La cobertura no incluye escroto ni todos los conductos. |
| [16 · Testículo](16-testiculo.png) | Órgano aislado visible; superficie facetada del original, sin anatomía interna añadida. |
| [17 · Próstata](17-prostata.png) | Volumen completo dentro del visor; geometría macroscópica simple conservada. |
| [18 · Componentes peneanos](18-pene-componentes.png) | Componentes disponibles visibles; no se interpreta esta malla como cobertura peneana exhaustiva. |
| [19 · Cuatro sistemas](19-cuatro-sistemas.png) | Sólo 32 mallas nuevas cargadas. El encuadre corporal conserva su escala relativa, por lo que el conjunto se ve pequeño. |
| [20 · Diez sistemas](20-diez-sistemas.png) | Cuerpo completo sin recorte grave; capas superficiales ocultan vísceras, como es esperable en una vista opaca. |
| [21 · Riñón seleccionado](21-rinon-seleccionado.png) | Resaltado cian y ficha coinciden. El enfoque recorta parte del riñón contralateral, no el órgano seleccionado. |
| [22 · Riñón aislado](22-rinon-aislado.png) | Se ve únicamente el riñón seleccionado; acción de restauración accesible. |
| [23 · Contexto renal](23-contexto-renal.png) | Riñón, vasos renales, uréter y suprarrenal ipsilaterales visibles; lista de contexto explícita y legible. |
| [24 · Contexto cervical](24-contexto-cervical.png) | Tiroides alrededor del contexto laríngeo/traqueal; transparencia permite leer la superposición. No se aprecia desplazamiento grave. |
| [25 · Despiece por regiones](25-exploded-regiones.png) | Separación regional moderada; los uréteres permanecen enteros. Sólo los cuatro sistemas nuevos. |
| [26 · Despiece por estructuras](26-exploded-estructuras.png) | Separación local acotada sin deformar las piezas. Sólo los cuatro sistemas nuevos. |
| [27 · Búsqueda global](27-busqueda-global.png) | La consulta renal reúne resultados vasculares y endocrinos; nombres, latín y sistema visibles. |
| [28 · Árbol global](28-arbol-global.png) | Diez ramas de sistema legibles; no aparecen ramas de fases de desarrollo. |
| [29 · Laptop 1366](29-laptop-capas.png) | Panel desplazado hasta los sistemas finales; controles y ficha de inspección accesibles. |
| [30 · Intermedio 1050](30-intermedio-capas.png) | Panel lateral abierto y acceso a inspección compacto; sin desbordamiento horizontal visible. |
| [31 · Tablet 900](31-tablet-capas.png) | Controles finales de capas y enlaces a órganos independientes visibles. |
| [32 · Móvil 390](32-movil-capas.png) | Panel superpuesto ocupa gran parte del visor, con cierre accesible. Toggles finales, opacidad y rótulos caben; el contenido inferior requiere scroll interno. |
| [33 · Transparencia 50 %](33-transparencia-50.png) | Reducción visible de opacidad manteniendo formas; glándulas pequeñas requieren enfoque. |
| [34 · Transparencia 25 %](34-transparencia-25.png) | Contraste menor, especialmente en conductos finos; no se observan superficies negras ni desaparición general del modelo. |
| [35 · Despiece por sistemas](35-exploded-sistemas.png) | Cuatro conjuntos separados y contenidos en el visor, conservando la forma de cada pieza. |

Limitaciones visibles: superficies gruesas en vejiga, testículo y próstata; contornos irregulares de la tiroides; oclusión de vísceras en el atlas completo opaco; glándulas y conductos poco legibles en un encuadre corporal amplio, especialmente al 25 %. Se utilizan enfoque, aislamiento y contexto para examinarlos. En móvil, el panel abierto cubre el modelo y se cierra para volver a explorarlo. Estas observaciones no justifican deformar originales ni reescribir el sistema de transparencia.

La galería definitiva sustituye el intento preliminar que cargó accidentalmente todos los sistemas en algunas vistas destinadas a los cuatro nuevos. No se presenta ese intento como validación final. Las seis vistas por muestra, la recuperación de módulos, el teclado y el retorno exacto del despiece a 0 % se comprueban en los registros funcionales; no se deducen únicamente de estas imágenes estáticas.
