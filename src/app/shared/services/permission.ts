import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PermissionGroup } from '../models/permission-group';

/**
 * Servicio Angular para interactuar con la API REST de permisos y catálogos de seguridad.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  /**
   * Cliente HTTP inyectado.
   */
  private http = inject(HttpClient);

  /**
   * Obtiene la lista completa del catálogo de permisos agrupados por categoría.
   * @returns Observable con la lista de grupos de permisos.
   */
  getAll() {
    return this.http.get<PermissionGroup[]>(`${environment.API_URL}/permissions`);
  }

  /**
   * Actualiza las anulaciones de permisos otorgadas a un usuario en particular.
   * @param userId Identificador del usuario.
   * @param permissions Lista de claves de permisos activados.
   * @returns Observable con el resultado de la petición de actualización.
   */
  updatePermissions(userId: string, permissions: string[]) {
    return this.http.put(`${environment.API_URL}/permissions/${userId}`, { permissions });
  }
}
