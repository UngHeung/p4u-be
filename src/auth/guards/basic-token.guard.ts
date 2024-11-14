import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '../auth.service';

const logger = new Logger();

@Injectable()
export class BasicTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const rawToken = request.headers['authorization'];

    if (!rawToken) {
      logger.warn('토큰이 존재하지 않습니다.');
      throw new UnauthorizedException('토큰이 존재하지 않습니다.');
    }

    const token = this.authService.extractToken(rawToken, false);
    const { account, password } = this.authService.decodeBasicToken(token);
    const user = await this.authService.authenticateAccountAndPassword({
      account,
      password,
    });

    request.user = user;

    logger.log('Guard - 토큰 확인이 완료되었습니다.');

    return true;
  }
}
