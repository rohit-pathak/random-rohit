import { afterRenderEffect, Component, computed, ElementRef, inject, input, viewChild } from '@angular/core';
import { ResizeDirective } from "../../directives/resize.directive";
import { axisLeft, scaleBand, scaleLinear, select, stack, stackOrderDescending } from "d3";
import { DomainDatum, NumberKeys } from "../chart.model";

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
  protected readonly height = computed(() =>
    Math.max(this.barHeight, (this.data()?.length ?? 0) * this.barHeight));

  private readonly labelWidth = computed(() => Math.floor(0.3 * this.dimensions().width));
  private readonly barWidth = computed(() => this.dimensions().width - this.labelWidth());
  protected readonly axisTransform = computed(() => `translate(${this.labelWidth()}, 0)`);

  private readonly svgRef = viewChild.required<ElementRef>('svg');
  private readonly labelGroupRef = viewChild.required<ElementRef>('labelGroup');
  private readonly barGroupRef = viewChild.required<ElementRef>('barGroup');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly labelGroup = computed(() => select<SVGGElement, unknown>(this.labelGroupRef().nativeElement));
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
    return scaleLinear([0, maxStackVal], [0, width]); // TODO: try log scale
  });
  private readonly barHeight = 20;
  private readonly bandScale = computed(() => {
    return scaleBand()
      .domain(this.data()?.map(d => this.labelFn()(d)) ?? [])
      .range([0, this.height()])
      .padding(0.1);
  });
  private readonly labelAxis = computed(() => axisLeft(this.bandScale()));

  constructor() {
    afterRenderEffect({
      write: () => {
        this.initializeDrawing();
      }
    });
  }

  private initializeDrawing(): void {
    this.drawStackedBars();
    this.drawLabels();
  }

  private drawLabels(): void {
    this.labelGroup()
      .call(this.labelAxis())
      .selectAll('.tick text')
    this.truncateLabelText();
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

