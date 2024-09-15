import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component, computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {
  axisBottom,
  axisLeft,
  BaseType,
  ScaleLinear,
  scaleLinear,
  scaleOrdinal,
  ScaleOrdinal,
  select,
  Selection
} from "d3";
import { CommonModule } from "@angular/common";

@Component({
  selector: 'app-horizontal-bar-chart',
  standalone: true,
  imports: [CommonModule],
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

  hoveredDatum = signal<{label: string, value: string} | null>(null);

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
  private labelDataMap = computed<Record<string, T>>(() => {
    return this.data().reduce((acc, curr) => {
      acc[this.labelFn()(curr)] = curr;
      return acc;
    }, {} as Record<string, T>);
  });

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
      this.handleHover();
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
    const bars = this.barGroup // group that contains both data and "hover" bars
      .selectAll<SVGGElement, T>('.bar')
      .data(this.data(), d => {
        const idFn = this.idFn();
        return idFn ? idFn(d) : this.labelFn()(d)
      })
      .join('g')
      .attr('class', 'bar');

    // draw data bars
    bars
      .selectAll<SVGRectElement, T>('.data-bar')
      .data(d => [d])
      .join('rect')
      .attr('class', 'data-bar')
      .attr('fill', d => {
        const colorFn = this.colorFn();
        return colorFn ? colorFn(d) : 'black';
      })
      .attr('x', 0)
      .attr('height', this.barHeight)
      .transition()
      .attr('y', d => this.yScale(this.labelFn()(d)))
      .attr('width', d => this.xScale(this.valueFn()(d)));

    // draw hover bars
    bars
      .selectAll<SVGRectElement, T>('.hover-bar')
      .data(d => [d])
      .join('rect')
      .attr('class', 'hover-bar')
      .attr('fill', 'none')
      .attr('pointer-events', 'fill')
      .attr('x', 0)
      .attr('height', this.barHeight)
      .attr('y', d => this.yScale(this.labelFn()(d)))
      .attr('width', this.xScale.range()?.at(-1) ?? 0);
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
    this.truncateLabelText();
  }

  private handleHover(): void {
    const hoverableElements = this.svg.selectAll<BaseType, T | string>('.hover-bar, .y-axis .tick');
    hoverableElements
      .on('mouseover', (_, d) => {
        const label = typeof d === 'string' ? d : this.labelFn()(d);
        this.svg.selectAll<BaseType, T | string>('.bar, .y-axis .tick')
          .attr('opacity', (d) => {
            const isHoveredElement = typeof d === 'string' ? (label === d) : this.labelFn()(d) === label;
            return isHoveredElement ? 1 : 0.4;
          });
        this.barMouseover.emit(this.labelDataMap()[label]);
      })
      .on('mouseout', () => {
        this.svg.selectAll<BaseType, T | string>('.bar, .y-axis .tick')
          .attr('opacity', null);
        this.barMouseout.emit();
      });
  }

  private truncateLabelText(): void {
    const targetWidth = this.margin.left - 5;
    const tempTextBox = this.svg
      .selectAll<SVGTextElement, number>('.temp-box')
      .data([1])
      .join('text')
      .attr('class', 'temp-box')
      .attr('transform', 'translate(-50, -50)')
      .attr('visibility', 'hidden');
    this.yAxisGroup.selectAll<SVGTextElement, string>('.tick text')
      .text(function(d) {
        let truncatedText = d;
        tempTextBox.text(truncatedText);
        while (targetWidth < (tempTextBox.node()?.getBoundingClientRect().width ?? 0)) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          tempTextBox.text(truncatedText);
        }
        return truncatedText === d ? d : `${truncatedText}...`;
      });
  }

  private setSVGHeight(): void {
    this.svg.attr('height', `${this.height}px`);
  }

  // TODO: experiment with creating a y-axis using y-scale as ScaleOrdinal<T, number>
  private getDatumWithToString(datum: T): T & { toString(): string } {
    const label = this.labelFn()(datum);
    return {
      ...datum,
      toString(): string {
        return label
      }
    };
  }

}
