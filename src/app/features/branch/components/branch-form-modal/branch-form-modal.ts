import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule, NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';

import { BranchResponse } from '../../models/branch-response';
import { BranchService } from '../../services/branch-service';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { Observable } from 'rxjs';

/**
 * Componente modal para crear o editar la información de una sede.
 */
@Component({
  selector: 'app-branch-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule
  ],
  templateUrl: './branch-form-modal.html'
})
export class BranchFormModal implements OnInit {
  /**
   * FormBuilder inyectado.
   */
  private _fb = inject(FormBuilder);

  /**
   * Referencia a la ventana modal activa.
   */
  private _modalRef = inject(NzModalRef);

  /**
   * Servicio de administración de sedes.
   */
  private _branchService = inject(BranchService);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Datos pasados opcionalmente al modal (objeto de la sede a editar).
   */
  private _modalData: { branch?: BranchResponse } = inject(NZ_MODAL_DATA, { optional: true }) || {};

  /**
   * Objeto de la sede en edición (si aplica).
   */
  branch?: BranchResponse;

  /**
   * Bandera que determina si la operación es edición (`true`) o creación (`false`).
   */
  isEdit = false;

  /**
   * Instancia del formulario reactivo del modal.
   */
  form!: FormGroup;

  /**
   * Señal reactiva del estado de carga durante el guardado.
   */
  loading = signal(false);

  /**
   * Inicializa las variables y construye el formulario del modal.
   */
  ngOnInit(): void {
    this.branch = this._modalData.branch;
    this.isEdit = !!this.branch;
    
    this.form = this._fb.group({
      code: [this.branch?.code || '', [Validators.required, Validators.maxLength(10)]],
      name: [this.branch?.name || '', [Validators.required, Validators.maxLength(100)]],
      address: [this.branch?.address || '', [Validators.maxLength(250)]]
    });
  }

  /**
   * Cierra el modal sin realizar cambios.
   */
  destroyModal(): void {
    this._modalRef.destroy(false);
  }

  /**
   * Envía el formulario para crear o actualizar la sede.
   */
  submitForm(): void {
    if (this.form.valid) {
      this.loading.set(true);
      const val = this.form.value;

      const request = {
        code: val.code.trim().toUpperCase(),
        name: val.name.trim(),
        address: val.address ? val.address.trim() : null
      };

      const obs$ = (this.isEdit 
        ? this._branchService.update(this.branch!.id, request)
        : this._branchService.create(request)) as Observable<any>;

      obs$.subscribe({
        next: () => {
          this._messageService.success(`Sede ${this.isEdit ? 'actualizada' : 'creada'} con éxito`);
          this.loading.set(false);
          this._modalRef.close(true);
        },
        error: (err: any) => {
          this.loading.set(false);
          const msg = parseApiErrorMessage(err);
          this._messageService.error(msg);
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
