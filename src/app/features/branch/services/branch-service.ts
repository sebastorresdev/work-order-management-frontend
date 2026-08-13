import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { BranchResponse } from '../models/branch-response';
import { CreateBranchRequest } from '../models/create-branch-request';
import { UpdateBranchRequest } from '../models/update-branch-request';
import { DeleteBranchesRequest } from '../models/delete-branches-request';
import { Observable } from 'rxjs';

/**
 * Servicio Angular para el consumo de los endpoints REST del módulo de sedes/sucursales.
 */
@Injectable({
  providedIn: 'root',
})
export class BranchService {
  /**
   * Cliente HTTP inyectado.
   */
  private _http = inject(HttpClient);

  /**
   * URL base del endpoint de sedes.
   */
  private _base = `${environment.API_URL}/branches`;

  /**
   * Obtiene la lista completa de sedes registradas.
   * @returns Observable con el arreglo de respuestas de sedes.
   */
  getAll(): Observable<BranchResponse[]> {
    return this._http.get<BranchResponse[]>(this._base);
  }

  /**
   * Obtiene la información detallada de una sede por su ID.
   * @param id Identificador único de la sede.
   * @returns Observable con los datos de la sede.
   */
  getById(id: string): Observable<BranchResponse> {
    return this._http.get<BranchResponse>(`${this._base}/${id}`);
  }

  /**
   * Registra una nueva sede en el sistema.
   * @param request Datos para la creación de la sede.
   * @returns Observable con el ID generado.
   */
  create(request: CreateBranchRequest): Observable<string> {
    return this._http.post<string>(this._base, request);
  }

  /**
   * Actualiza los datos de una sede existente.
   * @param id Identificador de la sede.
   * @param request Datos actualizados.
   * @returns Observable completado al finalizar la actualización.
   */
  update(id: string, request: UpdateBranchRequest): Observable<void> {
    return this._http.put<void>(`${this._base}/${id}`, request);
  }

  /**
   * Elimina o archiva una sede específica.
   * @param id Identificador de la sede a eliminar.
   * @returns Observable completado tras la eliminación.
   */
  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }

  /**
   * Elimina o archiva múltiples sedes seleccionadas en lote.
   * @param request Objeto con la lista de IDs a eliminar.
   * @returns Observable completado tras la operación.
   */
  deleteSelected(request: DeleteBranchesRequest): Observable<void> {
    return this._http.post<void>(`${this._base}/delete`, request);
  }
}
