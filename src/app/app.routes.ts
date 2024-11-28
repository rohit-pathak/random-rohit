import { Routes } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { AidDataVizComponent } from "./aid-data-viz/aid-data-viz.component";
import { IndiaElections2024Component } from "./india-elections-2024/india-elections-2024.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'aid-data', component: AidDataVizComponent },
  { path: 'india-elections-2024', component: IndiaElections2024Component },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
