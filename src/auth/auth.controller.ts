import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/user/entity/user.entity';
import { AuthService } from './auth.service';
import { RequestPasswordResetDto } from './dto/request-reset-password.dto';
import { SignUpDto } from './dto/signUp.dto';
import { VerifyPasswordResetDto } from './dto/verify-password.dto';
import { BasicTokenGuard } from './guards/basic-token.guard';
import {
  AccessTokenGuard,
  RefreshTokenGuard,
} from './guards/bearer-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  registerUser(@Body() dto: SignUpDto): Promise<User> {
    return this.authService.registerUser(dto);
  }

  @Post('signin')
  @UseGuards(BasicTokenGuard)
  loginUser(
    @Headers('authorization') rawToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const token = this.authService.extractToken(rawToken, false);
    const credentials = this.authService.decodeBasicToken(token);

    return this.authService.login(credentials);
  }

  @Post('reissue/access')
  @UseGuards(RefreshTokenGuard)
  async reissueAccessToken(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractToken(rawToken, true);
    const newToken = await this.authService.reissueToken(token, false);

    return {
      accessToken: newToken,
    };
  }

  @Post('reissue/refresh')
  @UseGuards(RefreshTokenGuard)
  async reissueRefreshToken(@Headers('authorization') rawToken: string) {
    const token = this.authService.extractToken(rawToken, true);
    const newToken = await this.authService.reissueToken(token, true);

    return {
      refreshToken: newToken,
    };
  }

  @Post('logout')
  logoutUser(): { accessToken: string; refreshToken: string } {
    return this.authService.logoutUser();
  }

  @Get('isadmin')
  @UseGuards(AccessTokenGuard)
  checkAdmin(@Req() req): Promise<boolean> {
    return this.authService.checkAdmin(req.user.id);
  }

  /**
   * email
   */

  @Post('password-reset/request')
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto);
  }

  @Post('password-reset/verify')
  verifyPasswordReset(@Body() dto: VerifyPasswordResetDto) {
    return this.authService.verifyPasswordReset(dto);
  }
}
