import type {AnatomyNode} from './types';
import {OCULAR_DESCRIPTION} from './ocular-education';

export default function OcularInformation({node}:{node:AnatomyNode}) {
  return <section aria-label={'Información anatómica de '+node.name}>
    <h3>{node.name}</h3><p className="atlas-latin">{node.latin}</p>
    <p>{OCULAR_DESCRIPTION[node.ocularClass||'eyeball']}</p>
    <h3>Representación y límites</h3><p>Superficies nativas de BodyParts3D en su posición corporal original. No incluye cristalino, humores, retina ni todas las estructuras orbitarias. Los nervios ópticos conservan sus fichas y geometrías propias.</p>
    <p>Usa Aislar para estudiar la pieza o Mostrar contexto para relacionarla con el globo, el nervio óptico y referencias óseas. La córnea tiene transparencia de presentación propia, incluso con el sistema al 100 %.</p>
    <h3>Fuentes</h3><ul><li><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D / DBCLS · geometría</a></li><li><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception" target="_blank" rel="noreferrer">OpenStax · percepción sensorial y ojo</a></li></ul>
  </section>;
}
