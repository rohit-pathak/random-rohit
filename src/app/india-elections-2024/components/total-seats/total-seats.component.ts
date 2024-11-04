import { Component, computed, inject } from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { ColorScaleService } from "../../services/color-scale.service";
import { DonutChartComponent } from "../../../shared/components/donut-chart/donut-chart.component";

@Component({
  selector: 'app-total-seats',
  standalone: true,
  imports: [
    DonutChartComponent
  ],
  templateUrl: './total-seats.component.html',
  styleUrl: './total-seats.component.scss'
})
export class TotalSeatsComponent {
  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);
  seatsData = computed<PartySeatCount[]>(() => {
    const seatsByParty = this.electionDataStore.totalSeatsByParty();
    return Object.entries(seatsByParty).map(([party, totalSeats]) => {
      return {party, totalSeats };
    });
  });
  valueFn = (d: PartySeatCount) => d.totalSeats;
  labelFn = (d: PartySeatCount) => d.party;
  colorFn = (d: PartySeatCount) => this.colorService.partyColorScale()(d.party);
}

interface PartySeatCount {
  party: string;
  totalSeats: number;
}
