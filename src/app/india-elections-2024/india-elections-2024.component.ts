import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { ElectionDataService } from "./services/election-data.service";
import { ElectionDataStore } from "./election-data.store";
import { ColorScaleService } from "./services/color-scale.service";
import { ConstituenciesMapComponent } from "./components/constituencies-map/constituencies-map.component";
import { ConstituencyDetailComponent } from "./components/constituency-detail/constituency-detail.component";
import { Constituency } from "./models/models";
import { TotalStatsComponent } from "./components/total-stats/total-stats.component";
import { MatDivider } from "@angular/material/divider";
import { MatProgressSpinner } from "@angular/material/progress-spinner";

@Component({
  selector: 'app-india-elections-2024',
  imports: [
    ConstituenciesMapComponent,
    ConstituencyDetailComponent,
    TotalStatsComponent,
    MatDivider,
    MatProgressSpinner
  ],
  providers: [ElectionDataService, ElectionDataStore, ColorScaleService],
  templateUrl: './india-elections-2024.component.html',
  styleUrl: './india-elections-2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndiaElections2024Component implements OnInit {
  private readonly electionDataStore = inject(ElectionDataStore);
  private readonly meta = inject(Meta);

  protected readonly isLoading = this.electionDataStore.isLoading;
  protected readonly selectedConstituency = signal<Constituency | null>(null);
  protected readonly hoveredParties = signal<string[] | null>(null);
  protected readonly highlightConstituencies = computed<Constituency[] | null>(() => {
    const parties = this.hoveredParties();
    if (!parties) {
      return null;
    }
    return parties
      .filter(p => p in this.electionDataStore.constituenciesWonByParty())
      .flatMap(p => this.electionDataStore.constituenciesWonByParty()[p]);
  });


  ngOnInit(): void {
    this.meta.updateTag({
      name: 'description',
      content: 'Interactive visualization of the 2024 Indian parliamentary election results.'
    });
    this.electionDataStore.loadAllData();
  }

  onConstituencyClick(constituency: Constituency): void {
    this.selectedConstituency.set(constituency);
  }

  onPartyHover(parties: string[] | null): void {
    this.hoveredParties.set(parties);
  }

}
