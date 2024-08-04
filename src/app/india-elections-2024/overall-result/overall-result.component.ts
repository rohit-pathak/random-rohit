import { AfterViewInit, Component } from '@angular/core';
import { geoMercator, geoPath, select, Selection } from "d3";
import { FeatureCollection } from "geojson";
import { combineLatest } from "rxjs";
import { ElectionDataService } from "../services/election-data.service";
import { Constituency } from "../models/models";

@Component({
  selector: 'app-overall-result',
  standalone: true,
  imports: [],
  templateUrl: './overall-result.component.html',
  styleUrl: './overall-result.component.scss'
})
export class OverallResultComponent implements AfterViewInit {
  private mapSvg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private constituenciesGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 800;
  private height = 600;
  private projection = geoMercator()
    .scale(900) // Adjust the scale value to fit India within your SVG
    .center([78.9629, 20.5937]) // Longitude and latitude of India's center
    .translate([this.width / 2, this.height / 2]);

  constructor(private electionDataService: ElectionDataService) {
  }

  ngAfterViewInit(): void {
    this.mapSvg = select('.overall-result-viz-container .map-container')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.constituenciesGroup = this.mapSvg.append('g').attr('class', 'constituencies');
    combineLatest([
      this.electionDataService.getMapGeoJSON(),
      this.electionDataService.getConstituencies()
    ])
      .subscribe(([indiaGeoJson, constituencies]) => {
      this.drawMap(indiaGeoJson);
      this.drawConstituencies(constituencies);
    })
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
