/**
 * Interfaz para la solicitud de registro o creación de un nuevo usuario.
 */
export interface CreateUserRequest {
  /**
   * Nombre completo o visible de la persona.
   */
  displayName: string;

  /**
   * Nombre de usuario para acceder al sistema.
   */
  userName: string;

  /**
   * Contraseña del usuario.
   */
  password: string;

  /**
   * URL de la foto de perfil (opcional).
   */
  photoUrl: string | null;

  /**
   * Correo electrónico personal o corporativo (opcional).
   */
  email: string | null;

  /**
   * Número de teléfono de contacto (opcional).
   */
  phoneNumber: string | null;

  /**
   * Arreglo de IDs de roles asignados.
   */
  roleIds: string[];

  /**
   * Arreglo de IDs de sedes asignadas.
   */
  branchIds: string[];
}
