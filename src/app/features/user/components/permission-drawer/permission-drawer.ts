import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { NZ_DRAWER_DATA, NzDrawerModule, NzDrawerRef } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PermissionGroup } from '../../../../shared/models/permission-group';

/**
 * Interfaz de datos de entrada para el cajón (Drawer) de permisos.
 */
export interface PermissionDrawerData {
  /**
   * Grupos de permisos del sistema a mostrar.
   */
  groups: PermissionGroup[];

  /**
   * Nombre de usuario o rol al que pertenecen los permisos (opcional).
   */
  userName?: string | null;
}

/**
 * Componente de cajón lateral (Drawer) para la edición gráfica de permisos heredados o anulaciones (overrides).
 */
@Component({
  selector: 'app-permission-drawer',
  standalone: true,
  imports: [
    FormsModule,
    NzDrawerModule,
    NzFormModule,
    NzButtonModule,
    NzCardModule,
    NzCheckboxModule,
    NzDividerModule,
    NzTagModule,
    NzInputModule,
    NzIconModule,
  ],
  templateUrl: './permission-drawer.html',
})
export class PermissionDrawer {
  /**
   * Datos inyectados al abrir el cajón.
   */
  readonly data = inject<PermissionDrawerData>(NZ_DRAWER_DATA);

  /**
   * Referencia al cajón lateral.
   */
  readonly drawerRef: NzDrawerRef<this, string[]> = inject(NzDrawerRef);

  /**
   * Copia clonada de los grupos de permisos para mutación local.
   */
  groups: PermissionGroup[] = structuredClone(this.data?.groups ?? []);

  /**
   * Nombre de presentación del usuario o rol.
   */
  userName = this.data?.userName ?? null;

  /**
   * Señal reactiva del filtro de búsqueda de permisos.
   */
  search = signal('');

  /**
   * Grupos y permisos filtrados dinámicamente según el término de búsqueda.
   */
  filteredGroups = computed(() => {
    const term = this.search().trim().toLowerCase();
    if (!term) return this.groups;

    return this.groups
      .map(g => {
        const groupMatches = g.group.toLowerCase().includes(term) || 
                             (g.groupDescription && g.groupDescription.toLowerCase().includes(term));
        
        if (groupMatches) {
          return g;
        }

        return {
          ...g,
          permissions: g.permissions.filter(p =>
            p.display.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term)
          ),
        };
      })
      .filter(g => g.permissions.length > 0);
  });

  /**
   * Señal reactiva con el conjunto de claves de permisos en estado de anulación (Override).
   */
  overrides = signal<Set<string>>(
    new Set(
      this.groups
        .flatMap(g => g.permissions)
        .filter(p => p.source === 'Override')
        .map(p => p.key)
    )
  );

  /**
   * Determina si una clave de permiso viene heredada desde un rol.
   * @param key Clave del permiso.
   * @returns `true` si es heredado del rol.
   */
  isInherited(key: string): boolean {
    return this.findPermission(key)?.source === 'Role';
  }

  /**
   * Evalúa si un permiso debe mostrarse marcado (por herencia o anulación).
   * @param key Clave del permiso.
   * @returns `true` si está activo.
   */
  isChecked(key: string): boolean {
    return this.isInherited(key) || this.overrides().has(key);
  }

  /**
   * Alterna la selección de una anulación de permiso si no viene heredada del rol.
   * @param key Clave del permiso.
   */
  toggle(key: string): void {
    if (this.isInherited(key)) return;

    const current = new Set(this.overrides());
    if (current.has(key)) current.delete(key);
    else current.add(key);
    this.overrides.set(current);
  }

  /**
   * Busca un permiso por su clave en todos los grupos.
   * @param key Clave del permiso.
   */
  private findPermission(key: string) {
    return this.groups
      .flatMap(g => g.permissions)
      .find(p => p.key === key);
  }

  /**
   * Retorna las claves de permisos modificables dentro de un grupo determinado.
   * @param group Grupo de permisos.
   */
  togglableKeysInGroup(group: PermissionGroup): string[] {
    return group.permissions
      .filter(p => p.source !== 'Role')
      .map(p => p.key);
  }

  /**
   * Comprueba si todos los permisos de un grupo son heredados y no se pueden modificar individualmente.
   * @param group Grupo de permisos.
   */
  isGroupFullyInherited(group: PermissionGroup): boolean {
    return this.togglableKeysInGroup(group).length === 0;
  }

  /**
   * Comprueba si todos los permisos modificables del grupo están marcados.
   * @param group Grupo de permisos.
   */
  isGroupAllChecked(group: PermissionGroup): boolean {
    const togglable = this.togglableKeysInGroup(group);
    if (togglable.length === 0) return true;
    return togglable.every(key => this.overrides().has(key));
  }

  /**
   * Comprueba si sólo una parte de los permisos modificables del grupo están marcados.
   * @param group Grupo de permisos.
   */
  isGroupIndeterminate(group: PermissionGroup): boolean {
    const togglable = this.togglableKeysInGroup(group);
    const checkedCount = togglable.filter(key => this.overrides().has(key)).length;
    return checkedCount > 0 && checkedCount < togglable.length;
  }

  /**
   * Selecciona o deselecciona de golpe todos los permisos modificables del grupo.
   * @param group Grupo de permisos.
   * @param checked Estado deseado.
   */
  onGroupAllChange(group: PermissionGroup, checked: boolean): void {
    const current = new Set(this.overrides());
    this.togglableKeysInGroup(group).forEach(key => {
      if (checked) current.add(key);
      else current.delete(key);
    });
    this.overrides.set(current);
  }

  /**
   * Cierra el cajón retornando la lista de anulaciones activas.
   */
  save(): void {
    this.drawerRef.close(Array.from(this.overrides()));
  }

  /**
   * Cierra el cajón cancelando cambios.
   */
  close(): void {
    this.drawerRef.close();
  }
}
