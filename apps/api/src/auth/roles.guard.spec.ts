import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function contextFor(user: unknown): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  beforeEach(() => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
  });

  it('allows an admin', () => {
    expect(guard.canActivate(contextFor({ id: '1', role: 'ADMIN' }))).toBe(
      true,
    );
  });

  it('blocks a customer', () => {
    expect(() =>
      guard.canActivate(contextFor({ id: '1', role: 'CUSTOMER' })),
    ).toThrow(ForbiddenException);
  });

  it('blocks a request with no user', () => {
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
