import type { PointerPoint, PointerRect } from '../handPointer';
import { contains, handUiSurface, type HandUiPort, type UiFeedback, type UiTarget } from './handUiRouter';

const rectOf = (element: Element): PointerRect => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
};
const visible = (element: HTMLElement) => {
  if (!element.isConnected || !element.getClientRects().length || element.closest('[hidden],[inert],[aria-hidden="true"]')) return false;
  for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    if (parent instanceof HTMLDetailsElement && !parent.open && !parent.querySelector('summary')?.contains(element)) return false;
  }
  return true;
};

/** Explicit XR controls only. References are rebuilt on child changes and released on unmount. */
export class HandUiRegistry implements HandUiPort {
  private root: HTMLElement | null = null;
  private controls = new Map<string, HTMLElement>();
  private blocks: HTMLElement[] = [];
  private observer: MutationObserver | null = null;
  private decorated: HTMLElement | null = null;
  private draw: (value: UiFeedback) => void;
  constructor(draw: (value: UiFeedback) => void) { this.draw = draw; }
  mount(root: HTMLElement) {
    this.dispose(); this.root = root; this.rebuild();
    this.observer = new MutationObserver(records => {
      if (records.some(record => [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element))) this.rebuild();
    });
    this.observer.observe(root, { childList: true, subtree: true });
  }
  private rebuild() {
    this.controls.clear();
    this.root?.querySelectorAll<HTMLElement>('[data-xr-hand-control]').forEach(element => {
      const id = element.dataset.xrHandControl;
      if (id && (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element.tagName === 'SUMMARY')) this.controls.set(id, element);
    });
    this.blocks = [...(this.root?.querySelectorAll<HTMLElement>('[data-xr-ui],.xr-viewport-controls,.xr-camera-preview.is-visible') ?? [])];
  }
  surface(aspect: number) {
    const workspace = this.root?.querySelector('.xr-atlas-workspace');
    if (!workspace) return null;
    const bounds = rectOf(workspace), card = this.root?.querySelector('.xr-atlas-card');
    const other = card ? rectOf(card) : bounds;
    const left = Math.max(0, Math.min(bounds.left, other.left)), top = Math.max(0, Math.min(bounds.top, other.top));
    const right = Math.min(innerWidth, Math.max(bounds.left + bounds.width, other.left + other.width));
    const bottom = Math.min(innerHeight, Math.max(bounds.top + bounds.height, other.top + other.height));
    return right > left && bottom > top ? handUiSurface({ left, top, width: right - left, height: bottom - top }, aspect) : null;
  }
  private hitElement(element: HTMLElement) { return element instanceof HTMLInputElement && element.type === 'checkbox' ? element.closest('label') ?? element : element; }
  resolve(id: string): UiTarget | null {
    const element = this.controls.get(id);
    if (!element || !visible(element)) return null;
    const rect = rectOf(this.hitElement(element));
    if (rect.width <= 0 || rect.height <= 0) return null;
    const enabled = !element.matches(':disabled,[aria-disabled="true"]');
    const kind = element instanceof HTMLInputElement ? element.type === 'range' ? 'slider' : 'toggle' : 'button';
    const target: UiTarget = { id, kind, rect, enabled };
    if (kind === 'slider' && element instanceof HTMLInputElement) target.range = {
      min: element.min ? Number(element.min) : 0, max: element.max ? Number(element.max) : 100,
      step: element.step === 'any' ? 'any' : Number(element.step) > 0 ? Number(element.step) : 1, value: Number(element.value),
    };
    return target;
  }
  hitTest(point: PointerPoint) {
    const top = document.elementFromPoint(point.x, point.y);
    if (!top || !this.root?.contains(top)) return { route: 'ui' as const, target: null };
    for (const [id, element] of this.controls) {
      // Filter by actual topmost element before style/layout reads. This also rejects covered controls.
      if (!this.hitElement(element).contains(top)) continue;
      const target = this.resolve(id);
      if (target && contains(target.rect, point)) return { route: 'ui' as const, target };
    }
    if (this.blocks.some(element => element.contains(top))) return { route: 'ui' as const, target: null };
    const canvas = this.root.querySelector('canvas');
    return canvas && (top === canvas || canvas.contains(top)) ? { route: 'anatomy' as const } : { route: 'ui' as const, target: null };
  }
  activate(id: string) {
    const target = this.resolve(id);
    if (target?.enabled && target.kind !== 'slider') this.controls.get(id)?.click();
  }
  change(id: string, value: number) {
    const target = this.resolve(id), element = this.controls.get(id);
    if (!target?.enabled || target.kind !== 'slider' || !(element instanceof HTMLInputElement) || !Number.isFinite(value)) return;
    // Native input events reach the same controlled React onChange as mouse/touch/keyboard.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(element, String(value));
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }
  feedback(value: UiFeedback) {
    if (this.decorated) delete this.decorated.dataset.xrHandState;
    this.decorated = value?.target ? this.controls.get(value.target.id) ?? null : null;
    if (this.decorated && value) this.decorated.dataset.xrHandState = value.state;
    this.draw(value);
  }
  dispose() {
    this.observer?.disconnect(); this.observer = null; this.feedback(null);
    this.controls.clear(); this.blocks = []; this.root = null;
  }
}
