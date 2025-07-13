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
import { geoEquirectangular, geoPath, scaleLog, select, selectAll } from "d3";
import { Feature, FeatureCollection, Geometry } from "geojson";

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
  private readonly pathGenerator = computed(() => geoPath(this.projection()));
  private readonly radiusScale = computed(() => {
    const transactionsMap = this.aidDataStore.dataByCountryOrOrg();
    const amounts = [...transactionsMap.values()].map(t => t.totalReceived + t.totalDonated);
    return scaleLog([Math.min(...amounts), Math.max(...amounts)], [1, this.maxCircleRadius]);
  })
  private maxCircleRadius = 10;


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
      this.drawSymbolsOnMap();
      const mapHeight = this.countriesGroup().node()?.getBoundingClientRect().height ?? 0;
      this.organizationsGroup()
        .attr('transform', `translate(0, ${mapHeight + this.maxCircleRadius * 2})`);
      this.drawOrganizations();

      const organizationsHeight = this.organizationsGroup().node()?.getBoundingClientRect().height ?? 0;
      const totalHeight = mapHeight + organizationsHeight + 16; // 16 extra for padding
      this.svgHeight.set(totalHeight);
    }, { injector: this.injector })
  }

  private drawMap(geoJson: FeatureCollection): void {
    this.countriesGroup()
      .selectAll('path')
      .data(geoJson.features)
      .join('path')
      .attr('d', this.pathGenerator())
      .attr('fill', 'none')
      .attr('stroke', '#aaa');
  }

  private drawSymbolsOnMap(): void {
    const dataByCountry = this.aidDataStore.dataByCountryOrOrg();
    const symbolMapData = selectAll<SVGPathElement, Feature>('path')
      .data()
      .filter(d => dataByCountry.has(d.properties?.['name']))
      .map(d => {
        return {
          centroid: this.pathGenerator().centroid(d),
          data: dataByCountry.get(d.properties!['name'])!,
        };
      });
    this.countriesGroup()
      .selectAll('circle')
      .data(symbolMapData)
      .join('circle') // TODO: pie chart
      .attr('cx', d => d.centroid[0])
      .attr('cy', d => d.centroid[1])
      .attr('r', d => this.radiusScale()(d.data.totalDonated + d.data.totalReceived))
      .attr('fill', '#f06d06')
      .attr('opacity', 0.5);
  }

  private drawOrganizations(): void {
    const organizations = this.aidDataStore.organizations();
    const width = this.dimensions().width;
    const circleBoxWidth = this.maxCircleRadius * 2 + 2;
    const circlesPerRow = Math.floor(width / (circleBoxWidth));
    this.organizationsGroup()
      .selectAll('circle')
      .data(organizations)
      .join('circle')
      .attr('class', 'organization')
      .attr('cx', (_, i) => (i % circlesPerRow) * (circleBoxWidth) + (circleBoxWidth / 2))
      .attr('cy', (_, i) => Math.floor(i / circlesPerRow) * (circleBoxWidth))
      .attr('r', this.maxCircleRadius)
      .attr('fill', '#f06d06')
      .attr('opacity', 0.5);
  }

}
