import { afterRenderEffect, Component, computed, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { axisBottom, brushX, D3BrushEvent, line, max, min, scaleLinear, scaleLog, select } from "d3";

@Component({
  selector: 'app-multi-line-chart',
  imports: [],
  templateUrl: './multi-line-chart.component.html',
  styleUrl: './multi-line-chart.component.scss',
  hostDirectives: [ResizeDirective]
})
export class MultiLineChartComponent<T> {
  readonly data = input.required<LineData<T>[]>();
  readonly x = input.required<(d: T) => number>();
  readonly y = input.required<(d: T) => number>();
  readonly xSpan = input<[number, number]>();
  readonly ySpan = input<[number, number]>();
  readonly colorFn = input<(name: string) => string>(() => '#bbb');
  readonly brushSpan = input<[number, number] | null>();

  readonly brush = output<BrushSpan | null>();

  private readonly resize = inject(ResizeDirective);
  private readonly svgRef = viewChild.required<ElementRef>('lineChart');
  private readonly lineGroupRef = viewChild.required<ElementRef>('lineGroup');
  private readonly xAxisGroupRef = viewChild.required<ElementRef>('xAxisGroup');
  private readonly brushGroupRef = viewChild.required<ElementRef>('brushGroup');
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineGroupRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisGroupRef().nativeElement));
  private readonly brushGroup = computed(() => select<SVGGElement, unknown>(this.brushGroupRef().nativeElement));

  protected readonly dimensions = this.resize.dimensions;
  protected readonly padding = { top: 5, bottom: 20 };
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

  private readonly xAxisGenerator = computed(() => axisBottom(this.xScale()).ticks(5)); // TODO: make ticks an input
  protected readonly axisTransform = computed(() => `translate(0, ${this.padding.top + this.height()})`);

  private readonly chartBrush = brushX().on('brush end', (e) => this.handleBrush(e));

  constructor() {
    afterRenderEffect(() => {
      this.initializeDrawing();
    });
  }

  private initializeDrawing(): void {
    const dimensions = this.dimensions();
    const data = this.data();
    if (!dimensions || !data) {
      return;
    }
    this.drawLineChart();
    this.drawXAxis();
    this.addBrush();
  }

  private drawLineChart(): void {
    const lines = this.data();
    const colorFn = this.colorFn();
    this.lineGroup()
      .selectAll<SVGPathElement, LineData<T>>('path')
      .data(lines, d => d.name)
      .join('path')
      .attr('d', d => this.lineGenerator()(d.data))
      .attr('fill', 'none')
      .attr('stroke', d => colorFn(d.name));
  }

  private drawXAxis(): void {
    this.xAxisGroup().call(this.xAxisGenerator());
  }

  private addBrush(): void {
    const brushGroup = this.brushGroup();
    brushGroup.call(this.chartBrush);
    const extent = this.brushSpan();
    if (extent) {
      brushGroup.call(this.chartBrush.move, extent);
    } else {
      brushGroup.call(this.chartBrush.clear);
    }
  }

  private handleBrush(e: D3BrushEvent<unknown>): void {
    if (!e.selection) {
      this.brush.emit(null);
      return;
    }
    const range = e.selection as [number, number];
    const domain: [number, number] = [this.xScale().invert(range[0]), this.xScale().invert(range[1])];
    this.brush.emit({ domain, range });
  }
}

export interface LineData<T> {
  name: string;
  data: T[];
}

export interface BrushSpan {
  domain: [number, number]
  range: [number, number]
}
