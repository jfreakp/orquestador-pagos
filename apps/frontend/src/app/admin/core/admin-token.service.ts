import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'orquestador_admin_api_token';

// TODO: reemplazar por el sistema de auth de administradores real (ver
// AdminAuthGuard en el backend). Mientras tanto, el token compartido se
// pide una vez y se guarda en localStorage para no repetirlo en cada request.
@Injectable({ providedIn: 'root' })
export class AdminTokenService {
  readonly token = signal<string>(localStorage.getItem(STORAGE_KEY) ?? '');

  setToken(value: string): void {
    this.token.set(value);
    localStorage.setItem(STORAGE_KEY, value);
  }
}
