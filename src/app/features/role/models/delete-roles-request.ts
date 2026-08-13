/**
 * Interfaz para la eliminación masiva/en lote de múltiples roles.
 */
export interface DeleteRolesRequest {
  /**
   * Arreglo de IDs de los roles a eliminar.
   */
  roleIds: string[];
}
