import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { AuthService } from '../auth.service';

const logger = new Logger();

@Injectable()
export class BearerTokenGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawToken = request.headers['authorization'];

    if (!rawToken) {
      logger.warn('토큰이 존재하지 않습니다.');
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    }

    const token = this.authService.extractToken(rawToken, true);
    const result = await this.authService.verifyToken(token);
    const user = await this.userService.getUserById(result.payload.sub);

    delete user.password;

    request.user = user;
    request.token = token;
    request.tokenType = result.payload.type;

    logger.log('Guard - 토큰 확인이 완료되었습니다.');

    return true;
  }
}

@Injectable()
export class AccessTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest();

    if (request.tokenType !== 'access') {
      logger.warn('Access Token이 아닙니다.');
      throw new UnauthorizedException('Access Token이 아닙니다.');
    }

    return true;
  }
}

@Injectable()
export class RefreshTokenGuard extends BearerTokenGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context.switchToHttp().getRequest();

    if (request.tokenType !== 'refresh') {
      logger.warn('Refresh Token이 아닙니다.');
      throw new UnauthorizedException('Refresh Token이 아닙니다.');
    }

    return true;
  }
}
