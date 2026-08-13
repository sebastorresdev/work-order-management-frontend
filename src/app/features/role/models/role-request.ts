/**
 * Interfaz para la solicitud de creación o modificación de un rol.
 */
export interface RoleRequest {
  /**
   * Nombre único del rol.
   */
  name: string;

  /**
   * Descripción del propósito o responsabilidades del rol.
   */
  description?: string;
}
