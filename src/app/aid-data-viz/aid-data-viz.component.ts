import { Component, inject, OnInit } from '@angular/core';
import { AidDataStore } from './aid-data.store';
import { AidDataService } from './aid-data.service';
import { CountryMapComponent } from "./country-map/country-map.component";
import {
  TotalTransactionsLineChartComponent
} from "./total-transactions-line-chart/total-transactions-line-chart.component";
import { SelectedEntityDetailsComponent } from "./selected-entity-details/selected-entity-details.component";
import { MatSlideToggle, MatSlideToggleChange } from "@angular/material/slide-toggle";

@Component({
  selector: 'app-aid-data-viz',
  imports: [
    CountryMapComponent,
    TotalTransactionsLineChartComponent,
    SelectedEntityDetailsComponent,
    MatSlideToggle
  ],
  templateUrl: './aid-data-viz.component.html',
  styleUrl: './aid-data-viz.component.scss',
  providers: [AidDataService, AidDataStore],
})
export class AidDataVizComponent implements OnInit {
  private store = inject(AidDataStore);

  ngOnInit(): void {
    this.store.loadMap();
    this.store.loadData();
  }

  onAnimationChange(change: MatSlideToggleChange): void {
    this.store.setAnimate(change.checked);
  }

}
