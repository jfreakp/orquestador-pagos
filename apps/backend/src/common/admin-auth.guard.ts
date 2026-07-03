import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

// TODO: reemplazar por el sistema de auth de administradores real.
// Placeholder mínimo mientras tanto: compara un token compartido contra
// ADMIN_API_TOKEN, para no dejar los catálogos de administración abiertos.
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedToken = this.configService.get<string>('ADMIN_API_TOKEN');
    const providedToken = request.headers['x-admin-token'];

    if (!expectedToken || providedToken !== expectedToken) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
