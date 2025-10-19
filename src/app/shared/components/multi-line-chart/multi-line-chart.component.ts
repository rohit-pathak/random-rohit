import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import {
  axisBottom,
  brushX,
  D3BrushEvent,
  leastIndex,
  line,
  max,
  min,
  pointer,
  scaleLinear,
  scaleLog,
  select
} from "d3";
import { TooltipComponent } from "../tooltip/tooltip.component";
import { DecimalPipe } from "@angular/common";

@Component({
  selector: 'app-multi-line-chart',
  imports: [
    TooltipComponent
  ],
  templateUrl: './multi-line-chart.component.html',
  styleUrl: './multi-line-chart.component.scss',
  providers: [DecimalPipe],
  hostDirectives: [ResizeDirective]
})
export class MultiLineChartComponent<T> {
  readonly data = input.required<LineData<T>[]>();
  readonly x = input.required<(d: T) => number>();
  readonly y = input.required<(d: T) => number>();
  readonly xSpan = input<[number, number]>();
  readonly ySpan = input<[number, number]>();
  readonly colorFn = input<(name: string) => string>(() => '#bbb');
  readonly formatFn = input<((value: number) => string)>((value: number) => `${this.decimalPipe.transform(value)}`);
  readonly brushSpan = input<[number, number] | null>();

  readonly brush = output<BrushSpan | null>();

  private readonly decimalPipe = inject(DecimalPipe);
  private readonly resize = inject(ResizeDirective);
  private readonly svgRef = viewChild.required<ElementRef>('lineChart');
  private readonly lineGroupRef = viewChild.required<ElementRef>('lineGroup');
  private readonly pointGropuRef = viewChild.required<ElementRef>('pointGroup');
  private readonly xAxisGroupRef = viewChild.required<ElementRef>('xAxisGroup');
  private readonly brushGroupRef = viewChild.required<ElementRef>('brushGroup');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineGroupRef().nativeElement));
  private readonly pointGroup = computed(() => select<SVGGElement, unknown>(this.pointGropuRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisGroupRef().nativeElement));
  private readonly brushGroup = computed(() => select<SVGGElement, unknown>(this.brushGroupRef().nativeElement));
  private readonly isBrushing = signal(false);
  private readonly hoverEvent = signal<Event | null>(null);

  protected readonly host = inject(ElementRef<HTMLElement>);
  protected readonly tooltipEvent = computed(() => {
    if (this.isBrushing()) {
      return null;
    }
    return this.hoverEvent();
  });
  protected readonly tooltipData = signal<TooltipDatum | null>(null);
  protected readonly dimensions = this.resize.dimensions;
  protected readonly padding = { top: 5, bottom: 20, left: 10, right: 10 };
  protected readonly height = computed(() => {
    const h = this.dimensions().height;
    return Math.max(0, h - this.padding.top - this.padding.bottom);
  });
  protected readonly width = computed(() => {
    const w = this.dimensions().width;
    return Math.max(0, w - this.padding.left - this.padding.right);
  });

  private readonly xScale = computed(() => {
    const data = this.data();
    const x = this.x();
    const width = this.width();
    const xVals = data.flatMap(lineData => lineData.data.map(x));
    const [start, end] = this.xSpan() ?? [min(xVals) ?? 0, max(xVals) ?? 1];
    return scaleLinear([start, end], [0, width]);
  });
  private readonly yScale = computed(() => {
    const data = this.data();
    const y = this.y();
    const height = this.height();
    const yVals = data.flatMap(lineData => lineData.data.map(y));
    const [start, end] = this.ySpan() ?? [min(yVals) ?? 1, max(yVals) ?? 10];
    return scaleLog([start, end], [height, this.padding.top]); // TODO: get scale from input
  });
  private readonly lineGenerator = computed(() => {
    const x = this.x();
    const y = this.y();
    return line<T>()
      .x(d => this.xScale()(x(d)) ?? 0)
      .y(d => this.yScale()(y(d)) ?? 0);
  });
  private readonly points = computed<PointDatum<T>[]>(() => {
    const x = this.x();
    const y = this.y();
    return this.data().flatMap(lineData => {
      return lineData.data.map(d => {
        return {
          lineName: lineData.name,
          datum: d,
          x: this.xScale()(x(d)),
          y: this.yScale()(y(d)),
        }
      })
    })
  });

  private readonly xAxisGenerator = computed(() => axisBottom(this.xScale()).ticks(5)); // TODO: make ticks an input
  protected readonly chartTransform = computed(() => `translate(${this.padding.left}, ${this.padding.top})`);
  protected readonly axisTransform = computed(() => `translate(0, ${this.height()})`);

  // TODO: set brush extent based on width and height computed signals
  private readonly chartBrush = computed(() => {
    return brushX()
      .extent([[0, 0], [this.width(), this.height()]])
      .on('brush end', (e) => this.handleBrush(e));
  })

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
    this.drawPoints();
    this.addBrush();
    this.handleTooltip();
  }

  private drawLineChart(): void {
    const lines = this.data();
    const colorFn = this.colorFn();
    this.lineGroup()
      .selectAll<SVGPathElement, LineData<T>>('.line')
      .data(lines, d => d.name)
      .join('path')
      .attr('class', 'line')
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .transition()
      .attr('d', d => this.lineGenerator()(d.data))
      .attr('fill', 'none')
      .attr('stroke', d => colorFn(d.name));
  }

  private drawPoints(): void {
    const points = this.points();
    const colorFn = this.colorFn();
    this.pointGroup()
      .selectAll<SVGGElement, PointDatum<T>>('.point')
      .data(points)
      .join('circle')
      .attr('class', 'point')
      .transition()
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)
      .attr('r', 3)
      .attr('fill', d => colorFn(d.lineName))
      .attr('opacity', 0);
  }

  private drawXAxis(): void {
    this.xAxisGroup().call(this.xAxisGenerator());
  }

  private addBrush(): void {
    const brushGroup = this.brushGroup();
    brushGroup.call(this.chartBrush());
    const extent = this.brushSpan();
    if (extent) {
      brushGroup.call(this.chartBrush().move, extent);
    } else {
      brushGroup.call(this.chartBrush().clear);
    }
  }

  private handleBrush(e: D3BrushEvent<unknown>): void {
    if (e.type === 'start' || e.type === 'brush') {
      this.isBrushing.set(true);
    }
    if (e.type === 'end') {
      this.isBrushing.set(false);
    }
    if (!e.selection) {
      this.brush.emit(null);
      return;
    }
    const range = e.selection as [number, number];
    const domain: [number, number] = [this.xScale().invert(range[0]), this.xScale().invert(range[1])];
    this.brush.emit({ domain, range });
  }

  handleTooltip(): void {
    const points = this.points();
    this.svg()
      .on('pointermove', (event: PointerEvent) => {
        const [x, y] = pointer(event);
        // Ref: https://observablehq.com/@d3/multi-line-chart/2
        const closestPointIndex = leastIndex(points, (point) => Math.hypot(x - point.x, y - point.y));
        if (closestPointIndex === undefined) {
          return;
        }
        const closestPoint = points[closestPointIndex];
        this.pointGroup()
          .selectAll<SVGCircleElement, PointDatum<T>>('.point')
          .attr('opacity', d => d === closestPoint ? 1 : 0);
        this.lineGroup()
          .selectAll<SVGPathElement, LineData<T>>('.line')
          .attr('opacity', d => d.name === closestPoint.lineName ? 1 : 0.4)
          .filter(d => d.name === closestPoint.lineName)
          .raise();
        this.hoverEvent.set(event);
        this.tooltipData.set({
          title: `${this.x()(closestPoint.datum)}`,
          lineName: `${closestPoint.lineName}`,
          value: this.formatFn()(this.y()(closestPoint.datum)),
        });
      })
      .on('pointerleave', () => {
        this.pointGroup()
          .selectAll('.point')
          .attr('opacity', 0);
        this.lineGroup().selectAll('.line')
          .attr('opacity', 1)
        this.hoverEvent.set(null);
      })
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

interface PointDatum<T> {
  lineName: string;
  datum: T
  x: number;
  y: number;
}

interface TooltipDatum {
  title: string;
  lineName: string;
  value: string;
}
