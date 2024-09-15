import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Constituency, ConstituencyResult } from "../../models/models";
import { TitleCasePipe } from "@angular/common";
import { ElectionDataStore } from "../../election-data.store";
import { DonutChartComponent } from "../../../shared/components/donut-chart/donut-chart.component";
import { ColorScaleService } from "../../services/color-scale.service";
import { HorizontalBarChartComponent } from "../../../shared/horizontal-bar-chart/horizontal-bar-chart.component";

@Component({
  selector: 'app-constituency-detail',
  standalone: true,
  imports: [
    TitleCasePipe,
    DonutChartComponent,
    HorizontalBarChartComponent
  ],
  templateUrl: './constituency-detail.component.html',
  styleUrl: './constituency-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  totalVotes = computed(() => {
    const detail = this.constituencyDetail()
    if (!detail) {
      return 0;
    }
    return detail.results.reduce((acc, curr) => acc + curr.totalVotes, 0);
  });
  pctDonutValueFn = computed<(d: ConstituencyResult) => number>(() => {
    return (d: ConstituencyResult) => d.totalVotes / (this.totalVotes() || 1) // don't divide by zero;
  });
  pctDonutLabelFn = computed<(d: ConstituencyResult) => string>(() => {
    return (d: ConstituencyResult) => `${d.partyName}: ${d.totalVotes / this.totalVotes()}`
  });
  colorFn = computed<(d: ConstituencyResult) => string>(() => {
    const partyColorScale = this.colorService.partyColorScale();
    return (d: ConstituencyResult) => partyColorScale(d.partyName);
  });
  totalVotesFn = computed<(d: ConstituencyResult) => number>(() => {
    return (d: ConstituencyResult) => d.totalVotes;
  });
  barChartLabelFn = computed<(d: ConstituencyResult) => string>(() => {
    return (d: ConstituencyResult) => d.candidateName;
  });
  barChartIdFn = computed<(d: ConstituencyResult) => string>(() => {
    return (d: ConstituencyResult) => d.partyName;
  });
  hoveredResult = signal<ConstituencyResult | null>(null);

  private electionDataStore = inject(ElectionDataStore);
  private colorService = inject(ColorScaleService);

  onPctSectorHover(constituencyResult: ConstituencyResult): void {
    this.hoveredResult.set(constituencyResult);
  }

  onPctSectorMouseout(): void {
    this.hoveredResult.set(null);
  }

  onBarMouseover(constituencyResult: ConstituencyResult): void {
    this.hoveredResult.set(constituencyResult);
  }

  onBarMouseout(): void {
    this.hoveredResult.set(null);
  }

}

interface ConstituencyDetail {
  constituency: Constituency;
  stateName: string;
  results: ConstituencyResult[];
}
