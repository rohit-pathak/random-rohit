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
import { arc, pie, PieArcDatum, select, Selection } from "d3";
import { TooltipComponent } from "../tooltip/tooltip.component";
import { CommonModule } from "@angular/common";
import { ResizeDirective } from "../../directives/resize.directive";

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [
    CommonModule,
    TooltipComponent
  ],
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [ResizeDirective],
})
export class DonutChartComponent<T> implements AfterViewInit {
  data = input.required<T[]>();
  valueFn = input.required<(d: T) => number>();
  labelFn = input.required<(d: T) => string>();
  colorFn = input.required<(d: T) => string>();
  highlight = input<T | null>(); // TODO: accept a list of strings (labels) instead of T
  showTooltip = input(true);
  title = input<string | null>(null);

  sectorMouseover = output<T>();
  sectorMouseout = output<void>();

  private resize = inject(ResizeDirective).resize;
  private arcGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = computed(() => this.resize().width ?? 100);
  private svgRef = viewChild.required<ElementRef>('chart');
  private svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private injector = inject(Injector);

  host = inject(ElementRef<HTMLElement>);
  tooltipEvent = signal<Event | null>(null);
  selectedDatum = signal<T | null>(null);
  tooltipData = computed<{ title: string, value: number} | null>(() => {
    const selectedDatum = this.selectedDatum();
    if (!selectedDatum) {
      return null;
    }
    return { title: this.labelFn()(selectedDatum), value: this.valueFn()(selectedDatum) };
  });

  ngAfterViewInit(): void {
    this.arcGroup = this.svg().append('g').attr('class', 'arc-group');
    this.initializeDrawing();
    this.highlightInputDatum();
  }

  private initializeDrawing(): void {
    effect(() => {
      if (!this.data() || !this.data().length || !this.width()) {
        return;
      }
      this.resizeSVG();
      this.drawChart();
    }, {injector: this.injector});
  }

  private resizeSVG(): void {
    this.svg()
      .attr('width', `${this.width()}px`)
      .attr('height', `${this.width()}px`);
    this.arcGroup.attr('transform', `translate(${this.width() / 2},${this.width() / 2})`);
  }

  private highlightInputDatum(): void {
    effect(() => {
      const highlightDatum = this.highlight();
      if (!highlightDatum) {
        this.unhighlightSectors();
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
      .innerRadius(this.width() / 2 - 15)
      .outerRadius(this.width() / 2);
    this.arcGroup
      .selectAll<SVGPathElement, PieArcDatum<T>>('path')
      .data(pieData, d => this.labelFn()(d.data))
      .join('path')
      .attr('d', arcGenerator)
      .attr('fill', d => this.colorFn()(d.data))
      .attr('stroke', 'white')
      .on('mouseover', (event: Event, d) => this.onSectorMouseover(d))
      .on('mousemove', (event: Event) => this.tooltipEvent.set(event))
      .on('mouseout', () => this.onSectorMouseout());
  }

  private onSectorMouseover(pieDatum: PieArcDatum<T>): void {
    this.highlightSector(pieDatum.data);
    this.selectedDatum.set(pieDatum.data);
    this.sectorMouseover.emit(pieDatum.data);
  }

  private onSectorMouseout(): void {
    this.unhighlightSectors();
    this.selectedDatum.set(null);
    this.tooltipEvent.set(null);
    this.sectorMouseout.emit();
  }

  private highlightSector(datum: T): void {
    this.arcGroup.selectAll<SVGPathElement, PieArcDatum<T>>('path')
      .attr('opacity', d => this.labelFn()(d.data) === this.labelFn()(datum) ? 1 : 0.4);
  }

  private unhighlightSectors(): void {
    this.arcGroup.selectAll('path').attr('opacity', 1);
  }
}
