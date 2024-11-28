import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { pointer } from "d3";
import { NgStyle } from "@angular/common";

@Component({
    selector: 'app-tooltip',
    imports: [
        NgStyle
    ],
    templateUrl: './tooltip.component.html',
    styleUrl: './tooltip.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {
  triggerEvent = input.required<Event | null>();
  target = input<HTMLOrSVGElement>();

  position = computed<{ left: string, top: string }>(() => {
    const trigger = this.triggerEvent();
    if (!trigger) {
      return { left: '0px', top: '0px' };
    }
    const [left, top] = pointer(trigger, this.target());
    return { left: `${left + 14}px`, top: `${top - 8}px` };
  });
}
