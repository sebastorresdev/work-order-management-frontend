import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WorkOrder,
  WorkOrderDetail,
  CreateWorkOrderPayload,
  ScheduleWorkOrderPayload,
  ReasonPayload,
  CompleteWorkOrderPayload,
  WorkOrderStatus,
  WorkOrderType
} from '../models/work-order.types';

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/work-orders`;

  getWorkOrders(params?: {
    pageNumber?: number;
    pageSize?: number;
    searchTerm?: string;
    status?: WorkOrderStatus;
    requestType?: WorkOrderType;
    branchId?: string;
  }): Observable<PaginatedResponse<WorkOrder>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber);
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize);
    if (params?.searchTerm) httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.requestType) httpParams = httpParams.set('requestType', params.requestType);
    if (params?.branchId) httpParams = httpParams.set('branchId', params.branchId);

    return this.http.get<PaginatedResponse<WorkOrder>>(this.apiUrl, { params: httpParams });
  }

  getWorkOrderById(id: string): Observable<WorkOrderDetail> {
    return this.http.get<WorkOrderDetail>(`${this.apiUrl}/${id}`);
  }

  createWorkOrder(payload: CreateWorkOrderPayload): Observable<WorkOrder> {
    return this.http.post<WorkOrder>(this.apiUrl, payload);
  }

  updateWorkOrder(id: string, payload: CreateWorkOrderPayload): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  scheduleWorkOrder(id: string, payload: ScheduleWorkOrderPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/schedule`, payload);
  }

  observeWorkOrder(id: string, payload: ReasonPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/observe`, payload);
  }

  rejectWorkOrder(id: string, payload: ReasonPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/reject`, payload);
  }

  completeWorkOrder(id: string, payload: CompleteWorkOrderPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/complete`, payload);
  }

  cancelWorkOrder(id: string, payload: ReasonPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/cancel`, payload);
  }

  resolveObservation(id: string, resolutionNotes: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/resolve-observation`, { resolutionNotes });
  }

  getTechniciansByBranch(branchId?: string): Observable<any[]> {
    let params = new HttpParams();
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<any[]>(`${environment.API_URL}/users/technicians`, { params });
  }
}
