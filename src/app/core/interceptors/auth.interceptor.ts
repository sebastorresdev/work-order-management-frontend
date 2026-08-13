import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor HTTP funcional que adjunta automáticamente el token Bearer JWT al encabezado Authorization de cada petición.
 * @param req Solicitud HTTP de salida.
 * @param next Siguiente manejador en la cadena de interceptores.
 * @returns Observable de la respuesta HTTP.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (!token) return next(req);

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};
