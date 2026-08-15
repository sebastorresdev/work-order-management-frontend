import { Component, HostListener, inject } from '@angular/core';
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

import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NotificationService, NotificationItem } from '../core/services/notification.service';
import { Router } from '@angular/router';

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
    NzBadgeModule,
    NzPopoverModule,
    NzListModule,
    NzTooltipModule,
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
   * Servicio de notificaciones inyectado.
   */
  notificationService = inject(NotificationService);

  private router = inject(Router);

  ngOnInit(): void {
    this.notificationService.startPolling();
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  onNotificationClick(item: NotificationItem): void {
    if (!item.isRead) {
      this.notificationService.markAsRead(item.id);
    }
    this.router.navigate(['/work-orders']);
  }

  /**
   * Servicio de gestión de temas inyectado.
   */
  themeService = inject(ThemeService);

  /**
   * Estado de colapso o expansión del menú lateral.
   */
  isCollapsed = false;

  /**
   * Estado del drawer del sidebar en vista móvil.
   */
  isMobileMenuOpen = false;

  /**
   * Punto de ruptura móvil.
   */
  readonly mobileBreakpoint = 768;

  /**
   * Constante de permisos accesible desde la plantilla del layout.
   */
  readonly PERMISSIONS = PERMISSIONS;

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= this.mobileBreakpoint) {
      this.isMobileMenuOpen = false;
    }
  }

  get isMobile(): boolean {
    return window.innerWidth < this.mobileBreakpoint;
  }

  toggleSidebar(): void {
    if (this.isMobile) {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
      return;
    }

    this.isCollapsed = !this.isCollapsed;
  }

  closeMobileSidebar(): void {
    this.isMobileMenuOpen = false;
  }

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
