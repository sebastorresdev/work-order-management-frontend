import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DashboardKpis {
  totalWorkOrders: number;
  pendingCount: number;
  observedCount: number;
  scheduledCount: number;
  completedCount: number;
  rejectedCount: number;
  cancelledCount: number;
  completionRatePercentage: number;
  observationRatePercentage: number;
  averageResolutionDays: number;
}

export interface StatusDistributionItem {
  statusName: string;
  count: number;
  percentage: number;
}

export interface BranchPerformanceItem {
  branchId: string;
  branchName: string;
  totalWorkOrders: number;
  completedCount: number;
  observedCount: number;
  scheduledCount: number;
  completionRatePercentage: number;
}

export interface TypeDistributionItem {
  typeName: string;
  count: number;
  percentage: number;
}

export interface UserProductivityItem {
  userId: string;
  userName: string;
  roleName: string;
  workOrdersCount: number;
  completedCount: number;
  observedCount: number;
}

export interface DashboardReportResponse {
  kpis: DashboardKpis;
  statusDistribution: StatusDistributionItem[];
  branchPerformance: BranchPerformanceItem[];
  typeDistribution: TypeDistributionItem[];
  topCreators: UserProductivityItem[];
  topTechnicians: UserProductivityItem[];
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  branchId?: string;
  requestType?: number;
  status?: number;
}

/**
 * Servicio Angular para la consulta de datos analíticos y la exportación de reportes de órdenes de trabajo.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/reports`;

  /**
   * Obtiene las métricas consolidadas de KPI y distribuciones estadísticas para el Dashboard.
   */
  getDashboardReport(filters: ReportFilters): Observable<DashboardReportResponse> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    if (filters.requestType !== undefined && filters.requestType !== null) {
      params = params.set('requestType', filters.requestType.toString());
    }

    return this.http.get<DashboardReportResponse>(`${this.apiUrl}/dashboard`, { params });
  }

  /**
   * Descarga el archivo de reporte procesado en formato CSV/Excel.
   */
  exportWorkOrders(filters: ReportFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    if (filters.requestType !== undefined && filters.requestType !== null) {
      params = params.set('requestType', filters.requestType.toString());
    }
    if (filters.status !== undefined && filters.status !== null) {
      params = params.set('status', filters.status.toString());
    }

    return this.http.get(`${this.apiUrl}/export`, {
      params,
      responseType: 'blob'
    });
  }
}
