/**
 * Interfaz que representa los datos de respuesta de un rol.
 */
export interface RoleResponse {
  /**
   * Identificador único del rol.
   */
  id: string;

  /**
   * Nombre del rol.
   */
  name: string;

  /**
   * Descripción del rol o null si no se especificó.
   */
  description: string | null;

  /**
   * Fecha y hora de la última modificación en formato ISO.
   */
  lastModifiedAt?: string;
}
