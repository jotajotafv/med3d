import {lazy, Suspense, useState} from 'react';
import {microModulesFor, type EducationalMicroModule} from './registry';
import './micro.css';

const MicroExplorer = lazy(() => import('./MicroExplorer'));

export default function MicroAccess({parentId}: {parentId: string}) {
  const [active, setActive] = useState<EducationalMicroModule | null>(null);
  const modules = microModulesFor(parentId);
  if (!modules.length) return null;
  return <section className="micro-access" aria-label="Microanatomía vinculada">
    {modules.map(module => <button key={module.id} onClick={() => setActive(module)}>Explorar microanatomía<span>{module.title}</span></button>)}
    {active && <Suspense fallback={<p role="status">Preparando microanatomía…</p>}><MicroExplorer module={active} onClose={() => setActive(null)}/></Suspense>}
  </section>;
}
