/**
 * DTO que representa la estructura de datos devuelta por el endpoint de consulta del usuario actual.
 */
export interface CurrentUserDto {
  /**
   * Identificador único del usuario.
   */
  id: string;

  /**
   * Lista de nombres de roles asociados al usuario.
   */
  roles: string[];

  /**
   * Lista de claves de permisos vigentes otorgados al usuario.
   */
  permissions: string[];

  /**
   * Lista de identificadores de las sedes asignadas al usuario.
   */
  branchIds: string[];
}
