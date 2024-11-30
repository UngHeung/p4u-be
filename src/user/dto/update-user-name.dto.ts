import { IsString } from 'class-validator';
import { User } from '../entity/user.entity';

export class UpdateUserNameDto implements Partial<User> {
  @IsString()
  name: string;
}
