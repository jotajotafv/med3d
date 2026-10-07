import {createFileRoute, redirect} from '@tanstack/react-router';

// Preserve incoming links without exposing the retired section.
export const Route = createFileRoute('/procedimientos/')({
  beforeLoad: () => {throw redirect({to: '/anatomia', replace: true});},
});
