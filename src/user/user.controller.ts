import { Controller, Delete, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/guards/bearer-token.guard';
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

  @Patch('activate')
  @UseGuards(AccessTokenGuard)
  toggleActivateUser(@Req() req): Promise<User> {
    return this.userService.toggleActivateUser(req.user.id);
  }

  @Delete('delete')
  @UseGuards(AccessTokenGuard)
  deleteUser(@Req() req): Promise<void> {
    return this.userService.deleteUser(req.user.id);
  }
}
