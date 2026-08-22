import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzMessageService } from 'ng-zorro-antd/message';
import { WorkOrderService, BackofficeWorkbenchItemDto, IngestSiebelResultDto } from '../../core/services/work-order.service';

export interface WorkOrderGroup {
  orderHeaderId: string;
  clientNumber: string;
  vendedorRequestId?: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  branchName?: string;
  items: BackofficeWorkbenchItemDto[];
  totalDecos: number;
  matchedClientName?: string;
  vendedorName?: string;
  dispatchType?: string;
  internalStatus: string;
  globalSiebelStatus: string;
  isMatched: boolean;
  requiresContingency: boolean;
  isExternalScheduling: boolean;
}

@Component({
  selector: 'app-backoffice-workbench',
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
    NzDrawerModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzAlertModule,
    NzDropDownModule,
    NzDatePickerModule,
    NzTimelineModule,
  ],
  templateUrl: './backoffice-workbench.html',
})
export class BackofficeWorkbenchComponent implements OnInit {
  private workOrderService = inject(WorkOrderService);
  private message = inject(NzMessageService);

  workbenchItems = signal<BackofficeWorkbenchItemDto[]>([]);
  technicians = signal<any[]>([]);
  loading = signal<boolean>(false);

  // Filters
  searchTerm: string = '';
  statusFilter: string = 'All';
  branchFilter: string = 'All';

  // Ingest Modal State
  ingestModalVisible = signal<boolean>(false);
  ingesting = signal<boolean>(false);
  selectedSiebelFile = signal<File | null>(null);
  ingestResult = signal<IngestSiebelResultDto | null>(null);

  // Assign Modal State
  assignModalVisible = signal<boolean>(false);
  assigning = signal<boolean>(false);
  selectedGroup = signal<WorkOrderGroup | null>(null);
  selectedTechnicianId: string | null = null;

  // Drawer Lateral "Ver Detalle" State
  drawerVisible = signal<boolean>(false);
  selectedGroupForDrawer = signal<WorkOrderGroup | null>(null);

  // Operational Action Modals (Agendar, Observar, Rechazar, Completar, Historial)
  actionModalType = signal<'Schedule' | 'Observe' | 'Reject' | 'Complete' | 'History' | null>(null);
  actionModalVisible = signal<boolean>(false);
  actionLoading = signal<boolean>(false);

  // Action Form Inputs
  scheduledDate: Date | null = null;
  scheduledSlot: string = 'MAÑANA (08:00 - 13:00)';
  actionNotes: string = '';

  // Interacciones ficticias/demostrativas del historial
  mockHistory = signal<any[]>([]);

  ngOnInit(): void {
    this.loadWorkbench();
    this.loadTechnicians();
  }

  loadWorkbench(): void {
    this.loading.set(true);
    this.workOrderService.getBackofficeWorkbench({
      searchTerm: this.searchTerm,
      statusFilter: this.statusFilter
    }).subscribe({
      next: (data) => {
        this.workbenchItems.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.message.error('Error al cargar la bandeja operativa del Backoffice.');
        this.loading.set(false);
      }
    });
  }

  loadTechnicians(): void {
    this.workOrderService.getTechniciansByBranch().subscribe({
      next: (data) => this.technicians.set(data),
      error: () => console.warn('No se pudieron cargar los técnicos')
    });
  }

  // --- Agrupación Inteligente por Encabezado de Orden + Solicitud + Técnico + Cliente ---
  groupedWorkbenchItems = computed(() => {
    let rawItems = this.workbenchItems();

    // Aplicar filtro de Sede
    if (this.branchFilter !== 'All') {
      rawItems = rawItems.filter(i => i.branchName && i.branchName.toLowerCase().includes(this.branchFilter.toLowerCase()));
    }

    const groupsMap = new Map<string, WorkOrderGroup>();

    for (const item of rawItems) {
      // Clave de agrupación: N° Orden + ID Solicitud Vendedor + Técnico Asignado + Cliente Matriz
      const orderKey = item.orderHeaderId || item.woNumber;
      const vendedorReqKey = item.vendedorRequestId || 'NO_VENDEDOR_REQ';
      const techKey = item.assignedTechnicianId || 'UNASSIGNED';
      const clientKey = item.clientNumber || 'NO_CLIENT';
      const groupKey = `${orderKey}_${vendedorReqKey}_${techKey}_${clientKey}`;

      if (!groupsMap.has(groupKey)) {
        groupsMap.set(groupKey, {
          orderHeaderId: orderKey,
          clientNumber: item.clientNumber,
          vendedorRequestId: item.vendedorRequestId,
          assignedTechnicianId: item.assignedTechnicianId,
          assignedTechnicianName: item.assignedTechnicianName,
          branchName: item.branchName,
          items: [],
          totalDecos: 0,
          matchedClientName: item.realClientName,
          vendedorName: item.vendedorName,
          dispatchType: item.dispatchType,
          internalStatus: item.internalStatus || 'SinSolicitudVendedor',
          globalSiebelStatus: item.siebelStatus || 'Abierta',
          isMatched: item.isMatched,
          requiresContingency: false,
          isExternalScheduling: false
        });
      }

      const group = groupsMap.get(groupKey)!;
      group.items.push(item);
      group.totalDecos++;

      if (item.isMatched) {
        group.isMatched = true;
        group.matchedClientName = item.realClientName;
        group.vendedorName = item.vendedorName;
        group.dispatchType = item.dispatchType || group.dispatchType;
        group.internalStatus = item.internalStatus || group.internalStatus;
      }
      if (item.requiresContingencyDischarge) {
        group.requiresContingency = true;
      }
      if (item.isExternalScheduling) {
        group.isExternalScheduling = true;
      }
    }

    return Array.from(groupsMap.values());
  });

  // Sedes disponibles para el filtro
  availableBranches = computed(() => {
    const branches = new Set<string>();
    for (const item of this.workbenchItems()) {
      if (item.branchName) branches.add(item.branchName);
    }
    return Array.from(branches);
  });

  // --- Drawer Lateral "Ver Detalle" ---
  openDetailDrawer(group: WorkOrderGroup): void {
    this.selectedGroupForDrawer.set(group);
    this.loadHistoryForGroup(group);
    this.drawerVisible.set(true);
  }

  closeDetailDrawer(): void {
    this.drawerVisible.set(false);
    this.selectedGroupForDrawer.set(null);
  }

  // --- Ingesta SIEBEL ---
  openIngestModal(): void {
    this.selectedSiebelFile.set(null);
    this.ingestResult.set(null);
    this.ingestModalVisible.set(true);
  }

  handleIngestCancel(): void {
    this.ingestModalVisible.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedSiebelFile.set(input.files[0]);
      this.ingestResult.set(null);
    }
  }

  executeSiebelIngest(): void {
    const file = this.selectedSiebelFile();
    if (!file) {
      this.message.warning('Por favor selecciona un archivo Excel de SIEBEL.');
      return;
    }

    this.ingesting.set(true);
    this.workOrderService.ingestSiebelExcel(file).subscribe({
      next: (res) => {
        this.ingestResult.set(res);
        this.ingesting.set(false);
        this.message.success(`Ingesta completada: ${res.insertedCount} nuevos, ${res.autoMatchedCount} vinculados con solicitudes.`);
        this.loadWorkbench();
      },
      error: (err) => {
        this.ingesting.set(false);
        this.message.error(err?.error?.detail || err?.error || 'Error al procesar la ingesta de SIEBEL.');
      }
    });
  }

  // --- Asignar Técnico Real Interno ---
  openAssignModalForGroup(group: WorkOrderGroup): void {
    this.selectedGroup.set(group);
    this.selectedTechnicianId = group.assignedTechnicianId || null;
    this.assignModalVisible.set(true);
  }

  handleAssignCancel(): void {
    this.assignModalVisible.set(false);
  }

  executeAssign(): void {
    const group = this.selectedGroup();
    if (!group || !this.selectedTechnicianId) {
      this.message.warning('Por favor selecciona un técnico real interno.');
      return;
    }

    const firstItem = group.items[0];

    this.assigning.set(true);
    this.workOrderService.assignTechnician({
      vendedorRequestId: firstItem.vendedorRequestId,
      siebelWorkOrderId: firstItem.siebelWorkOrderId,
      technicianUserId: this.selectedTechnicianId
    }).subscribe({
      next: () => {
        this.message.success('Técnico interno asignado correctamente.');
        this.assignModalVisible.set(false);
        this.assigning.set(false);
        this.loadWorkbench();
      },
      error: () => {
        this.message.error('Ocurrió un error al asignar el técnico.');
        this.assigning.set(false);
      }
    });
  }

  // --- Modales de Acciones Operativas (Agendar, Observar, Rechazar, Completar, Historial) ---
  openActionModalForGroup(type: 'Schedule' | 'Observe' | 'Reject' | 'Complete' | 'History', group: WorkOrderGroup): void {
    this.selectedGroup.set(group);
    this.actionModalType.set(type);
    this.actionNotes = '';
    this.scheduledDate = new Date();

    if (type === 'History') {
      this.loadHistoryForGroup(group);
    }

    this.actionModalVisible.set(true);
  }

  handleActionCancel(): void {
    this.actionModalVisible.set(false);
    this.actionModalType.set(null);
  }

  executeAction(): void {
    const type = this.actionModalType();
    const group = this.selectedGroup();
    if (!group) return;

    if (type === 'Schedule') {
      if (!this.scheduledDate) {
        this.message.warning('Selecciona una fecha de agendamiento.');
        return;
      }
      group.internalStatus = 'InProgress';
      this.message.success(`Estado Interno actualizado a [Agendada] para el ${this.scheduledDate.toLocaleDateString()} (${this.scheduledSlot}). (Nota: El Estado SIEBEL permanece intacto).`);
      this.actionModalVisible.set(false);
    } else if (type === 'Observe') {
      if (!this.actionNotes) {
        this.message.warning('Ingresa el motivo de la observación.');
        return;
      }
      group.internalStatus = 'Observed';
      this.message.info(`Estado Interno actualizado a [Observada]. Motivo registrado.`);
      this.actionModalVisible.set(false);
    } else if (type === 'Reject') {
      if (!this.actionNotes) {
        this.message.warning('Ingresa el motivo de rechazo.');
        return;
      }
      group.internalStatus = 'Cancelled';
      this.message.warning(`Estado Interno actualizado a [Rechazada].`);
      this.actionModalVisible.set(false);
    } else if (type === 'Complete') {
      group.internalStatus = 'Completed';
      this.message.success(`Estado Interno actualizado a [Finalizada Operativamente].`);
      this.actionModalVisible.set(false);
    }
  }

  private loadHistoryForGroup(group: WorkOrderGroup): void {
    this.mockHistory.set([
      { date: new Date(), user: 'Backoffice (Admin)', action: 'Registro / Ingesta SIEBEL', details: `N° Orden Header: ${group.orderHeaderId} | Sede: ${group.branchName || 'ANCASH'}` },
      { date: new Date(Date.now() - 3600000), user: group.vendedorName || 'Vendedor', action: 'Solicitud Vendedor', details: `Cliente Real: ${group.matchedClientName || 'Asignado'}` },
      { date: new Date(Date.now() - 7200000), user: 'Sistema', action: 'Vínculo Multi-Deco', details: `Cruce automático de ${group.totalDecos} WOs por Código de Cliente e IBS.` }
    ]);
  }

  // Label amigable para el Estado Interno SKVIA
  getInternalStatusLabel(status: string): string {
    switch (status) {
      case 'PendingSiebelMatch': return '⏳ Pendiente Cruce SIEBEL';
      case 'Matched': return '🟢 Vinculada (Pend. Agendar)';
      case 'Assigned': return '👤 Técnico Asignado';
      case 'InProgress': return '🗓️ Visita Agendada';
      case 'Observed': return '⚠️ Observada';
      case 'Completed': return '✅ Cierre Operacional';
      case 'Cancelled': return '❌ Rechazada';
      case 'SinSolicitudVendedor': return '⚪ Venta Estándar';
      default: return status || 'Pendiente';
    }
  }

  getInternalStatusColor(status: string): string {
    switch (status) {
      case 'PendingSiebelMatch': return 'warning';
      case 'Matched': return 'processing';
      case 'Assigned': return 'blue';
      case 'InProgress': return 'cyan';
      case 'Observed': return 'orange';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  }

  getDispatchTypeLabel(type?: string): string {
    if (!type) return 'Domicilio';
    if (type === 'PlanVecino') return '🏡 Plan Vecino';
    if (type === 'EnvioEncomienda') return '📦 Encomienda';
    return '🏠 Domicilio Titular';
  }

  // Métricas
  get totalCount(): number { return this.workbenchItems().length; }
  get matchedCount(): number { return this.workbenchItems().filter(x => x.isMatched).length; }
  get contingencyAlertCount(): number { return this.workbenchItems().filter(x => x.requiresContingencyDischarge).length; }
}
