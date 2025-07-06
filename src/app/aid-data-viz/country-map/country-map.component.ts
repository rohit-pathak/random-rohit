import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild
} from '@angular/core';
import { AidDataStore } from "../aid-data.store";
import { ResizeDirective } from "../../shared/directives/resize.directive";
import { geoEquirectangular, geoNaturalEarth1, geoPath, select } from "d3";
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
  private readonly countriesGroupRef = viewChild.required<ElementRef>('countriesGroup');
  private readonly organizationsGroupRef = viewChild.required<ElementRef>('organizationsGroup');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly countriesGroup = computed(() => select<SVGGElement, unknown>(this.countriesGroupRef().nativeElement));
  private readonly organizationsGroup = computed(() => select<SVGGElement, unknown>(this.organizationsGroupRef().nativeElement));
  protected readonly dimensions = inject(ResizeDirective).dimensions;
  protected readonly svgHeight = signal(0);
  private readonly projection = computed(() => {
    const geoJson = this.aidDataStore.countriesGeoJson();
    const projection = geoEquirectangular();
    if (geoJson) {
      projection.fitWidth(this.dimensions().width, geoJson);
    }
    return projection;
  });

  ngAfterViewInit(): void {
    this.initializeDrawing();
  }

  private initializeDrawing(): void {
    effect(() => {
      const geoJson = this.aidDataStore.countriesGeoJson();
      const dimensions = this.dimensions();
      if (!geoJson || !dimensions) {
        return;
      }
      this.drawMap(geoJson);
      const mapHeight = this.countriesGroup().node()?.getBoundingClientRect().height ?? 0;
      this.organizationsGroup()
        .attr('transform', `translate(0, ${mapHeight + 16})`);
      this.drawOrganizations();

      const organizationsHeight = this.organizationsGroup().node()?.getBoundingClientRect().height ?? 0;
      const totalHeight = mapHeight + organizationsHeight;
      this.svgHeight.set(totalHeight);
    }, { injector: this.injector })
  }

  private drawMap(geoJson: FeatureCollection): void {
    const pathGenerator = geoPath(this.projection());
    this.countriesGroup()
      .selectAll('path')
      .data(geoJson.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#aaa');
  }

  private drawOrganizations(): void {
    const organizations = this.aidDataStore.organizations();
    console.log(organizations);
    this.organizationsGroup()
      .selectAll('text')
      .data([1])
      .join('text')
      .text('organizations group');
  }

}
