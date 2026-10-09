import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import type { GestureController } from './gestures';
import { PointerIntent } from './pointerIntent';
import type { PickHandler } from './selection';

export function useManualControls(gestures: GestureController, onTap?: PickHandler) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const intent = useRef(new PointerIntent());
  useEffect(() => {
    const viewport = viewportRef.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      gestures.scale(gestures.target.scale * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.002), performance.now());
    };
    const release = () => { pointers.current.clear(); intent.current.cancel(); gestures.endManual(); };
    viewport.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', release);
    return () => { viewport.removeEventListener('wheel', wheel); window.removeEventListener('blur', release); release(); };
  }, [gestures]);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button,a,video,[data-xr-ui]')) return;
    event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
    if (!pointers.current.size) {
      gestures.beginManual(); intent.current.begin(event.pointerId, { x: event.clientX, y: event.clientY }, event.timeStamp);
    } else intent.current.cancel(); // Multitouch can never become a tap when one finger lifts.
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const before = pointers.current.get(event.pointerId); if (!before) return;
    const dragging = intent.current.move(event.pointerId, { x: event.clientX, y: event.clientY });
    const other = [...pointers.current].find(([id]) => id !== event.pointerId)?.[1];
    if (other) {
      const previous = Math.hypot(before.x - other.x, before.y - other.y);
      const distance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (previous > 12) gestures.scale(gestures.target.scale * distance / previous, performance.now());
    } else if (dragging) gestures.rotate((event.clientY - before.y) * 0.008, (event.clientX - before.x) * 0.008, performance.now());
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };
  const pointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const tracked = pointers.current.has(event.pointerId);
    const tap = tracked && intent.current.finish(event.pointerId, { x: event.clientX, y: event.clientY }, event.timeStamp);
    pointers.current.delete(event.pointerId);
    if (!pointers.current.size) gestures.endManual();
    if (tap) onTap?.({ x: event.clientX, y: event.clientY });
  };
  const cancelPointer = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId); intent.current.cancel();
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
    onPointerCancel: cancelPointer, onLostPointerCapture: cancelPointer, onKeyDown: keyDown };
}
