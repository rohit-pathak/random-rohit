import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ElectionDataService } from "./services/election-data.service";
import { ElectionDataStore } from "./election-data.store";
import { ColorScaleService } from "./services/color-scale.service";
import { ConstituenciesMapComponent } from "./components/constituencies-map/constituencies-map.component";
import { TotalSeatsComponent } from "./components/total-seats/total-seats.component";
import { TotalVoteShareComponent } from "./components/total-vote-share/total-vote-share.component";
import { ConstituencyDetailComponent } from "./components/constituency-detail/constituency-detail.component";
import { Constituency } from "./models/models";

@Component({
  selector: 'app-india-elections-2024',
  standalone: true,
  imports: [
    ConstituenciesMapComponent,
    TotalSeatsComponent,
    TotalVoteShareComponent,
    ConstituencyDetailComponent
  ],
  providers: [ElectionDataService, ElectionDataStore, ColorScaleService],
  templateUrl: './india-elections-2024.component.html',
  styleUrl: './india-elections-2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndiaElections2024Component implements OnInit {
  private electionDataStore = inject(ElectionDataStore);

  selectedConstituency = signal<Constituency | null>(null);

  ngOnInit(): void {
    this.electionDataStore.loadAllData();
  }

  onConstituencyClick(constituency: Constituency): void {
    this.selectedConstituency.set(constituency);
  }

}
