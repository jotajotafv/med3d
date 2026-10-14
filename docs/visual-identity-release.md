# Cierre de identidad visual y publicación de MED3D

Fecha: 14 de octubre de 2026.

## Objetivo y alcance

Adoptar en todo el sitio el wordmark de Inicio aportado como referencia: MED blanco y 3D gris, sobre superficies negras. Se conserva la identidad, sin rediseñar la marca ni cambiar el funcionamiento del atlas. La publicación también incorpora el ajuste previamente solicitado del panel de activación de manos, ahora visible en el hero de XR.

Base de este trabajo: dbd83c9489432a8a1c532c8de4c6be8ada0062ea. Antes de comenzar había dos cambios visuales locales en XrAtlasExperience.tsx y atlas-xr.css; se conservaron e incluyeron. El anterior main público era 1be9dd644dea33cc008fe47889e4608bd3fab8f6. El release incorpora además sus diez commits posteriores ya existentes: completado anatómico, carga unificada y documentación/QA de tracking. Este ajuste no modifica esos modelos ni su lógica.

## Fuente única de marca

- Componente: src/components/BrandWordmark.tsx.
- Apariencia: src/components/brand-wordmark.css.
- Tipografía: Geist Variable ya instalada; pesos 620 para MED y 420 para 3D.
- Colores: #f5f5f5 y #969696. Espaciado proporcional al tamaño, sin acento cyan en el logo.
- Header: 27 px en desktop/tablet; 24 px hasta 760 px. El mismo dibujo tipográfico conserva sus proporciones en todos los tamaños. Las marcas secundarias de Acerca y XR sólo cambian de escala.
- Se conserva el enlace accesible «MED3D, inicio» y el foco de teclado existente.

## Lugares revisados y corregidos

Header común de Inicio, Anatomía 3D, Acerca, Experiencia XR, Corazón, Pulmones y Encéfalo; menú móvil; wordmark del hero de Acerca; etiqueta de Atlas XR y componente XR de corazón conservado en código. Los estados de carga/error usan el mismo header compartido.

Se retiraron los overrides de color/tamaño de Home, About, Atlas y exploradores de órganos. El footer fue revisado: sólo contiene el aviso educativo y se mantiene así. Las menciones MED3D en párrafos, fuentes, títulos de pestaña y avisos siguen siendo texto editorial, no logos insertados en el contenido educativo.

También se actualizaron las portadas públicas og.webp, og-wide.webp y cover.webp, los iconos de instalación/apple-touch, los favicons y los colores del manifiesto. Las portadas e iconos grandes se renderizan desde el componente real y su fuente local. Los favicons de 16–32 px conservan únicamente la M, ahora blanca y derivada del mismo tipo, para seguir siendo legibles. El SVG de favicon incorpora ese glifo ya renderizado y no depende de fuentes del sistema. Los enlaces de metadatos/manifiesto llevan v=brand-20261014 para evitar servir recursos anteriores desde caché.

## Archivos del ajuste

- [index.html](../index.html)
- [public/apple-touch-icon.png](../public/apple-touch-icon.png)
- [public/assets/cover.webp](../public/assets/cover.webp)
- [public/assets/og-wide.webp](../public/assets/og-wide.webp)
- [public/assets/og.webp](../public/assets/og.webp)
- [public/favicon-16.png](../public/favicon-16.png)
- [public/favicon-32.png](../public/favicon-32.png)
- [public/favicon.ico](../public/favicon.ico)
- [public/favicon.svg](../public/favicon.svg)
- [public/icon-192.png](../public/icon-192.png)
- [public/icon-512.png](../public/icon-512.png)
- [public/icon-maskable.png](../public/icon-maskable.png)
- [public/site.webmanifest](../public/site.webmanifest)
- [scripts/branding/generate-assets.mjs](../scripts/branding/generate-assets.mjs)
- [scripts/branding/visual-qa.mjs](../scripts/branding/visual-qa.mjs)
- [src/app-meta.json](../src/app-meta.json)
- [src/components/BrandWordmark.tsx](../src/components/BrandWordmark.tsx)
- [src/components/SiteHeader.tsx](../src/components/SiteHeader.tsx)
- [src/components/brand-wordmark.css](../src/components/brand-wordmark.css)
- [src/features/about/AboutPage.tsx](../src/features/about/AboutPage.tsx)
- [src/features/about/about.css](../src/features/about/about.css)
- [src/features/anatomy/atlas/anatomy-ui.css](../src/features/anatomy/atlas/anatomy-ui.css)
- [src/features/anatomy/organ-explorers.css](../src/features/anatomy/organ-explorers.css)
- [src/features/home/hero.css](../src/features/home/hero.css)
- [src/features/xr/XrHeartExperience.tsx](../src/features/xr/XrHeartExperience.tsx)
- [src/features/xr/atlas/XrAtlasExperience.tsx](../src/features/xr/atlas/XrAtlasExperience.tsx)
- [src/features/xr/atlas/atlas-xr.css](../src/features/xr/atlas/atlas-xr.css)
- [src/features/xr/xr.css](../src/features/xr/xr.css)
- [src/styles.css](../src/styles.css)

Además: README.md enlaza este cierre y actualiza el inventario a cuatro páginas públicas; docs/visual-identity-release.md y docs/visual-identity-validation.json registran la entrega después de verificar el despliegue. No hay dependencias nuevas ni cambios en rutas, catálogo, IDs, fuentes educativas, GLB/SWC, geometrías, loaders, gestos, dwell, raycast o thresholds. Los handlers/estados del bloque de manos son los que ya existían.

## Validación

- npm run typecheck: correcto sobre el código final.
- npm run test:xr: 193/193 pruebas aprobadas.
- npm run verify:anatomy: correcto, ejecutado una vez localmente por ser parte del flujo normal de Pages. El workflow ejecuta su propia comprobación.
- node scripts/test-anatomy-completion.mjs: correcto; owners/hashes, once sistemas, carga unificada, educación, aislamiento y restauración de despiece del checkpoint existente.
- npm run build: correcto; cuatro páginas estáticas y quince redirecciones de compatibilidad. Se conserva el aviso previo de bundles superiores a 500 kB.
- git diff --check: correcto.
- scripts/branding/visual-qa.mjs: 35 combinaciones (7 vistas × 1366, 1050, 900, 768 y 390 px), con comprobación de todos los wordmarks, alineación, medidas, tipografía, colores y pesos; sin overflow horizontal. Menú móvil y CTA de manos por encima del pliegue comprobados.
- Ocho entradas adicionales con JS/CSS demorados 600 ms: ningún frame con colores/pesos del logo anterior.
- Sin errores JavaScript ni respuestas HTTP fallidas en las vistas verificadas.
- Se revisaron capturas de Inicio, Acerca, atlas, órganos, XR móvil y recursos gráficos. La selección/ficha, rotación, escala, capas, despiece y cámara simulada del panel de manos también se comprobaron en la iteración visual inmediatamente anterior; la cámara física no se certifica con esa fixture.

Evidencia reproducible resumida en visual-identity-validation.json. Capturas y logs completos en .cache/brand-release/local, .cache/brand-release/public y .cache/brand-release/*.log, ignorados por Git; pueden regenerarse con el script de QA. La evidencia previa del panel de manos está en .cache/xr-hand-hero.

## Publicación verificada

- Sitio: [MED3D](https://jotajotafv.github.io/med3d/).
- Commit de producto: [aded3e51f31db49af688b5184f6c8aace68810ab](https://github.com/jotajotafv/med3d/commit/aded3e51f31db49af688b5184f6c8aace68810ab).
- Workflow: [Publicar MED3D en GitHub Pages · 38649767219](https://github.com/jotajotafv/med3d/actions/runs/38649767219), build y deploy terminados con success.
- Publicación comprobada en las mismas 35 combinaciones y ocho cargas demoradas: correctas, sin errores JS/HTTP. Doce recursos públicos de marca comparados por SHA-256 con los archivos locales: coincidencia completa.
- XR público: carga terminada de 207 mallas en nueve módulos iniciales; selección real de Clavícula izquierda y cierre de ficha con el mismo canvas, en 1366 y 390 px. Capturas adicionales xr-loaded-1366.png y xr-loaded-390.png tomadas tras completar las descargas.
- main avanzó por fast-forward desde el checkpoint público anterior. El primer push recibió HTTP 408; el reintento con HTTP/1.1 y un buffer temporal de 150 MiB terminó correctamente. No hubo force push, reescritura ni cambio persistente de configuración Git. GitHub advirtió del GLB de glomérulo ya existente de 55,26 MiB, pero aceptó el paquete.
- Estado Git tras publicar el producto: main y origin/main en aded3e5, working tree limpio. README y estos dos documentos se registran posteriormente en un commit documental; no alteran el producto desplegado. El SHA documental se obtiene con git log -1 -- docs/visual-identity-release.md y se informa en la entrega final. El workflow vuelve a ejecutarse al publicar ese commit; debe terminar también con success.

## Retomar el proyecto

1. Para cambiar la marca, editar BrandWordmark y su CSS compartido; evitar reglas de color/peso/espaciado en páginas concretas. El contexto puede definir únicamente el tamaño y la separación exterior.
2. Con Vite local iniciado, regenerar los recursos mediante node scripts/branding/generate-assets.mjs <ruta-al-modulo-playwright> <ruta-a-Chromium>. Las herramientas de QA se proporcionan externamente; no son dependencias de la aplicación.
3. Para QA sobre un build servido, usar node scripts/branding/visual-qa.mjs con los mismos argumentos. BRAND_ORIGIN debe incluir /med3d/ y BRAND_OUTPUT define la carpeta de capturas. Por defecto usa http://127.0.0.1:5184/med3d/.
4. Revisar también los dos wordmarks secundarios, el menú móvil y los recursos para compartir. Tras un nuevo cambio de iconos, actualizar la versión de los enlaces en index.html, app-meta.json y site.webmanifest.
5. La publicación normal es main → deploy-pages.yml → GitHub Pages. Confirmar SHA del workflow, éxito de build/deploy y versión pública; un push por sí solo no acredita el despliegue.

## Pendientes y límites heredados

- La clasificación ENVIRONMENT_BLOCKED del rendimiento/aceptación física de tracking XR sigue vigente. Este cierre visual no la resuelve ni altera parámetros; consultar xr-tracking-performance.md y la documentación de aceptación gestual.
- Mantener futuras pruebas en webcam/GPU/dispositivos físicos separadas de la QA con cámara simulada y Chromium automatizado.
- El aviso de tamaño de chunks y los recursos de microanatomía grandes pueden abordarse en una iteración de rendimiento autorizada.
- La cobertura anatómica y sus límites siguen descritos en la documentación del completado no femenino; no se declara completitud clínica por este release.
- Los servicios sociales pueden conservar una previsualización en caché pese a la nueva URL versionada; los archivos públicos se verifican directamente por hash.
