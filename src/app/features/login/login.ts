import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// NG-ZORRO
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';

// PROJECT
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/LoginRequest';

/**
 * Componente funcional para el inicio de sesión y autenticación de usuarios.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NzButtonModule,
    NzCheckboxModule,
    NzFormModule,
    NzInputModule,
    NzIconModule,
  ],
  templateUrl: './login.html',
})
export class Login {
  /**
   * Builder para formularios reactivos no nulos.
   */
  private fb = inject(NonNullableFormBuilder);

  /**
   * Servicio de autenticación.
   */
  private authService = inject(AuthService);

  /**
   * Enrutador para redirigir al Dashboard o inicio tras autenticarse.
   */
  private router = inject(Router);

  /**
   * Servicio de mensajes y alertas flotantes de NG-ZORRO.
   */
  private message = inject(NzMessageService);

  /**
   * Año actual para mostrar dinámicamente en el footer del Login.
   */
  currentYear = new Date().getFullYear();

  /**
   * Formulario reactivo para captura y validación de credenciales.
   */
  validateForm = this.fb.group({
    userName: this.fb.control('', [Validators.required]),
    password: this.fb.control('', [Validators.required]),
    remember: this.fb.control(true),
  });

  /**
   * Procesa el envío del formulario de login y ejecuta la petición de autenticación.
   */
  submitForm(): void {
    if (this.validateForm.valid) {
      const { userName, password } = this.validateForm.getRawValue();
      const request: LoginRequest = {
        userName: userName!,
        password: password!,
      };
      this.authService.login(request).subscribe({
        next: () => {
          this.router.navigate(['/work-orders']);
        },
        error: (err) => {
          console.log(err.error);
          this.message.create('error', `${err.error.title}`);
        },
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
