import {createFileRoute, redirect} from '@tanstack/react-router';

// Preserve incoming links without exposing the retired section.
export const Route = createFileRoute('/procedimientos/$slug')({
  beforeLoad: () => {throw redirect({to: '/anatomia', replace: true});},
});
