# Fase 7 — entrega local

**Cobertura digestiva macroscópica integrada disponible**, sobre el cierre respiratorio. [Auditoría](phase7-audit.md), [fuentes](phase7-sources.md), [registro](phase7-registration.md), [educación](phase7-education.md), [validación](phase7-validation.md), [rendimiento](phase7-performance.md). El historial anterior se referencia en [Fase 6](phase6-delivery.md), sin copiar sus informes.

| # | Punto | Resultado |
|---:|---|---|
| 1 | Rama | `phase7-digestive` |
| 2 | SHA base | `de933729f4fac05896c8d5d5a5a151f46ce1f515` |
| 3 | Fuentes auditadas | BP3D 4.0; comparación oficial 4.3; alcance local HRA/HuBMAP y Z-Anatomy. |
| 4 | Fuentes usadas | Sólo BodyParts3D 4.0 OBJ99. |
| 5 | Licencias | CC BY 4.0, DBCLS; originales conservan aviso histórico. 4.3 no integrada. |
| 6 | Región oral | Lengua oral muscular única y cuatro glándulas; cavidad completa pendiente. |
| 7 | Faringe | Pendiente; no se fabricó conexión oral–esófago. |
| 8 | Esófago | FMA7131/FJ2563, seleccionable, aislable y enfocable. |
| 9 | Estómago | FMA7148/FJ2564; sin subdivisiones inventadas. |
| 10 | Duodeno | FMA7206/FJ2573. |
| 11 | Yeyuno | FMA7207 agregado con tres porciones fuente. |
| 12 | Íleon | FMA7208 agregado con tres porciones; unión ileocecal FMA11338 separada. |
| 13 | Ciego | Órgano completo pendiente; FJ2599 se identifica como unión ileocecal. |
| 14 | Apéndice | FMA14542/FJ2565. |
| 15 | Colon | Ascendente, transverso y descendente; sigmoide separado pendiente. |
| 16 | Recto | FMA14544/FJ2571; canal anal independiente pendiente. |
| 17 | Hígado | FMA7197 con ocho piezas; sin segmentación I–VIII expuesta por discrepancia fuente. |
| 18 | Vesícula | FMA7202/FJ2817. |
| 19 | Vías biliares | Cístico, hepático común, hepáticos derecho/izquierdo y tributarias; colédoco separado pendiente. |
| 20 | Páncreas | FMA7198/FJ1895 y conducto FMA10419/FJ1896; sin duplicados ni cortes. |
| 21 | Glándulas salivales | Submandibulares y sublinguales bilaterales; parótidas pendientes. |
| 22 | Pendientes | 13 filas aplazadas; 8 descartadas, con motivos en auditoría. No bloquean cobertura macroscópica útil. |
| 23 | Unidades anatómicas | 23 de nivel estructural; 38 unidades de selección auditadas aprobadas (no 38 órganos). |
| 24 | Componentes | 17; 50 nodos digestivos incluyendo 10 grupos/sistema/regiones. |
| 25 | Mallas | 96 nuevas; owners únicos y sin FJ históricos duplicados. |
| 26 | Triángulos | 177240 nuevos; 2901316 con seis sistemas. |
| 27 | Bytes GLB | 1641196 nuevos; 26770864 con seis sistemas. |
| 28 | Módulos | digestive:upper, stomach-accessory, small-intestine, large-intestine. |
| 29 | Hashes | Por OBJ y GLB en manifiesto/lock e informe de registro; originales SHA-256 `db524203d0414b7d7f9031e49dc98d53ebb5e0451fcfd1982cd2ffe6c15d3398`. |
| 30 | Transformación | `(x,y,z) → (x,z,-y)/1000`; bodyparts3d-4.0-male. |
| 31 | Registro adicional | Ninguno. 4.3 auditada y excluida. |
| 32 | Error geométrico | 6.007136616829016e-08 m máximo; todos los triángulos/orientaciones conservados; glTF 0 errores/advertencias. |
| 33 | Catálogo final | Seis sistemas; 922 nodos, 45 módulos y 898 mallas. |
| 34 | Total de estructuras corporales | 550 unidades de nivel estructural; no equivale a 550 órganos ni a anatomía completa. |
| 35 | Búsqueda | Español, latín, alias, FMA/FJ e IDs; seis sistemas y órganos independientes. |
| 36 | Árbol | Virtualización, ARIA, teclado, ancestros y selección verificados. |
| 37 | Capas | Seis sistemas independientes; módulos, descarga/recarga y recuperación. |
| 38 | Transparencia | Digestivo 100/75/50/25 %, contexto atenuado, DoubleSide/depthTest y depthWrite=false bajo 100 %. |
| 39 | Selección | Raycast real, hover y cian, sin proxies geométricos. |
| 40 | Aislamiento | Órgano, segmento, grupo y sistema; ocultación/restauración verificadas. |
| 41 | Contexto | Relaciones explícitas curadas; reutiliza vasos hepáticos y gástricos existentes. |
| 42 | Fichas | Arquitectura DigestiveInformation; fuentes enlazadas y limitaciones por familia. |
| 43 | Exploded View | Seis sistemas, cuatro bloques regionales; órganos y segmentos coherentes; cero exacto. |
| 44 | Cámara | Seis orientaciones; encuadres de órganos prioritarios y recto, sin clipping grave del objetivo. |
| 45 | Rendimiento | 8 configuraciones SwiftShader. Digestivo: primera 199.8 / completa 224.6 ms. Seis sistemas: 210.2 / 2299.6 ms; no GPU física. |
| 46 | Pruebas específicas | Catálogo, identidad, geometría, contexto, búsquedas, despiece, WebGL y responsive: PASS. |
| 47 | Regresión global | Una batería global en 079a715; checks dirigidos tras la corrección y revisión visual final: PASS, con SHA de cada ejecución conservado. |
| 48 | Capturas | 30 nuevas finales; no se repite el inventario fotográfico histórico. |
| 49 | Revisión visual | 30 revisadas; ver observaciones individuales y hashes. Sin validación clínica. |
| 50 | Bugs/riesgos corregidos | Duplicación potencial pancreática/hepática, falsa identificación del ciego y segmentación hepática dudosa evitadas en auditoría; contexto pélvico usa IDs reales; región editorial del estómago corregida sin clasificarlo como órgano accesorio, y selección previa de capturas restaurada. Plazos de automatización ampliados sin retirar aserciones; animación corregida para no prolongarse artificialmente al caer la frecuencia de fotogramas. |
| 51 | Limitaciones | Ausencias declaradas, costuras/huecos originales, oclusión y transparencia convencional; no microanatomía ni continuidad fabricada. Con seis capas transparentes, el ciclo de Despiece tarda 27–49 s en SwiftShader; usar capas selectivas/aislamiento en este entorno. |
| 52 | SHA código | `bd0394ef1a2f94377c10eb384e02997cb890aaf6` |
| 53 | SHA documental | HEAD del commit documental separado; valor exacto en recibo externo y respuesta final para evitar autorreferencia circular. |
| 54 | Working tree | Se exige limpio antes de crear el bundle; resultado exacto en recibo final. |
| 55 | main / origin/main | `84b4c9ababb9b1360a09ec03c77c96d0b7c748e6`, intactas. |
| 56 | Ramas históricas | Todas conservadas según protected-refs.json; phase11-first-aid sigue en a391093cd28b975673fd0fc1e6b87fa1aeafed29. |
| 57 | Push | No realizado. |
| 58 | Merge | No realizado. |
| 59 | Bundle | `C:\Users\jotaj\Desktop\MED3D_TRANSFER\med3d-phase7.bundle`; historia completa, sin sobrescribir anteriores. |
| 60 | Tamaño bundle | Valor final en `med3d-phase7.bundle.json` externo y respuesta final. |
| 61 | SHA-256 bundle | Valor final en el mismo recibo; verificación Git obligatoria antes de entrega. |
| 62 | Conclusión | Fase 7 cerrada localmente para revisión: cobertura digestiva macroscópica útil, trazable y estable. Sin despliegue ni Fase 8. |

Se mantienen intactos Home, Procedimientos, Primeros Auxilios, catálogos y GLB históricos. Commits de código: implementación `079a7155f3d69be4b2b7ff5b7aca7ca35d6bf7f1` y única corrección `bd0394ef1a2f94377c10eb384e02997cb890aaf6`. El commit documental sólo contiene `docs/` y su padre debe ser el SHA de código probado. El recibo externo se genera después de ese commit y de `git bundle verify`; conserva HEAD, padre, alcance documental, limpieza, refs, tamaño y hash del bundle sin pretender incluir su propio hash dentro de Git.
