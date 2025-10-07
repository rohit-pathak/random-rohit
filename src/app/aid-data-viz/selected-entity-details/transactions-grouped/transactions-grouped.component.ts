import { Component, computed, inject } from '@angular/core';
import { AidDataStore, EntityTransactionTotal } from "../../aid-data.store";
import {
  HorizontalStackedChartComponent
} from "../../../shared/components/horizontal-stacked-chart/horizontal-stacked-chart.component";

@Component({
  selector: 'app-transactions-grouped',
  imports: [
    HorizontalStackedChartComponent
  ],
  templateUrl: './transactions-grouped.component.html',
  styleUrl: './transactions-grouped.component.scss'
})
export class TransactionsGroupedComponent {
  private readonly store = inject(AidDataStore);

  protected readonly selectedEntityGroupedTransactions = this.store.selectedEntityGroupedTransactions;
  protected readonly sortedTransactions = computed(() => {
    const transactions = this.selectedEntityGroupedTransactions();
    if (!transactions) {
      return null;
    }
    return transactions.sort((a, b) => (b.received + b.donated) - (a.received + a.donated));
  })
  protected readonly colorFn = this.store.colorScale;
  protected readonly labelFn = (d: EntityTransactionTotal) => d.entity;

  constructor() {
    // effect(() => {
    //   console.log(this.selectedEntityGroupedTransactions());
    // });
  }
}
