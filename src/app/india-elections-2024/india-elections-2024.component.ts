import { Component } from '@angular/core';
import { OverallResultComponent } from "./overall-result/overall-result.component";
import { ElectionDataService } from "./services/election-data.service";

@Component({
  selector: 'app-india-elections-2024',
  standalone: true,
  imports: [
    OverallResultComponent
  ],
  providers: [ElectionDataService],
  templateUrl: './india-elections-2024.component.html',
  styleUrl: './india-elections-2024.component.scss'
})
export class IndiaElections2024Component {

}
