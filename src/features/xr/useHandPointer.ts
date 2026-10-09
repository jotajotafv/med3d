import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { HandInteraction, type PinchCalibration } from './handInteraction';
import { MAX_TRACKING_GAP_MS, MANUAL_HAND_COOLDOWN_MS } from './handConfig';
import type { GestureController } from './gestures';
import type { PointerPoint, PointerRect } from './handPointer';
import type { HandTrackingInput } from './types';

/** DOM-only adapter: one cursor update per inference, no landmark setState or render loop. */
export function useHandPointer<T extends { kind: string }>(gestures: GestureController,
  pickRef: RefObject<{ rect: () => PointerRect; hitTest: (point: PointerPoint) => T; select: (result: T) => void } | null>,
  viewportRef: RefObject<HTMLDivElement | null>) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const manualPointers = useRef(new Set<number>());
  const manualUntil = useRef(0);
  const mounted = useRef(false);
  const debugEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('xrDebug') === '1';
  const [calibration, setCalibration] = useState<PinchCalibration | null>(null);
  const tracking = useMemo<HandTrackingInput>(() => {
    let stale: ReturnType<typeof setTimeout> | undefined;
    let pulse: ReturnType<typeof setTimeout> | undefined;
    const clearPulse = () => { clearTimeout(pulse); if (cursorRef.current) cursorRef.current.dataset.confirmed = 'false'; };
    const interaction = new HandInteraction<T>(gestures, {
      viewport: () => pickRef.current?.rect() ?? null,
      hitTest: point => pickRef.current?.hitTest(point) ?? null,
      select: result => {
        pickRef.current?.select(result);
        clearPulse();
        if (result.kind === 'selected' && cursorRef.current) {
          cursorRef.current.dataset.confirmed = 'true';
          pulse = setTimeout(clearPulse, 220);
        }
      },
      reportCalibration: debugEnabled ? summary => { if (mounted.current) setCalibration(summary); } : undefined,
      blocked: () => manualPointers.current.size > 0 || performance.now() < manualUntil.current,
      draw: cursor => {
        const element = cursorRef.current, viewport = viewportRef.current;
        if (!element) return;
        element.hidden = !cursor || !viewport;
        if (!cursor || !viewport) { clearPulse(); return; }
        const rect = viewport.getBoundingClientRect();
        element.style.transform = `translate(${cursor.point.x - rect.left}px, ${cursor.point.y - rect.top}px)`;
        element.dataset.hover = String(cursor.hovered?.kind === 'selected');
        element.dataset.candidate = String(cursor.mode === 'candidate');
        element.dataset.rotating = String(cursor.mode === 'rotate');
      },
    });
    return {
      update: (hands, time, aspect) => {
        clearTimeout(stale);
        const mode = interaction.update(hands, time, aspect);
        stale = setTimeout(() => interaction.endGesture(), MAX_TRACKING_GAP_MS);
        return mode;
      },
      endGesture: () => { clearTimeout(stale); clearPulse(); interaction.endGesture(); },
    };
  }, [gestures, pickRef, viewportRef, debugEnabled]);
  useEffect(() => {
    mounted.current = true;
    const interrupt = () => { manualUntil.current = performance.now() + MANUAL_HAND_COOLDOWN_MS; tracking.endGesture(); };
    const inXr = (event: Event) => event.target instanceof Element && !!event.target.closest('.xr-page');
    const down = (event: PointerEvent) => { if (inXr(event)) { manualPointers.current.add(event.pointerId); interrupt(); } };
    const up = (event: PointerEvent) => { if (manualPointers.current.delete(event.pointerId)) interrupt(); };
    const wheel = (event: WheelEvent) => { if (inXr(event)) interrupt(); };
    const key = () => interrupt();
    const blur = () => { manualPointers.current.clear(); interrupt(); };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', up, true);
    document.addEventListener('wheel', wheel, { capture: true, passive: true });
    window.addEventListener('keydown', key, true); window.addEventListener('blur', blur);
    return () => {
      mounted.current = false;
      document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true); document.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', key, true); window.removeEventListener('blur', blur);
      manualPointers.current.clear(); tracking.endGesture();
    };
  }, [tracking]);
  return { cursorRef, tracking, debugEnabled, calibration };
}
