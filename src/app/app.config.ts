import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient } from "@angular/common/http";
import { AppTitleStrategy } from "./root/app-title-strategy.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ]
};
