import { Routes } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { AidDataVizComponent } from "./aid-data-viz/aid-data-viz.component";
import { IndiaElections2024Component } from "./india-elections-2024/india-elections-2024.component";
import { ResizeWithDirectiveComponent } from "./posts/resize-with-directive/resize-with-directive.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent, title: 'Home' },
  { path: 'aid-data-viz', component: AidDataVizComponent, title: 'International Aid Transactions' },
  { path: 'india-elections-2024', component: IndiaElections2024Component, title: 'Indian Elections 2024' },
  { path: 'resize-with-directives', component: ResizeWithDirectiveComponent, title: 'Resize directives' },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
