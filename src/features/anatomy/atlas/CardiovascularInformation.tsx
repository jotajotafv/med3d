import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveCardiovascularDetail} from './cardiovascular-education';
export default function CardiovascularInformation({node}:{node:AnatomyNode}) {
 const detail=resolveCardiovascularDetail(node);
 if(!detail)return null;
 return <section aria-label={'Información cardiovascular de '+node.name}>
  <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
  <p>{detail.description}</p>
  <dl>{detail.fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  {detail.representation&&<p>{detail.representation}</p>}
  {node.vascularClass==='heart'&&<SiteLink href="/anatomia?organ=heart">Abrir explorador cardíaco detallado <ArrowSquareOut size={13}/></SiteLink>}
  <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
 </section>;
}
