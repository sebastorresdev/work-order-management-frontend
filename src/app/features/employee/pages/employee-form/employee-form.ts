import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// NG-ZORRO
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';

// PROYECTO
import { EmployeeService } from '../../services/employee-service';
import { DocumentType } from '../../models/document-type';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';
import { EmployeeResponse } from '../../models/employee-response';

/**
 * Componente de formulario para el registro o edición de fichas de empleados.
 */
@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzDatePickerModule,
    NzIconModule,
    NzGridModule,
    NzCardModule,
    NzSpaceModule,
    NzSpinModule,
    NzBreadCrumbModule,
    NzDividerModule,
    RouterLink
  ],
  templateUrl: './employee-form.html'
})
export class EmployeeForm implements OnInit {
  /**
   * Builder de formularios inyectado.
   */
  private _fb = inject(FormBuilder);

  /**
   * Servicio de empleados.
   */
  private _employeeService = inject(EmployeeService);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio de consulta de parámetros de ruta.
   */
  private _route = inject(ActivatedRoute);

  /**
   * Enrutador para navegación.
   */
  private _router = inject(Router);

  /**
   * Ubicación de navegación histórica del navegador.
   */
  private _location = inject(Location);

  /**
   * Grupo del formulario reactivo de empleados.
   */
  form!: FormGroup;

  /**
   * Identifica si la vista está en modo edición.
   */
  isEdit = false;

  /**
   * Identificador del empleado en edición.
   */
  employeeId: string | null = null;

  /**
   * Señal reactiva de procesamiento durante el guardado.
   */
  loading = signal(false);

  /**
   * Señal reactiva de carga inicial de datos del empleado.
   */
  initialLoading = signal(false);

  /**
   * Lista de tipos de documentos de identidad disponibles para seleccionar.
   */
  documentTypes = [
    { label: 'DNI', value: DocumentType.Dni },
    { label: 'Carnet de Extranjería', value: DocumentType.Ce },
    { label: 'Pasaporte', value: DocumentType.Passport }
  ];

  /**
   * Inicializa el formulario y evalúa si se pasa un ID por la ruta.
   */
  ngOnInit(): void {
    this.initForm();
    
    this.employeeId = this._route.snapshot.paramMap.get('id');
    if (this.employeeId) {
      this.isEdit = true;
      this.loadEmployee(this.employeeId);
    }
  }

  /**
   * Construye los campos y reglas de validación del formulario de empleado.
   */
  private initForm(): void {
    this.form = this._fb.group({
      code: ['', [Validators.required, Validators.maxLength(10)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      documentType: [DocumentType.Dni, [Validators.required]],
      documentNumber: ['', [Validators.required, Validators.maxLength(20)]],
      hireDate: [null, [Validators.required]],
      email: ['', [Validators.email, Validators.maxLength(250)]],
      phone: ['', [Validators.maxLength(20)]],
      position: ['', [Validators.maxLength(100)]],
      department: ['', [Validators.maxLength(100)]],
      photoUrl: ['', [Validators.maxLength(500)]]
    });
  }

  /**
   * Carga la información del empleado desde el servidor para poblar el formulario.
   * @param id Identificador único del empleado.
   */
  private loadEmployee(id: string): void {
    this.initialLoading.set(true);
    this._employeeService.getById(id).subscribe({
      next: (emp: EmployeeResponse) => {
        this.form.patchValue({
          code: emp.code,
          firstName: emp.firstName,
          lastName: emp.lastName,
          documentType: emp.documentType,
          documentNumber: emp.documentNumber,
          hireDate: (emp as any).hireDate ? new Date((emp as any).hireDate) : null,
          email: emp.email,
          phone: emp.phone,
          position: emp.position,
          department: emp.department,
          photoUrl: emp.photoUrl
        });
        this.initialLoading.set(false);
      },
      error: (err) => {
        this._messageService.error('Error al cargar empleado');
        this.initialLoading.set(false);
        this.goBack();
      }
    });
  }

  /**
   * Regresa a la pantalla anterior del historial.
   */
  goBack(): void {
    this._location.back();
  }

  /**
   * Envía el formulario para guardar o actualizar la información del empleado.
   */
  submitForm(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.loading.set(true);
    const val = this.form.value;

    const request = {
      code: val.code.trim().toUpperCase(),
      firstName: val.firstName.trim(),
      lastName: val.lastName.trim(),
      documentType: val.documentType,
      documentNumber: val.documentNumber.trim(),
      hireDate: val.hireDate ? val.hireDate.toISOString() : null,
      email: val.email ? val.email.trim() : null,
      phone: val.phone ? val.phone.trim() : null,
      position: val.position ? val.position.trim() : null,
      department: val.department ? val.department.trim() : null,
      photoUrl: val.photoUrl ? val.photoUrl.trim() : null
    };

    const obs$ = this.isEdit 
      ? this._employeeService.update(this.employeeId!, request)
      : this._employeeService.create(request);

    obs$.subscribe({
      next: () => {
        this._messageService.success(`Empleado ${this.isEdit ? 'actualizado' : 'creado'} con éxito`);
        this.loading.set(false);
        this.goBack();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = parseApiErrorMessage(err);
        this._messageService.error(msg);
      }
    });
  }
}
