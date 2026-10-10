import type { PointerPoint, PointerRect } from '../handPointer';
import { contains, handUiSurface, type HandUiPort, type UiFeedback, type UiTarget } from './handUiRouter';
import { UI_HIT_SLOP_PX, UI_SLIDER_SLOP_Y_PX } from '../handConfig';

const rectOf = (element: Element): PointerRect => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { left, top, width, height };
};
const isScrollRegion = (element: HTMLElement) => element.dataset.xrHandKind === 'scroll-region';
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
      if (id && (element instanceof HTMLButtonElement || element instanceof HTMLInputElement || element.tagName === 'SUMMARY' || isScrollRegion(element))) this.controls.set(id, element);
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
    const kind = isScrollRegion(element) ? 'scroll-region' : element instanceof HTMLInputElement ? element.type === 'range' ? 'slider' : 'toggle' : 'button';
    const target: UiTarget = { id, kind, rect, enabled,
      name: (element.getAttribute('aria-label') || this.hitElement(element).textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
    if (kind === 'slider' && element instanceof HTMLInputElement) target.range = {
      min: element.min ? Number(element.min) : 0, max: element.max ? Number(element.max) : 100,
      step: element.step === 'any' ? 'any' : Number(element.step) > 0 ? Number(element.step) : 1, value: Number(element.value),
    };
    if (kind === 'scroll-region') {
      const max = element.scrollHeight - element.clientHeight;
      const left = Math.max(0, rect.left), right = Math.min(innerWidth, rect.left + rect.width);
      const top = Math.max(0, rect.top), bottom = Math.min(innerHeight, rect.top + rect.height);
      const probe = right > left && bottom > top ? document.elementFromPoint((left + right) / 2, (top + bottom) / 2) : null;
      if (max <= 0 || !probe || !element.contains(probe)) return null;
      target.scroll = { top: element.scrollTop, max, token: element };
    }
    return target;
  }
  hitTest(point: PointerPoint) {
    const top = document.elementFromPoint(point.x, point.y);
    if (!top || !this.root?.contains(top)) return { route: 'ui' as const, target: null, blocked: true };
    for (const [id, element] of this.controls) {
      if (isScrollRegion(element)) continue;
      // Filter by actual topmost element before style/layout reads. This also rejects covered controls.
      if (!this.hitElement(element).contains(top)) continue;
      const target = this.resolve(id);
      if (target && contains(target.rect, point)) return { route: 'ui' as const, target };
    }
    // Slop is allowed only on an actual ancestor's background inside the same authorized panel.
    // A sibling overlay, text from another control, canvas or header cannot enlarge a target.
    const candidates: { target: UiTarget; distance: number; z: number; order: number }[] = [];
    const scrollRegion = top.closest('[data-xr-hand-control][data-xr-hand-kind="scroll-region"]');
    let order = 0;
    for (const [id, element] of this.controls) {
      if (isScrollRegion(element)) continue;
      // Real controls already won above. Keep gaps inside a scroll region reachable instead of consuming them with slop.
      if (scrollRegion?.contains(element)) continue;
      order++;
      const hitElement = this.hitElement(element), panel = this.blocks.find(block => block.contains(element));
      if (!panel?.contains(top) || !top.contains(hitElement)) continue;
      const rect = rectOf(hitElement), slider = element instanceof HTMLInputElement && element.type === 'range';
      const dx = Math.max(rect.left - point.x, 0, point.x - rect.left - rect.width);
      const dy = Math.max(rect.top - point.y, 0, point.y - rect.top - rect.height);
      if (dx > (slider ? 0 : UI_HIT_SLOP_PX) || dy > (slider ? UI_SLIDER_SLOP_Y_PX : UI_HIT_SLOP_PX)) continue;
      const target = this.resolve(id);
      if (!target) continue;
      const probe = document.elementFromPoint(Math.max(rect.left + .5, Math.min(rect.left + rect.width - .5, point.x)),
        Math.max(rect.top + .5, Math.min(rect.top + rect.height - .5, point.y)));
      if (!probe || !hitElement.contains(probe)) continue;
      let z = 0;
      for (let ancestor: Element | null = hitElement; ancestor && ancestor !== panel; ancestor = ancestor.parentElement) {
        const value = Number(getComputedStyle(ancestor).zIndex); if (Number.isFinite(value)) z = Math.max(z, value);
      }
      candidates.push({ target, distance: Math.hypot(dx, dy), z, order });
    }
    candidates.sort((a, b) => b.z - a.z || a.distance - b.distance || b.order - a.order);
    if (candidates.length) return { route: 'ui' as const, target: candidates[0].target };
    // Explicit scroll regions only, without hit slop. Text/links can scroll, but never receive a synthetic click.
    for (const [id, element] of this.controls) {
      if (!isScrollRegion(element) || !element.contains(top)) continue;
      if (top.closest('button,input,select,textarea,[role="button"]')) return { route: 'ui' as const, target: null, blocked: true };
      const target = this.resolve(id);
      if (target && contains(target.rect, point)) return { route: 'ui' as const, target };
    }
    if (this.blocks.some(element => element.contains(top))) return { route: 'ui' as const, target: null, blocked: true };
    const canvas = this.root.querySelector('canvas');
    return canvas && (top === canvas || canvas.contains(top)) ? { route: 'anatomy' as const } : { route: 'ui' as const, target: null, blocked: true };
  }
  activate(id: string) {
    const target = this.resolve(id);
    if (target?.enabled && (target.kind === 'button' || target.kind === 'toggle')) this.controls.get(id)?.click();
  }
  scroll(id: string, value: number) {
    const target = this.resolve(id), element = this.controls.get(id);
    if (target?.enabled && target.kind === 'scroll-region' && target.scroll && element && Number.isFinite(value)) {
      element.scrollTop = Math.max(0, Math.min(target.scroll.max, value));
    }
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
