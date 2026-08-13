/**
 * Interfaz con los datos de respuesta recibidos tras una autenticación exitosa.
 */
export interface LoginResponse {
  /**
   * Tipo de token emitido (usualmente 'Bearer').
   */
  tokenType: string;

  /**
   * Token de acceso JWT para autorizar peticiones HTTP.
   */
  accessToken: string;

  /**
   * Tiempo de vigencia del token de acceso expresado en segundos.
   */
  expiresIn: number;

  /**
   * Token de refresco utilizado para renovar la sesión sin requerir credenciales.
   */
  refreshToken: string;
}
