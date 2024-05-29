import { Component, input } from '@angular/core';
import { RouterLink } from "@angular/router";
import { DatePipe } from "@angular/common";

@Component({
  selector: 'app-post',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent {
  date = input.required<Date>();
  title  = input.required<string>();
  route = input.required<string>();
}
