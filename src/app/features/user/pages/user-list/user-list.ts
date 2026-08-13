import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
// NG-ZORRO
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropdownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
// PROYECTO
import { UserResponse } from '../../models/user-response';
import { UserService } from '../../services/user-service';
import { RoleService } from '../../../role/services/role-service';
import { RoleResponse } from '../../../role/models/role-response';
import { Router } from '@angular/router';
import { ResetPasswordModal } from '../../components/reset-password-modal/reset-password-modal';
import { DeleteUsersRequest } from '../../models/delete-users-request';
import { PermissionDrawer, PermissionDrawerData } from '../../components/permission-drawer/permission-drawer';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

/**
 * Componente principal para el listado, filtrado por roles/búsqueda, alternancia de estados y gestión de usuarios.
 */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    NzInputModule,
    NzSpaceModule,
    DatePipe,
    FormsModule,
    NzTableModule,
    NzIconModule,
    NzButtonModule,
    NzDropdownModule,
    NzMenuModule,
    NzSwitchModule,
    NzTagModule,
    NzDrawerModule,
    NzModalModule,
    NzAvatarModule,
    NzSelectModule,
    ResetPasswordModal,
  ],
  templateUrl: './user-list.html',
})
export class UserList implements OnInit {
  /**
   * Enrutador inyectado.
   */
  private _router = inject(Router);

  /**
   * Servicio de usuarios.
   */
  private _userService = inject(UserService);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio de diálogos modales.
   */
  private _modalService = inject(NzModalService);

  /**
   * Servicio de cajones laterales.
   */
  private _drawerService = inject(NzDrawerService);

  /**
   * Servicio de roles.
   */
  private _roleService = inject(RoleService);

  /**
   * Señal reactiva con todos los usuarios.
   */
  allUsers = signal<UserResponse[]>([]);

  /**
   * Señal reactiva con todos los roles disponibles para filtrado.
   */
  allRoles = signal<RoleResponse[]>([]);
  
  /**
   * Señal reactiva del término de búsqueda.
   */
  search = signal('');

  /**
   * Señal reactiva con el filtro de rol seleccionado.
   */
  selectedRoleFilter = signal<string | null>(null);

  /**
   * Propiedad computada que aplica los filtros de texto y rol a la lista de usuarios.
   */
  filteredUsers = computed(() => {
    const term = this.search().toLowerCase().trim();
    const roleFilter = this.selectedRoleFilter();

    let result = this.allUsers();

    if (term) {
      result = result.filter(u => 
        u.userName.toLowerCase().includes(term) || 
        (u.email && u.email.toLowerCase().includes(term))
      );
    }

    if (roleFilter) {
      result = result.filter(u => u.roleNames.includes(roleFilter));
    }

    return result;
  });

  /**
   * Visibilidad del modal de reseteo de contraseña.
   */
  showResetPasswordModal = signal(false);

  /**
   * Usuario seleccionado para reseteo de contraseña u otra acción.
   */
  selectedUser = signal<UserResponse | null>(null);

  /**
   * Estado de selección total de la tabla.
   */
  checked = false;

  /**
   * Estado de selección parcial.
   */
  indeterminate = false;

  /**
   * Elementos visibles en la página actual de la tabla.
   */
  listOfCurrentPageData: readonly UserResponse[] = [];

  /**
   * Conjunto de IDs de usuarios seleccionados.
   */
  setOfCheckedId = new Set<string>();

  /**
   * Inicializa las listas de usuarios y roles.
   */
  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  /**
   * Carga el catálogo de roles para el desplegable de filtro.
   */
  loadRoles(): void {
    this._roleService.getAll().subscribe({
      next: (data) => this.allRoles.set(data),
      error: () => this._messageService.error('Error al cargar roles')
    });
  }

  /**
   * Redirige al formulario de creación de nuevo usuario.
   */
  goToNewUser(): void {
    this._router.navigate(['/users/new']);
  }

  /**
   * Redirige a la pantalla de edición del usuario.
   * @param userId Identificador del usuario.
   */
  editUser(userId: string): void {
    this._router.navigate(['/users', userId]);
  }

  /**
   * Consulta y carga la lista de usuarios desde la API.
   */
  loadUsers(): void {
    this._userService.getAll().subscribe({
      next: (data) => this.allUsers.set(data),
      error: (error) => {
        console.error('Error al cargar usuarios', error);
        this._messageService.error('No se pudieron cargar los usuarios');
      },
    });
  }

  /**
   * Actualiza la selección del conjunto de IDs.
   * @param id ID del usuario.
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
   * Maneja el cambio de checkbox individual.
   * @param id ID del usuario.
   * @param checked Estado.
   */
  onItemChecked(id: string, checked: boolean): void {
    this.updateCheckedSet(id, checked);
    this.refreshCheckedStatus();
  }

  /**
   * Marca o desmarca todas las casillas de la página actual.
   * @param value Estado.
   */
  onAllChecked(value: boolean): void {
    this.listOfCurrentPageData.forEach((item) => this.updateCheckedSet(item.id, value));
    this.refreshCheckedStatus();
  }

  /**
   * Recibe la nueva lista de elementos al cambiar de página.
   * @param data Usuarios en la página visible.
   */
  onCurrentPageDataChange(data: readonly UserResponse[]): void {
    this.listOfCurrentPageData = data;
    this.refreshCheckedStatus();
  }

  /**
   * Recalcula los indicadores checked e indeterminate de la tabla.
   */
  refreshCheckedStatus(): void {
    this.checked = this.listOfCurrentPageData.length > 0 && this.listOfCurrentPageData.every((item) => this.setOfCheckedId.has(item.id));
    this.indeterminate =
      this.listOfCurrentPageData.some((item) => this.setOfCheckedId.has(item.id)) && !this.checked;
  }

  /**
   * Muestra la confirmación para eliminar un usuario individual.
   * @param user Usuario a eliminar.
   */
  showDeleteUserConfirm(user: UserResponse): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar a ${user.userName}?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this._userService.delete(user.id).subscribe({
          next: () => {
            this._messageService.success(`Usuario ${user.userName} eliminado`);
            this.loadUsers();
          },
          error: (err) => {
            console.error('Error al eliminar usuario', err);
            const errorMessage = parseApiErrorMessage(err);
            this._messageService.error(errorMessage);
          },
        });
      },
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Muestra el diálogo de confirmación para eliminar usuarios en lote.
   */
  showDeleteSelectedUsersConfirm(): void {
    this._modalService.confirm({
      nzTitle: `¿Estás seguro de que quieres eliminar ${this.setOfCheckedId.size} usuario(s)?`,
      nzOkText: 'Confirmar',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => this.deleteSelectedUsers(),
      nzCancelText: 'Cancelar',
    });
  }

  /**
   * Ejecuta la eliminación masiva de los usuarios seleccionados.
   */
  deleteSelectedUsers(): void {
    const request: DeleteUsersRequest = {
      userIds: Array.from(this.setOfCheckedId),
    };

    this._userService.deleteSelected(request).subscribe({
      next: () => {
        this.setOfCheckedId.clear();
        this.loadUsers();
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
      },
    });
  }

  /**
   * Abre el drawer de permisos individuales (overrides) para el usuario seleccionado.
   * @param user Usuario objetivo.
   */
  openPermissions(user: UserResponse): void {
    this._userService.getForUser(user.id).subscribe({
      next: (groups) => {
        const drawerRef = this._drawerService.create<PermissionDrawer, PermissionDrawerData, string[]>({
          nzTitle: 'Establecer Permisos',
          nzWidth: 480,
          nzContent: PermissionDrawer,
          nzData: { groups, userName: user.userName },
        });

        drawerRef.afterClose.subscribe((selectedOverrideKeys) => {
          if (!selectedOverrideKeys) return;

          console.log("Usuario seleccionado", user);
          this._userService.setOverrides(user.id, selectedOverrideKeys).subscribe({
            next: () => this._messageService.success('Permisos actualizados'),
            error: () => this._messageService.error('No se pudieron guardar los permisos'),
          });
        });
      },
      error: () => this._messageService.error('No se pudieron cargar los permisos del usuario'),
    });
  }

  /**
   * Abre el modal de restablecimiento de contraseña para un usuario.
   * @param user Usuario al que se le cambiará la clave.
   */
  openResetPassword(user: UserResponse): void {
    this.selectedUser.set(user);
    this.showResetPasswordModal.set(true);
  }

  /**
   * Alterna el estado activo/inactivo de la cuenta de un usuario mediante el interruptor switch.
   * @param user Usuario a modificar.
   * @param active Nuevo estado (`true` activo / `false` inactivo).
   */
  toggleActive(user: UserResponse, active: boolean): void {
    this._userService.toggleStatus(user.id, active).subscribe({
      next: () => {
        this._messageService.success(`El usuario ha sido ${active ? 'activado' : 'desactivado'}`);
        user.isActive = active;
        this.allUsers.update(users => {
          const index = users.findIndex(u => u.id === user.id);
          if (index !== -1) {
            users[index].isActive = active;
          }
          return [...users];
        });
      },
      error: (err) => {
        const errorMessage = parseApiErrorMessage(err);
        this._messageService.error(errorMessage);
        this.loadUsers();
      }
    });
  }
}
