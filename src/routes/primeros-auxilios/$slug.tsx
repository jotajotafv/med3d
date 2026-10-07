import {createFileRoute, redirect} from '@tanstack/react-router';

// Preserve incoming links without exposing the retired section.
export const Route = createFileRoute('/primeros-auxilios/$slug')({
  beforeLoad: () => {throw redirect({to: '/anatomia', replace: true});},
});
