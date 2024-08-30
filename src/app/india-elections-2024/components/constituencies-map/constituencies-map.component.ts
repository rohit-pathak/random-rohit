import {
  AfterViewInit, ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  output,
  signal,
  viewChild
} from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { BaseType, D3ZoomEvent, geoMercator, geoPath, select, Selection, zoom } from "d3";
import { Feature, FeatureCollection } from "geojson";
import { Constituency, ConstituencyResult } from "../../models/models";
import { ColorScaleService } from "../../services/color-scale.service";
import { NgClass } from "@angular/common";

@Component({
  selector: 'app-constituencies-map',
  standalone: true,
  imports: [
    NgClass
  ],
  templateUrl: './constituencies-map.component.html',
  styleUrl: './constituencies-map.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConstituenciesMapComponent implements AfterViewInit {

  constituencyClick = output<Constituency>();

  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);
  private injector = inject(Injector);
  private mapSvg!: Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private blankArea!: Selection<SVGRectElement, unknown, HTMLElement, unknown>;
  private constituenciesGroup!: Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private width = 600;
  private height = 600;
  private projection = geoMercator();
  private colorScheme = this.colorService.partyColorScale();
  private islands = ['U06', 'U01'];
  private tooltip = viewChild.required<ElementRef>('tooltip');

  hoveredConstituency = signal<ConstituencyMapItem | null>(null);

  ngAfterViewInit(): void {
    this.initializeSvg();
    this.drawOnDataChange();
  }

  private initializeSvg(): void {
    this.mapSvg = select('.overall-result-viz-container .map-container')
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);
    this.addBlankHoverableArea();
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
      this.setZoomBehavior();
    }, { injector: this.injector });
  }

  private drawMap(geoJson: FeatureCollection): void {
    this.projection.fitSize([this.width, this.height], geoJson);
    const pathGenerator = geoPath().projection(this.projection);
    const component = this; // save reference to pass in to event listeners
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
      .attr('stroke', d => this.strokeColor(d))
      .attr('stroke-width', '0.015rem')
      .attr('fill', d => this.colorScheme(d.results?.[0]?.partyName))
      .on('click', (_, d) => this.onConstituencyClick(d))
      .on('mouseover', function(e, d) {
        component.onConstituencyMouseover(d, select<BaseType, ConstituencyMapItem>(this));
      })
      .on('mousemove', (e) => this.onConstituencyMousemove(e))
      .on('mouseout', function() {
        component.onConstituencyMouseout(select<BaseType, ConstituencyMapItem>(this));
      });
  }

  private onConstituencyClick(c: ConstituencyMapItem): void {
    this.constituencyClick.emit(c.constituency);
  }

  private onConstituencyMouseover(hoveredItem: ConstituencyMapItem, element: Selection<BaseType, ConstituencyMapItem, null, undefined>): void {
    element.raise();
    element.style('stroke-width', '0.04rem');
    // highlight all constituencies of the same state
    if (hoveredItem.constituency.stateOrUT !== this.hoveredConstituency()?.constituency.stateOrUT) {
      this.constituenciesGroup.selectAll<SVGPathElement, ConstituencyMapItem>('path')
        .style('opacity', d => d.constituency?.stateOrUT === hoveredItem.constituency?.stateOrUT ? 1 : 0.4);
    }
    this.hoveredConstituency.set(hoveredItem);
  }

  private onConstituencyMousemove(event: MouseEvent): void {
    select(this.tooltip().nativeElement)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 20}px`);
  }

  private onConstituencyMouseout(element: Selection<BaseType, ConstituencyMapItem, null, undefined>): void {
    element.style('stroke-width', '0.015rem');
  }

  private setZoomBehavior(): void {
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [this.width, this.height]])
      .on('zoom', (e: D3ZoomEvent<SVGSVGElement, unknown>) => this.constituenciesGroup.attr('transform', e.transform.toString()));
    this.mapSvg.call(zoomBehavior);
  }

  private strokeColor(constituencyItem: ConstituencyMapItem): string {
    return this.islands.includes(constituencyItem.constituency?.stateOrUT) ? this.colorScheme(constituencyItem.results?.[0]?.partyName) : '#eee';
  }

  /**
   * This adds a blank rect below the map so that we can reset opacity of all constituency paths
   * when mouse is removed from the map.
   * @private
   */
  private addBlankHoverableArea() {
    this.mapSvg.append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'fill')
      .on('mouseover', () => {
        this.constituenciesGroup.selectAll<SVGPathElement, ConstituencyMapItem>('path')
          .style('opacity', null);
        this.hoveredConstituency.set(null);
      })
  }
}

interface ConstituencyMapItem {
  feature: Feature;
  constituency: Constituency;
  results: ConstituencyResult[];
}
