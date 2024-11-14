import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import { User } from 'src/user/entity/user.entity';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signUp.dto';
import { BasicTokenGuard } from './guards/basic-token.guard';
import { RefreshTokenGuard } from './guards/bearer-token.guard';

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
}
