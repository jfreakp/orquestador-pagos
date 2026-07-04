import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AdminAuthGuard } from './admin-auth.guard';

const SECRET = 'test-secret';

function buildContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

function buildGuard(configuredSecret: string | undefined) {
  const configService = {
    get: jest.fn().mockReturnValue(configuredSecret),
  } as unknown as ConfigService;
  return new AdminAuthGuard(configService);
}

describe('AdminAuthGuard', () => {
  it('allows the request when the bearer token is a validly signed JWT', () => {
    const guard = buildGuard(SECRET);
    const token = jwt.sign({ sub: 1, username: 'admin' }, SECRET, {
      algorithm: 'HS256',
    });
    const context = buildContext({ authorization: `Bearer ${token}` });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects when the Authorization header is missing', () => {
    const guard = buildGuard(SECRET);
    const context = buildContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects when the token is signed with a different secret', () => {
    const guard = buildGuard(SECRET);
    const token = jwt.sign({ sub: 1, username: 'admin' }, 'wrong-secret', {
      algorithm: 'HS256',
    });
    const context = buildContext({ authorization: `Bearer ${token}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects an expired token', () => {
    const guard = buildGuard(SECRET);
    const token = jwt.sign({ sub: 1, username: 'admin' }, SECRET, {
      algorithm: 'HS256',
      expiresIn: -1,
    });
    const context = buildContext({ authorization: `Bearer ${token}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects everything when ADMIN_JWT_SECRET is not configured', () => {
    const guard = buildGuard(undefined);
    const token = jwt.sign({ sub: 1, username: 'admin' }, SECRET, {
      algorithm: 'HS256',
    });
    const context = buildContext({ authorization: `Bearer ${token}` });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
