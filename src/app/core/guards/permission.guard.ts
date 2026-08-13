import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard funcional paramétrico que autoriza el acceso a una ruta basándose en un permiso requerido.
 * @param permission Clave textual del permiso exigido para navegar a la ruta.
 * @returns Función <see cref="CanActivateFn"/> que permite la navegación o redirige a la vista '/403' de acceso denegado.
 */
export const permissionGuard = (permission: string): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.permissions().includes(permission)) {
      return true;
    }

    router.navigate(['/403']);
    return false;
  };
};
