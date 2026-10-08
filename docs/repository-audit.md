# Auditoría técnica y limpieza de MED3D

Fecha: 8 de octubre de 2026. Rama: `phase-repository-audit`.
Base comprobada: `ae3ac93f49e9925020be0a816d0be160bba1c5e4` (`phase-organ-explorers-ui`).
El árbol inicial estaba limpio; se ejecutaron status, branch, rev-parse y log antes de modificarlo.

## Alcance y método

Auditoría del árbol de trabajo actual; no se intervienen respaldos, bundles ni historia Git.
Se inventariaron los **1.249 archivos versionados (295.740.136 bytes)** y se calculó SHA-256 de cada uno.
Distribución: 80 archivos de `src`, 127 de `public`, 98 scripts, 887 documentos/evidencias,
47 archivos de `research`, dos workflows y ocho archivos raíz.
La medida excluye `.git`, dependencias instaladas, cachés, `dist`, `.qa-anatomy` y `_TRANSFER`.

Análisis con el compilador TypeScript instalado: imports, reexports e imports dinámicos literales,
partiendo de `src/main.tsx`, el router y `routeTree.gen.ts`. No hay imports dinámicos no literales.
Se contrastaron nombres, rutas, selectores, recursos y consumidores con ripgrep en fuentes,
scripts, workflows y documentación; no basta con que un archivo falte en el grafo.
Las cargas por catálogo y URL se revisaron en Home, AnatomyPage, AtlasOverview, model-index y los loaders.
PostCSS ya instalado permite retirar reglas concretas sin reformatear el resto.
`tsc --noUnusedLocals --noUnusedParameters` se usó como diagnóstico adicional, sin cambiar tsconfig.

## Inventario de decisiones previo a la limpieza

**A: ELIMINAR SEGURO. B: CONSERVAR. C: REVISIÓN MANUAL / DUDA.**
Esta tabla se creó antes de la primera eliminación; sólo se aplican eliminaciones A.

| Archivo / elemento | Tipo | Referencia encontrada | Decisión | Motivo | Acción |
| --- | --- | --- | --- | --- | --- |
| `src/features/anatomy/AnatomyHero.tsx` | Componente Home anterior | Sin import/consumidor; menciones históricas en phase2-audit y home-redesign-delivery | A | HomePage utiliza HomeHero; el antiguo wrapper está fuera del grafo | Eliminar sólo el wrapper; conservar AnatomyScene, datos y modelos |
| `src/features/about/ArchitecturePage.tsx` | Página sustituida | Sin import; ruta arquitectura sólo redirige; retirada documentada en site-simplification-about-delivery | A | AboutPage es la implementación pública | Eliminar página; conservar redirect y documentos históricos |
| `src/features/learning/LearningCatalog.tsx` | Catálogo retirado | Sólo LessonPage consume LearningIcon; ninguna ruta importa el catálogo | A | Grupo completo inaccesible; rutas actuales sólo redirigen | Eliminar |
| `src/features/learning/LessonPage.tsx` | Detalle retirado | Cero consumidores externos | A | Ninguna ruta monta las lecciones | Eliminar |
| `src/features/learning/LearningScene.tsx` | Escena esquemática retirada | Sólo lazy import desde LessonPage | A | Consumidor retirado y sin scripts/pruebas que la ejecuten | Eliminar |
| `src/features/learning/content.ts` | Datos del módulo retirado | Sólo LearningCatalog y LessonPage | A | Sin consumidores activos ni pipeline anatómico | Eliminar de esta rama; disponible en Git y phase11-first-aid |
| `src/features/learning/learning.css` | CSS retirado | Sólo LearningCatalog y LessonPage | A | Hoja completa fuera del producto | Eliminar |
| Selectores `anatomy-hero*`, `anatomy-label-brain/lungs/heart` en `anatomy.css` | CSS Home anterior | Sólo AnatomyHero | A | Sustituidos por HomeHero y hero.css | Retirar reglas y partes muertas de listas; conservar selectores activos |
| `atlas-system-list`, `atlas-system`, `atlas-system-number`, `atlas-selected-meta`, `model-scene`, `model-error`, `atlas-note-pending` en `anatomy.css` | CSS visual antiguo | Sin clases en TS/TSX activo ni scripts/CI | A | Las escenas y errores actuales utilizan otros wrappers y estilos inline | Retirar sólo selectores positivos de estas clases |
| `atlas-technical`, `atlas-legacy-return`, `atlas-muscle-group` en `atlas/atlas.css` | CSS visual antiguo | Sin consumidores TS/TSX ni pruebas | A | Paneles técnicos/promoción ya retirados | Retirar reglas exclusivas; preservar declaración de selectores compartidos |
| Reglas `:is(...)` en `atlas/anatomy-ui.css` que incluyen nombres antiguos | CSS compuesto | También seleccionan párrafos, fuentes, propiedades y cobertura activas | B | Eliminar la regla cambiaría la presentación aprobada | Conservar íntegra la hoja |
| `LegacyOrganAtlas`, AnatomyScene, AtlasScene, SkeletalAtlas, AtlasOverview y hojas actuales | Código activo | Imports directos/lazy, enlaces y cargas desde rutas públicas | B | Órganos independientes, atlas y About operativos | Conservar |
| `mb` y `totalBytes` en SkeletalAtlas | Declaraciones sin lectura, detectadas por TS6133 | Sólo sus declaraciones | C | No son imports; se conserva íntegro el módulo funcional protegido | No intervenir en esta fase |
| `/procedimientos`, `/primeros-auxilios`, sus slugs y `/arquitectura` | Rutas de compatibilidad | Router y static-routes; destinos anatomia/acerca | B | Mantienen enlaces antiguos, también sin JS en hosting estático | Conservar cinco módulos de ruta y 15 páginas redirect |
| `public/assets/cpr.webp`, `pressure.webp`, `favicon-16.png` | Assets sin uso actual explícito | build-identity de fases 3b/3c y preservation de 3c | C | Referencias de evidencia histórica; no se asume que sean prescindibles | Conservar |
| `favicon.ico` | Asset con carga implícita posible | Nombre convencional solicitado por navegadores | B | Ausencia de import no prueba desuso | Conservar |
| cover/og/og-wide, favicons y webmanifest | Metadata y assets | index.html, app-meta y site.webmanifest | B | Uso público o contrato de metadata | Conservar |
| GLB, JSON anatómicos, manifiestos, source-locks, ZIP/OBJ fuente y licencias | Anatomía y procedencia | Catálogos, loaders, scripts, pruebas y evidencia | B | Carga dinámica y reproducibilidad; ámbito protegido | Conservar todos, incluidos históricos |
| 15 grupos de duplicados SHA-256 | Evidencia, iconos, licencias | 13 grupos en docs; icon-512/icon-maskable en manifest; licencias por sistema | B | Bytes iguales con funciones, referencias o evidencia independientes | Ninguna deduplicación |
| 98 scripts y pruebas | Tooling reproducible | package scripts, workflows, README anatómico y trazabilidad de fases | B | No son temporales inequívocos; pruebas también consultan objetos Git históricos | Conservar todos |
| `.cache/home-redesign/rollup-wasm.cjs` y tools | Workaround local | Build/dev; prueba nativa falla por Application Control | B | Sigue siendo necesario en este Windows | Conservar ubicación y documentar comando |
| Resto de `.cache`, `.qa-anatomy`, `_TRANSFER` | Evidencia local, fuentes y respaldo | Entregas previas y herramientas locales | C | Mezclan capturas/evidencias y utilidades; no hay autorización para perderlas por antigüedad | Conservar; no tocar bundles |
| `dist`, build/coverage/resultados de pruebas | Generables | Ninguno versionado; dist ignorado | B | No hay artefactos tracked accidentales que retirar | Regenerar dist para validación; no purgar evidencia |
| `.gitignore` | Configuración | Ignora node_modules, dist, .cache, .qa-anatomy y logs | B | Reglas actuales suficientes para artefactos presentes; logs históricos tracked siguen versionados | Conservar; sin nuevas reglas generales |
| `.github/workflows/deploy-pages.yml` | CI actual | Build y verify:anatomy; fetch-depth: 0 presente | B | Workflow activo y corrección necesaria ya aplicada | Conservar íntegro |
| `.github/workflows/anatomy-visual-validation.yml` | QA vigente | pull_request a main, workflow_dispatch y validaciones anatómicas | B | No está obsoleto aunque sus ramas push sean históricas | Conservar; añadir fetch-depth: 0 por tests que usan git show histórico |
| index.html, app-meta, sitemap y webmanifest | Metadata pública | Sólo producto actual; sitemap genera Inicio/Anatomía/Acerca | B | No presentan áreas retiradas como activas | Conservar |
| README introductorio y explicación de rutas | Documentación actual | Aún anuncia las áreas retiradas y 18 rutas de producto | A (texto obsoleto) | Descripción ya no coincide con router/build | Corregir introducción y distinguir contexto histórico; conservar atribuciones |

No se encontró otra versión abandonada de Home, footer o About; home.css conserva padding y reduced-motion.
No hay `src/assets`. Los nombres `home-label--${index}` son dinámicos y sus reglas se conservan.
Las declaraciones repetidas entre breakpoints o entre CSS base y overrides tienen efecto en la cascada:
no se consideran duplicados eliminables por igualdad parcial.

## Dependencias

Las **10 dependencias y 8 devDependencies están USADAS**; no se modifican package.json ni el lockfile.

| Dependencia | Evidencia de uso |
| --- | --- |
| react / react-dom | Hooks/componentes y createRoot en main.tsx |
| @tanstack/react-router | Router, rutas, enlaces/estado y generación de árbol |
| @tanstack/react-query | QueryClient en router y QueryClientProvider/contexto en __root |
| three | HomeAnatomyScene, AnatomyScene, AtlasScene, asset-manager y camera-framing |
| @react-three/fiber / @react-three/drei | Canvas, hooks, controles/gizmos en escenas anatómicas activas |
| @phosphor-icons/react | Iconos en header, Home, About, atlas y órganos |
| @fontsource-variable/geist / geist-mono | Dos @import de src/styles.css |
| @tanstack/router-plugin | tanstackRouter en vite.config.ts |
| @types/three / @types/react / @types/react-dom | Tipado de escenas, JSX, hooks y montaje DOM |
| @types/node | process en vite.config.ts y tipos Node del tooling |
| vite / @vitejs/plugin-react | dev/build/preview y plugin React de vite.config.ts |
| typescript | typecheck; transpileModule en verificadores anatómicos |

Sin upgrades ni npm audit fix. No se instala tooling nuevo para esta auditoría.

## Entorno y evidencias locales

Node 24.15.0 / npm 11.12.1. El binario nativo de Rollup produce
`An Application Control policy has blocked this file`. El build base pasó con:

```powershell
$env:NODE_OPTIONS='--require ./.cache/home-redesign/rollup-wasm.cjs'
npm run build
npm run dev -- --port 5178 --strictPort
```

El wrapper y su instalación WASM están fuera de node_modules raíz; npm ci puede conservarlos.
El runner de terminal restringido falla al inicializar (`setup refresh had errors`);
los comandos se ejecutan mediante la alternativa de ejecución aprobada.
La herramienta de control manual no tiene navegadores conectados. Se utiliza Playwright ya instalado
y Chromium local 1228 en un contexto de pruebas separado; no se modifica el navegador personal.
Inventario, hashes, plan CSS, logs y capturas de comparación: `.cache/repository-audit/` (ignorado).

## Resultado de la limpieza

Aplicadas las eliminaciones A: **siete archivos**, incluidos cinco componentes/páginas principales,
el módulo de contenido retirado y su CSS. Se recuperan **83.722 bytes** al retirar esos archivos.
Además se eliminan **83 apariciones de selectores**: 73 en anatomy.css y 10 en atlas.css,
con una reducción adicional de **6.487 bytes**. No se altera ninguna declaración CSS activa.
La hoja learning.css retirada contenía 238 reglas; el ahorro total de CSS fuente es 27.234 bytes.
El CSS construido de anatomia pasa de 19,67 a 13,85 kB, y el de SkeletalAtlas de 29,86 a 29,27 kB.

| Archivo retirado | Bytes |
| --- | ---: |
| ArchitecturePage.tsx | 9.959 |
| AnatomyHero.tsx | 2.941 |
| LearningCatalog.tsx | 5.084 |
| LearningScene.tsx | 15.149 |
| LessonPage.tsx | 13.684 |
| content.ts del módulo learning | 16.158 |
| learning.css | 20.747 |

No se eliminan assets, duplicados, dependencias, scripts, tests, redirects ni evidencia local.
No hay cambios en package.json, package-lock.json, tsconfig, vite.config, routeTree ni metadata pública.
README corrige la descripción vigente y documenta WASM; el workflow de QA incorpora historial completo.
El workflow de Pages conserva su contenido exacto, incluido fetch-depth: 0.

El grafo final cubre los **73 archivos restantes de src**: cero módulos/hojas de src inalcanzables,
cero imports dinámicos no literales y cero chunks de Learning, Lesson, ArchitecturePage o AnatomyHero
en el build final. Se preservan los exports que consumen scripts/pruebas y los dos locales
anatómicos señalados en el inventario; no se afirma ausencia absoluta de código muerto dentro de funciones.

## Medidas

Suma de bytes de archivos versionados del árbol de trabajo, no espacio físico asignado ni tamaño de Git.
El después incluye README actualizado, dos líneas de CI y este informe nuevo. Las capturas y logs locales
se excluyen de ambos lados; no se atribuye ahorro por borrar cachés o comprimir la historia.

<!-- audit-metrics-start -->
| Medida | Antes | Después | Reducción |
| --- | ---: | ---: | ---: |
| Archivos versionados | 1.249 | 1.243 | 7 retirados y 1 informe añadido |
| Bytes del árbol versionado relevante | 295.740.136 | 295.670.290 | **69.846 bytes netos** |
| Archivos de src | 80 | 73 | 7 |
| Bytes de src | 665.195 | 574.986 | **90.209 bytes** |
| Dependencias directas / desarrollo | 10 / 8 | 10 / 8 | 0 |
| Assets / duplicados / scripts eliminados | — | 0 / 0 / 0 | 0 |

El ahorro bruto de fuentes es 90.209 bytes (13,56 % de src); el ahorro neto del árbol completo
descuenta la nueva documentación y el ajuste de CI. La historia Git conserva las versiones retiradas.
<!-- audit-metrics-end -->

Commit de limpieza: **`7e5668404d026c1788f4fc356dcd82e7d82b0ff8`**,
`Remove verified dead code and obsolete styles`: 10 archivos afectados, 468 líneas retiradas y
12 insertadas (10 líneas CSS existentes ajustadas y dos de configuración CI); reducción neta de 456 líneas.
De las 468 retiradas, 446 corresponden a los siete archivos eliminados. El conteo por líneas refleja
CSS/TSX previamente compactado y no equivale a número de instrucciones.
La documentación se registra en un segundo commit, `Document repository audit and cleanup`.
Su SHA se obtiene con `git log -1 --format=%H` en esta entrega, sin incluir un identificador autorreferencial.

## Validaciones finales

| Comprobación | Resultado |
| --- | --- |
| npm ci | Correcto: 162 paquetes instalados; package.json/lockfile idénticos a la base |
| npm run typecheck | Correcto |
| npm run verify:anatomy | Correcto, siete verificadores; ejecutado una vez después de la limpieza |
| npm run build con WASM | Correcto; tres páginas públicas, 15 redirects, sin chunks retirados |
| npm run dev con WASM | Correcto tras npm ci; servidor restablecido en http://localhost:5173/med3d/ |
| git diff --check | Correcto tras cada grupo y al cierre |
| Comparación visual | 12 pares de PNG idénticos byte por byte; estilos calculados y warnings también idénticos |
| Smoke funcional | 21 comprobaciones aprobadas; 68 solicitudes GLB, 55 URLs GLB distintas |
| Errores HTTP / JS | Cero respuestas >=400 y cero excepciones de página durante las capturas y el smoke |
| Sitemap / hosting estático | Sólo Inicio, Anatomía y Acerca en sitemap; 15 redirects con noindex y meta refresh correctos |

La primera ejecución de npm ci encontró EPERM al intentar liberar esbuild.exe: lo mantenía abierto
un Vite de este repositorio iniciado el 7 de octubre. Se detuvieron únicamente ese Vite y su esbuild,
se repitió npm ci con éxito y se restableció el servidor local con WASM. La instalación del adaptador
en .cache permaneció intacta. No se desactivó Application Control ni se borró el lockfile.

Smoke mediante Playwright existente / Chromium 1228, sin instalar dependencias adicionales:

- Home: modelo visible, rotación observada por cambios de coordenadas proyectadas, pausa/reanudación y CTA al atlas.
- Anatomía: árbol contraído/expandido; búsqueda y selección de Fémur derecho (`bp3d:FMA24474`);
  ficha, toggle sin reemplazar canvas ni recargar recursos; aislamiento reversible; despiece 100/0;
  once capas, visibilidad y opacidad; selección real sobre el canvas (`bp3d:FMA13336`).
- Corazón: carga y raycast de Ventrículo derecho; ficha y toggle conservan selección/canvas/recursos.
- Pulmones: carga y raycast de Segmento broncopulmonar anterior derecho; ficha y toggle correctos.
- Encéfalo: carga y raycast de Atrio del ventrículo lateral izquierdo; ficha y toggle correctos.
- About: once sistemas, fuentes y enlaces de licencias presentes; header de tres enlaces y footer mínimo.
- Redirects SPA: dos índices, dos detalles representativos y arquitectura; destinos correctos.
- Capturas de Home, Anatomía, About y tres órganos a 1366×768 y 390×844, sin overflow horizontal;
  revisión visual de las imágenes y comparación exacta antes/después.

Una aserción inicial del smoke consultó About antes de que su carga diferida crease la lista.
Se corrigió sólo la espera del runner local y se continuó desde About; los controles anatómicos ya
aprobados no se repitieron. El reporte inicial y el resultado completo se conservan en .cache/repository-audit/smoke/.
No fue un fallo del producto y no motivó cambios en About.

## Conservación verificada

SHA-256 contra el inventario inicial: **127/127 archivos de public, 47/47 de research,
98/98 scripts y 887/887 documentos/evidencias anteriores idénticos**. El único documento añadido
en docs es este informe. **44/44 archivos de código/datos anatómicos activos** permanecen idénticos;
las únicas intervenciones del área anatomy son el wrapper Home inaccesible y dos hojas de CSS.
GLB, catálogos, IDs, registros, geometrías, transforms, materiales, cámaras, selección, raycast,
árbol, búsqueda y despiece funcionales permanecen intactos.

Las **18 ramas preexistentes** conservan sus SHA. En particular,
`phase11-first-aid` sigue en `a391093cd28b975673fd0fc1e6b87fa1aeafed29`.
No se modifican respaldos externos, MED3D_TRANSFER, bundles ni commits anteriores.
Entrega mediante dos commits locales. Sin push, merge ni deploy.

## Limitaciones y pendientes explícitos

- La interacción se verificó mediante pruebas automatizadas en navegador y revisión de capturas;
  la herramienta de control manual no tenía navegador conectado. No se afirma un smoke manual
  completo ni pruebas en dispositivos físicos u otros navegadores.
- Se conserva el aviso previo de THREE.Clock obsoleto y el warning de Vite por el chunk compartido
  superior a 500 kB. No aparecen warnings nuevos en la comparación visual.
- `npm audit` informa de **una vulnerabilidad alta preexistente** en `source-map-js@1.2.1`, transitiva
  de `vite → postcss`: [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q).
  Se registra el hallazgo sin ejecutar npm audit fix ni actualizar dependencias, conforme al alcance.
- No se ha ejecutado GitHub Actions remoto. La corrección de fetch-depth se justifica por los
  git show históricos de test-atlas-limbs, test-atlas-head-neck y test-atlas-muscle-gaps, que pasan localmente.
- Se conservan los assets ligados a evidencia, los dos locales TS6133 del módulo anatómico,
  las reglas :is compartidas, cachés históricos, tooling WASM y todos los duplicados documentales.
  No se deduce desuso de una simple ausencia de import o de cobertura puntual del navegador.
