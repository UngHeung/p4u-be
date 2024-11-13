import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';

const logger = new Logger();

export interface TokenProps {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(dto: SignUpDto): Promise<User> {
    const password = await this.encodePassword(dto.password);

    const user = await this.userService.createUser({
      ...dto,
      password,
    });

    delete user.password;

    logger.log(`${user.id} - 가입이 완료되었습니다.`);

    return user;
  }

  async login(dto: SignInDto): Promise<TokenProps> {
    const user = await this.authenticateAccountAndPassword(dto);

    delete user.password;

    const token = {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };

    logger.log(`${user.id} - 로그인이 완료되었습니다.`);

    return token;
  }

  async authenticateAccountAndPassword(dto: SignInDto): Promise<User> {
    try {
      const user = await this.userService.getUserByAccount(dto.account);
      const isPassed = await bcrypt.compare(dto.password, user.password);

      if (!isPassed) throw new UnauthorizedException();

      return user;
    } catch (error) {
      if (error.status === 404) {
        throw new NotFoundException('유저가 존재하지 않습니다.');
      } else {
        logger.error('비밀번호를 확인해주세요.');
        throw new UnauthorizedException('비밀번호를 확인해주세요.');
      }
    }
  }

  logout(): TokenProps {
    const expired = {
      accessToken: this.removeToken(),
      refreshToken: this.removeToken(),
    };

    logger.log('로그아웃이 완료되었습니다.');

    return expired;
  }

  /**
   * Token
   */
  signToken(user: User, isRefreshToken: boolean): string {
    const payload = {
      sub: user.id,
      name: user.name,
      account: user.account,
      createdAt: user.createdAt,
      type: isRefreshToken ? 'refresh' : 'access',
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: isRefreshToken
        ? +process.env.JWT_ACCESS_EXPIRES_IN
        : +process.env.JWT_REFRESH_EXPIRES_IN,
    });

    logger.log('토큰 발급이 완료되었습니다.');

    return token;
  }

  decodeBasicToken(token: string): SignInDto {
    const decode = Buffer.from(token, 'base64').toString('utf-8');
    const split = decode.split(':');

    if (split.length !== 2) {
      logger.warn('잘못된 토큰입니다.');
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    const [account, password] = split;

    logger.log('아이디, 비밀번호 디코딩이 완료되었습니다.');

    return { account, password };
  }

  extractToken(headers: string, isBearer: boolean) {
    const split = headers.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (split.length !== 2 || split[0] !== prefix) {
      logger.warn('만료되었거나 잘못된 토큰입니다.');
      throw new UnauthorizedException('만료되었거나 잘못된 토큰입니다.');
    }

    const token = split[1];

    logger.log('토큰 추출이 완료되었습니다.');

    return token;
  }

  async verifyToken(token: string) {
    try {
      const verifyToken = await this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
        complete: true,
      });

      logger.log('토큰 확인이 완료되었습니다.');
      return verifyToken;
    } catch {
      logger.warn('만료되었거나 잘못된 토큰입니다.');
      throw new UnauthorizedException('만료되었거나 잘못된 토큰입니다.');
    }
  }

  removeToken() {
    const payload = {};
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: 0,
    });

    logger.log('토큰 삭제가 완료되었습니다.');

    return token;
  }

  /**
   * Password
   */
  async encodePassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();

    return await bcrypt.hash(password, salt);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    const getUser = await this.userService.getUserById(user.id);
    const isPassed = await bcrypt.compare(password, getUser.password);

    if (!isPassed) {
      logger.warn('비밀번호를 확인해주세요.');
      throw new UnauthorizedException('비밀번호를 확인해주세요.');
    }

    delete user.password;

    logger.log('비밀번호 확인이 완료되었습니다.');

    return isPassed;
  }
}
