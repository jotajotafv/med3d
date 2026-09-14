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
  systemId: SystemId;
  regionId: string;
  parentId?: string;
  children: string[];
  kind: 'system' | 'division' | 'region' | 'structure' | 'component';
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
export interface AtlasCameraRequest { kind: 'reset' | 'zoomIn' | 'zoomOut' | 'focus'; version: number; id?: string | null }
export interface AssetLoadStatus { id: string; state: 'queued' | 'loading' | 'ready' | 'error'; progress: number; error?: string }
export interface AtlasMetrics { loadedAssets: number; meshes: number; triangles: number; geometryBytes: number; loadMs: number; drawCalls: number; renderGeometries: number; renderTextures: number; frameMs?: number }
export interface AtlasSceneProps {
  catalog: AnatomyCatalog;
  assetIds: string[];
  selected: string | null;
  hidden: string[];
  isolated: string | null;
  opacityBySystem: Partial<Record<SystemId, number>>;
  exploded: number;
  explodeLevel: ExplodeLevel;
  cameraRequest: AtlasCameraRequest;
  onSelect: (id: string | null) => void;
  onLoadStatus?: (status: AssetLoadStatus[]) => void;
  onMetrics?: (metrics: AtlasMetrics) => void;
}
