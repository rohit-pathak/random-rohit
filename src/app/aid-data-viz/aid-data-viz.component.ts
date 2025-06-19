import { Component, inject, OnInit } from '@angular/core';
import { AidDataStore } from './aid-data.store';
import { AidDataService } from './aid-data.service';

@Component({
  selector: 'app-aid-data-viz',
  imports: [],
  templateUrl: './aid-data-viz.component.html',
  styleUrl: './aid-data-viz.component.scss',
  providers: [AidDataStore, AidDataService],
})
export class AidDataVizComponent implements OnInit {
  private store = inject(AidDataStore);

  ngOnInit(): void {
    this.store.loadData();
  }

}
