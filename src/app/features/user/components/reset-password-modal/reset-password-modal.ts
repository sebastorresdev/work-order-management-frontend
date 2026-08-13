import { Component, inject, input, model, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';

import { UserService } from '../../services/user-service';
import { ResetPasswordRequest } from '../../models/reset-password-request';

/**
 * Validador personalizado para comprobar que los campos de contraseña y confirmación coincidan.
 * @param control Grupo de controles del formulario.
 * @returns Objeto de error o null si coinciden.
 */
function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (!password && !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

/**
 * Componente modal para el restablecimiento directo de contraseña de un usuario.
 */
@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './reset-password-modal.html',
})
export class ResetPasswordModal {
  /**
   * FormBuilder inyectado.
   */
  private _fb = inject(FormBuilder);

  /**
   * Servicio de usuarios.
   */
  private _userService = inject(UserService);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Modelo bidireccional que visibiliza u oculta el modal.
   */
  visible = model.required<boolean>();

  /**
   * Identificador del usuario al cual se le cambiará la contraseña.
   */
  userId = input.required<string>();

  /**
   * Nombre de usuario mostrado en el título o cuerpo del modal.
   */
  userName = input<string | null>(null);

  /**
   * Evento de salida emitido cuando el cambio de contraseña se completa con éxito.
   */
  passwordReset = output<void>();

  /**
   * Señal reactiva de procesamiento durante la llamada HTTP.
   */
  saving = signal(false);

  /**
   * Formulario reactivo con la nueva contraseña y su confirmación.
   */
  form = this._fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatchValidator });

  /**
   * Cancela la operación, resetea el formulario y cierra el modal.
   */
  handleCancel(): void {
    this.form.reset();
    this.visible.set(false);
  }

  /**
   * Procesa la solicitud de restablecimiento de contraseña.
   */
  handleOk(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.saving.set(true);
    const { newPassword, confirmPassword } = this.form.getRawValue();

    const payload: ResetPasswordRequest = {
      userId: this.userId(),
      NewPassword: newPassword!,
      ConfirmNewPassword: confirmPassword!,
    };

    this._userService.resetPassword(payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this._messageService.success('Contraseña restablecida correctamente');
          this.form.reset();
          this.visible.set(false);
          this.passwordReset.emit();
        },
        error: (err) => {
          console.error(err);
          this._messageService.error('No se pudo restablecer la contraseña');
        },
      });
  }
}
