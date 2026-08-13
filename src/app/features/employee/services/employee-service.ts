import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { EmployeeResponse } from '../models/employee-response';
import { CreateEmployeeRequest } from '../models/create-employee-request';
import { UpdateEmployeeRequest } from '../models/update-employee-request';

/**
 * Servicio Angular para la integración con la API REST del módulo de empleados.
 */
@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  /**
   * Cliente HTTP inyectado.
   */
  private _http = inject(HttpClient);

  /**
   * URL base para los endpoints de empleados.
   */
  private readonly _base = `${environment.API_URL}/employees`;

  /**
   * Obtiene la lista completa de empleados.
   * @returns Observable con el arreglo de respuestas de empleados.
   */
  getAll(): Observable<EmployeeResponse[]> {
    return this._http.get<EmployeeResponse[]>(this._base);
  }

  /**
   * Obtiene los datos detallados de un empleado específico por su ID.
   * @param id Identificador único del empleado.
   * @returns Observable con los detalles del empleado.
   */
  getById(id: string): Observable<EmployeeResponse> {
    return this._http.get<EmployeeResponse>(`${this._base}/${id}`);
  }

  /**
   * Crea un nuevo registro de empleado.
   * @param request Datos del empleado a crear.
   * @returns Observable con la respuesta del servidor.
   */
  create(request: CreateEmployeeRequest): Observable<any> {
    return this._http.post<any>(this._base, request);
  }

  /**
   * Actualiza un empleado existente.
   * @param id Identificador del empleado.
   * @param request Datos actualizados.
   * @returns Observable con la respuesta de la actualización.
   */
  update(id: string, request: UpdateEmployeeRequest): Observable<any> {
    return this._http.put<any>(`${this._base}/${id}`, request);
  }

  /**
   * Elimina o archiva a un empleado por su ID.
   * @param id Identificador del empleado.
   * @returns Observable completado tras la eliminación.
   */
  delete(id: string): Observable<void> {
    return this._http.delete<void>(`${this._base}/${id}`);
  }
}
