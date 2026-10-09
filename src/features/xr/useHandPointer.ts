import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { HandInteraction, type PinchCalibration } from './handInteraction';
import { MAX_TRACKING_GAP_MS, MANUAL_HAND_COOLDOWN_MS } from './handConfig';
import type { GestureController } from './gestures';
import type { PointerPoint, PointerRect } from './handPointer';
import type { HandTrackingInput } from './types';
import { HandUiRouter } from './ui/handUiRouter';
import { HandUiRegistry } from './ui/HandUiRegistry';

/** DOM-only adapter: one cursor update per inference, no landmark setState or render loop. */
export function useHandPointer<T extends { kind: string }>(gestures: GestureController,
  pickRef: RefObject<{ rect: () => PointerRect; hitTest: (point: PointerPoint) => T; select: (result: T) => void } | null>,
  viewportRef: RefObject<HTMLDivElement | null>, uiRootRef?: RefObject<HTMLElement | null>) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const manualPointers = useRef(new Set<number>());
  const manualUntil = useRef(0);
  const mounted = useRef(false);
  const debugEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('xrDebug') === '1';
  const [calibration, setCalibration] = useState<PinchCalibration | null>(null);
  const registry = useMemo(() => uiRootRef ? new HandUiRegistry(value => {
    const element = cursorRef.current;
    if (!element) return;
    element.dataset.ui = value?.state ?? '';
    element.dataset.uiControl = value?.target?.id ?? '';
    element.hidden = !value;
    if (value) {
      element.style.transform = `translate(${value.point.x}px, ${value.point.y}px)`;
      element.dataset.hover = 'false'; element.dataset.candidate = 'false'; element.dataset.rotating = 'false';
    }
  }) : null, [uiRootRef]);
  useEffect(() => {
    if (registry && uiRootRef?.current) registry.mount(uiRootRef.current);
    return () => registry?.dispose();
  }, [registry, uiRootRef]);
  const tracking = useMemo<HandTrackingInput>(() => {
    let stale: ReturnType<typeof setTimeout> | undefined;
    let pulse: ReturnType<typeof setTimeout> | undefined;
    const clearPulse = () => { clearTimeout(pulse); if (cursorRef.current) cursorRef.current.dataset.confirmed = 'false'; };
    let aspect = 4 / 3;
    const blocked = () => manualPointers.current.size > 0 || performance.now() < manualUntil.current;
    const anatomy = new HandInteraction<T>(gestures, {
      viewport: () => registry ? registry.surface(aspect) : pickRef.current?.rect() ?? null,
      hitTest: point => registry && registry.hitTest(point).route !== 'anatomy' ? null : pickRef.current?.hitTest(point) ?? null,
      select: result => {
        pickRef.current?.select(result);
        clearPulse();
        if (result.kind === 'selected' && cursorRef.current) {
          cursorRef.current.dataset.confirmed = 'true';
          pulse = setTimeout(clearPulse, 220);
        }
      },
      reportCalibration: debugEnabled ? summary => { if (mounted.current) setCalibration(summary); } : undefined,
      blocked,
      draw: cursor => {
        const element = cursorRef.current, viewport = viewportRef.current;
        if (!element) return;
        element.hidden = !cursor || !viewport;
        if (!cursor || !viewport) { clearPulse(); return; }
        const rect = registry ? { left: 0, top: 0 } : viewport.getBoundingClientRect();
        element.dataset.ui = ''; element.dataset.uiControl = '';
        element.style.transform = `translate(${cursor.point.x - rect.left}px, ${cursor.point.y - rect.top}px)`;
        element.dataset.hover = String(cursor.hovered?.kind === 'selected');
        element.dataset.candidate = String(cursor.mode === 'candidate');
        element.dataset.rotating = String(cursor.mode === 'rotate');
      },
    });
    const interaction = registry ? new HandUiRouter(gestures, anatomy, registry, blocked) : anatomy;
    return {
      update: (hands, time, frameAspect) => {
        aspect = frameAspect;
        clearTimeout(stale);
        const mode = interaction.update(hands, time, aspect);
        stale = setTimeout(() => interaction.endGesture(), MAX_TRACKING_GAP_MS);
        return mode;
      },
      endGesture: () => { clearTimeout(stale); clearPulse(); interaction.endGesture(); },
    };
  }, [gestures, pickRef, viewportRef, debugEnabled, registry]);
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
