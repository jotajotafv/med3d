import { X } from '@phosphor-icons/react';
import type { AnatomyCatalog, AnatomyNode } from '../../anatomy/atlas/types';
import { atlasEducation } from './education';

export default function XrAtlasCard({ node, catalog, isolated, onClose, onIsolate, onHide }: {
  node: AnatomyNode; catalog: AnatomyCatalog; isolated: boolean; onClose: () => void; onIsolate: () => void; onHide: () => void;
}) {
  const lesson = atlasEducation(node, catalog);
  return <aside className="xr-education-card xr-atlas-card" aria-labelledby="xr-education-title" data-xr-ui>
    <header className="xr-education-heading"><p className="xr-eyebrow">ANATOMÍA</p>
      <button type="button" data-xr-hand-control="close-card" aria-label="Cerrar ficha educativa y limpiar selección" onClick={onClose}><X size={18}/></button>
      <h2 id="xr-education-title">{lesson.name}</h2>
      {lesson.latin && <p className="xr-education-latin" lang="la">{lesson.latin}</p>}
      <div className="xr-atlas-actions"><button type="button" data-xr-hand-control="isolate" onClick={onIsolate}>{isolated ? 'Restaurar' : 'Aislar'}</button><button type="button" data-xr-hand-control="hide" onClick={onHide}>Ocultar</button></div>
    </header>
    <div key={node.id} className="xr-education-content" tabIndex={0} role="region" aria-label="Contenido de la ficha educativa"
      data-xr-hand-control="education-scroll" data-xr-hand-kind="scroll-region">
      <dl className="xr-education-context">{lesson.system && <div><dt>Sistema</dt><dd>{lesson.system}</dd></div>}
        {lesson.region && <div><dt>Región</dt><dd>{lesson.region}</dd></div>}</dl>
      {lesson.scope && <p className="xr-lesson-scope">{lesson.scope}</p>}
      {lesson.fields.map(([label, value]) => <section key={label}><h3>{label}</h3><p>{value}</p></section>)}
      <footer className="xr-education-sources">
        {lesson.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}
        {lesson.provenance.map(source => <dl key={source.id}><div><dt>Fuente del modelo</dt><dd><a href={source.originalUrl} target="_blank" rel="noreferrer">{source.source}</a></dd></div>
          <div><dt>Licencia del modelo</dt><dd><a href={source.licenseUrl} target="_blank" rel="noreferrer">{source.license}</a></dd></div></dl>)}
      </footer>
    </div>
  </aside>;
}
