import {publicText} from './public-information';
import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveMuscleDetail} from './muscle-education';
import {QUADRICEPS_MEMBERS} from './limb-education';

export default function MuscleInformation({node}: {node: AnatomyNode}) {
  const detail = resolveMuscleDetail(node);
  if (node.kind === 'division' && QUADRICEPS_MEMBERS[node.id]) return <p>El cuádriceps reúne el recto femoral y los vastos lateral, medial e intermedio. Selecciona cada músculo para consultar su ficha. «Mostrar contexto» reúne los huesos de sus fijaciones documentadas.</p>;
  if (!detail) return <p>{node.children.length
    ? 'Selecciona un músculo o componente de este grupo para estudiar su anatomía.'
    : 'La ficha de esta estructura muscular está pendiente de documentación.'}</p>;
  return <section className="atlas-muscle-information" aria-label={'Información muscular de '+node.name}>
    <p><strong>{detail.name}</strong><br/><em lang="la">{detail.latin}</em></p>
    <p>Sistema muscular · {detail.region}<br/>{detail.group}</p>
    {detail.scope === 'component' && <p>Componente de {detail.muscleName.toLowerCase()}. {detail.innervationScope === 'component'
      ? 'El origen, la acción y la inervación corresponden a esta cabeza; la inserción se resume para el músculo.'
      : detail.attachmentScope === 'origin-and-insertion'
      ? 'El origen y la inserción corresponden a esta porción; la inervación se resume para el músculo.'
      : 'La inserción y la inervación descritas corresponden al músculo; el origen corresponde a esta porción o cabeza.'}</p>}
    <h3>Descripción</h3><p>{detail.scope === 'component' ? `${detail.name}. Forma parte de ${detail.muscleName.toLowerCase()}.` : publicText(detail.description)}</p>
    <h3>Función</h3><p>{detail.function}</p>
    <h3>Acción</h3><p>{detail.action}</p>
    <h3>Origen</h3><ul>{detail.origins.map(item => <li key={item.label}>{item.label}</li>)}</ul>
    <h3>Inserción</h3><ul>{detail.insertions.map(item => <li key={item.label}>{item.label}</li>)}</ul>
    <h3>Inervación</h3><p>{detail.innervation}</p>
    <h3>Relaciones anatómicas</h3><p>{publicText(detail.relations)}</p>
    <p>«Mostrar contexto» reúne los huesos relacionados con el origen y la inserción. Las zonas exactas de fijación no están señaladas en el modelo.</p>
    <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source =>
      <SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>,
    )}</div>
  </section>;
}
