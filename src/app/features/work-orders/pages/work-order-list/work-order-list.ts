import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

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

  // Enums for Template
  WorkOrderStatus = WorkOrderStatus;
  WorkOrderType = WorkOrderType;
  WorkOrderPriority = WorkOrderPriority;

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

    this.completeForm = this.fb.group({
      completionNotes: [''],
    });
  }

  private loadDropdownData(): void {
    this.branchService.getAll().subscribe({
      next: (res: any) => {
        const list = res.data || res.items || res || [];
        this.branches.set(list);
      },
      error: () => {}
    });

    this.userService.getAll().subscribe({
      next: (res: any) => {
        const usersList = res.items || res.data || res || [];
        this.technicians.set(usersList);
      },
      error: () => {}
    });
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
    this.editingWorkOrderId = null;
    this.modalTitle = 'Nueva Solicitud de Servicio';
    this.workOrderForm.reset({
      requestType: WorkOrderType.Instalacion,
      priority: WorkOrderPriority.Media,
      branchId: this.branches().length > 0 ? this.branches()[0].id : null
    });
    this.isCreateModalVisible = true;
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
    this.isScheduleModalVisible = true;
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
  getStatusColor(status: WorkOrderStatus): string {
    switch (status) {
      case WorkOrderStatus.Pendiente: return 'gold';
      case WorkOrderStatus.Observado: return 'volcano';
      case WorkOrderStatus.Agendado: return 'cyan';
      case WorkOrderStatus.Completado: return 'green';
      case WorkOrderStatus.Rechazado: return 'red';
      case WorkOrderStatus.Cancelado: return 'default';
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
