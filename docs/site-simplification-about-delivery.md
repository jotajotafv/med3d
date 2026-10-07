# Entrega: simplificación del sitio y About

7 de octubre de 2026. Rama: `phase-site-simplification-about`.
Base: `e51cd258f5fcfd37dee4f8f053448ed5c3576331` (Home y Anatomía aprobados).

## Producto y rutas

Navegación principal: Inicio, Anatomía 3D y Acerca del proyecto, con el CTA Abrir atlas existente. Procedimientos y Primeros auxilios se retiraron del header, menú móvil, footer, About, descripción pública y sitemap. El Home no necesitó cambios de contenido.

Las dos rutas índice y sus detalles ahora redirigen a `/anatomia` mediante el router. El build genera también redirecciones HTML para las 14 direcciones históricas conocidas, con enlace de respaldo, canonical y noindex; funcionan sin JavaScript y respetan BASE_PATH. `/arquitectura` redirige a `/acerca/#metodologia`, donde se concentra la información técnica actual. El sitemap enumera sólo Inicio, Anatomía y About.

Se conserva el código histórico de aprendizaje y ArchitecturePage, sin importaciones desde rutas públicas ni inclusión de esas páginas en el bundle. No se borraron assets, documentación, evidencias ni commits. `phase11-first-aid` permanece en `a391093cd28b975673fd0fc1e6b87fa1aeafed29`; las ramas aprobadas de Home y Anatomía mantienen sus SHA.

## About

Composición editorial negra, tipografía Geist, separadores finos, acento cyan y navegación por anclas. Estructura: hero, propósito, cobertura, herramientas de exploración, fuentes/licencias, metodología/tecnología, limitaciones y CTA al atlas. Sin nueva escena 3D ni dependencias.

`AtlasOverview` consulta los 12 catálogos JSON ya utilizados por el atlas: suma sus recuentos semánticos y obtiene los sistemas de sus nodos y activos. Resultado actual: **11 sistemas y 580 estructuras**; la extensión ocular pertenece a Nervioso, no añade un sistema. No se cuentan grupos o componentes como estructuras adicionales. Si falla la consulta se muestran guiones y un reintento, nunca cifras inventadas. No se descarga ningún GLB en About.

Contenido contrastado con `docs/phase10-{delivery,integration,audit}.md`, `docs/phase2-sources.md`, `docs/phase4-expansion-sources.md`, `docs/phase6-sources.md`, `docs/phase8-sources.md`, `docs/phase9-sources.md`, `docs/model-licenses.md`, catálogos/provenance y avisos LICENSE distribuidos. Las entregas posteriores y los manifiestos actuales resuelven la cobertura histórica de Z-Anatomy. Tecnología comprobada en package.json.

Atribuciones mostradas: BodyParts3D 4.0 / DBCLS (CC BY 4.0); activos pulmonares, tiroideos y paratiroideos 4.3 (CC BY-SA 2.1 Japan); selección nerviosa Z-Anatomy (CC BY-SA 4.0, con crédito histórico BP3D y exclusiones NC); exploradores independientes HRA/HuBMAP (CC BY 4.0). Se enlazan las fuentes y licencias documentadas. No se afirma validación clínica, anatomía completa ni rendimiento garantizado.

## Archivos

- `src/components/SiteHeader.tsx`, `src/components/SiteFooter.tsx`.
- `src/features/about/AboutPage.tsx`, `about.css` y nuevo `AtlasOverview.tsx` en ese directorio.
- `src/routes/procedimientos/{index,$slug}.tsx`, `src/routes/primeros-auxilios/{index,$slug}.tsx`, `src/routes/arquitectura.tsx`.
- `scripts/static-routes.mjs`, `src/app-meta.json`, `index.html`.
- `docs/site-simplification-about-delivery.md` (única documentación nueva).

## Validación

- `npm run typecheck`, `npm run build` y `npm run verify:anatomy`: correctos. Verificación anatómica ejecutada **una vez**. Build con el adaptador WASM local de Rollup ya existente por el bloqueo del binario nativo de Windows; sin cambios de dependencias. Permanece el aviso de tamaño de chunk compartido de Three/Meshopt.
- 52 comprobaciones aprobadas en Chrome local con Playwright: rutas con y sin JavaScript, CTA, navegación desktop/móvil, cierre por Escape y retorno del foco, anclas, metadata, sitemap y catálogo dinámico. Se probaron cambio de datos mediante respuesta interceptada, fallo y recuperación. Sin errores JavaScript del producto.
- Responsive: 1366, 1050, 900, 768 y 390 px; sin desbordamiento horizontal, métricas apiladas y licencias visibles en móvil. Revisión por emulación, no en dispositivo físico.
- Home: hero, canvas, etiquetas y CTA conservados. Atlas: carga, drag, búsqueda y ficha correctos; las mismas 936 mallas iniciales y propiedades observables de posición/material/picking respecto al estado aprobado. Cámara inicial conservada tras su animación.
- `git diff --check` correcto y diff revisado. **Ningún cambio en GLB, geometría, catálogos, IDs, sistemas, materiales, loaders, cámara, raycast, búsqueda, capas, selección, fichas ni Exploded View.** Tampoco cambios en CSS o código de Home/Anatomía; sólo se simplifica su navegación compartida.

## Capturas

Ocho capturas principales inspeccionadas en `.cache/site-simplification-about/`, excluidas del commit:

[Hero desktop](../.cache/site-simplification-about/01-about-desktop-hero.png) · [Atlas](../.cache/site-simplification-about/02-about-atlas.png) · [Fuentes y licencias](../.cache/site-simplification-about/03-about-sources-licenses.png) · [Limitaciones](../.cache/site-simplification-about/04-about-limitations.png) · [CTA final](../.cache/site-simplification-about/05-about-final-cta.png) · [Header](../.cache/site-simplification-about/06-header-desktop.png) · [Tablet](../.cache/site-simplification-about/07-about-tablet.png) · [Móvil](../.cache/site-simplification-about/08-about-mobile.png).

Se guardan además dos vistas comparativas de Home y Anatomía y el registro de comprobaciones en esa carpeta temporal. Entrega mediante commit local. Sin push, merge ni deploy.
