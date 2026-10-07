import {useEffect, useState} from 'react';
import type {AnatomyCatalog} from '../anatomy/atlas/types';

// Same source catalogs as the atlas, including the ocular extension under Nervous.
// This page reads metadata only; it never loads a scene or a model.
const catalogs = ['skeletal', 'muscular', 'nervous', 'cardiovascular', 'respiratory', 'digestive', 'urinary', 'endocrine', 'lymphatic', 'reproductive', 'integumentary', 'ocular'];
type Overview = {structures: number; systems: Array<{id: string; name: string}>};

export default function AtlasOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setFailed(false);
    Promise.all(catalogs.map(async system => {
      const response = await fetch(import.meta.env.BASE_URL + 'models/anatomy/' + system + '/catalog.json', {signal: abort.signal});
      if (!response.ok) throw new Error('No se pudo consultar la cobertura.');
      return await response.json() as AnatomyCatalog;
    })).then(values => {
      if (abort.signal.aborted) return;
      const registered = new Set(values.flatMap(value => value.assets.map(asset => asset.systemId)));
      const systems = values.flatMap(value => value.nodes.filter(node => node.kind === 'system' && node.systemId && registered.has(node.systemId)).map(node => ({id: node.id, name: node.name})));
      setOverview({structures: values.reduce((total, value) => total + value.coverage.structures, 0), systems});
    }).catch(() => {if (!abort.signal.aborted) setFailed(true);});
    return () => abort.abort();
  }, [attempt]);

  return <div className="about-coverage" aria-busy={!overview && !failed}>
    <dl className="about-metrics">
      <div><dt>Sistemas corporales</dt><dd>{overview?.systems.length ?? '—'}</dd></div>
      <div><dt>Estructuras anatómicas</dt><dd>{overview?.structures.toLocaleString('es') ?? '—'}</dd></div>
    </dl>
    <p className="about-coverage-note">Representación educativa parcial del cuerpo humano, basada en fuentes anatómicas abiertas y documentadas.</p>
    {!overview && <p className="about-data-status" role="status">{failed ? <>No se pudo consultar la cobertura. <button onClick={() => setAttempt(value => value + 1)}>Reintentar</button></> : 'Consultando la cobertura del atlas…'}</p>}
    {overview && <ul className="about-systems" aria-label="Sistemas disponibles">{overview.systems.map((system, index) => <li key={system.id}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{system.name.replace(/^Sistema /, '')}</li>)}</ul>}
  </div>;
}
