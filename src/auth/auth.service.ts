import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/user/entity/user.entity';
import { UserService } from 'src/user/user.service';
import { SignInDto } from './dto/signIn.dto';
import { SignUpDto } from './dto/signUp.dto';

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

    return user;
  }

  async login(dto: SignInDto): Promise<TokenProps> {
    const user = await this.authenticateAccountAndPassword(dto);

    delete user.password;

    const token = {
      accessToken: this.signToken(user, false),
      refreshToken: this.signToken(user, true),
    };

    return token;
  }

  async authenticateAccountAndPassword(dto: SignInDto): Promise<User> {
    const user = await this.userService.getUserByAccount(dto.account);

    if (!user) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인해주세요.');
    }

    const isPassed = await bcrypt.compare(dto.password, user.password);

    if (!isPassed) {
      throw new UnauthorizedException('아이디 또는 비밀번호를 확인해주세요.');
    }

    return user;
  }

  logout(): TokenProps {
    const expired = {
      accessToken: this.removeToken(),
      refreshToken: this.removeToken(),
    };

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
    };

    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: isRefreshToken
        ? +process.env.JWT_ACCESS_EXPIRES_IN
        : +process.env.JWT_REFRESH_EXPIRES_IN,
    });

    return token;
  }

  decodeBasicToken(token: string): SignInDto {
    const decode = Buffer.from(token, 'base64').toString('utf-8');
    const split = decode.split(':');

    if (split.length !== 2) {
      throw new UnauthorizedException('잘못된 토큰입니다.');
    }

    const [account, password] = split;

    return { account, password };
  }

  extractToken(headers: string, isBearer: boolean) {
    const split = headers.split(' ');
    const prefix = isBearer ? 'Bearer' : 'Basic';

    if (split.length !== 2 || split[0] !== prefix) {
      throw new UnauthorizedException('만료되었거나 잘못된 토큰입니다.');
    }

    const token = split[1];

    return token;
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
        complete: true,
      });
    } catch {
      throw new UnauthorizedException('만료되었거나 잘못된 토큰입니다.');
    }
  }

  removeToken() {
    const payload = {};
    const token = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: 0,
    });

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
      throw new UnauthorizedException('비밀번호를 확인해주세요.');
    }

    delete user.password;

    return isPassed;
  }
}
