import type {AnatomyCatalog, AnatomyLesson} from './types';
/** Shared family records are immutable and must agree across catalog extensions. */
export function mergeCatalogEducation(catalogs: AnatomyCatalog[]): Record<string, AnatomyLesson> {
  const result: Record<string, AnatomyLesson> = {};
  for (const catalog of catalogs) for (const [id, lesson] of Object.entries(catalog.education||{})) {
    if (result[id] && JSON.stringify(result[id]) !== JSON.stringify(lesson)) throw new Error('Conflicting anatomical lesson: '+id);
    result[id] = lesson;
  }
  return result;
}
