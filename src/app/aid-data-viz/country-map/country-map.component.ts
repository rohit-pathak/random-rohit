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
import { AidDataAggregate, AidDataStore } from "../aid-data.store";
import { ResizeDirective } from "../../shared/directives/resize.directive";
import {
  arc,
  geoEquirectangular,
  geoPath,
  pie,
  PieArcDatum,
  scaleLinear,
  scaleOrdinal,
  schemeRdBu,
  select,
  selectAll,
  Selection
} from "d3";
import { Feature, FeatureCollection } from "geojson";

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
  private maxCircleRadius = 14;
  private readonly pathGenerator = computed(() => geoPath(this.projection()));
  private readonly radiusScale = computed(() => {
    const transactionsMap = this.aidDataStore.dataByCountryOrOrg();
    const amounts = [...transactionsMap.values()].map(t => t.totalReceived + t.totalDonated);
    return scaleLinear([Math.min(...amounts), Math.max(...amounts)], [3, this.maxCircleRadius]);
  });
  private readonly colorScale = scaleOrdinal(['received', 'donated'], [schemeRdBu[3][0], schemeRdBu[3][2]]);
  private readonly arcGenerator = arc<PieArcDatum<TransactionPieDatum>>()
    .innerRadius(0)
    .outerRadius(this.maxCircleRadius);


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
      const totalHeight = mapHeight + organizationsHeight + 36; // extra for padding
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
      .attr('stroke', '#bbb')
      .attr('stroke-width', '0.05rem');
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
    this.drawSymbols(this.countriesGroup(), symbolMapData);
  }

  private drawOrganizations(): void {
    const organizations = this.aidDataStore.organizations();
    const dataByOrg = this.aidDataStore.dataByCountryOrOrg();
    const width = this.dimensions().width;
    const circleBoxWidth = this.maxCircleRadius * 2 + 2;
    const circlesPerRow = Math.floor(width / (circleBoxWidth));
    const symbolOrgData: SymbolDatum[] = organizations.map((org, i) => {
      const x = (i % circlesPerRow) * (circleBoxWidth) + (circleBoxWidth / 2);
      const y = Math.floor(i / circlesPerRow) * (circleBoxWidth);
      return {
        centroid: [x, y],
        data: dataByOrg.get(org)!
      };
    });
    this.drawSymbols(this.organizationsGroup(), symbolOrgData);
  }

  private drawSymbols(group: Selection<SVGGElement, unknown, HTMLElement, unknown>, data: SymbolDatum[]) {
    const pieGenerator = pie<TransactionPieDatum>()
      .value(d => d.amount)
      .sort((a, b) => a.transactionType.localeCompare(b.transactionType));

    const symbolGroups = group
      .selectAll('.symbol')
      .data(data) // TODO: add key
      .join('g')
      .attr('class', 'symbol')
      .attr('transform', d => `translate(${d.centroid.join(',')})`);
    symbolGroups
      .selectAll('path')
      .data(d => {
        const total = d.data.totalReceived + d.data.totalDonated;
        const receivedPct = d.data.totalReceived === 0 ? 0 : Math.max(1, (d.data.totalReceived / total) * 100);
        const donatedPct = 100 - receivedPct;
        return pieGenerator(
          [
            {
              transactionType: 'received',
              amount: receivedPct,
              total
            },
            {
              transactionType: 'donated',
              amount: donatedPct,
              total
            }
          ].filter(t => t.amount !== 0) as TransactionPieDatum[]
        );
      })
      .join('path')
      .attr('d', d => {
        return this.arcGenerator.outerRadius(this.radiusScale()(d.data.total))(d);
      })
      .attr('fill', d => this.colorScale(d.data.transactionType))
      .attr('opacity', 0.7);
  }

}

interface TransactionPieDatum {
  transactionType: 'donated' | 'received';
  amount: number; // determined pie angle
  total: number; // total of both donated + received (determines radius)
}

interface SymbolDatum {
  centroid: [number, number];
  data: AidDataAggregate;
}
