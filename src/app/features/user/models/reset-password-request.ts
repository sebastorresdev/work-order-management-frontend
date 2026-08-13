/**
 * Interfaz para la solicitud de cambio/restablecimiento de contraseña de un usuario.
 */
export interface ResetPasswordRequest {
  /**
   * Identificador del usuario.
   */
  userId: string;

  /**
   * Nueva contraseña ingresada.
   */
  NewPassword: string;

  /**
   * Confirmación de la nueva contraseña.
   */
  ConfirmNewPassword : string;
}
