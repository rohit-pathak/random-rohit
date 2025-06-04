import { Component, input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";

@Component({
  selector: 'app-post',
  imports: [RouterLink, DatePipe],
  template: `
    <a [routerLink]="route()">{{ title() }}</a>
    <div class="date">[{{ date() | date }}]</div>
  `,
  styles: `
    :host {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  `
})
export class PostComponent {
  date = input.required<Date>();
  title = input.required<string>();
  route = input.required<string>();
}
