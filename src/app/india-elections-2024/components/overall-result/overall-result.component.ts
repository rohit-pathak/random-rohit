import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ConstituenciesMapComponent } from "../constituencies-map/constituencies-map.component";
import { ConstituencyDetailComponent } from "../constituency-detail/constituency-detail.component";
import { Constituency } from "../../models/models";
import { TotalSeatsComponent } from "../total-seats/total-seats.component";

@Component({
  selector: 'app-overall-result',
  standalone: true,
  imports: [ConstituenciesMapComponent, ConstituencyDetailComponent, TotalSeatsComponent],
  templateUrl: './overall-result.component.html',
  styleUrl: './overall-result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OverallResultComponent {
  selectedConstituency = signal<Constituency | null>(null);

  onConstituencyClick(constituency: Constituency): void {
    this.selectedConstituency.set(constituency);
  }

}
