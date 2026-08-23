import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { BranchService } from '../branch/services/branch-service';
import { WorkOrderService, VendedorRequestDto, CreateVendedorRequestPayload } from '../../core/services/work-order.service';

@Component({
  selector: 'app-vendedor-request-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
  ],

  templateUrl: './vendedor-request-list.html',
})
export class VendedorRequestListComponent implements OnInit {
  private workOrderService = inject(WorkOrderService);
  private branchService = inject(BranchService);
  private message = inject(NzMessageService);

  requests = signal<VendedorRequestDto[]>([]);
  branches = signal<any[]>([]);
  loading = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  saving = signal<boolean>(false);

  newRequest: CreateVendedorRequestPayload = this.getEmptyPayload();

  ngOnInit(): void {
    this.loadRequests();
    this.loadBranches();
  }

  loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (list: any) => {
        const branchesList = list?.data || list?.items || list || [];
        this.branches.set(branchesList);
        if (branchesList.length > 0 && !this.newRequest.branchId) {
          this.newRequest.branchId = branchesList[0].id;
        }
      }
    });
  }

  loadRequests(): void {
    this.loading.set(true);
    this.workOrderService.getVendedorRequests().subscribe({
      next: (data) => {
        this.requests.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Error al cargar las solicitudes del vendedor.');
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    this.newRequest = this.getEmptyPayload();
    if (this.branches().length > 0) {
      this.newRequest.branchId = this.branches()[0].id;
    }
    this.modalVisible.set(true);
  }

  handleCancel(): void {
    this.modalVisible.set(false);
  }

  saveRequest(): void {
    if (!this.newRequest.clientNumber || !this.newRequest.realClientName || !this.newRequest.realInstallationAddress || !this.newRequest.branchId) {
      this.message.warning('Por favor completa el Nº de Cliente DIRECTV, Sede Operativa de Atención, Nombre de Cliente y Dirección.');
      return;
    }

    this.newRequest.isPlanVecino = this.newRequest.dispatchType === 'PlanVecino';

    this.saving.set(true);
    this.workOrderService.createVendedorRequest(this.newRequest).subscribe({
      next: () => {
        this.message.success('Solicitud registrada correctamente. El sistema ejecutó el cruce de datos.');
        this.modalVisible.set(false);
        this.saving.set(false);
        this.loadRequests();
      },
      error: (err) => {
        this.message.error(err?.error?.detail || 'Ocurrió un error al guardar la solicitud.');
        this.saving.set(false);
      }
    });
  }

  getStatusTagColor(status: string): string {
    switch (status) {
      case 'PendingSiebelMatch': return 'warning';
      case 'Matched': return 'processing';
      case 'Assigned': return 'blue';
      case 'InProgress': return 'cyan';
      case 'PendingMaterialDischarge': return 'orange';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PendingSiebelMatch': return '⏳ Pendiente Cruce SIEBEL';
      case 'Matched': return '🟢 Vinculada SIEBEL';
      case 'Assigned': return '👤 Asignado a Técnico';
      case 'InProgress': return '🛠️ En Atención';
      case 'PendingMaterialDischarge': return '📦 Pend. Liquidación Almacén';
      case 'Completed': return '✅ Finalizada Operativamente';
      case 'Cancelled': return '❌ Cancelada';
      default: return status;
    }
  }

  getDispatchTypeLabel(type: string, isPlanVecino: boolean): string {
    if (type === 'EnvioEncomienda') return '📦 Envió por Encomienda';
    if (type === 'PlanVecino' || isPlanVecino) return '🏘️ Plan Vecino';
    return '🏠 Domicilio Titular';
  }

  getDispatchTypeColor(type: string, isPlanVecino: boolean): string {
    if (type === 'EnvioEncomienda') return 'gold';
    if (type === 'PlanVecino' || isPlanVecino) return 'purple';
    return 'blue';
  }

  private getEmptyPayload(): CreateVendedorRequestPayload {
    return {
      clientNumber: '',
      serviceCode: 'IB01',
      realClientName: '',
      realClientDocument: '',
      realClientPhone: '',
      realInstallationAddress: '',
      realDistrict: '',
      realProvince: 'TRUJILLO',
      notes: '',
      isPlanVecino: false,
      dispatchType: 'InstalacionDomicilio',
      decoderCount: 1
    };

  }
}

