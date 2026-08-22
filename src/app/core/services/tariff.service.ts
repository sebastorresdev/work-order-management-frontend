import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ServiceTariffDto {
  id?: string;
  code: string;
  tipificacion: string;
  serviceDetail: string;
  points: number;
  baseAmount: number;
  baseAdicionalAmount: number;
  variableAmount: number;
  cycleTimeAmount: number;
  cumplimientoAgendaAmount: number;
  sin30Amount: number;
  variableAdicionalAmount: number;
  cycleTimeAdicionalAmount: number;
  cumplimientoAgendaAdicionalAmount: number;
  sin30AdicionalAmount: number;
  appliesPayment: boolean;
  appliesWarranty: boolean;
  isArchived?: boolean;
}

export interface ImportTariffsResultDto {
  totalProcessed: number;
  insertedCount: number;
  updatedCount: number;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TariffService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.API_URL}/tariffs`;

  getTariffs(): Observable<ServiceTariffDto[]> {
    return this.http.get<ServiceTariffDto[]>(this.apiUrl);
  }

  upsertTariff(tariff: ServiceTariffDto): Observable<string> {
    return this.http.post<string>(this.apiUrl, tariff);
  }

  seedTariffs(): Observable<number> {
    return this.http.post<number>(`${this.apiUrl}/seed`, {});
  }

  importTariffsFromExcel(file: File): Observable<ImportTariffsResultDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportTariffsResultDto>(`${this.apiUrl}/import`, formData);
  }
}

