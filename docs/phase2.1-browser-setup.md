# Navegador de validación local — fase 2.1

## Resultado de la comprobación

Se descargaron desde el registro público de npm los paquetes `@sparticuz/chromium@153.0.0` y `@sparticuz/chromium@133.0.0`, fuera del repositorio y sin ejecutar scripts de instalación. No se modificaron dependencias de MED3D.

La descarga dejó de ser el obstáculo: ambos binarios se descomprimen y ejecutan `--version`. Las bibliotecas dinámicas del binario 153 están disponibles según `ldd`. Sin embargo, ambos terminan con `SIGTRAP` al abrir una página vacía, antes de producir una captura. Ocurre con Playwright 1.62.1 y también al invocar el binario directamente. Por tanto, **este entorno local no queda certificado para validación visual ni de rendimiento**.

Se observó además que el entorno no expone `/proc`, incluyendo `/proc/self/exe`, `/proc/self/maps` y `/proc/self/status`. Esto es una limitación relevante para Chromium, aunque no se ha demostrado que sea la causa única del fallo. No se intentó montar `/proc`, cambiar permisos del sistema ni modificar controles del entorno.

## Instalación aislada reproducible

El [repositorio oficial de Sparticuz](https://github.com/Sparticuz/chromium#usage-with-playwright) documenta el uso del ejecutable con Playwright. El paquete incluye Chromium y SwiftShader comprimidos; no necesita descargar el navegador desde el CDN de Playwright.

Desde un directorio de trabajo permitido, con Node 24:

```sh
mkdir -p phase21-browser/tmp phase21-browser/cache
TMPDIR="$PWD/phase21-browser/tmp" \
npm_config_cache="$PWD/phase21-browser/cache" \
npm install --prefix "$PWD/phase21-browser" \
  --ignore-scripts --no-audit --no-fund \
  @sparticuz/chromium@153.0.0
```

En un Linux convencional, `await chromium.executablePath()` descomprime los archivos necesarios. En este sistema de archivos, el extractor predeterminado falló al intentar conservar el propietario de entradas tar (`chown: EINVAL`). La siguiente extracción conserva el contenido, sin solicitar cambios de propietario ni modificar el paquete:

```js
// Ejecutar desde phase21-browser: node --input-type=module
import { createReadStream, createWriteStream } from 'node:fs';
import { chmod } from 'node:fs/promises';
import { createBrotliDecompress } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import tar from 'tar-fs';

for (const name of ['chromium.br', 'fonts.tar.br', 'swiftshader.tar.br']) {
  const source = `node_modules/@sparticuz/chromium/bin/${name}`;
  const target = name === 'chromium.br'
    ? createWriteStream('tmp/chromium')
    : tar.extract(name === 'swiftshader.tar.br' ? 'tmp' : 'tmp/fonts', {
        chown: false,
      });
  await pipeline(createReadStream(source), createBrotliDecompress(), target);
}
await chmod('tmp/chromium', 0o700);
```

Los argumentos ensayados para WebGL por software fueron:

```js
const args = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
];
```

También se comprobaron `--single-process` y `--no-zygote`, así como rutas locales de caché, configuración, perfil y fuentes. No corrigieron el fallo. No deben interpretarse como configuración validada para este entorno.

## Requisito pendiente para QA visual

Ejecutar la suite en un entorno que sí permita iniciar Chromium y WebGL, con servidor y navegador dentro de la misma sesión de red. Una ejecución satisfactoria debe guardar capturas reales, inspeccionarlas y registrar la versión del navegador y si utiliza SwiftShader o una GPU física. Las cifras de SwiftShader no representan rendimiento de GPU en dispositivos de usuario.

La instalación descrita aquí no produjo capturas de MED3D. Este documento registra el diagnóstico del entorno; no constituye una validación del producto.
