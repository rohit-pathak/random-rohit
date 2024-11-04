import { Component, computed, inject } from '@angular/core';
import { DonutChartComponent } from "../../../shared/components/donut-chart/donut-chart.component";
import { ElectionDataStore } from "../../election-data.store";
import { ColorScaleService } from "../../services/color-scale.service";

@Component({
  selector: 'app-total-vote-share',
  standalone: true,
  imports: [
    DonutChartComponent
  ],
  templateUrl: './total-vote-share.component.html',
  styleUrl: './total-vote-share.component.scss'
})
export class TotalVoteShareComponent {
  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);

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
  valueFn = (d: PartyVoteShare) => d.votePct;
  labelFn = (d: PartyVoteShare) => d.party;
  colorFn = (d: PartyVoteShare) => this.colorService.partyColorScale()(d.party);
}

interface PartyVoteShare {
  party: string;
  votePct: number;
}
