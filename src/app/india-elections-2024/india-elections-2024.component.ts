import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { OverallResultComponent } from "./components/overall-result/overall-result.component";
import { ElectionDataService } from "./services/election-data.service";
import { ElectionDataStore } from "./election-data.store";
import { ColorScaleService } from "./services/color-scale.service";

@Component({
  selector: 'app-india-elections-2024',
  standalone: true,
  imports: [
    OverallResultComponent
  ],
  providers: [ElectionDataService, ElectionDataStore, ColorScaleService],
  templateUrl: './india-elections-2024.component.html',
  styleUrl: './india-elections-2024.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IndiaElections2024Component implements OnInit {
  private electionDataStore = inject(ElectionDataStore);

  ngOnInit(): void {
    this.electionDataStore.loadAllData();
  }

}
