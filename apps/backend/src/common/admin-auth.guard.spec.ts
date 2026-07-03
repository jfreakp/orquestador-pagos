import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminAuthGuard } from './admin-auth.guard';

function buildContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('AdminAuthGuard', () => {
  function buildGuard(configuredToken: string | undefined) {
    const configService = {
      get: jest.fn().mockReturnValue(configuredToken),
    } as unknown as ConfigService;
    return new AdminAuthGuard(configService);
  }

  it('allows the request when the header matches ADMIN_API_TOKEN', () => {
    const guard = buildGuard('super-secret');
    const context = buildContext({ 'x-admin-token': 'super-secret' });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects when the header is missing', () => {
    const guard = buildGuard('super-secret');
    const context = buildContext({});

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects when the header does not match', () => {
    const guard = buildGuard('super-secret');
    const context = buildContext({ 'x-admin-token': 'wrong' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects everything when ADMIN_API_TOKEN is not configured', () => {
    const guard = buildGuard(undefined);
    const context = buildContext({ 'x-admin-token': 'anything' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
