import { Component } from '@angular/core';
import { MatDivider } from "@angular/material/divider";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { MatIconAnchor } from "@angular/material/button";

@Component({
  selector: 'app-main-header',
  imports: [
    MatDivider,
    RouterLink,
    MatIcon,
    MatTooltip,
    MatIconAnchor,
  ],
  templateUrl: './main-header.component.html',
  styleUrl: './main-header.component.scss'
})
export class MainHeaderComponent {

}
