// Physical calibration, iteration 1: based on user feedback; pending a second physical trial.
// Distances use video-height units. Stable releases get grace up to (not including) hold.
export const SHORT_PINCH_MAX_MS = 450;
export const PINCH_HOLD_THRESHOLD = 550;
export const ROTATE_MOVE_THRESHOLD = 0.040;
export const pinchDurationBand = (duration: number) => duration <= SHORT_PINCH_MAX_MS ? 'short' : duration < PINCH_HOLD_THRESHOLD ? 'grace' : 'hold';
// XR 1.5.1 starting values; physical acceptance remains pending.
export const CURSOR_FAST_SMOOTHING_MS = 45;
export const CURSOR_SLOW_SMOOTHING_MS = 110;
export const CURSOR_SLOW_VELOCITY = 0.15; // normalized video units / second
export const CURSOR_FAST_VELOCITY = 1.2;
export const CURSOR_JUMP_BASE = 0.08;
export const CURSOR_JUMP_SPEED = 2.4; // allowance = base + speed * dt, capped below
export const CURSOR_JUMP_MAX = 0.25;
export const TRACKING_GRACE_MS = 380;
export const REACQUIRE_SETTLE_MS = 150;
export const REACQUIRE_NEAR_RADIUS = 0.08;
export const TARGET_DWELL_MS = 150;
export const TARGET_STICK_RADIUS_PX = 18;
export const UI_TARGET_DWELL_MS = 120;
export const UI_HIT_SLOP_PX = 10;
export const UI_SLIDER_SLOP_Y_PX = 8;
export const UI_CAPTURE_TOLERANCE_PX = 14;
export const MAX_TRACKING_GAP_MS = 250;
export const MAX_HAND_JUMP = 0.25;
export const MANUAL_HAND_COOLDOWN_MS = 250;
export const PINCH_ENTER_RATIO = 0.34;
// Exit hysteresis and existing XR manipulation values remain unchanged.
export const PINCH_EXIT_RATIO = 0.43;
export const HAND_SMOOTHING_MS = 65;
export const ROTATION_DEAD_ZONE = 0.006;
export const ROTATION_SENSITIVITY = Math.PI * 2;
