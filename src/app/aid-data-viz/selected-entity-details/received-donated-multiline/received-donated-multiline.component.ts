import { AfterViewInit, Component, computed, effect, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { AidDataStore } from "../../aid-data.store";
import { ResizeDirective } from "../../../shared/directives/resize.directive";
import { axisBottom, scaleLinear, select } from "d3";

@Component({
  selector: 'app-received-donated-multiline',
  imports: [],
  templateUrl: './received-donated-multiline.component.html',
  styleUrl: './received-donated-multiline.component.scss',
  hostDirectives: [ResizeDirective],
})
export class ReceivedDonatedMultilineComponent implements AfterViewInit {
  private readonly store = inject(AidDataStore);
  private readonly resize = inject(ResizeDirective);
  private readonly injector = inject(Injector);
  private readonly svgRef = viewChild.required<ElementRef>('lineChart');
  private readonly lineGroupRef = viewChild.required<ElementRef>('lineGroup');
  private readonly xAxisGroupRef = viewChild.required<ElementRef>('xAxisGroup');
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineGroupRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisGroupRef().nativeElement));

  protected readonly dimensions= this.resize.dimensions;
  protected readonly totalHeight = 100;
  protected readonly padding = { top: 5, bottom: 20};
  protected readonly height = this.totalHeight - this.padding.top - this.padding.bottom;

  private readonly xScale = computed(() => {
    const width = this.dimensions().width;
    const [start, end] = this.store.totalYearRange();
    return scaleLinear([start, end], [0, width]);
  });

  private readonly xAxisGenerator = computed(() => axisBottom(this.xScale()));
  protected readonly axisTransform = `translate(0, ${this.padding.top + this.height})`;

  ngAfterViewInit(): void {
    effect(() => {
      this.initializeDrawing();
    }, {injector: this.injector});
  }

  private initializeDrawing(): void {
    const dimensions = this.dimensions();
    const data = this.store.transactionsPerYear();
    if (!dimensions || !data) {
      return;
    }
    // this.drawLineChart();
    this.drawXAxis();
    // this.addBrush();
  }

  private drawXAxis(): void {
    console.log('drawing x axis', this.dimensions().width);
    this.xAxisGroup().call(this.xAxisGenerator());
  }
}
