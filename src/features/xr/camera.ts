export function stopCamera(stream: MediaStream | null) { stream?.getTracks().forEach(track => track.stop()); }

export function cameraError(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'El permiso de cámara fue denegado. Puedes seguir con mouse, pantalla táctil o teclado.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No encontramos una cámara disponible. Puedes seguir usando los controles manuales.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'No se pudo abrir la cámara. Puede estar ocupada por otra aplicación.';
  return 'No se pudo iniciar la cámara. Puedes seguir usando los controles manuales.';
}

/** Called only from an explicit user action. No microphone is requested. */
export function requestCamera() {
  return navigator.mediaDevices.getUserMedia({ audio: false, video: {
    facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 },
  } });
}
