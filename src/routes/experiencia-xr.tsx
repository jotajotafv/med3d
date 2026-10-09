import { createFileRoute } from '@tanstack/react-router';
import XrExperiencePage from '../features/xr/XrExperiencePage';

export const Route = createFileRoute('/experiencia-xr')({
  head: () => ({ meta: [{ title: 'Experiencia inmersiva | MED3D' },
    { name: 'description', content: 'Prototipo experimental para manipular un corazón 3D mediante gestos. Cámara opcional y procesamiento local.' }] }),
  component: XrExperiencePage,
});
