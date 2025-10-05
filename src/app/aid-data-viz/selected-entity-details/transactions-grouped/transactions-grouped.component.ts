import { Component, effect, inject } from '@angular/core';
import { AidDataStore } from "../../aid-data.store";

@Component({
  selector: 'app-transactions-grouped',
  imports: [],
  templateUrl: './transactions-grouped.component.html',
  styleUrl: './transactions-grouped.component.scss'
})
export class TransactionsGroupedComponent {
  private readonly store = inject(AidDataStore);
  private readonly selectedEntityGroupedTransactions = this.store.selectedEntityGroupedTransactions;

  constructor() {
    effect(() => {
      console.log(this.selectedEntityGroupedTransactions());
    });
  }
}
