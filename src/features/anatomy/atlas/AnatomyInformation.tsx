import type {AnatomyNode} from './types';
import BoneInformation from './BoneInformation';
import NerveInformation from './NerveInformation';
import MuscleInformation from './MuscleInformation';
import DigestiveInformation from './DigestiveInformation';
import RespiratoryInformation from './RespiratoryInformation';
import CardiovascularInformation from './CardiovascularInformation';

/** System-neutral routing; a body root must not inherit a bone information card. */
export default function AnatomyInformation({node}: {node: AnatomyNode}) {
  if (node.systemId === 'digestive') return <DigestiveInformation node={node}/>;
  if (node.systemId === 'respiratory') return <RespiratoryInformation node={node}/>;
  if (node.systemId === 'cardiovascular') return <CardiovascularInformation node={node}/>;
  if (node.systemId === 'nervous') return <NerveInformation node={node}/>;
  if (node.systemId === 'skeletal') return <BoneInformation node={node}/>;
  if (node.systemId === 'muscular') return <MuscleInformation node={node}/>;
  return <p>{node.children.length
    ? 'Selecciona una estructura de los sistemas disponibles para estudiar su anatomía.'
    : 'La ficha individual de esta estructura está pendiente de documentación.'}</p>;
}
