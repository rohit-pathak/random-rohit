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
  Selection
} from "d3";
import { Feature, FeatureCollection } from "geojson";
import { TooltipComponent } from "../../shared/components/tooltip/tooltip.component";
import { CurrencyPipe } from "@angular/common";
import { AidTransaction } from "../aid-data.service";

@Component({
  selector: 'app-country-map',
  imports: [
    TooltipComponent,
    CurrencyPipe
  ],
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
  private readonly transactionLinesRef = viewChild.required<ElementRef>('transactionLines');
  private readonly svg = computed(() => select<SVGSVGElement, unknown>(this.svgRef().nativeElement));
  private readonly countriesGroup = computed(() => select<SVGGElement, unknown>(this.countriesGroupRef().nativeElement));
  private readonly organizationsGroup = computed(() => select<SVGGElement, unknown>(this.organizationsGroupRef().nativeElement));
  private readonly transactionLinesGroup = computed(() => select<SVGGElement, unknown>(this.transactionLinesRef().nativeElement));
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
  private readonly maxCircleRadius = 14;
  private readonly defaultOpacity = 0.7;
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

  private readonly symbolCountryData = computed<SymbolDatum[]>(() => {
    const dataByCountry = this.aidDataStore.dataByCountryOrOrg();
    const data = this.countriesGroup().selectAll<SVGPathElement, Feature>('path')
      .data()
      .filter(d => dataByCountry.has(d?.properties?.['name']))
      .map(d => {
        return {
          centroid: this.pathGenerator().centroid(d),
          data: dataByCountry.get(d.properties!['name'])!,
        };
      });
    return data;
  });
  private readonly symbolOrgData = computed<SymbolDatum[]>(() => {
    const organizations = this.aidDataStore.organizations();
    const dataByOrg = this.aidDataStore.dataByCountryOrOrg();
    const width = this.dimensions().width;
    const circleBoxWidth = this.maxCircleRadius * 2 + 2;
    const circlesPerRow = Math.floor(width / (circleBoxWidth));
    const data: SymbolDatum[] = organizations
      .filter(org => dataByOrg.has(org))
      .map((org, i) => {
        // TODO: check calculation because this is sometimes [Nan, Infinity]
        const x = (i % circlesPerRow) * (circleBoxWidth) + (circleBoxWidth / 2);
        const y = Math.floor(i / circlesPerRow) * (circleBoxWidth);
        return {
          centroid: [x, y],
          data: dataByOrg.get(org)!
        };
      });
    return data;
  });
  private readonly symbolMap = computed<Map<string, SymbolDatum>>(() => {
    const res = new Map<string, SymbolDatum>();
    this.symbolCountryData().forEach(d => res.set(d.data.name, d));
    this.symbolOrgData().forEach(d => res.set(d.data.name, d));
    return res;
  });

  protected readonly host = inject(ElementRef<HTMLElement>);
  protected readonly hoveredCountry = signal<SymbolDatum | null>(null);
  protected readonly tooltipEvent = signal<Event | null>(null);

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
      this.drawTransactionLines();
      this.handleSymbolInteractivity();

      const organizationsHeight = this.organizationsGroup().node()?.getBoundingClientRect().height ?? 0;
      const totalHeight = Math.max(this.svgHeight(), mapHeight + organizationsHeight + 36); // extra for padding
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
    this.drawSymbols(this.countriesGroup(), this.symbolCountryData());
  }

  private drawOrganizations(): void {
    this.drawSymbols(this.organizationsGroup(), this.symbolOrgData());
  }

  private drawSymbols(group: Selection<SVGGElement, unknown, HTMLElement, unknown>, data: SymbolDatum[]) {
    const pieGenerator = pie<TransactionPieDatum>()
      .value(d => d.amount)
      .sort((a, b) => a.transactionType.localeCompare(b.transactionType));

    const symbolGroups = group
      .selectAll<SVGGElement, SymbolDatum>('.symbol')
      .data(data, d => d.data.name)
      .join('g')
      .attr('class', 'symbol')
      .attr('transform', d => `translate(${d.centroid.join(',')})`) // TODO: check if centroid vals are defined
      .attr('opacity', this.defaultOpacity);
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
  }

  private handleSymbolInteractivity(): void {
    const component = this;
    this.svg().selectAll<SVGPathElement, SymbolDatum>('.symbol')
      .on('mouseover', function (event: Event, d) {
        select(this).attr('opacity', 1);
        component.tooltipEvent.set(event);
        component.hoveredCountry.set(d);
      })
      .on('mousemove', (e) => {
        this.tooltipEvent.set(e);
      })
      .on('mouseout', function () {
        select(this).attr('opacity', component.defaultOpacity);
        component.tooltipEvent.set(null);
        component.hoveredCountry.set(null);
      })
      .on('click', (_, d) => {
        this.aidDataStore.setSelectedSymbolDatum(d.data.name);
      });
  }

  private drawTransactionLines(): void {
    const datum = this.symbolMap().get(this.aidDataStore.selectedEntity() ?? '');
    if (!datum) {
      this.transactionLinesGroup().selectAll('.donated-line, .received-line').remove();
      return;
    }
    const yearRange = this.aidDataStore.selectedYearRange();
    const inRange = (t: AidTransaction) => !yearRange ? true : t.year >= yearRange[0] && t.year <= yearRange[1];

    const donatedTo = [...new Set(datum.data.transactions
      .filter(d => (d.donor === datum.data.name) && inRange(d))
      .map(d => d.recipient)
    )];
    const receivedFrom = [...new Set(
      datum.data.transactions
        .filter(d => (d.recipient === datum.data.name) && inRange(d))
        .map(d => d.donor)
    )];
    // this offset is necessary because the organization circles are in a group that is translated down
    const orgGroupOffset = this.organizationsGroup().node()?.transform.baseVal.consolidate()?.matrix.f ?? 0;
    const organizationSet = new Set(this.aidDataStore.organizations());
    const symbolCentroids = this.svg().selectAll<SVGGElement, SymbolDatum>('.symbol').data()
      .reduce((acc, curr) => {
        acc.set(curr.data.name, curr);
        return acc;
      }, new Map<string, SymbolDatum>);
    const adjustOffset = (symbolName: string, y: number) => y + (organizationSet.has(symbolName) ? orgGroupOffset : 0)

    this.transactionLinesGroup()
      .selectAll<SVGLineElement, SymbolDatum>('.donated-line')
      .data(donatedTo)
      .join('line')
      .attr('class', 'donated-line')
      .attr('x1', () => datum.centroid[0])
      .attr('y1', () => adjustOffset(datum.data.name, datum.centroid[1]))
      .attr('x2', () => datum.centroid[0])
      .attr('y2', () => adjustOffset(datum.data.name, datum.centroid[1]))
      .style('pointer-events', 'none')
      // .transition()
      // .duration(1000)
      .attr('x2', d => symbolCentroids.get(d)!.centroid[0])
      .attr('y2', d => adjustOffset(d, symbolCentroids.get(d)!.centroid[1]))
      .attr('stroke', this.colorScale('donated'))
      .attr('stroke-width', '0.02rem');
    this.transactionLinesGroup()
      .selectAll<SVGLineElement, SymbolDatum>('.received-line')
      .data(receivedFrom)
      .join('line')
      .attr('class', 'received-line')
      .attr('x1', d => symbolCentroids.get(d)!.centroid[0])
      .attr('y1', d => adjustOffset(d, symbolCentroids.get(d)!.centroid[1]))
      .attr('x2', d => symbolCentroids.get(d)!.centroid[0])
      .attr('y2', d => adjustOffset(d, symbolCentroids.get(d)!.centroid[1]))
      .style('pointer-events', 'none')
      // .transition()
      // .duration(1000)
      .attr('x2', () => datum.centroid[0])
      .attr('y2', () => adjustOffset(datum.data.name, datum.centroid[1]))
      .attr('stroke', this.colorScale('received'))
      .attr('stroke-width', '0.02rem');
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
