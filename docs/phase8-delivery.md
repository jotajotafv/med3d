# Fase 8 · entrega local

**FASE 8 cerrada localmente para revisión.** Rama `phase8-internal-systems`, base `beeed24e810dc69f23a4e71451241c4bf95139a7`, implementación `180176698318941263a40c8da89f82c321e3456d` y HEAD de código final `312300bb8c047f28bfd442d073af54880953c77a` (corrección exclusiva del arnés). Este documento y las evidencias se guardan en un commit documental separado, cuyo SHA se informa en el recibo externo del bundle y en la entrega final para evitar una autorreferencia imposible.

| Sistema nuevo | Unidades estructurales | Componentes | Mallas | Triángulos | Bytes GLB |
|---|---:|---:|---:|---:|---:|
| Sistema urinario | 6 | 0 | 6 | 9944 | 94872 |
| Sistema endocrino | 9 | 3 | 11 | 20166 | 467728 |
| Sistema linfático / inmunitario | 2 | 2 | 3 | 3410 | 35160 |
| Sistema reproductor masculino | 10 | 3 | 12 | 7184 | 93996 |

27 unidades nuevas y 8 componentes, 32 mallas, 40.704 triángulos, 691.756 bytes GLB. Cinco módulos: `urinary:organs`, `endocrine:glands`, `endocrine:thyroid43`, `lymphatic:central`, `reproductive:male`. Catálogo final: 10 sistemas, 577 estructuras, 970 nodos, 930 mallas y 50 módulos.

Urinario: riñones, uréteres, vejiga y uretra masculina. Endocrino: hipófisis, pineal, suprarrenales, tiroides y cuatro paratiroides. Linfático/inmunitario: bazo y timo bilobulado; no una red linfática completa. Reproductor masculino: testículos, epidídimos, deferentes, vesículas seminales, próstata y componentes peneanos. El atlas femenino queda como expansión futura con marco propio; no se mezcla con el cuerpo masculino.

Fuente integrada: BodyParts3D 4.0 (25 OBJ, CC BY 4.0 según archivo actual) y 4.3 cervical (7 OBJ, CC BY-SA 2.1 Japan conservada). Transformación común `(x,y,z) → (x,z,-y)/1000`. Dos controles cervicales idénticos, ninguna recolocación manual. Posiciones Float32/Meshopt; conservación de todos los triángulos orientados. Error numérico máximo 5.98353750134e-08 m, sin pretensión clínica. Hashes por original y módulo en los manifiestos y [registro](phase8-registration.md).

Búsqueda española/latina/alias/FMA/FJ/ID, árbol virtualizado, diez capas independientes, transparencia, aislamiento y contexto por IDs existentes. Fichas nuevas compartidas con especialización para órganos; las anteriores no se reescriben. Despiece Sistemas/Regiones/Estructuras, cero exacto. Panel probado a 1366/1050/900/390; sólo cambia el rótulo superior para alojar diez sistemas.

Correcciones: la búsqueda ahora indexa directamente el ID interno sin depender de que aparezca también como alias; los rótulos Linfático/Reproductor describen la cobertura real; el arnés de raycast verifica selección real en vez de asumir que hover garantiza clic. El commit correctivo mantiene las capturas de los cuatro sistemas acotadas a sus 32 mallas. Ningún cambio de contenidos en Home, Primeros Auxilios o Procedimientos. No se modificaron activos históricos.

Validación específica incremental y una campaña global final: [validación](phase8-validation.md). 35 capturas finales revisadas: [galería e incidencias](phase8/visual-review.md). Ocho configuraciones útiles medidas sólo con SwiftShader: [rendimiento](phase8-performance.md).

Pendientes: partes renales internas, islotes pancreáticos, ganglios/amígdalas/vasos y conductos linfáticos, conductos eyaculadores, bulbouretrales y escroto separado, reproductor femenino. Pene parcial, cuerpo cavernoso sin lateralidad inventada; superficies originales y variación anatómica conservadas. Páncreas y gonadas tienen un único propietario.

Main y origin/main permanecen en `beeed24e810dc69f23a4e71451241c4bf95139a7`; ramas históricas verificadas contra el estado inicial ([referencias](phase8/protected-refs.json)). Sólo se realizó el fast-forward inicial autorizado antes de crear la rama. Sin merge posterior, cherry-pick, push ni despliegue.

Bundle previsto tras el commit documental y con árbol limpio: `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase8.bundle`, con toda la historia (`--all`), sin sobrescribir anteriores. Su verificación, tamaño, SHA-256 y HEAD documental quedan en `med3d-phase8.bundle.json` junto al bundle y en la respuesta final. No se inicia Fase 9. La latencia completa varió entre 1,91 s en navegador nuevo y 84–116 s en secuencias de este entorno SwiftShader; queda documentada sin afirmar rendimiento de hardware físico.
