import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import {
  ReportService,
  DashboardReportResponse,
  ReportFilters,
  MonthlyKpiSetting,
  SettlementReportResult,
  ReportBatchSummary
} from '../../core/services/report.service';
import { BranchService } from '../branch/services/branch-service';
import { BranchResponse } from '../branch/models/branch-response';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzDatePickerModule,
    NzSelectModule,
    NzIconModule,
    NzProgressModule,
    NzTableModule,
    NzTagModule,
    NzTooltipModule,
    NzSpinModule,
    NzTabsModule,
    NzSwitchModule,
    NzInputModule,
  ],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);

  // Tab activo (0: Dashboard, 1: Liquidación de Técnicos, 2: Historial de Lotes)
  selectedTabIndex = 0;

  // Estados Dashboard
  loading = signal<boolean>(false);
  exporting = signal<boolean>(false);
  data = signal<DashboardReportResponse | null>(null);
  branches = signal<BranchResponse[]>([]);

  // Filtros Dashboard
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedBranchId: string | null = null;
  selectedRequestType: number | null = null;

  // Estados Módulo de Liquidación
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;
  batchName = '';

  kpiSetting: MonthlyKpiSetting = {
    year: this.selectedYear,
    month: this.selectedMonth,
    variableMet: true,
    cycleTimeMet: true,
    cumplimientoAgendaMet: true,
    sin30Met: true,
    appliesAdicional: false
  };

  file1: File | null = null;
  file2: File | null = null;

  processingSettlement = signal<boolean>(false);
  savingKpis = signal<boolean>(false);
  settlementResult = signal<SettlementReportResult | null>(null);
  pastBatches = signal<ReportBatchSummary[]>([]);
  loadingBatches = signal<boolean>(false);

  monthsList = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  ngOnInit(): void {
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = now;

    this.loadBranches();
    this.loadReport();
    this.loadMonthlyKpis();
    this.loadPastBatches();
  }

  loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (list) => this.branches.set(list),
      error: () => this.message.error('No se pudieron cargar las sedes.')
    });
  }

  loadReport(): void {
    this.loading.set(true);
    const filters: ReportFilters = {
      startDate: this.startDate ? this.startDate.toISOString() : undefined,
      endDate: this.endDate ? this.endDate.toISOString() : undefined,
      branchId: this.selectedBranchId || undefined,
      requestType: this.selectedRequestType !== null ? this.selectedRequestType : undefined,
    };

    this.reportService.getDashboardReport(filters).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Error al cargar los datos del dashboard.');
        this.loading.set(false);
      }
    });
  }

  loadMonthlyKpis(): void {
    this.reportService.getMonthlyKpis(this.selectedYear, this.selectedMonth).subscribe({
      next: (setting) => {
        this.kpiSetting = {
          ...setting,
          year: this.selectedYear,
          month: this.selectedMonth
        };
      }
    });
  }

  saveMonthlyKpis(): void {
    this.savingKpis.set(true);
    this.kpiSetting.year = this.selectedYear;
    this.kpiSetting.month = this.selectedMonth;

    this.reportService.setMonthlyKpis(this.kpiSetting).subscribe({
      next: (res) => {
        this.kpiSetting = res;
        this.savingKpis.set(false);
        this.message.success('Indicadores del mes guardados correctamente.');
      },
      error: () => {
        this.savingKpis.set(false);
        this.message.error('Ocurrió un error al guardar los indicadores.');
      }
    });
  }

  onFile1Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file1 = input.files[0];
    }
  }

  onFile2Selected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.file2 = input.files[0];
    }
  }

  processSettlement(): void {
    if (!this.file1) {
      this.message.warning('Debes cargar el Archivo 1 (Producción Directv).');
      return;
    }
    if (!this.file2) {
      this.message.warning('Debes cargar el Archivo 2 (Control Interno de Técnicos).');
      return;
    }

    this.processingSettlement.set(true);
    const bName = this.batchName.trim() || `Liquidación ${this.selectedMonth}/${this.selectedYear}`;

    this.reportService.processDualExcel(this.selectedYear, this.selectedMonth, bName, this.file1, this.file2).subscribe({
      next: (res) => {
        this.settlementResult.set(res);
        this.processingSettlement.set(false);
        this.message.success(`Liquidación procesada con éxito: ${res.totalWorkOrders} WOs cruzadas.`);
        this.loadPastBatches();
      },
      error: (err) => {
        console.error(err);
        this.message.error('Ocurrió un error al procesar el reporte de liquidación.');
        this.processingSettlement.set(false);
      }
    });
  }

  exportSettlementExcel(batchId?: string): void {
    const targetId = batchId || this.settlementResult()?.batchId;
    if (!targetId) return;

    this.reportService.exportSettlementExcel(targetId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Liquidacion_Tecnicos_${this.selectedYear}_${this.selectedMonth}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.message.success('Archivo Excel (.xlsx) descargado exitosamente.');
      },
      error: () => this.message.error('Error al descargar el archivo Excel.')
    });
  }

  loadPastBatches(): void {
    this.loadingBatches.set(true);
    this.reportService.getSettlementBatches().subscribe({
      next: (list) => {
        this.pastBatches.set(list);
        this.loadingBatches.set(false);
      },
      error: () => this.loadingBatches.set(false)
    });
  }

  exportReport(): void {
    this.exporting.set(true);
    const filters: ReportFilters = {
      startDate: this.startDate ? this.startDate.toISOString() : undefined,
      endDate: this.endDate ? this.endDate.toISOString() : undefined,
      branchId: this.selectedBranchId || undefined,
      requestType: this.selectedRequestType !== null ? this.selectedRequestType : undefined,
    };

    this.reportService.exportWorkOrders(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Ordenes_Trabajo_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exporting.set(false);
        this.message.success('Reporte exportado exitosamente.');
      },
      error: () => {
        this.message.error('Ocurrió un error al exportar el reporte.');
        this.exporting.set(false);
      }
    });
  }

  resetFilters(): void {
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = now;
    this.selectedBranchId = null;
    this.selectedRequestType = null;
    this.loadReport();
  }

  getStatusColor(statusName: string): string {
    switch (statusName) {
      case 'Pendiente': return 'blue';
      case 'Observado': return 'warning';
      case 'Agendado': return 'cyan';
      case 'Completado': return 'success';
      case 'Rechazado': return 'error';
      default: return 'processing';
    }
  }
}
