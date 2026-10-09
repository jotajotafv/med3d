// Physical calibration, iteration 1: based on user feedback; pending a second physical trial.
// Distances use video-height units. Stable releases get grace up to (not including) hold.
export const SHORT_PINCH_MAX_MS = 450;
export const PINCH_HOLD_THRESHOLD = 550;
export const ROTATE_MOVE_THRESHOLD = 0.040;
export const pinchDurationBand = (duration: number) => duration <= SHORT_PINCH_MAX_MS ? 'short' : duration < PINCH_HOLD_THRESHOLD ? 'grace' : 'hold';
export const CURSOR_SMOOTHING_MS = 45;
export const MAX_TRACKING_GAP_MS = 250;
export const MAX_HAND_JUMP = 0.25;
export const MANUAL_HAND_COOLDOWN_MS = 250;
export const PINCH_ENTER_RATIO = 0.34;
// Exit hysteresis and existing XR manipulation values remain unchanged.
export const PINCH_EXIT_RATIO = 0.43;
export const HAND_SMOOTHING_MS = 65;
export const ROTATION_DEAD_ZONE = 0.006;
export const ROTATION_SENSITIVITY = Math.PI * 2;
