# MED3D · entrega del rediseño de Inicio

Fecha: 6 de octubre de 2026. Rama: `phase-home-redesign`.
Base publicada observada: `414d171a28fade7d013c04965caef80d8ff28d0e` (`main` y `origin/main` coincidían). El producto estaba limpio antes de crear la rama.

## Objetivo y referencias

Se utilizaron las cuatro imágenes adjuntas «Imagen de ChatGPT 6 oct 2026», terminadas en `06_05_11 p.m-1.png`, `06_05_12 p.m-2.png`, `06_05_13 p.m-3.png` y `06_05_14 p.m-4.png`.

La composición recoge su fondo casi negro, figura anatómica central, titular blanco superpuesto, aire lateral, círculos orbitales, conectores finos y CTA de borde. Frente a las referencias 1 y 2 se mantienen órganos y anotaciones discretas; frente a la 3 se conserva la escala editorial del texto; la 4 guía la continuidad durante el giro posterior. Se adaptó la forma real disponible: no se copiaron los píxeles ni se generó anatomía.

Desaparece la composición anterior de texto lateral y visor en tarjeta. Se conservan las secciones educativas inferiores y sus enlaces, con transición cromática al negro. Ninguna otra página se rediseñó.

## Archivos y arquitectura

- `src/features/home/HomeHero.tsx`: composición, SVG, CTA, pausa, preferencia de movimiento, visibilidad y límite de errores local.
- `src/features/home/HomeAnatomyScene.tsx`: escena Three.js cargada con React.lazy, cámara ortográfica, loader cancelable y materiales exclusivos.
- `src/features/home/hero.css`: presentación del hero y cabecera sólo en Inicio.
- `src/features/home/HomePage.tsx`: sustituye AnatomyHero por HomeHero.
- `src/features/home/home.css`: retira las reglas antiguas del hero y conserva el ancho del contenido inferior.
- `src/components/SiteHeader.tsx`: añade una clase condicional para Inicio; conserva rutas, menú y comportamiento existentes.
- Este único documento de entrega.

Cada GLB se decodifica en una escena independiente, sin caché ni materiales compartidos con el atlas. Se conservan transformaciones, geometrías y registro fuente. Al desmontar se cancelan descargas y se liberan geometrías, materiales, renderer y contexto. No hay dependencias nuevas declaradas, vídeos, modelos descargados ni cambios en catálogos, GLB o licencias.

## Modelo y rendimiento

Selección de BodyParts3D ya registrada en MED3D, bajo `public/models/anatomy/`:

| Módulos | Archivos |
| --- | --- |
| Silueta inicial | integumentary/skin.glb |
| Órganos | nervous/cns.glb, respiratory/lungs.glb, cardiovascular/heart.glb |
| Huesos | skeletal/skull.glb, skeletal/thorax.glb |
| Musculatura | muscular-neck, muscular-torso-anterior, muscular-abdomen, muscular-upper-left/right, muscular-forearm-left/right |

Total: **13 GLB, 14.077.856 bytes, 225 mallas, 1.572.292 triángulos y 225 draw calls** en el encuadre revisado. Primero se descarga la piel (1.631.504 bytes); después, como máximo dos módulos simultáneos. Los 11 sistemas completos no se cargan. Cuello y abdomen se incorporaron tras la revisión inicial para dar continuidad visual sin cargar miembros inferiores ni toda la musculatura posterior.

Build local de producción, Chrome con Intel UHD / ANGLE D3D11, 1366 × 768 y DPR 1: primera geometría a **93 ms** y todos los módulos a **435 ms**, medidos desde la creación de la escena. Una muestra de cuatro segundos dio **28,6 fps**, con límite deliberado de 30 fps. Son medidas de servidor local, sin latencia WAN. SwiftShader produjo aproximadamente 2,3 fps: la aceleración gráfica afecta materialmente a esta escena.

El módulo específico HomeAnatomyScene pesa 6,58 kB (2,99 kB gzip); utiliza Three compartido, 746,27 kB (191,99 kB gzip), y el bloque común de carga/decodificación, 72,23 kB (21,21 kB gzip). No se atribuye todo este código compartido a JS nuevo. DPR limitado a 1,25 en escritorio y 1 en móvil; sin sombras ni posprocesado. La renderización continua se detiene al pausar, reducir movimiento, ocultar la pestaña o sacar el hero del viewport.

## Movimiento, etiquetas y navegación

Giro por delta temporal alrededor del eje Y, 2π/40 radianes por segundo: una vuelta cada 40 segundos de render activo. Se limita el delta de un frame a 200 ms para evitar saltos tras un bloqueo; en render muy lento la vuelta puede durar más. La pausa es accesible por teclado. No se añadieron zoom, reset, gizmos ni arrastre.

`prefers-reduced-motion` se consulta al iniciar y al cambiar: conserva un ángulo fijo, retira el control de movimiento y elimina transiciones. Resize y carga progresiva siguen actualizando la escena estática.

Etiquetas: **ENCÉFALO, PULMONES, CORAZÓN y SISTEMA MUSCULAR**. Sus puntos parten de coordenadas dentro de límites registrados del cerebro, pulmón izquierdo, corazón y deltoides izquierdo; se proyectan de nuevo con cada frame y resize. Son decorativas y están fuera del árbol accesible. No se afirma seguimiento de superficies ni oclusión anatómica de las anotaciones.

Se mantienen MED3D, Inicio, Anatomía 3D, Procedimientos, Primeros auxilios, Acerca del proyecto y Abrir atlas. «Explorar ahora» conduce a `/anatomia/`, respetando el prefijo de despliegue existente `/med3d/`.

## Revisión visual y pruebas

Capturas locales del build final en `.cache/home-redesign/` (excluidas del commit):

- `01-desktop-front.png`, `02-desktop-rotation.png`, `03-desktop-posterior.png`.
- `04-tablet-1050.png`, `05-tablet-900.png`, `06-mobile-390.png`.
- `07-wide-1920.png`, `08-reduced-motion.png`.
- Métricas auxiliares: `validation.json`, también sólo local.

Se revisaron 1366 × 768, 1050 × 844, 900 × 1100 y 390 × 844; también 1920 × 1080. Sin desbordamiento horizontal; CTA dentro del primer viewport. Cuatro etiquetas en escritorio, tres a 900 px y dos en móvil. En móvil el titular ocupa tres líneas y se conserva el cuerpo completo dentro de la composición vertical. La figura permanece integrada en el fondo y las líneas no compiten con el titular. Las transparencias reales son menos densas y uniformes que las ilustraciones de referencia, especialmente desde atrás.

Comprobado en navegador: pausa/reanudación, reduced-motion inicial y dinámico, suspensión fuera del viewport, resize, menú móvil, Escape con devolución del foco, foco visible del CTA, apertura real del atlas y navegación a las tres páginas restantes. Ante HTTP 503 de la piel se informa del fallo y el CTA continúa disponible. El CSS de Inicio no aparece como cabecera activa en las rutas internas.

- `npm run typecheck`: correcto.
- `npm run build`: correcto; 18 rutas estáticas. Aviso de Vite por el chunk compartido de Three superior a 500 kB.
- `npm run verify:anatomy`: correcto, ejecutado una sola vez.
- `git diff --check`: correcto.

Windows bloqueó el binario nativo de Rollup. Las verificaciones se ejecutaron con la alternativa oficial `@rollup/wasm-node@4.63.2` y un adaptador únicamente en `.cache/home-redesign/`; package.json y package-lock.json permanecen intactos. Para repetir en este equipo: establecer `NODE_OPTIONS=--require ./.cache/home-redesign/rollup-wasm.cjs` antes de los comandos de Vite. Esta adaptación no forma parte del producto.

## Limitaciones y cierre

La descarga completa sigue siendo de 14,08 MB; la aparición rápida de la piel no equivale a carga completa rápida en redes lentas. La prueba móvil usa viewport emulado, no un teléfono físico. No se verificaron otros navegadores. El recorte editorial termina en los muslos en escritorio; es encuadre, no modificación de geometría. Los solapes y la cobertura parcial de la fuente se conservan. Si falta WebGL o se pierde el contexto, el texto y los enlaces siguen operativos; recargar permite reintentar.

Entrega local exclusivamente. Sin push, merge ni deploy. Los temporales preexistentes de .cache/phase10-deploy/ permanecen intactos.
