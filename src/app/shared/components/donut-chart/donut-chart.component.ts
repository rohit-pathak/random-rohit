import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input, output,
  viewChild
} from '@angular/core';
import { arc, pie, PieArcDatum, select, Selection } from "d3";

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DonutChartComponent<T> implements AfterViewInit {
  data = input.required<T[]>();
  valueFn = input.required<(d: T) => number>();
  labelFn = input.required<(d: T) => string>();
  colorFn = input.required<(d: T) => string>();
  highlight = input<T | null>();

  sectorMouseover = output<T>();
  sectorMouseout = output<void>();

  private svg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private arcGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 100; // TODO: update dynamically on resize

  private svgRef = viewChild.required<ElementRef>('chart');
  private injector = inject(Injector);

  ngAfterViewInit(): void {
    this.svg = select<SVGSVGElement, unknown>(this.svgRef().nativeElement)
      .attr('width', `${this.width}px`)
      .attr('height', `${this.width}px`);
    this.arcGroup = this.svg.append('g')
      .attr('class', 'arc-group')
      .attr('transform', `translate(${this.width / 2},${this.width / 2})`);
    this.initializeDrawing();
    this.highlightInputDatum();
  }

  private initializeDrawing(): void {
    effect(() => {
      if (!this.data() || !this.data().length) {
        return;
      }
      // TODO: update svg on resize
      this.drawChart();
    }, {injector: this.injector});
  }

  private highlightInputDatum(): void {
    effect(() => {
      const highlightDatum = this.highlight();
      if (!this.data() || !this.data().length || !highlightDatum) {
        return;
      }
      this.highlightSector(highlightDatum);
    }, {injector: this.injector});
  }

  private drawChart(): void {
    const pieGenerator = pie<T>()
      .value(d => this.valueFn()(d));
    const pieData = pieGenerator(this.data());
    const arcGenerator = arc<typeof pieData[number]>()
      .innerRadius(this.width / 2 - 20)
      .outerRadius(this.width / 2);
    this.arcGroup
      .selectAll<SVGPathElement, PieArcDatum<T>>('path')
      .data(pieData, d => this.labelFn()(d.data))
      .join('path')
      .attr('d', arcGenerator)
      .attr('fill', d => this.colorFn()(d.data))
      .attr('stroke', 'white')
      .on('mouseover', (_, d) => this.onSectorMouseover(d))
      .on('mouseout', () => this.onSectorMouseout());
  }

  private onSectorMouseover(pieDatum: PieArcDatum<T>): void {
    this.highlightSector(pieDatum.data);
    this.sectorMouseover.emit(pieDatum.data);
  }

  private onSectorMouseout(): void {
    this.arcGroup.selectAll('path')
      .attr('opacity', 1);
    this.sectorMouseout.emit();
  }

  private highlightSector(datum: T): void {
    this.arcGroup.selectAll<SVGPathElement, PieArcDatum<T>>('path')
      .attr('opacity', d => this.labelFn()(d.data) === this.labelFn()(datum) ? 1 : 0.4);
  }
}
