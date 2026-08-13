/**
 * Interfaz para la eliminación masiva/en lote de usuarios.
 */
export interface DeleteUsersRequest {
  /**
   * Arreglo de IDs de usuarios a eliminar.
   */
  userIds: string[];
}
