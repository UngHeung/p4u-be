import { IsEmail, IsOptional, IsString } from 'class-validator';
import {
  emailValidationMessage,
  stringValidationMessage,
} from 'src/common/validation/message/type-validation.message';
import { User } from '../entity/user.entity';

export class UpdateUserDto implements Partial<User> {
  @IsString({ message: stringValidationMessage })
  @IsOptional()
  nickname?: string;

  @IsEmail({}, { message: emailValidationMessage })
  @IsOptional()
  email?: string;

  @IsString({ message: stringValidationMessage })
  @IsOptional()
  password?: string;
}
