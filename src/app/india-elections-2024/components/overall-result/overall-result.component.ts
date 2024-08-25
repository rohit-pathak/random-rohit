import { Component } from '@angular/core';
import { ConstituenciesMapComponent } from "../constituencies-map/constituencies-map.component";
import { ConstituencyDetailComponent } from "../constituency-detail/constituency-detail.component";

@Component({
  selector: 'app-overall-result',
  standalone: true,
  imports: [ConstituenciesMapComponent, ConstituencyDetailComponent],
  templateUrl: './overall-result.component.html',
  styleUrl: './overall-result.component.scss'
})
export class OverallResultComponent {

}
