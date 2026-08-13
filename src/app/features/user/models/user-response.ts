/**
 * Interfaz que representa los datos resumidos de un usuario para listados.
 */
export interface UserResponse {
  /**
   * Identificador del usuario.
   */
  id: string;

  /**
   * Nombre de la sede principal asignada.
   */
  branchName: string;

  /**
   * Nombre de usuario.
   */
  userName: string;

  /**
   * URL de la foto de perfil.
   */
  photoUrl: string | null;

  /**
   * Correo electrónico.
   */
  email: string | null;

  /**
   * Lista de nombres de roles del usuario.
   */
  roleNames: string[];

  /**
   * Estado de activación de la cuenta.
   */
  isActive: boolean;

  /**
   * Fecha de la última modificación.
   */
  lastModifiedAt: string;
}
