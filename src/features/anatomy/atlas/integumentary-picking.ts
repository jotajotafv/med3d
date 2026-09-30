/** Transparent skin is a visual envelope when an interior is visible.
 * It remains selectable from the tree/search and by raycast when shown alone.
 * Opaque skin receives the normal nearest-surface click.
 */
export function skinAllowsRaycast(opacity: number, hasVisibleInterior: boolean): boolean {
  const value = Number.isFinite(opacity) ? Math.max(.1, Math.min(1, opacity)) : 1;
  return value >= .999 || !hasVisibleInterior;
}
