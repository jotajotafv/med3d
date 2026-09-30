# Fase 8 · fuentes y licencias

| Fuente auditada | Uso y decisión |
|---|---|
| DBCLS BodyParts3D 4.0 OBJ99 | 25 OBJ integrados: urinario, glándulas craneales y suprarrenales, bazo/timo y reproductor masculino. Metadatos 4.0 históricos y directorio ZIP fijado; descarga selectiva por rangos HTTP. |
| DBCLS BodyParts3D 4.3 | 7 OBJ cervicales integrados: tres componentes tiroideos y cuatro paratiroides. Dos controles cervicales descargados sólo para comprobar el marco. Hipófisis alternativa descartada para evitar duplicación. |
| HRA/HuBMAP | Investigación de disponibilidad, sin extracción ni integración nueva. La biblioteca documenta cuerpos Visible Human masculino/femenino, ovarios, trompas, útero y órganos unidos femeninos; también ganglios de referencia. Son otro marco/cuerpo y no autorizan colocación directa en BP3D. |
| Z-Anatomy | Revisión del registro local de Fase 4 expandida. La aprobación fue regional y por nervio; sus ajustes óseos no validan automáticamente órganos viscerales ni una red linfática. No se extrae ni integra geometría nueva de esta fuente. |

BodyParts3D 4.0: atribución **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**, conforme a la [declaración oficial actual del archivo](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html). Los OBJ conservan el aviso histórico original; no se alteran sus bytes.

Para los siete OBJ 4.3 y `endocrine/thyroid43.glb` se conserva **CC BY-SA 2.1 Japan**, atribución DBCLS y la misma licencia para la adaptación geométrica, conforme al [portal 4.3](https://lifesciencedb.jp/bp3d/info_en/license/index.html). La procedencia por módulo distingue ambas versiones. Cada directorio nuevo incluye LICENSE.txt. Ningún binario HRA/Z-Anatomy nuevo se incorpora.

Fuentes oficiales de consulta: [archivo BodyParts3D](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html), [portal BP3D](https://lifesciencedb.jp/bp3d/), [biblioteca HRA y cuerpos de referencia](https://hubmapconsortium.github.io/ccf/pages/ccf-3d-reference-library.html). La consulta HRA es de disponibilidad, no una auditoría geométrica de sus modelos. El futuro atlas femenino deberá elegir y validar su propio marco; ovarios/trompas/útero disponibles no demuestran cobertura de cérvix, vagina o genitales externos individualizados.

Decisión: conservar el cuerpo masculino actual y documentar el atlas femenino como expansión futura. La ausencia de ganglios y conductos no obliga a mezclar fuentes ni bloquea esta entrega. Los límites del registro Z-Anatomy están en [Fase 4 expandida](phase4-expansion-registration.md); no se repite esa investigación.

Originales aprobados: [ZIP](../research/anatomy/internal-originals.zip). Índice, rangos y hashes: [lock](../research/anatomy/internal-source-lock.json). Controles y metadatos: [ZIP de metadatos](../research/anatomy/internal-metadata.zip).
