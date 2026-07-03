import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientSystem, PrismaService } from '@orquestador/prisma';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface RequestWithClientSystem extends Request {
  clientSystem: ClientSystem;
}

@Injectable()
export class JwtClientSystemGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithClientSystem>();
    const token = this.extractToken(request);

    if (!token) {
      await this.registerAuthError('Missing bearer token');
      throw new UnauthorizedException();
    }

    const issuer = this.extractIssuer(token);
    if (!issuer) {
      await this.registerAuthError('JWT without a valid iss claim');
      throw new UnauthorizedException();
    }

    const clientSystem = await this.prisma.clientSystem.findFirst({
      where: { code: issuer, isActive: true },
    });

    if (!clientSystem) {
      await this.registerAuthError(
        `Unknown or inactive client system: ${issuer}`,
      );
      throw new UnauthorizedException();
    }

    try {
      jwt.verify(token, clientSystem.publicKey, { algorithms: ['RS256'] });
    } catch {
      await this.registerAuthError(
        `Invalid JWT signature for client system: ${issuer}`,
      );
      throw new UnauthorizedException();
    }

    request.clientSystem = clientSystem;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [scheme, token] = header.split(' ');
    return scheme === 'Bearer' && token ? token : null;
  }

  private extractIssuer(token: string): string | null {
    const decoded = jwt.decode(token);
    if (
      decoded &&
      typeof decoded === 'object' &&
      typeof decoded.iss === 'string'
    ) {
      return decoded.iss;
    }
    return null;
  }

  private async registerAuthError(message: string): Promise<void> {
    const authCategory = await this.prisma.errorCategory.findUnique({
      where: { code: 'AUTH' },
    });
    if (!authCategory) {
      return;
    }
    await this.prisma.transactionError.create({
      data: {
        transactionId: null,
        errorCategoryId: authCategory.id,
        message,
      },
    });
  }
}
