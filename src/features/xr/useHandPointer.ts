import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { HandInteraction } from './handInteraction';
import { MAX_TRACKING_GAP_MS, MANUAL_HAND_COOLDOWN_MS } from './handConfig';
import type { GestureController } from './gestures';
import type { SelectionRaycastApi, SelectionResult } from './selection';
import type { HandTrackingInput } from './types';

/** DOM-only adapter: one cursor update per inference, no landmark setState or render loop. */
export function useHandPointer(gestures: GestureController, pickRef: RefObject<SelectionRaycastApi | null>, viewportRef: RefObject<HTMLDivElement | null>) {
  const cursorRef = useRef<HTMLSpanElement>(null);
  const manualPointers = useRef(new Set<number>());
  const manualUntil = useRef(0);
  const tracking = useMemo<HandTrackingInput>(() => {
    let stale: ReturnType<typeof setTimeout> | undefined;
    const interaction = new HandInteraction<SelectionResult>(gestures, {
      viewport: () => pickRef.current?.rect() ?? null,
      hitTest: point => pickRef.current?.hitTest(point) ?? null,
      select: result => pickRef.current?.select(result),
      blocked: () => manualPointers.current.size > 0 || performance.now() < manualUntil.current,
      draw: cursor => {
        const element = cursorRef.current, viewport = viewportRef.current;
        if (!element) return;
        element.hidden = !cursor || !viewport;
        if (!cursor || !viewport) return;
        const rect = viewport.getBoundingClientRect();
        element.style.transform = `translate(${cursor.point.x - rect.left}px, ${cursor.point.y - rect.top}px)`;
        element.dataset.hover = String(cursor.hovered?.kind === 'selected');
        element.dataset.candidate = String(cursor.mode === 'candidate');
      },
    });
    return {
      update: (hands, time, aspect) => {
        clearTimeout(stale);
        const mode = interaction.update(hands, time, aspect);
        stale = setTimeout(() => interaction.endGesture(), MAX_TRACKING_GAP_MS);
        return mode;
      },
      endGesture: () => { clearTimeout(stale); interaction.endGesture(); },
    };
  }, [gestures, pickRef, viewportRef]);
  useEffect(() => {
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
      document.removeEventListener('pointerdown', down, true); document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', up, true); document.removeEventListener('wheel', wheel, true);
      window.removeEventListener('keydown', key, true); window.removeEventListener('blur', blur);
      manualPointers.current.clear(); tracking.endGesture();
    };
  }, [tracking]);
  return { cursorRef, tracking };
}
