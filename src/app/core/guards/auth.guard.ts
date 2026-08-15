import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de navegación de Angular que protege rutas que requieren autenticación previa.
 * @returns boolean `true` si el usuario está autenticado, de lo contrario redirige a '/login' y devuelve `false`.
 */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (authService.isAuthenticated())
        return true;

    router.navigate(['/login']);
    return false;
};

/**
 * Guard de navegación que evita que usuarios ya autenticados accedan a páginas públicas como el Login.
 * @returns boolean `true` si el usuario NO está autenticado, o redirige a '/work-orders' si ya inició sesión.
 */
export const noAuthGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router      = inject(Router);

    if (!authService.isAuthenticated())
        return true;

    router.navigate(['/work-orders']);
    return false;
};
