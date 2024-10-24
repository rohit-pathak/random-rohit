import { ElementRef, Injectable, signal, Signal, WritableSignal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ResizeObserverService {

  private elementToResizeSignals = new Map<Element, WritableSignal<Dimensions>>();

  private resizeObserver: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const cr = entry.contentRect;
      const dimensionSignal = this.elementToResizeSignals.get(entry.target);
      if (dimensionSignal) {
        dimensionSignal.set({width: cr.width, height: cr.height});
      }
    }
  });

  public observeResize(elementRef: ElementRef<Element>): Signal<Dimensions> {
    this.elementToResizeSignals.set(elementRef.nativeElement, signal({ width: 0, height: 0 }));
    this.resizeObserver.observe(elementRef.nativeElement);
    return this.elementToResizeSignals.get(elementRef.nativeElement)!;
  }

  public unObserve(elementRef: ElementRef<Element>): void {
    this.resizeObserver.unobserve(elementRef.nativeElement);
    this.elementToResizeSignals.delete(elementRef.nativeElement);
  }
}

interface Dimensions {
  width: number;
  height: number;
}
