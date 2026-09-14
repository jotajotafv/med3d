# MED3D

Plataforma educativa en español con anatomía 3D interactiva, procedimientos y primeros auxilios.

## Desarrollo

Requiere Node.js 22 o posterior.

```sh
npm ci
npm run dev
```

La ruta base predeterminada es `/med3d/` para el repositorio `jotajotafv/med3d`.

```sh
npm run build
npm run typecheck
```

`dist/` contiene la web estática y 18 rutas que se pueden abrir directamente.

## GitHub Pages

En Settings → Pages, elige GitHub Actions como origen. El flujo de `.github/workflows/` compila y publica los cambios de `main`. La publicación requiere configurar Pages y sólo se considera desplegada tras una ejecución de despliegue exitosa.

GitHub Pages se ofrece sin coste adicional para repositorios públicos en GitHub Free. Un repositorio privado requiere un plan compatible o hacerlo público. Los visitantes de una publicación pública no necesitan iniciar sesión.

Para otro alojamiento estático cambia `BASE_PATH` y `SITE_ORIGIN` al compilar; el valor predeterminado es `https://jotajotafv.github.io/med3d/`.

## Núcleo anatómico · segunda fase

`/anatomia/` abre el atlas óseo modular. Conserva los órganos anteriores mediante `?organ=heart`, `?organ=lungs` y `?organ=brain`.

- BodyParts3D 4.0: 199 huesos convencionales y 4 sesamoideos accesorios; 205 mallas seleccionables en 7 GLB.
- Búsqueda común/anatómica/latina, árbol virtualizado, regiones bajo demanda, aislamiento, ocultación, opacidad por sistema y despiece jerárquico suave.
- Fase 2.1: veinte fichas individuales para los principales huesos, seis vistas anatómicas, encuadre adaptado a estructuras pequeñas y controles legibles. Las fichas de familia siguen disponibles como contenido general identificado.
- Faltan cóccix y seis huesecillos auditivos en el cuerpo registrado. Las fuentes adicionales están identificadas; su alineación y lateralidad requieren revisión antes de incorporarlas. No se declara un esqueleto de 206 huesos completo.
- Procedimientos y primeros auxilios conservan sus prototipos existentes.

Consulta `docs/phase2-audit.md`, `docs/phase2-architecture.md`, `docs/phase2-missing-bones.md` y `scripts/anatomy/README.md`.

La validación de la fase 2.1 se documenta en `docs/phase2.1-validation.md`. El flujo `anatomy-visual-validation.yml` ejecuta pruebas funcionales, produce capturas reproducibles y mide el navegador disponible. La inspección visual y las pruebas en hardware físico se registran por separado.

## Rendimiento y modelos

El atlas óseo solicita siete módulos regionales, con un máximo de dos descargas simultáneas. Los órganos anteriores se cargan al elegirlos: el corazón ocupa 715.820 bytes y el conjunto de órganos y piel suma 6.603.880 bytes. GLB comprimidos con Meshopt, carga diferida del visor y densidad de píxeles limitada. El rendimiento 3D depende también del dispositivo.

## Alcance y atribuciones

Modelos óseos BodyParts3D / DBCLS bajo CC BY 4.0: atribución, versiones, fuente, hashes y modificaciones en `public/models/anatomy/skeletal/`. Siete módulos suman 3.916.940 bytes y 512.450 triángulos; dos cargas concurrentes, liberación de regiones inactivas y renderizado bajo demanda.

Además se conservan tres órganos y una envolvente de piel, 355 mallas anatómicas, 23 fichas explicativas curadas. Dos escenas esquemáticas: RCP de adultos y medición de presión arterial; el resto del contenido identifica su estado de preparación. Material educativo sin validación clínica, no sustituye formación práctica ni atención sanitaria.

Modelos HRA / HuBMAP bajo CC BY 4.0. Consulta `docs/model-licenses.md` y `public/models/LICENSE.txt` para fuentes, licencias y transformaciones. Las ilustraciones fueron creadas para MED3D con Higgsfield.
