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

## Rendimiento y modelos

El inicio descarga sólo el corazón (715.820 bytes). Los demás órganos se solicitan al elegirlos; el conjunto completo suma 6.603.880 bytes. GLB comprimidos con Meshopt, carga diferida del visor y densidad de píxeles limitada. El rendimiento 3D depende también del dispositivo.

## Alcance y atribuciones

Tres órganos y una envolvente de piel, 355 mallas anatómicas, 23 fichas explicativas curadas. Dos escenas esquemáticas: RCP de adultos y medición de presión arterial; el resto del contenido identifica su estado de preparación. Material educativo sin validación clínica, no sustituye formación práctica ni atención sanitaria.

Modelos HRA / HuBMAP bajo CC BY 4.0. Consulta `docs/model-licenses.md` y `public/models/LICENSE.txt` para fuentes, licencias y transformaciones. Las ilustraciones fueron creadas para MED3D con Higgsfield.
