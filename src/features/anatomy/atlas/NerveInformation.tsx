import {ArrowSquareOut} from '@phosphor-icons/react';
import SiteLink from '../../../components/SiteLink';
import type {AnatomyNode} from './types';
import {resolveNerveDetail} from './nerve-education';
export default function NerveInformation({node}:{node:AnatomyNode}) {
 const detail=resolveNerveDetail(node);
 if(!detail)return <p>Cobertura parcial del encéfalo, órbitas y nervios de extremidades. Selecciona una estructura para estudiar su ficha. Médula, raíces espinales y ciático siguen pendientes; los plexos muestran sólo los componentes o ramas disponibles.</p>;
 return <section className="atlas-nerve-information" aria-label={'Información nerviosa de '+node.name}>
  <p><strong>{node.name}</strong><br/><em lang="la">{node.latin}</em></p>
  <p>Sistema nervioso · {detail.region||'Cabeza'} · {node.neuralType}</p>
  {node.family?.startsWith('FMA5087')&&<p>El nervio óptico (II) es una prolongación del sistema nervioso central.</p>}
  <h3>Descripción</h3><p>{detail.description}</p>
  <h3>Función</h3><p>{detail.function}</p>
  {detail.origin&&<><h3>Origen general</h3><p>{detail.origin}</p></>}
  <h3>Recorrido general</h3><p>{detail.course}</p>
  <h3>Modalidad funcional</h3><p>{detail.modality}</p>
  <h3>Territorio</h3><p>{detail.territory}</p>
  {detail.motorTerritory&&<><h3>Territorio motor</h3><p>{detail.motorTerritory}</p></>}
  {detail.sensoryTerritory&&<><h3>Territorio sensitivo</h3><p>{detail.sensoryTerritory}</p></>}
  <h3>Relaciones anatómicas</h3><p>{detail.relations}</p>
  {detail.representation&&<p>{detail.representation}</p>}
  <p>La ficha resume anatomía general; la malla representa sólo la cobertura identificada. Las funciones no se deducen de su forma ni constituyen una validación clínica.</p>
  <div className="atlas-education-sources"><span>Fuentes de la ficha</span>{detail.sources.map(source=><SiteLink key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ArrowSquareOut size={13}/></SiteLink>)}</div>
 </section>;
}
