import { AfterViewInit, Component, computed, effect, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { line, max, min, scaleLinear, select } from "d3";
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
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly lineGroup = computed(() => select<SVGGElement, unknown>(this.lineRef().nativeElement));
  private readonly resize = inject(ResizeDirective);
  private readonly aidDataStore = inject(AidDataStore);
  private readonly xScale = computed(() => {
    const data = this.aidDataStore.transactionsPerYear();
    const width = this.dimensions().width ?? 0;
    return scaleLinear([min(data.map(d => d.year)) ?? 0, max(data.map(d => d.year)) ?? 0], [0, width]);
  })
  private readonly yScale = computed(() => {
    const data = this.aidDataStore.transactionsPerYear();
    return scaleLinear([0, max(data.map(d => d.amount)) ?? 0], [this.height, 0]);
  })
  private readonly lineGenerator = computed(() => {
    return line<YearTotal>()
      .x(d => this.xScale()(d.year) ?? 0)
      .y(d => this.yScale()(d.amount) ?? 0);
  })

  protected readonly dimensions= this.resize.dimensions;
  protected readonly height = 80;

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
    }, {injector: this.injector});
  }

  private drawLineChart(): void {
    const data = this.aidDataStore.transactionsPerYear();
    console.log(data);
    console.log(this.lineGenerator()(data));
    this.lineGroup()
      .selectAll('path')
      .data([data])
      .join('path')
      .attr('d', d => this.lineGenerator()(d))
      .attr('fill', 'none')
      .attr('stroke', '#bbb');
  }

}
