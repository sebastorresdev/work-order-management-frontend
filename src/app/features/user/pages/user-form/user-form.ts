import { CommonModule } from '@angular/common';
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin, Observable, Observer, switchMap, of, finalize, catchError, Subscription, map } from 'rxjs';

import { NzCheckboxGroupComponent, NzCheckboxOption } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzOptionComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzUploadFile, NzUploadModule, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule, NzDrawerService } from 'ng-zorro-antd/drawer';

import { BranchService } from '../../../branch/services/branch-service';
import { UserService } from '../../services/user-service';
import { RoleService } from '../../../role/services/role-service';
import { RoleResponse } from '../../../role/models/role-response';
import { BranchResponse } from '../../../branch/models/branch-response';
import { UserDetailResponse } from '../../models/user-detail-response';
import { ResetPasswordModal } from '../../components/reset-password-modal/reset-password-modal';
import { PermissionDrawer, PermissionDrawerData } from '../../components/permission-drawer/permission-drawer';
import { parseApiErrorMessage } from '../../../../shared/utils/api-error.util';

/**
 * Validador personalizado para asegurar que las contraseñas coincidan al crear un usuario.
 * @param control Control del formulario.
 */
function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;

  const password = parent.get('password')?.value;
  if (!password && !control.value) return null;

  return control.value === password ? null : { passwordMismatch: true };
}

/**
 * Componente para la creación y edición integral de cuentas de usuario, subida de foto de perfil y roles.
 */
@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzOptionComponent,
    NzCheckboxGroupComponent,
    NzSwitchModule,
    NzInputModule,
    NzBreadCrumbModule,
    RouterLink,
    NzButtonComponent,
    NzDividerModule,
    NzUploadModule,
    NzIconModule,
    NzCardModule,
    NzDrawerModule,
    ResetPasswordModal,
  ],
  templateUrl: './user-form.html',
})
export class UserForm implements OnInit {
  /**
   * FormBuilder inyectado.
   */
  private _fb = inject(FormBuilder);

  /**
   * Servicio de sedes.
   */
  private _branchService = inject(BranchService);

  /**
   * Servicio de usuarios.
   */
  private _userService = inject(UserService);

  /**
   * Servicio de roles.
   */
  private _roleService = inject(RoleService);

  /**
   * Servicio de parámetros de ruta activa.
   */
  private _route = inject(ActivatedRoute);

  /**
   * Enrutador para navegación.
   */
  private _router = inject(Router);

  /**
   * Servicio de notificaciones flotantes.
   */
  private _messageService = inject(NzMessageService);

  /**
   * Servicio para apertura de drawer lateral.
   */
  private _drawerService = inject(NzDrawerService);

  /**
   * Señal reactiva con el ID del usuario en edición.
   */
  public _userId = signal<string | null>(null);

  /**
   * Propiedad computada que evalúa si la pantalla está en modo edición.
   */
  isEditMode = computed(() => !!this._userId());

  /**
   * Lista de sedes disponibles.
   */
  public branchList: BranchResponse[] = [];

  /**
   * Lista de roles mapeados para las casillas de verificación.
   */
  public roleList: NzCheckboxOption[] = [];

  /**
   * Información del usuario en edición.
   */
  public currentUser!: UserDetailResponse | null;

  /**
   * Señal reactiva de carga inicial de datos.
   */
  public loadingData = signal(true);

  /**
   * Señal reactiva de guardado en proceso.
   */
  public saving = signal(false);

  /**
   * Señal de carga durante la subida de avatar.
   */
  readonly loading = signal<boolean>(false);

  /**
   * Señal con la URL del avatar actual.
   */
  readonly avatarUrl = signal<string | undefined>(undefined);

  /**
   * Bandera reactiva para registrar si se ha seleccionado una nueva imagen de avatar.
   */
  readonly avatarChanged = signal<boolean>(false);

  /**
   * Archivo de imagen seleccionado.
   */
  private avatarFile = signal<File | null>(null);

  /**
   * Visibilidad del modal de reseteo de contraseña.
   */
  showResetPasswordModal = signal(false);

  /**
   * Formulario reactivo con la estructura y validaciones del usuario.
   */
  form: FormGroup = this._fb.group({
    userName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    isActive: [true, Validators.required],
    displayName: [null],
    phoneNumber: [null],
    branchIds: [[], Validators.required],
    roleIds: [[]],
    password: [''],
    confirmPassword: [''],
  });

  /**
   * Inicializa las validaciones y datos iniciales.
   */
  ngOnInit(): void {
    const userId = this._route.snapshot.paramMap.get('userId');
    this._userId.set(userId);

    if (!this.isEditMode()) {
      this.form.controls['password'].addValidators([Validators.required, Validators.minLength(6)]);
      this.form.controls['confirmPassword'].addValidators([Validators.required, passwordMatchValidator]);

      this.form.controls['password'].valueChanges.subscribe(() =>
        this.form.controls['confirmPassword'].updateValueAndValidity({ onlySelf: true })
      );
    }

    this.loadInitialData();
  }

  /**
   * Carga simultáneamente las sedes y roles disponibles.
   */
  private loadInitialData(): void {
    this.loadingData.set(true);

    forkJoin({
      branches: this._branchService.getAll(),
      roles: this._roleService.getAll(),
    })
      .pipe(
        catchError((err) => {
          this._messageService.error('Error al cargar datos iniciales (sedes/roles)');
          console.error(err);
          return of({ branches: [] as BranchResponse[], roles: [] as RoleResponse[] });
        }),
      )
      .subscribe(({ branches, roles }) => {
        this.branchList = branches;
        this.roleList = this.mapRolesToOptions(roles);

        if (this.isEditMode()) {
          this.loadUser(this._userId()!);
        } else {
          this.loadingData.set(false);
        }
      });
  }

  /**
   * Mapea la lista de roles a opciones de checkbox de NG-ZORRO.
   * @param roles Lista de roles.
   */
  private mapRolesToOptions(roles: RoleResponse[]): NzCheckboxOption[] {
    return roles.map(r => ({ label: r.name, value: r.id }));
  }

  /**
   * Carga el detalle del usuario para edición.
   * @param userId Identificador del usuario.
   */
  loadUser(userId: string): void {
    this._userService.getById(userId)
      .pipe(finalize(() => this.loadingData.set(false)))
      .subscribe({
        next: (userDetalle: UserDetailResponse) => {
          this.currentUser = userDetalle;
          this.avatarUrl.set(userDetalle.photoUrl ?? undefined);

          this.form.patchValue({
            userName: userDetalle.userName,
            email: userDetalle.email,
            isActive: userDetalle.isActive,
            displayName: userDetalle.displayName,
            phoneNumber: userDetalle.phoneNumber,
            branchIds: userDetalle.branchIds,
            roleIds: userDetalle.roleIds,
          });
        },
        error: (err) => {
          console.error('Error al cargar usuario:', err);
          this._messageService.error('No se pudo cargar el usuario');
        }
      });
  }

  /**
   * Validación previa al seleccionar un archivo de imagen para el avatar.
   * @param file Archivo a validar.
   */
  readonly beforeUpload = (file: NzUploadFile): Observable<boolean> => {
    return new Observable((observer: Observer<boolean>) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        this._messageService.error('Solo puedes subir archivos JPG o PNG.');
        observer.next(false);
        observer.complete();
        return;
      }

      const isLt2M = (file.size ?? 0) / 1024 / 1024 < 2;
      if (!isLt2M) {
        this._messageService.error('La imagen debe pesar menos de 2MB.');
        observer.next(false);
        observer.complete();
        return;
      }

      observer.next(true);
      observer.complete();
    });
  };

  /**
   * Maneja el cambio de estado de carga de la imagen del avatar.
   * @param info Objeto de información del archivo subido.
   */
  handleChange(info: { file: NzUploadFile }): void {
    switch (info.file.status) {
      case 'uploading':
        this.loading.set(true);
        break;
      case 'done':
      case 'success':
        if (info.file.originFileObj) {
          this.avatarFile.set(info.file.originFileObj as unknown as File);
          this.avatarChanged.set(true);

          this._getBase64(info.file.originFileObj as unknown as File, (img: string) => {
            this.loading.set(false);
            this.avatarUrl.set(img);
          });
        } else {
          this.loading.set(false);
        }
        break;
      case 'error':
        console.log('Upload error info:', info);
        this._messageService.error('Error al cargar la imagen.');
        this.loading.set(false);
        break;
    }
  }

  /**
   * Manejador personalizado para evitar la subida HTTP automática del componente upload de NG-ZORRO.
   */
  readonly customUpload = (item: NzUploadXHRArgs): Subscription => {
    setTimeout(() => {
      if (item.file) {
        item.onSuccess?.({}, item.file, null);
      }
    }, 0);

    return new Subscription();
  };

  /**
   * Remueve la foto de perfil seleccionada.
   * @param event Evento de clic.
   */
  removeAvatar(event: Event): void {
    event.stopPropagation();
    this.avatarUrl.set(undefined);
    this.avatarFile.set(null);
  }

  /**
   * Convierte un archivo local a formato Base64 para previsualización.
   * @param file Archivo a convertir.
   * @param callback Función callback.
   */
  private _getBase64(file: File, callback: (img: string) => void): void {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result?.toString() ?? ''));
    reader.readAsDataURL(file);
  }

  /**
   * Sube la imagen del avatar al servidor si se ha seleccionado un archivo nuevo.
   */
  private uploadPhotoIfNeeded$(): Observable<string | null> {
    const file = this.avatarFile();

    if (!file || !this.avatarChanged()) {
      return of(this.avatarUrl() ?? null);
    }

    const formData = new FormData();
    formData.append('avatar', file);

    return this._userService.uploadAvatar(formData).pipe(
      switchMap((res: { url: string }) => {
        this.avatarChanged.set(false);
        return of(res.url);
      }),
    );
  }

  /**
   * Abre el modal para restablecer la contraseña del usuario.
   */
  openResetPassword(): void {
    this.showResetPasswordModal.set(true);
    console.log('Abrir reset de contraseña para', this._userId());
  }

  /**
   * Abre el cajón lateral de permisos del usuario.
   */
  openSetPermissions(): void {
    const userId = this._userId()!;
    const userName = this.currentUser?.userName ?? '';
    this._userService.getForUser(userId).subscribe({
      next: (groups) => {
        const drawerRef = this._drawerService.create<PermissionDrawer, PermissionDrawerData, string[]>({
          nzTitle: 'Establecer Permisos',
          nzWidth: 480,
          nzContent: PermissionDrawer,
          nzData: { groups, userName },
        });

        drawerRef.afterClose.subscribe((selectedOverrideKeys) => {
          if (!selectedOverrideKeys) return;

          this._userService.setOverrides(userId, selectedOverrideKeys).subscribe({
            next: () => this._messageService.success('Permisos actualizados'),
            error: () => this._messageService.error('No se pudieron guardar los permisos'),
          });
        });
      },
      error: () => this._messageService.error('No se pudieron cargar los permisos del usuario'),
    });
  }

  /**
   * Procesa el envío del formulario para crear o actualizar el usuario.
   */
  submit(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        if (c.invalid) {
          c.markAsDirty();
          c.updateValueAndValidity({ onlySelf: true });
        }
      });
      this._messageService.error('Revisa los campos marcados');
      return;
    }

    this.saving.set(true);

    this.uploadPhotoIfNeeded$()
      .pipe(
        switchMap((photoUrl) => this.isEditMode()
          ? this.updateUser$(photoUrl)
          : this.createUser$(photoUrl)),
        map(() => true),
        catchError((err) => {
          const message = parseApiErrorMessage(err);
          this._messageService.error(message);
          console.error(err);
          return of(false);
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe((success) => {
        console.log("Resultado esperado", success);
        if (success) {
          console.log(this.isEditMode() ? 'Usuario actualizado' : 'Usuario creado');
          this._messageService.success(this.isEditMode() ? 'Usuario actualizado' : 'Usuario creado');
          this._router.navigate(['/users']);
        }
      });
  }

  /**
   * Crea la llamada HTTP de creación del usuario.
   * @param photoUrl URL del avatar subido.
   */
  private createUser$(photoUrl: string | null) {
    const value = this.form.getRawValue();
    console.log("llamo a crear");
    return this._userService.create({
      displayName: value.displayName,
      userName: value.userName,
      password: value.password,
      photoUrl: photoUrl,
      email: value.email,
      phoneNumber: value.phoneNumber,
      roleIds: value.roleIds,
      branchIds: value.branchIds,
    });
  }

  /**
   * Crea la llamada HTTP de actualización del usuario.
   * @param photoUrl URL del avatar subido.
   */
  private updateUser$(photoUrl: string | null) {
    const value = this.form.getRawValue();
    const userId = this._userId()!;
    console.log("llamo a actualizar");
    return this._userService.update(userId, {
      userId,
      userName: value.userName,
      email: value.email,
      isActive: value.isActive,
      displayName: value.displayName,
      photoUrl,
      phoneNumber: value.phoneNumber,
      branchIds: value.branchIds,
      roleIds: value.roleIds,
    });
  }
}
