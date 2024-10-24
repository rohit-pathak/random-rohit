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
  axisBottom, AxisDomain,
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
import { ResizeObserverService } from "../services/resize-observer.service";

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
  highlight = input<T | null>();

  barMouseover = output<T>();
  barMouseout = output<void>();

  hoveredDatum = signal<{label: string, value: string} | null>(null);

  // domainData transformation helps d3 figure out values for the scale and axis
  private domainData = computed<DomainDatum<T>[]>(() => {
    return this.data().map(d => this.asDomainDatum(d));
  })
  private svg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private barGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private xAxisGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private yAxisGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private barHeight = 15;
  private barPadding = 1;
  private margin = {top: 10, bottom: 30, left: 100, right: 10};
  private xScale!: ScaleLinear<number, number, number>;
  private yScale!: ScaleOrdinal<DomainDatum<T>, number>;

  private svgRef = viewChild.required<ElementRef>('chart');
  private tooltip = viewChild.required<ElementRef>('tooltip');
  private injector = inject(Injector);
  private resizeObserverService = inject(ResizeObserverService);
  private hostElement = inject(ElementRef);
  private resize = this.resizeObserverService.observeResize(this.hostElement);
  private width = computed(() => this.resize().width);
  private height = 0; // determined by number of bars

  ngAfterViewInit() {
    this.svg = select<SVGSVGElement, unknown>(this.svgRef().nativeElement)
      .attr('width', `${this.width()}px`)
      .attr('height', `${this.height}px`);
    this.barGroup = this.svg.append('g')
      .attr('class', 'bar-group');
    this.xAxisGroup = this.svg.append('g')
      .attr('class', 'x-axis');
    this.yAxisGroup = this.svg.append('g')
      .attr('class', 'y-axis');
    this.initializeDrawing();
    this.highlightInputDatum();
  }

  private initializeDrawing(): void {
    effect(() => {
      if (!this.width()) {
        return;
      }
      this.svg.attr('width', this.width());
      // TODO: determine left margin based on max label length before setting scales
      this.shiftChartForLeftMargin();
      this.setScales();
      this.drawBars();
      this.drawAxes();
      this.handleHover();
      this.setSVGHeight();
    }, {injector: this.injector, allowSignalWrites: true});
  }

  private highlightInputDatum(): void {
    effect(() => {
      const highlightDatum = this.highlight();
      if (!this.domainData()?.length || !highlightDatum) {
        this.unHighlightElements();
        return;
      }
      this.highlightElementsForDatum(highlightDatum);
    }, {injector: this.injector});
  }

  private shiftChartForLeftMargin(): void {
    this.barGroup.attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
  }

  private setScales(): void {
    this.xScale = scaleLinear()
      .domain([0, Math.max(...this.domainData().map(this.valueFn()))])
      .range([0, this.width() - this.margin.left - this.margin.right])
      .unknown(0);
    const chartHeight = (this.barHeight + this.barPadding) * this.domainData().length;
    this.height = chartHeight + this.margin.top + this.margin.bottom;
    this.yScale = scaleOrdinal<DomainDatum<T>, number>()
      .domain(this.domainData())
      .range(this.domainData().map((_, i) => i * (this.barHeight + this.barPadding)));
  }

  private drawBars(): void {
    const bars = this.barGroup // group that contains both data and "hover" bars
      .selectAll<SVGGElement, T>('.bar')
      .data(this.domainData(), d => {
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
      .attr('y', d => this.yScale(d))
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
      .attr('height', this.barHeight + this.barPadding)
      .attr('y', d => this.yScale(d))
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
    const hoverableElements = this.svg.selectAll<BaseType, T>('.hover-bar, .y-axis .tick');
    hoverableElements
      .on('mouseover', (_, hoveredDatum) => {
        this.highlightElementsForDatum(hoveredDatum);
        this.hoveredDatum.set({ label: this.labelFn()(hoveredDatum), value: `${this.valueFn()(hoveredDatum)}` });
        this.barMouseover.emit(hoveredDatum);
      })
      .on('mousemove', (event: MouseEvent) => {
        select(this.tooltip().nativeElement)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY + 20}px`);
      })
      .on('mouseout', () => {
        this.unHighlightElements();
        this.hoveredDatum.set(null);
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
    this.yAxisGroup.selectAll<SVGTextElement, DomainDatum<T>>('.tick text')
      .text(function(d) {
        let truncatedText = d.toString();
        tempTextBox.text(truncatedText);
        while (targetWidth < (tempTextBox.node()?.getBoundingClientRect().width ?? 0)) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          tempTextBox.text(truncatedText);
        }
        return truncatedText === d ? d : `${truncatedText}...`;
      });
  }

  private highlightElementsForDatum(datum: T): void {
    const domainDatum = this.asDomainDatum(datum);
    this.svg.selectAll<BaseType, DomainDatum<T>>('.bar, .y-axis .tick')
      .attr('opacity', (d) => {
        // TODO: this equality check is a hack. Perhaps accept and equality fn?
        const isElementToHighlight = domainDatum.toString() === d.toString() && domainDatum.valueOf() === d.valueOf();
        return isElementToHighlight ? 1 : 0.4;
      });
  }

  private unHighlightElements(): void {
    this.svg.selectAll<BaseType, T | string>('.bar, .y-axis .tick')
      .attr('opacity', null);
  }

  private setSVGHeight(): void {
    this.svg.attr('height', `${this.height}px`);
  }

  private asDomainDatum(datum: T): DomainDatum<T> {
    const label = this.labelFn ? this.labelFn()(datum) : '';
    const value = this.valueFn ? this.valueFn()(datum) : 0;
    return {
      ...datum,
      toString: () => label,
      valueOf: () => value
    };
  }

}

type DomainDatum<T> = T & { toString(): string } & AxisDomain;
