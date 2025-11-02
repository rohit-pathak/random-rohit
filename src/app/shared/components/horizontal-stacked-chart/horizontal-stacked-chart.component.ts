import { afterRenderEffect, Component, computed, ElementRef, inject, input, signal, viewChild } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { axisLeft, axisTop, scaleBand, scaleLinear, select, SeriesPoint, stack, stackOrderDescending } from "d3";
import { DomainDatum, NumberKeys } from "../chart.model";
import { DecimalPipe } from "@angular/common";
import { TooltipComponent } from "../tooltip/tooltip.component";
import { getTruncatedLabelText } from "../../utils/truncate-axis-labels";

@Component({
  selector: 'app-horizontal-stacked-chart',
  imports: [
    TooltipComponent
  ],
  templateUrl: './horizontal-stacked-chart.component.html',
  styleUrl: './horizontal-stacked-chart.component.scss',
  providers: [DecimalPipe],
  hostDirectives: [ResizeDirective],
})
export class HorizontalStackedChartComponent<T> {
  readonly data = input.required<T[] | null>();
  readonly labelFn = input.required<(d: T) => string>();
  readonly groups = input.required<Extract<NumberKeys<T>, string>[]>();
  // TODO: consider a default color scale if not provided
  readonly colorFn = input.required<(key: string) => string>();

  readonly valueFormatFn = input<((value: number) => string)>((value: number) => `${this.decimalPipe.transform(value)}`);
  readonly groupKeyFormatFn = input<(groupKey: string) => string>((key: string) => key);

  private readonly decimalPipe = inject(DecimalPipe);

  protected readonly isEmpty = computed(() => {
    const data = this.data();
    return !data || (data.length === 0);
  })
  protected readonly dimensions = inject(ResizeDirective).dimensions;
  private readonly padding = { top: 20, bottom: 5, left: 5, right: 10 };
  protected readonly height = computed(() =>
    Math.max(this.barHeight, (this.data()?.length ?? 0) * this.barHeight));
  protected readonly width = computed(() =>
    Math.max(0, this.dimensions().width - this.padding.left - this.padding.right));
  protected readonly svgHeight = computed(() => this.height() + this.padding.top + this.padding.bottom);
  protected readonly chartGroupTransform = `translate(${this.padding.left}, ${this.padding.top})`;

  private readonly labelWidth = computed(() => Math.floor(0.3 * this.width()));
  private readonly barWidth = computed(() => this.width() - this.labelWidth());
  private readonly truncatedLabels = computed(() => {
    const labelWidth = this.labelWidth();
    const labels = this.labels();
    return getTruncatedLabelText(labels, labelWidth - 10); // -10 for axis tick width
  });

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
    return scaleLinear([0, maxStackVal], [0, width]); // TODO: make scale configurable
  });
  private readonly barHeight = 15;
  private readonly labels = computed(() => this.data()?.map(d => this.labelFn()(d)) ?? []);
  private readonly bandScale = computed(() => {
    return scaleBand()
      .domain(this.labels())
      .range([0, this.height()])
      .align(0.5)
      .padding(0.1);
  });
  private readonly labelAxis = computed(() => axisLeft(this.bandScale()));
  protected readonly xAxis = computed(() =>
    axisTop(this.xScale())
      .ticks(this.width() / 80, '.0s') // TODO: make format an optional input
  );

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
        return { name: this.groupKeyFormatFn()(key), value: this.valueFormatFn()(selectedDatum[key] as number) };
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
    const truncatedLabels = this.truncatedLabels();
    this.labelGroup()
      .call(this.labelAxis()) // TODO: transition axis
      .selectAll<SVGTextElement, DomainDatum<T>>('.tick text')
      .text(d => truncatedLabels.get(d.toString()) ?? d.toString());
    // this.truncateLabelText();
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
        series => series.map(point => ({ key: series.key, point })),
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
  groups: { name: string, value: string }[];
}

/**
 * This interface captures the which key the series point is for, which helps create an id for the bars,
 * which helps with transitions.
 */
interface BarDatum<T> {
  point: SeriesPoint<T>;
  key: string;
}
