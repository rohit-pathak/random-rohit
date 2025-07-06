import { Component, inject, OnInit } from '@angular/core';
import { AidDataStore } from './aid-data.store';
import { AidDataService } from './aid-data.service';
import { CountryMapComponent } from "./country-map/country-map.component";

@Component({
  selector: 'app-aid-data-viz',
  imports: [
    CountryMapComponent
  ],
  templateUrl: './aid-data-viz.component.html',
  styleUrl: './aid-data-viz.component.scss',
  providers: [AidDataStore, AidDataService],
})
export class AidDataVizComponent implements OnInit {
  private store = inject(AidDataStore);

  ngOnInit(): void {
    this.store.loadMap();
    this.store.loadData();
  }

}
