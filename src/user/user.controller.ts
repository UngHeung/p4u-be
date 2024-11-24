import {
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
}
