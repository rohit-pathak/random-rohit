import { Component, computed, inject } from '@angular/core';
import { AidDataStore, YearTotal } from "../../aid-data.store";
import {
  BrushSpan,
  LineData,
  MultiLineChartComponent
} from "../../../shared/components/multi-line-chart/multi-line-chart.component";
import { scaleOrdinal, schemeRdBu } from "d3";
import { CurrencyPipe } from "@angular/common";

@Component({
  selector: 'app-received-donated-multiline',
  imports: [
    MultiLineChartComponent
  ],
  templateUrl: './received-donated-multiline.component.html',
  styleUrl: './received-donated-multiline.component.scss',
  providers: [CurrencyPipe],
})
export class ReceivedDonatedMultilineComponent {
  protected readonly currencyPipe = inject(CurrencyPipe);
  private readonly store = inject(AidDataStore);
  protected readonly formatFn = (value: number) => this.currencyPipe.transform(value, 'USD', 'symbol', '1.0-0') ?? `${value}`;

  // shared chart component inputs
  protected readonly lines = computed<LineData<YearTotal>[]>(() => {
    return [
      {
        name: 'Donated',
        data: this.store.selectedDonatedPerYear()
      },
      {
        name: 'Received',
        data: this.store.selectedReceivedPerYear()
      }
    ];
  });
  protected readonly x = (d: YearTotal) => d.year;
  protected readonly y = (d: YearTotal) => d.amount;
  protected readonly xSpan = this.store.totalYearRange;
  protected readonly colorScale = scaleOrdinal(['Received', 'Donated'], [schemeRdBu[3][0], schemeRdBu[3][2]]);
  protected readonly brushSpan = this.store.brushSpan;

  onBrush(span: BrushSpan | null): void {
    this.store.setBrushSpan(span?.range ?? null);
    if (span?.domain) {
      // set year range based on domain
    }
  }

}
