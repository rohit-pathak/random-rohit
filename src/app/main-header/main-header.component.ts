import { Component } from '@angular/core';
import { MatDivider } from "@angular/material/divider";
import { RouterLink } from "@angular/router";

@Component({
    selector: 'app-main-header',
    imports: [
        MatDivider,
        RouterLink,
    ],
    templateUrl: './main-header.component.html',
    styleUrl: './main-header.component.scss'
})
export class MainHeaderComponent {

}
