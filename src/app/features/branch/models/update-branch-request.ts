/**
 * Interfaz para la solicitud de actualización de una sede existente.
 */
export interface UpdateBranchRequest {
  /**
   * Código de la sede.
   */
  code: string;

  /**
   * Nombre de la sede.
   */
  name: string;

  /**
   * Dirección física opcional.
   */
  address?: string;
}
