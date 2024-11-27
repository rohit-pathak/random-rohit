import { Component, computed, inject, output } from '@angular/core';
import { ElectionDataStore } from "../../election-data.store";
import { ColorScaleService } from "../../services/color-scale.service";
import { DonutChartComponent } from "../../../shared/components/donut-chart/donut-chart.component";

@Component({
  selector: 'app-total-stats',
  standalone: true,
  imports: [
    DonutChartComponent
  ],
  templateUrl: './total-stats.component.html',
  styleUrl: './total-stats.component.scss'
})
export class TotalStatsComponent {
  partyHover = output<string | null>();

  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);
  seatsData = computed<PartySeatCount[]>(() => {
    const seatsByParty = this.electionDataStore.totalSeatsByParty();
    return Object.entries(seatsByParty).map(([party, totalSeats]) => {
      return {party, totalSeats };
    });
  });
  votePctData = computed<PartyVoteShare[]>(() => {
    const votesByParty = this.electionDataStore.totalVotesByParty();
    const totalVotes = Object.values(votesByParty).reduce((acc, curr) => acc + curr, 0);
    return Object.entries(votesByParty).map(([party, votes]) => {
      return {
        party,
        votePct: (votes / totalVotes) * 100
      }
    })
  });
  seatsValueFn = (d: PartySeatCount) => d.totalSeats;
  votePctFn = (d: PartyVoteShare) => d.votePct;
  labelFn = (d: PartySeatCount | PartyVoteShare) => d.party;
  colorFn = (d: PartySeatCount | PartyVoteShare) => this.colorService.partyColorScale()(d.party);

  onSectorMouseover(hoveredParty: PartySeatCount | PartyVoteShare): void {
    this.partyHover.emit(hoveredParty.party);
  }

  onSectorMouseout(): void {
    this.partyHover.emit(null);
  }
}

interface PartySeatCount {
  party: string;
  totalSeats: number;
}

interface PartyVoteShare {
  party: string;
  votePct: number;
}
