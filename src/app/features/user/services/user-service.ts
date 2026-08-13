import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { UserResponse } from '../models/user-response';
import { UserDetailResponse } from '../models/user-detail-response';
import { CreateUserRequest } from '../models/create-user-request';
import { UpdateUserRequest } from '../models/update-user-request';
import { environment } from '../../../../environments/environment';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { DeleteUsersRequest } from '../models/delete-users-request';
import { PermissionGroup } from '../../../shared/models/permission-group';

/**
 * Servicio Angular para el consumo de los endpoints REST del módulo de gestión de usuarios.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  /**
   * Cliente HTTP inyectado.
   */
  private _http = inject(HttpClient);

  /**
   * URL base para los endpoints de usuarios.
   */
  private _base = `${environment.API_URL}/users`;

  /**
   * Obtiene la lista resumida de usuarios para la tabla principal.
   * @returns Observable con la lista de respuestas de usuarios.
   */
  getAll() {
    return this._http.get<UserResponse[]>(this._base);
  }

  /**
   * Obtiene el detalle completo de un usuario por su ID.
   * @param userId Identificador del usuario.
   * @returns Observable con la respuesta detallada del usuario.
   */
  getById(userId: string) {
    return this._http.get<UserDetailResponse>(`${this._base}/${userId}`);
  }

  /**
   * Crea una nueva cuenta de usuario.
   * @param request Datos del nuevo usuario.
   * @returns Observable con el objeto que contiene el ID creado.
   */
  create(request: CreateUserRequest) {
    return this._http.post<{ id: string }>(this._base, request);
  }

  /**
   * Actualiza los datos de un usuario existente.
   * @param userId Identificador del usuario.
   * @param data Datos actualizados.
   * @returns Observable completado tras actualizar.
   */
  update(userId: string, data: UpdateUserRequest) {
    return this._http.put(`${this._base}/${userId}`, data);
  }

  /**
   * Elimina un usuario por su ID.
   * @param userId Identificador del usuario.
   * @returns Observable de la petición de eliminación.
   */
  delete(userId: string) {
    return this._http.delete(`${this._base}/${userId}`);
  }

  /**
   * Elimina un conjunto de usuarios seleccionados en lote.
   * @param deleteUsers Objeto con la lista de IDs a eliminar.
   * @returns Observable de la petición.
   */
  deleteSelected(deleteUsers: DeleteUsersRequest) {
    return this._http.delete(`${this._base}/batch`, {
      body: deleteUsers
    });
  }

  /**
   * Sube una imagen de avatar/perfil para un usuario.
   * @param avatar FormData con la imagen a subir.
   * @returns Observable con la URL de la imagen generada.
   */
  uploadAvatar(avatar: FormData) {
    return this._http.post<{ url: string }>(`${this._base}/avatar`, avatar);
  }

  /**
   * Asigna un conjunto de sedes a un usuario.
   * @param userId Identificador del usuario.
   * @param branchIds Lista de IDs de sedes asignadas.
   * @returns Observable de la petición.
   */
  assignBranchesToUser(userId: string, branchIds: string[]) {
    return this._http.put(`${this._base}/${userId}/branches`, { branchIds });
  }

  /**
   * Solicita el restablecimiento de contraseña para un usuario.
   * @param request Datos con el ID del usuario y la nueva contraseña.
   * @returns Observable de la petición.
   */
  resetPassword(request: ResetPasswordRequest) {
    return this._http.post<void>(`${this._base}/reset-password`, request);
  }

  /**
   * Obtiene la lista de permisos asignados y efectivos de un usuario.
   * @param userId Identificador del usuario.
   * @returns Observable con los grupos de permisos del usuario.
   */
  getForUser(userId: string) {
    return this._http.get<PermissionGroup[]>(`${this._base}/${userId}/permissions`);
  }

  /**
   * Reemplaza las anulaciones u excepciones explícitas de permisos (overrides) del usuario.
   * @param userId Identificador del usuario.
   * @param permissionKeys Lista de claves de permisos otorgados como anulación.
   * @returns Observable de la petición.
   */
  setOverrides(userId: string, permissionKeys: string[]) {
    return this._http.put<void>(`${this._base}/${userId}/permissions/overrides`, { permissionKeys });
  }

  /**
   * Alterna el estado activo/inactivo de la cuenta de un usuario.
   * @param userId Identificador del usuario.
   * @param isActive Nuevo estado a establecer.
   * @returns Observable de la petición.
   */
  toggleStatus(userId: string, isActive: boolean) {
    return this._http.patch<void>(`${this._base}/${userId}/status`, { isActive });
  }
}
