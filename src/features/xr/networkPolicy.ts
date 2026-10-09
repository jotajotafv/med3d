/** Restrict the isolated inference worker to reading the two pinned local data assets. */
export function mayFetchAsset(url: string, method: string, assets: readonly string[]) {
  return method.toUpperCase() === 'GET' && assets.includes(url);
}
