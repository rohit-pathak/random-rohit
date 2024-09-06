import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  viewChild
} from '@angular/core';
import { axisBottom, axisLeft, ScaleLinear, scaleLinear, scaleOrdinal, ScaleOrdinal, select, Selection } from "d3";

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
  idFn = input<(d: T) => string>();
  colorFn = input<(d: T) => string>();

  barMouseover = output<T>();
  barMouseout = output<void>();

  private svg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private barGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private xAxisGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private yAxisGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 400; // TODO: update dynamically on resize
  private height = 0; // determined by number of bars
  private barHeight = 15;
  private barPadding = 1;
  private margin = {top: 10, bottom: 30, left: 100, right: 10};
  private xScale!: ScaleLinear<number, number, number>;
  private yScale!: ScaleOrdinal<string, number>;

  private svgRef = viewChild.required<ElementRef>('chart');
  private injector = inject(Injector);

  ngAfterViewInit() {
    this.svg = select<SVGSVGElement, unknown>(this.svgRef().nativeElement)
      .attr('width', `${this.width}px`)
      .attr('height', `${this.height}px`);
    this.barGroup = this.svg.append('g')
      .attr('class', 'bar-group');
    this.xAxisGroup = this.svg.append('g')
      .attr('class', 'x-axis');
    this.yAxisGroup = this.svg.append('g')
      .attr('class', 'y-axis');
    this.initializeDrawing();
  }

  private initializeDrawing(): void {
    effect(() => {
      // TODO: determine left margin based on max label length before setting scales
      this.shiftChartForLeftMargin();
      this.setScales();
      this.drawBars();
      this.drawAxes();
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
    this.yScale = scaleOrdinal<string, number>()
      .domain(this.data().map(this.labelFn()))
      .range(this.data().map((_, i) => i * (this.barHeight + this.barPadding)));
  }

  private drawBars(): void {
    this.barGroup
      .selectAll<SVGRectElement, T>('.bar')
      .data(this.data(), d => {
        const idFn = this.idFn();
        return idFn ? idFn(d) : this.labelFn()(d)
      })
      .join('rect')
      .attr('class', 'bar')
      .attr('fill', d => {
        const colorFn = this.colorFn();
        return colorFn ? colorFn(d) : 'black';
      })
      .attr('x', 0)
      .attr('height', this.barHeight)
      .transition()
      .attr('y', d => this.yScale(this.labelFn()(d)))
      .attr('width', d => this.xScale(this.valueFn()(d)));
  }

  private drawAxes(): void {
    const xAxis = axisBottom(this.xScale)
      .ticks(4, "s");
    this.xAxisGroup
      .attr('transform', `translate(${this.margin.left}, ${this.height - this.margin.bottom})`)
      .call(xAxis);
    const yAxis = axisLeft(this.yScale);
    this.yAxisGroup
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.barHeight / 2})`)
      .call(yAxis)
      .call(yAxisGroup => yAxisGroup.select('.domain').remove());
  }

  private setSVGHeight(): void {
    this.svg.attr('height', `${this.height}px`);
  }

}
