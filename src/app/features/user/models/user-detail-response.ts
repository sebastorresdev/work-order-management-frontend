/**
 * Interfaz con la información detallada de un usuario.
 */
export interface UserDetailResponse {
  /**
   * Identificador único del usuario.
   */
  id: string;

  /**
   * Nombre de presentación.
   */
  displayName: string;

  /**
   * Nombre de usuario.
   */
  userName: string;

  /**
   * URL de la foto de perfil.
   */
  photoUrl: string | null;

  /**
   * Número de teléfono.
   */
  phoneNumber: string | null;

  /**
   * Correo electrónico.
   */
  email: string | null;

  /**
   * Arreglo de IDs de sedes asignadas.
   */
  branchIds: string[];

  /**
   * Arreglo de IDs de roles asignados.
   */
  roleIds: string[];

  /**
   * Estado de la cuenta.
   */
  isActive: boolean;

  /**
   * Fecha de creación.
   */
  createdAt: string;

  /**
   * Fecha de última modificación.
   */
  LastModifiedAt: string;
}
