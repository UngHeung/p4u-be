import { IsEmail } from 'class-validator';
import { User } from '../entity/user.entity';

export class UpdateUserEmailDto implements Partial<User> {
  @IsEmail()
  email: string;
}
