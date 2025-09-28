import { Component, computed, inject } from '@angular/core';
import { AidDataStore, YearTotal } from "../../aid-data.store";
import {
  LineData,
  MultiLineChartComponent
} from "../../../shared/components/multi-line-chart/multi-line-chart.component";
import { scaleOrdinal, schemeRdBu } from "d3";

@Component({
  selector: 'app-received-donated-multiline',
  imports: [
    MultiLineChartComponent
  ],
  templateUrl: './received-donated-multiline.component.html',
  styleUrl: './received-donated-multiline.component.scss',
})
export class ReceivedDonatedMultilineComponent {
  private readonly store = inject(AidDataStore);

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

  onBrush(range: [number, number] | null): void {
    console.log('brushed', range);
  }

}
