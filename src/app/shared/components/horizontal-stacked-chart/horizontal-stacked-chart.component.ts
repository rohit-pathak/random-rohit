import { afterRenderEffect, Component, computed, ElementRef, inject, input, viewChild } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { scaleBand, scaleLinear, select, stack, stackOrderDescending } from "d3";

@Component({
  selector: 'app-horizontal-stacked-chart',
  imports: [],
  templateUrl: './horizontal-stacked-chart.component.html',
  styleUrl: './horizontal-stacked-chart.component.scss',
  hostDirectives: [ResizeDirective],
})
export class HorizontalStackedChartComponent<T> {
  readonly data = input.required<T[] | null>();
  readonly labelFn = input.required<(d: T) => string>();
  readonly groups = input.required<Extract<NumberKeys<T>, string>[]>();
  // TODO: consider a default color scale if not provided
  readonly colorFn = input.required<(key: string) => string>();

  protected readonly dimensions = inject(ResizeDirective).dimensions;

  private readonly svgRef = viewChild.required<ElementRef>('svg');
  private readonly barGroupRef = viewChild.required<ElementRef>('barGroup');
  private readonly barGroup = computed(() => select<SVGGElement, unknown>(this.barGroupRef().nativeElement))
  private readonly stackGenerator = computed(() =>
    stack<T>()
      .keys(this.groups())
      .order(stackOrderDescending)
  );
  private readonly stackedData = computed(() => {
    const data = this.data();
    if (!data) {
      return [];
    }
    return this.stackGenerator()(data);
  });
  private readonly xScale = computed(() => {
    const width = this.dimensions().width;
    const stackedData = this.stackedData();
    const maxStackVal = Math.max(...stackedData.flatMap(series => series.map(d => d[1])))
    return scaleLinear([0, maxStackVal], [0, width]);
  });
  private readonly barHeight = 30;

  protected readonly height = computed(() => {
    return Math.max(this.barHeight, (this.data()?.length ?? 0) * this.barHeight);
  });

  private readonly bandScale = computed(() => {
    return scaleBand()
      .domain(this.data()?.map(d => this.labelFn()(d)) ?? [])
      .range([0, this.height()])
      .padding(0.1);
  });

  constructor() {
    afterRenderEffect({
      write: () => {
        this.initializeDrawing();
      }
    });
  }

  private initializeDrawing(): void {
    this.drawStackedBars();
  }

  private drawStackedBars(): void {
    const seriesGroups = this.barGroup()
      .selectAll('.series')
      .data(this.stackedData())
      .join('g')
      .attr('class', 'series')
      .attr('fill', series => this.colorFn()(series.key))
    seriesGroups
      .selectAll('.bar')
      .data(d => d)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', (d) => this.xScale()(d[0]))
      .attr('y', (d) => {
        const label = this.labelFn()(d.data);
        return this.bandScale()(label) ?? null;
      })
      .attr('width', (d) => this.xScale()(d[1]) - this.xScale()(d[0]))
      .attr('height', this.bandScale().bandwidth());
  }

}

type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never
}[keyof T];

