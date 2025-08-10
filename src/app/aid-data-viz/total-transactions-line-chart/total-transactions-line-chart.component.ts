import { AfterViewInit, Component, computed, effect, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { axisBottom, brushX, D3BrushEvent, line, max, min, scaleLinear, scaleLog, select } from "d3";
import { AidDataStore, YearTotal } from "../aid-data.store";
import { ResizeDirective } from "../../shared/directives/resize.directive";

@Component({
  selector: 'app-total-transactions-line-chart',
  imports: [],
  templateUrl: './total-transactions-line-chart.component.html',
  styleUrl: './total-transactions-line-chart.component.scss',
  hostDirectives: [ResizeDirective],
})
export class TotalTransactionsLineChartComponent implements AfterViewInit {
  private readonly injector = inject(Injector);
  private readonly svgRef = viewChild.required<ElementRef>('lineChart');
  private readonly lineRef = viewChild.required<ElementRef>('line');
  private readonly xAxisRef = viewChild.required<ElementRef>('xAxis');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisRef().nativeElement));
  private readonly resize = inject(ResizeDirective);
  private readonly aidDataStore = inject(AidDataStore);

  private readonly padding = 20;
  protected readonly totalHeight = 100;
  protected readonly dimensions= this.resize.dimensions;
  protected readonly height = this.totalHeight - this.padding;
  private readonly xScale = computed(() => {
    const data = this.aidDataStore.transactionsPerYear();
    const width = this.dimensions().width;
    return scaleLinear([min(data.map(d => d.year)) ?? 0, max(data.map(d => d.year)) ?? 0], [0, width]);
  })
  private readonly yScale = computed(() => {
    const data = this.aidDataStore.transactionsPerYear();
    const amounts = data.map(d => d.amount);
    return scaleLog([min(amounts) ?? 0, max(amounts ?? 0) ?? 0], [this.height, 0]);
  })
  private readonly lineGenerator = computed(() => {
    return line<YearTotal>()
      .x(d => this.xScale()(d.year) ?? 0)
      .y(d => this.yScale()(d.amount) ?? 0);
  });
  private readonly xAxisGenerator = computed(() => axisBottom(this.xScale()));
  private readonly chartBrush = brushX().on('brush', (e) => this.handleBrush(e));

  protected readonly axisTransform = computed(() => `translate(0, ${this.height})`);

  public ngAfterViewInit(): void {
    this.initializeDrawing();
  }

  private initializeDrawing(): void {
    effect(() => {
      const dimensions = this.dimensions();
      const data = this.aidDataStore.transactionsPerYear();
      if (!dimensions || !data) {
        return;
      }
      this.drawLineChart();
      this.drawXAxis();
      this.addBrush();
    }, {injector: this.injector});
  }

  private drawLineChart(): void {
    const data = this.aidDataStore.transactionsPerYear();
    this.lineGroup()
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', d => this.lineGenerator()(d))
      .attr('fill', 'none')
      .attr('stroke', '#bbb');
  }

  private drawXAxis(): void {
    this.xAxisGroup().call(this.xAxisGenerator());
  }

  private addBrush(): void {
    if (!this.lineGroup().select('.overlay').empty()) {
      this.lineGroup().call(this.chartBrush.move, null);
    }
    // TODO: check why after resize the brush area is not correct
    this.lineGroup().call(this.chartBrush);
  }

  private handleBrush(e: D3BrushEvent<unknown>): void {
    if (!e.selection) {
      this.aidDataStore.setYearRange(null);
      return;
    }
    const [x1, x2] = e.selection as [number, number];
    const selectedYears = this.aidDataStore.transactionsPerYear()
      .map(t => t.year)
      .filter(year => this.xScale()(year) >= x1 && this.xScale()(year) <= x2);
    this.aidDataStore.setYearRange([selectedYears[0], selectedYears[1]]);
  }

}
