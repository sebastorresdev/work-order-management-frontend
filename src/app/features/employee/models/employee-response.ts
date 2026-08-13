import { DocumentType } from './document-type';

/**
 * Interfaz que representa los datos de respuesta de un empleado.
 */
export interface EmployeeResponse {
  /**
   * Identificador único del empleado.
   */
  id: string;

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
   * Correo electrónico de contacto.
   */
  email?: string;

  /**
   * Teléfono de contacto.
   */
  phone?: string;

  /**
   * Cargo o puesto de trabajo.
   */
  position?: string;

  /**
   * Departamento o área.
   */
  department?: string;

  /**
   * URL de la fotografía de perfil.
   */
  photoUrl?: string;
}
