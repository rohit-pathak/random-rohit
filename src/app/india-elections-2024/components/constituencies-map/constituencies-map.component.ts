import { AfterViewInit, Component, effect, inject, Injector } from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { geoMercator, geoPath, select, Selection } from "d3";
import { Feature, FeatureCollection } from "geojson";
import { Constituency, ConstituencyResult } from "../../models/models";
import { ColorScaleService } from "../../services/color-scale.service";

@Component({
  selector: 'app-constituencies-map',
  standalone: true,
  imports: [],
  templateUrl: './constituencies-map.component.html',
  styleUrl: './constituencies-map.component.scss'
})
export class ConstituenciesMapComponent implements AfterViewInit {
  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);
  private injector = inject(Injector);
  private mapSvg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private constituenciesGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 600;
  private height = 600;
  private projection = geoMercator();
  private colorScheme = this.colorService.partyColorScale();
  private islands = ['U06', 'U01'];

  constructor() {
    effect(() => { // TODO: remove
      const partiesSorted = Object.entries(this.electionDataStore.totalSeatsByParty()).sort((a, b) => b[1] - a[1]);
      console.log(partiesSorted.map(p => p[0]).slice(0, 14));
    });
  }

  ngAfterViewInit(): void {
    this.initializeSvg();
    this.drawOnDataChange();
  }

  private initializeSvg(): void {
    this.mapSvg = select('.overall-result-viz-container .map-container')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.constituenciesGroup = this.mapSvg.append('g').attr('class', 'constituencies');
  }

  private drawOnDataChange(): void {
    effect(() => {
      const mapGeoJson = this.electionDataStore.constituencies2024Map();
      const constituencies = this.electionDataStore.constituencies();
      if (!mapGeoJson || !constituencies) {
        return;
      }
      this.drawMap(mapGeoJson);
    }, { injector: this.injector });
  }

  private drawMap(geoJson: FeatureCollection): void {
    this.projection.fitSize([this.width, this.height], geoJson);
    const pathGenerator = geoPath().projection(this.projection);
    this.constituenciesGroup.selectAll('path')
      .data<ConstituencyMapItem>(
        geoJson.features.map(feature => {
          const constituencyId = `${feature.properties?.['ST_CODE']}${feature.properties?.['PC_No']}`;
          const constituency = this.electionDataStore.constituenciesById()[constituencyId];
          const results = this.electionDataStore.resultsByConstituency()[constituencyId];
          return {feature, constituency, results };
        })
      )
      .join('path')
      .attr('d', d => pathGenerator(d.feature))
      .attr('stroke', d => this.islands.includes(d.constituency?.stateOrUT) ? this.colorScheme(d.results?.[0]?.partyName) : '#eee')
      .attr('stroke-width', '0.04rem')
      .attr('fill', d => this.colorScheme(d.results?.[0]?.partyName))
      .on('click', (_, d) => console.log(d));
  }
}

interface ConstituencyMapItem {
  feature: Feature;
  constituency: Constituency;
  results: ConstituencyResult[];
}
