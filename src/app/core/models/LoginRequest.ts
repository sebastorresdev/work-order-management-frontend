/**
 * Interfaz con el cuerpo del mensaje para la solicitud de inicio de sesión.
 */
export interface LoginRequest {
  /**
   * Nombre de usuario del usuario.
   */
  userName: string;

  /**
   * Contraseña en texto plano.
   */
  password: string;
}
