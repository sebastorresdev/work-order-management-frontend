import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { AuthService } from '../../../../core/services/auth.service';
import { BranchService } from '../../../branch/services/branch-service';
import { UserService } from '../../../user/services/user-service';
import { WorkOrderService } from '../../../../core/services/work-order.service';
import { PERMISSIONS } from '../../../../core/constants/permissions';
import {
  WorkOrderType,
  WorkOrderPriority,
  CreateWorkOrderPayload,
  ScheduleWorkOrderPayload
} from '../../../../core/models/work-order.types';


@Component({
  selector: 'app-work-order-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzButtonModule,
    NzCardModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzRadioModule,
    NzSelectModule,
  ],
  templateUrl: './work-order-form.html',
})
export class WorkOrderForm implements OnInit {
  private fb = inject(FormBuilder);
  private workOrderService = inject(WorkOrderService);
  private branchService = inject(BranchService);
  private userService = inject(UserService);
  public auth = inject(AuthService);
  private message = inject(NzMessageService);
  private router = inject(Router);

  readonly PERMISSIONS = PERMISSIONS;

  submitting = signal(false);
  branches = signal<any[]>([]);
  technicians = signal<any[]>([]);

  WorkOrderType = WorkOrderType;
  WorkOrderPriority = WorkOrderPriority;

  workOrderTypes = [
    { value: WorkOrderType.Instalacion, label: 'Instalación' },
    { value: WorkOrderType.Averia, label: 'Avería' },
    { value: WorkOrderType.Encomienda, label: 'Encomienda' }
  ];

  priorityOptions = [
    { value: WorkOrderPriority.Media, label: 'Normal' },
    { value: WorkOrderPriority.Alta, label: 'Alta' },
    { value: WorkOrderPriority.Urgente, label: 'Urgente' }
  ];

  presetNotes = [
    'Cliente ya cuenta con antena y cableado.',
    'Coordinar horario de atención previamente por teléfono.',
    'Requiere instalación desde cero.',
    'Avería en señal de decodificador.'
  ];

  form!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadDropdowns();
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
      district: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', [Validators.required, Validators.maxLength(300)]],
      addressReference: ['', [Validators.maxLength(300)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      scheduledDate: [null],
      scheduledSlot: ['MAÑANA (8am - 1pm)'],
      assignedTechnicianId: [null],
      scheduleNotes: ['']
    });
  }

  private loadDropdowns(): void {
    this.branchService.getAll().subscribe({
      next: (list: any) => {
        const branchesList = list?.data || list?.items || list || [];
        const managedBranchIds = this.auth.branchIds();
        const filteredBranches = managedBranchIds.length > 0
          ? branchesList.filter((branch: any) => managedBranchIds.includes(branch.id))
          : branchesList;

        this.branches.set(filteredBranches);

        if (filteredBranches.length > 0) {
          const currentBranchId = this.form.get('branchId')?.value;
          const defaultBranchId = filteredBranches.some((branch: any) => branch.id === currentBranchId)
            ? currentBranchId
            : filteredBranches[0].id;

          this.form.patchValue({ branchId: defaultBranchId });
        }
      },
      error: () => this.message.error('No se pudieron cargar las sedes.')
    });

    if (this.canSchedule()) {
      this.userService.getAll().subscribe({
        next: (res: any) => {
          const usersList = res?.items || res?.data || res || [];
          this.technicians.set(usersList);
        },
        error: () => {}
      });
    }
  }

  canSchedule(): boolean {
    return this.auth.permissions().includes(PERMISSIONS.WorkOrders.Schedule);
  }

  appendPresetNote(note: string): void {
    const current = this.form.get('description')?.value ?? '';
    this.form.patchValue({
      description: current ? `${current}\n${note}` : note
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.message.warning('Por favor completa todos los campos obligatorios.');
      return;
    }

    this.submitting.set(true);

    const val = this.form.value;
    const createPayload: CreateWorkOrderPayload = {
      requestType: val.requestType,
      priority: val.priority,
      branchId: val.branchId,
      clientCode: val.clientCode,
      clientName: val.clientName,
      clientPhone: val.clientPhone,
      clientSecondaryPhone: val.clientSecondaryPhone || undefined,
      district: val.district,
      address: val.address,
      addressReference: val.addressReference || undefined,
      description: val.description
    };

    this.workOrderService.createWorkOrder(createPayload).subscribe({
      next: (created) => {
        if (this.canSchedule() && val.scheduledDate) {
          const dateStr = val.scheduledDate instanceof Date
            ? val.scheduledDate.toISOString().split('T')[0]
            : val.scheduledDate;

          const schedulePayload: ScheduleWorkOrderPayload = {
            scheduledDate: dateStr,
            scheduledSlot: val.scheduledSlot,
            assignedTechnicianId: val.assignedTechnicianId || undefined,
            notes: val.scheduleNotes || undefined
          };

          this.workOrderService.scheduleWorkOrder(created.id, schedulePayload).subscribe({
            next: () => {
              this.submitting.set(false);
              this.message.success(`Solicitud #${created.ticketNumber} registrada y agendada exitosamente.`);
              this.router.navigate(['/work-orders']);
            },
            error: () => {
              this.submitting.set(false);
              this.message.success(`Solicitud #${created.ticketNumber} registrada correctamente.`);
              this.router.navigate(['/work-orders']);
            }
          });
        } else {
          this.submitting.set(false);
          this.message.success(`Solicitud de servicio #${created.ticketNumber} registrada correctamente.`);
          this.router.navigate(['/work-orders']);
        }
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.message.error(err?.error?.detail || 'Error al registrar la solicitud.');
      }
    });
  }
}

