import { Component } from '@angular/core';
import { ConstituenciesMapComponent } from "../constituencies-map/constituencies-map.component";

@Component({
  selector: 'app-overall-result',
  standalone: true,
  imports: [ConstituenciesMapComponent],
  templateUrl: './overall-result.component.html',
  styleUrl: './overall-result.component.scss'
})
export class OverallResultComponent {

}
