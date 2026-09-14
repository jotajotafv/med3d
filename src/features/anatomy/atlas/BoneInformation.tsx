import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {BONE_EDUCATION, BONE_TERMS} from './bone-education';
import {resolveBoneDetail} from './bone-details';

export function detailFor(node?: AnatomyNode) {
  return node && resolveBoneDetail(node);
}
export default function BoneInformation({node}: {node: AnatomyNode}) {
  const detail = detailFor(node);
  const family = BONE_EDUCATION[node.family || ''];
  if (detail) return <section className="atlas-bone-information" aria-label={'Información de '+node.name}>
    <p className="atlas-bone-classification">{detail.classification}</p>
    <h3>Descripción</h3><p>{detail.description}</p>
    <h3>Función</h3><p>{detail.function}</p>
    <h3>Articulaciones</h3><ul>{detail.articulations.map((item,index)=><li key={index}>{item.label}</li>)}</ul>
    <h3>Partes principales</h3><p>{detail.parts.join(' · ')}</p>
    <h3>Relaciones anatómicas</h3><p>{detail.relations}</p>
    {detail.additional&&<details className="atlas-reading-more"><summary>Para profundizar</summary><p>{detail.additional}</p></details>}
    <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
  </section>;
  if(family) return <section className="atlas-bone-information" aria-label={'Información de familia de '+node.name}>
    <span className="atlas-family-note">Ficha de familia ósea · {BONE_TERMS[node.family || '']?.name || node.family}</span>
    <h3>Descripción</h3><p>{family.description}</p>
    <h3>Función</h3><p>{family.function}</p>
    <h3>Relaciones anatómicas</h3><p>{family.relations}</p>
    <div className="atlas-education-sources"><span>Fuente de la ficha</span><SiteLink href={family.source.url} target="_blank" rel="noreferrer">{family.source.title}<ArrowSquareOut size={13}/></SiteLink></div>
  </section>;
  return <p>{node.children.length?'Selecciona una estructura de este grupo para estudiar su anatomía.':'La ficha individual de esta estructura está pendiente de documentación.'}</p>;
}
