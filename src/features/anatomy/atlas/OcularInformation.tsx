import {publicText} from './public-information';
import type {AnatomyNode} from './types';
import {OCULAR_DESCRIPTION} from './ocular-education';

export default function OcularInformation({node}:{node:AnatomyNode}) {
  return <section aria-label={'Información anatómica de '+node.name}>
    <h3>{node.name}</h3><p className="atlas-latin">{node.latin}</p>
    <p>{publicText(OCULAR_DESCRIPTION[node.ocularClass||'eyeball'])}</p>
    <p>La representación del ojo es parcial y no simula su óptica.</p>
    <p>Usa Aislar o Mostrar contexto para estudiar las estructuras del ojo. La córnea se muestra transparente.</p>
    <h3>Fuentes</h3><ul><li><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html" target="_blank" rel="noreferrer">BodyParts3D / DBCLS</a></li><li><a href="https://openstax.org/books/anatomy-and-physiology-2e/pages/14-1-sensory-perception" target="_blank" rel="noreferrer">OpenStax · percepción sensorial y ojo</a></li></ul>
  </section>;
}
