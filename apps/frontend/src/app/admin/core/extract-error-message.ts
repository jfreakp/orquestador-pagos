import { HttpErrorResponse } from '@angular/common/http';

export function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { message?: string | string[] } | null;
    if (body?.message) {
      return Array.isArray(body.message)
        ? body.message.join(', ')
        : body.message;
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor';
    }
  }
  return 'Ocurrió un error inesperado';
}
