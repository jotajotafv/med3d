export type SystemId = 'integumentary' | 'skeletal' | 'muscular' | 'nervous' | 'cardiovascular' | 'respiratory' | 'digestive' | 'urinary' | 'endocrine' | 'lymphatic' | 'reproductive';
export type Vec3 = [number, number, number];
export type Bounds = [Vec3, Vec3];
export type ExplodeLevel = 'systems' | 'regions' | 'structures';
export interface AnatomyNode {
  id: string;
  sourceId?: string;
  name: string;
  anatomicalName: string;
  latin?: string;
  aliases: string[];
  /** A body root deliberately has no system; mesh-owning nodes must have one. */
  systemId?: SystemId;
  regionId: string;
  /** Shared presentation group across systems; never an anatomical registration. */
  explosionRegionId?: string;
  parentId?: string;
  children: string[];
  kind: 'body' | 'system' | 'division' | 'region' | 'structure' | 'component';
  assetIds: string[];
  meshNames: string[];
  family?: string;
  side?: 'left' | 'right' | 'midline';
  relatedIds: string[];
  bounds?: Bounds;
}
export interface AnatomyAsset {
  id: string;
  path: string;
  systemId: SystemId;
  regionId: string;
  frameId: string;
  bytes: number;
  sha256: string;
  meshCount: number;
  triangles: number;
  bounds: Bounds;
  provenanceId: string;
}
export interface AssetProvenance {
  id: string;
  source: string;
  author: string;
  license: string;
  licenseUrl: string;
  version: string;
  originalUrl: string;
  attribution: string;
  modifications: string[];
}
export interface AnatomyCatalog {
  schemaVersion: 1;
  id: string;
  frame: { id: string; units: 'metres'; up: 'Y'; bounds: Bounds; note: string };
  nodes: AnatomyNode[];
  assets: AnatomyAsset[];
  provenance: AssetProvenance[];
  coverage: { title: string; structures: number; meshes: number; note: string; limitations: string[] };
}
export type AtlasAnatomicalView = 'anterior' | 'posterior' | 'left' | 'right' | 'superior' | 'inferior';
export interface AtlasCameraRequest { kind: 'reset' | 'zoomIn' | 'zoomOut' | 'focus' | 'view'; version: number; id?: string | null; view?: AtlasAnatomicalView }
export interface AssetLoadStatus { id: string; state: 'queued' | 'loading' | 'ready' | 'error'; progress: number; error?: string }
export interface AtlasMetrics {
  loadedAssets: number; meshes: number; triangles: number; geometryBytes: number;
  /** Longest individual asset fetch/decode duration; not a system wall time. */
  loadMs: number;
  drawCalls: number; renderGeometries: number; renderTextures: number; frameMs?: number;
  /** Wall times from this asset manager's creation to the corresponding render. */
  firstGeometryMs?: number; fullSystemMs?: number;
  visibleMeshes?: number; visibleSystems?: SystemId[]; maxRestError?: number;
  opacityBySystem?: Partial<Record<SystemId, number>>;
}
export interface AtlasSceneProps {
  catalog: AnatomyCatalog;
  assetIds: string[];
  selected: string | null;
  hidden: string[];
  isolated: string | null;
  /** Explicit curated context. An empty/absent list means no context filter. */
  contextIds?: string[];
  opacityBySystem: Partial<Record<SystemId, number>>;
  exploded: number;
  explodeLevel: ExplodeLevel;
  cameraRequest: AtlasCameraRequest;
  onSelect: (id: string | null) => void;
  onLoadStatus?: (status: AssetLoadStatus[]) => void;
  onMetrics?: (metrics: AtlasMetrics) => void;
}
