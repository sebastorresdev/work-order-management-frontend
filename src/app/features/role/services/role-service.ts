import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { RoleResponse } from '../models/role-response';
import { RoleRequest } from '../models/role-request';
import { DeleteRolesRequest } from '../models/delete-roles-request';
import { Observable } from 'rxjs';
import { PermissionGroup } from '../../../shared/models/permission-group';

/**
 * Servicio Angular para el consumo de los servicios de administración de roles y permisos de la API.
 */
@Injectable({
  providedIn: 'root',
})
export class RoleService {
  /**
   * Cliente HTTP inyectado.
   */
  private _http = inject(HttpClient);

  /**
   * URL base de endpoints para la gestión de roles.
   */
  private _base = `${environment.API_URL}/roles`;

  /**
   * Obtiene la lista completa de roles registrados.
   * @returns Observable con el listado de roles.
   */
  getAll(): Observable<RoleResponse[]> {
    return this._http.get<RoleResponse[]>(this._base);
  }

  /**
   * Obtiene un rol por su identificador.
   * @param id Identificador del rol.
   * @returns Observable con los datos del rol.
   */
  getById(id: string): Observable<RoleResponse> {
    return this._http.get<RoleResponse>(`${this._base}/${id}`);
  }

  /**
   * Crea un nuevo rol.
   * @param data Datos del rol a registrar.
   * @returns Observable con el ID generado.
   */
  create(data: RoleRequest): Observable<string> {
    return this._http.post<string>(this._base, data);
  }

  /**
   * Actualiza los datos de un rol existente.
   * @param id Identificador del rol.
   * @param data Datos actualizados.
   * @returns Observable completado al actualizar.
   */
  update(id: string, data: RoleRequest): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}`, data);
  }

  /**
   * Elimina un rol específico.
   * @param id Identificador del rol.
   * @returns Observable completado tras la eliminación.
   */
  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }

  /**
   * Elimina múltiples roles seleccionados en una sola operación de lote.
   * @param data Solicitud con la lista de IDs de roles a eliminar.
   * @returns Observable completado tras la eliminación en lote.
   */
  deleteSelected(data: DeleteRolesRequest): Observable<void> {
    return this._http.delete<void>(`${this._base}/batch`, { body: data });
  }

  /**
   * Obtiene la estructura de permisos asignados a un rol determinado.
   * @param roleId Identificador del rol.
   * @returns Observable con la lista de grupos de permisos.
   */
  getPermissions(roleId: string): Observable<PermissionGroup[]> {
    return this._http.get<PermissionGroup[]>(`${this._base}/${roleId}/permissions`);
  }

  /**
   * Asigna o reemplaza los permisos asociados a un rol específico.
   * @param roleId Identificador del rol.
   * @param permissionKeys Claves de los permisos otorgados.
   * @returns Observable completado tras guardar los permisos.
   */
  setPermissions(roleId: string, permissionKeys: string[]): Observable<void> {
    return this._http.put<void>(`${this._base}/${roleId}/permissions`, { permissionKeys });
  }
}
