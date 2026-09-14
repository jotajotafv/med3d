import {lazy, Suspense} from 'react';
import {useRouterState} from '@tanstack/react-router';
import './anatomy.css';
const SkeletalAtlas = lazy(() => import('./atlas/SkeletalAtlas'));
const LegacyOrganAtlas = lazy(() => import('./LegacyOrganAtlas'));

/** Keep the existing organ explorer available; the modular atlas is the default entry. */
export default function AnatomyPage() {
  const search = useRouterState({select: state => state.location.searchStr});
  const organ = new URLSearchParams(search).get('organ');
  const isLegacy = organ === 'heart' || organ === 'lungs' || organ === 'brain';
  return <Suspense fallback={<main className="atlas-page"><div className="model-loading">Preparando el explorador anatómico…</div></main>}>
    {isLegacy ? <LegacyOrganAtlas key={search}/> : <SkeletalAtlas/>}
  </Suspense>;
}
