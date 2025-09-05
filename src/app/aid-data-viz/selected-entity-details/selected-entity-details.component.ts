import { Component, inject } from '@angular/core';
import { AidDataStore } from "../aid-data.store";

@Component({
  selector: 'app-selected-entity-details',
  imports: [],
  templateUrl: './selected-entity-details.component.html',
  styleUrl: './selected-entity-details.component.scss'
})
export class SelectedEntityDetailsComponent {
  private readonly store = inject(AidDataStore);

  protected readonly entityName = this.store.selectedEntity;
}
