import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
// NG-ZORRO
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { PERMISSIONS } from '../core/constants/permissions';
import { HasPermissionDirective } from '../core/directives/has-permission.directive';
import { MENU } from '../core/config/menu.config';

/**
 * Componente de diseño (Layout principal) que envuelve el menú lateral de navegación, el encabezado y el área de contenido.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzBreadCrumbModule,
    NzButtonModule,
    HasPermissionDirective,
  ],
  templateUrl: './layout.html',
})
export class Layout {
  /**
   * Servicio de autenticación inyectado.
   */
  auth = inject(AuthService);

  /**
   * Servicio de gestión de temas inyectado.
   */
  themeService = inject(ThemeService);

  /**
   * Estado de colapso o expansión del menú lateral.
   */
  isCollapsed = false;

  /**
   * Constante de permisos accesible desde la plantilla del layout.
   */
  readonly PERMISSIONS = PERMISSIONS;

  /**
   * Configuración de la estructura de menús.
   */
  menu = MENU;

  /**
   * Evalúa si el usuario autenticado posee permiso para visualizar al menos uno de los ítems de un grupo de menú.
   * @param group Grupo de menú a evaluar.
   * @returns `true` si debe mostrarse el grupo, `false` de lo contrario.
   */
  hasGroupPermission(group: typeof MENU[number]): boolean {
    if (!group.children || group.children.length === 0) return true;
    const userPermissions = this.auth.permissions();
    return group.children.some(child => !child.permission || userPermissions.includes(child.permission));
  }
}
