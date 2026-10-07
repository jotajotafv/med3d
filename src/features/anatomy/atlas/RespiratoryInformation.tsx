import {publicText, publicFields} from './public-information';
import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveRespiratoryDetail} from './respiratory-education';
export default function RespiratoryInformation({node}:{node:AnatomyNode}) {
 const detail=resolveRespiratoryDetail(node);
 if(!detail)return null;
 return <section aria-label={'Información respiratoria de '+node.name}>
  <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
  <p>{publicText(detail.description)}</p>
  <dl>{publicFields(detail.fields).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  {['lung','lobe','parenchyma'].includes(node.respiratoryClass||'')&&<SiteLink href="/anatomia?organ=lungs">Abrir explorador pulmonar detallado <ArrowSquareOut size={13}/></SiteLink>}
  <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
 </section>;
}
