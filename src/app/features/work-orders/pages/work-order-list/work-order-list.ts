import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

// NG-ZORRO Modules
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { WorkOrderService } from '../../../../core/services/work-order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchService } from '../../../branch/services/branch-service';
import { UserService } from '../../../user/services/user-service';
import { PERMISSIONS as APP_PERMISSIONS } from '../../../../core/constants/permissions';
import {
  WorkOrder,
  WorkOrderDetail,
  WorkOrderStatus,
  WorkOrderType,
  WorkOrderPriority,
  CreateWorkOrderPayload,
  ScheduleWorkOrderPayload
} from '../../../../core/models/work-order.types';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NzTableModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzTagModule,
    NzIconModule,
    NzModalModule,
    NzDrawerModule,
    NzFormModule,
    NzDatePickerModule,
    NzTimelineModule,
    NzCardModule,
    NzTooltipModule,
    NzPopconfirmModule,
    NzTabsModule,
    NzBadgeModule,
    NzSpinModule
  ],
  templateUrl: './work-order-list.html',
})
export class WorkOrderList implements OnInit {
  private workOrderService = inject(WorkOrderService);
  public auth = inject(AuthService);
  private branchService = inject(BranchService);
  private userService = inject(UserService);
  private message = inject(NzMessageService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Enums for Template
  WorkOrderStatus = WorkOrderStatus;
  WorkOrderType = WorkOrderType;
  WorkOrderPriority = WorkOrderPriority;
  readonly PERMISSIONS = APP_PERMISSIONS;

  // Signals / State
  loading = signal<boolean>(false);
  workOrders = signal<WorkOrder[]>([]);
  totalCount = signal<number>(0);
  pageNumber = signal<number>(1);
  pageSize = signal<number>(10);

  // Filters
  searchTerm = signal<string>('');
  selectedStatus = signal<WorkOrderStatus | undefined>(undefined);
  selectedRequestType = signal<WorkOrderType | undefined>(undefined);
  selectedBranchId = signal<string | undefined>(undefined);

  // Dropdown Data
  branches = signal<any[]>([]);
  technicians = signal<any[]>([]);

  // Modals & Drawers
  isCreateModalVisible = false;
  isScheduleModalVisible = false;
  isReasonModalVisible = false;
  isResolveModalVisible = false;
  isDetailDrawerVisible = false;

  modalTitle = 'Nueva Solicitud';
  editingWorkOrderId: string | null = null;
  selectedWorkOrder: WorkOrder | null = null;
  workOrderDetail = signal<WorkOrderDetail | null>(null);

  reasonAction: 'observe' | 'reject' | 'cancel' = 'observe';
  reasonModalTitle = 'Observar Solicitud';

  // Forms
  workOrderForm!: FormGroup;
  scheduleForm!: FormGroup;
  reasonForm!: FormGroup;
  resolveForm!: FormGroup;
  completeForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.loadDropdownData();
    this.loadWorkOrders();
  }

  private initForms(): void {
    this.workOrderForm = this.fb.group({
      requestType: [WorkOrderType.Instalacion, [Validators.required]],
      priority: [WorkOrderPriority.Media, [Validators.required]],
      branchId: [null, [Validators.required]],
      clientCode: ['', [Validators.required]],
      clientName: ['', [Validators.required]],
      clientPhone: ['', [Validators.required]],
      clientSecondaryPhone: [''],
      district: ['', [Validators.required]],
      address: ['', [Validators.required]],
      addressReference: [''],
      description: ['', [Validators.required]],
    });

    this.scheduleForm = this.fb.group({
      scheduledDate: [null, [Validators.required]],
      scheduledSlot: ['MAÑANA (8am - 1pm)', [Validators.required]],
      assignedTechnicianId: [null],
      notes: [''],
    });

    this.reasonForm = this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.resolveForm = this.fb.group({
      resolutionNotes: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.completeForm = this.fb.group({
      completionNotes: [''],
    });
  }

  private loadDropdownData(): void {
    this.branchService.getAll().subscribe({
      next: (res: any) => {
        const list = res.data || res.items || res || [];
        const managedBranchIds = this.auth.branchIds();
        const filteredBranches = managedBranchIds.length > 0
          ? list.filter((branch: any) => managedBranchIds.includes(branch.id))
          : list;

        this.branches.set(filteredBranches);

        if (this.selectedBranchId() && !filteredBranches.some((branch: any) => branch.id === this.selectedBranchId())) {
          this.selectedBranchId.set(undefined);
        }
      },
      error: () => {}
    });

    this.workOrderService.getTechniciansByBranch().subscribe({
      next: (res: any) => {
        const usersList = res.items || res.data || res || [];
        this.technicians.set(usersList);
      },
      error: () => {}
    });
  }

  hasPermission(permission: string): boolean {
    return this.auth.permissions().includes(permission);
  }

  canEditWorkOrder(item: WorkOrder): boolean {
    const editableStatuses = [WorkOrderStatus.Pendiente, WorkOrderStatus.Observado];
    return editableStatuses.includes(item.status) && this.hasPermission(this.PERMISSIONS.WorkOrders.Edit);
  }

  canResolveObservation(item: WorkOrder): boolean {
    return item.status === WorkOrderStatus.Observado;
  }

  canScheduleWorkOrder(item: WorkOrder): boolean {
    const schedulableStatuses = [WorkOrderStatus.Pendiente, WorkOrderStatus.Agendado];
    return schedulableStatuses.includes(item.status) && this.hasPermission(this.PERMISSIONS.WorkOrders.Schedule);
  }

  canObserveWorkOrder(item: WorkOrder): boolean {
    return item.status === WorkOrderStatus.Pendiente && this.hasPermission(this.PERMISSIONS.WorkOrders.Schedule);
  }

  canCompleteWorkOrder(item: WorkOrder): boolean {
    const completableStatuses = [WorkOrderStatus.Agendado, WorkOrderStatus.Pendiente];
    return completableStatuses.includes(item.status) && this.hasPermission(this.PERMISSIONS.WorkOrders.Complete);
  }

  canCancelWorkOrder(item: WorkOrder): boolean {
    const cancellableStatuses = [
      WorkOrderStatus.Pendiente,
      WorkOrderStatus.Observado,
      WorkOrderStatus.Agendado,
    ];

    return cancellableStatuses.includes(item.status) && this.hasPermission(this.PERMISSIONS.WorkOrders.Cancel);
  }

  loadWorkOrders(): void {
    this.loading.set(true);
    this.workOrderService.getWorkOrders({
      pageNumber: this.pageNumber(),
      pageSize: this.pageSize(),
      searchTerm: this.searchTerm(),
      status: this.selectedStatus(),
      requestType: this.selectedRequestType(),
      branchId: this.selectedBranchId()
    }).subscribe({
      next: (res) => {
        this.workOrders.set(res.items);
        this.totalCount.set(res.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.message.error('Error al cargar la lista de solicitudes.');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.pageNumber.set(1);
    this.loadWorkOrders();
  }

  onPageIndexChange(index: number): void {
    this.pageNumber.set(index);
    this.loadWorkOrders();
  }

  onPageSizeChange(size: number): void {
    this.pageSize.set(size);
    this.pageNumber.set(1);
    this.loadWorkOrders();
  }

  // --- Actions ---
  openCreateModal(): void {
    this.router.navigate(['/work-orders/new']);
  }

  openEditModal(item: WorkOrder): void {
    this.editingWorkOrderId = item.id;
    this.modalTitle = `Editar Solicitud ${item.ticketNumber}`;
    this.workOrderForm.patchValue({
      requestType: item.requestType,
      priority: item.priority,
      branchId: item.branchId,
      clientCode: item.clientCode,
      clientName: item.clientName,
      clientPhone: item.clientPhone,
      district: item.district,
      address: item.address,
      description: item.description
    });

    // Cargar detalle completo para parchar campos opcionales
    this.workOrderService.getWorkOrderById(item.id).subscribe({
      next: (detail) => {
        this.workOrderForm.patchValue({
          clientSecondaryPhone: detail.clientSecondaryPhone,
          addressReference: detail.addressReference
        });
        this.isCreateModalVisible = true;
      }
    });
  }

  handleCreateSubmit(): void {
    if (this.workOrderForm.invalid) {
      Object.values(this.workOrderForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    const payload: CreateWorkOrderPayload = this.workOrderForm.value;

    if (this.editingWorkOrderId) {
      this.workOrderService.updateWorkOrder(this.editingWorkOrderId, payload).subscribe({
        next: () => {
          this.message.success('Solicitud actualizada correctamente.');
          this.isCreateModalVisible = false;
          this.loadWorkOrders();
        },
        error: () => this.message.error('Error al actualizar la solicitud.')
      });
    } else {
      this.workOrderService.createWorkOrder(payload).subscribe({
        next: (created) => {
          this.message.success(`Solicitud ${created.ticketNumber} registrada exitosamente.`);
          this.isCreateModalVisible = false;
          this.loadWorkOrders();
        },
        error: () => this.message.error('Error al registrar la solicitud.')
      });
    }
  }

  openScheduleModal(item: WorkOrder): void {
    this.selectedWorkOrder = item;
    this.scheduleForm.reset({
      scheduledSlot: 'MAÑANA (8am - 1pm)',
      assignedTechnicianId: item.assignedTechnicianId || null
    });
    if (item.scheduledDate) {
      this.scheduleForm.patchValue({
        scheduledDate: new Date(item.scheduledDate)
      });
    }

    // Cargar técnicos pertenecientes a la sede de la solicitud
    this.workOrderService.getTechniciansByBranch(item.branchId).subscribe({
      next: (techs: any) => {
        const list = techs.items || techs.data || techs || [];
        this.technicians.set(list);
        this.isScheduleModalVisible = true;
      },
      error: () => {
        this.isScheduleModalVisible = true;
      }
    });
  }

  openResolveModal(item: WorkOrder): void {
    this.selectedWorkOrder = item;
    this.resolveForm.reset();
    this.isResolveModalVisible = true;
  }

  handleResolveSubmit(): void {
    if (this.resolveForm.invalid || !this.selectedWorkOrder) return;

    const resolutionNotes = this.resolveForm.value.resolutionNotes;
    this.workOrderService.resolveObservation(this.selectedWorkOrder.id, resolutionNotes).subscribe({
      next: () => {
        this.message.success('Observación subsanada exitosamente. Pasa nuevamente a revisión.');
        this.isResolveModalVisible = false;
        this.loadWorkOrders();
      },
      error: () => this.message.error('Error al subsanar la observación.')
    });
  }

  handleScheduleSubmit(): void {
    if (this.scheduleForm.invalid || !this.selectedWorkOrder) {
      return;
    }

    const formVal = this.scheduleForm.value;
    const dateObj = new Date(formVal.scheduledDate);
    const dateStr = dateObj.toISOString().split('T')[0];

    const payload: ScheduleWorkOrderPayload = {
      scheduledDate: dateStr,
      scheduledSlot: formVal.scheduledSlot,
      assignedTechnicianId: formVal.assignedTechnicianId,
      notes: formVal.notes
    };

    this.workOrderService.scheduleWorkOrder(this.selectedWorkOrder.id, payload).subscribe({
      next: () => {
        this.message.success('Programación agendada exitosamente.');
        this.isScheduleModalVisible = false;
        this.loadWorkOrders();
      },
      error: () => this.message.error('Error al agendar la programación.')
    });
  }

  openReasonModal(item: WorkOrder, action: 'observe' | 'reject' | 'cancel'): void {
    this.selectedWorkOrder = item;
    this.reasonAction = action;
    this.reasonForm.reset();

    if (action === 'observe') this.reasonModalTitle = 'Observar Solicitud';
    else if (action === 'reject') this.reasonModalTitle = 'Rechazar Solicitud';
    else this.reasonModalTitle = 'Cancelar Solicitud';

    this.isReasonModalVisible = true;
  }

  handleReasonSubmit(): void {
    if (this.reasonForm.invalid || !this.selectedWorkOrder) return;

    const payload = { reason: this.reasonForm.value.reason };
    const id = this.selectedWorkOrder.id;

    let obs;
    if (this.reasonAction === 'observe') obs = this.workOrderService.observeWorkOrder(id, payload);
    else if (this.reasonAction === 'reject') obs = this.workOrderService.rejectWorkOrder(id, payload);
    else obs = this.workOrderService.cancelWorkOrder(id, payload);

    obs.subscribe({
      next: () => {
        this.message.success('Estado actualizado correctamente.');
        this.isReasonModalVisible = false;
        this.loadWorkOrders();
      },
      error: () => this.message.error('Error al actualizar el estado.')
    });
  }

  handleComplete(item: WorkOrder): void {
    this.workOrderService.completeWorkOrder(item.id, { completionNotes: 'Atendido y verificado por Backoffice.' }).subscribe({
      next: () => {
        this.message.success(`Solicitud ${item.ticketNumber} marcada como Completada.`);
        this.loadWorkOrders();
      },
      error: () => this.message.error('Error al completar la orden.')
    });
  }

  openDetailDrawer(item: WorkOrder): void {
    this.selectedWorkOrder = item;
    this.workOrderDetail.set(null);
    this.isDetailDrawerVisible = true;

    this.workOrderService.getWorkOrderById(item.id).subscribe({
      next: (detail) => this.workOrderDetail.set(detail),
      error: () => this.message.error('Error al obtener el detalle.')
    });
  }

  // --- Helper Tags & Badges ---
  getStatusLabel(status: WorkOrderStatus | string | number): string {
    const s = String(status);
    switch (s) {
      case 'Pendiente':
      case 'PendingSiebelMatch':
      case '1': return '⏳ Pendiente Cruce SIEBEL';
      case 'Matched': return '🟢 Vinculada (Pend. Agendar)';
      case 'Agendado':
      case 'Assigned':
      case 'InProgress':
      case '3': return '🗓️ Visita Agendada';
      case 'Observado':
      case 'Observed':
      case '2': return '⚠️ Observada';
      case 'Completado':
      case 'Completed':
      case '4': return '✅ Cierre Operacional';
      case 'Rechazado':
      case 'Cancelled':
      case '5': return '❌ Rechazada';
      default: return s || 'Pendiente';
    }
  }

  getStatusColor(status: WorkOrderStatus | string): string {
    const s = String(status);
    switch (s) {
      case 'Pendiente':
      case 'PendingSiebelMatch':
      case '1': return 'gold';
      case 'Matched': return 'processing';
      case 'Observado':
      case 'Observed':
      case '2': return 'volcano';
      case 'Agendado':
      case 'Assigned':
      case 'InProgress':
      case '3': return 'cyan';
      case 'Completado':
      case 'Completed':
      case '4': return 'green';
      case 'Rechazado':
      case 'Cancelled':
      case '5': return 'red';
      default: return 'blue';
    }
  }

  getTypeColor(type: WorkOrderType): string {
    switch (type) {
      case WorkOrderType.Instalacion: return 'blue';
      case WorkOrderType.Averia: return 'orange';
      case WorkOrderType.Encomienda: return 'purple';
      default: return 'geekblue';
    }
  }

  getPriorityColor(priority: WorkOrderPriority): string {
    switch (priority) {
      case WorkOrderPriority.Baja: return 'default';
      case WorkOrderPriority.Media: return 'blue';
      case WorkOrderPriority.Alta: return 'orange';
      case WorkOrderPriority.Urgente: return 'red';
      default: return 'default';
    }
  }
}
