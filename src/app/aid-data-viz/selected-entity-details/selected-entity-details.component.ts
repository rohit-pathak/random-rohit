import { Component, inject } from '@angular/core';
import { AidDataStore } from "../aid-data.store";
import { ReceivedDonatedMultilineComponent } from "./received-donated-multiline/received-donated-multiline.component";
import { TransactionsGroupedComponent } from "./transactions-grouped/transactions-grouped.component";

@Component({
  selector: 'app-selected-entity-details',
  imports: [
    ReceivedDonatedMultilineComponent,
    TransactionsGroupedComponent
  ],
  templateUrl: './selected-entity-details.component.html',
  styleUrl: './selected-entity-details.component.scss'
})
export class SelectedEntityDetailsComponent {
  private readonly store = inject(AidDataStore);

  protected readonly entityName = this.store.selectedEntity;
}
