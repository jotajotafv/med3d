import { AtlasAssetManager, createAssetLoader, type AtlasResource, type AssetSnapshot } from '../../anatomy/atlas/asset-manager';
import { composeBodyCatalog } from '../../anatomy/atlas/body-catalog';
import type { AnatomyCatalog } from '../../anatomy/atlas/types';
import { PILOT_SYSTEMS, type PilotSystem } from './state';

type SystemEntry = { abort: AbortController; catalog?: AnatomyCatalog; manager?: AtlasAssetManager;
  unsubscribe?: () => void; snapshot: AssetSnapshot; error?: string; startedAt: number };
export type AtlasAssetsSnapshot = { catalog: AnatomyCatalog | null; resources: AtlasResource[];
  systems: Partial<Record<PilotSystem, { pending: boolean; error?: string; ready: number; total: number; startedAt: number }>> };
type CatalogLoader = (system: PilotSystem, signal: AbortSignal) => Promise<AnatomyCatalog>;
type ManagerFactory = (catalog: AnatomyCatalog) => AtlasAssetManager;

/** One retained owner per activated system. No global cache and no disabled-system requests. */
export class XrAtlasAssets {
  private entries = new Map<PilotSystem, SystemEntry>();
  private listeners = new Set<(snapshot: AtlasAssetsSnapshot) => void>();
  private catalog: AnatomyCatalog | null = null;
  private resources: AtlasResource[] = [];
  private disposed = false;
  constructor(private fetchCatalog: CatalogLoader, private createManager: ManagerFactory = catalog =>
    new AtlasAssetManager(catalog, createAssetLoader(catalog), 1)) {}
  subscribe(listener: (snapshot: AtlasAssetsSnapshot) => void) {
    this.listeners.add(listener); listener(this.snapshot()); return () => { this.listeners.delete(listener); };
  }
  snapshot(): AtlasAssetsSnapshot {
    return { catalog: this.catalog, resources: this.resources, systems: Object.fromEntries([...this.entries].map(([id, entry]) => {
      const ready = entry.snapshot.statuses.filter(status => status.state === 'ready').length;
      const failed = entry.snapshot.statuses.some(status => status.state === 'error');
      return [id, { pending: !entry.error && (!entry.catalog || entry.snapshot.statuses.some(status => ['loading', 'queued'].includes(status.state))),
        error: entry.error || (failed ? 'No se pudo cargar una región.' : undefined), ready, total: entry.catalog?.assets.length ?? 0, startedAt: entry.startedAt }];
    })) };
  }
  private emit() { if (!this.disposed) { const value = this.snapshot(); this.listeners.forEach(listener => listener(value)); } }
  async ensure(system: PilotSystem) {
    if (this.disposed || this.entries.has(system)) return;
    const entry: SystemEntry = { abort: new AbortController(), snapshot: { resources: [], statuses: [] }, startedAt: performance.now() };
    this.entries.set(system, entry); this.emit();
    try {
      const catalog = await this.fetchCatalog(system, entry.abort.signal);
      if (this.disposed || entry.abort.signal.aborted) return;
      if (catalog.assets.some(asset => asset.systemId !== system)) throw new Error('Catálogo fuera del sistema solicitado.');
      entry.catalog = catalog;
      const skeletal = this.entries.get('skeletal')?.catalog;
      if (skeletal) this.catalog = composeBodyCatalog(skeletal, this.entries.get('muscular')?.catalog, undefined, this.entries.get('cardiovascular')?.catalog);
      const manager = this.createManager(catalog); entry.manager = manager;
      entry.unsubscribe = manager.subscribe(snapshot => {
        entry.snapshot = snapshot;
        const resources = PILOT_SYSTEMS.flatMap(id => this.entries.get(id)?.snapshot.resources ?? []);
        if (resources.length !== this.resources.length || resources.some((resource, i) => resource !== this.resources[i])) this.resources = resources;
        this.emit();
      });
      // Retain these IDs until this XR mode ends, including while their layer is off.
      manager.setDesired(catalog.assets.map(asset => asset.id));
    } catch (error) {
      if (this.disposed || entry.abort.signal.aborted) return;
      entry.error = error instanceof Error ? error.message : 'No se pudo cargar el sistema.'; this.emit();
    }
  }
  retry(system: PilotSystem) {
    const entry = this.entries.get(system); if (!entry || this.disposed) return;
    if (entry.manager) entry.manager.retry();
    else { this.entries.delete(system); void this.ensure(system); }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.entries.forEach(entry => { entry.abort.abort(); entry.unsubscribe?.(); entry.manager?.dispose(); });
    this.entries.clear(); this.listeners.clear(); this.resources = []; this.catalog = null;
  }
}
