import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, viewChild } from '@angular/core';
import { pointer } from "d3";
import { ResizeDirective } from "../../directives/resize.directive";

@Component({
  selector: 'app-tooltip',
  imports: [
    ResizeDirective
  ],
  templateUrl: './tooltip.component.html',
  styleUrl: './tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipComponent {
  readonly triggerEvent = input.required<Event | null>();
  readonly target = input<HTMLOrSVGElement>();

  private content = viewChild<ElementRef<HTMLDivElement>>('tooltipContent');

  protected readonly position = computed<{ left: string, top: string }>(() => {
    const width = this.content()?.nativeElement.getBoundingClientRect()?.width ?? 10;
    const height = this.content()?.nativeElement.getBoundingClientRect()?.height ?? 20;
    const trigger = this.triggerEvent();
    if (!trigger) {
      return { left: '0px', top: '0px' };
    }
    const clientX = (trigger as MouseEvent).clientX;
    const clientY = (trigger as MouseEvent).clientY;
    const isRightHalf = clientX > window.innerWidth / 2;
    const isBottomHalf = clientY > window.innerHeight / 2;
    let [left, top] = pointer(trigger, this.target());
    left = isRightHalf ? left - width - 24 : left + 14;
    top = isBottomHalf ? top - height - 24 : top - 8;
    return { left: `${left}px`, top: `${top}px` };
  });
}
