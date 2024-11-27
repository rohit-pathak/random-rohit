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
  partyHover = output<string[] | null>();

  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);
  seatsData = computed<PartySeatCount[]>(() => {
    const simplifiedSeatsByParty = Object.entries(this.electionDataStore.totalSeatsByParty())
      .reduce((acc, [party, totalSeats]) => {
        if (party in this.colorService.partyColorMap) {
          acc[party] = { party, totalSeats };
        } else {
          acc['Others'] = acc['Others'] || { party: 'Others', totalSeats: 0};
          acc['Others'].totalSeats += totalSeats;
        }
        return acc;
      }, {} as Record<string, PartySeatCount>);
    return Object.values(simplifiedSeatsByParty);
  });
  votePctData = computed<PartyVoteShare[]>(() => {
    const simplifiedVotesByParty = Object.entries(this.electionDataStore.totalVotesByParty())
      .reduce((acc, [party, votes]) => {
        if (party in this.colorService.partyColorMap) {
          acc[party] = votes;
        } else {
          acc['Others'] = (acc['Others'] || 0) + votes;
        }
        return acc;
      }, {} as Record<string, number>);
    const totalVotes = Object.values(simplifiedVotesByParty).reduce((acc, curr) => acc + curr, 0);
    return Object.entries(simplifiedVotesByParty).map(([party, votes]) => {
      return {
        party,
        votePct: (votes / totalVotes) * 100
      }
    })
  });
  otherParties = computed(() => {
    return Object.keys(this.electionDataStore.totalVotesByParty())
      .filter(p => !(p in this.colorService.partyColorMap));
  });
  seatsValueFn = (d: PartySeatCount) => d.totalSeats;
  votePctFn = (d: PartyVoteShare) => d.votePct;
  labelFn = (d: PartySeatCount | PartyVoteShare) => d.party;
  colorFn = (d: PartySeatCount | PartyVoteShare) => this.colorService.partyColorScale()(d.party);

  onSectorMouseover(hoveredParty: PartySeatCount | PartyVoteShare): void {
    if (hoveredParty.party in this.colorService.partyColorMap) {
      this.partyHover.emit([hoveredParty.party]);
      return;
    }
    this.partyHover.emit(this.otherParties());
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
