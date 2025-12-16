import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainHeaderComponent } from "./main-header/main-header.component";
import { Meta } from "@angular/platform-browser";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MainHeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  protected readonly title = 'random-rohit';

  private readonly meta = inject(Meta);

  ngOnInit(): void {
    this.meta.addTag({ name: 'description', content: "Rohit's blog with random programming projects."})
  }
}
