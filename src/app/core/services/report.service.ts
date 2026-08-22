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

export interface MonthlyKpiSetting {
  id?: string;
  year: number;
  month: number;
  variableMet: boolean;
  cycleTimeMet: boolean;
  cumplimientoAgendaMet: boolean;
  sin30Met: boolean;
  appliesAdicional: boolean;
}

export interface TechnicianSettlementSummary {
  technicianName: string;
  totalOrders: number;
  payableOrders: number;
  nonPayableOrders: number;
  totalPoints: number;
  totalBasePay: number;
  totalVariablePay: number;
  totalAmount: number;
}

export interface StagingWorkOrderDto {
  id: string;
  rawWo: string;
  normalizedWo: string;
  technicianName: string;
  serviceCode: string;
  serviceDescription: string;
  statusDirectv: string;
  isPayable: boolean;
  points: number;
  basePay: number;
  variablePay: number;
  totalPay: number;
  matchNotes: string;
}

export interface SettlementReportResult {
  batchId: string;
  batchName: string;
  year: number;
  month: number;
  totalWorkOrders: number;
  payableWorkOrders: number;
  nonPayableWorkOrders: number;
  totalAmount: number;
  techniciansSummary: TechnicianSettlementSummary[];
  workOrdersDetail: StagingWorkOrderDto[];
}

export interface ReportBatchSummary {
  id: string;
  name: string;
  year: number;
  month: number;
  file1Name: string;
  file2Name: string;
  totalWorkOrders: number;
  payableWorkOrders: number;
  nonPayableWorkOrders: number;
  totalAmount: number;
  status: string;
  created: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/reports`;

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

    return this.http.get(`${this.apiUrl}/export`, { params, responseType: 'blob' });
  }

  getMonthlyKpis(year: number, month: number): Observable<MonthlyKpiSetting> {
    return this.http.get<MonthlyKpiSetting>(`${this.apiUrl}/kpis?year=${year}&month=${month}`);
  }

  setMonthlyKpis(kpi: MonthlyKpiSetting): Observable<MonthlyKpiSetting> {
    return this.http.post<MonthlyKpiSetting>(`${this.apiUrl}/kpis`, kpi);
  }

  processDualExcel(year: number, month: number, batchName: string, file1: File, file2: File): Observable<SettlementReportResult> {
    const formData = new FormData();
    formData.append('year', year.toString());
    formData.append('month', month.toString());
    formData.append('batchName', batchName);
    formData.append('file1', file1, file1.name);
    formData.append('file2', file2, file2.name);

    return this.http.post<SettlementReportResult>(`${this.apiUrl}/settlement/process`, formData);
  }

  getSettlementBatches(): Observable<ReportBatchSummary[]> {
    return this.http.get<ReportBatchSummary[]>(`${this.apiUrl}/settlement/batches`);
  }

  exportSettlementExcel(batchId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/settlement/export/${batchId}`, { responseType: 'blob' });
  }
}
