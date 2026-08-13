import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/**
 * Punto de entrada inicial para la inicialización y arranque de la aplicación Angular standalone.
 */
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
