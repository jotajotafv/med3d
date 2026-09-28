# Fase 4 expandida: registro reproducible

El marco sigue siendo `bodyparts3d-4.0-male`. Los OBJ BP3D históricos mantienen exactamente `(x, y, z) → (x, z, -y) / 1000`; no se reconstruyeron ni movieron. Las nuevas matrices transforman coordenadas mundo Z-Anatomy, expresadas en metros, al marco MED3D.

49 centros de bounds de huesos homólogos inicializan una similitud Kabsch propia. Son referencias geométricas reproducibles, **no landmarks clínicos anotados**. Incluyen cráneo, C1–L5, sacro, clavículas/escápulas y huesos de ambos miembros. La correspondencia de cada hueso, ID BP3D y punto está en [registration.json](../research/anatomy/nervous-expansion-registration.json).

Se refina mediante ICP de superficies etiquetadas: 500 puntos fuente ponderados por área por hueso, 12 000 puntos destino, semillas 123/456. Escala global uniforme **0.996913831900823**. El ajuste global no basta para aprobar todos los nervios; se aplican dos ajustes rígidos regionales tras esa misma escala:

- Superior: 10 huesos, clavícula, escápula, húmero, radio y ulna bilaterales.
- Inferior: 12 huesos, coxal, fémur, tibia, fíbula, astrágalo y calcáneo bilaterales. Cada coxal pesa cuatro veces (2 000 muestras fuente) para controlar el origen pélvico.

Cada región se ajusta conjuntamente para ambos lados. `M_región × inversa(M_global)` es rígida; no hay escalas por pieza/eje, ajustes por nervio, deformaciones ni colocación manual. Las regiones preservan recorridos completos, sin cortar un nervio entre matrices. Los ajustes se congelaron después de la comprobación ósea.

## Errores de correspondencia

Todas las distancias de la tabla están en **mm**. Los errores de centros y de superficies miden cosas distintas; los centros de bounds de huesos editados no son puntos clínicos exactamente homólogos.

| Ajuste | Referencias | Media centros | RMS centros | Máx. centros | RMS superficies | Máx. superficies |
|---|---:|---:|---:|---:|---:|---:|
| Global | 49 | 9.953 | 11.471 | 25.535 | 6.267 | 28.653 |
| Miembros superiores | 10 | 10.518 | 11.322 | 15.777 | 4.902 | 18.617 |
| Miembros inferiores | 12 | 13.591 | 14.401 | 19.106 | 7.705 | 20.705 |

La RMS superficial es la media cuadrática de las RMS por hueso, sin reponderación pélvica en esta tabla. La distancia es unidireccional hacia una superficie muestreada, no Hausdorff exacta ni error de posición del propio nervio. El JSON conserva la distribución por hueso/región. No se declara precisión clínica.

## Matrices fuente → MED3D

Convención: vector columna homogéneo `[x,y,z,1]`, última columna en metros. Las matrices regionales ya contienen la escala global: **no aplicarla de nuevo**.

### Global

```text
0.9969137072304705 -0.0002846744827669812 -0.000409306267425016 0.0001472502395692481
0.0004058030944497216 -0.01216131426373939 0.9968395688346293 -0.06541310074486872
-0.0002896463882513969 -0.9968396107855066 -0.01216119686348106 0.1128631551968799
0 0 0 1
```

### Superior

```text
0.9969137031945697 -2.617414443541307e-05 -0.0005058981979597512 0.0004781029121227922
0.0005057978828061973 -0.003688869841232366 0.996906878621558 -0.06487882591675609
-2.804593169459269e-05 -0.9969070065905803 -0.003688856085171414 0.1081260932581834
0 0 0 1
```

### Inferior

```text
0.996913814735685 -0.0001849123156144399 -5.635859476235039e-06 9.838699451262696e-05
-1.42248512632203e-06 -0.03803138474561156 0.9961881358495949 -0.06185918957215558
-0.0001849927131375683 -0.9961881186889106 -0.03803138435462578 0.1193957147509333
0 0 0 1
```

## Control anatómico y alternativas rechazadas

Se consultaron las 205 mallas óseas existentes, sin reconstruirlas. Prueba por paridad de rayos y distancia al hueso en vértices de cada candidato. La tolerancia de revisión de 0.5 mm es un criterio de ingeniería; no constituye validación clínica ni prueba exhaustiva de intersección de triángulos. Los aprobados tienen penetración máxima medida cercana a 0.06 mm (femoral izquierdo), generalmente cero. La revisión visual comprueba orientación, lado y relación con los huesos y músculos curados.

El ciático Z-Anatomy penetraba el coxal hasta 9.141 mm con el registro global; el ajuste regional aún dejaba aproximadamente 6.4 mm y contacto sacro. Se aplaza junto con el tronco radial y otros candidatos que no superan el control. No se corrige cada nervio por separado. El archivo de selección conserva los huesos y profundidades de cada caso.

Se probaron realmente las alternativas medulares, además de leer sus metadatos:

- HRA VH Male: 30 segmentos C1–C8, T1–T12, L1–L5 y S1–S5. Las tres mallas de landmarks se separaron en 24 componentes vertebrales C1–L5. Similitud con escala 0.9487797113420612, RMS superficial 7.080 mm, máximo 36.279 mm; el centro medular invade C2 unos 3.53 mm. La alternativa con 33 muestras del canal y escala 0.9779804256 tampoco ofrece encaje defendible (RMS 7.162 mm, máximo 13.992 mm).
- Z-Anatomy: se probaron ajuste global, rígido espinal y referencias del canal; persisten conflictos cervicales/torácicos. La cauda presenta hasta unos 11.3 mm de penetración tras el ajuste espinal. No se integran médula, raíces, ganglios ni cauda.

Las matrices y métricas rechazadas quedan en `rejectedSpinalFits` del JSON. Las ausencias son un resultado de esta comparación de cuerpos, no una afirmación de que nunca puedan resolverse con otras referencias. El explorador HRA de encéfalo continúa independiente.

## Reproducción

[`register-nervous-expansion.py`](../scripts/anatomy/register-nervous-expansion.py) reproduce las tres matrices con Blender/numpy/KDTree, los huesos nativos conservados y referencias BP3D leídas por [`expansion-reference.mjs`](../scripts/anatomy/expansion-reference.mjs). Resultado: [diferencia máxima de matrices 0](phase4-expansion/registration-reproduction.json).

[`verify-nervous-expansion-native.py`](../scripts/anatomy/verify-nervous-expansion-native.py) reevalúa las 38 curvas/mallas del subconjunto Blender: [posiciones y triángulos nativos exactos](phase4-expansion/native-reproduction.json). El builder conserva posiciones Float32 y cada triángulo orientado; su error numérico máximo de `6.010658296664614e-8 m` **no es precisión anatómica del registro**.
