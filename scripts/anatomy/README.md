# Canal de importación ósea de MED3D

Este canal convierte la geometría científica publicada por BodyParts3D en módulos del atlas existente. No genera anatomía. El resultado versionado en `public/models/anatomy/skeletal` está listo para la aplicación; el despliegue normal no necesita descargar ni reconstruir la fuente.

## Reproducción

Requisitos: Python 3.10+ y Node 20.19+/22.12+. Las dependencias de conversión se pueden instalar fuera del paquete de la aplicación:

```sh
npm install --prefix .cache/anatomy-tools --save-exact @gltf-transform/core@4.5.0 @gltf-transform/extensions@4.5.0 @gltf-transform/functions@4.5.0 meshoptimizer@1.2.0
python scripts/anatomy/download-source.py --cache .cache/bodyparts3d-4.0
python scripts/anatomy/build-skeleton.py --source .cache/bodyparts3d-4.0/source
node scripts/anatomy/optimize-skeleton.mjs --tools-dir .cache/anatomy-tools
```

El primer paso de descarga obtiene el ZIP oficial de aproximadamente 143 MB y extrae exclusivamente los 206 OBJ seleccionados. La caché evita descargas posteriores. `source-lock.json` fija SHA-256 del ZIP, de cada OBJ y de los seis archivos de metadatos; una discrepancia detiene la importación para revisión. Nunca actualizar automáticamente los hashes para aceptar datos nuevos.

Si ya se dispone del subconjunto exacto, se puede ejecutar directamente `build-skeleton.py --source /ruta/al/subconjunto`. Se vuelven a comprobar todos sus hashes. Ejecutar siempre el conversor antes del optimizador: el optimizador rechaza volver a cuantizar un resultado que ya esté comprimido.

## Identidad y jerarquía

- Cada hueso usa el FMA original: por ejemplo, `bp3d:FMA24475` identifica el fémur izquierdo.
- La malla conserva un nombre único como `bp3d_FMA24475_FJ3259` y extras con el concepto, elemento y nodo del catálogo.
- Los cuatro sesamoideos comparten conceptos FMA por lado; su ID añade el elemento original para distinguirlos sin inventar nombres anatómicos más específicos.
- El esternón es un hueso padre con tres componentes originalmente identificados: manubrio, cuerpo y apófisis xifoides.
- Las regiones de navegación son editoriales. Las relaciones generadas se limitan a pertenencia jerárquica y homólogos bilaterales inequívocos. No se infieren articulaciones mediante proximidad.
- Los nombres españoles son editoriales; los originales ingleses y los FMA siguen siendo consultables. El término latino de una familia es un alias; no se presenta como una traducción lateralizada exacta cuando no se ha verificado.

## Coordenadas y conservación

Todos los OBJ comparten el marco de BodyParts3D 4.0. La fuente usa milímetros, Z superior, X positivo hacia el lado anatómico izquierdo y Y positivo posterior. La transformación es una única rotación rígida y escala: `(x,y,z) → (x,z,-y)/1000`. Produce metros, Y superior y Z anterior. No se centra cada hueso ni cada región. El cambio tiene determinante positivo y no refleja el cuerpo.

Se contrastaron los límites de fémures izquierdo/derecho, cabeza y pies para comprobar lado y eje superior. El tamaño total es aproximadamente 1,707 m. No mezclar directamente este marco con los órganos HRA previos: éstos tienen su propio marco y requieren un registro anatómico validado antes de superponerse.

Se conservan todos los triángulos de cada geometría distinta de la distribución OBJ99, que ya era una versión reducida por el proveedor. No se aplica decimación adicional, reconstrucción, `join`, `flatten` ni síntesis. Sólo se elimina `FJ2772`: sus líneas ordenadas de vértices, normales y caras son exactamente idénticas a `FJ3201` (hioides). Una aserción comprueba esa igualdad antes de eliminarlo; ambos hashes quedan documentados.

La conversión separa siete módulos: cráneo/hioides, columna, tórax y los cuatro miembros con sus cinturas. El material neutro es de visualización, no pretende representar la textura clínica del hueso. No hay texturas que justifiquen KTX2. Meshopt conserva los nodos y utiliza posiciones de 16 bits y normales de 12 bits.

## Verificación incorporada

`optimize-skeleton.mjs` vuelve a abrir cada GLB con el decodificador Meshopt y comprueba:

- correspondencia exacta de nombres entre entrada, salida y catálogo;
- un dueño único para cada malla;
- número de triángulos por elemento igual a la fuente;
- integridad de padre/hijos y referencias;
- desviación de los extremos de cada hueso inferior a 0,05 mm;
- coherencia entre cobertura y número de mallas.

`validation.json` contiene los resultados medidos. La desviación de extremos no es una distancia de Hausdorff ni una certificación clínica. El presupuesto de descarga es aproximadamente 3,92 MB de GLB, 205 mallas y 512.450 triángulos. El mayor módulo es menor de 1,2 MB.

## Cobertura honesta

Hay 199 huesos del recuento adulto convencional, más cuatro sesamoideos accesorios del pie: 203 estructuras y 205 mallas. Faltan un cóccix individualmente identificado y los seis huesecillos del oído. No convertir el número de mallas en una afirmación de «206 huesos completos».

La licencia actual publicada por DBCLS es CC BY 4.0 (declaración actualizada el 27 de febrero de 2025). Los comentarios heredados de los OBJ aún mencionan CC BY-SA 2.1 Japan; se conserva constancia y se cita la declaración vigente del editor. Ver `LICENSE.txt`, `catalog.json` y `source-manifest.json`.
