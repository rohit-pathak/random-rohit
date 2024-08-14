import { AfterViewInit, Component, effect, inject, Injector } from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { geoMercator, geoPath, select, Selection } from "d3";
import { FeatureCollection } from "geojson";
import { Constituency } from "../../models/models";

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
      this.drawConstituencies(constituencies);
      console.log(this.electionDataStore.constituencyResults());
    }, {injector: this.injector});
  }

  private drawMap(geoJson: FeatureCollection): void {
    const pathGenerator = geoPath(this.projection);
    this.mapSvg.selectAll('path')
      .data(geoJson.features)
      .join('path')
      .attr('d', pathGenerator)
      .attr('stroke', '#ccc')
      .attr('fill', 'none');
  }

  private drawConstituencies(constituencies: Constituency[]) {
    this.constituenciesGroup.selectAll('circle')
      .data(constituencies)
      .join('circle')
      .attr('r', 5)
      .attr('cx', d => (this.projection([d.longitude, d.latitude]) ?? [0, 0])[0])
      .attr('cy', d => (this.projection([d.longitude, d.latitude]) ?? [0, 0])[1])
      .attr('fill', 'orange')
      .attr('opacity', 0.5);
  }
}
