# Fase 10 · identificación ocular

Se integran **dos ojos con cobertura parcial: córnea, esclerótica e iris bilaterales**. Resuelven la ausencia de una estructura ocular reconocible y buscable. No representan un globo completo ni un sistema oftalmológico nuevo. Los nervios ópticos históricos se reutilizan como contexto; los exploradores de corazón, pulmones y encéfalo permanecen independientes.

| Componente aprobado | FMA | FJ | BP | Padre |
|---|---|---|---|---|
| Córnea derecha | FMA58239 | FJ1340 | BP6522 | ocular:FMA12514 |
| Esclerótica derecha | FMA58271 | FJ1368 | BP6519 | ocular:FMA12514 |
| Iris derecho | FMA58236 | FJ1348 | BP5519 | ocular:FMA12514 |
| Córnea izquierda | FMA58240 | FJ1289 | BP6523 | ocular:FMA12515 |
| Esclerótica izquierda | FMA58272 | FJ1317 | BP6520 | ocular:FMA12515 |
| Iris izquierdo | FMA58237 | FJ1297 | BP5520 | ocular:FMA12515 |

Los padres son FMA12514/BP7094 derecho y FMA12515/BP7110 izquierdo. La pertenencia se confirma en PART-OF, además de la identidad nominal IS-A. No se convierte IS-A automáticamente en pertenencia. [Auditoría reproducible](../scripts/anatomy/audit-ocular.py), [selección](../research/anatomy/ocular-selection.json), [archivo de seis OBJ originales](../research/anatomy/ocular-originals.zip) y [lock con hashes y rangos de descarga](../research/anatomy/ocular-source-lock.json).

Fuente: [DBCLS BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html), versión 4.0 OBJ99. Se aplica la [licencia institucional actual CC BY 4.0](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html), conservando intactos los encabezados históricos de los OBJ. Extracción limitada a seis entradas, con longitud, CRC e identidades verificadas; no se descargó/reconstruyó todo el atlas.

## Conservación geométrica

Frame `bodyparts3d-4.0-male`, transformación exacta `(x,y,z) → (x,z,-y)/1000`, sin registro adicional, centrado, escala por pieza, deformación, reflexión ni decimación. Posiciones Float32, Meshopt y normales a 12 bits. Módulo único `nervous:ocular`: **6 mallas, 50319 vértices, 94770 triángulos, 701656 bytes GLB**. Accessors decodificados: 1474362 bytes; arrays de geometría en runtime: 1575000 bytes. No equivalen a VRAM.

Todos los triángulos orientados, sus multiplicidades y posiciones fuente usadas se conservan. Error numérico máximo de posición `6.000460810908898e-8 m`; bounds `5.908966071999089e-8 m`. El eje X negativo corresponde al lado derecho. glTF comprimido y decodificado: cero errores y advertencias; el validador comprimido informa que no valida directamente la extensión Meshopt y se valida además su salida decodificada. [Conservación](../public/models/anatomy/ocular/ocular-validation.json), [manifest fuente](../public/models/anatomy/ocular/ocular-source-manifest.json), [glTF final](phase10/gltf-validation.json).

| Archivo | SHA-256 |
|---|---|
| Selección | `7eb7ad1a95eb89410426c6d7de7a772bb6138fb3f5245b929d1338e12cb46fcc` |
| OBJ originales ZIP | `a0e20a79bddeab8e681ca459e6fa63c02df7df20556abb71dc4aff20750c8a1e` |
| GLB | `dc09ce5988834e0751136ef0f04f1fdca08dedfa4fef13a866277ba2d95072b4` |

## Identificación y límites

Árbol “Ojos · cobertura disponible”; nombres “Ojo derecho/izquierdo · cobertura parcial”, latín *Bulbus oculi dexter/sinister*. Búsqueda por ojo, órbita, latín, FMA/FJ/ID; fichas de ojo y componentes; foco, aislamiento unilateral y contexto explícito orbital. El módulo se puede descargar y recuperar tras un fallo. Se puede seleccionar iris mediante raycast real.

Las nuevas fichas explican función y cobertura sin deducir fisiología de la geometría; referencias DBCLS y [OpenStax, percepción sensorial](https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception). No se reescriben fichas antiguas. La córnea es translúcida y el color del iris es esquemático.

Se aplazan retina, otras piezas internas y anexos. La apariencia pupilar puede resultar pálida por las superficies visibles en esta representación parcial; no se añadió un disco negro artificial ni se modificó geometría para simular un ojo fotográfico. Las aperturas palpebrales y solapes de piel se conservan. La inspección es técnica/educativa, **no validación clínica**. [Capturas 08 y 21–23](phase10/visual-review.md).
