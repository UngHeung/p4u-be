import { IsString } from 'class-validator';
import { User } from '../entity/user.entity';

export class UpdateUserPasswordDto implements Partial<User> {
  @IsString()
  password: string;

  @IsString()
  newPassword: string;
}
