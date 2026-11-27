import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith(BEARER_PREFIX)) {
      throw new UnauthorizedException('Please log in');
    }
    const payload = await this.auth.verify(
      header.slice(BEARER_PREFIX.length),
      'access',
    );
    // Re-read the user so a deactivated account or changed role takes effect immediately.
    const user = await this.auth.findActiveUser(payload.sub);
    if (!user) throw new UnauthorizedException('Please log in again');
    request.user = { id: user.id, role: user.role };
    return true;
  }
}
