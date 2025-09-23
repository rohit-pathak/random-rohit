import { Component, computed, effect, ElementRef, inject, Injector, input, viewChild, AfterViewInit } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { axisBottom, line, max, min, scaleLinear, scaleLog, select } from "d3";
import { YearTotal } from "../../../aid-data-viz/aid-data.store";

@Component({
  selector: 'app-multi-line-chart',
  imports: [],
  templateUrl: './multi-line-chart.component.html',
  styleUrl: './multi-line-chart.component.scss',
  hostDirectives: [ResizeDirective]
})
export class MultiLineChartComponent<T> implements AfterViewInit {
  readonly data = input.required<LineData<T>[]>();
  readonly x = input.required<(d: T) => number>();
  readonly y = input.required<(d: T) => number>();
  readonly xSpan = input<[number, number]>();
  readonly ySpan = input<[number, number]>();

  private readonly resize = inject(ResizeDirective);
  private readonly injector = inject(Injector);
  private readonly svgRef = viewChild.required<ElementRef>('lineChart');
  private readonly lineGroupRef = viewChild.required<ElementRef>('lineGroup');
  private readonly xAxisGroupRef = viewChild.required<ElementRef>('xAxisGroup');
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineGroupRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisGroupRef().nativeElement));

  protected readonly dimensions= this.resize.dimensions;
  protected readonly padding = { top: 5, bottom: 20};
  protected readonly height = computed(() => {
    const h = this.dimensions().height;
    return h - this.padding.top - this.padding.bottom;
  })

  private readonly xScale = computed(() => {
    const data = this.data();
    const x = this.x();
    const width = this.dimensions().width;
    const xVals = data.flatMap(lineData => lineData.data.map(x));
    const [start, end] = this.xSpan() ?? [min(xVals) ?? 0, max(xVals) ?? 1];
    return scaleLinear([start, end], [0, width]);
  });
  private readonly yScale = computed(() => {
    const data = this.data();
    const y = this.y();
    const height = this.height();
    const yVals = data.flatMap(lineData => lineData.data.map(y));
    const [start, end] = this.ySpan() ?? [min(yVals) ?? 0, max(yVals) ?? 0];
    return scaleLog([start, end], [height, this.padding.top]); // TODO: get scale from input
  });
  private readonly lineGenerator = computed(() => {
    const x = this.x();
    const y = this.y();
    return line<T>()
      .x(d => this.xScale()(x(d)) ?? 0)
      .y(d => this.yScale()(y(d)) ?? 0);
  });

  private readonly xAxisGenerator = computed(() => axisBottom(this.xScale()));
  protected readonly axisTransform = computed(() => `translate(0, ${this.padding.top + this.height()})`);

  ngAfterViewInit(): void {
    effect(() => {
      this.initializeDrawing();
    }, {injector: this.injector});
  }

  private initializeDrawing(): void {
    const dimensions = this.dimensions();
    const data = this.data();
    if (!dimensions || !data) {
      return;
    }
    this.drawLineChart();
    this.drawXAxis();
    // this.addBrush();
  }

  private drawLineChart(): void {
    const lines = this.data();
    this.lineGroup()
      .selectAll<SVGPathElement, LineData<T>>('path')
      .data(lines, d => d.name)
      .join('path')
      .attr('d', d => this.lineGenerator()(d.data))
      .attr('fill', 'none')
      .attr('stroke', '#bbb'); // TODO: color
  }

  private drawXAxis(): void {
    this.xAxisGroup().call(this.xAxisGenerator());
  }
}

export interface LineData<T> {
  name: string;
  data: T[];
}
