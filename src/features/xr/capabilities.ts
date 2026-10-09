export type Support = 'available' | 'unavailable' | 'unknown';
export type XrCapabilities = { camera: Support; vr: Support; ar: Support };
type CapabilityNavigator = {
  mediaDevices?: { getUserMedia?: unknown };
  xr?: { isSessionSupported?: (mode: 'immersive-vr' | 'immersive-ar') => Promise<boolean> };
};
export const UNKNOWN_CAPABILITIES: XrCapabilities = { camera: 'unknown', vr: 'unknown', ar: 'unknown' };

export async function detectCapabilities(nav: CapabilityNavigator, secure: boolean, timeoutMs = 3000): Promise<XrCapabilities> {
  const camera: Support = secure && typeof nav.mediaDevices?.getUserMedia === 'function' ? 'available' : 'unavailable';
  const xr = nav.xr;
  if (!secure || typeof xr?.isSessionSupported !== 'function') return { camera, vr: 'unavailable', ar: 'unavailable' };
  const check = async (mode: 'immersive-vr' | 'immersive-ar'): Promise<Support> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        Promise.resolve().then(() => xr.isSessionSupported!(mode)).then(value => value === true ? 'available' as const : 'unavailable' as const),
        new Promise<Support>(resolve => { timer = setTimeout(() => resolve('unknown'), timeoutMs); }),
      ]);
    } catch { return 'unknown'; }
    finally { clearTimeout(timer); }
  };
  const [vr, ar] = await Promise.all([check('immersive-vr'), check('immersive-ar')]);
  return { camera, vr, ar };
}

export function arExplanation(ar: Support) {
  if (ar === 'available') return 'WebXR AR detectado. La experiencia inmersiva completa se incorporará en la siguiente fase.';
  if (ar === 'unknown') return 'No se pudo confirmar WebXR AR en este dispositivo. Puedes utilizar el control por cámara y manos.';
  return 'Tu dispositivo no ofrece WebXR AR inmersivo. Puedes utilizar el control por cámara y manos.';
}
