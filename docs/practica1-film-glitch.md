# Práctica 1: FilmPass y GlitchPass

Implementación temporal del 21 de octubre de 2026. Solo usa los complementos de Three.js 0.186.0 ya instalado; no añade dependencias ni modifica el workflow de Pages.

## Abrir la demostración

[Modo de práctica](https://jotajotafv.github.io/med3d/anatomia/?practica1=1).

Abre «Práctica 1 · Efectos». Ambos efectos y el modo intenso comienzan apagados. FilmPass parte de 0.40 y mantiene el color. El panel muestra los efectos activos, se puede plegar y permite restaurar la imagen original con un botón. GlitchPass advierte de los destellos antes de activarlo. Con movimiento reducido del sistema/navegador, los efectos están bloqueados; cambiar esa preferencia a reducir también los apaga y no los reactiva automáticamente después.

Sin `practica1=1` no se monta el panel ni el componente de efectos. Con ambos interruptores apagados no existe un composer ni sus buffers GPU. Se conserva el Canvas original con `frameloop="demand"`.

## Archivos de esta práctica

| Estado | Archivo | Función |
| --- | --- | --- |
| Nuevo | `src/features/anatomy/atlas/Practica1PostFX.tsx` | Composer, cadena de efectos, animación, tamaño, transparencia y limpieza. |
| Nuevo | `src/features/anatomy/atlas/Practica1Panel.tsx` | Controles accesibles, estado, advertencia y restauración. |
| Nuevo | `src/features/anatomy/atlas/practica1.css` | Apariencia exclusiva del panel, adaptada a escritorio y móvil. |
| Modificado | `src/features/anatomy/atlas/AtlasScene.tsx` | Activación por URL, estado de controles y coordinación con GizmoHelper. |
| Nuevo | `scripts/practica1-qa.mjs` | Prueba de aceptación en navegador con evidencia y mediciones GPU. |
| Nuevo | `docs/practica1-film-glitch.md` | Guía del video, validación y reversión. |

Los GLB, fuentes educativas, fichas, selección, cámaras, OrbitControls, XR, marca, rutas y configuración de publicación conservan su implementación anterior.

## Código para enseñar al profesor

Las siguientes líneas corresponden a `src/features/anatomy/atlas/Practica1PostFX.tsx`:

| Líneas | Fragmento | Explicación breve |
| --- | --- | --- |
| 3–7 | Importaciones `three/addons/postprocessing/…` | Son complementos oficiales de la dependencia existente. |
| 24 | `useThree()` | Obtiene el renderer, escena, cámara, dimensiones, DPR e invalidación del Canvas existente. |
| 30 | `new EffectComposer(gl)` | Organiza la cadena utilizando el mismo renderer; no crea otro Canvas. |
| 33 | `new RenderPass(scene, camera)` | Dibuja la anatomía en un buffer para los efectos. |
| 34 | `new FilmPass(0.4, false)` | Añade grano animado con intensidad 0.4 y sin escala de grises. |
| 35–36 | `new GlitchPass()`; `goWild = false` | Crea las distorsiones normales; el modo intenso no empieza activo. |
| 37 | `new OutputPass()` | Aplica la conversión de color y tone mapping que ya usa el renderer. |
| 41–44 | Ajuste de alfa de GlitchPass | El shader oficial r186 suma ruido a RGBA. Esta corrección local conserva alfa y limita el ruido a RGB; evita volver opaco el fondo transparente. No añade otro efecto ni modifica `node_modules`. |
| 48–51 | `composer.addPass(...)` | Define el orden RenderPass → FilmPass → GlitchPass → OutputPass. |
| 58–66 | Limpieza y `dispose()` | Retira la suscripción y libera los recursos de cada pass y del composer. Solicita un último frame original. |
| 72–73 | `setPixelRatio`; `setSize` | Sigue el DPR efectivo del Canvas y sus dimensiones CSS, incluidos los cambios de tamaño. |
| 80–84 | `enabled`, intensidad y `goWild` | Aplica los interruptores y el control de intensidad sin recrear el composer en cada frame. |
| 85 | `composer.render(Math.min(delta, 0.1))` | Renderiza el fotograma procesado; limita saltos temporales al volver a la pestaña. |
| 87–88 | `invalidate()`; prioridad `active ? 1 : 0` | Mantiene animación solo mientras hay efectos. La prioridad positiva toma el control del renderizado de R3F. |

En `AtlasScene.tsx`, líneas 335–339 se leen el parámetro y la preferencia de movimiento; líneas 366–367 integran los efectos y cambian la prioridad del gizmo; línea 370 monta el panel HTML.

El `GizmoHelper` existente usa internamente `Hud`: con prioridad 1 vuelve a dibujar la escena principal. Durante la práctica activa pasa a prioridad 2, después del composer, y dibuja solo sus ejes. Al apagar ambos efectos vuelve a su prioridad 1 original. Así no hay doble render de la anatomía ni un gizmo que borre el postprocesamiento. No se cambia permanentemente `frameloop` ni se añade un `requestAnimationFrame` paralelo. La pestaña oculta deja de solicitar frames y vuelve a invalidar cuando se muestra.

Referencias oficiales: [useFrame y prioridades de R3F](https://r3f.docs.pmnd.rs/api/hooks), [EffectComposer](https://threejs.org/docs/pages/EffectComposer.html), [FilmPass](https://threejs.org/docs/pages/FilmPass.html). La integración también se contrastó con el código instalado de Three, R3F 9.7.0 y Drei 10.7.8.

## Guion sugerido: 60–90 segundos

1. Abre el enlace de práctica y muestra «Imagen original» con ambos efectos apagados.
2. Activa FilmPass y mueve su intensidad de 0.40 a 0.75. Explica el grano animado.
3. Apaga FilmPass y activa GlitchPass; espera unos segundos para ver sus fallos intermitentes. La advertencia de destellos está visible.
4. Activa FilmPass junto a GlitchPass. El modo «Glitch intenso» es opcional y requiere una acción explícita.
5. Pliega el panel, gira el modelo y acerca la cámara para mostrar que la navegación sigue funcionando.
6. Pulsa «Restaurar imagen original». Muestra las importaciones, la cadena de `addPass` y `composer.render()` en el archivo independiente.

En móvil, pliega el panel después de cambiar los interruptores para ver el cuerpo completo. No es necesario activar el modo intenso para demostrar la práctica.

## Validación local

- `npm run typecheck`: correcto.
- `npm run build`: correcto; cuatro páginas y quince redirecciones. Mantiene el aviso previo de bundle mayor de 500 kB. En este Windows se utilizó el adaptador WASM de Rollup ya documentado en README y ejecución fuera del sandbox que bloqueaba a esbuild.
- `npm run verify:anatomy`: correcto.
- `npm run test:xr`: 193 aprobadas, ninguna fallida ni omitida.
- `git diff --check`: correcto.
- Navegador: Chrome headless, 1366 × 960 a DPR 1 y 390 × 960 a DPR 2 (el Canvas limita DPR a 1.5); redimensionado también a 1050 × 880 y 430 × 880.
- Sin parámetro, modo inicial, Film, Glitch, ambos e intenso: comprobados. Imagen inicial y restaurada idénticas píxel por píxel al Canvas sin parámetro, excluyendo únicamente el panel HTML de la captura comparativa.
- Animación activa comprobada mediante llamadas WebGL reales. Tras restaurar, cero llamadas de dibujo durante el intervalo de observación de 650 ms después de estabilizarse.
- Texturas y framebuffers regresan a los valores iniciales tras apagar los efectos (8 texturas y 3 framebuffers del renderer en estas pruebas). Alfa del fondo igual a cero, incluso con glitch intenso.
- Selección real sobre la malla, arrastre con OrbitControls y botón de zoom: correctos con ambos efectos activos; un solo Canvas.
- Intensidad, movimiento reducido al iniciar y al cambiar la preferencia, no reactivación automática, tamaño y DPR: correctos.
- Sin overflow horizontal ni superposición del panel con vista, zoom, despiece o controles móviles. Capturas revisadas de escritorio y móvil.
- Cero errores JavaScript/consola y HTTP. Se observó la advertencia heredada `THREE.Clock` deprecado también sin el modo de práctica.

La revisión móvil emula viewport/DPR; no equivale a una prueba en teléfono físico. Las pruebas de XR son automatizadas; no certifican un dispositivo XR ni cámara física. No se grabó el video del estudiante.

Evidencia ignorada por Git: `.cache/practica1/local/`, `build.log`, `verify-anatomy.log`, `test-xr.log`. El script conserva capturas y `results.json` y falla si no se cumple una comprobación. Playwright y Chrome son herramientas externas de QA; no son nuevas dependencias del proyecto.

Para repetir sobre un build servido:

```powershell
# Terminal 1; en este equipo se necesita el adaptador existente:
$env:NODE_OPTIONS='--require ./.cache/home-redesign/rollup-wasm.cjs'
npm run preview -- --host 127.0.0.1 --port 5184 --strictPort

# Terminal 2; adapta las rutas a tu instalación de QA:
node scripts/practica1-qa.mjs 'RUTA/AL/MODULO/playwright' 'RUTA/AL/chrome.exe'
```

Para repetir contra la publicación, establece `PRACTICA1_ORIGIN=https://jotajotafv.github.io/med3d/` y `PRACTICA1_OUTPUT=.cache/practica1/public` antes de ejecutar el mismo script. La entrega final identifica el commit y el workflow realmente verificados; este documento se registra antes de publicar ese commit.

## Respaldo, publicación y reversión posterior

SHA original de `main`: `cac6e024b454c73e5623b99da7a7455abc1e3f9a`. El árbol de trabajo estaba limpio antes de comenzar. Respaldo: `backup/practica1-before`. Rama de práctica: `practica1-film-glitch`; contiene un único commit dedicado sobre la base original. No se ha realizado la reversión.

La publicación utiliza `main` → `.github/workflows/deploy-pages.yml` → GitHub Pages. La entrega final proporciona el SHA completo de la práctica y el enlace a su ejecución. Para identificarlo localmente: `git rev-parse practica1-film-glitch`; para ver solo sus archivos: `git show --stat practica1-film-glitch`.

Después de grabar y solo cuando decidas retirar la práctica, usa el SHA exacto de la entrega final en lugar de `SHA_DE_LA_PRACTICA`:

```powershell
git status --short
# Si hay trabajo local, guárdalo en su propia rama/commit antes de continuar.
git switch main
git pull --ff-only origin main
git revert --no-edit SHA_DE_LA_PRACTICA
npm run typecheck
npm run build
npm run verify:anatomy
npm run test:xr
git diff --check
git push origin main
```

`git revert` crea un nuevo commit que deshace solo la práctica y conserva los commits posteriores. No uses `reset --hard` ni `push --force`. Si aparecen conflictos, conserva los cambios ajenos y resuelve únicamente la retirada de esta práctica; si no está claro, `git revert --abort` deja la rama como estaba antes del intento. Después del push, espera el éxito del build y deploy de Pages y comprueba el atlas público. Conserva las ramas de respaldo y práctica para consultar el código del video.
