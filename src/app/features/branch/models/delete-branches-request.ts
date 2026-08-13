/**
 * Interfaz para la solicitud de eliminación en lote de varias sedes.
 */
export interface DeleteBranchesRequest {
  /**
   * Arreglo de identificadores de las sedes a eliminar.
   */
  branchIds: string[];
}
