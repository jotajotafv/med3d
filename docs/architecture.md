# MED3D: arquitectura de producto y primera versión

Revisión documental: 14 de septiembre de 2026. Nombre provisional: MED3D.

Este documento distingue la primera versión de las ampliaciones propuestas. MED3D es una plataforma educativa; sus modelos, escenas y textos no tienen validación clínica. Las referencias enlazadas no implican revisión ni aval institucional.

## 1. Identidad y propósito

Permitir que el usuario relacione anatomía, observación de procedimientos y primeros auxilios mediante una interfaz web en español. El diseño prioriza controles comprensibles, jerarquía editorial, contexto de cada recurso y transparencia sobre la cobertura.

## 2. Áreas de producto

| Área | Intención | Experiencia |
| --- | --- | --- |
| Explorar | Comprender ubicación y relaciones | Atlas anatómico 3D |
| Observar | Entender una secuencia | Procedimientos con pasos y escenas |
| Responder | Consultar pautas iniciales | Guías de primeros auxilios para adultos |

## 3. Rutas

| Ruta | Función |
| --- | --- |
| / | Inicio y acceso a las tres áreas |
| /anatomia | Atlas 3D |
| /procedimientos | Catálogo de procedimientos |
| /procedimientos/:id | Detalle educativo de procedimiento |
| /primeros-auxilios | Catálogo de primeros auxilios |
| /primeros-auxilios/:id | Guía y escena cuando exista |
| /acerca | Alcance, referencias y atribución |
| /arquitectura | Propuesta y hoja de ruta |

Los identificadores de detalle deben ser estables. Un identificador desconocido debe mostrar un estado explícito y permitir volver al catálogo.

## 4. Inicio

Portada anatómica editorial con acceso directo al atlas y entradas a procedimientos y primeros auxilios. Las ilustraciones de portada y tarjetas son recursos visuales. La interacción anatómica se ofrece en el visor y debe mantenerse separada de cualquier ilustración generada.

## 5. Atlas

Controles previstos: rotación orbital, zoom, reinicio de cámara, búsqueda, árbol por sistemas y estructuras, selección por raycasting, ficha informativa, visibilidad, aislamiento, piel orientativa y separación.

Primera cobertura: corazón, pulmones y encéfalo, correspondientes a tres sistemas. Los recursos son modelos parciales; no componen un atlas humano completo. La envolvente de piel es una referencia espacial esquemática.

La ficha debe comunicar nombre, sistema, región, descripción, fuente y licencia. La selección del árbol y la del visor deben resolver el mismo identificador.

## 6. Procedimientos

Secuencia de pasos con una línea de tiempo común para escena, texto y cámara. Primera escena: preparación y fundamentos de medición de presión arterial con un maniquí esquemático.

No se debe inferir precisión asistencial a partir de una animación. Las guías deben indicar alcance, preparación, secuencia y fuentes, sin presentar las escenas como sustituto de práctica supervisada.

## 7. Primeros auxilios

Catálogo por situación, con guías enfocadas en adultos y referencias. RCP dispone de una representación esquemática educativa. Las otras siete categorías de primeros auxilios contienen guías, con visualizaciones adicionales en desarrollo. El catálogo de procedimientos añade guías de signos vitales, vendaje e inmovilización, también con visualizaciones en desarrollo.

Los avisos de emergencias deben ser claros y compatibles con la ubicación desconocida del usuario: contactar con el número local de emergencias. No asumir un número universal ni retrasar el contacto por completar una escena.

## 8. Tecnología

| Capa | Elección |
| --- | --- |
| Interfaz | React 19 y TypeScript |
| Rutas y documento | TanStack Router |
| Construcción | Vite |
| Publicación | GitHub Pages, desde Higgsfield |
| Motor 3D | Three.js |
| Integración React | React Three Fiber y Drei |
| Estado del visor | Estado local de React en esta versión; Zustand previsto para coordinación entre sistemas |
| Recursos | GLB con trazabilidad |

El documento y los catálogos admiten renderizado de servidor; los lienzos WebGL se montan en el cliente. Es preciso evitar acceso a window/document durante la evaluación en servidor.

## 9. Organización del código

- src/routes: composición por URL.
- src/features/anatomy: visor, selección, controles y estado anatómico.
- src/features/learning: catálogos, guías y escenas educativas.
- src/features/home: portada y acceso a las áreas.
- src/features/about: alcance, fuentes y arquitectura.
- src/components: elementos compartidos entre áreas.
- src/data: registros de contenido y referencias cuando sean compartidos.
- src/services y src/config: puntos de extracción propuestos para carga y configuración a medida que crezca el proyecto.
- scenes y animations dentro de cada función: escenas, control temporal y movimientos; se extraerán sólo cuando exista reutilización real.

La estructura lógica propuesta no obliga a crear carpetas vacías. Los límites reales deben seguir las responsabilidades de las funciones implementadas.

## 10. Contrato del manifiesto anatómico

Ejemplo de contrato extensible propuesto; debe adaptarse a la estructura concreta del registro implementado:

```ts
type Vector3Tuple = [number, number, number];

interface AnatomicalStructure {
  id: string;
  label: string;
  latinLabel?: string;
  systemId: string;
  regionId: string;
  parentId?: string;
  model: {
    url: string;
    nodeBindings: string[];
  };
  restTransform: {
    position: Vector3Tuple;
    rotation: Vector3Tuple;
    scale: Vector3Tuple;
  };
  explodeVector: Vector3Tuple;
  metadata: {
    summary: string;
    coverage: 'partial' | 'complete' | 'schematic';
    sources: Array<{ title: string; url: string; reviewedAt?: string }>;
    author: string;
    license: { name: string; url: string };
    modifications?: string[];
  };
}
```

El nombre visible puede cambiar sin alterar el ID. Los nodos GLB se vinculan explícitamente; no se debe depender de nombres derivados de una traducción. No usar este contrato de ejemplo como declaración de que todos los metadatos están ya implementados.

## 11. Modelos y carga

Carga modular por órgano o sistema, con estados de espera, éxito, recurso no disponible y error. Conservar recursos compartidos durante su uso y liberar geometrías, materiales y texturas cuando dejan de utilizarse.

Optimización aplicada: compresión Meshopt de los cuatro GLB, conservando nombres y jerarquía, hasta un total de 6.603.880 bytes. Propuesta posterior: evaluar KTX2 si hay texturas significativas y añadir niveles de detalle si los perfiles reales los justifican. Cualquier compresión exige comprobar nombres de nodos, apariencia, selección y licencia. No declarar mejoras de rendimiento antes de medirlas.

## 12. Despiece reversible

Jerarquía conceptual: cuerpo, sistema, órgano. Cada estructura conserva una transformación de reposo inmutable. La separación de un órgano se calcula con:

```ts
position = restPosition + easedAmount * explodeVector;
```

El valor común está acotado y su interpolación debe poder volver exactamente a la posición de reposo. La actualización no debe sumar desplazamientos sobre la posición del fotograma anterior. Aislamiento y visibilidad deben conservar la selección y ofrecer una forma clara de restablecerla.

## 13. Animación y Higgsfield

Un tiempo maestro gobierna estados, posiciones y paso activo. Pausar detiene todo el movimiento; buscar en la línea de tiempo reconstruye el estado de forma determinista.

La primera versión emplea maniquíes y movimientos programáticos, de carácter esquemático. Los rigs y clips de mayor detalle son una fase posterior sujeta a revisión. Higgsfield aporta herramientas para desarrollo, recursos visuales de portada/tarjetas y publicación. Las imágenes generadas no se convierten en fuentes anatómicas ni sustituyen modelos GLB con procedencia.

## 14. Rendimiento, accesibilidad y fiabilidad

Objetivos de ingeniería, no resultados medidos:

- Renderizado bajo demanda cuando la escena está en reposo.
- Densidad de píxel del visor acotada a 1,5 como política inicial.
- Carga por módulo y ausencia de descargas duplicadas innecesarias.
- Cancelar respuestas obsoletas y limpiar recursos al desmontar.
- Pausar la animación cuando corresponda; respetar movimiento reducido.
- Controles nativos operables con teclado, foco visible, nombres accesibles y texto legible.
- Mensaje de carga y estado de recuperación ante error o WebGL no disponible.
- Diseño adaptable sin desplazamiento horizontal no intencionado.

No se fijan cifras de FPS o tiempo de carga como resultados hasta completar perfiles en equipos, redes y navegadores identificados.

## 15. Hoja de ruta y aceptación

### Primera versión

Tres órganos de referencia, capa de piel orientativa, selección y controles del visor; escena educativa de presión arterial, RCP esquemática y guías. Fuentes y alcance accesibles desde las experiencias.

### Siguiente fase

Ampliar cobertura por sistemas, documentar cada recurso y someter el contenido y las representaciones a revisión anatómica y asistencial. Mejorar carga y memoria según mediciones.

### Evolución propuesta

Escenas y rigs revisados, actividades de aprendizaje, seguimiento voluntario de progreso y evaluación de usabilidad. Estas funciones no se presentan como disponibles.

### Criterios de aceptación

1. Las rutas principales y de detalle se abren directamente y la navegación conserva contexto.
2. El atlas carga los tres recursos declarados o muestra un error recuperable.
3. Selección por visor, árbol y búsqueda resuelve la misma estructura.
4. Ocultar, aislar, separar y restablecer tienen efectos coherentes y reversibles.
5. Reproducir, pausar y buscar mantienen sincronizados escena y texto.
6. La guía de RCP identifica explícitamente su alcance adulto y carácter esquemático.
7. Las escenas no implementadas se identifican como tales.
8. Fuentes, autoría, licencia y limitaciones están visibles.
9. Se comprueban escritorio y móvil, lectura, foco de teclado y ausencia de errores críticos de consola.
10. La construcción y la comprobación de tipos finalizan sin errores.

## Recursos, atribución y riesgos

Modelos anatómicos: [Human Reference Atlas / HuBMAP, CCF 3D Reference Object Library](https://github.com/hubmapconsortium/ccf-3d-reference-object-library), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). La presentación en MED3D puede adaptar posición, escala y materiales. Preservar atribución, enlace a licencia y declaración de modificaciones; verificar la licencia específica de cada nuevo recurso.

Referencias educativas:

- [AHA 2025: Adult Basic Life Support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support).
- [AHA: Monitoring Your Blood Pressure at Home](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/monitoring-your-blood-pressure-at-home).
- [NHS: First aid](https://www.nhs.uk/conditions/first-aid/).
- [American Red Cross: First aid](https://www.redcross.org/take-a-class/first-aid).

Riesgos concretos: cobertura anatómica incompleta; diferencias entre el modelo de referencia y una anatomía individual; percepción de precisión superior a una escena esquemática; cambios en guías clínicas; pérdida de contexto por traducción; GPU y memoria limitadas; enlaces o recursos externos no disponibles. Mitigar con alcance visible, fuentes fechadas, revisión experta, recursos versionados, controles accesibles y pruebas en dispositivos reales.

No cargar nuevos modelos sin verificar sus derechos de uso. La presencia de una marca, un enlace o una fuente no implica certificación ni aval de MED3D.
