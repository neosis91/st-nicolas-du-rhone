import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { API_ORIGIN } from './core/api-origin';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_ORIGIN,
      useFactory: () => process.env['API_ORIGIN'] ?? 'http://127.0.0.1:3000',
    },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
