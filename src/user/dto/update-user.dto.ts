import { IsEmail, IsOptional, IsString } from 'class-validator';
import { User } from '../entity/user.entity';
import {
  emailValidationMessage,
  stringValidationMessage,
} from 'src/common/validation/message/type-validation.message';

export class UpdateUserDto implements Partial<User> {
  @IsString({ message: stringValidationMessage })
  nickname: string;

  @IsEmail({}, { message: emailValidationMessage })
  @IsOptional()
  email?: string;
}
