import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminTokenService } from './admin-token.service';

export const adminTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(AdminTokenService);
  const token = tokenService.token();

  if (!token || !req.url.startsWith('/api/')) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { 'x-admin-token': token } }));
};
