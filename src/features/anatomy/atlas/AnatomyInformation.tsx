import type {AnatomyNode} from './types';
import BoneInformation from './BoneInformation';
import MuscleInformation from './MuscleInformation';

/** System-neutral routing; a body root must not inherit a bone information card. */
export default function AnatomyInformation({node}: {node: AnatomyNode}) {
  if (node.systemId === 'skeletal') return <BoneInformation node={node}/>;
  if (node.systemId === 'muscular') return <MuscleInformation node={node}/>;
  return <p>{node.children.length
    ? 'Selecciona una estructura de los sistemas disponibles para estudiar su anatomía.'
    : 'La ficha individual de esta estructura está pendiente de documentación.'}</p>;
}
