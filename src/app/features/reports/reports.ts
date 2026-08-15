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
import { NzMessageService } from 'ng-zorro-antd/message';
import { ReportService, DashboardReportResponse, ReportFilters } from '../../core/services/report.service';
import { BranchService } from '../branch/services/branch-service';
import { BranchResponse } from '../branch/models/branch-response';

/**
 * Componente principal para la pantalla de Reportes y Analítica de Gestión.
 */
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
  ],
  templateUrl: './reports.html',
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);

  // Estados reactivos (Signals)
  loading = signal<boolean>(false);
  exporting = signal<boolean>(false);
  data = signal<DashboardReportResponse | null>(null);
  branches = signal<BranchResponse[]>([]);

  // Filtros de búsqueda
  startDate: Date | null = null;
  endDate: Date | null = null;
  selectedBranchId: string | null = null;
  selectedRequestType: number | null = null;

  ngOnInit(): void {
    // Establecer rango por defecto (Primer día del mes actual hasta hoy)
    const now = new Date();
    this.startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    this.endDate = now;

    this.loadBranches();
    this.loadReport();
  }

  loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (list: BranchResponse[]) => this.branches.set(list),
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
      error: (err) => {
        console.error(err);
        this.message.error('Error al cargar los datos del reporte.');
        this.loading.set(false);
      }
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
      error: (err) => {
        console.error(err);
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
      case 'Cancelado': return 'default';
      default: return 'processing';
    }
  }
}
