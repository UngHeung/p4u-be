import { IsString } from 'class-validator';
import { User } from '../entity/user.entity';

export class UpdateUserNameDto {
  @IsString()
  name: string;
}
