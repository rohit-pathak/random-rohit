import { Component, computed, effect, inject, input } from '@angular/core';
import { Constituency, ConstituencyResult } from "../../models/models";
import { TitleCasePipe } from "@angular/common";
import { ElectionDataStore } from "../../election-data.store";

@Component({
  selector: 'app-constituency-detail',
  standalone: true,
  imports: [
    TitleCasePipe
  ],
  templateUrl: './constituency-detail.component.html',
  styleUrl: './constituency-detail.component.scss'
})
export class ConstituencyDetailComponent {
  constituency = input.required<Constituency | null>();

  constituencyDetail = computed<ConstituencyDetail | null>(() => {
    const constituency = this.constituency();
    if (!constituency) {
      return null;
    }
    const stateName = this.electionDataStore.statesById()[constituency.stateOrUT];
    const results = this.electionDataStore.resultsByConstituency()[constituency.id];
    return {
      constituency,
      stateName,
      results
    }
  });


  private electionDataStore = inject(ElectionDataStore);

  constructor() {
    effect(() => {
      console.log(this.electionDataStore.statesById());
    });
  }


}

interface ConstituencyDetail {
  constituency: Constituency;
  stateName: string;
  results: ConstituencyResult[];
}
