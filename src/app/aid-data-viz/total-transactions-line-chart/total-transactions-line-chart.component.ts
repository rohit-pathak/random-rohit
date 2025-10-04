import { Component, computed, inject } from '@angular/core';
import { AidDataStore, YearTotal } from "../aid-data.store";
import { ResizeDirective } from "../../shared/directives/resize.directive";
import {
  BrushSpan,
  LineData,
  MultiLineChartComponent
} from "../../shared/components/multi-line-chart/multi-line-chart.component";

@Component({
  selector: 'app-total-transactions-line-chart',
  imports: [
    MultiLineChartComponent
  ],
  templateUrl: './total-transactions-line-chart.component.html',
  styleUrl: './total-transactions-line-chart.component.scss',
  hostDirectives: [ResizeDirective],
})
export class TotalTransactionsLineChartComponent {
  private readonly store = inject(AidDataStore);
  protected readonly lines = computed<LineData<YearTotal>[]>(() => {
    return [
      {
        name: 'Total transactions',
        data: this.store.transactionsPerYear()
      },
    ];
  });
  protected readonly x = (d: YearTotal) => d.year;
  protected readonly y = (d: YearTotal) => d.amount;
  protected readonly xSpan = this.store.totalYearRange;
  protected readonly brushSpan = this.store.brushSpan;

  onBrush(span: BrushSpan | null): void  {
    if (!span) {
      this.store.setBrushSpan(null);
      this.store.setYearRange(null);
      return;
    }
    this.store.setBrushSpan(span?.range ?? null);
    const [start, end] = span.domain;
    const selectedYears = this.store.transactionsPerYear()
      .map(t => t.year)
      .filter(year => (year >= start) && (year <= end));
    if (!selectedYears.length) {
      this.store.setYearRange(null);
    } else {
      this.store.setYearRange([selectedYears[0], selectedYears.at(-1)!]);
    }
  }

}
