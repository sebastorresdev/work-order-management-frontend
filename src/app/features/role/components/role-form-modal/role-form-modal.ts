import { Component, EventEmitter, inject, Input, OnInit, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { RoleService } from '../../services/role-service';
import { RoleRequest } from '../../models/role-request';
import { RoleResponse } from '../../models/role-response';

/**
 * Componente modal para la creación y edición de roles de usuario.
 */
@Component({
  selector: 'app-role-form-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './role-form-modal.html',
})
export class RoleFormModal implements OnInit, OnChanges {
  /**
   * Builder para formularios reactivos.
   */
  private _fb = inject(FormBuilder);

  /**
   * Servicio de roles.
   */
  private _roleService = inject(RoleService);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Visibilidad del modal.
   */
  @Input() visible = false;

  /**
   * Objeto del rol a editar o null para crear uno nuevo.
   */
  @Input() role: RoleResponse | null = null;

  /**
   * Evento emitido al cambiar la visibilidad del modal.
   */
  @Output() visibleChange = new EventEmitter<boolean>();

  /**
   * Evento emitido tras guardar exitosamente el rol.
   */
  @Output() saved = new EventEmitter<void>();

  /**
   * Grupo de controles del formulario de rol.
   */
  form!: FormGroup;

  /**
   * Estado de procesamiento durante el guardado.
   */
  isSaving = false;

  /**
   * Inicializa la estructura del formulario.
   */
  ngOnInit(): void {
    this.form = this._fb.group({
      name: ['', [Validators.required, Validators.maxLength(256)]],
      description: ['', [Validators.maxLength(1000)]],
    });
  }

  /**
   * Se ejecuta ante cambios en las propiedades de entrada (@Input) para resetear el formulario.
   */
  ngOnChanges(): void {
    if (this.visible) {
      this.resetForm();
    }
  }

  /**
   * Reinicia o pbla los campos del formulario según se esté creando o editando un rol.
   */
  resetForm(): void {
    if (this.form) {
      if (this.role) {
        this.form.patchValue({
          name: this.role.name,
          description: this.role.description,
        });
      } else {
        this.form.reset();
      }
    }
  }

  /**
   * Cancela la operación y cierra el modal.
   */
  handleCancel(): void {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

  /**
   * Procesa la validación y el envío del formulario para crear o actualizar el rol.
   */
  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.isSaving = true;
    const request: RoleRequest = this.form.value;

    if (this.role) {
      this._roleService.update(this.role.id, request).subscribe({
        next: () => {
          this._messageService.success('Rol actualizado con éxito');
          this.isSaving = false;
          this.saved.emit();
          this.handleCancel();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('Error al actualizar el rol');
          this.isSaving = false;
        },
      });
    } else {
      this._roleService.create(request).subscribe({
        next: () => {
          this._messageService.success('Rol creado con éxito');
          this.isSaving = false;
          this.saved.emit();
          this.handleCancel();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('Error al crear el rol');
          this.isSaving = false;
        },
      });
    }
  }
}
