import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AdminAuthService } from './admin-auth.service';

export const adminTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AdminAuthService);
  const router = inject(Router);
  const token = authService.accessToken();

  const isLoginRequest = req.url === '/api/admin-auth/login';
  const authorizedReq =
    token && req.url.startsWith('/api/') && !isLoginRequest
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !isLoginRequest
      ) {
        authService.logout();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    }),
  );
};
