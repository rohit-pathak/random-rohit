import { ElementRef, Injectable, signal, Signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResizeObserverService {

  private elementToResizeSignals = new Map<Element, WritableSignal<DOMRectReadOnly>>();

  private resizeObserver: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const dimensionSignal = this.elementToResizeSignals.get(entry.target);
      if (dimensionSignal) {
        dimensionSignal.set(entry.contentRect);
      }
    }
  });

  public observeResize(elementRef: ElementRef<Element>): Signal<DOMRectReadOnly> {
    this.elementToResizeSignals.set(elementRef.nativeElement, signal(elementRef.nativeElement.getBoundingClientRect()));
    this.resizeObserver.observe(elementRef.nativeElement);
    return this.elementToResizeSignals.get(elementRef.nativeElement)!;
  }

  public unObserve(elementRef: ElementRef<Element>): void {
    this.resizeObserver.unobserve(elementRef.nativeElement);
    this.elementToResizeSignals.delete(elementRef.nativeElement);
  }
}
