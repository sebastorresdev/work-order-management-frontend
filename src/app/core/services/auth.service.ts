import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, switchMap, firstValueFrom, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/LoginRequest';
import { LoginResponse } from '../models/LoginResponse';
import { CurrentUserDto } from '../models/current-user-dto';

/**
 * Servicio centralizado de autenticación para gestionar el estado de sesión, tokens de acceso,
 * roles y permisos del usuario en la aplicación Angular.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * Cliente HTTP inyectado para peticiones al backend.
   */
  private http = inject(HttpClient);

  /**
   * Enrutador de Angular para navegación entre vistas.
   */
  private router = inject(Router);

  /**
   * Señal reactiva (Signal) que almacena el token JWT de acceso actual.
   */
  token = signal<string | null>(localStorage.getItem('accessToken'));

  /**
   * Señal reactiva que almacena el ID del usuario autenticado.
   */
  userId = signal<string | null>(null);

  /**
   * Señal reactiva con la lista de roles del usuario.
   */
  roles = signal<string[]>([]);

  /**
   * Señal reactiva con la lista de permisos asignados al usuario.
   */
  permissions = signal<string[]>([]);

  /**
   * Señal reactiva con las sedes que maneja el usuario autenticado.
   */
  branchIds = signal<string[]>([]);

  /**
   * Propiedad computada que evalúa si existe un usuario autenticado activo.
   */
  isAuthenticated = computed(() => !!this.token());

  /**
   * Inicializa la sesión recuperando la información del usuario desde el servidor si existe un token en almacenamiento local.
   * @returns Promesa con los datos del usuario actual o null.
   */
  init(): Promise<CurrentUserDto | null> {
    const token = localStorage.getItem('accessToken');
    if (!token) return Promise.resolve(null);

    return firstValueFrom(
      this.http.get<CurrentUserDto>(`${environment.API_URL}/auth/me`).pipe(
        tap((me) => {
          this.userId.set(me.id);
          this.roles.set(me.roles);
          this.permissions.set(me.permissions);
          this.branchIds.set(me.branchIds ?? []);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        })
      )
    );
  }

  /**
   * Realiza el proceso de inicio de sesión enviando las credenciales al backend y almacenando los tokens.
   * @param loginRequest Objeto con el nombre de usuario y contraseña.
   * @returns Observable con el flujo de autenticación y carga de perfil.
   */
  login(loginRequest: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.API_URL}/auth/login`, loginRequest).pipe(
      tap(response => {
        this.token.set(response.accessToken);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
      }),

      switchMap(() =>
        this.http.get<CurrentUserDto>(`${environment.API_URL}/auth/me`)
      ),

      tap(me => {
        this.userId.set(me.id);
        this.roles.set(me.roles);
        this.permissions.set(me.permissions);
        this.branchIds.set(me.branchIds ?? []);
      })
    );
  }

  /**
   * Cierra la sesión activa del usuario, limpia el almacenamiento local y redirige a la pantalla de login.
   */
  logout() {
    this.token.set(null);
    this.userId.set(null);
    this.roles.set([]);
    this.permissions.set([]);
    this.branchIds.set([]);

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    this.router.navigate(['/login']);
  }
}
