import {createFileRoute, redirect} from '@tanstack/react-router';

export const Route = createFileRoute('/arquitectura')({
  beforeLoad: () => {throw redirect({to: '/acerca', hash: 'metodologia', replace: true});},
});
