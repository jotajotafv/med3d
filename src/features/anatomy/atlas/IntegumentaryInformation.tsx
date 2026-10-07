import {publicText, publicFields} from './public-information';
import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {SKIN_EDUCATION} from './integumentary-education';

export default function IntegumentaryInformation({node}: {node: AnatomyNode}) {
  return <section aria-label={'Información anatómica de '+node.name}>
    <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
    <p>{publicText(SKIN_EDUCATION.description)}</p>
    <dl>{publicFields(SKIN_EDUCATION.fields).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p>Reduce la opacidad o desactiva la piel en Capas para explorar el interior. Puedes seleccionar la piel desde el árbol o la búsqueda.</p>
    <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{SKIN_EDUCATION.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
  </section>;
}
