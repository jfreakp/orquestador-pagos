import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

const STORAGE_KEY = 'orquestador_admin_session';

interface AdminSession {
  accessToken: string;
  expiresAt: string;
  username: string;
}

interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly session = signal<AdminSession | null>(loadSession());

  readonly username = computed(() => this.session()?.username ?? null);
  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly isAuthenticated = computed(() => {
    const current = this.session();
    return !!current && new Date(current.expiresAt).getTime() > Date.now();
  });

  login(username: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>('/api/admin-auth/login', { username, password })
      .pipe(
        tap((response) => this.setSession(response)),
        map(() => undefined),
      );
  }

  logout(): void {
    this.session.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  private setSession(session: AdminSession): void {
    this.session.set(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }
}

function loadSession(): AdminSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}
