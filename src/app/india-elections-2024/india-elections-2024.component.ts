import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { ElectionDataService } from "./services/election-data.service";
import { ElectionDataStore } from "./election-data.store";
import { ColorScaleService } from "./services/color-scale.service";
import { ConstituenciesMapComponent } from "./components/constituencies-map/constituencies-map.component";
import { ConstituencyDetailComponent } from "./components/constituency-detail/constituency-detail.component";
import { Constituency } from "./models/models";
import { TotalStatsComponent } from "./components/total-stats/total-stats.component";
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: 'app-india-elections-2024',
  standalone: true,
  imports: [
    ConstituenciesMapComponent,
    ConstituencyDetailComponent,
    TotalStatsComponent,
    MatDivider
  ],
  providers: [ElectionDataService, ElectionDataStore, ColorScaleService],
  templateUrl: './india-elections-2024.component.html',
  styleUrl: './india-elections-2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndiaElections2024Component implements OnInit {
  private electionDataStore = inject(ElectionDataStore);

  selectedConstituency = signal<Constituency | null>(null);
  hoveredParties = signal<string[] | null>(null);
  highlightConstituencies = computed<Constituency[] | null>(() => {
    const parties = this.hoveredParties();
    if (!parties) {
      return null;
    }
    return parties
      .filter(p => p in this.electionDataStore.constituenciesWonByParty())
      .flatMap(p => this.electionDataStore.constituenciesWonByParty()[p]);
  });


  ngOnInit(): void {
    this.electionDataStore.loadAllData();
  }

  onConstituencyClick(constituency: Constituency): void {
    this.selectedConstituency.set(constituency);
  }

  onPartyHover(parties: string[] | null): void {
    this.hoveredParties.set(parties);
  }

}
