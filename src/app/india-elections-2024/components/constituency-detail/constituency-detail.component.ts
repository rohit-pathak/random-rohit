import { Component, input } from '@angular/core';
import { Constituency } from "../../models/models";
import { TitleCasePipe } from "@angular/common";

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


}
