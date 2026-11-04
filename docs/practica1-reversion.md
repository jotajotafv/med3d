# Reversión de la Práctica 1: FilmPass y GlitchPass

Fecha de ejecución y validación: 4 de noviembre de 2026.

La Práctica 1 fue retirada de MED3D mediante un único `git revert`. La reversión se publicó en `main` y se comprobó en GitHub Pages. El atlas vuelve a su funcionamiento anterior, sin el panel de efectos ni postprocesamiento de FilmPass o GlitchPass, incluso al abrir una URL con `?practica1=1`.

## Referencias de Git

| Referencia | SHA |
| --- | --- |
| Estado original, antes de la práctica | `cac6e024b454c73e5623b99da7a7455abc1e3f9a` |
| Commit de la práctica, revertido | `465ad11c6759d5fef943d2f3dc6fc57ebbb0e144` |
| Commit de reversión | `7c671103206a6ce3b2dad2f05f74989b0368b5f9` |

- [Cambio de reversión en GitHub](https://github.com/jotajotafv/med3d/commit/7c671103206a6ce3b2dad2f05f74989b0368b5f9).
- Rama de respaldo conservada: `backup/practica1-before`, en el SHA original.
- Rama de práctica conservada: `practica1-film-glitch`, en el SHA de la práctica.
- La [guía histórica de la práctica](https://github.com/jotajotafv/med3d/blob/465ad11c6759d5fef943d2f3dc6fc57ebbb0e144/docs/practica1-film-glitch.md) sigue disponible en ese commit.

Antes de comenzar, el árbol de trabajo estaba limpio. Se actualizó `main` con `git fetch origin main` y `git merge --ff-only origin/main`; no existían commits posteriores a la práctica. Después se ejecutó `git revert --no-edit 465ad11c6759d5fef943d2f3dc6fc57ebbb0e144`, sin conflictos. No se utilizaron `git reset --hard` ni `git push --force`, y no se eliminaron ramas ni commits.

El árbol de archivos del commit de reversión es idéntico al del commit original. Ambos tienen el identificador de árbol `981b0f5f075833b513eb57f6f3a4f13f4bf2f39c`. Esta documentación se añade después de la reversión: registra el resultado sin cambiar el código de la aplicación. La igualdad completa del árbol corresponde a los dos commits indicados, no a los commits documentales posteriores.

## Archivos restaurados y eliminados

| Acción | Archivo |
| --- | --- |
| Restaurado | `src/features/anatomy/atlas/AtlasScene.tsx` |
| Eliminado | `src/features/anatomy/atlas/Practica1PostFX.tsx` |
| Eliminado | `src/features/anatomy/atlas/Practica1Panel.tsx` |
| Eliminado | `src/features/anatomy/atlas/practica1.css` |
| Eliminado | `scripts/practica1-qa.mjs` |
| Eliminado | `docs/practica1-film-glitch.md` |

`AtlasScene.tsx` recuperó su implementación anterior: se retiraron las importaciones, el estado de la práctica, la lectura de su parámetro URL y la integración del panel y del composer. `GizmoHelper` volvió a su configuración original y el Canvas mantiene `frameloop="demand"`.

Se conservaron modelos y assets GLB, fuentes educativas, fichas, selección, aislamiento, opacidad, despiece, cámaras, navegación, identidad visual, exploradores independientes, lógica XR, gestos, rutas y workflow de publicación. No se añadieron ni actualizaron dependencias.

## Verificaciones realizadas

Todas estas comprobaciones corresponden al commit de reversión `7c67110`:

| Comprobación | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto. |
| `npm run build` | Correcto; cuatro páginas estáticas y quince redirecciones. |
| `npm run verify:anatomy` | Correcto. |
| `npm run test:xr` | 193 aprobadas; ninguna fallida, cancelada u omitida. |
| `git diff --check` y revisión del diff de reversión | Correctos. |
| Comparación con el commit original | Sin diferencias en ningún archivo versionado. |
| Estado después del push | Árbol de trabajo limpio; `main` y `origin/main` en el SHA de reversión. |

Para compilar en este Windows se utilizó el adaptador WASM de Rollup existente, documentado en [README](../README.md): `NODE_OPTIONS=--require ./.cache/home-redesign/rollup-wasm.cjs`. El build se ejecutó fuera del sandbox que bloquea la lectura de la configuración por esbuild. Se mantuvo el aviso previo de bundles mayores de 500 kB; no hubo errores de compilación.

### Comprobación del visor en navegador

Se ejecutaron pruebas sobre el build local y, después del despliegue, sobre la página pública, con Chrome en modo headless:

- Escritorio: viewport de 1366 × 960, DPR 1.
- Móvil emulado: viewport de 390 × 960, DPR 2; el Canvas conserva su límite de DPR de 1.5.
- En ambos tamaños se comprobaron las URLs normal y antigua de práctica, usando además `qa=1` para la inspección de solo lectura ya existente en el atlas.
- Carga y visualización de las 207 mallas iniciales, con un único Canvas.
- Ausencia del panel «Práctica 1 · Efectos» y sus interruptores.
- Cero shaders Film/Glitch compilados durante las pruebas.
- Cero llamadas de dibujo durante 800 ms en reposo, después de estabilizarse la carga: renderizado bajo demanda.
- Imagen del Canvas idéntica píxel por píxel con y sin `practica1=1` en cada viewport.
- Rotación por arrastre con OrbitControls, zoom mediante el control «Acercar» y selección real mediante clic sobre una malla; la ficha anatómica se actualiza.
- Sin overflow horizontal, errores JavaScript/consola ni respuestas HTTP fallidas. Se revisaron capturas de escritorio y móvil.

En la página pública se seleccionaron `bp3d:FMA8364` en escritorio y `bp3d:FMA8066` en móvil emulado. La advertencia heredada de deprecación de `THREE.Clock` permanece y no constituye un error de la reversión.

Estas comprobaciones de móvil emulan viewport y DPR; no equivalen a una prueba en un teléfono físico. Las 193 pruebas XR son automatizadas y no certifican un dispositivo XR o cámara física.

## Publicación verificada

- Flujo conservado: `main` → `.github/workflows/deploy-pages.yml` → GitHub Pages.
- Publicación mediante `git push origin main`, después de superar las comprobaciones locales.
- [Ejecución 41881658940](https://github.com/jotajotafv/med3d/actions/runs/41881658940), correspondiente al SHA `7c671103206a6ce3b2dad2f05f74989b0368b5f9`: jobs **build** y **deploy** completados con `success`.
- [Atlas público](https://jotajotafv.github.io/med3d/anatomia/): funcionamiento original comprobado después del deploy.
- [Antiguo enlace de práctica](https://jotajotafv.github.io/med3d/anatomia/?practica1=1): muestra también el visor original, sin efectos ni panel.

## Evidencia y consulta posterior

El [resumen de validación versionado](practica1-reversion-validation.json) conserva los SHA, resultados, dimensiones verificadas y enlace al workflow. Los logs, capturas y herramientas locales de comprobación se conservan en `.cache/practica1-revert/`, ignorado por Git. Esa carpeta no forma parte de un clon nuevo ni se publica en Pages.

Para revisar la reversión sin modificar el repositorio:

```sh
git show --stat 7c671103206a6ce3b2dad2f05f74989b0368b5f9
git diff --exit-code cac6e024b454c73e5623b99da7a7455abc1e3f9a 7c671103206a6ce3b2dad2f05f74989b0368b5f9
git show 7c671103206a6ce3b2dad2f05f74989b0368b5f9:src/features/anatomy/atlas/AtlasScene.tsx
```

La reversión ya está realizada. No es necesario volver a ejecutar el comando que revierte la práctica.
