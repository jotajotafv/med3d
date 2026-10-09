import { lazy, Suspense } from 'react';
import './xr.css';
const XrAtlasExperience = lazy(() => import('./atlas/XrAtlasExperience'));

export default function XrExperiencePage() {
  return <Suspense fallback={<main className="xr-page"><p role="status">Preparando Atlas XR…</p></main>}><XrAtlasExperience/></Suspense>;
}
