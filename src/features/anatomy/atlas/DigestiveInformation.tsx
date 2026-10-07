import {publicText, publicFields} from './public-information';
import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveDigestiveDetail} from './digestive-education';
export default function DigestiveInformation({node}:{node:AnatomyNode}) {
 const detail=resolveDigestiveDetail(node);
 if(!detail)return null;
 return <section aria-label={'Información digestiva de '+node.name}>
  <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
  <p>{publicText(detail.description)}</p>
  <dl>{publicFields(detail.fields).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
 </section>;
}
