import { DocumentType } from './document-type';

/**
 * Interfaz para la solicitud de actualización de un empleado existente.
 */
export interface UpdateEmployeeRequest {
  /**
   * Código de empleado.
   */
  code: string;

  /**
   * Nombres del empleado.
   */
  firstName: string;

  /**
   * Apellidos del empleado.
   */
  lastName: string;

  /**
   * Tipo de documento de identidad.
   */
  documentType: DocumentType;

  /**
   * Número de documento de identidad.
   */
  documentNumber: string;

  /**
   * Fecha de contratación en formato ISO 8601.
   */
  hireDate: string;

  /**
   * Correo electrónico opcional.
   */
  email?: string;

  /**
   * Teléfono de contacto opcional.
   */
  phone?: string;

  /**
   * Cargo o posición.
   */
  position?: string;

  /**
   * Departamento o área.
   */
  department?: string;

  /**
   * URL de la foto de perfil.
   */
  photoUrl?: string;
}
