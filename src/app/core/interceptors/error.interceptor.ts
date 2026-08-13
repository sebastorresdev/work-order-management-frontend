import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP global para capturar errores de respuesta (401, 403, 400, 500) y mostrar notificaciones amigables.
 * @param req Solicitud HTTP entrante.
 * @param next Manejador siguiente en el pipeline.
 * @returns Observable del flujo de respuesta o relanzamiento del error capturado.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notification = inject(NzNotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
        notification.error('Sesión Expirada', 'Por favor, inicie sesión nuevamente.');
      } else if (error.status === 403) {
        router.navigate(['/403']);
        notification.warning('Acceso Denegado', 'No posee permisos para realizar esta acción.');
      } else if (error.status === 400 || error.status === 409) {
        const errorDetail = error.error?.detail || error.error?.title || 'Solicitud inválida.';
        notification.error('Error de Validación', errorDetail);
      } else if (error.status >= 500) {
        notification.error('Error de Servidor', 'Ocurrió un error inesperado en el servidor.');
      }

      return throwError(() => error);
    })
  );
};
