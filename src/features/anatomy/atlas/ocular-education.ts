import type {AnatomyNode} from './types';

export function ocularContextIds(node: AnatomyNode, byId: ReadonlyMap<string,AnatomyNode>): string[] {
  if (!node.ocularClass) return [];
  const sides=node.side==='right'?['right']:node.side==='left'?['left']:['right','left'];
  const ids=sides.flatMap(side=>side==='right'?['ocular:FMA12514','bp3d:FMA50875']:['ocular:FMA12515','bp3d:FMA50878']);
  // Frontal and sphenoid are explicit orbital references, never proximity guesses.
  return [...new Set([...ids,'bp3d:FMA52734','bp3d:FMA52736'])].filter(id=>id!==node.id&&byId.has(id));
}
export const OCULAR_DESCRIPTION = {
  eyeball:'Cobertura parcial de los globos oculares: córnea, esclerótica e iris. Se agrupa con las vías sensoriales para facilitar su estudio; no constituye un sistema corporal adicional.',
  cornea:'La córnea forma la porción anterior transparente de la cubierta del globo ocular. El material translúcido del atlas permite reconocer el iris y no simula la óptica del ojo.',
  sclera:'La esclerótica forma la cubierta fibrosa externa que rodea gran parte del globo ocular. Se conserva su geometría fuente, sin inflarla ni ajustarla a los párpados.',
  iris:'El iris rodea la abertura pupilar y participa en la regulación de la luz que entra al ojo. Su color en el atlas es esquemático y no identifica el color ocular del individuo.',
};
