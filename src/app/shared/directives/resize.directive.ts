import { Directive, ElementRef, inject, OnDestroy } from '@angular/core';
import { ResizeObserverService } from "../services/resize-observer.service";

@Directive({
  selector: '[appResize]',
  standalone: true
})
export class ResizeDirective implements OnDestroy {

  private resizeObserverService = inject(ResizeObserverService);
  private hostElementRef = inject(ElementRef);

  public dimensions = this.resizeObserverService.observeResize(this.hostElementRef);

  ngOnDestroy() {
    this.resizeObserverService.unObserve(this.hostElementRef);
  }

}
