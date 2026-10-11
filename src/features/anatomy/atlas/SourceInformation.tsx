import type {AnatomyNode, AnatomyLesson} from './types';

/** One catalog record supplies both the body atlas and XR; no copied lessons. */
export default function SourceInformation({node, detail}: {node: AnatomyNode; detail: AnatomyLesson}) {
  if (!detail) return null;
  return <section aria-label={'Información anatómica de '+node.name}>
    <h3>{node.name}</h3>{node.latin&&<p className="atlas-latin">{node.latin}</p>}
    <p>{detail.description}</p>
    <h3>Función</h3><p>{detail.function}</p>
    <h3>Relaciones anatómicas</h3><p>{detail.relations}</p>
    <h3>Representación</h3><p>{detail.limits}</p>
    <h3>Fuentes</h3><ul>{detail.sources.map(source=><li key={source.url}>
      <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
    </li>)}</ul>
  </section>;
}
