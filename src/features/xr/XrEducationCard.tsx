import { X, ArrowUpRight } from '@phosphor-icons/react';
import { HEART_MODEL, HEART_PROVENANCE } from './selection-data';
import type { HeartSelection } from './selection';

export default function XrEducationCard({ selection, unknown, onClose }: {
  selection: HeartSelection | null; unknown: boolean; onClose: () => void;
}) {
  const lesson = selection?.lesson;
  return <>
    <div className="xr-selection-prompt" hidden={!!selection}>
      <h2>SELECCIONA UNA ESTRUCTURA</h2>
      <p>Toca o haz clic sobre el corazón para explorar su anatomía.</p>
    </div>
    <p className="xr-selection-announcement" role="status" aria-live="polite" aria-atomic="true">
      {selection ? `${selection.structure.title} seleccionado.` : unknown ? 'Esta estructura todavía no dispone de información educativa.' : 'Sin estructura seleccionada.'}
    </p>
    {unknown && <p className="xr-unknown-structure">Esta estructura todavía no dispone de información educativa.</p>}
    {selection && <aside className="xr-education-card" aria-labelledby="xr-education-title" data-xr-ui>
      <header className="xr-education-heading"><p className="xr-eyebrow">ANATOMÍA</p>
        <button type="button" aria-label="Cerrar ficha educativa y limpiar selección" onClick={onClose}><X size={18}/></button>
        <h2 id="xr-education-title">{selection.structure.title}</h2>
        {selection.structure.latin && <p className="xr-education-latin">{selection.structure.latin}</p>}
      </header>
      <div className="xr-education-content">
        <dl className="xr-education-context"><div><dt>Sistema</dt><dd>{HEART_MODEL.system}</dd></div>
          {lesson?.region && <div><dt>Región</dt><dd>{lesson.region}</dd></div>}</dl>
        {lesson?.description && <section><h3>Descripción</h3><p>{lesson.description}</p></section>}
        {lesson?.function && <section><h3>Función</h3><p>{lesson.function}</p></section>}
        {!!selection.relations.length && <section><h3>Relaciones anatómicas</h3><ul>{selection.relations.map(related => <li key={related.id}>{related.title}</li>)}</ul></section>}
        <footer className="xr-education-sources">
          {lesson?.source && <a href={lesson.source} target="_blank" rel="noreferrer">Fuente educativa <ArrowUpRight size={12}/></a>}
          <dl><div><dt>Fuente del modelo</dt><dd><a href={HEART_PROVENANCE.url} target="_blank" rel="noreferrer">{HEART_PROVENANCE.source} <ArrowUpRight size={12}/></a></dd></div>
            {HEART_PROVENANCE.license && <div><dt>Licencia del modelo</dt><dd>{HEART_PROVENANCE.license}</dd></div>}</dl>
        </footer>
      </div>
    </aside>}
  </>;
}
