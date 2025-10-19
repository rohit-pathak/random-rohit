import { afterRenderEffect, Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { axisLeft, axisTop, scaleBand, scaleLog, select, SeriesPoint, stack, stackOrderDescending } from "d3";
import { DomainDatum, NumberKeys } from "../chart.model";
import { DecimalPipe } from "@angular/common";
import { TooltipComponent } from "../tooltip/tooltip.component";

@Component({
  selector: 'app-horizontal-stacked-chart',
  imports: [
    DecimalPipe,
    TooltipComponent
  ],
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

  protected readonly isEmpty = computed(() => {
    const data = this.data();
    return !data || (data.length === 0);
  })
  protected readonly dimensions = inject(ResizeDirective).dimensions;
  private readonly padding = { top: 20, bottom: 5};
  protected readonly height = computed(() =>
    Math.max(this.barHeight, (this.data()?.length ?? 0) * this.barHeight));
  protected readonly svgHeight = computed(() => this.height() + this.padding.top + this.padding.bottom);
  protected readonly chartGroupTransform = `translate(0, ${this.padding.top})`;

  private readonly labelWidth = computed(() => Math.floor(0.3 * this.dimensions().width));
  private readonly barWidth = computed(() => this.dimensions().width - this.labelWidth());
  protected readonly axisTransform = computed(() => `translate(${this.labelWidth()}, 0)`);

  private readonly svgRef = viewChild.required<ElementRef>('svg');
  private readonly chartGroupRef = viewChild.required<ElementRef>('chart');
  private readonly xAxisGroupRef = viewChild.required<ElementRef>('xAxisGroup');
  private readonly labelGroupRef = viewChild.required<ElementRef>('labelGroup');
  private readonly hoverGroupRef = viewChild.required<ElementRef>('hoverGroup');
  private readonly barGroupRef = viewChild.required<ElementRef>('barGroup');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly chartGroup = computed(() => select<SVGGElement, unknown>(this.chartGroupRef().nativeElement));
  private readonly xAxisGroup = computed(() => select<SVGGElement, unknown>(this.xAxisGroupRef().nativeElement));
  private readonly labelGroup = computed(() => select<SVGGElement, unknown>(this.labelGroupRef().nativeElement));
  private readonly hoverGroup = computed(() => select<SVGGElement, unknown>(this.hoverGroupRef().nativeElement));
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
    const width = this.barWidth();
    const stackedData = this.stackedData();
    const maxStackVal = Math.max(...stackedData.flatMap(series => series.map(d => d[1])))
    return scaleLog([1, maxStackVal], [0, width]); // TODO: make scale configurable
  });
  private readonly barHeight = 15;
  private readonly bandScale = computed(() => {
    return scaleBand()
      .domain(this.data()?.map(d => this.labelFn()(d)) ?? [])
      .range([0, this.height()])
      .align(0.5)
      .padding(0.1);
  });
  private readonly labelAxis = computed(() => axisLeft(this.bandScale()));
  protected readonly xAxis = computed(() => axisTop(this.xScale()));

  protected readonly host = inject(ElementRef<HTMLElement>);
  protected readonly tooltipEvent = signal<Event | null>(null);
  protected readonly selectedDatum = signal<T | null>(null);
  protected readonly tooltipData = computed<TooltipDatum | null>(() => {
    const selectedDatum = this.selectedDatum();
    if (!selectedDatum) {
      return null;
    }
    return {
      title: this.labelFn()(selectedDatum),
      groups: this.groups().map(key => {
        return { name: key, value: selectedDatum[key] as number };
      })
    };
  });

  constructor() {
    afterRenderEffect({
      write: () => {
        this.initializeDrawing();
      }
    });
  }

  private initializeDrawing(): void {
    this.drawHoverBars();
    this.drawStackedBars();
    this.drawLabels();
    this.drawValueAxis();
  }

  private drawLabels(): void {
    this.labelGroup()
      .call(this.labelAxis()) // TODO: transition axis
    this.truncateLabelText();
  }
  private drawValueAxis(): void {
    this.xAxisGroup()
      .transition()
      .call(this.xAxis());
  }

  private truncateLabelText(): void {
    const targetWidth = this.labelWidth() - 30;
    const tempTextBox = this.svg()
      .selectAll<SVGTextElement, number>('.temp-box')
      .data([1])
      .join('text')
      .attr('class', 'temp-box')
      .attr('font-size', 10) // d3 adds these styles to the axis group
      .attr('font-family', 'sans-serif')
      .attr('transform', 'translate(-50, -50)')
      .attr('visibility', 'hidden');
    this.labelGroup().selectAll<SVGTextElement, DomainDatum<T>>('.tick text')
      .text((d) => {
        const originalText = d.toString();
        let truncatedText = d.toString();
        tempTextBox.text(truncatedText);
        while (truncatedText.length > 2 && targetWidth < (tempTextBox.node()?.getBoundingClientRect().width ?? 0)) {
          truncatedText = truncatedText.substring(0, truncatedText.length - 1);
          tempTextBox.text(truncatedText);
        }
        return truncatedText === originalText ? originalText : `${truncatedText}...`;
      });
  }

  private drawHoverBars(): void {
    const data = this.data();
    if (!data) {
      return;
    }
    const hoverBandScale = this.bandScale().copy().padding(0);
    const hoverBars = this.hoverGroup()
      .selectAll('.hover-bar')
      .data(data)
      .join('rect')
      .attr('class', 'hover-bar')
      .attr('x', this.xScale().range()[0])
      .attr('y', d => {
        const label = this.labelFn()(d);
        return hoverBandScale(label) ?? null;
      })
      .attr('width', this.xScale().range()[1])
      .attr('height', hoverBandScale.bandwidth())
      .attr('fill', '#aaa')
      .attr('opacity', 0);
    const component = this;
    hoverBars
      .on('mouseover', function (_event, d) {
        const bar = select(this);
        bar.attr('opacity', 0.3);
        component.onBarMouseover(d);
      })
      .on('mousemove', (event: Event) => this.tooltipEvent.set(event))
      .on('mouseout', function () {
        const bar = select(this);
        bar.attr('opacity', 0)
        component.onBarMouseout();
      })
  }

  private drawStackedBars(): void {
    const seriesGroups = this.barGroup()
      .selectAll('.series')
      .data(this.stackedData())
      .join('g')
      .attr('class', 'series')
      .attr('fill', series => this.colorFn()(series.key))
    seriesGroups
      .selectAll<SVGRectElement, BarDatum<T>>('.bar')
      .data(
        series=> series.map(point => ({ key: series.key, point })),
        datum => `${this.labelFn()(datum.point.data)}-${datum.key}`)
      .join('rect')
      .attr('class', 'bar')
      .on('mouseover', (_: Event, d) => this.onBarMouseover(d.point.data))
      .on('mousemove', (event: Event) => this.tooltipEvent.set(event))
      .on('mouseout', () => this.onBarMouseout())
      // .transition()
      .attr('x', (d) => this.xScale()(d.point[0] || 1))
      .attr('y', (d) => {
        const label = this.labelFn()(d.point.data);
        return this.bandScale()(label) ?? null;
      })
      .attr('width', (d) => this.xScale()(d.point[1] || 1) - this.xScale()(d.point[0] || 1))
      .attr('height', this.bandScale().bandwidth())
  }

  private onBarMouseover(d: T): void {
    // TODO: highlight bars of the same type, emit hovered datum
    this.selectedDatum.set(d);
  }

  private onBarMouseout(): void {
    // TODO: unhighlight bars, emit output
    this.selectedDatum.set(null);
    this.tooltipEvent.set(null);
  }

}

interface TooltipDatum {
  title: string;
  groups: { name: string, value: number }[];
}

/**
 * This interface captures the which key the series point is for, which helps create an id for the bars,
 * which helps with transitions.
 */
interface BarDatum<T> {
  point: SeriesPoint<T>;
  key: string;
}
