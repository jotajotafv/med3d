# Fase 9 · educación e interacción

La ficha nueva `IntegumentaryInformation` describe **Piel · superficie corporal / Cutis**, sistema, región corporal, tipo, función, relaciones, representación y límites. La explicación general de barrera, protección, sensibilidad y regulación térmica se distingue explícitamente de la geometría disponible. No se presentan epidermis, dermis, hipodermis, uñas, pelo o glándulas como piezas representadas.

Fuentes: [DBCLS](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html), [OpenStax, capas de la piel](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-1-layers-of-the-skin) y [OpenStax, funciones tegumentarias](https://openstax.org/books/anatomy-and-physiology-2e/pages/5-3-functions-of-the-integumentary-system). Se redactó una síntesis propia breve; no se copiaron figuras o pasajes del libro. Las fichas históricas se conservan.

El contexto explícito reúne 11 referencias existentes: frontal FMA52734, mandíbula FMA52748, esternón FMA7485, pectorales mayores y deltoides bilaterales, glúteos mayores FMA22328/FMA22329 y rectos femorales FMA38928/FMA38929. Los IDs exactos están en [integumentary-education.ts](../src/features/anatomy/atlas/integumentary-education.ts). No se infiere contacto mediante distancia. Al pedir contexto se activa piel al 25 %, y el control anuncia esa opacidad.

Tegumentario está **apagado inicialmente**; se mantienen los diez sistemas internos de la experiencia anterior. Al activarlo se muestra a 100 %. Mantiene control propio de sistema, módulo y opacidad. A 100 % la piel recibe clics y funciona como envoltura. Por debajo de 100 %, cuando hay estructuras internas visibles, sus raycasts se desactivan para permitir seleccionar el interior. La piel sigue seleccionable por árbol y búsqueda; si está sola o aislada, también por clic a cualquier opacidad probada.

Aislar/ocultar/restaurar actúan sobre la unidad completa. No existen regiones cutáneas separadas que puedan aislarse sin cortar la fuente. La cámara puede enfocar cabeza, tórax, espalda, mano y pie conservando esa unidad. No se implementan cortes libres ni un procedimiento quirúrgico.

En los tres niveles de despiece la piel conserva posición original como referencia de envoltura. Los sistemas internos mantienen su algoritmo y el retorno a cero exacto. No se separan fragmentos conexos como si fueran regiones.
