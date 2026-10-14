import { prioritizeAtlasAssets } from '../../anatomy/atlas/initial-assets';
import { AtlasAssetManager, createAssetLoader, type AtlasResource, type AssetSnapshot } from '../../anatomy/atlas/asset-manager';
import type { AnatomyCatalog } from '../../anatomy/atlas/types';
import { XR_ATLAS_SYSTEM_IDS, composeXrCatalog, type XrAtlasSystem } from './systems';

// Two retained managers may load at once, each using the existing manager's single-module queue.
export const XR_ATLAS_LOAD_SLOTS = 2;
type SystemEntry = { abort: AbortController; catalog?: AnatomyCatalog; manager?: AtlasAssetManager;
  unsubscribe?: () => void; snapshot: AssetSnapshot; error?: string; startedAt: number;
  enabled: boolean; desired: string[];
  phase: 'queued' | 'active' | 'settled'; initialized: Promise<void>; resolve: () => void };
export type AtlasAssetsSnapshot = { catalog: AnatomyCatalog | null; resources: AtlasResource[];
  systems: Partial<Record<XrAtlasSystem, { pending: boolean; error?: string; ready: number; total: number; startedAt: number }>> };
type CatalogLoader = (system: XrAtlasSystem, signal: AbortSignal) => Promise<AnatomyCatalog>;
type ManagerFactory = (catalog: AnatomyCatalog) => AtlasAssetManager;

/** One retained owner per requested system; this queue schedules owners, never downloads geometry. */
export class XrAtlasAssets {
  private entries = new Map<XrAtlasSystem, SystemEntry>();
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
      return [id, { pending: entry.phase !== 'settled',
        error: entry.error || (failed ? 'No se pudo cargar una región.' : undefined), ready, total: entry.desired.length, startedAt: entry.startedAt }];
    })) };
  }
  private emit() { if (!this.disposed) { const value = this.snapshot(); this.listeners.forEach(listener => listener(value)); } }
  ensure(system: XrAtlasSystem): Promise<void> {
    if (this.disposed) return Promise.resolve();
    const existing = this.entries.get(system);
    if (existing) {
      if (!existing.enabled) {
        existing.enabled = true; existing.error = undefined;
        if (existing.catalog) existing.desired = prioritizeAtlasAssets(existing.catalog.assets).map(asset => asset.id);
        if (existing.phase === 'settled') { existing.phase = 'queued'; this.emit(); this.pump(); }
        else if (existing.phase === 'active' && existing.manager) existing.manager.setDesired(existing.desired);
      }
      return existing.initialized;
    }
    let resolve!: () => void;
    const initialized = new Promise<void>(done => { resolve = done; });
    const entry: SystemEntry = { abort: new AbortController(), snapshot: { resources: [], statuses: [] },
      enabled: true, desired: [], startedAt: performance.now(), phase: 'queued', initialized, resolve };
    this.entries.set(system, entry); this.emit(); this.pump(); return initialized;
  }
  private pump() {
    if (this.disposed) return;
    let active = [...this.entries.values()].filter(entry => entry.phase === 'active').length;
    for (const [system, entry] of this.entries) {
      if (active >= XR_ATLAS_LOAD_SLOTS) break;
      if (entry.phase !== 'queued') continue;
      entry.phase = 'active'; active++; void this.start(system, entry);
    }
  }
  private settle(entry: SystemEntry) {
    entry.phase = 'settled'; this.emit(); this.pump();
  }
  private async start(system: XrAtlasSystem, entry: SystemEntry) {
    try {
      if (entry.manager) {
        const current = entry.snapshot.statuses.map(status => status.id);
        if (current.length !== entry.desired.length || current.some((id, i) => id !== entry.desired[i])) entry.manager.setDesired(entry.desired);
        else entry.manager.retry();
        return;
      }
      const catalog = await this.fetchCatalog(system, entry.abort.signal);
      if (this.disposed || entry.abort.signal.aborted) return;
      if (catalog.assets.some(asset => asset.systemId !== system)) throw new Error('Catálogo fuera del sistema solicitado.');
      const catalogs = Object.fromEntries([...this.entries].flatMap(([id, value]) => value.catalog ? [[id, value.catalog]] : []));
      const composed = composeXrCatalog({ ...catalogs, [system]: catalog });
      entry.catalog = catalog; this.catalog = composed;
      entry.desired = entry.enabled ? prioritizeAtlasAssets(catalog.assets).map(asset => asset.id) : [];
      const manager = this.createManager(catalog); entry.manager = manager;
      entry.unsubscribe = manager.subscribe(snapshot => {
        entry.snapshot = snapshot;
        const resources = XR_ATLAS_SYSTEM_IDS.flatMap(id => this.entries.get(id)?.snapshot.resources ?? []);
        if (resources.length !== this.resources.length || resources.some((resource, i) => resource !== this.resources[i])) this.resources = resources;
        const settled = snapshot.statuses.length === entry.desired.length
          && snapshot.statuses.every(status => status.state === 'ready' || status.state === 'error');
        if (settled && entry.phase === 'active') this.settle(entry); else this.emit();
      });
      // Ready modules are retained until leaving Atlas XR; disabled layers stop pending work.
      manager.setDesired(entry.desired);
    } catch (error) {
      if (this.disposed || entry.abort.signal.aborted) return;
      entry.error = error instanceof Error ? error.message : 'No se pudo cargar el sistema.'; this.settle(entry);
    } finally { entry.resolve(); }
  }
  disable(system: XrAtlasSystem) {
    const entry = this.entries.get(system);
    if (!entry || !entry.enabled || this.disposed) return;
    entry.enabled = false;
    if (entry.manager) {
      entry.desired = entry.snapshot.statuses.filter(status => status.state === 'ready' || status.state === 'loading').map(status => status.id);
      // Finish the one transfer already in flight; do not start another while OFF.
      if (entry.phase === 'queued') entry.phase = 'settled';
      entry.manager.setDesired(entry.desired);
    } else if (entry.phase === 'queued') { entry.phase = 'settled'; entry.resolve(); }
    // An active catalog fetch can finish, but cannot start disabled geometry.
    this.emit(); this.pump();
  }
  retry(system: XrAtlasSystem) {
    const entry = this.entries.get(system); if (!entry || !entry.enabled || this.disposed || entry.phase !== 'settled') return;
    if (entry.manager) {
      if (!entry.snapshot.statuses.some(status => status.state === 'error')) return;
      entry.phase = 'queued'; this.emit(); this.pump();
    } else { this.entries.delete(system); void this.ensure(system); }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    this.entries.forEach(entry => { entry.abort.abort(); entry.resolve(); entry.unsubscribe?.(); entry.manager?.dispose(); });
    this.entries.clear(); this.listeners.clear(); this.resources = []; this.catalog = null;
  }
}
