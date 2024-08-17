import { AfterViewInit, Component, effect, inject, Injector } from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { geoMercator, geoPath, scaleOrdinal, schemeSet3, select, Selection } from "d3";
import { Feature, FeatureCollection } from "geojson";
import { Constituency, ConstituencyResult } from "../../models/models";

@Component({
  selector: 'app-constituencies-map',
  standalone: true,
  imports: [],
  templateUrl: './constituencies-map.component.html',
  styleUrl: './constituencies-map.component.scss'
})
export class ConstituenciesMapComponent implements AfterViewInit {
  private electionDataStore = inject(ElectionDataStore);
  private injector = inject(Injector);
  private mapSvg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private constituenciesGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 600;
  private height = 600;
  private projection = geoMercator()
    .scale(900) // Adjust the scale value to fit India within your SVG
    .center([82.9629, 20.5937]) // Longitude and latitude of India's center
    .translate([this.width / 2, this.height / 2]);
  private topParties = [
    "Bharatiya Janata Party",
    "Indian National Congress",
    "Samajwadi Party",
    "All India Trinamool Congress",
    "Yuvajana Sramika Rythu Congress Party",
    "Bahujan Samaj Party",
    "Telugu Desam",
    "Dravida Munnetra Kazhagam",
    "Communist Party of India (Marxist)",
    "Rashtriya Janata Dal",
    "Shiv Sena (Uddhav Balasaheb Thackrey)",
    "Biju Janata Dal",
  ];
  private colorScheme = scaleOrdinal(this.topParties, schemeSet3)

  constructor() {
    effect(() => {
      const partiesSorted = Object.entries(this.electionDataStore.totalVotesByParty()).sort((a, b) => b[1] - a[1]);
      console.log(partiesSorted.map(p => p[0]).slice(0, 13));
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
      console.log(this.electionDataStore.constituencyResults());
    }, { injector: this.injector });
  }

  private drawMap(geoJson: FeatureCollection): void {
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
      .attr('stroke', '#ccc')
      .attr('fill', d => this.colorScheme(d.results?.[0]?.partyName ?? '#eee')) // TODO: color by winning party
      .on('click', (_, d) => console.log(d));
  }
}

interface ConstituencyMapItem {
  feature: Feature;
  constituency: Constituency;
  results: ConstituencyResult[];
}
