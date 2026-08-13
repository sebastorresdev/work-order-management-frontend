import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblemDetails } from '../models/api-problem-details';

/**
 * Función de utilidad para parsear y extraer un mensaje de error legible a partir de una respuesta de error HTTP de la API.
 * @param err Objeto de error capturado.
 * @param defaultMessage Mensaje por defecto si no es posible extraer un detalle del servidor.
 * @returns Cadena con el mensaje de error parseado.
 */
export function parseApiErrorMessage(err: unknown, defaultMessage = 'Ocurrió un error inesperado.'): string {
  if (!(err instanceof HttpErrorResponse) || !err.error) {
    return defaultMessage;
  }

  const problemDetails = err.error as ApiProblemDetails;

  // 1. Extrae el primer error de validación
  if (problemDetails.errors && Object.keys(problemDetails.errors).length > 0) {
    const firstKey = Object.keys(problemDetails.errors)[0];
    const messages = problemDetails.errors[firstKey];
    if (messages && messages.length > 0) {
      return messages[0];
    }
  }

  // 2. Extrae el detalle general
  if (problemDetails.detail) {
    return problemDetails.detail;
  }

  return defaultMessage;
}
