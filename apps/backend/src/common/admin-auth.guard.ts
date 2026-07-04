import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

// Verifies the HS256 admin session JWT issued by POST /admin-auth/login
// (AdminAuthService). Stateless on purpose: signature + expiry is enough
// for this single-admin, short-lived (8h) session — no DB round trip per
// request.
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    const secret = this.configService.get<string>('ADMIN_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException();
    }

    try {
      jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }
}
