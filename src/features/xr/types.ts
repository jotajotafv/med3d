export type Landmark = { x: number; y: number; z: number };
export type HandSample = { id: string; x: number; y: number; pinchRatio: number; indexX?: number; indexY?: number };
export type GestureMode = 'idle' | 'rotate' | 'scale';
export type InteractionMode = GestureMode | 'pointing' | 'candidate';
export type HandTrackingInput = {
  update: (samples: HandSample[], now: number, aspect: number) => InteractionMode;
  endGesture: () => void;
  suspendGesture?: (now: number, lastReliable: number) => void;
  resumeGesture?: (now: number, nearby: boolean, lossMs: number) => void;
};
export type ModelTransform = { rotationX: number; rotationY: number; scale: number };
export type HandFrame = { landmarks: Landmark[][]; handedness: { categoryName: string; score: number }[][] };
export type TrackingStatus = {
  camera: 'off' | 'requesting' | 'loading' | 'active' | 'paused' | 'error';
  hands: number;
  gesture: InteractionMode;
  message: string;
};
export type WorkerRequest =
  | { type: 'init'; modelUrl: string }
  | { type: 'frame'; bitmap: ImageBitmap; timestamp: number }
  | { type: 'close' };
export type WorkerResponse =
  | { type: 'ready' }
  | { type: 'result'; frame: HandFrame; timestamp: number }
  | { type: 'error' }
  | { type: 'closed' };
