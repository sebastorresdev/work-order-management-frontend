import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { RoleResponse } from '../../models/role-response';
import { RoleService } from '../../services/role-service';
import { DeleteRolesRequest } from '../../models/delete-roles-request';
import { RoleFormModal } from '../../components/role-form-modal/role-form-modal';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { PermissionDrawer, PermissionDrawerData } from '../../../user/components/permission-drawer/permission-drawer';

/**
 * Componente de página para el listado, búsqueda y gestión de roles y asignación de permisos.
 */
@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzModalModule,
    NzDrawerModule,
    NzInputModule,
    NzSpaceModule,
    RoleFormModal
  ],
  templateUrl: './role-list.html',
})
export class RoleList implements OnInit {
  /**
   * Servicio de roles.
   */
  private _roleService = inject(RoleService);

  /**
   * Servicio de notificaciones.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio de modales.
   */
  private _modalService = inject(NzModalService);

  /**
   * Servicio de cajones (drawers) laterales.
   */
  private _drawerService = inject(NzDrawerService);

  /**
   * Señal reactiva con todos los roles.
   */
  allRoles = signal<RoleResponse[]>([]);

  /**
   * Señal reactiva con el texto de búsqueda.
   */
  search = signal('');

  /**
   * Propiedad computada para filtrar roles por nombre o descripción.
   */
  filteredRoles = computed(() => {
    const term = this.search().toLowerCase().trim();
    if (!term) return this.allRoles();
    return this.allRoles().filter(r => 
      r.name.toLowerCase().includes(term) || 
      (r.description && r.description.toLowerCase().includes(term))
    );
  });

  /**
   * Señal reactiva de visibilidad del modal de formulario de rol.
   */
  showRoleModal = signal(false);

  /**
   * Señal reactiva con el rol actualmente seleccionado para edición.
   */
  selectedRole = signal<RoleResponse | null>(null);

  /**
   * Selección completa.
   */
  checked = false;

  /**
   * Selección parcial.
   */
  indeterminate = false;

  /**
   * Datos de la página actual de la tabla.
   */
  listOfCurrentPageData: readonly RoleResponse[] = [];

  /**
   * Conjunto de IDs de roles seleccionados.
   */
  setOfCheckedId = new Set<string>();

  /**
   * Inicializa el componente y carga el listado de roles.
   */
  ngOnInit(): void {
    this.loadRoles();
  }

  /**
   * Carga los roles invocando el servicio.
   */
  loadRoles(): void {
    this._roleService.getAll().subscribe({
      next: (data) => this.allRoles.set(data),
      error: (error) => {
        console.error('Error loading roles', error);
        this._messageService.error('No se pudieron cargar los roles');
      },
    });
  }

  /**
   * Abre el modal para la creación de un nuevo rol.
   */
  openNewRoleModal(): void {
    this.selectedRole.set(null);
    this.showRoleModal.set(true);
  }

  /**
   * Abre el modal para la edición de un rol existente.
   * @param role Rol a editar.
   */
  openEditRoleModal(role: RoleResponse): void {
    this.selectedRole.set(role);
    this.showRoleModal.set(true);
  }

  /**
   * Recarga la lista de roles cuando se guarda uno nuevo o editado.
   */
  onRoleSaved(): void {
    this.loadRoles();
  }

  /**
   * Actualiza el conjunto de IDs seleccionados.
   * @param id ID del rol.
   * @param checked Estado seleccionado.
   */
  updateCheckedSet(id: string, checked: boolean): void {
    if (checked) {
      this.setOfCheckedId.add(id);
    } else {
      this.setOfCheckedId.delete(id);
    }
  }

  /**
   * Maneja el cambio de casilla individual.
   * @param id ID del rol.
   * @param checked Estado.
   */
  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  /**
   * Selecciona o deselecciona todos los roles visibles.
   * @param value Estado.
   */
  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  /**
   * Recibe el cambio de datos en la página de la tabla.
   * @param data Roles en la página.
   */
  onCurrentPageDataChange(data: readonly RoleResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  /**
   * Actualiza los indicadores checked e indeterminate.
   */
  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  /**
   * Muestra la confirmación para eliminar un rol individual.
   * @param role Rol a eliminar.
   */
  showDeleteRoleConfirm(role: RoleResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar el rol '${role.name}'?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._roleService.delete(role.id).subscribe({
          next: () => {
            this._messageService.success(`Rol '${role.name}' eliminado`);
            this.setOfCheckedId.delete(role.id);
            this.refreshCheckedStatus();
            this.loadRoles();
          },
          error: (err) => {
            console.error('Error deleting role', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Muestra la confirmación para eliminar los roles seleccionados.
   */
  showDeleteSelectedRolesConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} rol(es)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedRoles(),
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Ejecuta la eliminación masiva de roles seleccionados.
   */
  deleteSelectedRoles(): void {
    const request: DeleteRolesRequest = {
      roleIds: Array.from(this.setOfCheckedId),
    };

    this._roleService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.refreshCheckedStatus();
        this.loadRoles();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }

  /**
   * Abre el drawer lateral para gestionar la asignación de permisos del rol.
   * @param role Rol seleccionado.
   */
  openPermissions(role: RoleResponse): void {
    this._roleService.getPermissions(role.id).subscribe({
      next: (groups) => {
        const drawerRef = this._drawerService.create<PermissionDrawer, PermissionDrawerData, string[]>({
          nzTitle: 'Establecer Permisos del Rol',
          nzWidth: 480,
          nzContent: PermissionDrawer,
          nzData: { groups, userName: role.name },
        });

        drawerRef.afterClose.subscribe((selectedKeys) => {
          if (!selectedKeys) return;

          this._roleService.setPermissions(role.id, selectedKeys).subscribe({
            next: () => this._messageService.success('Permisos actualizados'),
            error: () => this._messageService.error('No se pudieron guardar los permisos'),
          });
        });
      },
      error: () => this._messageService.error('No se pudieron cargar los permisos del rol'),
    });
  }
}
