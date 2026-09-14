# Validación de la edición GitHub Pages

Validado el 14 de septiembre de 2026: instalación con lockfile, compilación de producción con Node.js 22, TypeScript sin errores y 18 rutas estáticas con respuesta HTTP 200. Chromium a 1440 por 900 mostró portada y canvas sin errores JavaScript ni desbordamiento horizontal. El inicio solicitó exclusivamente /med3d/models/heart.glb (HTTP 200); todos los enlaces internos respetaron /med3d/.

Estas pruebas corresponden a la compilación local; la publicación sólo se confirma tras un despliegue exitoso en GitHub Pages. La portada solicita sólo el corazón; pulmones, encéfalo y conjunto se solicitan al elegirlos. El tamaño total de los cuatro GLB es 6.603.880 bytes. Fuentes y licencias se conservan en model-licenses.md y el manifiesto de modelos.
