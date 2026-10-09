import { useEffect, useRef, useState } from 'react';
import { HandTrackingSession, INITIAL_STATUS } from './HandTrackingSession';
import type { GestureController } from './gestures';

export function useHandTracking(gestures: GestureController) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const session = useRef<HandTrackingSession | null>(null);
  const [status, setStatus] = useState(INITIAL_STATUS);
  useEffect(() => {
    const instance = new HandTrackingSession(videoRef.current!, gestures, setStatus);
    session.current = instance;
    const onPageHide = () => instance.stop();
    window.addEventListener('pagehide', onPageHide);
    return () => { window.removeEventListener('pagehide', onPageHide); instance.dispose(); session.current = null; };
  }, [gestures]);
  return { videoRef, status, start: () => { void session.current?.start(); }, stop: () => session.current?.stop() };
}
