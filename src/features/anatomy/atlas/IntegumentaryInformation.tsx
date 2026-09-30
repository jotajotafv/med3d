import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {SKIN_EDUCATION} from './integumentary-education';

export default function IntegumentaryInformation({node}: {node: AnatomyNode}) {
  return <section aria-label={'Información anatómica de '+node.name}>
    <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
    <p>{SKIN_EDUCATION.description}</p>
    <dl>{SKIN_EDUCATION.fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p>Reduce la opacidad o desactiva Tegumentario en Capas para explorar el interior. La piel transparente deja pasar el clic a las estructuras internas visibles; puedes seleccionar la piel desde el árbol o la búsqueda. Cuando se muestra sola, también se selecciona por clic.</p>
    <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{SKIN_EDUCATION.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
  </section>;
}
