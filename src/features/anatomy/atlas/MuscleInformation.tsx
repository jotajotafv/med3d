import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveMuscleDetail} from './muscle-education';

export default function MuscleInformation({node}: {node: AnatomyNode}) {
  const detail = resolveMuscleDetail(node);
  if (!detail) return <p>{node.children.length
    ? 'Selecciona un músculo o componente de este grupo para estudiar su anatomía.'
    : 'La ficha de esta estructura muscular está pendiente de documentación.'}</p>;
  return <section className="atlas-muscle-information" aria-label={'Información muscular de '+node.name}>
    <p><strong>{detail.name}</strong><br/><em lang="la">{detail.latin}</em></p>
    <p>Sistema muscular · {detail.region}<br/>{detail.group}</p>
    {detail.scope === 'component' && <p>Componente de {detail.muscleName.toLowerCase()}. La inserción y la inervación descritas corresponden al músculo; el origen corresponde a esta porción o cabeza.</p>}
    <h3>Descripción</h3><p>{detail.description}</p>
    <h3>Función</h3><p>{detail.function}</p>
    <h3>Acción</h3><p>{detail.action}</p>
    <h3>Origen</h3><ul>{detail.origins.map(item => <li key={item.label}>{item.label}</li>)}</ul>
    <h3>Inserción</h3><ul>{detail.insertions.map(item => <li key={item.label}>{item.label}</li>)}</ul>
    <h3>Inervación</h3><p>{detail.innervation}</p>
    <h3>Relaciones anatómicas</h3><p>{detail.relations}</p>
    <p>«Mostrar contexto» presenta los huesos de origen e inserción documentados. Las zonas exactas de fijación todavía no están señaladas en el modelo.</p>
    <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source =>
      <SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>,
    )}</div>
  </section>;
}
