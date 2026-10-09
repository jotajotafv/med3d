import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { GestureController } from './gestures';

export function useManualControls(gestures: GestureController) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  useEffect(() => {
    const viewport = viewportRef.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      gestures.scale(gestures.target.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.002), performance.now());
    };
    const release = () => { pointers.current.clear(); gestures.endManual(); };
    viewport.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', release);
    return () => { viewport.removeEventListener('wheel', wheel); window.removeEventListener('blur', release); release(); };
  }, [gestures]);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button,a,video')) return;
    event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
    if (!pointers.current.size) gestures.beginManual();
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const before = pointers.current.get(event.pointerId); if (!before) return;
    const other = [...pointers.current].find(([id]) => id !== event.pointerId)?.[1];
    if (other) {
      const previous = Math.hypot(before.x - other.x, before.y - other.y);
      const distance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (previous > 12) gestures.scale(gestures.target.scale * distance / previous, performance.now());
    } else gestures.rotate((event.clientY - before.y) * 0.008, (event.clientX - before.x) * 0.008, performance.now());
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) gestures.endManual();
  };
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const keys: Record<string, () => void> = {
      ArrowLeft: () => gestures.rotate(0, -0.12, performance.now()), ArrowRight: () => gestures.rotate(0, 0.12, performance.now()),
      ArrowUp: () => gestures.rotate(-0.12, 0, performance.now()), ArrowDown: () => gestures.rotate(0.12, 0, performance.now()),
      '+': () => gestures.scale(gestures.target.scale * 1.1, performance.now()), '=': () => gestures.scale(gestures.target.scale * 1.1, performance.now()),
      '-': () => gestures.scale(gestures.target.scale / 1.1, performance.now()), '0': () => gestures.reset(),
    };
    if (keys[event.key]) { event.preventDefault(); keys[event.key](); }
  };
  return { ref: viewportRef, onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: pointerUp,
    onPointerCancel: pointerUp, onLostPointerCapture: pointerUp, onKeyDown: keyDown };
}
