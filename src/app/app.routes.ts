import { Routes } from '@angular/router';
import { HomeComponent } from "./home/home.component";
import { AidDataVizComponent } from "./aid-data-viz/aid-data-viz.component";

export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'aid-data', component: AidDataVizComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
