/**
 * Interfaz que representa los datos de respuesta de una sede.
 */
export interface BranchResponse {
  /**
   * Identificador único de la sede.
   */
  id: string;

  /**
   * Código de la sede.
   */
  code: string;

  /**
   * Nombre comercial o descriptivo de la sede.
   */
  name: string;

  /**
   * Dirección física opcional de la sede.
   */
  address: string | null;
}
