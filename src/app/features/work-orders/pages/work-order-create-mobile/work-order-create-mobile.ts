import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// NG-ZORRO Modules
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';

import { WorkOrderService } from '../../../../core/services/work-order.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BranchService } from '../../../branch/services/branch-service';
import {
  WorkOrderType,
  WorkOrderPriority,
  WorkOrderStatus,
  WorkOrder,
  CreateWorkOrderPayload
} from '../../../../core/models/work-order.types';
import { BranchResponse } from '../../../branch/models/branch-response';

@Component({
  selector: 'app-work-order-create-mobile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzSpinModule,
    NzModalModule
  ],
  templateUrl: './work-order-create-mobile.html'
})
export class WorkOrderCreateMobileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private workOrderService = inject(WorkOrderService);
  private branchService = inject(BranchService);
  private authService = inject(AuthService);
  private message = inject(NzMessageService);

  // State Signals
  activeTab = signal<'form' | 'my-requests'>('form');
  submitting = signal<boolean>(false);
  loadingHistory = signal<boolean>(false);
  branches = signal<BranchResponse[]>([]);
  myRequests = signal<WorkOrder[]>([]);
  successCreatedOrder = signal<WorkOrder | null>(null);

  // Enums for template
  WorkOrderType = WorkOrderType;
  WorkOrderPriority = WorkOrderPriority;
  WorkOrderStatus = WorkOrderStatus;

  // Preset Districts for Quick Selection
  districts = [
    'CHICLAYO',
    'J.L. ORTIZ',
    'LA VICTORIA',
    'LAMBAYEQUE',
    'PIMENTEL',
    'FERREÑAFE',
    'MONSEFÚ',
    'MOTUPE',
    'OLMOS'
  ];

  // Quick Preset Descriptions
  presetNotes = [
    'Cliente ya cuenta con antena y cableado.',
    'Coordinar horario de atención previamente por teléfono.',
    'Requiere instalación desde cero.',
    'Avería en señal de decodificador.'
  ];

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadBranches();
    this.loadMyRequests();
  }

  private initForm(): void {
    this.form = this.fb.group({
      requestType: [WorkOrderType.Instalacion, [Validators.required]],
      priority: [WorkOrderPriority.Media, [Validators.required]],
      branchId: ['', [Validators.required]],
      clientCode: ['', [Validators.required, Validators.maxLength(50)]],
      clientName: ['', [Validators.required, Validators.maxLength(200)]],
      clientPhone: ['', [Validators.required, Validators.pattern(/^[0-9+ ]{6,20}$/)]],
      clientSecondaryPhone: ['', [Validators.pattern(/^[0-9+ ]{6,20}$/)]],
      district: ['', [Validators.required]],
      address: ['', [Validators.required, Validators.maxLength(300)]],
      addressReference: ['', [Validators.maxLength(300)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]]
    });
  }

  private loadBranches(): void {
    this.branchService.getAll().subscribe({
      next: (list) => {
        this.branches.set(list || []);
        if (list && list.length > 0) {
          this.form.patchValue({ branchId: list[0].id });
        }
      },
      error: () => this.message.error('No se pudieron cargar las sedes')
    });
  }

  loadMyRequests(): void {
    this.loadingHistory.set(true);
    this.workOrderService.getWorkOrders({ pageNumber: 1, pageSize: 20 }).subscribe({
      next: (res: any) => {
        this.myRequests.set(res.data || []);
        this.loadingHistory.set(false);
      },
      error: () => {
        this.loadingHistory.set(false);
      }
    });
  }

  selectType(type: WorkOrderType): void {
    this.form.patchValue({ requestType: type });
  }

  selectPriority(priority: WorkOrderPriority): void {
    this.form.patchValue({ priority: priority });
  }

  selectDistrict(dist: string): void {
    this.form.patchValue({ district: dist });
  }

  appendPresetNote(note: string): void {
    const current = this.form.get('description')?.value || '';
    const updated = current ? `${current}\n${note}` : note;
    this.form.patchValue({ description: updated });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.message.warning('Por favor completa los campos obligatorios del formulario.');
      return;
    }

    this.submitting.set(true);
    const payload: CreateWorkOrderPayload = this.form.value;

    this.workOrderService.createWorkOrder(payload).subscribe({
      next: (created: WorkOrder) => {
        this.submitting.set(false);
        this.successCreatedOrder.set(created);
        this.form.reset({
          requestType: WorkOrderType.Instalacion,
          priority: WorkOrderPriority.Media,
          branchId: this.branches().length > 0 ? this.branches()[0].id : ''
        });
        this.loadMyRequests();
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.message.error(err?.error?.detail || 'Error al enviar la solicitud. Verifica los datos.');
      }
    });
  }

  closeSuccessModal(): void {
    this.successCreatedOrder.set(null);
    this.activeTab.set('my-requests');
  }

  getStatusColor(status: WorkOrderStatus): string {
    switch (status) {
      case WorkOrderStatus.Pendiente: return 'blue';
      case WorkOrderStatus.Agendado: return 'cyan';
      case WorkOrderStatus.Observado: return 'warning';
      case WorkOrderStatus.Completado: return 'success';
      case WorkOrderStatus.Rechazado: return 'error';
      case WorkOrderStatus.Cancelado: return 'default';
      default: return 'default';
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
