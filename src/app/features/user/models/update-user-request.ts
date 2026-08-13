/**
 * Interfaz para la solicitud de actualización de los datos de un usuario existente.
 */
export interface UpdateUserRequest {
  /**
   * Identificador del usuario.
   */
  userId: string;

  /**
   * Nombre de usuario.
   */
  userName: string;

  /**
   * Correo electrónico.
   */
  email: string;

  /**
   * Estado activo/inactivo de la cuenta.
   */
  isActive: boolean;

  /**
   * Nombre de presentación.
   */
  displayName: string | null;

  /**
   * URL de la foto de perfil.
   */
  photoUrl: string | null;

  /**
   * Número telefónico.
   */
  phoneNumber: string | null;

  /**
   * Arreglo de IDs de sedes asignadas.
   */
  branchIds: string[];

  /**
   * Arreglo de IDs de roles asignados.
   */
  roleIds: string[];
}
