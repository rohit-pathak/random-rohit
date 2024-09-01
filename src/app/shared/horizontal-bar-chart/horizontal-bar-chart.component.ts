import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, effect,
  ElementRef,
  inject, Injector,
  input,
  output,
  viewChild
} from '@angular/core';
import { ScaleBand, scaleBand, ScaleLinear, scaleLinear, select, Selection } from "d3";

@Component({
  selector: 'app-horizontal-bar-chart',
  standalone: true,
  imports: [],
  templateUrl: './horizontal-bar-chart.component.html',
  styleUrl: './horizontal-bar-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HorizontalBarChartComponent<T> implements AfterViewInit {
  data = input.required<T[]>();
  valueFn = input.required<(d: T) => number>();
  labelFn = input.required<(d: T) => string>();

  barMouseover = output<T>();
  barMouseout = output<void>();

  private svg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private barGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 400; // TODO: update dynamically on resize
  private height = 0; // determined by number of bars
  private barHeight = 15;
  private barPadding = 1;
  private margin = {top: 10, bottom: 30, left: 100, right: 10};
  private xScale!: ScaleLinear<number, number, number>;
  // private yScale!: ScaleBand<string>;

  private svgRef = viewChild.required<ElementRef>('chart');
  private injector = inject(Injector);

  ngAfterViewInit() {
    this.svg = select<SVGSVGElement, unknown>(this.svgRef().nativeElement)
      .attr('width', `${this.width}px`)
      .attr('height', `${this.height}px`);
    this.barGroup = this.svg.append('g')
      .attr('class', 'bar-group');
    this.initializeDrawing();
  }

  private initializeDrawing(): void {
    effect(() => {
      // TODO: determine left margin based on max label length before setting scales
      this.shiftChartForLeftMargin();
      this.setScales();
      this.drawBars();
      this.setSVGHeight();
    }, {injector: this.injector});
  }

  private shiftChartForLeftMargin(): void {
    this.barGroup.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
  }

  private setScales(): void {
    this.xScale = scaleLinear()
      .domain([0, Math.max(...this.data().map(this.valueFn()))])
      .range([0, this.width - this.margin.left - this.margin.right])
      .unknown(0);
    const chartHeight = (this.barHeight + this.barPadding) * this.data().length;
    this.height = chartHeight + this.margin.top + this.margin.bottom;
    // this.yScale = scaleBand()
    //   .domain([...this.data()].sort((a, b) => this.valueFn()(a) - this.valueFn()(b)).map(this.labelFn()))
    //   .range([this.height - this.margin.bottom, 0])
    //   .paddingInner(this.barPadding);
  }

  private drawBars(): void {
    this.barGroup
      .attr('fill', 'grey') // TODO: decide colors
      .selectAll<SVGRectElement, T>('.bar')
      .data(this.data(), d => this.labelFn()(d))
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', (_, i) => i * (this.barHeight + this.barPadding))
      .attr('width', d => this.xScale(this.valueFn()(d)))
      .attr('height', this.barHeight);
  }

  private setSVGHeight(): void {
    this.svg.attr('height', `${this.height}px`);
  }

}
