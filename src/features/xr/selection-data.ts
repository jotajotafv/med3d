import { MODEL_DEFINITIONS, SOURCE_CREDIT, STRUCTURES } from '../anatomy/data';
import { EDUCATION } from '../anatomy/education';

// Adapters over the existing organ module, not a second anatomical catalog.
const heartStructures = new Map(STRUCTURES.heart.map(structure => [structure.id, structure]));
export const HEART_MODEL = MODEL_DEFINITIONS.heart;
const [source, license] = SOURCE_CREDIT.split(' · ');
export const HEART_PROVENANCE = { source, license, url: HEART_MODEL.sourceUrl };

export function heartEducationForMesh(name: string) {
  const structure = heartStructures.get(name);
  if (!structure?.mesh) return null;
  const lesson = EDUCATION[structure.id];
  return {
    structure,
    lesson,
    relations: lesson?.relations.flatMap(id => {
      const related = heartStructures.get(id);
      return related ? [related] : [];
    }) ?? [],
  };
}

export type HeartEducation = NonNullable<ReturnType<typeof heartEducationForMesh>>;
