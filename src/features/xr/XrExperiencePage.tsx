import { lazy, Suspense, useState } from 'react';
import XrHeartExperience from './XrHeartExperience';
import './xr.css';
const XrAtlasExperience = lazy(() => import('./atlas/XrAtlasExperience'));

export default function XrExperiencePage() {
  const [mode, setMode] = useState<'heart' | 'atlas'>('heart');
  return <>
    <nav className="xr-mode-switch" aria-label="Experiencia">
      <span>EXPERIENCIA</span>
      <button type="button" aria-pressed={mode === 'heart'} onClick={() => setMode('heart')}>Corazón</button>
      <button type="button" aria-pressed={mode === 'atlas'} onClick={() => setMode('atlas')}>Atlas XR</button>
    </nav>
    {mode === 'heart' ? <XrHeartExperience/> : <Suspense fallback={<main className="xr-page"><p role="status">Preparando Atlas XR…</p></main>}><XrAtlasExperience/></Suspense>}
  </>;
}
