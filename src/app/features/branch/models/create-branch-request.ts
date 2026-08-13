/**
 * Interfaz para la solicitud de creación de una sede.
 */
export interface CreateBranchRequest {
  /**
   * Código único asignado a la sede.
   */
  code: string;

  /**
   * Nombre de la sede.
   */
  name: string;

  /**
   * Dirección de la sede (opcional).
   */
  address?: string;
}
