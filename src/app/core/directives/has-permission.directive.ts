import { Directive, Input, TemplateRef, ViewContainerRef, inject, effect, signal } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Directiva estructural (`*appHasPermission="'Permissions.Users.View'"`) que condiciona la renderización
 * de un elemento HTML del DOM según si el usuario posee el permiso especificado.
 */
@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  /**
   * Servicio de autenticación para consultar la lista de permisos del usuario.
   */
  private auth = inject(AuthService);

  /**
   * Contenedor de vistas del DOM en el cual se inserta o destruye la plantilla.
   */
  private viewContainer = inject(ViewContainerRef);

  /**
   * Referencia a la plantilla HTML del elemento sobre el cual se aplica la directiva.
   */
  private templateRef = inject(TemplateRef<any>);

  /**
   * Señal reactiva interna con la clave del permiso requerido.
   */
  private requiredPermission = signal<string | undefined>(undefined);

  /**
   * Asigna la clave del permiso requerido enviado como parámetro a la directiva.
   */
  @Input('appHasPermission') set permission(permission: string | undefined) {
    this.requiredPermission.set(permission);
  }

  /**
   * Constructor de la directiva que configura un efecto reactivo (`effect`) para evaluar constantemente
   * si el usuario tiene el permiso y mostrar/ocultar el elemento en el DOM.
   */
  constructor() {
    effect(() => {
      const perm = this.requiredPermission();
      const userPermissions = this.auth.permissions();
      this.viewContainer.clear();

      if (!perm || userPermissions.includes(perm)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
