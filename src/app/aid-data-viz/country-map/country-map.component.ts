import { AfterViewInit, Component, computed, effect, ElementRef, inject, Injector, viewChild } from '@angular/core';
import { AidDataStore } from "../aid-data.store";
import { ResizeDirective } from "../../shared/directives/resize.directive";
import { geoMercator, geoNaturalEarth1, geoPath, select, Selection } from "d3";
import { FeatureCollection } from "geojson";

@Component({
  selector: 'app-country-map',
  imports: [],
  templateUrl: './country-map.component.html',
  hostDirectives: [ResizeDirective],
  styleUrl: './country-map.component.scss'
})
export class CountryMapComponent implements AfterViewInit {
  private readonly aidDataStore = inject(AidDataStore);
  private readonly injector = inject(Injector);
  private readonly svgRef = viewChild.required<ElementRef>('chart')
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly dimensions = inject(ResizeDirective).dimensions;
  private readonly mapWidth = computed(() => 0.7 * this.dimensions().width)
  private readonly projection = computed(() => {
    const geoJson = this.aidDataStore.countriesGeoJson();
    const projection = geoNaturalEarth1();
    if (geoJson) {
      projection.fitWidth(this.mapWidth(), geoJson);
    }
    return projection;
  });
  private countriesGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private organizationGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;

  ngAfterViewInit(): void {
    this.initializeSvg();
    this.initializeDrawing();
  }

  private initializeSvg(): void {
    this.svg()
      .attr('width', this.dimensions().width ?? 10)
      .attr('height', this.dimensions().width ?? 10); // make height equal to width
    this.countriesGroup = this.svg().append('g').attr('class', 'countries');
    this.organizationGroup = this.svg().append('g').attr('class', 'organizations');
  }

  private initializeDrawing(): void {
    effect(() => {
      const geoJson = this.aidDataStore.countriesGeoJson();
      const dimensions = this.dimensions();
      if (!geoJson || !dimensions) {
        return;
      }
      this.svg()
        .attr('width', dimensions.width)
        .attr('height', this.mapWidth()); // because geoMercator results in a square projection
      this.drawMap(geoJson);
    }, { injector: this.injector })
  }

  private drawMap(geoJson: FeatureCollection): void {
    const pathGenerator = geoPath(this.projection());
    this.countriesGroup
      .selectAll('path')
      .data(geoJson.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', '#f06d06')
      .attr('stroke', '#aaa');
  }

  private drawAgencies(): void {

  }

}
