import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SentMessageInfo } from 'nodemailer';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
import { RequestEmailCodeDto } from './dto/request-email-code.dto';
import { UpdateUserEmailDto } from './dto/update-user-email.dto';
import { UpdateUserNicknameDto } from './dto/update-user-nickname.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('myinfo')
  @UseGuards(AccessTokenGuard)
  getUserById(@Req() req): Promise<User> {
    return this.userService.getUserById(req.user.id);
  }

  @Patch('update/password')
  @UseGuards(AccessTokenGuard)
  updatePassword(
    @Req() req,
    @Body() body: UpdateUserPasswordDto,
  ): Promise<User> {
    return this.userService.updatePassword(req.user, body);
  }

  @Patch('update/nickname')
  @UseGuards(AccessTokenGuard)
  updateNickname(
    @Req() req,
    @Body() body: UpdateUserNicknameDto,
  ): Promise<User> {
    return this.userService.updateNickname(req.user, body);
  }

  @Patch('update/email')
  @UseGuards(AccessTokenGuard)
  updateEmail(@Req() req, @Body() body: UpdateUserEmailDto): Promise<User> {
    return this.userService.updateEmail(req.user, body);
  }

  @Patch('activate')
  @UseGuards(AccessTokenGuard)
  toggleActivateUser(@Req() req): Promise<User> {
    return this.userService.toggleActivateUser(req.user.id);
  }

  @Patch('role')
  @UseGuards(AccessTokenGuard)
  toggleUserRole(@Req() req, @Query('id') id: number): Promise<User> {
    return this.userService.toggleUserRole(req.user, id);
  }

  @Patch('myrole')
  @UseGuards(AccessTokenGuard)
  toggleMyRole(@Req() req): Promise<User> {
    return this.userService.toggleUserRole(req.user, req.user.id);
  }

  @Delete('delete')
  @UseGuards(AccessTokenGuard)
  deleteUser(@Req() req): Promise<void> {
    return this.userService.deleteUser(req.user.id);
  }

  /**
   * email
   */

  @Post('request/email')
  @UseGuards(AccessTokenGuard)
  requestEmailVerificationCode(
    @Req() req,
    @Body() body: RequestEmailCodeDto,
  ): Promise<SentMessageInfo> {
    return this.userService.requestEmailVerificationCode(req.user.id, body);
  }

  @Post('verify/email')
  @UseGuards(AccessTokenGuard)
  verifyEmailCode(@Req() req, @Body() body: VerifyEmailDto): Promise<boolean> {
    return this.userService.verifyEmailCode(req.user, body);
  }
}
