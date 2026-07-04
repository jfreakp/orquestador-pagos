import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@orquestador/prisma';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const SESSION_DURATION_SECONDS = 8 * 60 * 60;

export interface AdminLoginResult {
  accessToken: string;
  expiresAt: Date;
  username: string;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async login(username: string, password: string): Promise<AdminLoginResult> {
    const admin = await this.prisma.admin.findUnique({ where: { username } });

    // Same generic error whether the user doesn't exist, is inactive, or the
    // password is wrong — never reveal which one to the caller.
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const secret = this.configService.get<string>('ADMIN_JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('ADMIN_JWT_SECRET not configured');
    }

    const accessToken = jwt.sign(
      { sub: admin.id, username: admin.username },
      secret,
      { algorithm: 'HS256', expiresIn: SESSION_DURATION_SECONDS },
    );

    return {
      accessToken,
      expiresAt: new Date(Date.now() + SESSION_DURATION_SECONDS * 1000),
      username: admin.username,
    };
  }
}
