/**
 * Estructura estándar RFC 7807 para detalles de problemas y errores retornados por la API.
 */
export interface ApiProblemDetails {
  /**
   * Código de estado HTTP o clave textual de estado.
   */
  status: string;

  /**
   * Título corto del error o problema.
   */
  title: string;

  /**
   * Descripción detallada del error.
   */
  detail: string;

  /**
   * Diccionario de errores específicos mapeados por nombre de propiedad.
   */
  errors?: Record<string, string[]>;
}
